import { supabase } from '@/lib/supabase';
import { SearchHistory, PropertyFilters, Listing } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_ID_KEY = 'bf_session_id';

function getSessionId(): string {
  let sessionId = '';

  AsyncStorage.getItem(SESSION_ID_KEY).then((id) => {
    if (id) {
      sessionId = id;
    } else {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      AsyncStorage.setItem(SESSION_ID_KEY, sessionId);
    }
  });

  return sessionId;
}

async function getOrCreateSessionId(): Promise<string> {
  let sessionId = await AsyncStorage.getItem(SESSION_ID_KEY);

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem(SESSION_ID_KEY, sessionId);
  }

  return sessionId;
}

export const searchHistoryService = {
  async saveSearch(
    query: string,
    filters: PropertyFilters,
    results: Listing[]
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = await getOrCreateSessionId();

      const { error } = await supabase
        .from('search_history')
        .insert({
          user_id: user?.id || null,
          session_id: sessionId,
          query,
          filters,
          results,
          results_count: results.length,
        });

      if (error) {
        console.error('Error saving search history:', error);
      }
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  },

  async getSearchHistory(): Promise<SearchHistory[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from('search_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        const sessionId = await getOrCreateSessionId();
        query = query.eq('session_id', sessionId).is('user_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting search history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting search history:', error);
      return [];
    }
  },

  async deleteSearchItem(searchId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = await getOrCreateSessionId();

      let query = supabase
        .from('search_history')
        .delete()
        .eq('id', searchId);

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', sessionId);
      }

      const { error } = await query;

      if (error) {
        console.error('Error deleting search history:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting search history:', error);
      throw error;
    }
  },

  async clearHistory(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = await getOrCreateSessionId();

      let query = supabase
        .from('search_history')
        .delete();

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', sessionId);
      }

      const { error } = await query;

      if (error) {
        console.error('Error clearing search history:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error clearing search history:', error);
      throw error;
    }
  },
};
