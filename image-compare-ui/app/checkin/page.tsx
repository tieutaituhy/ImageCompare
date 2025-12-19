'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getToken, type User } from '@/lib/auth';

interface VerificationResult {
    isSuccess: boolean;
    isMatch: boolean;
    similarityScore: number;
    message: string;
}

export default function CheckinPage() {
    const [user, setUser] = useState<User | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturing, setCapturing] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [error, setError] = useState('');


    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const router = useRouter();

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            router.push('/login');
            return;
        }
        if (!currentUser.isAvatar) {
            router.push('/upload-avatar');
            return;
        }
        setUser(currentUser);
    }, [router]);

    // Start camera
    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });

            setStream(mediaStream);
            setCapturing(true);
            setError('');
        } catch (err) {
            setError('Không thể truy cập camera. Vui lòng cấp quyền truy cập.');
            console.error('Camera error:', err);
        }
    };

    // Stop camera
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setCapturing(false);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    // Set video source when stream changes
    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            // Ensure video plays
            videoRef.current.play().catch(err => {
                console.error('Video play error:', err);
            });
        }
    }, [stream]);

    // Handle capture button click
    const handleCapture = () => {
        if (processing) return;
        captureAndVerify();
    };

    // Handle file upload (fallback for iOS/mobile)
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || processing) return;

        setProcessing(true);
        setError('');
        setResult(null);

        try {
            // Create form data with the uploaded file
            const formData = new FormData();
            formData.append('file', file);

            // Step 1: Get face embedding from CompreFace
            const recognizeResponse = await fetch('/api/face/recognize', {
                method: 'POST',
                body: formData,
            });

            const recognizeData = await recognizeResponse.json();

            if (!recognizeResponse.ok) {
                throw new Error(recognizeData.error || 'Face recognition failed');
            }

            if (!recognizeData.success || !recognizeData.embedding) {
                throw new Error('No face detected in image');
            }

            // Step 2: Verify face vector with backend
            const token = getToken();
            if (!token) {
                throw new Error('No authentication token');
            }

            const verifyResponse = await fetch('/api/face/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    vector: recognizeData.embedding,
                }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
                throw new Error(verifyData.error || 'Verification failed');
            }

            setResult(verifyData);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setProcessing(false);
            // Reset input
            e.target.value = '';
        }
    };

    // Capture frame and verify
    const captureAndVerify = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setProcessing(true);
        setError('');
        setResult(null);

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (!context) throw new Error('Cannot get canvas context');

            // Set canvas size to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw current video frame to canvas
            context.drawImage(video, 0, 0);

            // Convert canvas to blob
            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((b) => {
                    if (b) resolve(b);
                    else reject(new Error('Failed to create blob'));
                }, 'image/jpeg', 0.95);
            });

            // Step 1: Get face embedding from CompreFace
            const formData = new FormData();
            formData.append('file', blob, 'capture.jpg');

            const recognizeResponse = await fetch('/api/face/recognize', {
                method: 'POST',
                body: formData,
            });

            const recognizeData = await recognizeResponse.json();

            if (!recognizeResponse.ok) {
                throw new Error(recognizeData.error || 'Face recognition failed');
            }

            if (!recognizeData.success || !recognizeData.embedding) {
                throw new Error('No face detected in image');
            }

            // Step 2: Verify face vector with backend
            const token = getToken();
            if (!token) {
                throw new Error('No authentication token');
            }

            const verifyResponse = await fetch('/api/face/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    vector: recognizeData.embedding,
                }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
                throw new Error(verifyData.error || 'Verification failed');
            }

            setResult(verifyData);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setProcessing(false);
        }
    };

    const handleBack = () => {
        router.push('/');
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-8">
            {/* User Header */}
            {user && (
                <div className="w-full max-w-2xl mb-4 bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src={`https://localhost:44356${user.avatarUrl}`}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                            <p className="font-semibold text-gray-800">{user.username}</p>
                            <p className="text-xs text-gray-500">Check-in</p>
                        </div>
                    </div>
                    <button
                        onClick={handleBack}
                        className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                    >
                        ← Back
                    </button>
                </div>
            )}

            {/* Title */}
            <div className="text-center mb-6">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Face Check-in
                </h1>
                <p className="text-gray-600">
                    Xác thực khuôn mặt nhanh chóng với AI
                </p>
            </div>

            {/* Main Content */}
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
                {/* Video/Canvas Container */}
                <div className="relative mb-6 bg-gray-900 rounded-lg overflow-hidden aspect-video">
                    {capturing ? (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                            {processing && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                    <div className="text-white text-xl">
                                        <svg className="animate-spin h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Đang xử lý...
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div className={`mb-4 p-6 rounded-lg border-2 ${result.isMatch
                        ? 'bg-green-50 border-green-500'
                        : 'bg-red-50 border-red-500'
                        }`}>
                        <div className="text-center">
                            <div className="text-6xl mb-4">
                                {result.isMatch ? '✅' : '❌'}
                            </div>
                            <h3 className={`text-2xl font-bold mb-2 ${result.isMatch ? 'text-green-700' : 'text-red-700'
                                }`}>
                                {result.isMatch ? 'Xác thực thành công!' : 'Xác thực thất bại'}
                            </h3>
                            <p className="text-gray-700 mb-2">{result.message}</p>
                            {result.similarityScore !== undefined && (
                                <p className="text-sm text-gray-600">
                                    Độ giống: {(result.similarityScore * 100).toFixed(2)}%
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className="space-y-4">
                    <div className="flex gap-4">
                        {!capturing ? (
                            <button
                                onClick={startCamera}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-[1.02]"
                            >
                                Bật Camera
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleCapture}
                                    disabled={processing}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing ? 'Đang xử lý...' : 'Chụp và Check-in'}
                                </button>
                                <button
                                    onClick={stopCamera}
                                    disabled={processing}
                                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
                                >
                                    Tắt Camera
                                </button>
                            </>
                        )}
                    </div>

                    {/* File Upload Fallback for iOS/Mobile */}
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            capture="user"
                            onChange={handleFileUpload}
                            disabled={processing}
                            className="hidden"
                            id="photo-upload"
                        />
                        <label
                            htmlFor="photo-upload"
                            className={`block w-full text-center py-3 px-6 border-2 border-dashed border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all cursor-pointer ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            📸 Hoặc chọn ảnh từ thư viện
                        </label>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>Hướng dẫn:</strong>
                    </p>
                    <ol className="text-sm text-blue-700 mt-2 space-y-1 list-decimal list-inside">
                        <li>Bật camera và đảm bảo khuôn mặt của bạn nằm trong khung hình</li>
                        <li>Click nút "Chụp và Check-in"</li>
                        <li>Đợi hệ thống xử lý và xác thực</li>
                    </ol>
                    <p className="text-xs text-blue-600 mt-3">
                        💡 <strong>iOS/Mobile:</strong> Nếu camera không hoạt động, dùng nút "Chọn ảnh từ thư viện" để upload ảnh selfie
                    </p>
                </div>
            </div>
        </main>
    );
}
