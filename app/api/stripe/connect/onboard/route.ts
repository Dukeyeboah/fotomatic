import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin-server';
import {
  createPhotographerAccountLink,
  syncPhotographerConnectStatus,
} from '@/lib/stripe/connect';
import { verifyFirebaseBearerToken } from '@/lib/stripe/verify-auth';

export const runtime = 'nodejs';

async function requirePhotographer(uid: string) {
  const snap = await adminDb().doc(`users/${uid}`).get();
  const role = snap.data()?.role;
  if (role !== 'photographer') {
    throw new Error('Photographer account required.');
  }
  return snap.data() as { email?: string | null };
}

/** Start or resume Stripe Connect Express onboarding. */
export async function POST(request: Request) {
  try {
    const { uid, email } = await verifyFirebaseBearerToken(
      request.headers.get('Authorization'),
    );
    await requirePhotographer(uid);
    const { url, accountId } = await createPhotographerAccountLink({
      uid,
      email,
    });
    return NextResponse.json({ url, accountId });
  } catch (e) {
    console.error('[connect/onboard]', e);
    const message =
      e instanceof Error ? e.message : 'Could not start Connect onboarding.';
    const status =
      message.includes('token') || message.includes('Photographer')
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/** Sync Connect account status after return from Stripe. */
export async function GET(request: Request) {
  try {
    const { uid } = await verifyFirebaseBearerToken(
      request.headers.get('Authorization'),
    );
    await requirePhotographer(uid);
    const status = await syncPhotographerConnectStatus(uid);
    return NextResponse.json({ ok: true, ...status });
  } catch (e) {
    console.error('[connect/status]', e);
    const message =
      e instanceof Error ? e.message : 'Could not load Connect status.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
