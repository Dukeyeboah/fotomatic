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
  if (existing) {
    console.log('[firebase-admin] reusing existing app');
    return existing;
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  console.log('[firebase-admin] init', {
    hasJson: Boolean(json),
    length: json?.length ?? 0,
    startsWithBrace: json?.startsWith('{') ?? false,
  });
  if (!json || json.includes('"type":"service_account"...')) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON is not set. Required for Stripe webhooks and secure checkout.',
    );
  }

  try {
    const serviceAccount = parseServiceAccountJson(json);
    const projectId =
      typeof serviceAccount.projectId === 'string'
        ? serviceAccount.projectId
        : (serviceAccount as { project_id?: string }).project_id;
    console.log('[firebase-admin] parsed SA', {
      projectId: projectId ?? null,
      hasClientEmail: Boolean(
        (serviceAccount as { clientEmail?: string; client_email?: string })
          .clientEmail ||
          (serviceAccount as { client_email?: string }).client_email,
      ),
      privateKeyLen:
        (
          (serviceAccount as { privateKey?: string; private_key?: string })
            .privateKey ||
          (serviceAccount as { private_key?: string }).private_key ||
          ''
        ).length,
    });
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
    console.log('[firebase-admin] init ok');
    return app;
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
