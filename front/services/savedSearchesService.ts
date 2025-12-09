import { supabase } from '@/lib/supabase';
import { PropertyFilters } from '@/types';

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  query: string;
  filters?: PropertyFilters;
  notify_new_listings: boolean;
  created_at: string;
  updated_at: string;
}

export const savedSearchesService = {
  async saveSearch(
    userId: string,
    name: string,
    query: string,
    filters?: PropertyFilters,
    notifyNewListings: boolean = false
  ): Promise<SavedSearch> {
    const { data, error } = await supabase
      .from('saved_searches')
      .insert({
        user_id: userId,
        name,
        query,
        filters,
        notify_new_listings: notifyNewListings,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving search:', error);
      throw error;
    }

    return data;
  },

  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting saved searches:', error);
      return [];
    }

    return data || [];
  },

  async updateSearch(
    searchId: string,
    updates: Partial<SavedSearch>
  ): Promise<void> {
    const { error } = await supabase
      .from('saved_searches')
      .update(updates)
      .eq('id', searchId);

    if (error) {
      console.error('Error updating search:', error);
      throw error;
    }
  },

  async deleteSearch(searchId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', searchId);

    if (error) {
      console.error('Error deleting search:', error);
      throw error;
    }
  },

  async toggleNotifications(searchId: string, enabled: boolean): Promise<void> {
    await this.updateSearch(searchId, { notify_new_listings: enabled });
  },
};
