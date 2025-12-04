import GeneralCompare from "@/components/GeneralCompare";
import FaceVerification from "@/components/FaceVerification";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Hệ thống So sánh Ảnh & Nhận diện Khuôn mặt
      </h1>
      
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-2xl overflow-hidden min-h-[600px]">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full">
          {/* Cột Trái: So sánh Hash */}
          <GeneralCompare />
          
          {/* Cột Phải: Nhận diện AI */}
          <FaceVerification />
        </div>
      </div>
    </main>
  );
}