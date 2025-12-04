using ImageCompare.Models;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text.Json;

namespace ImageCompare.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class FaceVerificationController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public FaceVerificationController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        [HttpPost("verify")]
        public async Task<IActionResult> VerifyFace(IFormFile sourceImage, IFormFile targetImage)
        {
            var baseUrl = _configuration["CompreFace:BaseUrl"];
            var apiKey = _configuration["CompreFace:ApiKey"];

            if (string.IsNullOrEmpty(baseUrl) || string.IsNullOrEmpty(apiKey))
                return BadRequest("Chưa cấu hình CompreFace.");

            if (sourceImage == null || targetImage == null)
                return BadRequest("Vui lòng upload đủ 2 ảnh.");

            try
            {
                var client = _httpClientFactory.CreateClient();
                using var content = new MultipartFormDataContent();

                using var stream1 = sourceImage.OpenReadStream();
                using var stream2 = targetImage.OpenReadStream();

                // Add file content
                var fileContent1 = new StreamContent(stream1);
                fileContent1.Headers.ContentType = new MediaTypeHeaderValue(sourceImage.ContentType);
                content.Add(fileContent1, "source_image", sourceImage.FileName);

                var fileContent2 = new StreamContent(stream2);
                fileContent2.Headers.ContentType = new MediaTypeHeaderValue(targetImage.ContentType);
                content.Add(fileContent2, "target_image", targetImage.FileName);

                client.DefaultRequestHeaders.Add("x-api-key", apiKey);

                // 👇 URL có thể thêm plugins nếu bạn muốn lấy thêm thông tin (như bạn đã test)
                // var requestUrl = $"{baseUrl}/api/v1/verification/verify?face_plugins=age,gender,landmarks";
                // Hoặc để đơn giản thì gọi verify thường cũng được, cấu trúc JSON trả về vẫn là list face_matches
                var requestUrl = $"{baseUrl}/api/v1/verification/verify";

                var response = await client.PostAsync(requestUrl, content);
                var responseString = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                    return StatusCode((int)response.StatusCode, $"CompreFace Error: {responseString}");

                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var resultObj = JsonSerializer.Deserialize<CompreFaceVerificationResponse>(responseString, options);

                // Lấy kết quả đầu tiên
                var resultItem = resultObj?.Result?.FirstOrDefault();

                // 👇 Kiểm tra logic mới: Check list Face_matches
                if (resultItem == null || resultItem.Face_matches == null || resultItem.Face_matches.Count == 0)
                {
                    return Ok(new
                    {
                        IsSuccess = false,
                        Message = "Không tìm thấy khuôn mặt tương đồng trong ảnh thứ 2.",
                        SimilarityScore = 0
                    });
                }

                // Lấy match tốt nhất (thường là cái đầu tiên)
                var bestMatch = resultItem.Face_matches[0];

                return Ok(new
                {
                    IsSuccess = true,
                    SimilarityScore = bestMatch.Similarity,
                    IsMatch = bestMatch.Similarity >= 0.8, // Ngưỡng > 80% là cùng 1 người

                    // Trả thêm thông tin nếu có (do Model mới đã hứng được)
                    TargetGender = bestMatch.Gender?.Value,
                    TargetAge = bestMatch.Age != null ? $"{bestMatch.Age.Low}-{bestMatch.Age.High}" : "N/A",

                    RawResponse = resultObj
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal Error: {ex.Message}");
            }
        }
    }
}
