import { supabase } from '@/lib/supabase';
import { Listing } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_ID_KEY = 'bf_session_id';

async function getOrCreateSessionId(): Promise<string> {
  let sessionId = await AsyncStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

export const analyticsService = {
  async trackShare(
    listingId: string,
    listingData: Listing,
    method: 'native' | 'whatsapp',
    userId?: string | null
  ): Promise<void> {
    const tableName = method === 'whatsapp' ? 'whatsapp_contacts' : 'search_history';

    if (method === 'whatsapp') {
      const { error } = await supabase
        .from('whatsapp_contacts')
        .insert({
          user_id: userId || null,
          listing_id: listingId,
          listing_data: listingData,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error tracking WhatsApp share:', error);
      }
    } else {
      const sessionId = userId ? null : await getOrCreateSessionId();
      const { error } = await supabase
        .from('search_history')
        .insert({
          user_id: userId || null,
          session_id: sessionId,
          query: listingData.title,
          filters: { shared: true, listing_id: listingId },
          results: [listingData],
          results_count: 1,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error tracking share:', error);
      }
    }
  },

  async trackPropertyView(
    listingId: string,
    listingData: Listing,
    userId?: string | null
  ): Promise<void> {
    const sessionId = userId ? null : await getOrCreateSessionId();
    const { error } = await supabase
      .from('search_history')
      .insert({
        user_id: userId || null,
        session_id: sessionId,
        query: `[VIEW] ${listingData.title}`,
        filters: { viewed: true, listing_id: listingId },
        results: [listingData],
        results_count: 1,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error tracking property view:', error);
    }
  },

  async getSharedProperties(userId: string): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .select('listing_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting shared properties:', error);
      return [];
    }

    return data?.map(item => item.listing_data as Listing) || [];
  },
};
