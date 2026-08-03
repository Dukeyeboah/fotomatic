import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin-server';
import { transferBookingPayoutToPhotographer } from '@/lib/stripe/connect';
import {
  photographerSharePercent,
  platformFeePercent,
} from '@/lib/stripe/connect-config';
import { verifyFirebaseBearerToken } from '@/lib/stripe/verify-auth';

export const runtime = 'nodejs';

async function requireAdmin(uid: string) {
  const snap = await adminDb().doc(`users/${uid}`).get();
  if (snap.data()?.role !== 'admin') {
    throw new Error('Admin only.');
  }
}

/** Transfer photographer share for one confirmed booking (admin). */
export async function POST(request: Request) {
  try {
    const { uid } = await verifyFirebaseBearerToken(
      request.headers.get('Authorization'),
    );
    await requireAdmin(uid);

    let body: { threadId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
    }

    const threadId = body.threadId?.trim();
    if (!threadId) {
      return NextResponse.json(
        { error: 'threadId is required.' },
        { status: 400 },
      );
    }

    const result = await transferBookingPayoutToPhotographer({
      threadId,
      initiatedBy: uid,
    });

    return NextResponse.json({
      ...result,
      photographerSharePercent: photographerSharePercent(),
      platformFeePercent: platformFeePercent(),
    });
  } catch (e) {
    console.error('[connect/transfer]', e);
    const message =
      e instanceof Error ? e.message : 'Transfer failed.';
    const status = message.includes('Admin') || message.includes('token')
      ? 403
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
