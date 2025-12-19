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
  const [preview1, setPreview1] = useState<string | null>(null);
  const [preview2, setPreview2] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setResult(null);
      setError(null);
    }
  };

  useEffect(() => {
    return () => {
      if (preview1) URL.revokeObjectURL(preview1);
      if (preview2) URL.revokeObjectURL(preview2);
    };
  }, [preview1, preview2]);

  const handleVerify = async () => {
    if (!file1 || !file2) {
      setError("Vui lòng chọn đủ 2 ảnh để tiếp tục");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append("sourceImage", file1, "source_image.jpg");
    formData.append("targetImage", file2, "target_image.jpg");

    try {
      const res = await fetch("/api/face/verify-faces", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Face verification failed");
      }

      setResult(data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi không xác định";
      setError("Lỗi gọi API: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 h-full bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              AI Face Verification
            </h2>
            <p className="text-sm text-gray-600">CompreFace • MobileFaceNet</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          Xác thực khuôn mặt bằng AI, phát hiện độ tương đồng, tuổi và giới tính với độ chính xác cao
        </p>
      </div>

      <div className="space-y-6">
        {/* Images Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Source Image Card */}
          <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="text-lg">📷</span>
                Ảnh Gốc
              </label>
              {file1 && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">
                  ✓ Đã chọn
                </span>
              )}
            </div>

            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, setFile1, setPreview1)}
                className="hidden"
                id="file1-input"
              />
              <label
                htmlFor="file1-input"
                className="block w-full cursor-pointer"
              >
                {preview1 ? (
                  <div className="h-64 w-full border-2 border-green-300 rounded-xl overflow-hidden bg-white">
                    <img
                      src={preview1}
                      alt="Source Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-64 w-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-green-400 hover:bg-green-50 transition-all bg-gray-50">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">Click để chọn ảnh</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG lên đến 10MB</p>
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Target Image Card */}
          <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="text-lg">📸</span>
                Ảnh So Sánh
              </label>
              {file2 && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">
                  ✓ Đã chọn
                </span>
              )}
            </div>

            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, setFile2, setPreview2)}
                className="hidden"
                id="file2-input"
              />
              <label
                htmlFor="file2-input"
                className="block w-full cursor-pointer"
              >
                {preview2 ? (
                  <div className="h-64 w-full border-2 border-green-300 rounded-xl overflow-hidden bg-white">
                    <img
                      src={preview2}
                      alt="Target Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-64 w-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-green-400 hover:bg-green-50 transition-all bg-gray-50">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">Click để chọn ảnh</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG lên đến 10MB</p>
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={loading || !file1 || !file2}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Đang AI xử lý...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Xác thực khuôn mặt</span>
            </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Result Card */}
        {result && (
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!result.isSuccess ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">❌</span>
                </div>
                <p className="text-red-600 font-bold text-lg">
                  {result.message || "Lỗi xử lý"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Main Result */}
                <div className="text-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.isMatch
                    ? "bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-200"
                    : "bg-gradient-to-br from-red-400 to-rose-500 shadow-lg shadow-red-200"
                    }`}>
                    <span className="text-4xl">{result.isMatch ? "✓" : "✗"}</span>
                  </div>
                  <h3 className={`text-2xl font-bold mb-2 ${result.isMatch ? "text-green-600" : "text-red-600"
                    }`}>
                    {result.isMatch ? "CÙNG MỘT NGƯỜI" : "KHÁC NGƯỜI"}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {result.isMatch
                      ? "Khuôn mặt khớp với độ tin cậy cao"
                      : "Khuôn mặt không khớp"}
                  </p>
                </div>

                {/* Similarity Score */}
                {result.similarityScore !== undefined && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700">Độ tương đồng</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {(result.similarityScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${result.similarityScore > 0.7
                          ? "bg-gradient-to-r from-green-500 to-emerald-500"
                          : "bg-gradient-to-r from-orange-500 to-red-500"
                          }`}
                        style={{ width: `${Math.min(result.similarityScore * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                {(result.targetAge || result.targetGender) && (
                  <div className="grid grid-cols-2 gap-4">
                    {result.targetAge && (
                      <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                        <div className="text-3xl mb-2">👤</div>
                        <p className="text-xs text-blue-600 font-medium mb-1">Tuổi dự đoán</p>
                        <p className="text-2xl font-bold text-blue-700">{result.targetAge}</p>
                      </div>
                    )}
                    {result.targetGender && (
                      <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
                        <div className="text-3xl mb-2">{result.targetGender === "Male" ? "👨" : "👩"}</div>
                        <p className="text-xs text-purple-600 font-medium mb-1">Giới tính</p>
                        <p className="text-2xl font-bold text-purple-700">
                          {result.targetGender === "Male" ? "Nam" : "Nữ"}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
