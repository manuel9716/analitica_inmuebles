import { supabase } from '@/lib/supabase';
import { Listing } from '@/types';

export const whatsappService = {
  async saveWhatsAppContact(
    listingId: string,
    listingData: Listing,
    userId?: string | null
  ): Promise<void> {
    const { error } = await supabase
      .from('whatsapp_contacts')
      .insert({
        user_id: userId || null,
        listing_id: listingId,
        listing_data: listingData,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving WhatsApp contact:', error);
    }
  },

  async getWhatsAppContacts(userId?: string | null): Promise<Listing[]> {
    const query = supabase
      .from('whatsapp_contacts')
      .select('listing_data')
      .order('created_at', { ascending: false });

    if (userId) {
      query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting WhatsApp contacts:', error);
      return [];
    }

    return data.map(item => item.listing_data as Listing);
  },
};
