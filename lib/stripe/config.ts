/**
 * Stripe + Firebase Admin (server only).
 *
 * Test mode (Stripe sandbox): same variables as live, but use **test** keys from
 * Dashboard → Developers → API keys (`sk_test_…`) and a **test** webhook secret
 * (`whsec_…` from `stripe listen` locally or a test-mode webhook endpoint).
 *
 * Required env (`.env.local` + production):
 * - STRIPE_SECRET_KEY=sk_test_… or sk_live_…
 * - STRIPE_WEBHOOK_SECRET=whsec_…
 * - FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",…}
 *
 * Optional:
 * - NEXT_PUBLIC_APP_URL=http://localhost:3000  (checkout return URLs)
 * - STRIPE_ALLOW_CHECKOUT_PROMO_CODES=true
 */

export function stripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured.');
  }
  return key;
}

export function stripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured.');
  }
  return secret;
}

export function appBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (fromEnv) {
    const withProto = fromEnv.startsWith('http')
      ? fromEnv
      : `https://${fromEnv}`;
    return withProto.replace(/\/$/, '');
  }
  return 'http://localhost:3000';
}

export function allowCheckoutPromotionCodes(): boolean {
  const raw = process.env.STRIPE_ALLOW_CHECKOUT_PROMO_CODES?.trim();
  if (raw === 'false' || raw === '0') return false;
  return true;
}
