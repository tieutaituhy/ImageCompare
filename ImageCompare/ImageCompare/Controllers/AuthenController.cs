using ImageCompare.Data;
using ImageCompare.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using static ImageCompare.Controllers.FaceVectorController;

namespace ImageCompare.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;

        public AuthController(AppDbContext context, IConfiguration configuration, IWebHostEnvironment environment)
        {
            _context = context;
            _configuration = configuration;
            _environment = environment;
        }

        // Request model
        public class LoginRequest
        {
            public string Username { get; set; }
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username))
                return BadRequest("Username không được để trống");

            // 1. Kiểm tra user trong DB
            var user = _context.Users.FirstOrDefault(u => u.Username == request.Username);

            // 2. Nếu chưa có thì tạo mới
            if (user == null)
            {
                user = new User
                {
                    Username = request.Username,
                    IsAvatar = false,
                };
                _context.Users.Add(user);
                _context.SaveChanges();
            }

            // 3. Sinh JWT Token
            var tokenString = GenerateJwtToken(user);

            return Ok(new
            {
                Id = user.Id,
                Username = user.Username,
                IsAvatar = user.IsAvatar,
                Token = tokenString
            });
        }

        private string GenerateJwtToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username)
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddDays(7),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        [HttpPost("upload-avatar")]
        [Authorize]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Vui lòng chọn file ảnh.");

            // 1. Lấy ID user từ Token hiện tại
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
                return Unauthorized("Không xác định được người dùng.");

            // 2. Tìm User trong DB
            var user = _context.Users.Find(userId);
            if (user == null)
                return NotFound("User không tồn tại.");

            try
            {
                // 3. Tạo đường dẫn lưu file: wwwroot/avatars/
                string uploadsFolder = Path.Combine(_environment.WebRootPath, "avatars");
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                // Đặt tên file duy nhất để tránh trùng lặp (vd: userId_timestamp.jpg)
                string uniqueFileName = $"{userId}_{DateTime.Now.Ticks}{Path.GetExtension(file.FileName)}";
                string filePath = Path.Combine(uploadsFolder, uniqueFileName);


                // 4. Cập nhật thông tin ảnh cho User
                // Đường dẫn tương đối để Client truy cập (vd: /avatars/1_123123.jpg)
                user.AvatarUrl = $"/avatars/{uniqueFileName}";
                user.IsAvatar = true;

                // 5. Chuyển ảnh thành Vector (Feature Extraction)
                // Đây là bước quan trọng để so sánh sau này
                var vector = await GenerateFaceVectorAsync(filePath);

                if (vector != null)
                {
                    user.FaceEmbeddings = vector;
                }
                else
                {
                    return BadRequest("Không tìm thấy khuôn mặt trong ảnh để tạo vector.");
                }

                // 6. Lưu file vào ổ cứng
                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(fileStream);
                }

                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Message = "Cập nhật ảnh đại diện thành công.",
                    AvatarUrl = user.AvatarUrl,
                    HasVector = user.FaceEmbeddings != null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi server: {ex.Message}");
            }
        }

        // Hàm giả lập/gọi service AI để lấy vector
        // Bạn cần thay thế logic bên trong bằng code gọi đến thư viện AI hoặc API (như CompreFace)
        private async Task<double[]> GenerateFaceVectorAsync(string imagePath)
        {
            try
            {
                string baseUrl = _configuration["ConvertVector:BaseUrl"]; // VD: http://localhost:8000
                string apiKey = _configuration["ConvertVector:ApiKey"];   // Key của dịch vụ Recognition

                // URL đầy đủ theo yêu cầu của bạn (bao gồm calculator để lấy vector)
                var requestUrl = $"{baseUrl}/api/v1/recognition/recognize?face_plugins=landmarks,gender,age,pose,calculator";

                using (var client = new HttpClient())
                {
                    // Thêm Header API Key
                    client.DefaultRequestHeaders.Add("x-api-key", apiKey);

                    using (var form = new MultipartFormDataContent())
                    {
                        // Đọc file ảnh từ đường dẫn đã lưu
                        using (var fileStream = new FileStream(imagePath, FileMode.Open, FileAccess.Read))
                        {
                            using (var streamContent = new StreamContent(fileStream))
                            {
                                // CompreFace yêu cầu form-data key là "file"
                                form.Add(streamContent, "file", Path.GetFileName(imagePath));

                                // Gọi API
                                var response = await client.PostAsync(requestUrl, form);

                                if (!response.IsSuccessStatusCode)
                                {
                                    // Log lỗi nếu cần
                                    var errorContent = await response.Content.ReadAsStringAsync();
                                    Console.WriteLine($"CompreFace Error: {errorContent}");
                                    return null;
                                }

                                // Đọc kết quả JSON
                                var jsonString = await response.Content.ReadAsStringAsync();

                                // Cấu hình để parse JSON không phân biệt hoa thường
                                var options = new JsonSerializerOptions
                                {
                                    PropertyNameCaseInsensitive = true
                                };

                                var compreFaceResponse = JsonSerializer.Deserialize<CompreFaceRecognitionResponse>(jsonString, options);

                                // Kiểm tra xem có tìm thấy khuôn mặt nào không
                                if (compreFaceResponse != null && compreFaceResponse.Result != null && compreFaceResponse.Result.Count > 0)
                                {
                                    // Lấy vector của khuôn mặt đầu tiên tìm thấy
                                    // Chuyển từ List<double> sang double[]
                                    return compreFaceResponse.Result[0].Embedding.ToArray();
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in GenerateFaceVectorAsync: {ex.Message}");
            }

            return null;
        }

        [HttpPost("update-avatar")]
        [Authorize] // Yêu cầu phải đăng nhập
        public async Task<IActionResult> UpdateAvatar(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Vui lòng chọn file ảnh mới.");

            // 1. Lấy ID user từ Token
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
                return Unauthorized("Không xác định được người dùng.");

            var user = _context.Users.Find(userId);
            if (user == null)
                return NotFound("User không tồn tại.");

            try
            {
                // 2. Chuẩn bị đường dẫn lưu ảnh mới
                string uploadsFolder = Path.Combine(_environment.WebRootPath, "avatars");
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                // Tạo tên file ngẫu nhiên để tránh trình duyệt cache ảnh cũ
                string uniqueFileName = $"{userId}_{DateTime.Now.Ticks}{Path.GetExtension(file.FileName)}";
                string newFilePath = Path.Combine(uploadsFolder, uniqueFileName);

                // 3. Gọi AI để lấy Vector từ ảnh MỚI vừa lưu
                var newVector = await GenerateFaceVectorAsync(newFilePath);

                if (newVector == null || newVector.Length == 0)
                {
                    return BadRequest("Ảnh mới không rõ khuôn mặt. Vui lòng chọn ảnh khác.");
                }

                // 4. Nếu AI ok -> Tiến hành xóa ảnh CŨ của user (dọn dẹp ổ cứng)
                if (!string.IsNullOrEmpty(user.AvatarUrl))
                {
                    // AvatarUrl lưu dạng "/avatars/abc.jpg", cần chuyển về đường dẫn vật lý
                    // TrimStart('/') để tránh lỗi đường dẫn
                    string oldFileName = user.AvatarUrl.TrimStart('/').Replace("avatars/", "");
                    string oldFilePath = Path.Combine(uploadsFolder, oldFileName);

                    if (System.IO.File.Exists(oldFilePath))
                    {
                        System.IO.File.Delete(oldFilePath);
                    }
                }

                // 5. Cập nhật thông tin vào Database
                user.AvatarUrl = $"/avatars/{uniqueFileName}";
                user.FaceEmbeddings = newVector; // Cập nhật vector mới
                user.IsAvatar = true;

                // 6. Lưu ảnh mới tạm thời vào ổ cứng
                using (var fileStream = new FileStream(newFilePath, FileMode.Create))
                {
                    await file.CopyToAsync(fileStream);
                }

                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    IsSuccess = true,
                    Message = "Cập nhật ảnh đại diện thành công.",
                    AvatarUrl = user.AvatarUrl
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi server: {ex.Message}");
            }
        }

        [HttpPost("verify-face-vector")]
        [Authorize] // Bắt buộc phải có Token
        public IActionResult VerifyFaceVector([FromBody] VerifyVectorRequest request)
        {
            if (request.Vector == null || request.Vector.Length == 0)
            {
                return BadRequest("Vui lòng truyền dữ liệu vector hợp lệ.");
            }

            // A. Lấy ID user từ Claims (trong Token)
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized("Token không hợp lệ hoặc không tìm thấy thông tin user.");
            }

            // B. Lấy thông tin User từ DB
            var user = _context.Users.Find(userId);
            if (user == null)
            {
                return NotFound("User không tồn tại.");
            }

            // C. Kiểm tra xem User đã có Vector mẫu (lúc đăng ký/upload avatar) chưa
            if (user.FaceEmbeddings == null || user.FaceEmbeddings.Length == 0)
            {
                return BadRequest("User này chưa thiết lập khuôn mặt đại diện (Avatar Face Data).");
            }

            // D. Kiểm tra kích thước vector có khớp nhau không
            // (CompreFace dùng InsightFace thường là 128 hoặc 512 chiều)
            if (request.Vector.Length != user.FaceEmbeddings.Length)
            {
                return BadRequest($"Kích thước vector không khớp. Server: {user.FaceEmbeddings.Length}, Client: {request.Vector.Length}");
            }

            // E. Tính toán độ tương đồng (Cosine Similarity)
            double similarity = CalculateCosineSimilarity(user.FaceEmbeddings, request.Vector);

            // F. Đánh giá kết quả
            // Ngưỡng (Threshold): Với ArcFace/InsightFace, > 0.8 thường là cùng 1 người.
            // Bạn có thể điều chỉnh số này tùy vào độ khắt khe mong muốn.
            bool isMatch = similarity >= 0.8;

            return Ok(new
            {
                IsSuccess = true,
                IsMatch = isMatch,
                SimilarityScore = similarity, // Trả về điểm số để Mobile hiển thị (0.0 -> 1.0)
                Message = isMatch ? "Xác thực khuôn mặt thành công." : "Khuôn mặt không khớp."
            });
        }

        // 3. Hàm tính toán toán học (Cosine Similarity)
        private double CalculateCosineSimilarity(double[] vectorA, double[] vectorB)
        {
            double dotProduct = 0.0;
            double normA = 0.0;
            double normB = 0.0;

            for (int i = 0; i < vectorA.Length; i++)
            {
                dotProduct += vectorA[i] * vectorB[i];
                normA += Math.Pow(vectorA[i], 2);
                normB += Math.Pow(vectorB[i], 2);
            }

            if (normA == 0 || normB == 0) return 0;

            return dotProduct / (Math.Sqrt(normA) * Math.Sqrt(normB));
        }

        public class VerifyVectorRequest
        {
            // Mảng double chứa giá trị vector (Mobile gửi lên)
            public double[] Vector { get; set; }
        }
    }
}