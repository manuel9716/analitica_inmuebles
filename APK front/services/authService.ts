import { supabase } from '@/lib/supabase';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

interface UserMetadata {
  full_name?: string;
  phone?: string;
  document_type?: 'CC' | 'CE' | 'PA';
  document_number?: string;
}

export const authService = {
  async signUp(email: string, password: string, sessionId?: string | null, metadata?: UserMetadata) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
        data: metadata,
      },
    });

    if (error) throw error;

    if (!data.user) {
      throw new Error('No se pudo crear el usuario');
    }

    if (metadata && data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: data.user.id,
          nombre_completo: metadata.full_name,
          celular: metadata.phone,
          tipo_documento: metadata.document_type,
          numero_documento: metadata.document_number,
          user_type: 'end_user',
          email: data.user.email,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
      }
    }

    if (sessionId && data.user) {
      await this.migrateGuestData(sessionId, data.user.id);
    }

    return data;
  },

  async migrateGuestData(sessionId: string, userId: string) {
    try {
      await Promise.all([
        supabase
          .from('favorite_listings')
          .update({ user_id: userId, session_id: null })
          .eq('session_id', sessionId)
          .is('user_id', null),

        supabase
          .from('search_history')
          .update({ user_id: userId, session_id: null })
          .eq('session_id', sessionId)
          .is('user_id', null),

        supabase
          .from('conversations')
          .update({ user_id: userId, session_id: null })
          .eq('session_id', sessionId)
          .is('user_id', null),

        supabase
          .from('appointments')
          .update({ user_id: userId, session_id: null })
          .eq('session_id', sessionId)
          .is('user_id', null),

        supabase
          .from('whatsapp_contacts')
          .update({ user_id: userId, session_id: null })
          .eq('session_id', sessionId)
          .is('user_id', null),

        supabase
          .from('recently_viewed')
          .update({ user_id: userId, session_id: null })
          .eq('session_id', sessionId)
          .is('user_id', null),

        supabase
          .from('property_comparisons')
          .update({ user_id: userId, session_id: null })
          .eq('session_id', sessionId)
          .is('user_id', null),
      ]);

      console.log('Guest data migrated successfully');
    } catch (error) {
      console.error('Error migrating guest data:', error);
    }
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://miapp.com/reset-password',
    });
    if (error) throw error;
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },
};
