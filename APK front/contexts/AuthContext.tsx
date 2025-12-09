import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { authService } from '@/services/authService';
import { profileService } from '@/services/profileService';
import { UserProfile, UserType } from '@/types';

interface UserMetadata {
  full_name?: string;
  phone?: string;
  document_type?: 'CC' | 'CE' | 'PA';
  document_number?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  userType: UserType;
  isEndUser: boolean;
  isAdmin: boolean;
  isBroker: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, sessionId?: string | null, metadata?: UserMetadata) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getSession().then(async (session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const userProfile = await profileService.getProfile();
        setProfile(userProfile);
      }

      setLoading(false);
    });

    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const userProfile = await profileService.getProfile();
          setProfile(userProfile);
        } else {
          setProfile(null);
        }

        setLoading(false);
      })();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { user, session } = await authService.signIn(email, password);
    setUser(user);
    setSession(session);

    if (user) {
      const userProfile = await profileService.getProfile();
      setProfile(userProfile);
    }
  };

  const signUp = async (email: string, password: string, sessionId?: string | null, metadata?: UserMetadata) => {
    const { user, session } = await authService.signUp(email, password, sessionId, metadata);
    setUser(user);
    setSession(session);

    if (user) {
      const userProfile = await profileService.getProfile();
      setProfile(userProfile);
    }
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await profileService.getProfile();
      setProfile(userProfile);
    }
  };

  const userType: UserType = profile?.user_type || 'end_user';
  const isEndUser = userType === 'end_user';
  const isAdmin = userType === 'admin';
  const isBroker = userType === 'broker';

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      userType,
      isEndUser,
      isAdmin,
      isBroker,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
