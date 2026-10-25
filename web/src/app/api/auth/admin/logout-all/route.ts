import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const forwardedFor = request.headers.get('x-forwarded-for') || '';
    const cookieStore = cookies();

    if (authHeader) {
      try {
        await fetch(`${API_URL}/auth/admin/logout-all`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
            ...(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {}),
          },
        });
      } catch {
        // Continue clearing cookies even if remote call errors
      }
    }

    cookieStore.delete('fs_admin_refresh_token');
    cookieStore.delete('fs_admin_session');

    return NextResponse.json({
      success: true,
      statusCode: 200,
      message: 'Signed out of all devices successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        message: error.message || 'Logout-all failed',
      },
      { status: 500 },
    );
  }
}
