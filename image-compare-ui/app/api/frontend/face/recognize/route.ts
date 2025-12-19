import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // Get form data with image
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'File is required' },
                { status: 400 }
            );
        }

        // Create form data for CompreFace API
        const compreFaceFormData = new FormData();
        compreFaceFormData.append('file', file);

        // CompreFace API configuration
        const compreFaceUrl = process.env.NEXT_PUBLIC_COMPRACE_FACE_CORE || 'http://192.168.60.100:8000';
        const apiKey = process.env.NEXT_PUBLIC_COMPRACE_FACE_API_KEY || '4eb453f7-6443-4bd0-9034-93dfe004c651';

        // Call CompreFace API
        const response = await fetch(
            `${compreFaceUrl}/api/v1/recognition/recognize?face_plugins=calculator`,
            {
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                },
                body: compreFaceFormData,
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('CompreFace API error:', errorText);
            return NextResponse.json(
                { error: 'Face recognition failed', details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Check if face was detected
        if (!data.result || data.result.length === 0) {
            return NextResponse.json(
                { error: 'No face detected in image' },
                { status: 400 }
            );
        }

        // Extract embedding vector from first detected face
        const faceData = data.result[0];

        return NextResponse.json({
            success: true,
            embedding: faceData.embedding,
            box: faceData.box,
        });

    } catch (error) {
        console.error('Face recognition API error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
