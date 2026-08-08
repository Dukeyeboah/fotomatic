'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { updateProfile } from 'firebase/auth';
import {
  updateUserDocument,
  type UserData,
} from '@/lib/firebase/user-profile';
import {
  uploadPhotographerGalleryImage,
  uploadPhotographerMedia,
  uploadUserProfileAvatar,
} from '@/lib/firebase/upload';
import { DIRECTORY_GALLERY_MAX } from '@/lib/photographers-directory';
import { COUNTRY_NAMES } from '@/lib/countries';
import {
  composeInternationalPhone,
  COUNTRY_DIAL_BY_NAME,
  dialInfoForCountry,
  splitStoredPhone,
} from '@/lib/country-dial-codes';
import {
  parsePhotographyFocusesFromFirestore,
  resolvePhotographyFocusesFromForm,
  serializePhotographyFocuses,
  isPresetPhotographyFocus,
} from '@/lib/photography-focus';
import { PhotographyFocusPicker } from '@/components/photography-focus-picker';
import { PhotographerPricingFields } from '@/components/photographer-pricing-fields';
import {
  parseEventPricingFromFirestore,
  sanitizeEventPricingRows,
  sanitizePricingNotes,
  clampStartingPrice,
} from '@/lib/photographer-pricing';
import type { FocusEventPricing } from '@/lib/photographer-pricing';
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
import { useAuth } from '@/contexts/AuthContext';
import { ImageUploadField } from '@/components/image-upload-field';
import { ImageEditMenu } from '@/components/image-edit-menu';
import {
  ImageCropDialog,
  fileToObjectUrl,
} from '@/components/image-crop-dialog';
import { prepareImageForUpload, IMAGE_UPLOAD_MAX_BYTES } from '@/lib/prepare-image-upload';
import { Loader2, X, ChevronDown } from 'lucide-react';

const FIELD_INPUT_CLASS =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 caret-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20';

const BIO_MAX_CHARS = 500;
const IMAGE_MAX_MB = Math.round(IMAGE_UPLOAD_MAX_BYTES / (1024 * 1024));

const FIELD_TEXTAREA_CLASS =
  'w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 caret-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20';

async function suggestAvailableUsernames(
  baseRaw: string,
  uid: string,
): Promise<string[]> {
  const base = normalizePublicProfileSlug(baseRaw).replace(/[^a-z0-9_-]/g, '');
  const seed = base.length >= 3 ? base.slice(0, 32) : `user${uid.slice(0, 4)}`;
  const out: string[] = [];
  for (let i = 1; i <= 12 && out.length < 3; i++) {
    const candidate = `${seed}${i}`;
    if (!isValidPublicProfileSlug(candidate) || isReservedProfileSlug(candidate)) {
      continue;
    }
    if (await isUsernameClaimAvailable(candidate, uid)) out.push(candidate);
  }
  return out;
}

function CollapsibleCard({
  title,
  subtitle,
  defaultOpen = false,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white shadow-sm ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 truncate text-xs text-zinc-500">{subtitle}</p>
          ) : null}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          strokeWidth={1.75}
        />
      </button>
      {open ? (
        <div className="border-t border-zinc-100 px-4 pb-4 pt-3">{children}</div>
      ) : null}
    </div>
  );
}

type Props = {
  user: User;
  userData: UserData;
  onSaved: () => Promise<void>;
  /** Extra prominence for banner + profile image (photographer onboarding). */
  showMediaUploads?: boolean;
  /** Leave edit mode without saving (shows Cancel). */
  onCancel?: () => void;
  /** Leave edit mode after finishing (shows Done). */
  onDone?: () => void;
};

