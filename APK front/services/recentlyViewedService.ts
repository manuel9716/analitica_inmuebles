import { supabase } from '@/lib/supabase';
import { Listing } from '@/types';

export const recentlyViewedService = {
  async trackView(
    listingId: string,
    listingData: Listing,
    userId?: string | null,
    sessionId?: string | null
  ): Promise<void> {
    try {
      // Check if already exists
      let query = supabase
        .from('recently_viewed')
        .select('id, view_count')
        .eq('listing_id', listingId);

      if (userId) {
        query = query.eq('user_id', userId);
      } else if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data: existing } = await query.maybeSingle();

      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from('recently_viewed')
          .update({
            view_count: existing.view_count + 1,
            last_viewed_at: new Date().toISOString(),
            listing_data: listingData,
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Error updating view:', updateError);
        }
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('recently_viewed')
          .insert({
            user_id: userId || null,
            session_id: sessionId || null,
            listing_id: listingId,
            listing_data: listingData,
            view_count: 1,
            last_viewed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('Error inserting view:', insertError);
        }
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  },

  async getRecentlyViewed(
    userId?: string | null,
    sessionId?: string | null,
    limit: number = 20
  ): Promise<Listing[]> {
    try {
      let query = supabase
        .from('recently_viewed')
        .select('listing_data')
        .order('last_viewed_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      } else if (sessionId) {
        query = query.eq('session_id', sessionId);
      } else {
        return [];
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting recently viewed:', error);
        return [];
      }

      return data?.map(item => item.listing_data as Listing).filter(Boolean) || [];
    } catch (error) {
      console.error('Error getting recently viewed:', error);
      return [];
    }
  },

  async clearHistory(userId: string): Promise<void> {
    const { error } = await supabase
      .from('recently_viewed')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
  },
};
