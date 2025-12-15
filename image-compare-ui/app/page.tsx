import GeneralCompare from "@/components/GeneralCompare";
import FaceVerification from "@/components/FaceVerification"; // Component cũ (CompreFace)
import ViewFaceVerification from "@/components/ViewFaceVerification"; // Component mới (Native .NET)

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Demo Face Recognition System
      </h1>
      
      <div className="w-full max-w-7xl bg-white rounded-xl shadow-2xl overflow-hidden min-h-[600px]">
        {/* Chia layout thành grid để so sánh */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 h-full divide-x divide-gray-200">
          
          {/* Cột 1: So sánh Hash (Pixel) */}
          <div className="flex flex-col">
             <div className="p-4 bg-gray-50 border-b font-semibold text-center text-gray-700">Cách 1: Hash Ảnh (Cũ)</div>
             <GeneralCompare />
          </div>

          {/* Cột 2: CompreFace (Docker) */}
          <div className="flex flex-col">
             <div className="p-4 bg-green-50 border-b font-semibold text-center text-green-800">Cách 3: CompreFace (Docker)</div>
             <FaceVerification />
          </div>

        </div>
      </div>
    </main>
  );
}