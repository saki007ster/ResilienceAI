import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SpeechRecognitionState {
  isListening: boolean;
  isSupported: boolean;
  interimTranscript: string;
  finalTranscript: string;
  confidence: number;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SpeechRecognitionService {
  private recognition?: SpeechRecognition;
  private stateSubject = new BehaviorSubject<SpeechRecognitionState>({
    isListening: false,
    isSupported: false,
    interimTranscript: '',
    finalTranscript: '',
    confidence: 0
  });

  public state$ = this.stateSubject.asObservable();

  constructor() {
    this.initializeSpeechRecognition();
  }

  /**
   * Check if speech recognition is supported
   */
  public isSupported(): boolean {
    return this.stateSubject.value.isSupported;
  }

  /**
   * Get current state
   */
  public getCurrentState(): SpeechRecognitionState {
    return this.stateSubject.value;
  }

  /**
   * Initialize speech recognition
   */
  private initializeSpeechRecognition(): void {
    try {
      // Check for browser support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.warn('[SpeechRecognition] Web Speech API not supported');
        this.updateState({ isSupported: false });
        return;
      }

      // Create recognition instance
      this.recognition = new SpeechRecognition();
      
      // Configure recognition with null checks
      if (this.recognition) {
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        // Set up event listeners
        this.setupEventListeners();

        this.updateState({ isSupported: true });
        console.log('[SpeechRecognition] ✅ Speech recognition initialized successfully');
      } else {
        throw new Error('Failed to create SpeechRecognition instance');
      }

    } catch (error) {
      console.error('[SpeechRecognition] Failed to initialize:', error);
      this.updateState({ 
        isSupported: false, 
        error: 'Failed to initialize speech recognition' 
      });
    }
  }

  /**
   * Set up speech recognition event listeners
   */
  private setupEventListeners(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      console.log('[SpeechRecognition] 🎤 Started listening');
      this.updateState({ 
        isListening: true, 
        error: undefined,
        interimTranscript: '',
        finalTranscript: ''
      });
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';
      let confidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript;
          confidence = result[0].confidence;
          console.log('[SpeechRecognition] 📝 Final transcript:', transcript, 'Confidence:', confidence);
        } else {
          interimTranscript += transcript;
        }
      }

      this.updateState({
        interimTranscript,
        finalTranscript: this.getCurrentState().finalTranscript + finalTranscript,
        confidence
      });
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[SpeechRecognition] ❌ Error:', event.error);
      
      let errorMessage = 'Speech recognition error';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not available. Please check permissions.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please enable microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Speech recognition requires internet connection.';
          break;
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service not allowed.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      this.updateState({ 
        isListening: false, 
        error: errorMessage 
      });
    };

    this.recognition.onend = () => {
      console.log('[SpeechRecognition] 🔇 Stopped listening');
      this.updateState({ isListening: false });
    };
  }

  /**
   * Start listening for speech
   */
  public startListening(): void {
    if (!this.recognition || !this.isSupported()) {
      console.warn('[SpeechRecognition] Speech recognition not available');
      return;
    }

    if (this.getCurrentState().isListening) {
      console.warn('[SpeechRecognition] Already listening');
      return;
    }

    try {
      // Reset transcript
      this.updateState({
        finalTranscript: '',
        interimTranscript: '',
        error: undefined
      });

      this.recognition.start();
    } catch (error) {
      console.error('[SpeechRecognition] Failed to start listening:', error);
      this.updateState({ 
        error: 'Failed to start speech recognition' 
      });
    }
  }

  /**
   * Stop listening for speech
   */
  public stopListening(): void {
    if (!this.recognition || !this.getCurrentState().isListening) {
      return;
    }

    try {
      this.recognition.stop();
    } catch (error) {
      console.error('[SpeechRecognition] Failed to stop listening:', error);
      this.updateState({ isListening: false });
    }
  }

  /**
   * Toggle listening state
   */
  public toggleListening(): void {
    if (this.getCurrentState().isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  /**
   * Get the current transcript (final + interim)
   */
  public getCurrentTranscript(): string {
    const state = this.getCurrentState();
    return state.finalTranscript + state.interimTranscript;
  }

  /**
   * Clear the current transcript
   */
  public clearTranscript(): void {
    this.updateState({
      finalTranscript: '',
      interimTranscript: ''
    });
  }

  /**
   * Set language for speech recognition
   */
  public setLanguage(language: string): void {
    if (this.recognition) {
      this.recognition.lang = language;
      console.log('[SpeechRecognition] Language set to:', language);
    }
  }

  /**
   * Update the state
   */
  private updateState(updates: Partial<SpeechRecognitionState>): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, ...updates });
  }
}

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Speech Recognition types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
} 