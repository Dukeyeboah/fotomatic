import type Stripe from 'stripe';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin-server';
import { appBaseUrl, allowCheckoutPromotionCodes } from '@/lib/stripe/config';
import { resolveStripePromotionCode } from '@/lib/stripe/promotion-code';
import { getStripe } from '@/lib/stripe/server';

type BookingThreadDoc = {
  status?: string;
  clientUserId?: string;
  clientEmail?: string;
  photographerName?: string;
  photographerUserId?: string | null;
  eventType?: string;
  eventDate?: string;
  acceptedTotalPrice?: number | null;
};

type StepError = Error & { step?: string };

function stepFail(step: string, message: string): never {
  const err = new Error(message) as StepError;
  err.step = step;
  throw err;
}

export async function createBookingCheckoutSession(args: {
  threadId: string;
  clientUserId: string;
  discountCode?: string;
}): Promise<{ url: string; sessionId: string }> {
  console.log('[booking-checkout] step=firestore_read', args.threadId);
  let snap;
  try {
    snap = await adminDb().doc(`bookingThreads/${args.threadId}`).get();
  } catch (e) {
    console.error('[booking-checkout] firestore_read failed', e);
    stepFail(
      'firebase_admin',
      e instanceof Error
        ? `Firestore read failed: ${e.message}`
        : 'Firestore read failed.',
    );
  }

  if (!snap.exists) {
    stepFail('booking_lookup', 'Booking not found.');
  }
  const data = snap.data() as BookingThreadDoc;
  console.log('[booking-checkout] step=booking_validate', {
    status: data.status,
    total: data.acceptedTotalPrice,
    hasClientEmail: Boolean(data.clientEmail),
  });

  if (data.clientUserId !== args.clientUserId) {
    stepFail('booking_access', 'You do not have access to pay for this booking.');
  }
  if (data.status !== 'accepted_pending_payment') {
    stepFail(
      'booking_status',
      `This booking is not awaiting payment (status: ${data.status ?? 'unknown'}).`,
    );
  }
  const total = data.acceptedTotalPrice;
  if (typeof total !== 'number' || !Number.isFinite(total) || total < 0.5) {
    stepFail(
      'booking_total',
      'Invalid booking total. Ask the photographer to re-send the quote.',
    );
  }

  const unitAmount = Math.round(total * 100);
  if (unitAmount < 50) {
    stepFail('booking_total', 'Minimum charge is $0.50.');
  }

  console.log('[booking-checkout] step=stripe_client');
  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch (e) {
    console.error('[booking-checkout] stripe_client failed', e);
    stepFail(
      'stripe_client',
      e instanceof Error ? e.message : 'Stripe is not configured.',
    );
  }

  const base = appBaseUrl();
  const successUrl = `${base}/dashboard/bookings/payment/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${base}/dashboard/bookings/payment/cancel?thread=${encodeURIComponent(args.threadId)}`;
  console.log('[booking-checkout] step=urls', { base, successUrl, cancelUrl });

  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
    quantity: 1,
    price_data: {
      currency: 'usd',
      unit_amount: unitAmount,
      product_data: {
        name: `Fotomatic booking — ${data.eventType ?? 'Photography session'}`,
        description: [
          data.photographerName ? `Photographer: ${data.photographerName}` : null,
          data.eventDate ? `Date: ${data.eventDate}` : null,
        ]
          .filter(Boolean)
          .join(' · '),
      },
    },
  };

  const code = args.discountCode?.trim();

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    client_reference_id: args.threadId,
    customer_email: data.clientEmail?.trim() || undefined,
    line_items: [lineItem],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      threadId: args.threadId,
      clientUserId: args.clientUserId,
      photographerUserId: data.photographerUserId ?? '',
      ...(code ? { discountCode: code } : {}),
    },
    payment_intent_data: {
      metadata: {
        threadId: args.threadId,
        clientUserId: args.clientUserId,
      },
    },
  };

  if (code) {
    console.log('[booking-checkout] step=promo_resolve');
    const promo = await resolveStripePromotionCode(code);
    if (!promo) {
      stepFail(
        'promo',
        `Discount code “${code}” is not valid or has expired. Check the code and try again.`,
      );
    }
    sessionParams.discounts = [{ promotion_code: promo.id }];
  } else if (allowCheckoutPromotionCodes()) {
    sessionParams.allow_promotion_codes = true;
  }

  console.log('[booking-checkout] step=stripe_session amount_cents=', unitAmount);
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create(sessionParams);
  } catch (e) {
    console.error('[booking-checkout] stripe_session failed', e);
    const stripeMsg =
      e &&
      typeof e === 'object' &&
      'raw' in e &&
      e.raw &&
      typeof e.raw === 'object' &&
      'message' in e.raw &&
      typeof (e.raw as { message: unknown }).message === 'string'
        ? (e.raw as { message: string }).message
        : e instanceof Error
          ? e.message
          : 'Stripe Checkout session create failed.';
    stepFail('stripe_session', stripeMsg);
  }

  if (!session.url) {
    stepFail('stripe_session', 'Could not start Stripe Checkout (no URL).');
  }

  console.log('[booking-checkout] step=firestore_write session=', session.id);
  try {
    await adminDb().doc(`bookingThreads/${args.threadId}`).update({
      stripeCheckoutSessionId: session.id,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    // Session already created; still return URL so client can pay.
    console.error(
      '[booking-checkout] firestore_write failed (continuing with checkout URL)',
      e,
    );
  }

  console.log('[booking-checkout] step=done');
  return { url: session.url, sessionId: session.id };
}
