'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
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
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <SiteHeader />

      <section className="border-b border-zinc-100">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-20">
          <div className="space-y-8 text-center lg:text-left">
            <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl lg:text-6xl">
              Your moments,{' '}
              <span className="text-amber-700">beautifully</span> preserved.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-zinc-600 mx-auto lg:mx-0">
              Fotomatic connects you to trusted photographers who capture life’s
              most important moments — simply, reliably, and beautifully.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/photographers"
                className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-zinc-900 px-8 py-4 text-base font-semibold text-white shadow-sm hover:bg-zinc-800"
              >
                Find a photographer
              </Link>
              <a
                href="#photographers-apply"
                className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-zinc-300 bg-white px-8 py-4 text-base font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Join as a photographer
              </a>
            </div>
            <p className="text-sm text-zinc-500">
              <Link href="/login" className="underline underline-offset-4">
                Already have an account? Log in
              </Link>
            </p>
          </div>
          <div className="relative aspect-[4/3] w-full lg:aspect-[5/4]">
            <div className="absolute inset-0 overflow-hidden rounded-3xl border border-zinc-200 shadow-lg">
              <Image
                src="/fotomaticImages/fotomatic0.jpg"
                alt=""
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-100 bg-zinc-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500">
              WHAT IS FOTOMATIC?
            </p>
            <p className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">
              Fotomatic is a trusted network of professional photographers you
              can count on for life’s most important moments.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-8 md:gap-10">
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
                className="flex w-[100px] flex-col items-center gap-2"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
                  <Icon className="h-5 w-5 text-amber-700" />
                </div>
                <span className="text-sm font-medium text-zinc-700">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-b border-zinc-100 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-semibold md:text-4xl">
            Simple. Seamless. Reliable.
          </h2>
          <div className="mt-12 space-y-14">
            <div>
              <p className="text-center text-sm font-semibold text-amber-800">
                For clients
              </p>
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {[
                  {
                    icon: Search,
                    title: 'Find a photographer',
                    desc: 'Browse professionals for your moment and style.',
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Book with confidence',
                    desc: 'Clear expectations and reliable communication.',
                  },
                  {
                    icon: CheckCircle2,
                    title: 'Enjoy your memories',
                    desc: 'Photos you’ll be proud to share and keep.',
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-100 bg-zinc-50">
                      <Icon className="h-5 w-5 text-amber-700" />
                    </div>
                    <h3 className="mt-4 font-semibold text-lg">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div id="photographers-apply">
              <p className="text-center text-sm font-semibold text-amber-800">
                For photographers
              </p>
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {[
                  {
                    icon: Link2,
                    title: 'Join the network',
                    desc: 'Apply to work with clients who value quality.',
                  },
                  {
                    icon: Briefcase,
                    title: 'Get matched',
                    desc: 'Connect with graduates, families, and events.',
                  },
                  {
                    icon: Sparkles,
                    title: 'Do your best work',
                    desc: 'We keep the experience smooth end to end.',
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-100 bg-zinc-50">
                      <Icon className="h-5 w-5 text-amber-700" />
                    </div>
                    <h3 className="mt-4 font-semibold text-lg">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-center text-sm text-zinc-600">
                Photographer onboarding will live in this app next — for now,{' '}
                <a
                  href="mailto:contact@houseofstole.com"
                  className="font-medium text-amber-800 underline"
                >
                  contact us
                </a>{' '}
                to apply.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-100 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div className="space-y-5">
            <h2 className="text-3xl font-semibold text-balance md:text-4xl">
              Every photographer is carefully selected.
            </h2>
            <p className="leading-relaxed text-zinc-600">
              We vet every photographer for quality, reliability, and
              professionalism — so you never have to guess.
            </p>
            <ul className="space-y-2 text-sm text-zinc-700">
              {[
                'Carefully vetted professionals',
                'Consistent quality and reliability',
                'A focus on experience and results',
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="text-xs text-zinc-500">
              Trusted by graduates from House of Stole.
            </p>
          </div>
          <div className="relative">
            <div className="grid grid-cols-2 gap-3">
              {['fotomatic1.jpg', 'fotomatic2.jpg', 'fotomatic3.jpg', 'fotomatic4.jpg'].map(
                (img) => (
                  <div
                    key={img}
                    className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200"
                  >
                    <Image
                      src={`/fotomaticImages/${img}`}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                ),
              )}
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="max-w-[260px] rounded-2xl border border-zinc-200 bg-white/95 px-6 py-4 text-center shadow-md backdrop-blur">
                <p className="font-semibold">Trusted professionals</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Quality. Reliability. Peace of mind.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm md:p-12">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-semibold">Ready to get started?</h2>
              <p className="text-zinc-600">
                Book your next shoot or grow your photography business with
                Fotomatic.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 p-8 text-center">
                <p className="font-semibold">Looking for a photographer?</p>
                <Link
                  href="/photographers"
                  className="mt-4 inline-flex cursor-pointer rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Browse photographers
                </Link>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-8 text-center">
                <p className="font-semibold">Are you a photographer?</p>
                <a
                  href="mailto:contact@houseofstole.com?subject=Fotomatic%20photographer%20application"
                  className="mt-4 inline-flex cursor-pointer rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                >
                  Apply to join
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <Image
              src="/fotomaticImages/fotomaticLogo.png"
              alt=""
              width={36}
              height={36}
              className="h-8 w-8 object-contain"
            />
            <Image
              src="/fotomaticImages/fotomatic.png"
              alt="Fotomatic"
              width={140}
              height={36}
              className="h-6 w-auto max-w-[140px] object-contain"
            />
          </div>
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} Fotomatic. Your moments, beautifully
            preserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
