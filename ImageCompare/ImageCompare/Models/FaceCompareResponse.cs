namespace ImageCompare.Models
{
    public class FaceCompareResponse : IResponseData
    {
        public float SimilarityScore { get; set; } // Điểm tương đồng (0 - 1)
        public bool IsSamePerson { get; set; }     // Kết luận: Cùng người hay không
        public string Note { get; set; }           // Ghi chú (Ví dụ: "Rất giống nhau")

    }
}
