namespace ImageCompare.Models
{
    public interface IResponse<T> where T : IResponseData
    {
        int Code { get; set; }

        string Message { get; set; }

        T Data { get; set; }
    }
}
