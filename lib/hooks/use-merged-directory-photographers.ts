'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  firestoreDocToDirectory,
  getDirectoryPhotographers,
  type DirectoryPhotographer,
} from '@/lib/photographers-directory';

/**
 * Live Firestore `photographers` docs (approved / listed) plus JSON seed rows
 * that do not collide on `id`.
 */
export function useMergedDirectoryPhotographers(): DirectoryPhotographer[] {
  const jsonSeed = useMemo(() => getDirectoryPhotographers(), []);
  const [fromFirestore, setFromFirestore] = useState<DirectoryPhotographer[]>(
    [],
  );

  useEffect(() => {
    const col = collection(db, 'photographers');
    return onSnapshot(
      col,
      (snap) => {
        const rows: DirectoryPhotographer[] = [];
        for (const d of snap.docs) {
          const mapped = firestoreDocToDirectory(d.id, d.data());
          if (mapped) rows.push(mapped);
        }
        setFromFirestore(rows);
      },
      (e) => {
        console.error('photographers directory subscription', e);
        setFromFirestore([]);
      },
    );
  }, []);

  return useMemo(() => {
    const ids = new Set(fromFirestore.map((p) => p.id));
    return [...fromFirestore, ...jsonSeed.filter((j) => !ids.has(j.id))];
  }, [fromFirestore, jsonSeed]);
}
