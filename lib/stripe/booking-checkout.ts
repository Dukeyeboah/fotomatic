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

export async function createBookingCheckoutSession(args: {
  threadId: string;
  clientUserId: string;
  discountCode?: string;
}): Promise<{ url: string; sessionId: string }> {
  const snap = await adminDb().doc(`bookingThreads/${args.threadId}`).get();
  if (!snap.exists) {
    throw new Error('Booking not found.');
  }
  const data = snap.data() as BookingThreadDoc;
  if (data.clientUserId !== args.clientUserId) {
    throw new Error('You do not have access to pay for this booking.');
  }
  if (data.status !== 'accepted_pending_payment') {
    throw new Error('This booking is not awaiting payment.');
  }
  const total = data.acceptedTotalPrice;
  if (typeof total !== 'number' || !Number.isFinite(total) || total < 0.5) {
    throw new Error('Invalid booking total. Ask the photographer to re-send the quote.');
  }

  const unitAmount = Math.round(total * 100);
  if (unitAmount < 50) {
    throw new Error('Minimum charge is $0.50.');
  }

  const stripe = getStripe();
  const base = appBaseUrl();
  const successUrl = `${base}/dashboard/bookings/payment/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${base}/dashboard/bookings/payment/cancel?thread=${encodeURIComponent(args.threadId)}`;

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
    const promo = await resolveStripePromotionCode(code);
    if (!promo) {
      throw new Error(
        `Discount code “${code}” is not valid or has expired. Check the code and try again.`,
      );
    }
    sessionParams.discounts = [{ promotion_code: promo.id }];
  } else if (allowCheckoutPromotionCodes()) {
    sessionParams.allow_promotion_codes = true;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  if (!session.url) {
    throw new Error('Could not start Stripe Checkout.');
  }

  await adminDb().doc(`bookingThreads/${args.threadId}`).update({
    stripeCheckoutSessionId: session.id,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { url: session.url, sessionId: session.id };
}
