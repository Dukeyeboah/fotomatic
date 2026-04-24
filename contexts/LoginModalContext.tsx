'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';
import {
  signInEmailPassword,
  signInWithGoogle,
  signUpEmailPassword,
} from '@/lib/firebase/auth';
import { isFirebaseConfigured } from '@/lib/firebase/config';

type LoginModalContextValue = {
  openLoginModal: () => void;
  closeLoginModal: () => void;
};

const LoginModalContext = createContext<LoginModalContextValue | null>(null);

export function useLoginModal() {
  const ctx = useContext(LoginModalContext);
  if (!ctx) {
    throw new Error('useLoginModal must be used within LoginModalProvider');
  }
  return ctx;
}

function LoginModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const finishSuccess = useCallback(() => {
    onClose();
    setName('');
    setEmail('');
    setPassword('');
    setError(null);
    router.refresh();
  }, [onClose, router]);

  const onGoogle = async () => {
    setError(null);
    if (!isFirebaseConfigured()) {
      setError('Add Firebase keys to .env.local.');
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await signInWithGoogle();
      if (err) setError(err);
      else finishSuccess();
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isFirebaseConfigured()) {
      setError('Add Firebase keys to .env.local.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error: err } = await signInEmailPassword(email, password);
        if (err) setError(err);
        else finishSuccess();
      } else {
        if (!name.trim()) {
          setError('Name is required.');
          setLoading(false);
          return;
        }
        const { error: err } = await signUpEmailPassword(
          email,
          password,
          name.trim(),
        );
        if (err) setError(err);
        else finishSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-zinc-900/10">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-6 py-4">
          <div>
            <h2
              id="login-modal-title"
              className="font-serif text-xl font-medium text-zinc-900"
            >
              {mode === 'login' ? 'Log in' : 'Create an account'}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Book photographers and manage your requests.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <button
            type="button"
            disabled={loading}
            onClick={onGoogle}
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wide">
              <span className="bg-white px-2 text-zinc-500">or email</span>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            ) : null}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-zinc-600">
                  Name
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-zinc-600">
                Email
              </label>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600">
                Password
              </label>
              <input
                type="password"
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Please wait…
                </>
              ) : mode === 'login' ? (
                'Log in'
              ) : (
                'Sign up'
              )}
            </button>
            <button
              type="button"
              className="w-full text-center text-sm text-zinc-600 underline underline-offset-2"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError(null);
              }}
            >
              {mode === 'login'
                ? 'Need an account? Sign up'
                : 'Already have an account? Log in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openLoginModal = useCallback(() => setOpen(true), []);
  const closeLoginModal = useCallback(() => setOpen(false), []);

  return (
    <LoginModalContext.Provider value={{ openLoginModal, closeLoginModal }}>
      {children}
      <LoginModal open={open} onClose={closeLoginModal} />
    </LoginModalContext.Provider>
  );
}
