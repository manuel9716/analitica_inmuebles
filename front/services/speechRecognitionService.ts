import { Platform } from 'react-native';

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

class SpeechRecognitionService {
  private recognition: any = null;
  private isListening = false;

  initialize() {
    if (Platform.OS !== 'web') {
      return false;
    }

    if (typeof window === 'undefined') {
      return false;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return false;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'es-ES';
      return true;
    } catch (error) {
      return false;
    }
  }

  async start(
    onResult: (text: string, isFinal: boolean) => void,
    onError?: (error: string) => void
  ): Promise<boolean> {
    if (!this.recognition) {
      const initialized = this.initialize();
      if (!initialized) {
        return false;
      }
    }

    if (!this.recognition) {
      return false;
    }

    return new Promise((resolve) => {
      this.recognition.onstart = () => {
        this.isListening = true;
        resolve(true);
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          onResult(finalTranscript.trim(), true);
        } else if (interimTranscript) {
          onResult(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        if (onError) {
          onError(event.error);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      try {
        this.recognition.start();
      } catch (error) {
        this.isListening = false;
        if (onError) {
          onError('Error al iniciar reconocimiento');
        }
        resolve(false);
      }
    });
  }

  stop(): string {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
    return '';
  }

  isActive(): boolean {
    return this.isListening;
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
