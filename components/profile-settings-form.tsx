'use client';

import { useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  updateUserDocument,
  type UserData,
} from '@/lib/firebase/user-profile';
import {
  uploadPhotographerGalleryImage,
  uploadPhotographerMedia,
} from '@/lib/firebase/upload';
import { DIRECTORY_GALLERY_MAX } from '@/lib/photographers-directory';
import { COUNTRY_NAMES } from '@/lib/countries';
import { PHOTOGRAPHY_FOCUS_OPTIONS } from '@/lib/photography-focus';
import { syncPhotographerPublicDirectory } from '@/lib/firebase/sync-photographer-directory';
import {
  isReservedProfileSlug,
  isValidPublicProfileSlug,
  normalizePublicProfileSlug,
} from '@/lib/public-profile-slug';
import {
  isUsernameClaimAvailable,
  syncUsernameClaimForUser,
} from '@/lib/firebase/username-claim';
import { Loader2, Upload, X } from 'lucide-react';

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
  const [phone, setPhone] = useState(ph.phone ?? '');
  const [phoneContact, setPhoneContact] = useState(ph.phoneContact === true);
  const [emailContact, setEmailContact] = useState(ph.emailContact === true);
  const [publicPhoneOnProfile, setPublicPhoneOnProfile] = useState(() => {
    if (ph.publicPhoneOnProfile === false) return false;
    if (ph.publicPhoneOnProfile === true) return true;
    return ph.phoneContact === true;
  });
  const [publicEmailOnProfile, setPublicEmailOnProfile] = useState(() => {
    if (ph.publicEmailOnProfile === false) return false;
    if (ph.publicEmailOnProfile === true) return true;
    return ph.emailContact === true;
  });
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
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>(() =>
    Array.isArray(ph.galleryImageUrls)
      ? ph.galleryImageUrls.filter((u) => typeof u === 'string' && u.trim()).slice(0, DIRECTORY_GALLERY_MAX)
      : [],
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<
    'banner' | 'profile' | 'gallery' | null
  >(null);
  const [message, setMessage] = useState<string | null>(null);
  const [usernameHint, setUsernameHint] = useState<string | null>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);
  const profileFileRef = useRef<HTMLInputElement>(null);
  const galleryFilesRef = useRef<HTMLInputElement>(null);

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

  const onGalleryPickMultiple = async (files: FileList | null) => {
    if (!files?.length || !showMediaUploads) return;
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (list.length === 0) return;
    let room = DIRECTORY_GALLERY_MAX - galleryImageUrls.length;
    if (room <= 0) {
      setMessage(`Portfolio is limited to ${DIRECTORY_GALLERY_MAX} images.`);
      return;
    }
    setUploading('gallery');
    setMessage(null);
    const nextUrls: string[] = [];
    for (const file of list) {
      if (room <= 0) break;
      const url = await uploadPhotographerGalleryImage(user.uid, file);
      if (url) {
        nextUrls.push(url);
        room -= 1;
      }
    }
    setUploading(null);
    if (nextUrls.length === 0) {
      setMessage('Upload failed. Check Storage rules and bucket in Firebase.');
      return;
    }
    setGalleryImageUrls((prev) =>
      [...prev, ...nextUrls].slice(0, DIRECTORY_GALLERY_MAX),
    );
    if (list.length > nextUrls.length && room === 0) {
      setMessage(
        `Only the first images that fit within the ${DIRECTORY_GALLERY_MAX} image limit were added.`,
      );
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const galleryClean = galleryImageUrls
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, DIRECTORY_GALLERY_MAX);
    if (
      isPhotographer &&
      showMediaUploads &&
      galleryClean.length > 0 &&
      galleryClean.length < 3
    ) {
      setSaving(false);
      setMessage(
        'Portfolio: add at least 3 images or remove them all for now (maximum 15).',
      );
      return;
    }

    const rawUsername = username.trim();
    if (rawUsername) {
      const check = normalizePublicProfileSlug(rawUsername);
      if (!isValidPublicProfileSlug(check) || isReservedProfileSlug(check)) {
        setSaving(false);
        setMessage(
          'Username must be 3–40 characters (letters, numbers, underscore, hyphen) and cannot be a reserved word.',
        );
        return;
      }
    }

    const normalizedUsername = rawUsername
      ? normalizePublicProfileSlug(rawUsername)
      : null;
    const prevNormalized =
      userData.username?.trim()
        ? normalizePublicProfileSlug(userData.username.trim())
        : null;

    const claim = await syncUsernameClaimForUser(
      user.uid,
      prevNormalized,
      username.trim(),
    );
    if (!claim.ok) {
      setSaving(false);
      setMessage(claim.reason);
      return;
    }

    const patch: Partial<UserData> = {
      displayName: displayName.trim() || null,
      username: normalizedUsername,
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
        phone: phone.trim() || undefined,
        phoneContact,
        emailContact,
        publicPhoneOnProfile,
        publicEmailOnProfile,
        serviceArea: serviceArea.trim() || undefined,
        openToOtherAreas,
        hourlyRate: typeof hourlyRate === 'number' ? hourlyRate : undefined,
        bannerImageUrl: bannerImageUrl.trim() || undefined,
        profileImageUrl: profileImageUrl.trim() || undefined,
        galleryImageUrls: galleryClean,
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
        const synced = await syncPhotographerPublicDirectory(merged, user.uid);
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
              onChange={(e) => {
                setUsername(e.target.value);
                setUsernameHint(null);
              }}
              onBlur={async () => {
                const raw = username.trim();
                if (!raw || raw.length < 3) {
                  setUsernameHint(null);
                  return;
                }
                const n = normalizePublicProfileSlug(raw);
                if (
                  !isValidPublicProfileSlug(n) ||
                  isReservedProfileSlug(n)
                ) {
                  setUsernameHint(null);
                  return;
                }
                const avail = await isUsernameClaimAvailable(raw, user.uid);
                setUsernameHint(
                  avail ? null : 'That username is already taken.',
                );
              }}
              placeholder="e.g. aureon9 — fotomatic.app/photographer/aureon9"
            />
            {usernameHint ? (
              <p className="mt-1 text-[11px] font-medium text-red-700">
                {usernameHint}
              </p>
            ) : null}
            <span className="text-[11px] leading-snug text-zinc-500">
              Used for your shareable profile link. Lowercase; 3–40 characters;
              letters, numbers, underscore, or hyphen. Must be unique.
            </span>
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
              <label className="flex cursor-pointer items-start gap-3 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-zinc-300 text-amber-900 focus:ring-amber-900/30"
                  checked={publicPhoneOnProfile}
                  onChange={(e) => setPublicPhoneOnProfile(e.target.checked)}
                />
                <span>
                  Show my phone on my public profile page (only when a number is
                  saved above).
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-zinc-300 text-amber-900 focus:ring-amber-900/30"
                  checked={publicEmailOnProfile}
                  onChange={(e) => setPublicEmailOnProfile(e.target.checked)}
                />
                <span>
                  Show my account email on my public profile page.
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
            <div className="mt-4 space-y-8">
              <input
                ref={bannerFileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  void onUpload('banner', e.target.files?.[0] ?? null);
                  e.target.value = '';
                }}
              />
              <div>
                <span className="text-xs font-medium text-zinc-600">
                  Banner image
                </span>
                <p className="mt-1 text-[11px] leading-snug text-zinc-500">
                  Wide image across the top of your public profile. JPG, PNG,
                  or WebP up to 8MB.
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="relative aspect-[21/9] w-full max-w-xl overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200">
                    {bannerImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- Firebase Storage URL
                      <img
                        src={bannerImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full min-h-[120px] items-center justify-center text-sm text-zinc-400">
                        No banner yet
                      </div>
                    )}
                    {uploading === 'banner' ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => bannerFileRef.current?.click()}
                    disabled={uploading !== null}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4" />
                    {bannerImageUrl ? 'Replace banner' : 'Upload banner'}
                  </button>
                </div>
              </div>

              <input
                ref={profileFileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  void onUpload('profile', e.target.files?.[0] ?? null);
                  e.target.value = '';
                }}
              />
              <div>
                <span className="text-xs font-medium text-zinc-600">
                  Profile image
                </span>
                <p className="mt-1 text-[11px] leading-snug text-zinc-500">
                  Square-ish photo works best; shown on directory cards and your
                  public page.
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full bg-zinc-100 ring-2 ring-zinc-200">
                    {profileImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profileImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                        Photo
                      </div>
                    )}
                    {uploading === 'profile' ? (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
                        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => profileFileRef.current?.click()}
                    disabled={uploading !== null}
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4" />
                    {profileImageUrl ? 'Replace photo' : 'Upload profile photo'}
                  </button>
                </div>
              </div>

              <input
                ref={galleryFilesRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                disabled={galleryImageUrls.length >= DIRECTORY_GALLERY_MAX}
                onChange={(e) => {
                  void onGalleryPickMultiple(e.target.files);
                  e.target.value = '';
                }}
              />
              <div className="space-y-2">
                <span className="text-xs font-medium text-zinc-600">
                  Portfolio gallery
                </span>
                <p className="text-[11px] leading-snug text-zinc-500">
                  Add 3–15 images for your public listing. You can select{' '}
                  <strong>multiple files at once</strong> (up to your remaining
                  slots). Cards use your profile image first, then gallery shots.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => galleryFilesRef.current?.click()}
                    disabled={
                      uploading !== null ||
                      galleryImageUrls.length >= DIRECTORY_GALLERY_MAX
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4" />
                    {galleryImageUrls.length >= DIRECTORY_GALLERY_MAX
                      ? 'Gallery full'
                      : 'Upload images'}
                  </button>
                  {uploading === 'gallery' ? (
                    <span className="inline-flex items-center gap-2 text-sm text-zinc-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading…
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-zinc-500">
                  {galleryImageUrls.length} / {DIRECTORY_GALLERY_MAX} · minimum 3
                  when you include any portfolio images
                </p>
                {galleryImageUrls.length > 0 ? (
                  <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {galleryImageUrls.map((url, i) => (
                      <li key={`${url}-${i}`} className="relative aspect-square">
                        {/* eslint-disable-next-line @next/next/no-img-element -- remote uploads */}
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full rounded-lg object-cover ring-1 ring-zinc-200"
                        />
                        <button
                          type="button"
                          title="Remove"
                          onClick={() =>
                            setGalleryImageUrls((prev) =>
                              prev.filter((_, j) => j !== i),
                            )
                          }
                          className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900/85 text-white shadow hover:bg-zinc-900"
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
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
