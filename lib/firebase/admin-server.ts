import { cert, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function parseServiceAccountJson(raw: string): ServiceAccount {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Vercel sometimes stores with extra wrapping quotes or escaped JSON
    const unquoted = raw.replace(/^"|"$/g, '').replace(/\\"/g, '"');
    parsed = JSON.parse(unquoted);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not a valid object.');
  }

  const sa = parsed as Record<string, unknown>;
  if (typeof sa.private_key === 'string') {
    // Env vars often turn real newlines into the two-char sequence \n
    sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  }
  if (typeof sa.client_email !== 'string' || typeof sa.private_key !== 'string') {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON must include client_email and private_key.',
    );
  }

  return sa as ServiceAccount;
}

function initAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!json || json.includes('"type":"service_account"...')) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON is not set. Required for Stripe webhooks and secure checkout.',
    );
  }

  try {
    const serviceAccount = parseServiceAccountJson(json);
    return initializeApp({
      credential: cert(serviceAccount),
      projectId:
        typeof serviceAccount.projectId === 'string'
          ? serviceAccount.projectId
          : (serviceAccount as { project_id?: string }).project_id,
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : 'unknown error';
    console.error('[firebase-admin] init failed:', detail);
    throw new Error(
      `Firebase Admin failed to initialize (${detail}). Check FIREBASE_SERVICE_ACCOUNT_JSON on the host.`,
    );
  }
}

export function adminDb() {
  initAdminApp();
  return getFirestore();
}

export function adminAuth() {
  initAdminApp();
  return getAuth();
}
