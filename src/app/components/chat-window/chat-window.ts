import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AiCoachEnhancedService as AiCoachService, ConversationMessage, AiCoachState, ModelOption } from '../../services/ai-coach-enhanced.service';
import { HeadTts, TTSState } from '../../services/head-tts';
import { SpeechRecognitionService, SpeechRecognitionState } from '../../services/speech-recognition.service';
import { VrmAvatar } from '../vrm-avatar/vrm-avatar';
import { AvatarSelector } from '../avatar-selector/avatar-selector';
import { ModelSelector } from '../model-selector/model-selector';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule, VrmAvatar, AvatarSelector, ModelSelector],
  templateUrl: './chat-window.html',
  styleUrl: './chat-window.scss'
})
export class ChatWindow implements OnInit, OnDestroy {
  messages: ConversationMessage[] = [];
  userInput = '';
  isGenerating = false;
  aiState: AiCoachState = {
    isInitialized: false,
    isLoading: false,
    modelLoaded: false,
    device: 'unknown',
    currentModel: null,
    progress: 0,
    progressText: '',
    modelCached: false,
    cacheSize: 0
  };

  // TTS and Avatar state
  ttsState: TTSState = {
    isSpeaking: false,
    isPaused: false,
    currentText: '',
    currentViseme: 'sil',
    progress: 0
  };
  avatarEnabled = true;
  autoSpeakReplies = true;

  // Speech Recognition state
  speechState: SpeechRecognitionState = {
    isListening: false,
    isSupported: false,
    interimTranscript: '',
    finalTranscript: '',
    confidence: 0
  };

  // Enhanced LLM properties
  showModelSelector = false;
  availableModels: ModelOption[] = [];

  // Avatar properties
  currentAvatarUrl = '/assets/avatars/default.vrm';
  currentAvatarId = 'default';

  private aiStateSubscription?: Subscription;
  private ttsStateSubscription?: Subscription;
  private speechStateSubscription?: Subscription;

  constructor(
    private aiCoachService: AiCoachService,
    public headTts: HeadTts,
    public speechRecognition: SpeechRecognitionService
  ) {}

  ngOnInit() {
    // Get available models from enhanced service
    this.availableModels = this.aiCoachService.availableModels;
    
    // Subscribe to AI coach state changes
    this.aiStateSubscription = this.aiCoachService.state$.subscribe(
      state => {
        this.aiState = state;
        this.showModelSelector = !state.isInitialized;
        this.updateMessages();
      }
    );

    // Subscribe to TTS state changes
    this.ttsStateSubscription = this.headTts.state$.subscribe(
      state => {
        this.ttsState = state;
      }
    );

    // Subscribe to Speech Recognition state changes
    this.speechStateSubscription = this.speechRecognition.state$.subscribe(
      state => {
        this.speechState = state;
        
        // Auto-populate input with final transcript
        if (state.finalTranscript && !this.isGenerating) {
          this.userInput = state.finalTranscript.trim();
          this.speechRecognition.clearTranscript();
          
          // Auto-send if we have a complete sentence
          if (this.userInput.length > 0 && !state.isListening) {
            // Small delay to allow user to review before sending
            setTimeout(() => {
              if (this.userInput.trim()) {
                this.sendMessage();
              }
            }, 1000);
          }
        }
      }
    );

    // Update messages initially
    this.updateMessages();

    console.log('ChatWindow: Initialized with HeadTTS support:', this.headTts.isSupported());
    console.log('ChatWindow: Initialized with Speech Recognition support:', this.speechRecognition.isSupported());
    console.log('ChatWindow: Available models:', this.availableModels.length);
  }

  ngOnDestroy() {
    this.aiStateSubscription?.unsubscribe();
    this.ttsStateSubscription?.unsubscribe();
    this.speechStateSubscription?.unsubscribe();
  }

  /**
   * Update messages from conversation history
   */
  private updateMessages() {
    this.messages = this.aiCoachService.getConversationHistory();
  }

  /**
   * Send user message and get AI response
   */
  async sendMessage(): Promise<void> {
    const message = this.userInput.trim();
    if (!message || this.isGenerating) return;

    // Stop any current TTS
    this.headTts.stop();

    console.log('ChatWindow: Sending message:', message);

    // Clear input and set generating state
    this.userInput = '';
    this.isGenerating = true;

    try {
      // Send message to AI coach
      const response = await this.aiCoachService.generateResponse(message);
      console.log('ChatWindow: Received response:', response);

      // Update messages
      this.updateMessages();

      // Auto-speak the AI response if enabled
      if (this.autoSpeakReplies && response && this.headTts.isSupported()) {
        try {
          await this.speakText(response);
        } catch (error) {
          console.warn('ChatWindow: TTS failed:', error);
        }
      }

    } catch (error) {
      console.error('ChatWindow: Error sending message:', error);
    } finally {
      this.isGenerating = false;
    }
  }

  async speakText(text: string): Promise<void> {
    if (!text || !this.headTts.isSupported()) {
      console.warn('ChatWindow: TTS not supported or empty text');
      return;
    }

    try {
      await this.headTts.speak(text, {
        rate: 0.9,
        pitch: 1.0,
        volume: 0.8
      });
    } catch (error) {
      console.error('ChatWindow: TTS error:', error);
    }
  }

  speakMessage(message: ConversationMessage): void {
    if (message.content) {
      this.speakText(message.content);
    }
  }

  stopSpeaking(): void {
    this.headTts.stop();
  }

  toggleAvatar(): void {
    this.avatarEnabled = !this.avatarEnabled;
  }

