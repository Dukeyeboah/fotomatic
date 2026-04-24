'use client';

import { useState, useEffect } from 'react';
import {
  getPhotographers,
  bookPhotographer,
  type Photographer,
} from '@/lib/firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, MapPin, Mail, Phone, Globe, AtSign } from 'lucide-react';

function getPhotographerName(p: Photographer) {
  if (p.firstName && p.lastName) return `${p.firstName} ${p.lastName}`;
  return p.firstName || p.name || 'Unknown';
}

function getLocation(p: Photographer) {
  if (p.address && p.state) return `${p.address}, ${p.state}`;
  return p.address || p.state || p.location || 'Location not specified';
}

export function PhotographersGrid({
  promoLabel,
}: {
  /** Shown when a referral/discount code is active (e.g. from Grad Drive link). */
  promoLabel?: string | null;
}) {
  const [list, setList] = useState<Photographer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const { user, userData } = useAuth();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getPhotographers('interested-follow-up');
      setList(data);
      setLoading(false);
    })();
  }, []);

  const filtered = list.filter((p) => {
    if (!q) return true;
    const n = getPhotographerName(p).toLowerCase();
    const loc = getLocation(p).toLowerCase();
    const qq = q.toLowerCase();
    return n.includes(qq) || loc.includes(qq);
  });

  const book = async (p: Photographer) => {
    if (!user || !userData || !p.id) {
      alert('Please log in to book a photographer.');
      return;
    }
    setBookingId(p.id);
    const ok = await bookPhotographer({
      photographerId: p.id,
      photographerName: getPhotographerName(p),
      userId: user.uid,
      userName: userData.displayName || user.email || 'Unknown',
      userEmail: userData.email || user.email || '',
    });
    setBookingId(null);
    if (ok) {
      alert(
        `Request sent for ${getPhotographerName(p)}. Our team will follow up.`,
      );
    } else {
      alert('Could not send booking. Try again later.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
          Find a photographer
        </h1>
        <p className="text-lg text-zinc-600">
          Browse trusted professionals for graduations, portraits, and events.
        </p>
        {promoLabel ? (
          <p className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 inline-block">
            {promoLabel}
          </p>
        ) : null}
      </div>

      <div className="flex justify-center">
        <input
          type="search"
          placeholder="Search by name or location..."
          className="w-full max-w-md rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm shadow-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-zinc-500">No photographers found.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <article
              key={p.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
            >
              <div className="space-y-1 border-b border-zinc-100 p-5">
                <h2 className="text-lg font-semibold text-zinc-900">
                  {getPhotographerName(p)}
                </h2>
                <p className="flex items-center gap-1 text-sm text-zinc-600">
                  <MapPin className="h-3.5 w-3.5" />
                  {getLocation(p)}
                </p>
              </div>
              <div className="flex flex-1 flex-col gap-4 p-5">
                {(p.instagramContact ||
                  p.emailContact ||
                  p.phoneContact ||
                  p.website) && (
                  <div className="flex flex-wrap gap-2 text-sm">
                    {p.instagramContact && p.instagram && (
                      <a
                        href={p.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-pink-600 hover:underline"
                      >
                        <AtSign className="h-4 w-4" /> Instagram
                      </a>
                    )}
                    {p.emailContact && p.email && (
                      <a
                        href={`mailto:${p.email}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <Mail className="h-4 w-4" /> Email
                      </a>
                    )}
                    {p.phoneContact && p.phone && (
                      <a
                        href={`tel:${p.phone}`}
                        className="inline-flex items-center gap-1 text-green-600 hover:underline"
                      >
                        <Phone className="h-4 w-4" /> Phone
                      </a>
                    )}
                    {p.website && (
                      <a
                        href={p.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-violet-600 hover:underline"
                      >
                        <Globe className="h-4 w-4" /> Website
                      </a>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => book(p)}
                  disabled={bookingId === p.id}
                  className="mt-auto w-full cursor-pointer rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                >
                  {bookingId === p.id ? 'Sending…' : 'Book photographer'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
