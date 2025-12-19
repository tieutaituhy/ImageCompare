'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, type User } from '@/lib/auth';

interface VerificationResult {
    isSuccess: boolean;
    isMatch: boolean;
    similarityScore: number;
    message: string;
    processingTime?: number; // in milliseconds
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
        if (!file || processing || !user) return;

        setProcessing(true);
        setError('');
        setResult(null);
        const start = performance.now();

        try {
            // Download user's avatar
            const avatarUrl = `${process.env.NEXT_PUBLIC_COMPRACE_FACE_IMAGE || 'https://localhost:44356'}${user.avatarUrl}`;
            const avatarResponse = await fetch(avatarUrl);
            if (!avatarResponse.ok) {
                throw new Error('Failed to load avatar image');
            }
            const avatarBlob = await avatarResponse.blob();

            // Create form data with both images
            const formData = new FormData();
            formData.append('sourceImage', avatarBlob, 'avatar.jpg');
            formData.append('targetImage', file, 'capture.jpg');

            // Send to face verification API
            const verifyResponse = await fetch('/api/frontend/face/verify-faces', {
                method: 'POST',
                body: formData,
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
                throw new Error(verifyData.message || 'Verification failed');
            }

            if (!verifyData.isSuccess) {
                throw new Error(verifyData.message || 'Face verification failed');
            }

            // Map response to expected format
            const processingTime = performance.now() - start;
            setResult({
                isSuccess: verifyData.isSuccess,
                isMatch: verifyData.isMatch || false,
                similarityScore: verifyData.similarityScore || 0,
                message: verifyData.isMatch ? 'Check-in thành công!' : 'Khuôn mặt không khớp',
                processingTime
            });

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
        if (!videoRef.current || !canvasRef.current || !user) return;

        setProcessing(true);
        setError('');
        setResult(null);
        const start = performance.now();

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (!context) throw new Error('Cannot get canvas context');

            // Set canvas size to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Flip the image horizontally to correct orientation
            context.translate(canvas.width, 0);
            context.scale(-1, 1);

            // Draw current video frame to canvas (will be flipped back)
            context.drawImage(video, 0, 0);

            // Convert canvas to blob
            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((b) => {
                    if (b) resolve(b);
                    else reject(new Error('Failed to create blob'));
                }, 'image/jpeg', 0.95);
            });

            // Download user's avatar
            const avatarUrl = `${process.env.NEXT_PUBLIC_COMPRACE_FACE_IMAGE || 'https://localhost:44356'}${user.avatarUrl}`;
            const avatarResponse = await fetch(avatarUrl);
            if (!avatarResponse.ok) {
                throw new Error('Failed to load avatar image');
            }
            const avatarBlob = await avatarResponse.blob();

            // Create form data with both images
            const formData = new FormData();
            formData.append('sourceImage', avatarBlob, 'avatar.jpg');
            formData.append('targetImage', blob, 'capture.jpg');

