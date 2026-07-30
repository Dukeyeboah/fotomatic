import Stripe from 'stripe';
import { stripeSecretKey } from '@/lib/stripe/config';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(stripeSecretKey());
  }
  return stripeClient;
}
