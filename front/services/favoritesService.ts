import { apiClient } from './apiClient';
import { Listing } from '@/types';

export const favoritesService = {
  async addFavorite(listingId: string, listingData: Listing, conversationId?: string, notes?: string): Promise<void> {
    await apiClient.callEdgeFunction(
      'favorites',
      'POST',
      {
        listing_id: listingId,
        listing_data: listingData,
        conversation_id: conversationId || null,
        notes: notes || null,
      },
      true
    );
  },

  async removeFavorite(listingId: string): Promise<void> {
    await apiClient.callEdgeFunction(
      `favorites/${listingId}`,
      'DELETE',
      undefined,
      true
    );
  },

  async getFavorites(): Promise<Listing[]> {
    const response = await apiClient.callEdgeFunction(
      'favorites',
      'GET',
      undefined,
      true
    );

    return response.favorites.map((f: any) => f.listing_data as Listing);
  },

  async getFavoriteIds(): Promise<string[]> {
    const response = await apiClient.callEdgeFunction(
      'favorites',
      'GET',
      undefined,
      true
    );

    return response.favorites.map((f: any) => f.listing_id);
  },

  async isFavorite(listingId: string): Promise<boolean> {
    try {
      const response = await apiClient.callEdgeFunction(
        `favorites/check/${listingId}`,
        'GET',
        undefined,
        true
      );

      return response.isFavorite;
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  },

  async updateNotes(listingId: string, notes: string): Promise<void> {
    await apiClient.callEdgeFunction(
      `favorites/${listingId}`,
      'PUT',
      { notes },
      true
    );
  },
};
