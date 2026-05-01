'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';

export function PhotographerStatCard({
  label,
  valueDisplay,
  subtext,
  icon: Icon,
  tintClass,
  viewHref,
  viewLabel,
  modalTitle,
  modalBody,
}: {
  label: string;
  valueDisplay: string;
  subtext: string;
  icon: LucideIcon;
  tintClass: string;
  viewHref: string;
  viewLabel: string;
  modalTitle: string;
  modalBody: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group w-full rounded-xl border border-zinc-200/80 p-5 text-left shadow-sm transition-all hover:cursor-pointer hover:border-zinc-300 hover:shadow-md ${tintClass}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
              {label}
            </p>
            <p className="mt-2 font-serif text-3xl font-medium tabular-nums text-zinc-900">
              {valueDisplay}
            </p>
            <p className="mt-1 text-sm text-zinc-600">{subtext}</p>
            <Link
              href={viewHref}
              onClick={(e) => e.stopPropagation()}
              className="mt-3 inline-block text-sm font-semibold text-amber-900 underline-offset-2 hover:underline"
            >
              {viewLabel} →
            </Link>
          </div>
          <div className="rounded-xl bg-white/70 p-2.5 text-zinc-700 shadow-sm ring-1 ring-zinc-900/5 transition-transform group-hover:scale-105">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
        </div>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="photographer-stat-modal-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[min(90vh,480px)] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2
                id="photographer-stat-modal-title"
                className="font-serif text-xl font-medium text-zinc-900"
              >
                {modalTitle}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 text-sm leading-relaxed text-zinc-600">
              {modalBody}
            </div>
            <Link
              href={viewHref}
              onClick={() => setOpen(false)}
              className="mt-6 inline-flex rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              {viewLabel}
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
