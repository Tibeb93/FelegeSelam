import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    const tag = searchParams.get('tag');
    const path = searchParams.get('path');

    const expectedSecret = process.env.CMS_REVALIDATE_SECRET || 'felegeselam-cms-secret-key-2026';
    if (secret && secret !== expectedSecret) {
      return NextResponse.json({ message: 'Invalid revalidation secret' }, { status: 401 });
    }

    if (tag) {
      revalidateTag(tag);
    }

    if (path) {
      revalidatePath(path);
    }

    // Default revalidate general tags if none specified
    if (!tag && !path) {
      revalidateTag('cms-pages');
      revalidateTag('cms-menus');
      revalidateTag('cms-theme');
    }

    return NextResponse.json({
      revalidated: true,
      tag: tag || null,
      path: path || null,
      now: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json({ message: 'Error revalidating', error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
