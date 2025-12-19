import { NextRequest, NextResponse } from 'next/server';

// Bypass SSL verification cho self-signed certificates trong development
if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export async function POST(request: NextRequest) {
    try {
        // Get form data with images
        const formData = await request.formData();
        const sourceImage = formData.get('sourceImage') as File;
        const targetImage = formData.get('targetImage') as File;

        if (!sourceImage || !targetImage) {
            return NextResponse.json(
                {
                    isSuccess: false,
                    message: 'Both sourceImage and targetImage are required'
                },
                { status: 400 }
            );
        }

        // Create form data for CompreFace API
        const compreFaceFormData = new FormData();
        compreFaceFormData.append('sourceImage', sourceImage);
        compreFaceFormData.append('targetImage', targetImage);

        // CompreFace API configuration
        const compreFaceUrl = process.env.NEXT_PUBLIC_COMPRACE_FACE_URL || 'https://192.168.60.100:7250';

        // Call CompreFace API
        const response = await fetch(
            `${compreFaceUrl}/FaceVerification/VerifyFace/verify`,
            {
                method: 'POST',
                body: compreFaceFormData,
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('CompreFace API error:', errorText);
            return NextResponse.json(
                {
                    isSuccess: false,
                    message: 'Face verification failed: ' + errorText
                },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Return the complete response from CompreFace
        return NextResponse.json(data);

    } catch (error) {
        console.error('Face verification API error:', error);
        return NextResponse.json(
            {
                isSuccess: false,
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
