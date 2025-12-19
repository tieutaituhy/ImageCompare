'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, clearAuthData, type User } from '@/lib/auth';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    // Check if user has avatar, if not redirect to upload page
    if (!currentUser.isAvatar) {
      router.push('/upload-avatar');
      return;
    }
    setUser(currentUser);
  }, [router]);

  const handleLogout = () => {
    clearAuthData();
    router.push('/login');
  };

  const handleGoToDemo = () => {
    router.push('/demo');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 p-8">
      {/* User Info Header */}
      {user && (
        <div className="w-full max-w-4xl mb-8 bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user.isAvatar ? (
              <img
                src={`${process.env.NEXT_PUBLIC_COMPRACE_FACE_IMAGE || 'https://localhost:44356'}/${user.avatarUrl}`}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-800">{user.username}</p>
              <p className="text-xs text-gray-500">ID: {user.id}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Logout
          </button>
        </div>
      )}

      {/* Welcome Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Image Compare System
        </h1>
        <p className="text-xl text-gray-600">
          Welcome back, <span className="font-semibold text-purple-600">{user?.username}</span>!
        </p>
      </div>

      {/* Feature Cards */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Face Check-in */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-shadow">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Face Check-in
          </h2>
          <p className="text-gray-600 mb-6">
            Xác thực khuôn mặt với camera và AI. Chớp mắt để check-in nhanh chóng và an toàn hoặc tải ảnh để check-in.
          </p>
          <button
            onClick={() => router.push('/checkin')}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Start Check-in →
          </button>
        </div>

        {/* Face Recognition Demo */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-shadow">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Face Recognition Demo
          </h2>
          <p className="text-gray-600 mb-6">
            Test our AI-powered face recognition system using CompreFace. Compare faces, detect age and gender.
          </p>
          <button
            onClick={handleGoToDemo}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Start Demo →
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>Lab by Trong - CompreFace Integration</p>
      </div>
    </main>
  );
}