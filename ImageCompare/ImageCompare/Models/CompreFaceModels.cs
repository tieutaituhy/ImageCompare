using System.Text.Json.Serialization;

namespace ImageCompare.Models
{
    public class CompreFaceVerificationResponse
    {
        public List<CompreFaceResult> Result { get; set; }
    }

    public class CompreFaceResult
    {
        public FaceInfo Source_image_face { get; set; }

        [JsonPropertyName("face_matches")]
        public List<FaceMatchInfo> Face_matches { get; set; }
    }

    public class FaceInfo
    {
        public AgeInfo Age { get; set; }
        public GenderInfo Gender { get; set; }
        public PoseInfo Pose { get; set; }
        public BoxGeometry Box { get; set; }

        public List<List<int>> Landmarks { get; set; }
    }

    public class FaceMatchInfo : FaceInfo
    {
        public double Similarity { get; set; }
    }

    // Các class con chi tiết
    public class BoxGeometry
    {
        public double Probability { get; set; }
        public int X_max { get; set; }
        public int Y_max { get; set; }
        public int X_min { get; set; }
        public int Y_min { get; set; }
    }

    public class AgeInfo
    {
        public double Probability { get; set; }
        public int High { get; set; }
        public int Low { get; set; }
    }

    public class GenderInfo
    {
        public double Probability { get; set; }
        public string Value { get; set; }
    }

    public class PoseInfo
    {
        public double Pitch { get; set; }
        public double Roll { get; set; }
        public double Yaw { get; set; }
    }
}
