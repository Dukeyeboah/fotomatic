import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function initAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    return initializeApp({
      credential: cert(JSON.parse(json) as Record<string, string>),
    });
  }

  throw new Error(
    'FIREBASE_SERVICE_ACCOUNT_JSON is not set. Required for Stripe webhooks and secure checkout.',
  );
}

export function adminDb() {
  initAdminApp();
  return getFirestore();
}

export function adminAuth() {
  initAdminApp();
  return getAuth();
}
