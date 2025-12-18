'use client';

import { useState, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getToken, updateAvatarInfo } from '@/lib/auth';

export default function UploadAvatarPage() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [username, setUsername] = useState('');
    const router = useRouter();

    useEffect(() => {
        const user = getCurrentUser();
        if (!user) {
            router.push('/login');
            return;
        }
        setUsername(user.username);
    }, [router]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validate file type
        if (!selectedFile.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        setFile(selectedFile);
        setError('');

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError('');

        try {
            const token = getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Create form data
            const formData = new FormData();
            formData.append('file', file);

            // Call BFF API
            const response = await fetch('/api/auth/upload-avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            // Update avatar info in localStorage
            updateAvatarInfo(data.avatarUrl);

            // After successful upload, redirect to home
            router.push('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSkip = () => {
        // Don't allow skip - user must upload avatar
        setError('Please upload your avatar to continue');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        Upload Your Avatar
                    </h1>
                    <p className="text-gray-600">
                        Hi <span className="font-semibold text-purple-600">{username}</span>!
                        Please upload your profile picture
                    </p>
                </div>

                {/* Upload Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    {/* Preview Area */}
                    <div className="mb-6">
                        {preview ? (
                            <div className="relative w-full aspect-video bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                                <img
                                    src={preview}
                                    alt="Avatar preview"
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                        ) : (
                            <div className="w-full aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                                <svg
                                    className="w-16 h-16 text-gray-400 mb-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                <p className="text-gray-500">No image selected</p>
                            </div>
                        )}
                    </div>

                    {/* File Input */}
                    <div className="mb-4">
                        <label
                            htmlFor="avatar-upload"
                            className="block w-full"
                        >
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                disabled={uploading}
                            />
                            <div className="w-full px-4 py-3 border-2 border-gray-300 border-dashed rounded-lg text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all">
                                <span className="text-gray-600">
                                    Click to select an image, or drag and drop
                                </span>
                            </div>
                        </label>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {uploading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Uploading...
                                </span>
                            ) : (
                                'Upload Avatar'
                            )}
                        </button>
                    </div>
                </div>

                {/* Info */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    Avatar is required to access the application
                </p>
            </div>
        </div>
    );
}
