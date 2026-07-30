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
    const message =
      e instanceof Error ? e.message : 'Could not start checkout.';
    const status =
      message.includes('not configured') ||
      message.includes('FIREBASE_SERVICE_ACCOUNT')
        ? 503
        : message.includes('not valid') ||
            message.includes('not found') ||
            message.includes('not awaiting') ||
            message.includes('access')
          ? 400
          : 500;
    if (status >= 500) {
      console.error('[create-checkout-session]', e);
    }
    return NextResponse.json({ error: message }, { status });
  }
}
