import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_URL}/auth/2fa/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    const { refreshToken, accessToken, user } = data.data || {};
    const cookieStore = cookies();

    if (refreshToken) {
      cookieStore.set('fs_refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    if (user) {
      const sessionData = {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role?.name || 'member',
        status: user.status,
      };

      cookieStore.set('fs_session', JSON.stringify(sessionData), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    return NextResponse.json({
      success: true,
      statusCode: 200,
      message: data.message,
      data: {
        accessToken,
        user,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        message: error.message || '2FA verification failed',
      },
      { status: 500 },
    );
  }
}