export function ProfileSettingsForm({
  user,
  userData,
  onSaved,
  showMediaUploads = false,
  onCancel,
  onDone,
}: Props) {
  const { refreshAuthUser } = useAuth();
  const ph = userData.photographer ?? {};
  const [displayName, setDisplayName] = useState(
    userData.displayName ?? user.displayName ?? '',
  );
  const [username, setUsername] = useState(userData.username ?? '');
  const [city, setCity] = useState(userData.city ?? ph.city ?? '');
  const [state, setState] = useState(userData.state ?? ph.state ?? '');
  const [country, setCountry] = useState(userData.country ?? ph.country ?? '');
  const [bio, setBio] = useState(ph.bio ?? '');
  const initialFocuses = parsePhotographyFocusesFromFirestore({
    photographyFocuses: ph.photographyFocuses,
    photographyFocus: ph.photographyFocus,
    style: ph.style,
  });
  const [photoFocusSelected, setPhotoFocusSelected] = useState<string[]>(() => {
    const presets = initialFocuses.filter((f) => isPresetPhotographyFocus(f));
    const custom = initialFocuses.filter((f) => !isPresetPhotographyFocus(f));
    if (custom.length > 0) return [...presets, 'Other'];
    return presets;
  });
  const [photoFocusOther, setPhotoFocusOther] = useState(() =>
    initialFocuses.find((f) => !isPresetPhotographyFocus(f)) ?? '',
  );
  const [interests, setInterests] = useState(ph.interests ?? '');
  const [behance, setBehance] = useState(ph.behance ?? '');
  const [instagram, setInstagram] = useState(ph.instagram ?? '');
  const [twitter, setTwitter] = useState(ph.twitter ?? '');
  const [facebook, setFacebook] = useState(ph.facebook ?? '');
  const [linkedin, setLinkedin] = useState(ph.linkedin ?? '');
  const [website, setWebsite] = useState(ph.website ?? '');
  const [portfolioUrl, setPortfolioUrl] = useState(ph.portfolioUrl ?? '');
  const initialPhoneParts = splitStoredPhone(
    ph.phone,
    userData.country ?? ph.country,
  );
  const [phoneDial, setPhoneDial] = useState(initialPhoneParts.dial);
  const [phoneAbbr, setPhoneAbbr] = useState(initialPhoneParts.abbr);
  const [phoneNational, setPhoneNational] = useState(initialPhoneParts.national);
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
  const [startingPrice, setStartingPrice] = useState<number | ''>(() => {
    const n =
      typeof ph.startingPrice === 'number'
        ? ph.startingPrice
        : typeof ph.hourlyRate === 'number'
          ? ph.hourlyRate
          : NaN;
    return Number.isFinite(n) && n > 0 ? n : '';
  });
  const [pricingNotes, setPricingNotes] = useState(ph.pricingNotes ?? '');
  const [eventPricing, setEventPricing] = useState<FocusEventPricing[]>(() =>
    parseEventPricingFromFirestore(ph.eventPricing),
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
  const [contactEmail, setContactEmail] = useState(
    () => (userData.email ?? user.email ?? '').trim(),
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<
    'banner' | 'profile' | 'gallery' | 'clientAvatar' | null
  >(null);
  const [message, setMessage] = useState<string | null>(null);
  const [usernameHint, setUsernameHint] = useState<string | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [cropSession, setCropSession] = useState<{
    kind: 'banner' | 'profile' | 'gallery' | 'clientAvatar';
    src: string;
    fileName: string;
  } | null>(null);

  const isPhotographer = userData.role === 'photographer';
  const isAdmin = userData.role === 'admin';
  const showClientProfilePhoto =
    userData.role === 'user' || userData.role === 'admin';
  const [clientProfilePhotoUrl, setClientProfilePhotoUrl] = useState(() =>
    showClientProfilePhoto
      ? (userData.photoURL ?? user.photoURL ?? '').trim()
      : '',
  );
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const leaveActionRef = useRef<'cancel' | 'done' | null>(null);

  const formSnapshot = useMemo(
    () =>
      JSON.stringify({
        displayName,
        username,
        city,
        state,
        country,
        bio,
        photoFocusSelected,
        photoFocusOther,
        interests,
        behance,
        instagram,
        twitter,
        facebook,
        linkedin,
        website,
        portfolioUrl,
        phoneDial,
        phoneNational,
        phoneContact,
        emailContact,
        publicPhoneOnProfile,
        publicEmailOnProfile,
        serviceArea,
        openToOtherAreas,
        startingPrice,
        pricingNotes,
        eventPricing,
        bannerImageUrl,
        profileImageUrl,
        galleryImageUrls,
        contactEmail,
        clientProfilePhotoUrl,
      }),
    [
      displayName,
      username,
      city,
      state,
      country,
      bio,
      photoFocusSelected,
      photoFocusOther,
      interests,
      behance,
      instagram,
      twitter,
      facebook,
      linkedin,
      website,
      portfolioUrl,
      phoneDial,
      phoneNational,
      phoneContact,
      emailContact,
      publicPhoneOnProfile,
      publicEmailOnProfile,
      serviceArea,
      openToOtherAreas,
      startingPrice,
      pricingNotes,
      eventPricing,
      bannerImageUrl,
      profileImageUrl,
      galleryImageUrls,
      contactEmail,
      clientProfilePhotoUrl,
    ],
  );

  const baselineRef = useRef(formSnapshot);
  const dirty = formSnapshot !== baselineRef.current;

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!saveToast) return;
    const t = window.setTimeout(() => setSaveToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [saveToast]);

  const requestLeave = (action: 'cancel' | 'done') => {
    const leave = action === 'cancel' ? onCancel : onDone;
    if (!leave) return;
    if (!dirty) {
      leave();
      return;
    }
    leaveActionRef.current = action;
    setLeaveConfirmOpen(true);
  };

  const confirmLeave = () => {
    const action = leaveActionRef.current;
    setLeaveConfirmOpen(false);
    leaveActionRef.current = null;
    if (action === 'cancel') onCancel?.();
    else if (action === 'done') onDone?.();
  };

  const closeCrop = () => {
    if (cropSession?.src) URL.revokeObjectURL(cropSession.src);
    setCropSession(null);
  };

  const beginCropFromFiles = async (
    kind: 'banner' | 'profile' | 'gallery' | 'clientAvatar',
    files: FileList | null,
  ) => {
    const raw = files?.[0] ?? null;
    if (!raw) return;
    setMessage(null);
    try {
      const prepared = await prepareImageForUpload(raw);
      const src = fileToObjectUrl(prepared);
      setCropSession({ kind, src, fileName: prepared.name });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not open image.');
    }
  };

  const uploadCroppedFile = async (file: File) => {
    if (!cropSession) return;
    const kind = cropSession.kind;
    closeCrop();
    setUploading(kind === 'clientAvatar' ? 'clientAvatar' : kind);
    setMessage(null);
    try {
      if (kind === 'banner' || kind === 'profile') {
        const url = await uploadPhotographerMedia(user.uid, kind, file);
        if (kind === 'banner') setBannerImageUrl(url!);
        else setProfileImageUrl(url!);
      } else if (kind === 'clientAvatar') {
        const url = await uploadUserProfileAvatar(user.uid, file);
        if (url) setClientProfilePhotoUrl(url);
      } else {
        let room = DIRECTORY_GALLERY_MAX - galleryImageUrls.length;
        if (room <= 0) {
          setMessage(`Portfolio is limited to ${DIRECTORY_GALLERY_MAX} images.`);
          return;
        }
        const url = await uploadPhotographerGalleryImage(user.uid, file);
        if (url) {
          setGalleryImageUrls((prev) =>
            [...prev, url].slice(0, DIRECTORY_GALLERY_MAX),
          );
        }
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not upload image.');
    } finally {
      setUploading(null);
    }
  };

  const checkUsernameAvailability = async (raw: string) => {
    if (!raw || raw.length < 3) {
      setUsernameHint(null);
      setUsernameSuggestions([]);
      return;
    }
    const n = normalizePublicProfileSlug(raw);
    if (!isValidPublicProfileSlug(n) || isReservedProfileSlug(n)) {
      setUsernameHint(
        'Username must be 3–40 characters (letters, numbers, underscore, hyphen).',
      );
      setUsernameSuggestions([]);
      return;
    }
    const avail = await isUsernameClaimAvailable(raw, user.uid);
    if (avail) {
      setUsernameHint(null);
      setUsernameSuggestions([]);
      return;
    }
    const suggestions = await suggestAvailableUsernames(n, user.uid);
    setUsernameHint(
      'That username is already taken. Please choose another.',
    );
    setUsernameSuggestions(suggestions);
  };

  const onClientAvatarUpload = async (files: FileList | null) => {
    await beginCropFromFiles('clientAvatar', files);
  };

  const onUpload = async (
    kind: 'banner' | 'profile',
    files: FileList | null,
  ) => {
    await beginCropFromFiles(kind, files);
  };

  const onGalleryPickMultiple = async (files: FileList | null) => {
    if (!files?.length || !showMediaUploads) return;
    setMessage(null);
    const room = DIRECTORY_GALLERY_MAX - galleryImageUrls.length;
    if (room <= 0) {
      setMessage(`Portfolio is limited to ${DIRECTORY_GALLERY_MAX} images.`);
      return;
    }

    const selected = Array.from(files).slice(0, room);
    // Single image: crop/adjust first. Multi-select: upload directly to fill slots.
    if (selected.length === 1) {
      const dt = new DataTransfer();
      dt.items.add(selected[0]!);
      await beginCropFromFiles('gallery', dt.files);
      return;
    }

    setUploading('gallery');
    let added = 0;
    const errors: string[] = [];
    try {
      for (const file of selected) {
        try {
          const url = await uploadPhotographerGalleryImage(user.uid, file);
          if (url) {
            added += 1;
            setGalleryImageUrls((prev) =>
              [...prev, url].slice(0, DIRECTORY_GALLERY_MAX),
            );
          } else {
            errors.push(file.name);
          }
        } catch (e) {
          errors.push(
            e instanceof Error ? `${file.name}: ${e.message}` : file.name,
          );
        }
      }
      if (added > 0 && errors.length === 0) {
        setMessage(
          `Added ${added} photo${added === 1 ? '' : 's'} to your portfolio.`,
        );
      } else if (added > 0 && errors.length > 0) {
        setMessage(
          `Added ${added} photo${added === 1 ? '' : 's'}. Some failed (${errors.length}). Max ${IMAGE_MAX_MB}MB each.`,
        );
      } else if (errors.length > 0) {
        setMessage(
          errors[0] ??
            `Could not upload photos. Each image must be under ${IMAGE_MAX_MB}MB.`,
        );
      }
    } finally {
      setUploading(null);
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
        'Portfolio: add at least 3 images or remove them all for now (maximum 20).',
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
      if (claim.reason.toLowerCase().includes('taken')) {
        const suggestions = await suggestAvailableUsernames(
          username.trim() || displayName || 'user',
          user.uid,
        );
        setUsernameHint(claim.reason);
        setUsernameSuggestions(suggestions);
      }
      return;
    }

    const patch: Partial<UserData> = {
      displayName: displayName.trim() || null,
      username: normalizedUsername,
      email: contactEmail.trim() || user.email || null,
      city: city.trim() || null,
      state: state.trim() || null,
      country: country.trim() || null,
    };
    const resolvedFocuses = resolvePhotographyFocusesFromForm({
      selectedPresets: photoFocusSelected,
      otherText: photoFocusOther,
    });
    const focusSummary = serializePhotographyFocuses(resolvedFocuses);
    const price =
      typeof startingPrice === 'number'
        ? clampStartingPrice(startingPrice)
        : NaN;
    if (isPhotographer && resolvedFocuses.length === 0) {
      setSaving(false);
      setMessage('Select at least one photography focus / specialty.');
      return;
    }
    if (isPhotographer && !Number.isFinite(price)) {
      setSaving(false);
      setMessage('Enter a default starting price for your events.');
      return;
    }
    const cleanedPricing = sanitizeEventPricingRows(
      eventPricing,
      [...PHOTOGRAPHY_FOCUS_OPTIONS, ...resolvedFocuses],
    );
    if (isPhotographer) {
      patch.photographer = {
        bio: bio.trim().slice(0, BIO_MAX_CHARS) || undefined,
        style: focusSummary || undefined,
        photographyFocus: focusSummary || undefined,
        photographyFocuses:
          resolvedFocuses.length > 0 ? resolvedFocuses : undefined,
        interests: interests.trim() || undefined,
        behance: behance.trim() || undefined,
        instagram: instagram.trim() || undefined,
        twitter: twitter.trim() || undefined,
        facebook: facebook.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
        website: website.trim() || undefined,
        portfolioUrl: portfolioUrl.trim() || undefined,
        phone:
          composeInternationalPhone(phoneDial, phoneNational) || undefined,
        phoneContact,
        emailContact,
        publicPhoneOnProfile,
        publicEmailOnProfile,
        serviceArea: serviceArea.trim() || undefined,
        openToOtherAreas,
        startingPrice: Number.isFinite(price) ? price : undefined,
        hourlyRate: Number.isFinite(price) ? price : undefined,
        eventPricing:
          cleanedPricing.length > 0 ? cleanedPricing : undefined,
        pricingNotes: sanitizePricingNotes(pricingNotes) || undefined,
        bannerImageUrl: bannerImageUrl.trim() || undefined,
        profileImageUrl: profileImageUrl.trim() || undefined,
        galleryImageUrls: galleryClean,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        country: country.trim() || undefined,
      };
    }
    if (showClientProfilePhoto) {
      patch.photoURL = clientProfilePhotoUrl.trim() || null;
    }
    const ok = await updateUserDocument(user.uid, patch);
    setSaving(false);
    if (ok) {
      baselineRef.current = formSnapshot;
      setSaveToast('Profile saved');
      setMessage(null);
      if (showClientProfilePhoto) {
        try {
          const u = clientProfilePhotoUrl.trim();
          await updateProfile(user, { photoURL: u || undefined });
          await refreshAuthUser();
        } catch (e) {
          console.error('updateProfile', e);
        }
      }
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

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <CollapsibleCard title="Account" defaultOpen={false}>
          <div className="grid flex-1 content-start gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">
                  Display name
                </span>
                <input
                  className={FIELD_INPUT_CLASS}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">
                  Username
                </span>
                <input
                  className={FIELD_INPUT_CLASS}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameHint(null);
                    setUsernameSuggestions([]);
                  }}
                  onBlur={() => void checkUsernameAvailability(username.trim())}
                  placeholder="e.g. aureon9"
                />
                {usernameHint ? (
                  <p className="mt-1 text-[11px] font-medium text-red-700">
                    {usernameHint}
                  </p>
                ) : null}
                {usernameSuggestions.length > 0 ? (
                  <p className="mt-1 text-[11px] text-zinc-600">
                    Try{' '}
                    {usernameSuggestions.map((s, i) => (
                      <span key={s}>
                        {i > 0 ? ', ' : null}
                        <button
                          type="button"
                          className="font-semibold text-amber-900 underline"
                          onClick={() => {
                            setUsername(s);
                            setUsernameHint(null);
                            setUsernameSuggestions([]);
                          }}
                        >
                          {s}
                        </button>
                      </span>
                    ))}
                  </p>
                ) : null}
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className="text-xs font-medium text-zinc-600">Email</span>
                <p className="mt-1 truncate text-sm text-zinc-900">
                  {user.email ?? '—'}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-zinc-600">
                  Account type
                </span>
                <p className="mt-1 text-sm capitalize text-zinc-900">
                  {isAdmin
                    ? 'Admin'
                    : isPhotographer
                      ? 'Photographer'
                      : 'Client'}
                </p>
              </div>
            </div>
            {showClientProfilePhoto ? (
              <ImageUploadField
                label="Profile photo"
                hint="Shown in the menu and anywhere your account appears."
                captureFacing="user"
                uploading={uploading === 'clientAvatar'}
                disabled={uploading !== null && uploading !== 'clientAvatar'}
                onPick={onClientAvatarUpload}
              >
                <div className="mt-2 flex items-center gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-zinc-100 ring-2 ring-zinc-200">
                    {clientProfilePhotoUrl.trim() ? (
                      // eslint-disable-next-line @next/next/no-img-element -- Firebase Storage URL
                      <img
                        src={clientProfilePhotoUrl.trim()}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-zinc-400">
                        No photo
                      </div>
                    )}
                  </div>
                  {clientProfilePhotoUrl.trim() ? (
                    <button
                      type="button"
                      disabled={uploading !== null}
                      onClick={() => setClientProfilePhotoUrl('')}
                      className="rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </ImageUploadField>
            ) : null}
          </div>
        </CollapsibleCard>

        <CollapsibleCard title="Location" defaultOpen={false}>
          <div className="grid flex-1 content-start gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">City</span>
                <input
                  className={FIELD_INPUT_CLASS}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">
                  State / region
                </span>
                <input
                  className={FIELD_INPUT_CLASS}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-600">Country</span>
              <select
                className={FIELD_INPUT_CLASS}
                value={country}
                onChange={(e) => {
                  const next = e.target.value;
                  setCountry(next);
                  const info = dialInfoForCountry(next);
                  setPhoneDial(info.dial);
                  setPhoneAbbr(info.abbr);
                }}
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
        </CollapsibleCard>
      </div>

      {isPhotographer ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-semibold text-zinc-900">
              Photographer profile
            </h2>

            {showMediaUploads ? (
              <div className="mt-4 space-y-6">
                <div className="relative pb-10">
                  <div className="relative aspect-[21/7] w-full overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-zinc-200">
                    {bannerImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- Firebase Storage URL
                      <img
                        src={bannerImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full min-h-[120px] items-center justify-center text-sm text-zinc-400">
                        Banner image
                      </div>
                    )}
                  </div>
                  <div className="absolute right-3 top-3 z-20">
                    <ImageEditMenu
                      label="Edit banner"
                      captureFacing="environment"
                      uploading={uploading === 'banner'}
                      disabled={uploading !== null && uploading !== 'banner'}
                      onPick={(files) => void onUpload('banner', files)}
                    />
                  </div>
                  <div className="absolute bottom-0 left-4 z-20 sm:left-6">
                    <div className="relative h-24 w-24 sm:h-28 sm:w-28">
                      <div className="h-full w-full overflow-hidden rounded-full bg-zinc-100 ring-4 ring-white">
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
                      </div>
                      <div className="absolute bottom-1 right-1 z-10">
                        <ImageEditMenu
                          label="Edit profile photo"
                          captureFacing="user"
                          uploading={uploading === 'profile'}
                          disabled={
                            uploading !== null && uploading !== 'profile'
                          }
                          onPick={(files) => void onUpload('profile', files)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 pt-2 lg:grid-cols-2 lg:items-start">
                  <label className="flex flex-col space-y-1">
                    <span className="text-xs font-medium text-zinc-600">
                      Bio
                    </span>
                    <textarea
                      maxLength={BIO_MAX_CHARS}
                      className={`${FIELD_TEXTAREA_CLASS} h-[240px] resize-none`}
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_CHARS))}
                      placeholder="A short intro clients will read on your public page…"
                    />
                    <span className="text-[11px] text-zinc-500">
                      {bio.length} / {BIO_MAX_CHARS} characters
                    </span>
                  </label>
                  <div className="flex h-[calc(240px+1.25rem)] flex-col">
                    <PhotographyFocusPicker
                      className="min-h-0 flex-1"
                      fillHeight
                      selected={photoFocusSelected}
                      onChange={setPhotoFocusSelected}
                      otherText={photoFocusOther}
                      onOtherTextChange={setPhotoFocusOther}
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:items-start">
                <label className="flex flex-col space-y-1">
                  <span className="text-xs font-medium text-zinc-600">Bio</span>
                  <textarea
                    maxLength={BIO_MAX_CHARS}
                    className={`${FIELD_TEXTAREA_CLASS} h-[240px] resize-none`}
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_CHARS))}
                    placeholder="A short intro clients will read on your public page…"
                  />
                  <span className="text-[11px] text-zinc-500">
                    {bio.length} / {BIO_MAX_CHARS} characters
                  </span>
                </label>
                <div className="flex h-[calc(240px+1.25rem)] flex-col">
                  <PhotographyFocusPicker
                    className="min-h-0 flex-1"
                    fillHeight
                    selected={photoFocusSelected}
                    onChange={setPhotoFocusSelected}
                    otherText={photoFocusOther}
                    onOtherTextChange={setPhotoFocusOther}
                    required
                  />
                </div>
              </div>
            )}
          </div>

          <CollapsibleCard title="Pricing" defaultOpen>
            <div className="space-y-4">
              <PhotographerPricingFields
                startingPrice={startingPrice}
                onStartingPriceChange={setStartingPrice}
                pricingNotes={pricingNotes}
                onPricingNotesChange={setPricingNotes}
                selectedFocuses={resolvePhotographyFocusesFromForm({
                  selectedPresets: photoFocusSelected,
                  otherText: photoFocusOther,
                })}
                eventPricing={eventPricing}
                onEventPricingChange={setEventPricing}
                inputClassName={FIELD_INPUT_CLASS}
                textareaClassName={FIELD_TEXTAREA_CLASS}
                compact
              />
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">
                  General pricing notes (optional)
                </span>
                <textarea
                  rows={3}
                  className={FIELD_TEXTAREA_CLASS}
                  placeholder="Share how pricing works across your shoots (minimums, deposits, typical add-ons)…"
                  value={pricingNotes}
                  onChange={(e) => setPricingNotes(e.target.value)}
                />
              </label>
            </div>
          </CollapsibleCard>

          <CollapsibleCard title="Service area & contact details" defaultOpen>
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-3">
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-zinc-600">
                      Primary service area
                    </span>
                    <input
                      className={FIELD_INPUT_CLASS}
                      value={serviceArea}
                      onChange={(e) => setServiceArea(e.target.value)}
                      placeholder="e.g. Greater Accra"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-zinc-600">
                      Interests
                    </span>
                    <input
                      className={FIELD_INPUT_CLASS}
                      value={interests}
                      onChange={(e) => setInterests(e.target.value)}
                    />
                  </label>
                </div>
                <div className="space-y-3">
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-zinc-600">
                      Phone
                    </span>
                    <div className="flex min-w-0 gap-1.5">
                      <select
                        className={`${FIELD_INPUT_CLASS} w-[5.75rem] shrink-0 px-1.5 text-xs sm:w-[6.25rem]`}
                        aria-label="Country calling code"
                        value={phoneDial}
                        onChange={(e) => {
                          const dial = e.target.value;
                          setPhoneDial(dial);
                          const entry = Object.entries(COUNTRY_DIAL_BY_NAME).find(
                            ([, info]) => info.dial === dial,
                          );
                          if (entry) {
                            setPhoneAbbr(entry[1].abbr);
                            if (!country.trim()) setCountry(entry[0]);
                          }
                        }}
                      >
                        <option value="">Code</option>
                        {Object.entries(COUNTRY_DIAL_BY_NAME)
                          .slice()
                          .sort((a, b) => a[0].localeCompare(b[0]))
                          .map(([name, info]) => (
                            <option key={name} value={info.dial} title={name}>
                              {info.abbr} +{info.dial}
                            </option>
                          ))}
                      </select>
                      <input
                        inputMode="tel"
                        className={`${FIELD_INPUT_CLASS} min-w-0 flex-1`}
                        value={phoneNational}
                        onChange={(e) =>
                          setPhoneNational(
                            e.target.value.replace(/[^\d\s-]/g, ''),
                          )
                        }
                        placeholder="0209277789"
                        aria-label="Phone number"
                      />
                    </div>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-zinc-600">
                      Email
                    </span>
                    <input
                      type="email"
                      className={FIELD_INPUT_CLASS}
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </label>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-700">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded border-zinc-300 text-amber-900 focus:ring-amber-900/30"
                    checked={openToOtherAreas}
                    onChange={(e) => setOpenToOtherAreas(e.target.checked)}
                  />
                  <span>Open to work outside primary area</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded border-zinc-300 text-amber-900 focus:ring-amber-900/30"
                    checked={phoneContact}
                    onChange={(e) => setPhoneContact(e.target.checked)}
                  />
                  <span>OK to contact by phone</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded border-zinc-300 text-amber-900 focus:ring-amber-900/30"
                    checked={emailContact}
                    onChange={(e) => setEmailContact(e.target.checked)}
                  />
                  <span>OK to contact by email</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded border-zinc-300 text-amber-900 focus:ring-amber-900/30"
                    checked={publicPhoneOnProfile}
                    onChange={(e) => setPublicPhoneOnProfile(e.target.checked)}
                  />
                  <span>Show phone publicly</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded border-zinc-300 text-amber-900 focus:ring-amber-900/30"
                    checked={publicEmailOnProfile}
                    onChange={(e) => setPublicEmailOnProfile(e.target.checked)}
                  />
                  <span>Show email publicly</span>
                </label>
              </div>
            </div>
          </CollapsibleCard>

          {showMediaUploads ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <div className="text-center sm:text-left">
                  <p className="text-sm font-semibold text-zinc-900">
                    Portfolio gallery
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {galleryImageUrls.length} / {DIRECTORY_GALLERY_MAX} images ·
                    scroll horizontally
                  </p>
                </div>
                <ImageEditMenu
                  label="Add portfolio photos"
                  allowCamera={false}
                  multiple
                  uploading={uploading === 'gallery'}
                  disabled={
                    galleryImageUrls.length >= DIRECTORY_GALLERY_MAX ||
                    (uploading !== null && uploading !== 'gallery')
                  }
                  onPick={onGalleryPickMultiple}
                />
              </div>
              <p className="mt-2 text-center text-[11px] text-zinc-500 sm:text-left">
                Select multiple images at once (up to {DIRECTORY_GALLERY_MAX}).
                Max {IMAGE_MAX_MB}MB each · photos are compressed for faster
                loading.
              </p>
              <div className="mt-4 flex justify-center">
                <div className="flex w-full max-w-4xl justify-center gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin]">
                  {galleryImageUrls.length === 0 ? (
                    <div className="flex h-32 w-full items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-sm text-zinc-500">
                      No gallery images yet — use the edit button to add photos
                    </div>
                  ) : (
                    galleryImageUrls.map((url, i) => (
                      <div
                        key={`${url}-${i}`}
                        className="relative h-32 w-32 shrink-0 sm:h-36 sm:w-36"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- remote uploads */}
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full rounded-xl object-cover ring-1 ring-zinc-200"
                        />
                        <button
                          type="button"
                          title="Remove"
                          onClick={() =>
                            setGalleryImageUrls((prev) =>
                              prev.filter((_, j) => j !== i),
                            )
                          }
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900/85 text-white shadow hover:bg-zinc-900"
                        >
                          <X className="h-3 w-3" strokeWidth={2.5} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-semibold text-zinc-900">Social & links</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">
                  Behance
                </span>
                <input
                  className={FIELD_INPUT_CLASS}
                  value={behance}
                  onChange={(e) => setBehance(e.target.value)}
                  placeholder="https://www.behance.net/yourname"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">
                  Instagram
                </span>
                <input
                  className={FIELD_INPUT_CLASS}
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://www.instagram.com/yourname"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">
                  Twitter / X
                </span>
                <input
                  className={FIELD_INPUT_CLASS}
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://x.com/yourname"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">
                  Facebook
                </span>
                <input
                  className={FIELD_INPUT_CLASS}
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://www.facebook.com/yourname"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">
                  LinkedIn
                </span>
                <input
                  className={FIELD_INPUT_CLASS}
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://www.linkedin.com/in/yourname"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">
                  Website
                </span>
                <input
                  className={FIELD_INPUT_CLASS}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.yourwebsite.com"
                />
              </label>
              <label className="block space-y-1 sm:col-span-2 lg:col-span-3">
                <span className="text-xs font-medium text-zinc-600">
                  Portfolio / other link
                </span>
                <input
                  className={FIELD_INPUT_CLASS}
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://"
                />
              </label>
            </div>
          </div>
        </div>
      ) : null}

      <ImageCropDialog
        open={Boolean(cropSession)}
        imageSrc={cropSession?.src ?? null}
        fileName={cropSession?.fileName}
        aspect={
          cropSession?.kind === 'banner'
            ? 21 / 7
            : cropSession?.kind === 'profile' ||
                cropSession?.kind === 'clientAvatar'
              ? 1
              : 1
        }
        circular={
          cropSession?.kind === 'profile' ||
          cropSession?.kind === 'clientAvatar'
        }
        title={
          cropSession?.kind === 'banner'
            ? 'Adjust banner'
            : cropSession?.kind === 'gallery'
              ? 'Adjust gallery photo'
              : 'Adjust profile photo'
        }
        onCancel={closeCrop}
        onConfirm={uploadCroppedFile}
      />

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-6">
        {onCancel ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => requestLeave('cancel')}
            className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={saving || Boolean(usernameHint)}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
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
        {onDone ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => requestLeave('done')}
            className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
          >
            Done
          </button>
        ) : null}
      </div>

      {saveToast ? (
        <div
          className="fixed bottom-6 left-1/2 z-[220] -translate-x-1/2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-2xl"
          role="status"
        >
          {saveToast}
        </div>
      ) : null}

      {leaveConfirmOpen ? (
        <div
          className="fixed inset-0 z-[230] flex items-center justify-center bg-black/45 p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLeaveConfirmOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-edit-title"
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl"
          >
            <h2
              id="leave-edit-title"
              className="font-serif text-xl font-medium text-zinc-900"
            >
              Discard unsaved changes?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              Leaving this page will cause your unsaved changes to be lost.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                onClick={() => {
                  setLeaveConfirmOpen(false);
                  leaveActionRef.current = null;
                }}
              >
                Keep editing
              </button>
              <button
                type="button"
                className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                onClick={confirmLeave}
              >
                Leave without saving
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}

