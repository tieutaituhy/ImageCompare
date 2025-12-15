// components/GeneralCompare.js
"use client";
import { useState, useEffect } from "react";

// Nếu bạn dùng TypeScript, giữ lại interface này
interface CompareResult {
  similarity: number;
  message: string;
}

export default function GeneralCompare() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  
  // State để lưu URL hiển thị ảnh
  const [preview1, setPreview1] = useState<string | null>(null);
  const [preview2, setPreview2] = useState<string | null>(null);

  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Hàm xử lý chọn ảnh chung để code gọn hơn
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      // Tạo URL tạm thời để hiển thị
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  };

  // Cleanup URL khi component unmount để tránh leak memory
  useEffect(() => {
    return () => {
      if (preview1) URL.revokeObjectURL(preview1);
      if (preview2) URL.revokeObjectURL(preview2);
    };
  }, [preview1, preview2]);

  const handleCompare = async () => {
    if (!file1 || !file2) return alert("Vui lòng chọn đủ 2 ảnh");
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file1", file1);
    formData.append("file2", file2);

    try {
      const res = await fetch("https://facelab.histaff.vn/api/FaceVerification/VerifyFace/verify", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      if (error instanceof Error) {
        alert("Lỗi gọi API: " + error.message);
      } else {
        alert("Lỗi gọi API: " + String(error));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border-r border-gray-300 h-full bg-gray-50 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 text-blue-600">🔍 So sánh Ảnh (pHash)</h2>
      <p className="text-sm text-gray-500 mb-4">Dùng thuật toán băm ảnh. Tốt cho so sánh ảnh trùng lặp.</p>
      
      <div className="space-y-6">
        {/* Ảnh 1 */}
        <div>
          <label className="block text-sm font-medium mb-1">Ảnh 1 (Gốc)</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => handleFileChange(e, setFile1, setPreview1)} 
            className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white" 
          />
          {/* Khu vực Preview Ảnh 1 */}
          {preview1 && (
            <div className="mt-2 relative h-48 w-full border border-gray-200 rounded-lg overflow-hidden">
               <img src={preview1} alt="Preview 1" className="w-full h-full object-contain bg-gray-100" />
            </div>
          )}
        </div>

        {/* Ảnh 2 */}
        <div>
          <label className="block text-sm font-medium mb-1">Ảnh 2 (So sánh)</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => handleFileChange(e, setFile2, setPreview2)} 
            className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white" 
          />
           {/* Khu vực Preview Ảnh 2 */}
           {preview2 && (
            <div className="mt-2 relative h-48 w-full border border-gray-200 rounded-lg overflow-hidden">
               <img src={preview2} alt="Preview 2" className="w-full h-full object-contain bg-gray-100" />
            </div>
          )}
        </div>

        <button
          onClick={handleCompare}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors"
        >
          {loading ? "Đang xử lý..." : "So sánh ngay"}
        </button>

        {result && (
          <div className="mt-4 p-4 bg-white rounded shadow border border-blue-100">
            <p><strong>Độ giống nhau:</strong> <span className="text-2xl font-bold text-blue-600">{result.similarity}%</span></p>
            <p className="text-sm mt-2 text-gray-600">{result.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}