import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const GATE_COOKIE = 'fotomatic_photo_gate';

/**
 * Set `PHOTO_ADMIN_PASSKEY` in the environment (e.g. Vercel) to the shared studio passkey.
 * Never commit the real passkey to the repo.
 */
export async function POST(request: Request) {
  let body: { passkey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const expected = process.env.PHOTO_ADMIN_PASSKEY?.trim();
  if (!expected) {
    console.error('[photo-admin/verify] PHOTO_ADMIN_PASSKEY is not set');
    return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 });
  }

  if (typeof body.passkey !== 'string' || body.passkey !== expected) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(GATE_COOKIE, '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return NextResponse.json({ ok: true });
}
