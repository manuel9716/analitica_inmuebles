import React, { createContext, useContext, useEffect, useState } from 'react';
import { VoiceSettings } from '@/types';
import { ttsService } from '@/services/ttsService';
import { profileService } from '@/services/profileService';
import { useAuth } from './AuthContext';

interface VoiceContextType {
  settings: VoiceSettings;
  updateSettings: (settings: Partial<VoiceSettings>) => Promise<void>;
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
}

const defaultSettings: VoiceSettings = {
  voice_enabled: true,
  voice_gender: 'female',
  voice_rate: 0.88,
  voice_pitch: 1.05,
  voice_volume: 0.95,
};

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<VoiceSettings>(defaultSettings);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (user) {
      profileService.getVoiceSettings().then(setSettings);
    }
  }, [user]);

  const updateSettings = async (newSettings: Partial<VoiceSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    if (user) {
      await profileService.updateVoiceSettings(updated);
    }
  };

  const speak = async (text: string) => {
    if (settings.voice_enabled) {
      setIsSpeaking(true);
      await ttsService.speak(text, settings);
      setIsSpeaking(false);
    }
  };

  const stop = () => {
    ttsService.stop();
    setIsSpeaking(false);
  };

  return (
    <VoiceContext.Provider value={{ settings, updateSettings, speak, stop, isSpeaking }}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
