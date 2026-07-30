import { adminAuth } from '@/lib/firebase/admin-server';

export async function verifyFirebaseBearerToken(
  authorizationHeader: string | null,
): Promise<{ uid: string; email?: string }> {
  const raw = authorizationHeader?.trim() ?? '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7).trim() : '';
  if (!token) {
    console.error('[verify-auth] missing Bearer token');
    throw new Error('Missing authorization token.');
  }
  console.log('[verify-auth] verifying id token length=', token.length);
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    console.log('[verify-auth] ok uid=', decoded.uid.slice(0, 8));
    return { uid: decoded.uid, email: decoded.email };
  } catch (e) {
    console.error('[verify-auth] verifyIdToken failed', e);
    throw new Error(
      e instanceof Error
        ? `Auth token verify failed: ${e.message}`
        : 'Auth token verify failed.',
    );
  }
}
