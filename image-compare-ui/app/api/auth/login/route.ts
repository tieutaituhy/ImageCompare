import { NextRequest, NextResponse } from 'next/server';

// Bypass SSL verification cho self-signed certificates trong development
// CẢNH BÁO: Chỉ dùng trong development, KHÔNG dùng trong production!
if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username } = body;

        if (!username) {
            return NextResponse.json(
                { error: 'Username is required' },
                { status: 400 }
            );
        }

        // Gọi backend API
        const url = process.env.NEXT_PUBLIC_COMPRACE_FACE_URL || 'https://localhost:44356/api';
        const backendUrl = `${url}/Auth/login`;

        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Backend API error:', errorText);
            return NextResponse.json(
                { error: 'Login failed', details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Return dữ liệu từ backend: { id, username, isAvatar, token }
        return NextResponse.json(data);

    } catch (error) {
        console.error('Login API error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
