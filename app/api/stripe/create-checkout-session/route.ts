import { NextResponse } from 'next/server';
import { createBookingCheckoutSession } from '@/lib/stripe/booking-checkout';
import { verifyFirebaseBearerToken } from '@/lib/stripe/verify-auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { uid } = await verifyFirebaseBearerToken(
      request.headers.get('Authorization'),
    );

    let body: { threadId?: string; discountCode?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const threadId = body.threadId?.trim();
    if (!threadId) {
      return NextResponse.json({ error: 'threadId is required.' }, { status: 400 });
    }

    const { url, sessionId } = await createBookingCheckoutSession({
      threadId,
      clientUserId: uid,
      discountCode: body.discountCode?.trim() || undefined,
    });

    return NextResponse.json({ url, sessionId });
  } catch (e) {
    console.error('[create-checkout-session]', e);
    const message =
      e instanceof Error ? e.message : 'Could not start checkout.';
    // Stripe SDK errors
    const stripeMsg =
      e &&
      typeof e === 'object' &&
      'raw' in e &&
      e.raw &&
      typeof e.raw === 'object' &&
      'message' in e.raw &&
      typeof (e.raw as { message: unknown }).message === 'string'
        ? (e.raw as { message: string }).message
        : null;
    const status =
      message.includes('not configured') ||
      message.includes('FIREBASE_SERVICE_ACCOUNT') ||
      message.includes('Firebase Admin failed')
        ? 503
        : message.includes('not valid') ||
            message.includes('not found') ||
            message.includes('not awaiting') ||
            message.includes('access') ||
            message.includes('Invalid booking')
          ? 400
          : 500;
    return NextResponse.json(
      { error: stripeMsg || message },
      { status },
    );
  }
}
