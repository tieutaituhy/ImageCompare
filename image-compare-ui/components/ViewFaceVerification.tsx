"use client";
import { useState, useEffect } from "react";

// 1. Interface khớp với dữ liệu bên trong object "data" của API
interface VerificationData {
  similarityScore: number; // API trả về tên này
  isSamePerson: boolean;   // API trả về tên này
  note: string;            // API trả về tên này
}

// 2. Interface khớp với cấu trúc phản hồi tổng thể (BaseResponse)
interface APIResponse {
  code: number;
  message: string;
  data: VerificationData;
}

export default function ViewFaceVerification() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  
  // State preview ảnh
  const [preview1, setPreview1] = useState<string | null>(null);
  const [preview2, setPreview2] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  // Lưu ý: State này chỉ lưu phần "data" bên trong
  const [result, setResult] = useState<VerificationData | null>(null); 
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Xử lý khi chọn file
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setFile: React.Dispatch<React.SetStateAction<File | null>>, 
    setPreview: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setResult(null); // Reset kết quả cũ
      setErrorMsg(null);
    }
  };

  // Cleanup URL preview để tránh leak memory
  useEffect(() => {
    return () => {
      if (preview1) URL.revokeObjectURL(preview1);
      if (preview2) URL.revokeObjectURL(preview2);
    };
  }, [preview1, preview2]);

  const handleVerify = async () => {
    if (!file1 || !file2) return alert("Vui lòng chọn đủ 2 ảnh");
    setLoading(true);
    setResult(null);
    setErrorMsg(null);

    const formData = new FormData();
    // QUAN TRỌNG: Key này phải khớp với property trong class C# (Image1, Image2)
    formData.append("Image1", file1);
    formData.append("Image2", file2);

    const COMPRACE_FACE_URL = process.env.NEXT_PUBLIC_COMPRACE_FACE_URL;

    try {
      // Hãy thay đổi PORT (7250 hoặc 44356) cho đúng với server đang chạy của bạn
      const res = await fetch(`${COMPRACE_FACE_URL}/FaceCompare/Compare`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
         const errorText = await res.text();
         throw new Error(errorText || "Lỗi kết nối server");
      }

      // 1. Đọc dữ liệu JSON thô
      const jsonResponse: APIResponse = await res.json();

      // 2. Kiểm tra Code nghiệp vụ (0 là thành công)
      if (jsonResponse.code !== 0) {
        throw new Error(jsonResponse.message || "Lỗi xử lý từ server");
      }

      // 3. Lưu phần 'data' vào state (để hiển thị similarityScore)
      setResult(jsonResponse.data);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Lỗi không xác định";
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 h-full bg-white overflow-y-auto border-l border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-blue-600">🧠 Native AI (.NET ViewFaceCore)</h2>
      <p className="text-sm text-gray-500 mb-4">
        Sử dụng API nội bộ (Localhost). Model SeetaFace6/ArcFace.
      </p>

      <div className="space-y-6">
        {/* Input Ảnh 1 */}
        <div>
          <label className="block text-sm font-medium mb-1">Ảnh Gốc (Image 1)</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => handleFileChange(e, setFile1, setPreview1)} 
            className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50" 
          />
           {preview1 && (
            <div className="mt-2 relative h-48 w-full border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
               <img src={preview1} alt="Source Preview" className="w-full h-full object-contain" />
            </div>
          )}
        </div>

        {/* Input Ảnh 2 */}
        <div>
          <label className="block text-sm font-medium mb-1">Ảnh So Sánh (Image 2)</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => handleFileChange(e, setFile2, setPreview2)} 
            className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50" 
          />
          {preview2 && (
            <div className="mt-2 relative h-48 w-full border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
               <img src={preview2} alt="Target Preview" className="w-full h-full object-contain" />
            </div>
          )}
        </div>

        {/* Nút bấm */}
        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors shadow-md"
        >
          {loading ? "Đang xử lý..." : "So sánh Khuôn mặt"}
        </button>

        {/* Hiển thị lỗi */}
        {errorMsg && (
             <div className="mt-4 p-3 bg-red-100 text-red-700 rounded border border-red-200 text-sm">
                ❌ {errorMsg}
             </div>
        )}

        {/* Hiển thị kết quả */}
        {result && (
          <div className={`mt-4 p-4 rounded shadow border ${result.isSamePerson ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className="text-center">
                <p className="text-lg mb-2">
                    {result.isSamePerson 
                        ? <span className="text-green-600 font-bold text-xl">✅ CÙNG MỘT NGƯỜI</span> 
                        : <span className="text-red-600 font-bold text-xl">❌ KHÁC NGƯỜI</span>
                    }
                </p>
                
                <div className="text-sm text-gray-600 space-y-1">
                    {/* Sửa lại tên biến để khớp với API: similarityScore */}
                    <p>Độ chính xác (Score): <span className="font-mono font-bold text-gray-800">{result.similarityScore.toFixed(4)}</span></p>
                    
                    {/* Thanh phần trăm trực quan */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 dark:bg-gray-700">
                        <div 
                            className={`h-2.5 rounded-full ${result.similarityScore > 0.62 ? 'bg-green-600' : 'bg-orange-500'}`} 
                            style={{ width: `${Math.min(result.similarityScore * 100, 100)}%` }}>
                        </div>
                    </div>
                    
                    {/* Hiển thị ghi chú từ server (note) */}
                    <p className="mt-2 italic">"{result.note}"</p>
                </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
}