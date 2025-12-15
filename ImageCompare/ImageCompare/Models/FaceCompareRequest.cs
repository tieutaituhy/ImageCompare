namespace ImageCompare.Models
{
    public class FaceCompareRequest
    {
        public IFormFile? Image1 { get; set; }
        public IFormFile? Image2 { get; set; }
    }
}
