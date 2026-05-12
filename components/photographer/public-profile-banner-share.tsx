'use client';

import { ProfileShareDropdown } from '@/components/photographer/profile-share-dropdown';

/** Share control for the public profile hero banner (bottom-right). */
export function PublicProfileBannerShare({
  profileSlug,
}: {
  profileSlug: string | null | undefined;
}) {
  return (
    <div className="pointer-events-auto absolute bottom-4 right-4 z-30">
      <ProfileShareDropdown
        profileSlug={profileSlug}
        placement="below"
        tone="onDark"
        menuZClass="z-[100]"
      />
    </div>
  );
}
