import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin-server';
import type Stripe from 'stripe';

type BookingThreadPaymentDoc = {
  status?: string;
  clientUserId?: string;
  clientName?: string;
  clientEmail?: string;
  photographerName?: string;
  photographerUserId?: string | null;
  eventType?: string;
  eventDate?: string;
  acceptedTotalPrice?: number | null;
};

/**
 * Mark a booking thread paid after Stripe Checkout completes.
 * Idempotent: safe if webhook and success-page verification both run.
 */
export async function markBookingPaidFromCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<{ updated: boolean; threadId: string | null }> {
  const threadId =
    session.metadata?.threadId?.trim() ||
    session.client_reference_id?.trim() ||
    null;
  if (!threadId) {
    return { updated: false, threadId: null };
  }

  const ref = adminDb().doc(`bookingThreads/${threadId}`);
  const snap = await ref.get();
  if (!snap.exists) {
    return { updated: false, threadId };
  }

  const cur = snap.data() as BookingThreadPaymentDoc;
  if (cur.status === 'confirmed' && session.payment_status === 'paid') {
    return { updated: false, threadId };
  }

  if (session.payment_status !== 'paid') {
    return { updated: false, threadId };
  }

  const paidCents =
    typeof session.amount_total === 'number' ? session.amount_total : null;
  const discountCode = session.metadata?.discountCode?.trim() || null;

  await ref.update({
    status: 'confirmed',
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null,
    paidAmountCents: paidCents,
    discountCodeApplied: discountCode,
    paidAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const photographerUserId = cur.photographerUserId?.trim();
  const clientUserId =
    session.metadata?.clientUserId?.trim() || cur.clientUserId?.trim();
  const clientName = cur.clientName?.trim() || 'Client';
  const clientEmail = cur.clientEmail?.trim() || '';
  const photographerName = cur.photographerName?.trim() || 'Photographer';
  const eventType = cur.eventType?.trim() || 'Photography session';
  const eventDate = cur.eventDate?.trim() || '';

  const amountLabel =
    paidCents != null
      ? `$${(paidCents / 100).toFixed(2)}`
      : 'Payment received';

  const quoted =
    typeof cur.acceptedTotalPrice === 'number' && cur.acceptedTotalPrice > 0
      ? `$${cur.acceptedTotalPrice.toFixed(2)}`
      : null;

  const adminBodyLines = [
    `${clientName}${clientEmail ? ` (${clientEmail})` : ''} paid ${amountLabel} for ${photographerName}.`,
    `Event: ${eventType}${eventDate ? ` · ${eventDate}` : ''}.`,
    quoted && quoted !== amountLabel ? `Quoted: ${quoted}.` : null,
    discountCode ? `Discount code: ${discountCode}.` : null,
    'Payment succeeded via Stripe Checkout.',
  ].filter(Boolean);

  await adminDb().collection('bookingThreadMessages').add({
    threadId,
    senderUserId: 'system',
    senderRole: 'system',
    text: `Payment confirmed (${amountLabel}). Your booking is confirmed.`,
    createdAt: FieldValue.serverTimestamp(),
  });

  if (clientUserId) {
    await adminDb().collection('notifications').add({
      userId: clientUserId,
      threadId,
      type: 'system',
      title: 'Payment confirmed',
      body: `Your booking payment of ${amountLabel} for ${photographerName} was successful.`,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  if (photographerUserId) {
    await adminDb().collection('notifications').add({
      userId: photographerUserId,
      threadId,
      type: 'system',
      title: 'Booking paid',
      body: `${clientName} completed payment (${amountLabel}) for ${eventType}.`,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  await adminDb().collection('adminEvents').add({
    type: 'booking_paid',
    title: 'Booking payment successful',
    body: adminBodyLines.join(' '),
    threadId,
    applicationId: null,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { updated: true, threadId };
}
