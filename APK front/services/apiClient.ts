import { supabase } from '@/lib/supabase';
import { SearchResponse, Listing, PropertyFilters } from '@/types';
import { MOCK_LISTINGS, filterListings } from '@/utils/mockData';
import { generateSearchSummary } from '@/utils/generateSummary';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const USE_MOCK = false;

async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function callEdgeFunction(
  functionName: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  requiresAuth: boolean = false,
  signal?: AbortSignal
): Promise<any> {
  const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': ANON_KEY || '',
  };

  if (requiresAuth) {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } else {
    headers['Authorization'] = `Bearer ${ANON_KEY}`;
  }

  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  if (signal) {
    options.signal = signal;
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Request failed');
  }

  return await response.json();
}

export const apiClient = {
  async searchProperties(query: string, filters?: PropertyFilters, context?: any): Promise<SearchResponse> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));

      const filteredListings = filters ? filterListings(MOCK_LISTINGS, filters) : MOCK_LISTINGS;

      const sources = Array.from(new Set(filteredListings.map(l => l.source || 'Mock')));

      return {
        searchId: Date.now().toString(),
        sources,
        items: filteredListings,
        total: filteredListings.length,
        summary: generateSearchSummary(filters || {}, filteredListings.length),
        filters: filters || {},
      };
    }

    try {
      const requestBody: any = {
        filters: filters || {},
        query,
        sort: 'matching',
        page: 1,
        size: 20,
      };

      if (context?.selectedListings && context.selectedListings.length > 0) {
        requestBody.selectedListings = context.selectedListings;
      }

      const response = await callEdgeFunction(
        'listings-search',
        'POST',
        requestBody,
        false
      );

      return {
        searchId: Date.now().toString(),
        sources: response.sources || ['Fincaraíz', 'Metrocuadrado', 'Properati', 'Inmuebles24'],
        items: response.items || [],
        total: response.total || 0,
        summary: response.summary || generateSearchSummary(filters || {}, response.items?.length || 0),
        filters: filters || {},
      };
    } catch (error) {
      console.error('Search error:', error);

      const fallbackListings = filters ? filterListings(MOCK_LISTINGS, filters) : [];
      return {
        searchId: Date.now().toString(),
        sources: ['Mock'],
        items: fallbackListings,
        total: fallbackListings.length,
        summary: generateSearchSummary(filters || {}, fallbackListings.length),
        filters: filters || {},
      };
    }
  },

  async getPropertyDetails(id: string): Promise<Listing> {
    if (USE_MOCK) {
      const listing = MOCK_LISTINGS.find(l => l.id === id);
      if (!listing) {
        throw new Error('Property not found');
      }
      return listing;
    }

    const response = await callEdgeFunction(
      `listings-search/${id}`,
      'GET',
      undefined,
      false
    );

    return response.listing;
  },

  async registerIntake(query: string): Promise<void> {
    if (USE_MOCK) return;

    try {
      await supabase.from('search_analytics').insert({
        query,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to register intake:', error);
    }
  },

  callEdgeFunction,
  getAuthToken,
};
