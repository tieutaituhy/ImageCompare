'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FaceVerification from "@/components/FaceVerification";
import { getCurrentUser, clearAuthData, type User } from '@/lib/auth';

export default function DemoPage() {
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

    const handleBack = () => {
        router.push('/');
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8">
            {/* User Info Header */}
            {user && (
                <div className="w-full max-w-xl mb-4 bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {user.isAvatar ? (
                            <img
                                src={`https://localhost:44356${user.avatarUrl}`}
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
                    <div className="flex gap-2">
                        <button
                            onClick={handleBack}
                            className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                            ← Back
                        </button>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            )}

            <h1 className="text-3xl font-bold mb-8 text-gray-800">
                Demo Face Recognition System
            </h1>

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
