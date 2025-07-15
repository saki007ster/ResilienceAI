import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface VisemeData {
  viseme: string;
  time: number;
  duration: number;
}

export interface TTSState {
  isSpeaking: boolean;
  isPaused: boolean;
  currentText: string;
  currentViseme: string;
  progress: number;
}

export interface TTSOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HeadTts {
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isInitialized = false;

  // State management
  private stateSubject = new BehaviorSubject<TTSState>({
    isSpeaking: false,
    isPaused: false,
    currentText: '',
    currentViseme: 'sil',
    progress: 0
  });

  // Viseme mapping for basic lip-sync
  private readonly visemeMap: { [key: string]: string } = {
    'a': 'aa', 'e': 'E', 'i': 'I', 'o': 'O', 'u': 'U',
    'p': 'PP', 'b': 'PP', 'm': 'PP',
    's': 'SS', 'z': 'SS', 'sh': 'SS', 'zh': 'SS',
    't': 'TH', 'd': 'TH', 'th': 'TH',
    'ch': 'CH', 'j': 'CH',
    'f': 'FF', 'v': 'FF',
    'k': 'kk', 'g': 'kk',
    'n': 'nn', 'ng': 'nn',
    'r': 'RR', 'l': 'RR',
    'sil': 'sil'
  };

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeVoices();
  }

  get state$(): Observable<TTSState> {
    return this.stateSubject.asObservable();
  }

  get currentState(): TTSState {
    return this.stateSubject.value;
  }

  private async initializeVoices(): Promise<void> {
    if ('speechSynthesis' in window) {
      // Wait for voices to be loaded
      const waitForVoices = (): Promise<void> => {
        return new Promise((resolve) => {
          const loadVoices = () => {
            this.voices = this.synthesis.getVoices();
            if (this.voices.length > 0) {
              this.isInitialized = true;
              console.log('HeadTTS: Available voices:', this.voices.length);
              resolve();
            } else {
              // Try again after a short delay
              setTimeout(loadVoices, 100);
            }
          };
          
          if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = loadVoices;
          }
          
          loadVoices();
        });
      };

      await waitForVoices();
    } else {
      console.warn('HeadTTS: Speech synthesis not supported in this browser');
    }
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  getDefaultVoice(lang: string = 'en-US'): SpeechSynthesisVoice | null {
    // Try to find a voice for the specified language
    let voice = this.voices.find(v => v.lang.startsWith(lang));
    
    // Fall back to any English voice
    if (!voice && lang !== 'en') {
      voice = this.voices.find(v => v.lang.startsWith('en'));
    }
    
    // Fall back to default voice
    if (!voice) {
      voice = this.voices.find(v => v.default) || this.voices[0];
    }
    
    return voice || null;
  }

  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeVoices();
    }

    if (!text.trim()) {
      console.warn('HeadTTS: Empty text provided');
      return;
    }

    // Stop any current speech
    this.stop();

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice and options
      const voice = options.voice || this.getDefaultVoice(options.lang);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }
      
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      // Set up event listeners
      utterance.onstart = () => {
        console.log('HeadTTS: Speech started');
        this.updateState({
          isSpeaking: true,
          isPaused: false,
          currentText: text,
          progress: 0
        });
        this.startVisemeAnimation(text);
      };

      utterance.onend = () => {
        console.log('HeadTTS: Speech ended');
        this.updateState({
          isSpeaking: false,
          isPaused: false,
          currentText: '',
          currentViseme: 'sil',
          progress: 100
        });
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (error) => {
        console.error('HeadTTS: Speech error:', error);
        this.updateState({
          isSpeaking: false,
          isPaused: false,
          currentText: '',
          currentViseme: 'sil',
          progress: 0
        });
        this.currentUtterance = null;
        reject(error);
      };

      utterance.onpause = () => {
        this.updateState({ isPaused: true });
      };

      utterance.onresume = () => {
        this.updateState({ isPaused: false });
      };

      // Store reference and start speaking
      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  }

  pause(): void {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
    }
  }

  resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  stop(): void {
    this.synthesis.cancel();
    this.currentUtterance = null;
    this.updateState({
      isSpeaking: false,
      isPaused: false,
      currentText: '',
      currentViseme: 'sil',
      progress: 0
    });
  }

  private updateState(updates: Partial<TTSState>): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, ...updates });
  }

  private startVisemeAnimation(text: string): void {
    // Simple viseme animation based on text analysis
    // This is a basic implementation - could be enhanced with more sophisticated phoneme analysis
    const words = text.toLowerCase().split(/\s+/);
    const averageWordDuration = 600; // ms per word
    
    let currentTime = 0;
    
    words.forEach((word, index) => {
      const wordDuration = averageWordDuration + (word.length * 50);
      
      // Generate visemes for this word
      setTimeout(() => {
        this.animateWordVisemes(word, wordDuration);
      }, currentTime);
      
      currentTime += wordDuration;
      
      // Update progress
      setTimeout(() => {
        const progress = ((index + 1) / words.length) * 100;
        this.updateState({ progress });
      }, currentTime);
    });
  }

  private animateWordVisemes(word: string, duration: number): void {
    const letters = word.split('');
    const letterDuration = duration / letters.length;
    
    letters.forEach((letter, index) => {
      setTimeout(() => {
        const viseme = this.getVisemeForLetter(letter);
        this.updateState({ currentViseme: viseme });
      }, index * letterDuration);
    });
    
    // Return to silence after word
    setTimeout(() => {
      this.updateState({ currentViseme: 'sil' });
    }, duration);
  }

  private getVisemeForLetter(letter: string): string {
    // Simple letter-to-viseme mapping
    // In a more sophisticated implementation, this would be phoneme-based
    const viseme = this.visemeMap[letter.toLowerCase()];
    return viseme || 'sil';
  }

  // Generate viseme data for external use (e.g., avatar animation)
  generateVisemeData(text: string): VisemeData[] {
    const words = text.toLowerCase().split(/\s+/);
    const visemeData: VisemeData[] = [];
    const averageWordDuration = 600; // ms per word
    
    let currentTime = 0;
    
    words.forEach(word => {
      const wordDuration = averageWordDuration + (word.length * 50);
      const letters = word.split('');
      const letterDuration = wordDuration / letters.length;
      
      letters.forEach((letter, index) => {
        const viseme = this.getVisemeForLetter(letter);
        visemeData.push({
          viseme,
          time: currentTime + (index * letterDuration),
          duration: letterDuration
        });
      });
      
      // Add silence between words
      visemeData.push({
        viseme: 'sil',
        time: currentTime + wordDuration,
        duration: 200
      });
      
      currentTime += wordDuration + 200;
    });
    
    return visemeData;
  }

  // Check if TTS is supported
  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  // Get synthesis info
  getSynthesisInfo(): any {
    return {
      supported: this.isSupported(),
      voicesLoaded: this.isInitialized,
      voiceCount: this.voices.length,
      speaking: this.synthesis.speaking,
      paused: this.synthesis.paused,
      pending: this.synthesis.pending
    };
  }
}
