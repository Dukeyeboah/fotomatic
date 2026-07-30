import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/server';

/** Resolve a customer-facing promo code to an active Stripe promotion code id. */
export async function resolveStripePromotionCode(
  code: string,
): Promise<Stripe.PromotionCode | null> {
  const normalized = code.trim();
  if (!normalized) return null;
  const stripe = getStripe();
  const list = await stripe.promotionCodes.list({
    code: normalized,
    active: true,
    limit: 1,
  });
  return list.data[0] ?? null;
}
