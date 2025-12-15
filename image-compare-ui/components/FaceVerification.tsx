// components/FaceVerification.js
"use client";
import { useState, useEffect } from "react";

interface VerificationResult {
  isSuccess: boolean;
  isMatch?: boolean;
  message?: string;
  similarityScore?: number;
  targetAge?: number;
  targetGender?: string;
}

export default function FaceVerification() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  
  // State preview
  const [preview1, setPreview1] = useState<string | null>(null);
  const [preview2, setPreview2] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>, setPreview: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  };

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

    const formData = new FormData();
    formData.append("sourceImage", file1);
    formData.append("targetImage", file2);

    const COMPRACE_FACE_URL = process.env.NEXT_PUBLIC_COMPRACE_FACE_URL;

    try {
      const res = await fetch(`${COMPRACE_FACE_URL}/FaceVerification/VerifyFace/verify`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Lỗi không xác định";
      alert("Lỗi gọi API: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 h-full bg-white overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 text-green-600">🤖 Nhận diện AI (CompreFace)</h2>
      <p className="text-sm text-gray-500 mb-4">Dùng AI (MobileFaceNet). Nhận diện chính xác khuôn mặt, tuổi, giới tính.</p>

      <div className="space-y-6">
        {/* Ảnh Source */}
        <div>
          <label className="block text-sm font-medium mb-1">Ảnh Source (Mẫu)</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => handleFileChange(e, setFile1, setPreview1)} 
            className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50" 
          />
           {/* Preview Source */}
           {preview1 && (
            <div className="mt-2 relative h-48 w-full border border-gray-200 rounded-lg overflow-hidden">
               <img src={preview1} alt="Source Preview" className="w-full h-full object-contain bg-gray-100" />
            </div>
          )}
        </div>

        {/* Ảnh Target */}
        <div>
          <label className="block text-sm font-medium mb-1">Ảnh Target (Camera)</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => handleFileChange(e, setFile2, setPreview2)} 
            className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50" 
          />
          {/* Preview Target */}
          {preview2 && (
            <div className="mt-2 relative h-48 w-full border border-gray-200 rounded-lg overflow-hidden">
               <img src={preview2} alt="Target Preview" className="w-full h-full object-contain bg-gray-100" />
            </div>
          )}
        </div>

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors"
        >
          {loading ? "Đang AI xử lý..." : "Kiểm tra khuôn mặt"}
        </button>

        {result && (
          <div className={`mt-4 p-4 rounded shadow border ${result.isSuccess ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            {!result.isSuccess ? (
               <p className="text-red-600 font-bold">{result.message || "Lỗi xử lý"}</p>
            ) : (
              <>
                <p><strong>Kết quả:</strong> <span className={result.isMatch ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  {result.isMatch ? "✅ CÙNG MỘT NGƯỜI" : "❌ KHÁC NGƯỜI"}
                </span></p>
                {result.similarityScore !== undefined && <p className="mt-1"><strong>Điểm giống:</strong> {(result.similarityScore * 100).toFixed(2)}%</p>}
                
                {result.targetAge && <p className="text-sm text-gray-600 mt-2">Tuổi dự đoán: {result.targetAge}</p>}
                {result.targetGender && <p className="text-sm text-gray-600">Giới tính: {result.targetGender}</p>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}