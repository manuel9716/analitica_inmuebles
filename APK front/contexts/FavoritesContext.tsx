import React, { createContext, useContext, useEffect, useState } from 'react';
import { favoritesService } from '@/services/favoritesService';
import { useAuth } from './AuthContext';
import { Listing } from '@/types';

interface FavoritesContextType {
  favorites: Set<string>;
  addFavorite: (listing: Listing) => Promise<boolean>;
  removeFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
  refreshFavorites: () => Promise<void>;
  requiresAuth: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [requiresAuth, setRequiresAuth] = useState(false);

  const refreshFavorites = async () => {
    if (!user) return;
    const favIds = await favoritesService.getFavoriteIds();
    setFavorites(new Set(favIds));
  };

  useEffect(() => {
    refreshFavorites();
  }, [user]);

  const addFavorite = async (listing: Listing): Promise<boolean> => {
    if (!user) {
      return false;
    }
    await favoritesService.addFavorite(listing.id, listing);
    setFavorites(prev => new Set([...prev, listing.id]));
    return true;
  };

  const removeFavorite = async (id: string) => {
    if (!user) return;
    await favoritesService.removeFavorite(id);
    setFavorites(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const isFavorite = (id: string) => {
    return favorites.has(id);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, refreshFavorites, requiresAuth }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
