using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ImageCompare.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class FaceVectorController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env; // Để lấy đường dẫn file

        public FaceVectorController(IHttpClientFactory httpClientFactory, IConfiguration configuration, IWebHostEnvironment env)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _env = env;
        }

        [HttpPost("verify-with-stored-vector")]
        public async Task<IActionResult> VerifyWithFile(IFormFile sourceImage)
        {
            // 1. Cấu hình CompreFace
            // LƯU Ý: Đây nên là API Key của RECOGNITION Service (để lấy embedding dễ dàng hơn)
            var baseUrl = _configuration["ConvertVector:BaseUrl"];
            var apiKey = _configuration["ConvertVector:ApiKey"];

            if (sourceImage == null) return BadRequest("Vui lòng upload ảnh.");

            try
            {
                // 2. Đọc Vector đã lưu từ file txt
                // Giả sử file vector.txt nằm trong thư mục gốc hoặc wwwroot, nội dung là chuỗi JSON mảng: [0.123, -0.456, ...]
                var filePath = Path.Combine(_env.ContentRootPath, "vector.txt");
                if (!System.IO.File.Exists(filePath))
                    return BadRequest("File vector mẫu (vector.txt) không tồn tại.");

                var vectorString = await System.IO.File.ReadAllTextAsync(filePath);

                // Parse chuỗi string trong file thành List<double>
                var storedVector = JsonSerializer.Deserialize<List<double>>(vectorString);

                if (storedVector == null || storedVector.Count == 0)
                    return BadRequest("File vector mẫu bị rỗng hoặc sai định dạng.");

                // 3. Gửi ảnh lên CompreFace để lấy Vector mới
                var client = _httpClientFactory.CreateClient();
                using var content = new MultipartFormDataContent();
                using var stream = sourceImage.OpenReadStream();

                var fileContent = new StreamContent(stream);
                var extension = Path.GetExtension(sourceImage.FileName);
                if (string.IsNullOrEmpty(extension))
                    extension = sourceImage.ContentType.Contains("png") ? ".png" : ".jpg";

                var validFileName = $"upload_image{extension}";
                content.Add(fileContent, "file", validFileName);

                //fileContent.Headers.ContentType = new MediaTypeHeaderValue(sourceImage.ContentType);
                //content.Add(fileContent, "file", sourceImage.FileName); // Param tên là 'file' cho Recognition endpoint

                client.DefaultRequestHeaders.Add("x-api-key", apiKey);

                var requestUrl = $"{baseUrl}/api/v1/recognition/recognize?face_plugins=landmarks,gender,age,pose,calculator";

                var response = await client.PostAsync(requestUrl, content);
                var responseString = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                    return StatusCode((int)response.StatusCode, $"CompreFace Error: {responseString}");

                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var resultObj = JsonSerializer.Deserialize<CompreFaceRecognitionResponse>(responseString, options);
                var resultItem = resultObj?.Result?.FirstOrDefault();

                if (resultItem == null || resultItem.Embedding == null)
                    return Ok(new { IsSuccess = false, Message = "Không nhận diện được khuôn mặt hoặc không lấy được vector." });

                // 4. So sánh 2 Vector (Stored vs New)
                var newVector = resultItem.Embedding;

                // Kiểm tra kích thước vector (CompreFace thường dùng FaceNet là 128 hoặc 512 chiều)
                if (newVector.Count != storedVector.Count)
                    return BadRequest($"Kích thước vector không khớp. Stored: {storedVector.Count}, New: {newVector.Count}");

                double similarity = VectorUtils.CalculateCosineSimilarity(storedVector, newVector);

                // 5. Trả về kết quả
                // Ngưỡng Cosine Similarity thường > 0.8 hoặc > 0.9 tùy vào model (ArcFace hay FaceNet)
                // Bạn cần test thực tế để chọn ngưỡng phù hợp. Ví dụ này để 0.8
                bool isMatch = similarity >= 0.8;

                return Ok(new
                {
                    IsSuccess = true,
                    SimilarityScore = similarity,
                    IsMatch = isMatch,
                    Message = isMatch ? "Xác thực thành công" : "Khuôn mặt không khớp",
                    DebugInfo = $"Vector Dim: {newVector.Count}"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal Error: {ex.Message}");
            }
        }

        // 1. Class bao bọc ngoài cùng (Root)
        public class CompreFaceRecognitionResponse
        {
            [JsonPropertyName("result")]
            public List<CompreFaceResultItem> Result { get; set; }
        }

        // 2. Class chi tiết từng khuôn mặt tìm thấy
        public class CompreFaceResultItem
        {
            // 👇 QUAN TRỌNG: Mapping chính xác với field "embedding" trong JSON
            [JsonPropertyName("embedding")]
            public List<double> Embedding { get; set; }

            [JsonPropertyName("age")]
            public AgeInfo Age { get; set; }

            [JsonPropertyName("gender")]
            public GenderInfo Gender { get; set; }

            [JsonPropertyName("box")]
            public BoxInfo Box { get; set; }
        }

        // 3. Các class phụ trợ (nếu bạn muốn lấy thêm thông tin)
        public class AgeInfo
        {
            [JsonPropertyName("probability")]
            public double Probability { get; set; }

            [JsonPropertyName("high")]
            public int High { get; set; }

            [JsonPropertyName("low")]
            public int Low { get; set; }
        }

        public class GenderInfo
        {
            [JsonPropertyName("probability")]
            public double Probability { get; set; }

            [JsonPropertyName("value")]
            public string Value { get; set; } // "male" hoặc "female"
        }

        public class BoxInfo
        {
            [JsonPropertyName("probability")]
            public double Probability { get; set; }

            [JsonPropertyName("x_min")]
            public int XMin { get; set; }

            [JsonPropertyName("y_min")]
            public int YMin { get; set; }

            [JsonPropertyName("x_max")]
            public int XMax { get; set; }

            [JsonPropertyName("y_max")]
            public int YMax { get; set; }
        }

        public static class VectorUtils
        {
            // Hàm tính Cosine Similarity (trả về từ -1 đến 1, càng gần 1 càng giống nhau)
            public static double CalculateCosineSimilarity(List<double> vectorA, List<double> vectorB)
            {
                if (vectorA == null || vectorB == null || vectorA.Count != vectorB.Count)
                    throw new ArgumentException("Vectors must be not null and of the same length.");

                double dotProduct = 0.0;
                double normA = 0.0;
                double normB = 0.0;

                for (int i = 0; i < vectorA.Count; i++)
                {
                    dotProduct += vectorA[i] * vectorB[i];
                    normA += Math.Pow(vectorA[i], 2);
                    normB += Math.Pow(vectorB[i], 2);
                }

                if (normA == 0 || normB == 0) return 0;

                return dotProduct / (Math.Sqrt(normA) * Math.Sqrt(normB));
            }
        }
    }
}
