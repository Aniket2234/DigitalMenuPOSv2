import { useState, useEffect } from 'react';

const FAVORITES_STORAGE_KEY = 'menu-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (stored) {
      try {
        return new Set(JSON.parse(stored));
      } catch {
        return new Set();
      }
    }
    return new Set();
  });

  useEffect(() => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(itemId)) {
        newFavorites.delete(itemId);
      } else {
        newFavorites.add(itemId);
      }
      return newFavorites;
    });
  };

  const isFavorite = (itemId: string) => favorites.has(itemId);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    favoritesCount: favorites.size,
  };
}
