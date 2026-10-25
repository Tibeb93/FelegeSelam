import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export async function POST() {
  try {
    const cookieStore = cookies();
    const adminRefreshToken = cookieStore.get('fs_admin_refresh_token')?.value;
    const memberRefreshToken = cookieStore.get('fs_refresh_token')?.value;

    const isAdmin = Boolean(adminRefreshToken);
    const refreshToken = adminRefreshToken || memberRefreshToken;

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
      if (isAdmin) {
        errRes.cookies.delete('fs_admin_refresh_token');
        errRes.cookies.delete('fs_admin_session');
      } else {
        errRes.cookies.delete('fs_refresh_token');
        errRes.cookies.delete('fs_session');
      }
      return errRes;
    }

    const payloadData = data.data || data;
    const { refreshToken: newRefreshToken, accessToken, user } = payloadData || {};

    // Decode JWT payload from access token to extract user claims (role, sub, email)
    let decodedToken: any = null;
    if (accessToken && typeof accessToken === 'string') {
      try {
        const tokenParts = accessToken.split('.');
        if (tokenParts.length >= 2) {
          decodedToken = JSON.parse(
            Buffer.from(tokenParts[1], 'base64').toString('utf8'),
          );
        }
      } catch {
        decodedToken = null;
      }
    }

    // Read existing session cookie if present
    const existingSessionCookie = isAdmin
      ? cookieStore.get('fs_admin_session')?.value
      : cookieStore.get('fs_session')?.value;
    let existingSession: any = null;
    if (existingSessionCookie) {
      try {
        existingSession = JSON.parse(existingSessionCookie);
      } catch {
        existingSession = null;
      }
    }

    const finalRole =
      (typeof user?.role === 'string' ? user.role : user?.role?.name) ||
      decodedToken?.role ||
      existingSession?.role ||
      (isAdmin ? 'admin' : 'member');

    const finalUserId =
      user?.id || decodedToken?.sub || existingSession?.userId || '';
    const finalEmail =
      user?.email || decodedToken?.email || existingSession?.email || '';
    const finalPhone = user?.phone || existingSession?.phone || '';
    const finalStatus = user?.status || existingSession?.status || 'active';

    const sessionData = {
      userId: finalUserId,
      email: finalEmail,
      phone: finalPhone,
      role: finalRole,
      status: finalStatus,
    };

    const finalUser = user || {
      id: finalUserId,
      email: finalEmail,
      phone: finalPhone,
      role: { name: finalRole },
      status: finalStatus,
    };

    const res = NextResponse.json({
      success: true,
      statusCode: 200,
      message: data.message || 'Token refreshed successfully',
      data: {
        accessToken,
        user: finalUser,
      },
    });

    const refreshCookieName = isAdmin ? 'fs_admin_refresh_token' : 'fs_refresh_token';
    const sessionCookieName = isAdmin ? 'fs_admin_session' : 'fs_session';

    if (newRefreshToken) {
      res.cookies.set(refreshCookieName, newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    res.cookies.set(sessionCookieName, JSON.stringify(sessionData), {
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
