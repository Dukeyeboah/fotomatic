import { NextResponse } from 'next/server';
import { createBookingCheckoutSession } from '@/lib/stripe/booking-checkout';
import { verifyFirebaseBearerToken } from '@/lib/stripe/verify-auth';

export const runtime = 'nodejs';

type CheckoutError = Error & { step?: string };

function fail(step: string, message: string): never {
  const err = new Error(`[${step}] ${message}`) as CheckoutError;
  err.step = step;
  throw err;
}

function logEnvPresence() {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ?? '';
  const sk = process.env.STRIPE_SECRET_KEY?.trim() ?? '';
  console.log('[create-checkout-session] env check', {
    hasStripeSecret: Boolean(sk),
    stripeKeyPrefix: sk ? sk.slice(0, 8) : null,
    stripeKeyLooksLive: sk.startsWith('sk_live_'),
    stripeKeyLooksTest: sk.startsWith('sk_test_'),
    stripeKeyIsPublishable: sk.startsWith('pk_'),
    hasFirebaseSa: Boolean(sa),
    firebaseSaLength: sa.length || 0,
    firebaseSaStartsWithBrace: sa.startsWith('{'),
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
  });
}

export async function POST(request: Request) {
  let step = 'start';
  try {
    logEnvPresence();

    step = 'auth';
    console.log('[create-checkout-session] step=auth');
    let uid: string;
    try {
      ({ uid } = await verifyFirebaseBearerToken(
        request.headers.get('Authorization'),
      ));
    } catch (e) {
      fail(
        'auth',
        e instanceof Error
          ? e.message
          : 'Could not verify Firebase auth token.',
      );
    }
    console.log('[create-checkout-session] step=auth ok uid=', uid.slice(0, 8));

    step = 'parse_body';
    console.log('[create-checkout-session] step=parse_body');
    let body: { threadId?: string; discountCode?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body.', step: 'parse_body' },
        { status: 400 },
      );
    }

    const threadId = body.threadId?.trim();
    if (!threadId) {
      return NextResponse.json(
        { error: 'threadId is required.', step: 'parse_body' },
        { status: 400 },
      );
    }
    console.log(
      '[create-checkout-session] step=parse_body ok threadId=',
      threadId,
      'discount=',
      Boolean(body.discountCode?.trim()),
    );

    step = 'create_session';
    console.log('[create-checkout-session] step=create_session');
    const { url, sessionId } = await createBookingCheckoutSession({
      threadId,
      clientUserId: uid,
      discountCode: body.discountCode?.trim() || undefined,
    });
    console.log(
      '[create-checkout-session] step=done sessionId=',
      sessionId.slice(0, 24),
    );

    return NextResponse.json({ url, sessionId, step: 'done' });
  } catch (e) {
    const checkoutErr = e as CheckoutError;
    const stepFromErr =
      checkoutErr.step ||
      (typeof checkoutErr.message === 'string' &&
      /^\[([^\]]+)\]/.exec(checkoutErr.message)?.[1]) ||
      step;

    console.error('[create-checkout-session] FAILED at step=', stepFromErr, e);

    const message =
      e instanceof Error ? e.message : 'Could not start checkout.';
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

    const cleanMessage = (stripeMsg || message).replace(/^\[[^\]]+\]\s*/, '');
    const status =
      cleanMessage.includes('not configured') ||
      cleanMessage.includes('FIREBASE_SERVICE_ACCOUNT') ||
      cleanMessage.includes('Firebase Admin failed')
        ? 503
        : cleanMessage.includes('not valid') ||
            cleanMessage.includes('not found') ||
            cleanMessage.includes('not awaiting') ||
            cleanMessage.includes('access') ||
            cleanMessage.includes('Invalid booking') ||
            cleanMessage.includes('Missing authorization')
          ? 400
          : 500;

    return NextResponse.json(
      {
        error: cleanMessage,
        step: stepFromErr,
        hint:
          stepFromErr === 'auth' || stepFromErr === 'firebase_admin'
            ? 'Check FIREBASE_SERVICE_ACCOUNT_JSON on Vercel (one-line JSON) and redeploy.'
            : stepFromErr === 'stripe_client' || stepFromErr === 'stripe_session'
              ? 'Check STRIPE_SECRET_KEY is sk_live_… (not pk_ or mk_) on Vercel and redeploy.'
              : undefined,
      },
      { status },
    );
  }
}
