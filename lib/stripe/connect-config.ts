/**
 * Stripe Connect (Express) — photographers get paid from platform balance.
 *
 * Model:
 * - Clients still pay Fotomatic’s platform Stripe account (Checkout today).
 * - Photographers onboard Express connected accounts (bank details stay in Stripe).
 * - Platform later creates Transfers of photographerShare% of paid bookings.
 *
 * Env:
 * - STRIPE_SECRET_KEY (platform)
 * - STRIPE_PHOTOGRAPHER_SHARE_PERCENT (default 80) — % of paid amount transferred
 * - STRIPE_PLATFORM_FEE_PERCENT (default 20) — informational inverse; share wins if both set
 */

export function photographerSharePercent(): number {
  const raw = process.env.STRIPE_PHOTOGRAPHER_SHARE_PERCENT?.trim();
  if (raw) {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0 && n <= 100) return n;
  }
  const feeRaw = process.env.STRIPE_PLATFORM_FEE_PERCENT?.trim();
  if (feeRaw) {
    const fee = Number(feeRaw);
    if (Number.isFinite(fee) && fee >= 0 && fee <= 100) return 100 - fee;
  }
  return 80;
}

export function platformFeePercent(): number {
  return Math.max(0, Math.min(100, 100 - photographerSharePercent()));
}

/** Cents to transfer to the photographer from a paid Checkout amount. */
export function photographerPayoutCents(paidAmountCents: number): number {
  if (!Number.isFinite(paidAmountCents) || paidAmountCents <= 0) return 0;
  const share = photographerSharePercent() / 100;
  return Math.max(0, Math.round(paidAmountCents * share));
}
