import FaceVerification from "@/components/FaceVerification";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Demo Face Recognition System
      </h1>
      
      {/* Thay đổi: 
          - Giảm max-w-7xl xuống max-w-xl để khung hình gọn gàng hơn khi chỉ có 1 cột.
          - Bỏ grid layout, chỉ dùng flex column đơn giản.
      */}
      <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden min-h-[600px]">
        <div className="flex flex-col h-full">
          <div className="p-4 bg-green-50 border-b font-semibold text-center text-green-800">
            CompreFace (Docker)
          </div>
          {/* Component xử lý logic CompreFace */}
          <FaceVerification />
        </div>
      </div>
    </main>
  );
}