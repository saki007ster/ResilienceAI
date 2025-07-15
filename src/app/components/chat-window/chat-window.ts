import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AiCoachService, ConversationMessage, AiCoachState } from '../../services/ai-coach.service';
import { ModelDownloadService } from '../../services/model-download';
import { HeadTts, TTSState } from '../../services/head-tts';
import { ModelDownload } from '../model-download/model-download';
import { Avatar } from '../avatar/avatar';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule, ModelDownload, Avatar],
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
    device: 'unknown'
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

  private aiStateSubscription?: Subscription;
  private modelStatusSubscription?: Subscription;
  private ttsStateSubscription?: Subscription;

  constructor(
    private aiCoachService: AiCoachService,
    private modelDownloadService: ModelDownloadService,
    public headTts: HeadTts
  ) {}

  ngOnInit() {
    // Subscribe to AI coach state changes
    this.aiStateSubscription = this.aiCoachService.state$.subscribe(
      state => {
        this.aiState = state;
        this.updateMessages();
      }
    );

    // Subscribe to model download status to reinitialize AI when ready
    this.modelStatusSubscription = this.modelDownloadService.status$.subscribe(
      status => {
        if (status.cached && !status.isDownloading && !this.aiState.isInitialized) {
          // Model is now available, try to initialize AI
          this.aiCoachService.retryInitialization();
        }
      }
    );

    // Subscribe to TTS state changes
    this.ttsStateSubscription = this.headTts.state$.subscribe(
      state => {
        this.ttsState = state;
      }
    );

    // Update messages initially
    this.updateMessages();

    console.log('ChatWindow: Initialized with HeadTTS support:', this.headTts.isSupported());
  }

  ngOnDestroy() {
    this.aiStateSubscription?.unsubscribe();
    this.modelStatusSubscription?.unsubscribe();
    this.ttsStateSubscription?.unsubscribe();
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
    if (!this.isModelReady) {
      return 'Download the AI model to start chatting...';
    } else if (!this.isChatReady) {
      return 'AI is initializing...';
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
}
