'use client';

type Props = {
  open: boolean;
  onClose: () => void;
};

/** Shown when a photographer tries to favorite their own listing. */
export function CannotFavoriteSelfDialog({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[240] flex items-center justify-center bg-black/45 p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cannot-favorite-self-title"
        className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl"
      >
        <h2
          id="cannot-favorite-self-title"
          className="font-serif text-xl font-medium text-zinc-900"
        >
          That’s your profile
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          You can’t favorite yourself. Browse other photographers and heart the
          ones you’d love to collaborate with or recommend.
        </p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
