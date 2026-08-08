'use client';

import { FavoritesPhotographersView } from '@/components/favorites-photographers-view';

export default function PhotographerFavoritesPage() {
  return (
    <FavoritesPhotographersView
      browseHref="/photographer/directory"
      loginRedirectTo="/photographer/favorites"
    />
  );
}
