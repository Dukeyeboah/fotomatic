'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Loader2, X, ChevronDown } from 'lucide-react';
import type { Photographer } from '@/lib/firebase/firestore';
import {
  getUserData,
  type UserData,
} from '@/lib/firebase/user-profile';
import { adminUpdateUser } from '@/lib/firebase/admin-actions';
import {
  adminDeletePhotographer,
  adminPermanentlyDeletePhotographerDoc,
  adminUpsertPhotographer,
} from '@/lib/firebase/photographers-directory-admin';
import { syncPhotographerPublicDirectory } from '@/lib/firebase/sync-photographer-directory';
import {
  DIRECTORY_GALLERY_MAX,
  photographerPlaceholderImagePath,
} from '@/lib/photographers-directory';
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
  PHOTOGRAPHY_FOCUS_OPTIONS,
} from '@/lib/photography-focus';
import { PhotographyFocusPicker } from '@/components/photography-focus-picker';
import { PhotographerPricingFields } from '@/components/photographer-pricing-fields';
import {
  parseEventPricingFromFirestore,
  sanitizeEventPricingRows,
  sanitizePricingNotes,
  clampStartingPrice,
  type FocusEventPricing,
} from '@/lib/photographer-pricing';
import {
  uploadPhotographerGalleryImage,
  uploadPhotographerMedia,
} from '@/lib/firebase/upload';
import { ImageEditMenu } from '@/components/image-edit-menu';
import {
  ImageCropDialog,
  fileToObjectUrl,
} from '@/components/image-crop-dialog';

const FIELD_INPUT_CLASS =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 caret-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20 disabled:bg-zinc-50 disabled:text-zinc-700';

const FIELD_TEXTAREA_CLASS =
  'w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 caret-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20 disabled:bg-zinc-50 disabled:text-zinc-700';

type DirDoc = Photographer & Record<string, unknown>;

function resolveApplicantUid(p: DirDoc): string | null {
  const fromField =
    typeof p.applicantUserId === 'string' ? p.applicantUserId.trim() : '';
  if (fromField) return fromField;
  if (typeof p.id === 'string' && p.id.startsWith('p-') && p.id.length > 2) {
    return p.id.slice(2);
  }
  return null;
}

function displayNameFrom(p: DirDoc, user: UserData | null): string {
  if (user?.displayName?.trim()) return user.displayName.trim();
  const n = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
  return n || (typeof p.name === 'string' ? p.name : 'Photographer');
}

