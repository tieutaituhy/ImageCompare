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

        // Get vector from request body
        const body = await request.json();
        const { vector } = body;

        if (!vector || !Array.isArray(vector)) {
            return NextResponse.json(
                { error: 'Vector is required and must be an array' },
                { status: 400 }
            );
        }

        // Call backend API
        const url = process.env.NEXT_PUBLIC_COMPRACE_FACE_URL || 'https://localhost:44356/api';
        const backendUrl = `${url}/Auth/verify-face-vector`;

        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ vector }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Backend API error:', errorText);
            return NextResponse.json(
                { error: 'Face verification failed', details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Return verification result
        return NextResponse.json(data);

    } catch (error) {
        console.error('Face verification API error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