            // Send to face verification API
            const verifyResponse = await fetch('/api/frontend/face/verify-faces', {
                method: 'POST',
                body: formData,
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
                throw new Error(verifyData.message || 'Verification failed');
            }

            if (!verifyData.isSuccess) {
                throw new Error(verifyData.message || 'Face verification failed');
            }

            // Map response to expected format
            const processingTime = performance.now() - start;
            setResult({
                isSuccess: verifyData.isSuccess,
                isMatch: verifyData.isMatch || false,
                similarityScore: verifyData.similarityScore || 0,
                message: verifyData.isMatch ? 'Check-in thành công!' : 'Khuôn mặt không khớp',
                processingTime
            });

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
        <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 md:p-8">
            {/* User Header */}
            {user && (
                <div className="w-full max-w-2xl mb-3 md:mb-4 bg-white rounded-xl shadow-lg p-3 md:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        <img
                            src={`${process.env.NEXT_PUBLIC_COMPRACE_FACE_IMAGE || 'https://localhost:44356'}/${user.avatarUrl}`}
                            alt="Avatar"
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover ring-2 ring-purple-200"
                        />
                        <div>
                            <p className="font-semibold text-gray-800 text-sm md:text-base">{user.username}</p>
                            <p className="text-xs text-gray-500">Check-in</p>
                        </div>
                    </div>
                    <button
                        onClick={handleBack}
                        className="px-3 md:px-4 py-2 bg-gray-500 text-white text-xs md:text-sm rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="hidden sm:inline">Back</span>
                    </button>
                </div>
            )}

            {/* Title */}
            <div className="text-center mb-4 md:mb-6">
                <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Face Check-in
                </h1>
                <p className="text-sm md:text-base text-gray-600">
                    Xác thực khuôn mặt nhanh chóng với AI
                </p>
            </div>

            {/* Main Content */}
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-4 md:p-8">
                {/* Video/Canvas Container */}
                <div className="relative mb-4 md:mb-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-inner">
                    <div className="aspect-[3/4] md:aspect-video min-h-[400px] md:min-h-0">
                        {capturing ? (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                    style={{ transform: 'scaleX(-1)' }}
                                />
                                {processing && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                                        <div className="text-white text-center">
                                            <svg className="animate-spin h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <p className="text-base md:text-xl font-medium">Đang xử lý...</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                <svg className="w-16 h-16 md:w-24 md:h-24 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <p className="text-sm text-gray-500">Camera chưa được bật</p>
                            </div>
                        )}
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                </div>

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

                {/* Result */}
                {result && (
                    <div className={`mb-4 md:mb-6 p-4 md:p-6 rounded-xl border-2 animate-in fade-in slide-in-from-bottom-4 duration-500 ${result.isMatch
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400'
                        : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-400'
                        }`}>
                        <div className="text-center">
                            <div className="text-5xl md:text-6xl mb-3 md:mb-4">
                                {result.isMatch ? '✅' : '❌'}
                            </div>
                            <h3 className={`text-xl md:text-2xl font-bold mb-2 ${result.isMatch ? 'text-green-700' : 'text-red-700'
                                }`}>
                                {result.isMatch ? 'Xác thực thành công!' : 'Xác thực thất bại'}
                            </h3>
                            <p className="text-sm md:text-base text-gray-700 mb-2">{result.message}</p>
                            {result.similarityScore !== undefined && (
                                <div className="mt-3">
                                    <p className="text-xs md:text-sm text-gray-600 mb-2">
                                        Độ tương đồng: <span className="font-bold text-gray-800">{(result.similarityScore * 100).toFixed(1)}%</span>
                                    </p>
                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${result.similarityScore > 0.7
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                                : 'bg-gradient-to-r from-orange-500 to-red-500'
                                                }`}
                                            style={{ width: `${Math.min(result.similarityScore * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                            {result.processingTime !== undefined && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-gray-600">
                                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Thời gian xử lý: <span className="font-bold text-gray-800">{result.processingTime.toFixed(0)}ms</span></span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className="space-y-3 md:space-y-4">
                    {!capturing ? (
                        <button
                            onClick={startCamera}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 md:py-4 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm md:text-base">Bật Camera</span>
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <button
                                onClick={handleCapture}
                                disabled={processing}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 md:py-4 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span className="text-sm md:text-base">Đang xử lý...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="text-sm md:text-base">Chụp và Check-in</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={stopCamera}
                                disabled={processing}
                                className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span className="text-sm md:text-base">Tắt Camera</span>
                            </button>
                        </div>
                    )}

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
                            className={`block w-full text-center py-3 md:py-4 px-6 border-2 border-dashed border-purple-300 text-gray-700 rounded-xl font-semibold hover:bg-purple-50 hover:border-purple-400 transition-all cursor-pointer ${processing ? 'opacity-50 cursor-not-allowed' : ''
                                } flex items-center justify-center gap-2`}
                        >
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm md:text-base">📸 Chọn ảnh từ thư viện</span>
                        </label>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <p className="text-xs md:text-sm text-blue-800 font-semibold mb-2">
                        💡 Hướng dẫn:
                    </p>
                    <ol className="text-xs md:text-sm text-blue-700 space-y-1 list-decimal list-inside">
                        <li>Bật camera và đảm bảo khuôn mặt trong khung</li>
                        <li>Click "Chụp và Check-in" để xác thực</li>
                        <li>Đợi hệ thống xử lý kết quả</li>
                    </ol>
                    <p className="text-xs text-blue-600 mt-2 pt-2 border-t border-blue-200">
                        <strong>Mobile/iOS:</strong> Nếu camera không hoạt động, chọn ảnh từ thư viện
                    </p>
                </div>
            </div>
        </main>
    );
}
