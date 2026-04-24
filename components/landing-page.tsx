'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { AccountMenuDropdown } from '@/components/account-menu-dropdown';
import {
  saveNewsletterLead,
  savePhotographerApplication,
} from '@/lib/firebase/firestore';
import {
  GraduationCap,
  Calendar,
  User,
  HeartHandshake,
  Sparkles,
  Plus,
  Search,
  Briefcase,
  CheckCircle2,
  ShieldCheck,
  Link2,
  Loader2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

function LandingNav() {
  const { user, loading } = useAuth();
  const { openLoginModal } = useLoginModal();

  return (
    <header className='sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/95 backdrop-blur-md'>
      <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
        <Link
          href='/'
          className='flex items-center gap-2 sm:gap-3'
          aria-label='Fotomatic home'
        >
          <Image
            src='/fotomaticImages/fotomaticLogo.png'
            alt=''
            width={40}
            height={40}
            className='h-9 w-9 object-contain'
          />
          <Image
            src='/fotomaticImages/fotomatic.jpg'
            alt='Fotomatic'
            width={160}
            height={40}
            className='h-7 w-auto max-w-[150px] object-contain object-left sm:max-w-[180px]'
          />
        </Link>
        <nav className='flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm font-medium text-zinc-600 sm:gap-6'>
          <button
            type='button'
            className='cursor-pointer transition-colors hover:text-zinc-900'
            onClick={() => scrollToId('how-it-works')}
          >
            How It Works
          </button>
          <button
            type='button'
            className='cursor-pointer transition-colors hover:text-zinc-900'
            onClick={() => scrollToId('what-is-fotomatic')}
          >
            About Us
          </button>
          {!loading &&
            (user ? (
              <AccountMenuDropdown />
            ) : (
              <button
                type='button'
                onClick={() => openLoginModal()}
                className='transition-colors hover:text-zinc-900'
              >
                Log In
              </button>
            ))}
          {!loading && !user ? (
            <button
              type='button'
              onClick={() => scrollToId('get-started')}
              className='rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800'
            >
              Get Started
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

type ApplyPayload = {
  name: string;
  email: string;
  city: string;
  state: string;
  country: string;
  instagram: string;
  website: string;
  portfolioLinks: string;
  interestedInClientWork: boolean;
  howDidYouHear: string;
};

function JoinPhotographerModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [apply, setApply] = useState({
    name: '',
    email: '',
    city: '',
    state: '',
    country: '',
    instagram: '',
    website: '',
    portfolioLinks: '',
    interestedInClientWork: false,
    howDidYouHear: '',
  });
  const [applyStatus, setApplyStatus] = useState<
    'idle' | 'loading' | 'ok' | 'err'
  >('idle');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const onApply = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (
        !apply.name.trim() ||
        !apply.email.trim() ||
        !apply.city.trim() ||
        !apply.country.trim()
      ) {
        setApplyStatus('err');
        return;
      }
      const payload: ApplyPayload = {
        name: apply.name.trim(),
        email: apply.email.trim(),
        city: apply.city.trim(),
        state: apply.state.trim(),
        country: apply.country.trim(),
        instagram: apply.instagram.trim(),
        website: apply.website.trim(),
        portfolioLinks: apply.portfolioLinks.trim(),
        interestedInClientWork: apply.interestedInClientWork,
        howDidYouHear: apply.howDidYouHear.trim(),
      };

      setApplyStatus('loading');
      const saved = await savePhotographerApplication(payload);
      if (!saved) {
        setApplyStatus('err');
        return;
      }

      try {
        const res = await fetch('/api/notify-photographer-application', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          console.warn(
            '[JoinPhotographerModal] notify email failed',
            await res.text(),
          );
        }
      } catch (e) {
        console.warn('[JoinPhotographerModal] notify request error', e);
      }

      setApplyStatus('ok');
      setApply({
        name: '',
        email: '',
        city: '',
        state: '',
        country: '',
        instagram: '',
        website: '',
        portfolioLinks: '',
        interestedInClientWork: false,
        howDidYouHear: '',
      });
    },
    [apply],
  );

  if (!open) return null;

  return (
    <div
      className='fixed inset-0 z-[60] flex items-center justify-center p-4'
      role='dialog'
      aria-modal='true'
      aria-labelledby='join-modal-title'
    >
      <button
        type='button'
        className='absolute inset-0 bg-zinc-900/40 backdrop-blur-sm'
        aria-label='Close'
        onClick={onClose}
      />
      <div className='relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-zinc-900/10'>
        <div className='flex shrink-0 items-start justify-between gap-4 border-b border-zinc-100 px-6 py-4'>
          <div>
            <p className='text-[11px] font-semibold tracking-[0.22em] text-amber-900/70'>
              APPLY
            </p>
            <h2
              id='join-modal-title'
              className='mt-1 font-serif text-xl font-medium text-zinc-900'
            >
              Join as a photographer
            </h2>
            <p className='mt-1 text-sm text-zinc-600'>
              We’ll review your details and follow up by email.
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900'
            aria-label='Close dialog'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        <div className='min-h-0 flex-1 overflow-y-auto px-6 py-5'>
          {applyStatus === 'ok' ? (
            <div className='space-y-4 py-4 text-center'>
              <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700'>
                <CheckCircle2 className='h-7 w-7' />
              </div>
              <p className='font-medium text-zinc-900'>
                Your application has been submitted.
              </p>
              <p className='text-sm leading-relaxed text-zinc-600'>
                You’ll hear from us soon about next steps. Thank you for your
                interest in Fotomatic.
              </p>
              <button
                type='button'
                onClick={onClose}
                className='mt-2 w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800'
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={onApply} className='space-y-4'>
              <div className='grid gap-3 sm:grid-cols-2'>
                <label className='block space-y-1 sm:col-span-2'>
                  <span className='text-xs font-medium text-zinc-600'>
                    Full name
                  </span>
                  <input
                    required
                    className='w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20'
                    value={apply.name}
                    onChange={(e) =>
                      setApply((s) => ({ ...s, name: e.target.value }))
                    }
                  />
                </label>
                <label className='block space-y-1 sm:col-span-2'>
                  <span className='text-xs font-medium text-zinc-600'>
                    Email
                  </span>
                  <input
                    type='email'
                    required
                    className='w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20'
                    value={apply.email}
                    onChange={(e) =>
                      setApply((s) => ({ ...s, email: e.target.value }))
                    }
                  />
                </label>
                <label className='block space-y-1'>
                  <span className='text-xs font-medium text-zinc-600'>
                    City
                  </span>
                  <input
                    required
                    className='w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20'
                    value={apply.city}
                    onChange={(e) =>
                      setApply((s) => ({ ...s, city: e.target.value }))
                    }
                  />
                </label>
                <label className='block space-y-1'>
                  <span className='text-xs font-medium text-zinc-600'>
                    State / region
                  </span>
                  <input
                    className='w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20'
                    placeholder='If applicable'
                    value={apply.state}
                    onChange={(e) =>
                      setApply((s) => ({ ...s, state: e.target.value }))
                    }
                  />
                </label>
                <label className='block space-y-1 sm:col-span-2'>
                  <span className='text-xs font-medium text-zinc-600'>
                    Country
                  </span>
                  <input
                    required
                    className='w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20'
                    value={apply.country}
                    onChange={(e) =>
                      setApply((s) => ({ ...s, country: e.target.value }))
                    }
                  />
                </label>
                <label className='block space-y-1 sm:col-span-2'>
                  <span className='text-xs font-medium text-zinc-600'>
                    Instagram profile
                  </span>
                  <input
                    className='w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20'
                    placeholder='@handle or full URL'
                    value={apply.instagram}
                    onChange={(e) =>
                      setApply((s) => ({ ...s, instagram: e.target.value }))
                    }
                  />
                </label>
                <label className='block space-y-1 sm:col-span-2'>
                  <span className='text-xs font-medium text-zinc-600'>
                    Website
                  </span>
                  <input
                    className='w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20'
                    placeholder='https://'
                    value={apply.website}
                    onChange={(e) =>
                      setApply((s) => ({ ...s, website: e.target.value }))
                    }
                  />
                </label>
                <label className='block space-y-1 sm:col-span-2'>
                  <span className='text-xs font-medium text-zinc-600'>
                    Portfolio links
                  </span>
                  <textarea
                    rows={3}
                    className='w-full resize-y rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20'
                    placeholder='URLs to galleries or project pages'
                    value={apply.portfolioLinks}
                    onChange={(e) =>
                      setApply((s) => ({
                        ...s,
                        portfolioLinks: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className='block space-y-1 sm:col-span-2'>
                  <span className='text-xs font-medium text-zinc-600'>
                    How did you hear about Fotomatic?
                  </span>
                  <input
                    className='w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20'
                    value={apply.howDidYouHear}
                    onChange={(e) =>
                      setApply((s) => ({
                        ...s,
                        howDidYouHear: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <label className='flex cursor-pointer items-start gap-3 text-sm text-zinc-700'>
                <input
                  type='checkbox'
                  className='mt-1 rounded border-zinc-300 text-amber-900 focus:ring-amber-900/30'
                  checked={apply.interestedInClientWork}
                  onChange={(e) =>
                    setApply((s) => ({
                      ...s,
                      interestedInClientWork: e.target.checked,
                    }))
                  }
                />
                <span>
                  I’m interested in being connected with clients who need a
                  photographer for graduations, portraits, events, and similar
                  shoots.
                </span>
              </label>
              {applyStatus === 'err' ? (
                <p className='text-sm font-medium text-red-600'>
                  Something went wrong. Check required fields and try again, or
                  email{' '}
                  <a
                    href='mailto:contact@houseofstole.com'
                    className='underline'
                  >
                    contact@houseofstole.com
                  </a>
                  .
                </p>
              ) : null}
              <button
                type='submit'
                disabled={applyStatus === 'loading'}
                className='flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60'
              >
                {applyStatus === 'loading' ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Submitting…
                  </>
                ) : (
                  'Submit application'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
export function LandingPage() {
  const { openLoginModal } = useLoginModal();
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinModalKey, setJoinModalKey] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<
    'idle' | 'loading' | 'ok' | 'err'
  >('idle');

  const onNewsletter = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = newsletterEmail.trim();
      if (!trimmed || !trimmed.includes('@')) {
        setNewsletterStatus('err');
        return;
      }
      setNewsletterStatus('loading');
      const ok = await saveNewsletterLead(trimmed);
      setNewsletterStatus(ok ? 'ok' : 'err');
      if (ok) setNewsletterEmail('');
    },
    [newsletterEmail],
  );

  const openJoinModal = useCallback(() => {
    setJoinModalKey((k) => k + 1);
    setJoinModalOpen(true);
  }, []);

  return (
    <div className='min-h-screen bg-white text-zinc-900'>
      <LandingNav />
      <JoinPhotographerModal
        key={joinModalKey}
        open={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
      />

      <section className='border-b border-zinc-100'>
        <div className='mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-20'>
          <div className='space-y-8 text-center lg:text-left'>
            <h1 className='font-serif text-4xl font-medium tracking-tight text-balance text-zinc-900 md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]'>
              Your moments,{' '}
              <span className='italic text-amber-800/90'>beautifully</span>{' '}
              preserved.
            </h1>
            <p className='mx-auto max-w-xl text-lg leading-relaxed text-zinc-600 lg:mx-0'>
              Fotomatic connects you to trusted photographers who capture life’s
              most important moments — simply, reliably, and beautifully.
            </p>
            <div className='flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start'>
              <Link
                href='/photographers'
                className='inline-flex cursor-pointer items-center justify-center rounded-xl bg-zinc-900 px-8 py-4 text-base font-semibold text-white shadow-md shadow-zinc-900/10 transition-colors hover:bg-zinc-800'
              >
                Find a Photographer
              </Link>
              <button
                type='button'
                onClick={openJoinModal}
                className='inline-flex cursor-pointer items-center justify-center rounded-xl border border-zinc-200 bg-white px-8 py-4 text-base font-semibold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50'
              >
                Join as a Photographer
              </button>
            </div>
            <p className='text-sm text-zinc-500'>
              <button
                type='button'
                onClick={() => openLoginModal()}
                className='cursor-pointer underline underline-offset-4'
              >
                Already have an account? Log in
              </button>
            </p>
          </div>
          <div className='relative aspect-[4/3] w-full lg:aspect-[5/4]'>
            <div className='absolute inset-0 overflow-hidden rounded-3xl shadow-xl shadow-zinc-900/10 ring-1 ring-zinc-900/5'>
              <Image
                src='/fotomaticImages/fotomatic0.jpg'
                alt=''
                fill
                className='object-cover'
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section
        id='what-is-fotomatic'
        className='border-b border-zinc-100 bg-[#faf8f5] py-20'
      >
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='mx-auto max-w-3xl space-y-4 text-center'>
            <p className='text-[11px] font-semibold tracking-[0.22em] text-amber-900/70'>
              WHAT IS FOTOMATIC?
            </p>
            <p className='font-serif text-2xl font-medium tracking-tight text-balance text-zinc-900 md:text-3xl md:leading-snug'>
              Fotomatic is a trusted network of professional photographers you
              can count on for life’s most important moments.
            </p>
          </div>
          <div className='mt-14 flex flex-wrap justify-center gap-10 md:gap-14'>
            {[
              { icon: GraduationCap, label: 'Graduation' },
              { icon: Calendar, label: 'Events' },
              { icon: User, label: 'Portraits' },
              { icon: HeartHandshake, label: 'Weddings' },
              { icon: Sparkles, label: 'Milestones' },
              { icon: Plus, label: 'And more' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className='flex w-[104px] flex-col items-center gap-3'
              >
                <div className='flex h-14 w-14 items-center justify-center rounded-full bg-white text-amber-800 shadow-sm ring-1 ring-zinc-900/5'>
                  <Icon className='h-6 w-6' strokeWidth={1.5} />
                </div>
                <span className='text-center text-sm font-medium text-zinc-700'>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id='how-it-works' className='border-b border-zinc-100 py-20'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <h2 className='font-serif text-3xl font-medium tracking-tight text-zinc-900 md:text-4xl'>
              <span className='text-zinc-800'>Simple.</span>{' '}
              <span className='text-amber-900/85'>Seamless.</span>{' '}
              <span className='text-zinc-800'>Reliable.</span>
            </h2>
          </div>
          <div className='mt-16 space-y-20'>
            <div>
              <p className='text-center text-xs font-semibold uppercase tracking-[0.2em] text-amber-900/80'>
                For Clients
              </p>
              <div className='mt-8 grid gap-6 md:grid-cols-3'>
                {[
                  {
                    icon: Search,
                    title: 'Find a photographer',
                    desc: 'Browse vetted professionals matched to your moment and style.',
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Book with confidence',
                    desc: 'Clear expectations, responsive communication, and zero guesswork.',
                  },
                  {
                    icon: CheckCircle2,
                    title: 'Enjoy your memories',
                    desc: 'Gallery-ready images you’ll be proud to share and revisit.',
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className='rounded-2xl bg-[#faf8f5] p-8 text-center shadow-sm ring-1 ring-zinc-900/5'
                  >
                    <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-amber-800 shadow-sm'>
                      <Icon className='h-5 w-5' strokeWidth={1.75} />
                    </div>
                    <h3 className='mt-5 font-serif text-lg font-semibold text-zinc-900'>
                      {title}
                    </h3>
                    <p className='mt-2 text-sm leading-relaxed text-zinc-600'>
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className='text-center text-xs font-semibold uppercase tracking-[0.2em] text-amber-900/80'>
                For Photographers
              </p>
              <div className='mt-8 grid gap-6 md:grid-cols-3'>
                {[
                  {
                    icon: Link2,
                    title: 'Join the network',
                    desc: 'Tell us about your work and the clients you love serving.',
                  },
                  {
                    icon: Briefcase,
                    title: 'Get matched with clients',
                    desc: 'We connect you with people planning shoots that fit your craft.',
                  },
                  {
                    icon: Sparkles,
                    title: 'Do your best work',
                    desc: 'We handle the experience so you can stay behind the lens.',
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className='rounded-2xl bg-[#faf8f5] p-8 text-center shadow-sm ring-1 ring-zinc-900/5'
                  >
                    <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-amber-800 shadow-sm'>
                      <Icon className='h-5 w-5' strokeWidth={1.75} />
                    </div>
                    <h3 className='mt-5 font-serif text-lg font-semibold text-zinc-900'>
                      {title}
                    </h3>
                    <p className='mt-2 text-sm leading-relaxed text-zinc-600'>
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id='trust-quality' className='border-b border-zinc-100 py-20'>
        <div className='mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8'>
          <div className='space-y-6'>
            <p className='text-xs font-semibold uppercase tracking-[0.2em] text-amber-900/75'>
              Quality you can trust
            </p>
            <h2 className='font-serif text-3xl font-medium text-balance text-zinc-900 md:text-4xl md:leading-tight'>
              Every photographer is carefully selected.
            </h2>
            <p className='leading-relaxed text-zinc-600'>
              We vet every photographer for quality, reliability, and
              professionalism — so you never have to guess.
            </p>
            <ul className='space-y-3 text-sm text-zinc-700'>
              {[
                'Carefully vetted professionals',
                'Consistent quality and reliability',
                'A focus on experience and results',
              ].map((t) => (
                <li key={t} className='flex gap-3'>
                  <CheckCircle2 className='mt-0.5 h-4 w-4 shrink-0 text-amber-800' />
                  {t}
                </li>
              ))}
            </ul>
            <p className='text-xs text-zinc-500'>
              Trusted by graduates from House of Stole.
            </p>
          </div>
          <div className='relative'>
            <div className='grid grid-cols-2 gap-3'>
              {[
                'fotomatic1.jpg',
                'fotomatic2.jpg',
                'fotomatic3.jpg',
                'fotomatic4.jpg',
              ].map((img) => (
                <div
                  key={img}
                  className='relative aspect-[4/3] overflow-hidden rounded-2xl shadow-md ring-1 ring-zinc-900/5'
                >
                  <Image
                    src={`/fotomaticImages/${img}`}
                    alt=''
                    fill
                    className='object-cover'
                  />
                </div>
              ))}
            </div>
            <div className='pointer-events-none absolute inset-0 flex items-center justify-center p-4'>
              <div className='max-w-[280px] rounded-2xl bg-white/95 px-7 py-5 text-center shadow-lg shadow-zinc-900/10 ring-1 ring-zinc-900/5 backdrop-blur-sm'>
                <p className='font-serif text-lg font-semibold text-zinc-900'>
                  Trusted Professionals
                </p>
                <p className='mt-2 text-sm leading-relaxed text-zinc-600'>
                  Quality. Reliability. Peace of mind.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id='get-started' className='bg-white py-20'>
        <div className='mx-auto max-w-5xl px-4 sm:px-6 lg:px-8'>
          <div className='rounded-3xl bg-[#faf8f5] p-8 shadow-lg shadow-zinc-900/5 ring-1 ring-zinc-900/5 md:p-14'>
            <div className='space-y-3 text-center'>
              <h2 className='font-serif text-3xl font-medium text-zinc-900 md:text-4xl'>
                Ready to get started?
              </h2>
              <p className='mx-auto max-w-2xl text-zinc-600'>
                Whether you’re booking your next photoshoot or growing your
                photography business, Fotomatic is here for you.
              </p>
            </div>
            <div className='mt-12 grid gap-6 md:grid-cols-2'>
              <div className='rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-900/5'>
                <p className='font-medium text-zinc-900'>
                  Looking for a photographer?
                </p>
                <Link
                  href='/photographers'
                  className='mt-5 inline-flex cursor-pointer rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800'
                >
                  Browse Photographers
                </Link>
              </div>
              <div className='rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-900/5'>
                <p className='font-medium text-zinc-900'>
                  Are you a photographer?
                </p>
                <button
                  type='button'
                  onClick={openJoinModal}
                  className='mt-5 inline-flex cursor-pointer rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50'
                >
                  Apply to Join
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className='border-t border-zinc-200 bg-white py-9'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-12 lg:gap-8'>
            <div className='lg:col-span-5'>
              <div className='flex items-center gap-2 sm:gap-3'>
                <Image
                  src='/fotomaticImages/fotomaticLogo.png'
                  alt=''
                  width={36}
                  height={36}
                  className='h-8 w-8 object-contain'
                />
                <Image
                  src='/fotomaticImages/fotomatic.jpg'
                  alt='Fotomatic'
                  width={140}
                  height={36}
                  className='h-6 w-auto max-w-[140px] object-contain'
                />
              </div>
              <p className='mt-2 max-w-xs text-sm leading-relaxed text-zinc-600'>
                Your moments, beautifully preserved.
              </p>
            </div>
            <div className='grid gap-8 sm:grid-cols-2 lg:col-span-7'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500'>
                  Explore
                </p>
                <ul className='mt-4 space-y-3 text-sm text-zinc-700'>
                  <li>
                    <button
                      type='button'
                      onClick={() => scrollToId('how-it-works')}
                      className='cursor-pointer text-left transition-colors hover:text-zinc-900'
                    >
                      How It Works
                    </button>
                  </li>
                  <li>
                    <button
                      type='button'
                      onClick={() => scrollToId('what-is-fotomatic')}
                      className='cursor-pointer text-left transition-colors hover:text-zinc-900'
                    >
                      About Us
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500'>
                  Stay in the loop
                </p>
                <p className='mt-4 text-sm text-zinc-600'>
                  Occasional updates on launches, tips, and photographer
                  opportunities.
                </p>
                <form onSubmit={onNewsletter} className='mt-4 flex gap-2'>
                  <input
                    type='email'
                    placeholder='Email address'
                    className='min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20'
                    value={newsletterEmail}
                    onChange={(e) => {
                      setNewsletterEmail(e.target.value);
                      if (newsletterStatus !== 'idle')
                        setNewsletterStatus('idle');
                    }}
                  />
                  <button
                    type='submit'
                    disabled={newsletterStatus === 'loading'}
                    className='shrink-0 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60'
                  >
                    {newsletterStatus === 'loading' ? '…' : 'Join'}
                  </button>
                </form>
                {newsletterStatus === 'ok' ? (
                  <p className='mt-2 text-xs font-medium text-emerald-700'>
                    You’re on the list.
                  </p>
                ) : null}
                {newsletterStatus === 'err' ? (
                  <p className='mt-2 text-xs font-medium text-red-600'>
                    Enter a valid email.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <p className='mt-8 border-t border-zinc-100 pt-6 text-center text-xs text-zinc-500'>
            © {new Date().getFullYear()} Fotomatic. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
