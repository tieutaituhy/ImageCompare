namespace ImageCompare.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsAvatar { get; set; } = false;
        public string AvatarUrl { get; set; } = string.Empty;
        public double[]? FaceEmbeddings { get; set; }
    }
}
