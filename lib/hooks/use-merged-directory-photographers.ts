'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  firestoreDocToDirectory,
  type DirectoryPhotographer,
} from '@/lib/photographers-directory';

/**
 * Live Firestore `photographers` directory. Rows with `listed: false` are omitted
 * via `firestoreDocToDirectory`.
 *
 * We intentionally do **not** merge `data/photographers.json` here: after a doc is
 * permanently deleted, the same `dir-*` id could otherwise reappear from the
 * bundled JSON. Use Admin → Photographers → “Sync from JSON” to import seed rows
 * into Firestore when you want that data live.
 */
export function useMergedDirectoryPhotographers(): DirectoryPhotographer[] {
  const [rows, setRows] = useState<DirectoryPhotographer[]>([]);

  useEffect(() => {
    const col = collection(db, 'photographers');
    return onSnapshot(
      col,
      (snap) => {
        const out: DirectoryPhotographer[] = [];
        for (const d of snap.docs) {
          if (d.id.startsWith('__fotomatic_')) continue;
          const mapped = firestoreDocToDirectory(d.id, d.data());
          if (mapped) out.push(mapped);
        }
        setRows(out);
      },
      (e) => {
        console.error('photographers directory subscription', e);
        setRows([]);
      },
    );
  }, []);

  return rows;
}
