import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export async function POST() {
  try {
    const cookieStore = cookies();
    const refreshToken = cookieStore.get('fs_refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          statusCode: 401,
          message: 'No refresh token available in cookie',
        },
        { status: 401 },
      );
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errRes = NextResponse.json(data, { status: response.status });
      errRes.cookies.delete('fs_refresh_token');
      errRes.cookies.delete('fs_session');
      return errRes;
    }

    const payloadData = data.data || data;
    const { refreshToken: newRefreshToken, accessToken, user } = payloadData || {};

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

    if (newRefreshToken) {
      res.cookies.set('fs_refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    res.cookies.set('fs_session', JSON.stringify(sessionData), {
      httpOnly: false,
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
        message: error.message || 'Token refresh failed',
      },
      { status: 500 },
    );
  }
}
