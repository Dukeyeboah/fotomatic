import { adminAuth } from '@/lib/firebase/admin-server';

export async function verifyFirebaseBearerToken(
  authorizationHeader: string | null,
): Promise<{ uid: string; email?: string }> {
  const raw = authorizationHeader?.trim() ?? '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7).trim() : '';
  if (!token) {
    throw new Error('Missing authorization token.');
  }
  const decoded = await adminAuth().verifyIdToken(token);
  return { uid: decoded.uid, email: decoded.email };
}
