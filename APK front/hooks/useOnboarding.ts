import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const ONBOARDING_KEY = 'has_seen_onboarding';

export function useOnboarding(userId?: string) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, [userId]);

  const checkOnboardingStatus = async () => {
    try {
      const localStatus = await AsyncStorage.getItem(ONBOARDING_KEY);

      if (localStatus === 'true') {
        setShowOnboarding(false);
        setLoading(false);
        return;
      }

      if (userId) {
        const { data } = await supabase
          .from('user_settings')
          .select('onboarding_completed')
          .eq('user_id', userId)
          .maybeSingle();

        if (data?.onboarding_completed) {
          await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
          setShowOnboarding(false);
        } else {
          setShowOnboarding(true);
        }
      } else {
        setShowOnboarding(localStatus !== 'true');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(false);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');

      if (userId) {
        await supabase
          .from('user_settings')
          .upsert({
            user_id: userId,
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });
      }

      setShowOnboarding(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  return {
    showOnboarding,
    loading,
    completeOnboarding,
  };
}
