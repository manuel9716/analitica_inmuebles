import { apiClient } from './apiClient';
import { Listing } from '@/types';

export const comparisonService = {
  async getSelectedListings(): Promise<any[]> {
    try {
      const response = await apiClient.callEdgeFunction(
        'listings-selection',
        'GET',
        undefined,
        true
      );

      return response.selectedListings || [];
    } catch (error) {
      console.error('Error getting selected listings:', error);
      return [];
    }
  },

  async addToSelection(listingId: string, listingData: Listing, notes?: string): Promise<void> {
    await apiClient.callEdgeFunction(
      'listings-selection',
      'POST',
      {
        listing_id: listingId,
        listing_data: listingData,
        notes: notes || null,
      },
      true
    );
  },

  async removeFromSelection(listingId: string): Promise<void> {
    await apiClient.callEdgeFunction(
      `listings-selection/${listingId}`,
      'DELETE',
      undefined,
      true
    );
  },

  async clearSelection(): Promise<void> {
    await apiClient.callEdgeFunction(
      'listings-selection',
      'DELETE',
      undefined,
      true
    );
  },

  async updateSelectionNotes(listingId: string, notes: string): Promise<void> {
    await apiClient.callEdgeFunction(
      `listings-selection/${listingId}`,
      'PUT',
      { notes },
      true
    );
  },

  async compareListings(listingIds: string[]): Promise<any> {
    const idsString = listingIds.join(',');

    const response = await apiClient.callEdgeFunction(
      `listings-selection/compare?ids=${idsString}`,
      'GET',
      undefined,
      true
    );

    return response.comparison;
  },

  async getUserComparisons(): Promise<any[]> {
    return await this.getSelectedListings();
  },

  async saveComparison(listingIds: string[], listingsData: Listing[]): Promise<void> {
    await Promise.all(
      listingsData.map((listing, index) =>
        this.addToSelection(listingIds[index], listing)
      )
    );
  },

  async deleteComparison(listingId: string): Promise<void> {
    await this.removeFromSelection(listingId);
  },
};
