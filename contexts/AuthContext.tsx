'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import {
  ensureUserProfile,
  getUserData,
  type UserData,
} from '@/lib/firebase/user-profile';

const PROFILE_LOAD_RETRIES = 3;
const PROFILE_RETRY_MS = [0, 450, 1200];

async function loadUserProfileWithRetry(
  firebaseUser: User,
): Promise<UserData | null> {
  for (let attempt = 0; attempt < PROFILE_LOAD_RETRIES; attempt++) {
    if (PROFILE_RETRY_MS[attempt]) {
      await new Promise((r) =>
        setTimeout(r, PROFILE_RETRY_MS[attempt] ?? 0),
      );
    }
    try {
      let data = await getUserData(firebaseUser.uid);
      if (!data) {
        data = await ensureUserProfile(firebaseUser);
      }
      return data;
    } catch (e) {
      console.error('loadUserProfileWithRetry', attempt, e);
    }
  }
  return null;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  refreshUserData: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) {
      setUserData(null);
      return;
    }
    const data = await loadUserProfileWithRetry(u);
    setUserData(data);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const data = await loadUserProfileWithRetry(firebaseUser);
        setUserData(data);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, userData, loading, refreshUserData }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
