import { NextRequest, NextResponse } from 'next/server';

// Bypass SSL verification for development
if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export async function POST(request: NextRequest) {
    try {
        // Get authorization token
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { isSuccess: false, message: 'No authorization token' },
                { status: 401 }
            );
        }

        // Get form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { isSuccess: false, message: 'No file provided' },
                { status: 400 }
            );
        }

        // Create form data for backend
        const backendFormData = new FormData();
        backendFormData.append('file', file);

        // Call backend API
        const backendUrl = process.env.NEXT_PUBLIC_COMPRACE_FACE_URL || 'http://192.168.60.100:5000';
        const response = await fetch(`${backendUrl}/api/Auth/update-avatar`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
            },
            body: backendFormData,
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { isSuccess: false, message: data.message || 'Update failed' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('Update avatar error:', error);
        return NextResponse.json(
            {
                isSuccess: false,
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
