import { NextRequest, NextResponse } from 'next/server';

// Bypass SSL verification cho self-signed certificates trong development
if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export async function POST(request: NextRequest) {
    try {
        // Get token from Authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);

        // Get form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'File is required' },
                { status: 400 }
            );
        }

        // Create form data for backend API
        const backendFormData = new FormData();
        backendFormData.append('file', file);

        // Call backend API
        const url = process.env.NEXT_PUBLIC_COMPRACE_FACE_URL || 'https://localhost:44356/api';
        const backendUrl = `${url}/Auth/upload-avatar`;

        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: backendFormData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Backend API error:', errorText);
            return NextResponse.json(
                { error: 'Upload failed', details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Return response: { message, avatarUrl, hasVector }
        return NextResponse.json(data);

    } catch (error) {
        console.error('Upload avatar API error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
