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
    try {
      let data = await getUserData(u.uid);
      if (!data) {
        data = await ensureUserProfile(u);
      }
      setUserData(data);
    } catch (e) {
      console.error('refreshUserData', e);
      setUserData(null);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          let data = await getUserData(firebaseUser.uid);
          if (!data) {
            data = await ensureUserProfile(firebaseUser);
          }
          setUserData(data);
        } catch (e) {
          console.error('Auth user profile load', e);
          setUserData(null);
        }
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