  toggleAutoSpeak(): void {
    this.autoSpeakReplies = !this.autoSpeakReplies;
    if (!this.autoSpeakReplies) {
      this.stopSpeaking();
    }
  }

  /**
   * Handle Enter key press in input
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Clear conversation history
   */
  clearConversation() {
    this.aiCoachService.clearConversation();
    this.updateMessages();
  }

  /**
   * Check if chat is ready for use
   */
  get isChatReady(): boolean {
    return this.aiState.isInitialized;
  }

  /**
   * Check if model is ready
   */
  get isModelReady(): boolean {
    return this.aiState.modelLoaded;
  }

  /**
   * Get AI device type for display
   */
  get aiDevice(): string {
    return this.aiState.device.toUpperCase();
  }

  /**
   * Get placeholder text for input
   */
  get inputPlaceholder(): string {
    if (!this.aiState.isInitialized) {
      return 'Select and initialize an AI model to start chatting...';
    } else if (this.aiState.isLoading) {
      return 'AI model is loading...';
    } else if (this.isGenerating) {
      return 'AI is thinking...';
    } else {
      return 'Type your message here...';
    }
  }

  /**
   * Format timestamp for display
   */
  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * Track function for message list to improve performance
   */
  trackByMessage(index: number, message: ConversationMessage): string {
    return `${message.timestamp.getTime()}-${message.role}`;
  }

  // Get appropriate greeting based on time of day
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning!";
    if (hour < 17) return "Good afternoon!";
    return "Good evening!";
  }

  // Get TTS synthesis info for debugging
  getTTSInfo(): any {
    return this.headTts.getSynthesisInfo();
  }

  // TrackBy function for ngFor optimization
  messageTrackBy(index: number, message: ConversationMessage): string {
    return `${message.timestamp.getTime()}-${message.role}`;
  }

  // Enhanced LLM Methods
  async onModelSelected(modelId: string): Promise<void> {
    try {
      console.log('ChatWindow: Initializing model:', modelId);
      await this.aiCoachService.initializeModel(modelId);
    } catch (error) {
      console.error('ChatWindow: Model initialization failed:', error);
    }
  }

  async onModelSwitched(modelId: string): Promise<void> {
    try {
      console.log('ChatWindow: Switching to model:', modelId);
      await this.aiCoachService.switchModel(modelId);
    } catch (error) {
      console.error('ChatWindow: Model switch failed:', error);
    }
  }

  async onInitializeTriggered(): Promise<void> {
    const firstModel = this.availableModels.find(m => m.recommended) || this.availableModels[0];
    if (firstModel) {
      await this.onModelSelected(firstModel.id);
    } else {
      console.warn('ChatWindow: No available models to initialize');
    }
  }

  // Avatar management methods
  onAvatarSelected(avatar: any): void {
    this.currentAvatarUrl = avatar.vrmUrl;
    this.currentAvatarId = avatar.id;
    console.log('Avatar selected:', avatar);
  }

  onCustomAvatarUploaded(blobUrl: string): void {
    this.currentAvatarUrl = blobUrl;
    this.currentAvatarId = 'custom';
    console.log('Custom avatar uploaded:', blobUrl);
  }

  // Get responsive avatar size based on screen width
  getAvatarSize(): number {
    if (typeof window === 'undefined') return 240; // SSR fallback
    
    const screenWidth = window.innerWidth;
    
    if (screenWidth <= 350) return 160;      // Very small mobile
    if (screenWidth <= 568) return 180;      // Mobile portrait
    if (screenWidth <= 768) return 200;      // Mobile landscape
    if (screenWidth <= 1024) return 220;     // Tablet
    if (screenWidth <= 1400) return 240;     // Desktop
    return 280;                              // Large desktop
  }

  /**
   * Clear all cached models
   */
  async onClearCache(): Promise<void> {
    try {
      await this.aiCoachService.clearModelCache();
      console.log('[ChatWindow] Model cache cleared successfully');
    } catch (error) {
      console.error('[ChatWindow] Error clearing cache:', error);
    }
  }

  // Speech Recognition Methods
  /**
   * Toggle microphone listening
   */
  toggleMicrophone(): void {
    if (!this.speechRecognition.isSupported()) {
      console.warn('[ChatWindow] Speech recognition not supported');
      return;
    }

    this.speechRecognition.toggleListening();
  }

  /**
   * Start listening for voice input
   */
  startListening(): void {
    if (!this.speechRecognition.isSupported()) {
      console.warn('[ChatWindow] Speech recognition not supported');
      return;
    }

    // Stop TTS if speaking
    if (this.ttsState.isSpeaking) {
      this.headTts.stop();
    }

    this.speechRecognition.startListening();
  }

  /**
   * Stop listening for voice input
   */
  stopListening(): void {
    this.speechRecognition.stopListening();
  }

  /**
   * Get current speech transcript for display
   */
  getCurrentSpeechTranscript(): string {
    if (this.speechState.interimTranscript) {
      return this.speechState.interimTranscript;
    }
    return '';
  }

  /**
   * Check if speech recognition is actively listening
   */
  get isMicrophoneActive(): boolean {
    return this.speechState.isListening;
  }

  /**
   * Get microphone status text
   */
  get microphoneStatus(): string {
    if (!this.speechRecognition.isSupported()) {
      return 'Microphone not supported';
    }
    if (this.speechState.error) {
      return this.speechState.error;
    }
    if (this.speechState.isListening) {
      return 'Listening... Speak now';
    }
    return 'Click to speak';
  }
}
