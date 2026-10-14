import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export async function POST() {
  try {
    const cookieStore = cookies();
    const refreshToken = cookieStore.get('fs_refresh_token')?.value;

    if (refreshToken) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Continue clearing cookies even if remote logout fails
      }
    }

    cookieStore.delete('fs_refresh_token');
    cookieStore.delete('fs_session');

    return NextResponse.json({
      success: true,
      statusCode: 200,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        message: error.message || 'Logout failed',
      },
      { status: 500 },
    );
  }
}
