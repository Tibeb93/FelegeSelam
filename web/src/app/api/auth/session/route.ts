import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const adminSessionCookie = cookieStore.get('fs_admin_session')?.value;
    const adminRefreshToken = cookieStore.get('fs_admin_refresh_token')?.value;

    const memberSessionCookie = cookieStore.get('fs_session')?.value;
    const memberRefreshToken = cookieStore.get('fs_refresh_token')?.value;

    const sessionCookie = adminSessionCookie || memberSessionCookie;
    const refreshToken = adminRefreshToken || memberRefreshToken;

    if (!sessionCookie && !refreshToken) {
      return NextResponse.json({
        authenticated: false,
        session: null,
      });
    }

    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie);
        return NextResponse.json({
          authenticated: true,
          session,
          isAdmin: Boolean(adminSessionCookie),
        });
      } catch {
        // Corrupted session cookie
      }
    }

    return NextResponse.json({
      authenticated: Boolean(refreshToken),
      session: null,
      isAdmin: Boolean(adminRefreshToken),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        authenticated: false,
        session: null,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
