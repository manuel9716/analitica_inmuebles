import { apiClient } from './apiClient';
import { UserProfile, VoiceSettings } from '@/types';
import { supabase } from '@/lib/supabase';

export const profileService = {
  async getProfile(): Promise<UserProfile | null> {
    try {
      console.log('[profileService] Getting profile - START');

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('[profileService] No authenticated user found');
        return null;
      }

      console.log('[profileService] User ID:', user.id);

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[profileService] Error fetching profile:', error);
        throw error;
      }

      console.log('[profileService] Profile fetched:', profile ? 'SUCCESS' : 'NOT FOUND');

      if (!profile) {
        console.log('[profileService] Creating new profile for user:', user.id);

        const newProfile = {
          id: user.id,
          email: user.email,
          nombre_completo: user.user_metadata?.full_name || null,
          celular: user.user_metadata?.phone || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: created, error: createError } = await supabase
          .from('users')
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          console.error('[profileService] Error creating profile:', createError);
          throw createError;
        }

        console.log('[profileService] Profile created successfully');
        return created as UserProfile;
      }

      return profile as UserProfile;
    } catch (error) {
      console.error('[profileService] Error getting profile:', error);
      return null;
    }
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<void> {
    console.log('[profileService] Updating profile - START', profile);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('[profileService] No authenticated user');
      throw new Error('No authenticated user');
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    const updates = {
      updated_at: new Date().toISOString(),
      ...profile
    };

    if (!existing) {
      console.log('[profileService] User not found, creating profile');
      const newProfile = {
        id: user.id,
        email: user.email,
        ...updates
      };

      const { error } = await supabase
        .from('users')
        .insert(newProfile);

      if (error) {
        console.error('[profileService] Error creating profile:', error);
        throw error;
      }

      console.log('[profileService] Profile created successfully');
    } else {
      console.log('[profileService] Updating existing profile');

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('[profileService] Error updating profile:', error);
        throw error;
      }

      console.log('[profileService] Profile updated successfully');
    }
  },

  async getSettings(): Promise<any> {
    try {
      const response = await apiClient.callEdgeFunction(
        'user-settings',
        'GET',
        undefined,
        true
      );

      return response.settings;
    } catch (error) {
      console.error('Error getting settings:', error);
      return this.getDefaultSettings();
    }
  },

  async updateSettings(settings: any): Promise<void> {
    await apiClient.callEdgeFunction(
      'user-settings',
      'PUT',
      settings,
      true
    );
  },

  async resetSettings(): Promise<void> {
    await apiClient.callEdgeFunction(
      'user-settings',
      'DELETE',
      undefined,
      true
    );
  },

  async getVoiceSettings(): Promise<VoiceSettings> {
    const settings = await this.getSettings();

    const defaultSettings: VoiceSettings = {
      voice_enabled: true,
      voice_gender: 'female',
      voice_rate: 0.88,
      voice_pitch: 1.05,
      voice_volume: 0.95,
    };

    if (!settings) {
      return defaultSettings;
    }

    return {
      voice_enabled: settings.voice_enabled ?? defaultSettings.voice_enabled,
      voice_gender: settings.voice_gender ?? defaultSettings.voice_gender,
      voice_rate: settings.voice_rate ?? defaultSettings.voice_rate,
      voice_pitch: settings.voice_pitch ?? defaultSettings.voice_pitch,
      voice_volume: settings.voice_volume ?? defaultSettings.voice_volume,
    };
  },

  async updateVoiceSettings(settings: Partial<VoiceSettings>): Promise<void> {
    await this.updateSettings(settings);
  },

  async getNotificationSettings(): Promise<any> {
    const settings = await this.getSettings();

    if (!settings) {
      return this.getDefaultNotificationSettings();
    }

    return {
      email_appointments: settings.email_appointments,
      email_messages: settings.email_messages,
      email_updates: settings.email_updates,
      push_appointments: settings.push_appointments,
      push_messages: settings.push_messages,
      sms_appointments: settings.sms_appointments,
    };
  },

  async updateNotificationSettings(settings: any): Promise<void> {
    await this.updateSettings(settings);
  },

  getDefaultSettings() {
    return {
      email_appointments: true,
      email_messages: true,
      email_updates: false,
      push_appointments: true,
      push_messages: false,
      sms_appointments: false,
      voice_enabled: true,
      voice_gender: 'female',
    };
  },

  getDefaultNotificationSettings() {
    return {
      email_appointments: true,
      email_messages: true,
      email_updates: false,
      push_appointments: true,
      push_messages: false,
      sms_appointments: false,
    };
  },
};
