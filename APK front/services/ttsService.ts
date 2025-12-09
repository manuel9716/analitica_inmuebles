import * as Speech from 'expo-speech';
import { VoiceSettings } from '@/types';

export const ttsService = {
  async speak(text: string, settings: VoiceSettings): Promise<void> {
    if (!settings.voice_enabled) {
      return;
    }

    const options: Speech.SpeechOptions = {
      language: 'es-MX',
      pitch: settings.voice_pitch,
      rate: settings.voice_rate,
      volume: settings.voice_volume,
    };

    await Speech.speak(text, options);
  },

  stop(): void {
    Speech.stop();
  },

  async isSpeaking(): Promise<boolean> {
    return await Speech.isSpeakingAsync();
  },

  pause(): void {
    Speech.pause();
  },

  resume(): void {
    Speech.resume();
  },
};
