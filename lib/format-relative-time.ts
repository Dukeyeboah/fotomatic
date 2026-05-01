/** Best-effort relative label for Firestore Timestamp-like values. */
export function formatRelativeFromFirestore(value: unknown): string {
  let ms = 0;
  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis: unknown }).toMillis === 'function'
  ) {
    ms = (value as { toMillis: () => number }).toMillis();
  } else if (
    value &&
    typeof value === 'object' &&
    'seconds' in value &&
    typeof (value as { seconds: unknown }).seconds === 'number'
  ) {
    ms = (value as { seconds: number }).seconds * 1000;
  }
  if (!ms) return 'Just now';
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 45) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 86400 * 7) return `${Math.floor(sec / 86400)}d ago`;
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
