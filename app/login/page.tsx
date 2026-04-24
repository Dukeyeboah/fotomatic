'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import {
  signInEmailPassword,
  signUpEmailPassword,
} from '@/lib/firebase/auth';
import { isFirebaseConfigured } from '@/lib/firebase/config';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isFirebaseConfigured()) {
      setError('Add Firebase keys to .env.local (see .env.example).');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error: err } = await signInEmailPassword(email, password);
        if (err) setError(err);
        else router.push('/photographers');
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
        else router.push('/photographers');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <div className="mx-auto flex max-w-md flex-col gap-8 px-4 py-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <Image
              src="/fotomaticImages/fotomaticLogo.png"
              alt=""
              width={44}
              height={44}
              className="h-10 w-10 object-contain"
            />
            <Image
              src="/fotomaticImages/fotomatic.png"
              alt="Fotomatic"
              width={160}
              height={40}
              className="h-8 w-auto max-w-[160px] object-contain"
            />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            {mode === 'login' ? 'Log in' : 'Create an account'}
          </h1>
          <p className="text-sm text-zinc-600">
            Book photographers and manage your requests.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Name
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Password
            </label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
          <button
            type="button"
            className="w-full text-center text-sm text-zinc-600 underline"
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

        <p className="text-center text-sm text-zinc-500">
          <Link href="/" className="underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