function CollapsibleCard({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
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

export function AdminPhotographerProfileModal({
  photographer,
  open,
  onClose,
}: {
  photographer: Photographer | null;
  open: boolean;
  onClose: () => void;
}) {
  const dir = photographer as DirDoc | null;
  const uid = useMemo(
    () => (dir ? resolveApplicantUid(dir) : null),
    [dir],
  );

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [loadingUser, setLoadingUser] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<
    'banner' | 'profile' | 'gallery' | null
  >(null);
  const [cropSession, setCropSession] = useState<{
    kind: 'banner' | 'profile' | 'gallery';
    src: string;
    fileName: string;
  } | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [openToOtherAreas, setOpenToOtherAreas] = useState(false);
  const [phoneDial, setPhoneDial] = useState('');
  const [phoneAbbr, setPhoneAbbr] = useState('');
  const [phoneNational, setPhoneNational] = useState('');
  const [phoneContact, setPhoneContact] = useState(false);
  const [emailContact, setEmailContact] = useState(false);
  const [publicPhoneOnProfile, setPublicPhoneOnProfile] = useState(false);
  const [publicEmailOnProfile, setPublicEmailOnProfile] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [startingPrice, setStartingPrice] = useState<number | ''>('');
  const [pricingNotes, setPricingNotes] = useState('');
  const [eventPricing, setEventPricing] = useState<FocusEventPricing[]>([]);
  const [photoFocusSelected, setPhotoFocusSelected] = useState<string[]>([]);
  const [photoFocusOther, setPhotoFocusOther] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([]);
  const [behance, setBehance] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [facebook, setFacebook] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  const editing = mode === 'edit';
  const listed = dir?.listed !== false;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !dir) return;
    setMode('view');
    setMessage(null);

    let cancelled = false;
    (async () => {
      setLoadingUser(true);
      const loaded = uid ? await getUserData(uid) : null;
      if (cancelled) return;
      setUserData(loaded);
      setLoadingUser(false);

      const ph = loaded?.photographer ?? {};
      const name = displayNameFrom(dir, loaded);
      setDisplayName(name);
      setUsername(loaded?.username?.trim() || (typeof dir.profileSlug === 'string' ? dir.profileSlug : '') || '');
      setEmail(loaded?.email || dir.email || '');
      setContactEmail(loaded?.email || dir.email || '');
      setCity((ph.city || loaded?.city || dir.city || '') as string);
      setState((ph.state || loaded?.state || dir.state || '') as string);
      setCountry((ph.country || loaded?.country || dir.country || '') as string);
      setBio((ph.bio || (typeof dir.bio === 'string' ? dir.bio : '') || '') as string);
      setInterests((ph.interests || (typeof dir.interests === 'string' ? dir.interests : '') || '') as string);
      setServiceArea((ph.serviceArea || (typeof dir.serviceArea === 'string' ? dir.serviceArea : '') || '') as string);
      setOpenToOtherAreas(ph.openToOtherAreas === true || dir.openToOtherAreas === true);
      const phoneRaw =
        ph.phone || (typeof dir.phone === 'string' ? dir.phone : '') || '';
      const split = splitStoredPhone(phoneRaw);
      const countryForDial =
        (ph.country || loaded?.country || dir.country || '') as string;
      const dialInfo = dialInfoForCountry(countryForDial);
      setPhoneDial(split.dial || dialInfo.dial);
      setPhoneAbbr(split.abbr || dialInfo.abbr);
      setPhoneNational(split.national);
      setPhoneContact(ph.phoneContact === true || dir.phoneContact === true);
      setEmailContact(ph.emailContact === true || dir.emailContact === true);
      setPublicPhoneOnProfile(
        typeof ph.publicPhoneOnProfile === 'boolean'
          ? ph.publicPhoneOnProfile
          : dir.publicPhoneOnProfile === true,
      );
      setPublicEmailOnProfile(
        typeof ph.publicEmailOnProfile === 'boolean'
          ? ph.publicEmailOnProfile
          : dir.publicEmailOnProfile === true,
      );
      const priceRaw =
        typeof ph.startingPrice === 'number'
          ? ph.startingPrice
          : typeof dir.startingPrice === 'number'
            ? dir.startingPrice
            : typeof dir.startingHourlyRate === 'number'
              ? dir.startingHourlyRate
              : '';
      setStartingPrice(
        typeof priceRaw === 'number' && Number.isFinite(priceRaw)
          ? priceRaw
          : '',
      );
      setPricingNotes(
        ph.pricingNotes ||
          (typeof dir.pricingNotes === 'string' ? dir.pricingNotes : '') ||
          '',
      );
      setEventPricing(
        parseEventPricingFromFirestore(
          ph.eventPricing ?? dir.eventPricing ?? [],
        ),
      );
      const focuses = parsePhotographyFocusesFromFirestore({
        photographyFocuses: ph.photographyFocuses ?? dir.photographyFocuses,
        photographyFocus: ph.photographyFocus ?? dir.photographyFocus,
      });
      setPhotoFocusSelected(focuses.filter(isPresetPhotographyFocus));
      setPhotoFocusOther(
        focuses.filter((f) => !isPresetPhotographyFocus(f)).join(', '),
      );
      setBannerImageUrl(
        ph.bannerImageUrl ||
          (typeof dir.bannerImageUrl === 'string' ? dir.bannerImageUrl : '') ||
          '',
      );
      setProfileImageUrl(
        ph.profileImageUrl ||
          dir.photoUrl ||
          loaded?.photoURL ||
          '',
      );
      const gallery =
        Array.isArray(ph.galleryImageUrls) && ph.galleryImageUrls.length > 0
          ? ph.galleryImageUrls
          : Array.isArray(dir.galleryImageUrls)
            ? (dir.galleryImageUrls as string[])
            : [];
      setGalleryImageUrls(
        gallery.filter((u) => typeof u === 'string' && u.trim()).slice(0, DIRECTORY_GALLERY_MAX),
      );
      setBehance(ph.behance || '');
      setInstagram(ph.instagram || dir.instagram || '');
      setTwitter(ph.twitter || (typeof dir.twitter === 'string' ? dir.twitter : '') || '');
      setFacebook(ph.facebook || (typeof dir.facebook === 'string' ? dir.facebook : '') || '');
      setLinkedin(ph.linkedin || '');
      setWebsite(ph.website || dir.website || '');
      setPortfolioUrl(
        ph.portfolioUrl ||
          (typeof dir.portfolioLinks === 'string' ? dir.portfolioLinks : '') ||
          '',
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [open, dir, uid]);

  const beginCropFromFiles = async (
    kind: 'banner' | 'profile' | 'gallery',
    files: FileList | File[] | null,
  ) => {
    const list = files ? Array.from(files) : [];
    const file = list[0];
    if (!file) return;
    const src = await fileToObjectUrl(file);
    setCropSession({ kind, src, fileName: file.name });
  };

  const onCropped = async (file: File) => {
    if (!cropSession || !uid) return;
    const kind = cropSession.kind;
    setCropSession(null);
    setUploading(kind === 'gallery' ? 'gallery' : kind);
    try {
      if (kind === 'banner' || kind === 'profile') {
        const url = await uploadPhotographerMedia(uid, kind, file);
        if (kind === 'banner') setBannerImageUrl(url!);
        else setProfileImageUrl(url!);
      } else {
        const url = await uploadPhotographerGalleryImage(uid, file);
        if (url) {
          setGalleryImageUrls((prev) =>
            [...prev, url].slice(0, DIRECTORY_GALLERY_MAX),
          );
        }
      }
    } catch (e) {
      console.error(e);
      setMessage('Image upload failed.');
    } finally {
      setUploading(null);
    }
  };

  const onGalleryPick = async (files: FileList | null) => {
    if (!files?.length || !uid) return;
    const room = DIRECTORY_GALLERY_MAX - galleryImageUrls.length;
    if (room <= 0) {
      setMessage(`Portfolio is limited to ${DIRECTORY_GALLERY_MAX} images.`);
      return;
    }
    const selected = Array.from(files).slice(0, room);
    if (selected.length === 1) {
      await beginCropFromFiles('gallery', selected);
      return;
    }
    setUploading('gallery');
    setMessage(null);
    try {
      for (const file of selected) {
        try {
          const url = await uploadPhotographerGalleryImage(uid, file);
          if (url) {
            setGalleryImageUrls((prev) =>
              [...prev, url].slice(0, DIRECTORY_GALLERY_MAX),
            );
          }
        } catch (e) {
          console.error(e);
        }
      }
    } finally {
      setUploading(null);
    }
  };

  const onSave = async () => {
    if (!dir?.id) return;
    setSaving(true);
    setMessage(null);
    const resolvedFocuses = resolvePhotographyFocusesFromForm({
      selectedPresets: photoFocusSelected,
      otherText: photoFocusOther,
    });
    if (resolvedFocuses.length === 0) {
      setSaving(false);
      setMessage('Select at least one photography focus / specialty.');
      return;
    }
    const price =
      typeof startingPrice === 'number'
        ? clampStartingPrice(startingPrice)
        : NaN;
    if (!Number.isFinite(price)) {
      setSaving(false);
      setMessage('Enter a default starting price.');
      return;
    }
    const cleanedPricing = sanitizeEventPricingRows(
      eventPricing,
      [...PHOTOGRAPHY_FOCUS_OPTIONS, ...resolvedFocuses],
    );
    const focusSummary = serializePhotographyFocuses(resolvedFocuses);
    const galleryClean = galleryImageUrls
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, DIRECTORY_GALLERY_MAX);
    const phone =
      composeInternationalPhone(phoneDial, phoneNational) || undefined;
    const nameParts = displayName.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || dir.firstName || 'Photographer';
    const lastName =
      nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

    if (uid) {
      const patch: Partial<UserData> = {
        displayName: displayName.trim() || null,
        username: username.trim().toLowerCase() || null,
        email: contactEmail.trim() || email || null,
        city: city.trim() || null,
        state: state.trim() || null,
        country: country.trim() || null,
        photoURL: profileImageUrl.trim() || null,
        photographer: {
          ...(userData?.photographer ?? {}),
          directoryId: dir.id,
          bio: bio.trim() || undefined,
          style: focusSummary || undefined,
          photographyFocus: focusSummary || undefined,
          photographyFocuses: resolvedFocuses,
          interests: interests.trim() || undefined,
          behance: behance.trim() || undefined,
          instagram: instagram.trim() || undefined,
          twitter: twitter.trim() || undefined,
          facebook: facebook.trim() || undefined,
          linkedin: linkedin.trim() || undefined,
          website: website.trim() || undefined,
          portfolioUrl: portfolioUrl.trim() || undefined,
          phone,
          phoneContact,
          emailContact,
          publicPhoneOnProfile,
          publicEmailOnProfile,
          serviceArea: serviceArea.trim() || undefined,
          openToOtherAreas,
          startingPrice: price,
          hourlyRate: price,
          eventPricing: cleanedPricing.length > 0 ? cleanedPricing : undefined,
          pricingNotes: sanitizePricingNotes(pricingNotes) || undefined,
          bannerImageUrl: bannerImageUrl.trim() || undefined,
          profileImageUrl: profileImageUrl.trim() || undefined,
          galleryImageUrls: galleryClean,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          country: country.trim() || undefined,
        },
      };
      const res = await adminUpdateUser(uid, patch);
      if (!res.ok) {
        setSaving(false);
        setMessage(res.message);
        return;
      }
      const merged: UserData = {
        ...(userData ?? {
          uid,
          email: contactEmail.trim() || null,
          displayName: displayName.trim() || null,
          photoURL: profileImageUrl.trim() || null,
          role: 'photographer',
        }),
        ...patch,
        uid,
        role: 'photographer',
        photographer: {
          ...userData?.photographer,
          ...patch.photographer,
        },
      };
      await syncPhotographerPublicDirectory(merged, uid);
      setUserData(merged);
    } else {
      const res = await adminUpsertPhotographer(dir.id, {
        firstName,
        lastName,
        name: displayName.trim() || firstName,
        email: contactEmail.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        country: country.trim() || null,
        bio: bio.trim() || null,
        interests: interests.trim() || null,
        serviceArea: serviceArea.trim() || null,
        openToOtherAreas,
        phone: phone ?? null,
        phoneContact,
        emailContact,
        publicPhoneOnProfile,
        publicEmailOnProfile,
        startingPrice: price,
        startingHourlyRate: price,
        photographyFocus: focusSummary || null,
        photographyFocuses: resolvedFocuses,
        eventPricing: cleanedPricing.length > 0 ? cleanedPricing : null,
        pricingNotes: sanitizePricingNotes(pricingNotes) || null,
        bannerImageUrl: bannerImageUrl.trim() || null,
        photoUrl: profileImageUrl.trim() || null,
        galleryImageUrls: galleryClean.length > 0 ? galleryClean : null,
        website: website.trim() || null,
        instagram: instagram.trim() || null,
        twitter: twitter.trim() || null,
        facebook: facebook.trim() || null,
        portfolioLinks: portfolioUrl.trim() || null,
      });
      if (!res.ok) {
        setSaving(false);
        setMessage(res.message);
        return;
      }
    }

    setSaving(false);
    setMessage('Saved.');
    setMode('view');
  };

  if (!open || !dir) return null;

  const readOnly = !editing;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[min(94vh,960px)] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-zinc-50 shadow-2xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-photographer-modal-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Photographer profile
            </p>
            <h2
              id="admin-photographer-modal-title"
              className="mt-0.5 truncate font-serif text-xl font-medium text-zinc-900"
            >
              {displayName || 'Photographer'}
            </h2>
            {!listed ? (
              <p className="mt-0.5 text-xs font-medium text-amber-800">
                Hidden from directory
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {mode === 'view' ? (
              <button
                type="button"
                className="rounded-xl bg-zinc-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                onClick={() => setMode('edit')}
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                  onClick={() => setMode('view')}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-zinc-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                  onClick={() => void onSave()}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </>
            )}
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100"
              aria-label="Close"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {loadingUser ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
            </div>
          ) : (
            <div className="space-y-4">
              {message ? (
                <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-800">
                  {message}
                </p>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
                <CollapsibleCard title="Account" defaultOpen={false}>
                  <div className="grid gap-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block space-y-1">
                        <span className="text-xs font-medium text-zinc-600">
                          Display name
                        </span>
                        <input
                          className={FIELD_INPUT_CLASS}
                          value={displayName}
                          disabled={readOnly}
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
                          disabled={readOnly}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                      </label>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <span className="text-xs font-medium text-zinc-600">
                          Email
                        </span>
                        <p className="mt-1 truncate text-sm text-zinc-900">
                          {email || '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-zinc-600">
                          Account type
                        </span>
                        <p className="mt-1 text-sm capitalize text-zinc-900">
                          Photographer
                        </p>
                      </div>
                    </div>
                  </div>
                </CollapsibleCard>

                <CollapsibleCard title="Location" defaultOpen={false}>
                  <div className="grid gap-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block space-y-1">
                        <span className="text-xs font-medium text-zinc-600">
                          City
                        </span>
                        <input
                          className={FIELD_INPUT_CLASS}
                          value={city}
                          disabled={readOnly}
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
                          disabled={readOnly}
                          onChange={(e) => setState(e.target.value)}
                        />
                      </label>
                    </div>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-zinc-600">
                        Country
                      </span>
                      <select
                        className={FIELD_INPUT_CLASS}
                        value={country}
                        disabled={readOnly}
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

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
                <h2 className="text-sm font-semibold text-zinc-900">
                  Photographer profile
                </h2>
                <div className="mt-4 space-y-6">
                  <div className="relative pb-10">
                    <div className="relative aspect-[21/7] w-full overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-zinc-200">
                      {bannerImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
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
                    {editing && uid ? (
                      <div className="absolute right-3 top-3 z-20">
                        <ImageEditMenu
                          label="Edit banner"
                          captureFacing="environment"
                          uploading={uploading === 'banner'}
                          disabled={uploading !== null && uploading !== 'banner'}
                          onPick={(files) => void beginCropFromFiles('banner', files)}
                        />
                      </div>
                    ) : null}
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
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photographerPlaceholderImagePath(dir.id!)}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        {editing && uid ? (
                          <div className="absolute bottom-1 right-1 z-10">
                            <ImageEditMenu
                              label="Edit profile photo"
                              captureFacing="user"
                              uploading={uploading === 'profile'}
                              disabled={
                                uploading !== null && uploading !== 'profile'
                              }
                              onPick={(files) =>
                                void beginCropFromFiles('profile', files)
                              }
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 pt-2 lg:grid-cols-2 lg:items-start">
                    <label className="flex flex-col space-y-1">
                      <span className="text-xs font-medium text-zinc-600">
                        Bio
                      </span>
                      <textarea
                        maxLength={500}
                        className={`${FIELD_TEXTAREA_CLASS} h-[240px] resize-none`}
                        value={bio}
                        disabled={readOnly}
                        onChange={(e) => setBio(e.target.value.slice(0, 500))}
                        placeholder="A short intro clients will read on the public page…"
                      />
                      <span className="text-[11px] text-zinc-500">
                        {bio.length} / 500 characters
                      </span>
                    </label>
                    <div
                      className={`flex h-[calc(240px+1.25rem)] flex-col ${
                        readOnly ? 'pointer-events-none opacity-90' : ''
                      }`}
                    >
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
              </div>

              <CollapsibleCard title="Pricing" defaultOpen>
                <div
                  className={`space-y-4 ${
                    readOnly ? 'pointer-events-none opacity-90' : ''
                  }`}
                >
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
                          disabled={readOnly}
                          onChange={(e) => setServiceArea(e.target.value)}
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-xs font-medium text-zinc-600">
                          Interests
                        </span>
                        <input
                          className={FIELD_INPUT_CLASS}
                          value={interests}
                          disabled={readOnly}
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
                            disabled={readOnly}
                            onChange={(e) => {
                              const dial = e.target.value;
                              setPhoneDial(dial);
                              const entry = Object.entries(
                                COUNTRY_DIAL_BY_NAME,
                              ).find(([, info]) => info.dial === dial);
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
                            disabled={readOnly}
                            onChange={(e) =>
                              setPhoneNational(
                                e.target.value.replace(/[^\d\s-]/g, ''),
                              )
                            }
                            placeholder="0209277789"
                          />
                        </div>
                        {phoneAbbr ? (
                          <span className="sr-only">{phoneAbbr}</span>
                        ) : null}
                      </label>
                      <label className="block space-y-1">
                        <span className="text-xs font-medium text-zinc-600">
                          Email
                        </span>
                        <input
                          type="email"
                          className={FIELD_INPUT_CLASS}
                          value={contactEmail}
                          disabled={readOnly}
                          onChange={(e) => setContactEmail(e.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-700">
                    {(
                      [
                        [
                          openToOtherAreas,
                          setOpenToOtherAreas,
                          'Open to work outside primary area',
                        ],
                        [phoneContact, setPhoneContact, 'OK to contact by phone'],
                        [
                          emailContact,
                          setEmailContact,
                          'OK to contact by email',
                        ],
                        [
                          publicPhoneOnProfile,
                          setPublicPhoneOnProfile,
                          'Show phone publicly',
                        ],
                        [
                          publicEmailOnProfile,
                          setPublicEmailOnProfile,
                          'Show email publicly',
                        ],
                      ] as const
                    ).map(([checked, set, label]) => (
                      <label
                        key={label}
                        className={`flex items-center gap-2 ${
                          editing ? 'cursor-pointer' : 'cursor-default'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="rounded border-zinc-300 text-amber-900 focus:ring-amber-900/30"
                          checked={checked}
                          disabled={readOnly}
                          onChange={(e) => set(e.target.checked)}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CollapsibleCard>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                  <div className="text-center sm:text-left">
                    <p className="text-sm font-semibold text-zinc-900">
                      Portfolio gallery
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {galleryImageUrls.length} / {DIRECTORY_GALLERY_MAX} images
                    </p>
                  </div>
                  {editing && uid ? (
                    <ImageEditMenu
                      label="Add portfolio photos"
                      allowCamera={false}
                      multiple
                      uploading={uploading === 'gallery'}
                      disabled={
                        galleryImageUrls.length >= DIRECTORY_GALLERY_MAX ||
                        (uploading !== null && uploading !== 'gallery')
                      }
                      onPick={(files) => void onGalleryPick(files)}
                    />
                  ) : null}
                </div>
                <div className="mt-4 flex justify-center">
                  <div className="flex w-full max-w-4xl justify-center gap-3 overflow-x-auto pb-2">
                    {galleryImageUrls.length === 0 ? (
                      <div className="flex h-32 w-full items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-sm text-zinc-500">
                        No gallery images yet
                      </div>
                    ) : (
                      galleryImageUrls.map((url, i) => (
                        <div
                          key={`${url}-${i}`}
                          className="relative h-32 w-32 shrink-0 sm:h-36 sm:w-36"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt=""
                            className="h-full w-full rounded-xl object-cover ring-1 ring-zinc-200"
                          />
                          {editing ? (
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
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-sm font-semibold text-zinc-900">
                  Social & links
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(
                    [
                      [
                        'Behance',
                        behance,
                        setBehance,
                        'https://www.behance.net/yourname',
                      ],
                      [
                        'Instagram',
                        instagram,
                        setInstagram,
                        'https://www.instagram.com/yourname',
                      ],
                      [
                        'Twitter / X',
                        twitter,
                        setTwitter,
                        'https://x.com/yourname',
                      ],
                      [
                        'Facebook',
                        facebook,
                        setFacebook,
                        'https://www.facebook.com/yourname',
                      ],
                      [
                        'LinkedIn',
                        linkedin,
                        setLinkedin,
                        'https://www.linkedin.com/in/yourname',
                      ],
                      [
                        'Website',
                        website,
                        setWebsite,
                        'https://www.yourwebsite.com',
                      ],
                    ] as const
                  ).map(([label, value, set, placeholder]) => (
                    <label key={label} className="block space-y-1">
                      <span className="text-xs font-medium text-zinc-600">
                        {label}
                      </span>
                      <input
                        className={FIELD_INPUT_CLASS}
                        value={value}
                        disabled={readOnly}
                        onChange={(e) => set(e.target.value)}
                        placeholder={placeholder}
                      />
                    </label>
                  ))}
                  <label className="block space-y-1 sm:col-span-2 lg:col-span-3">
                    <span className="text-xs font-medium text-zinc-600">
                      Portfolio / other link
                    </span>
                    <input
                      className={FIELD_INPUT_CLASS}
                      value={portfolioUrl}
                      disabled={readOnly}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-red-950">
                      Account actions
                    </p>
                    <p className="mt-1 text-xs text-red-900/80">
                      Deactivate hides them from the public directory. Delete
                      permanently removes the listing from the database.
                    </p>
                    <div className="mt-4">
                      {listed ? (
                        <button
                          type="button"
                          className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100"
                          onClick={async () => {
                            const ok = confirm(
                              'Deactivate this photographer (hide from public directory)?',
                            );
                            if (!ok || !dir.id) return;
                            const res = await adminDeletePhotographer(dir.id);
                            if (!res.ok) alert(res.message);
                            else onClose();
                          }}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
                          onClick={async () => {
                            if (!dir.id) return;
                            const res = await adminUpsertPhotographer(dir.id, {
                              listed: true,
                            });
                            if (!res.ok) alert(res.message);
                            else onClose();
                          }}
                        >
                          Reactivate listing
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-xl border border-red-300 bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    onClick={async () => {
                      const ok = confirm(
                        listed
                          ? 'Permanently delete this photographer listing? They will be removed from the directory and the Firestore document will be deleted.'
                          : 'Permanently delete this directory document? This cannot be undone.',
                      );
                      if (!ok || !dir.id) return;
                      if (listed) {
                        const soft = await adminDeletePhotographer(dir.id);
                        if (!soft.ok) {
                          alert(soft.message);
                          return;
                        }
                      }
                      const res = await adminPermanentlyDeletePhotographerDoc(
                        dir.id,
                      );
                      if (!res.ok) alert(res.message);
                      else onClose();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ImageCropDialog
        open={Boolean(cropSession)}
        imageSrc={cropSession?.src ?? null}
        fileName={cropSession?.fileName}
        aspect={cropSession?.kind === 'banner' ? 21 / 7 : 1}
        circular={cropSession?.kind === 'profile'}
        title={
          cropSession?.kind === 'banner'
            ? 'Crop banner'
            : cropSession?.kind === 'profile'
              ? 'Crop profile photo'
              : 'Crop gallery photo'
        }
        onCancel={() => setCropSession(null)}
        onConfirm={(blob) => void onCropped(blob)}
      />
    </div>
  );
}
