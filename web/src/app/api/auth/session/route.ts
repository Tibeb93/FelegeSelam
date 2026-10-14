import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('fs_session')?.value;
    const refreshToken = cookieStore.get('fs_refresh_token')?.value;

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
        });
      } catch {
        // Corrupted session cookie
      }
    }

    return NextResponse.json({
      authenticated: Boolean(refreshToken),
      session: null,
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
