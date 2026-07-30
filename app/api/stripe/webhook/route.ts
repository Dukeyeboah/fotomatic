import { NextResponse } from 'next/server';
import { markBookingPaidFromCheckoutSession } from '@/lib/stripe/mark-booking-paid';
import { stripeWebhookSecret } from '@/lib/stripe/config';
import { getStripe } from '@/lib/stripe/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      stripeWebhookSecret(),
    );
  } catch (e) {
    console.error('[stripe/webhook] signature verification failed', e);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await markBookingPaidFromCheckoutSession(session);
    }
  } catch (e) {
    console.error('[stripe/webhook] handler error', event.type, e);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
