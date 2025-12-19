'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, updateAvatarInfo, getToken, clearAuthData, type User } from '@/lib/auth';

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            router.push('/login');
            return;
        }
        setUser(currentUser);
    }, [router]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError('');
            setMessage('');

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file || !user) {
            setError('Vui lòng chọn ảnh');
            return;
        }

        setUploading(true);
        setError('');
        setMessage('');
        const start = performance.now();

        try {
            const formData = new FormData();
            formData.append('file', file);

            const token = getToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            // Call update avatar API through BFF
            const response = await fetch('/api/frontend/auth/update-avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Upload failed');
            }

            if (!data.isSuccess) {
                throw new Error(data.message || 'Upload failed');
            }

            const processingTime = performance.now() - start;

            // Update user in localStorage
            updateAvatarInfo(data.avatarUrl);
            const updatedUser = {
                ...user,
                avatarUrl: data.avatarUrl,
                isAvatar: true
            };
            setUser(updatedUser);

            setMessage(`${data.message} (${processingTime.toFixed(0)}ms)`);

            // Clear preview after 2 seconds and refresh
            setTimeout(() => {
                setFile(null);
                setPreview('');
            }, 2000);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = () => {
        clearAuthData();
        router.push('/login');
    };

    const handleBack = () => {
        router.push('/');
    };

    if (!user) {
        return null;
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-8">
            {/* Header */}
            <div className="w-full max-w-2xl mb-4 md:mb-6">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="font-medium">Quay lại</span>
                </button>
            </div>

            {/* Title */}
            <div className="text-center mb-6 md:mb-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Thông tin cá nhân
                </h1>
                <p className="text-sm md:text-base text-gray-600">
                    Quản lý avatar và thông tin của bạn
                </p>
            </div>

            {/* Profile Card */}
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 md:p-8">
                {/* Current Avatar */}
                <div className="flex flex-col items-center mb-6 md:mb-8">
                    <div className="relative mb-4">
                        <img
                            src={preview || `${process.env.NEXT_PUBLIC_COMPRACE_FACE_IMAGE || 'https://localhost:44356'}${user.avatarUrl}`}
                            alt="Avatar"
                            className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover ring-4 ring-indigo-200 shadow-lg"
                        />
                        {uploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                                <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        )}
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">{user.username}</h2>
                    <p className="text-sm text-gray-500">ID: {user.id}</p>
                </div>

                {/* Success Message */}
                {message && (
                    <div className="mb-4 bg-green-50 border-l-4 border-green-500 px-4 py-3 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-green-700 font-medium flex-1">{message}</p>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-500 px-4 py-3 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-red-700 font-medium flex-1">{error}</p>
                        </div>
                    </div>
                )}

                {/* Upload Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Cập nhật Avatar</h3>

                    {/* File Input */}
                    <div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={uploading}
                            className="hidden"
                            id="avatar-upload"
                        />
                        <label
                            htmlFor="avatar-upload"
                            className={`block w-full text-center py-4 px-6 border-2 border-dashed border-indigo-300 text-gray-700 rounded-xl font-semibold hover:bg-indigo-50 hover:border-indigo-400 transition-all cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''
                                } flex items-center justify-center gap-2`}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{file ? file.name : '📷 Chọn ảnh mới'}</span>
                        </label>
                    </div>

                    {/* Upload Button */}
                    {file && (
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 md:py-4 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Đang cập nhật...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    <span>Cập nhật Avatar</span>
                                </>
                            )}
                        </button>
                    )}

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full px-6 py-3 border-2 border-red-300 text-red-600 rounded-xl font-semibold hover:bg-red-50 hover:border-red-400 transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Đăng xuất</span>
                    </button>
                </div>

                {/* Instructions */}
                <div className="mt-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                    <p className="text-xs md:text-sm text-indigo-800 font-semibold mb-2">
                        💡 Lưu ý:
                    </p>
                    <ul className="text-xs md:text-sm text-indigo-700 space-y-1 list-disc list-inside">
                        <li>Chọn ảnh có khuôn mặt rõ ràng</li>
                        <li>Ảnh không bị mờ hoặc tối</li>
                        <li>Avatar mới sẽ được dùng cho check-in</li>
                    </ul>
                </div>
            </div>
        </main>
    );
}
