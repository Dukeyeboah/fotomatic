import { NextResponse } from 'next/server';
import { markBookingPaidFromCheckoutSession } from '@/lib/stripe/mark-booking-paid';
import { getStripe } from '@/lib/stripe/server';
import { verifyFirebaseBearerToken } from '@/lib/stripe/verify-auth';
import { adminDb } from '@/lib/firebase/admin-server';

export const runtime = 'nodejs';

/** Fallback when webhooks are delayed: success page verifies payment with Stripe. */
export async function POST(request: Request) {
  try {
    const { uid } = await verifyFirebaseBearerToken(
      request.headers.get('Authorization'),
    );

    let body: { sessionId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const sessionId = body.sessionId?.trim();
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required.' }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.metadata?.clientUserId !== uid) {
      const threadId =
        session.metadata?.threadId || session.client_reference_id || '';
      if (threadId) {
        const snap = await adminDb().doc(`bookingThreads/${threadId}`).get();
        const clientUserId = snap.data()?.clientUserId;
        if (clientUserId !== uid) {
          return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      }
    }

    const result = await markBookingPaidFromCheckoutSession(session);

    return NextResponse.json({
      ok: true,
      threadId: result.threadId,
      paymentStatus: session.payment_status,
      updated: result.updated,
    });
  } catch (e) {
    console.error('[verify-session]', e);
    const message =
      e instanceof Error ? e.message : 'Could not verify payment.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
