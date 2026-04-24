'use client';

import { useState } from 'react';
import type { User } from 'firebase/auth';
import {
  updateUserDocument,
  type UserData,
} from '@/lib/firebase/user-profile';
import { uploadPhotographerMedia } from '@/lib/firebase/upload';
import { COUNTRY_NAMES } from '@/lib/countries';
import { Loader2 } from 'lucide-react';

type Props = {
  user: User;
  userData: UserData;
  onSaved: () => Promise<void>;
  /** Extra prominence for banner + profile image (photographer onboarding). */
  showMediaUploads?: boolean;
};

export function ProfileSettingsForm({
  user,
  userData,
  onSaved,
  showMediaUploads = false,
}: Props) {
  const ph = userData.photographer ?? {};
  const [displayName, setDisplayName] = useState(
    userData.displayName ?? user.displayName ?? '',
  );
  const [username, setUsername] = useState(userData.username ?? '');
  const [city, setCity] = useState(userData.city ?? ph.city ?? '');
  const [state, setState] = useState(userData.state ?? ph.state ?? '');
  const [country, setCountry] = useState(userData.country ?? ph.country ?? '');
  const [bio, setBio] = useState(ph.bio ?? '');
  const [style, setStyle] = useState(ph.style ?? '');
  const [interests, setInterests] = useState(ph.interests ?? '');
  const [behance, setBehance] = useState(ph.behance ?? '');
  const [instagram, setInstagram] = useState(ph.instagram ?? '');
  const [twitter, setTwitter] = useState(ph.twitter ?? '');
  const [linkedin, setLinkedin] = useState(ph.linkedin ?? '');
  const [website, setWebsite] = useState(ph.website ?? '');
  const [portfolioUrl, setPortfolioUrl] = useState(ph.portfolioUrl ?? '');
  const [bannerImageUrl, setBannerImageUrl] = useState(ph.bannerImageUrl ?? '');
  const [profileImageUrl, setProfileImageUrl] = useState(
    ph.profileImageUrl ?? '',
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'banner' | 'profile' | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);

  const isPhotographer = userData.role === 'photographer';

  const onUpload = async (kind: 'banner' | 'profile', file: File | null) => {
    if (!file) return;
    setUploading(kind);
    setMessage(null);
    const url = await uploadPhotographerMedia(user.uid, kind, file);
    setUploading(null);
    if (!url) {
      setMessage('Upload failed. Check Storage rules and bucket in Firebase.');
      return;
    }
    if (kind === 'banner') setBannerImageUrl(url);
    else setProfileImageUrl(url);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const patch: Partial<UserData> = {
      displayName: displayName.trim() || null,
      username: username.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      country: country.trim() || null,
    };
    if (isPhotographer) {
      patch.photographer = {
        bio: bio.trim() || undefined,
        style: style.trim() || undefined,
        interests: interests.trim() || undefined,
        behance: behance.trim() || undefined,
        instagram: instagram.trim() || undefined,
        twitter: twitter.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
        website: website.trim() || undefined,
        portfolioUrl: portfolioUrl.trim() || undefined,
        bannerImageUrl: bannerImageUrl.trim() || undefined,
        profileImageUrl: profileImageUrl.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        country: country.trim() || undefined,
      };
    }
    const ok = await updateUserDocument(user.uid, patch);
    setSaving(false);
    if (ok) {
      setMessage('Saved.');
      await onSaved();
    } else {
      setMessage('Could not save. Check Firestore and your connection.');
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {message ? (
        <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-800">
          {message}
        </p>
      ) : null}

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Account</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Email (sign-in): {user.email}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-xs font-medium text-zinc-600">Display name</span>
            <input
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-xs font-medium text-zinc-600">Username</span>
            <input
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Letters before @ in your email by default"
            />
          </label>
          <div className="sm:col-span-2">
            <span className="text-xs font-medium text-zinc-600">Account type</span>
            <p className="mt-1 text-sm capitalize text-zinc-900">
              {userData.role === 'photographer' ? 'Photographer' : 'Client'}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Location</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-600">City</span>
            <input
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-600">State / region</span>
            <input
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </label>
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-xs font-medium text-zinc-600">Country</span>
            <select
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="">Select country</option>
              {COUNTRY_NAMES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {isPhotographer ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Photographer profile</h2>
          {showMediaUploads ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-zinc-600">
                  Banner image
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="text-sm text-zinc-600"
                  onChange={(e) =>
                    onUpload('banner', e.target.files?.[0] ?? null)
                  }
                />
                {uploading === 'banner' ? (
                  <Loader2 className="mt-2 h-4 w-4 animate-spin text-zinc-400" />
                ) : null}
                {bannerImageUrl ? (
                  <p className="mt-1 truncate text-xs text-zinc-500">{bannerImageUrl}</p>
                ) : null}
              </label>
              <label className="block space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-zinc-600">
                  Profile image
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="text-sm text-zinc-600"
                  onChange={(e) =>
                    onUpload('profile', e.target.files?.[0] ?? null)
                  }
                />
                {uploading === 'profile' ? (
                  <Loader2 className="mt-2 h-4 w-4 animate-spin text-zinc-400" />
                ) : null}
                {profileImageUrl ? (
                  <p className="mt-1 truncate text-xs text-zinc-500">{profileImageUrl}</p>
                ) : null}
              </label>
            </div>
          ) : null}
          <div className="mt-4 grid gap-4">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-600">Bio</span>
              <textarea
                rows={3}
                className="w-full resize-y rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-600">Style</span>
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder="e.g. editorial, documentary"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-600">Interests</span>
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">Behance</span>
                <input
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
                  value={behance}
                  onChange={(e) => setBehance(e.target.value)}
                  placeholder="https://"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">Instagram</span>
                <input
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">Twitter / X</span>
                <input
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">LinkedIn</span>
                <input
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                />
              </label>
              <label className="block space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-zinc-600">Website</span>
                <input
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </label>
              <label className="block space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-zinc-600">
                  Portfolio / other link
                </span>
                <input
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                />
              </label>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          'Save profile'
        )}
      </button>
    </form>
  );
}
