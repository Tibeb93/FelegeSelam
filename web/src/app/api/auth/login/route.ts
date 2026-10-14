import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_URL}/auth/login`, {
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

    const payloadData = data.data || data;

    // If 2FA is required, don't set permanent cookies yet
    if (payloadData?.requires2FA) {
      return NextResponse.json(data);
    }

    const { refreshToken, accessToken, user } = payloadData || {};

    const userRole =
      typeof user?.role === 'string'
        ? user.role
        : user?.role?.name || 'member';

    const sessionData = {
      userId: user?.id,
      email: user?.email,
      phone: user?.phone,
      role: userRole,
      status: user?.status,
    };

    const res = NextResponse.json({
      success: true,
      statusCode: 200,
      message: data.message,
      data: {
        accessToken,
        user: {
          ...user,
          role: typeof user?.role === 'string' ? { name: user.role } : user?.role,
        },
      },
    });

    if (refreshToken) {
      res.cookies.set('fs_refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    res.cookies.set('fs_session', JSON.stringify(sessionData), {
      httpOnly: false, // Accessible by middleware & client
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        message: error.message || 'Failed to connect to authentication service',
      },
      { status: 500 },
    );
  }
}
