'use client';

import { useState } from 'react';
import type { User } from 'firebase/auth';
import {
  updateUserDocument,
  type UserData,
} from '@/lib/firebase/user-profile';
import { uploadPhotographerMedia } from '@/lib/firebase/upload';
import { COUNTRY_NAMES } from '@/lib/countries';
import { PHOTOGRAPHY_FOCUS_OPTIONS } from '@/lib/photography-focus';
import { syncPhotographerPublicDirectory } from '@/lib/firebase/sync-photographer-directory';
import { Loader2 } from 'lucide-react';

const FIELD_INPUT_CLASS =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 caret-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20';

const FIELD_TEXTAREA_CLASS =
  'w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 caret-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20';

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
  const initialFocus = ph.photographyFocus ?? ph.style ?? '';
  const focusPresets = PHOTOGRAPHY_FOCUS_OPTIONS as readonly string[];
  const [photoFocusChoice, setPhotoFocusChoice] = useState(() =>
    focusPresets.includes(initialFocus) ? initialFocus : initialFocus ? 'Other' : '',
  );
  const [photoFocusOther, setPhotoFocusOther] = useState(() =>
    focusPresets.includes(initialFocus) ? '' : initialFocus,
  );
  const [interests, setInterests] = useState(ph.interests ?? '');
  const [behance, setBehance] = useState(ph.behance ?? '');
  const [instagram, setInstagram] = useState(ph.instagram ?? '');
  const [twitter, setTwitter] = useState(ph.twitter ?? '');
  const [facebook, setFacebook] = useState(ph.facebook ?? '');
  const [linkedin, setLinkedin] = useState(ph.linkedin ?? '');
  const [website, setWebsite] = useState(ph.website ?? '');
  const [portfolioUrl, setPortfolioUrl] = useState(ph.portfolioUrl ?? '');
  const [directoryId, setDirectoryId] = useState(ph.directoryId ?? '');
  const [phone, setPhone] = useState(ph.phone ?? '');
  const [phoneContact, setPhoneContact] = useState(ph.phoneContact === true);
  const [emailContact, setEmailContact] = useState(ph.emailContact === true);
  const [serviceArea, setServiceArea] = useState(ph.serviceArea ?? '');
  const [openToOtherAreas, setOpenToOtherAreas] = useState(
    ph.openToOtherAreas === true,
  );
  const [hourlyRate, setHourlyRate] = useState<number | ''>(
    typeof ph.hourlyRate === 'number' ? ph.hourlyRate : '',
  );
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
  const isAdmin = userData.role === 'admin';

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
    const resolvedFocus =
      photoFocusChoice === 'Other'
        ? photoFocusOther.trim()
        : photoFocusChoice.trim();
    if (isPhotographer) {
      patch.photographer = {
        bio: bio.trim() || undefined,
        style: resolvedFocus || undefined,
        photographyFocus: resolvedFocus || undefined,
        interests: interests.trim() || undefined,
        behance: behance.trim() || undefined,
        instagram: instagram.trim() || undefined,
        twitter: twitter.trim() || undefined,
        facebook: facebook.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
        website: website.trim() || undefined,
        portfolioUrl: portfolioUrl.trim() || undefined,
        directoryId: directoryId.trim() || undefined,
        phone: phone.trim() || undefined,
        phoneContact,
        emailContact,
        serviceArea: serviceArea.trim() || undefined,
        openToOtherAreas,
        hourlyRate: typeof hourlyRate === 'number' ? hourlyRate : undefined,
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
      if (isPhotographer) {
        const merged: UserData = {
          ...userData,
          ...patch,
          uid: user.uid,
          photographer: {
            ...userData.photographer,
            ...patch.photographer,
          },
        };
        const synced = await syncPhotographerPublicDirectory(merged);
        if (!synced) {
          setMessage('Saved profile, but directory sync failed. Try again.');
        }
      }
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
              className={FIELD_INPUT_CLASS}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-xs font-medium text-zinc-600">Username</span>
            <input
              className={FIELD_INPUT_CLASS}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Letters before @ in your email by default"
            />
          </label>
          <div className="sm:col-span-2">
            <span className="text-xs font-medium text-zinc-600">Account type</span>
            <p className="mt-1 text-sm capitalize text-zinc-900">
              {isAdmin ? 'Admin' : isPhotographer ? 'Photographer' : 'Client'}
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
              className={FIELD_INPUT_CLASS}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-600">State / region</span>
            <input
              className={FIELD_INPUT_CLASS}
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </label>
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-xs font-medium text-zinc-600">Country</span>
            <select
              className={FIELD_INPUT_CLASS}
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
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-600">
                Directory id <span className="font-normal text-zinc-400">(e.g. p-yourUid)</span>
              </span>
              <input
                className={FIELD_INPUT_CLASS}
                value={directoryId}
                onChange={(e) => setDirectoryId(e.target.value)}
                placeholder={`p-${user.uid.slice(0, 8)}…`}
              />
              <span className="text-[11px] leading-snug text-zinc-500">
                Approved photographers use <code className="rounded bg-zinc-100 px-1">p-{'{your account id}'}</code>. This keeps your public listing in sync with bookings.
              </span>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-600">
                Hourly rate <span className="font-normal text-zinc-400">(optional)</span>
              </span>
              <input
                inputMode="numeric"
                className={FIELD_INPUT_CLASS}
                value={hourlyRate}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (!v) setHourlyRate('');
                  else setHourlyRate(Number(v));
                }}
                placeholder="200"
              />
            </label>
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-xs font-medium text-zinc-600">Phone</span>
              <input
                className={FIELD_INPUT_CLASS}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 …"
              />
            </label>
            <div className="flex flex-col gap-3 sm:col-span-2">
              <label className="flex cursor-pointer items-start gap-3 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-zinc-300 text-amber-900 focus:ring-amber-900/30"
                  checked={phoneContact}
                  onChange={(e) => setPhoneContact(e.target.checked)}
                />
                <span>
                  I’m OK with clients contacting me by phone for booking-related
                  questions. Your number appears only when this is checked.
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-zinc-300 text-amber-900 focus:ring-amber-900/30"
                  checked={emailContact}
                  onChange={(e) => setEmailContact(e.target.checked)}
                />
                <span>
                  I’m OK with clients reaching me by email for booking-related
                  questions.
                </span>
              </label>
            </div>
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-xs font-medium text-zinc-600">
                Primary service area
              </span>
              <input
                className={FIELD_INPUT_CLASS}
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                placeholder="e.g. Greater Accra, metro Phoenix"
              />
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-zinc-700 sm:col-span-2">
              <input
                type="checkbox"
                className="mt-1 rounded border-zinc-300 text-amber-900 focus:ring-amber-900/30"
                checked={openToOtherAreas}
                onChange={(e) => setOpenToOtherAreas(e.target.checked)}
              />
              <span>Open to traveling or serving nearby regions beyond my primary area.</span>
            </label>
          </div>
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
                maxLength={2000}
                className={FIELD_TEXTAREA_CLASS}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <span className="text-[11px] text-zinc-500">
                {bio.trim().split(/\s+/).filter(Boolean).length} / ~150 words suggested max
              </span>
            </label>
            <div className="block space-y-2">
              <span className="text-xs font-medium text-zinc-600">
                Photography focus / specialty
              </span>
              <select
                className={FIELD_INPUT_CLASS}
                value={photoFocusChoice}
                onChange={(e) => setPhotoFocusChoice(e.target.value)}
              >
                <option value="">Select…</option>
                {PHOTOGRAPHY_FOCUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {photoFocusChoice === 'Other' ? (
                <input
                  className={FIELD_INPUT_CLASS}
                  value={photoFocusOther}
                  onChange={(e) => setPhotoFocusOther(e.target.value)}
                  placeholder="Describe your focus"
                />
              ) : null}
            </div>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-600">Interests</span>
              <input
                className={FIELD_INPUT_CLASS}
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">Behance</span>
                <input
                  className={FIELD_INPUT_CLASS}
                  value={behance}
                  onChange={(e) => setBehance(e.target.value)}
                  placeholder="https://"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">Instagram</span>
                <input
                  className={FIELD_INPUT_CLASS}
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">Twitter / X</span>
                <input
                  className={FIELD_INPUT_CLASS}
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">Facebook</span>
                <input
                  className={FIELD_INPUT_CLASS}
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">LinkedIn</span>
                <input
                  className={FIELD_INPUT_CLASS}
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                />
              </label>
              <label className="block space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-zinc-600">Website</span>
                <input
                  className={FIELD_INPUT_CLASS}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </label>
              <label className="block space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-zinc-600">
                  Portfolio / other link
                </span>
                <input
                  className={FIELD_INPUT_CLASS}
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
