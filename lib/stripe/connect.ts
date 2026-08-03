import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin-server';
import { appBaseUrl } from '@/lib/stripe/config';
import { getStripe } from '@/lib/stripe/server';
import {
  photographerPayoutCents,
  photographerSharePercent,
} from '@/lib/stripe/connect-config';

type ConnectFields = {
  stripeConnectAccountId?: string | null;
  stripeChargesEnabled?: boolean;
  stripePayoutsEnabled?: boolean;
  stripeDetailsSubmitted?: boolean;
};

function photographerRef(uid: string) {
  return adminDb().doc(`users/${uid}`);
}

async function readConnectFields(uid: string): Promise<ConnectFields> {
  const snap = await photographerRef(uid).get();
  if (!snap.exists) {
    throw new Error('User not found.');
  }
  const data = snap.data() as {
    role?: string;
    photographer?: ConnectFields;
  };
  if (data.role !== 'photographer') {
    throw new Error('Only photographers can connect a payout account.');
  }
  return data.photographer ?? {};
}

async function writeConnectFields(uid: string, fields: ConnectFields) {
  await photographerRef(uid).set(
    {
      photographer: {
        ...fields,
        stripeConnectUpdatedAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

/** Create or reuse an Express connected account for a photographer. */
export async function ensurePhotographerConnectAccount(args: {
  uid: string;
  email?: string | null;
}): Promise<{ accountId: string }> {
  const existing = await readConnectFields(args.uid);
  if (existing.stripeConnectAccountId?.startsWith('acct_')) {
    return { accountId: existing.stripeConnectAccountId };
  }

  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'US',
    email: args.email?.trim() || undefined,
    capabilities: {
      transfers: { requested: true },
    },
    business_type: 'individual',
    metadata: {
      fotomaticUserId: args.uid,
    },
  });

  await writeConnectFields(args.uid, {
    stripeConnectAccountId: account.id,
    stripeChargesEnabled: account.charges_enabled ?? false,
    stripePayoutsEnabled: account.payouts_enabled ?? false,
    stripeDetailsSubmitted: account.details_submitted ?? false,
  });

  return { accountId: account.id };
}

/** Stripe-hosted onboarding / update link for Express. */
export async function createPhotographerAccountLink(args: {
  uid: string;
  email?: string | null;
}): Promise<{ url: string; accountId: string }> {
  const { accountId } = await ensurePhotographerConnectAccount(args);
  const stripe = getStripe();
  const base = appBaseUrl();
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${base}/photographer/earnings?connect=refresh`,
    return_url: `${base}/photographer/earnings?connect=return`,
    type: 'account_onboarding',
  });
  return { url: link.url, accountId };
}

/** Refresh capability flags from Stripe onto the user doc. */
export async function syncPhotographerConnectStatus(uid: string): Promise<{
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}> {
  const fields = await readConnectFields(uid);
  const accountId = fields.stripeConnectAccountId?.trim() || null;
  if (!accountId) {
    return {
      accountId: null,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
    };
  }

  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(accountId);
  const chargesEnabled = Boolean(account.charges_enabled);
  const payoutsEnabled = Boolean(account.payouts_enabled);
  const detailsSubmitted = Boolean(account.details_submitted);

  await writeConnectFields(uid, {
    stripeConnectAccountId: accountId,
    stripeChargesEnabled: chargesEnabled,
    stripePayoutsEnabled: payoutsEnabled,
    stripeDetailsSubmitted: detailsSubmitted,
  });

  return {
    accountId,
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted,
  };
}

/**
 * Transfer photographer share from platform balance to their Connect account.
 * Call after payment is confirmed (manual admin / scheduled job).
 */
export async function transferBookingPayoutToPhotographer(args: {
  threadId: string;
  /** Admin or system actor for audit. */
  initiatedBy: string;
}): Promise<{
  transferId: string | null;
  amountCents: number;
  skipped: boolean;
  reason?: string;
}> {
  const threadRef = adminDb().doc(`bookingThreads/${args.threadId}`);
  const snap = await threadRef.get();
  if (!snap.exists) {
    throw new Error('Booking not found.');
  }

  const thread = snap.data() as {
    status?: string;
    photographerUserId?: string | null;
    paidAmountCents?: number | null;
    acceptedTotalPrice?: number | null;
    stripeTransferId?: string | null;
    stripePayoutStatus?: string | null;
  };

  if (thread.stripeTransferId) {
    return {
      transferId: thread.stripeTransferId,
      amountCents: 0,
      skipped: true,
      reason: 'Transfer already recorded on this booking.',
    };
  }

  if (thread.status !== 'confirmed') {
    return {
      transferId: null,
      amountCents: 0,
      skipped: true,
      reason: 'Booking is not confirmed/paid yet.',
    };
  }

  const photographerUserId = thread.photographerUserId?.trim();
  if (!photographerUserId) {
    return {
      transferId: null,
      amountCents: 0,
      skipped: true,
      reason: 'No photographer user on booking.',
    };
  }

  const connect = await syncPhotographerConnectStatus(photographerUserId);
  if (!connect.accountId || !connect.payoutsEnabled) {
    return {
      transferId: null,
      amountCents: 0,
      skipped: true,
      reason:
        'Photographer has not finished Stripe Connect onboarding (payouts disabled).',
    };
  }

  const paidCents =
    typeof thread.paidAmountCents === 'number' && thread.paidAmountCents > 0
      ? thread.paidAmountCents
      : typeof thread.acceptedTotalPrice === 'number'
        ? Math.round(thread.acceptedTotalPrice * 100)
        : 0;

  const amountCents = photographerPayoutCents(paidCents);
  if (amountCents < 1) {
    return {
      transferId: null,
      amountCents: 0,
      skipped: true,
      reason: 'Payout amount is zero.',
    };
  }

  const stripe = getStripe();
  const transfer = await stripe.transfers.create({
    amount: amountCents,
    currency: 'usd',
    destination: connect.accountId,
    metadata: {
      threadId: args.threadId,
      photographerUserId,
      initiatedBy: args.initiatedBy,
      photographerSharePercent: String(photographerSharePercent()),
    },
  });

  await threadRef.update({
    stripeTransferId: transfer.id,
    stripeTransferAmountCents: amountCents,
    stripePayoutStatus: 'transferred',
    stripeTransferredAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await adminDb().collection('adminEvents').add({
    type: 'photographer_payout',
    title: 'Photographer payout transferred',
    body: `Transferred $${(amountCents / 100).toFixed(2)} (${photographerSharePercent()}%) to Connect account for booking ${args.threadId}.`,
    threadId: args.threadId,
    applicationId: null,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    transferId: transfer.id,
    amountCents,
    skipped: false,
  };
}
