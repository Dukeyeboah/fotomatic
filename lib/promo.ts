/**
 * Optional referral / discount codes (e.g. shared from Grad Drive).
 * Set in `.env.local`:
 *   NEXT_PUBLIC_PROMO_MESSAGES=HOS2026:House of Stole partner rate applied at checkout.,GD10:Grad Drive — 10% off eligible sessions.
 * Format: code:message pairs, comma-separated. Codes are matched case-insensitively.
 */
export function getPromoMessageForCode(code: string | null): string | null {
  if (!code?.trim()) return null;
  const raw = process.env.NEXT_PUBLIC_PROMO_MESSAGES || '';
  const pairs = raw.split(',').map((s) => s.trim()).filter(Boolean);
  const normalized = code.trim().toUpperCase();
  for (const pair of pairs) {
    const idx = pair.indexOf(':');
    if (idx === -1) continue;
    const k = pair.slice(0, idx).trim().toUpperCase();
    const msg = pair.slice(idx + 1).trim();
    if (k === normalized && msg) return msg;
  }
  if (normalized) {
    return `Code “${code.trim()}” will be noted on your booking request.`;
  }
  return null;
}
