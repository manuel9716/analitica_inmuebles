import { supabase } from '@/lib/supabase';
import { Appointment, Listing } from '@/types';

export const appointmentService = {
  async scheduleVisit(
    listingId: string,
    listingData: Listing | any,
    preferredDate: Date,
    timeSlot: 'morning' | 'afternoon',
    contactName: string,
    contactEmail: string,
    contactPhone: string,
    notes?: string
  ): Promise<void> {
    try {
      // Validate required fields
      if (!listingId) {
        throw new Error('listing_id is required');
      }

      const { data: { user } } = await supabase.auth.getUser();

      const appointmentData: any = {
        listing_id: listingId,
        listing_data: listingData,
        preferred_date: preferredDate.toISOString().split('T')[0],
        time_slot: timeSlot,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        notes: notes || null,
        status: 'pending',
      };

      if (user) {
        appointmentData.user_id = user.id;
      }

      const { error } = await supabase
        .from('appointments')
        .insert(appointmentData);

      if (error) {
        console.error('Error scheduling appointment:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error scheduling visit:', error);
      throw error;
    }
  },

  async getUserAppointments(): Promise<Appointment[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('[appointmentService] No user authenticated');
        return [];
      }

      console.log('[appointmentService] Fetching appointments for user:', user.id);

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('preferred_date', { ascending: false });

      if (error) {
        console.error('[appointmentService] Error getting appointments:', error);
        throw error;
      }

      console.log('[appointmentService] Found appointments:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('[appointmentService] Error getting appointments:', error);
      throw error;
    }
  },

  async getUpcomingAppointments(): Promise<Appointment[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return [];
      }

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .gte('preferred_date', today)
        .in('status', ['pending', 'confirmed'])
        .order('preferred_date', { ascending: true });

      if (error) {
        console.error('Error getting upcoming appointments:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting upcoming appointments:', error);
      return [];
    }
  },

  async getAppointment(appointmentId: string): Promise<Appointment | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error getting appointment:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting appointment:', error);
      return null;
    }
  },

  async updateAppointment(
    appointmentId: string,
    updates: {
      status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
      time_slot?: 'morning' | 'afternoon';
      notes?: string;
    }
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', appointmentId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating appointment:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  },

  async cancelAppointment(appointmentId: string): Promise<void> {
    await this.updateAppointment(appointmentId, { status: 'cancelled' });
  },

  async deleteAppointment(appointmentId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting appointment:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  },
};
