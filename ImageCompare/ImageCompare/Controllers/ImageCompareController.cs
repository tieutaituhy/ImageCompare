using CoenM.ImageHash;
using CoenM.ImageHash.HashAlgorithms;
using Microsoft.AspNetCore.Mvc;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;

namespace ImageCompare.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class ImageCompareController : ControllerBase
    {
        // Sử dụng thuật toán AverageHash (cân bằng tốt tốc độ/chính xác)
        // Bạn có thể đổi sang DifferenceHash hoặc PerceptualHash nếu muốn độ chính xác khác
        private readonly IImageHash _hashAlgorithm = new AverageHash();

        [HttpPost("compare-similarity")]
        public async Task<IActionResult> CompareImages(IFormFile file1, IFormFile file2)
        {
            // 1. Validate Input
            if (file1 == null || file2 == null)
            {
                return BadRequest("Vui lòng upload đủ 2 ảnh.");
            }

            try
            {
                // 2. Load ảnh từ Stream (không cần lưu xuống ổ cứng)
                using var imageStream1 = file1.OpenReadStream();
                using var imageStream2 = file2.OpenReadStream();

                // Dùng ImageSharp để load ảnh vào bộ nhớ
                using var img1 = await Image.LoadAsync<Rgba32>(imageStream1);
                using var img2 = await Image.LoadAsync<Rgba32>(imageStream2);

                // 3. Tạo Hash cho từng ảnh
                var hash1 = _hashAlgorithm.Hash(img1);
                var hash2 = _hashAlgorithm.Hash(img2);

                // 4. So sánh 2 mã Hash
                // Hàm Similarity trả về % giống nhau (thang 0 - 100)
                double similarityPercentage = CompareHash.Similarity(hash1, hash2);

                // 5. Trả kết quả
                return Ok(new
                {
                    FileName1 = file1.FileName,
                    FileName2 = file2.FileName,
                    Similarity = Math.Round(similarityPercentage, 2), // Làm tròn 2 số thập phân
                    Message = GetSimilarityMessage(similarityPercentage)
                });
            }
            catch (Exception ex)
            {
                // Log lỗi ở đây (Serilog, etc.)
                return StatusCode(500, $"Lỗi xử lý ảnh: {ex.Message}");
            }
        }

        // Helper đánh giá mức độ giống nhau
        private string GetSimilarityMessage(double score)
        {
            if (score == 100) return "Hai ảnh hoàn toàn giống nhau";
            if (score >= 95) return "Hai ảnh gần như y hệt (có thể chỉ khác kích thước/nén)";
            if (score >= 80) return "Hai ảnh rất giống nhau (biến thể nhẹ)";
            if (score >= 50) return "Hai ảnh có nét tương đồng";
            return "Hai ảnh khác nhau";
        }
    }
}
