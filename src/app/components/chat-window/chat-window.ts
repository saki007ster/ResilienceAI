import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AiCoachService, ConversationMessage, AiCoachState } from '../../services/ai-coach.service';
import { ModelDownloadService } from '../../services/model-download';
import { ModelDownload } from '../model-download/model-download';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule, ModelDownload],
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

  private aiStateSubscription?: Subscription;
  private modelStatusSubscription?: Subscription;

  constructor(
    private aiCoachService: AiCoachService,
    private modelDownloadService: ModelDownloadService
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

    this.updateMessages();
  }

  ngOnDestroy() {
    this.aiStateSubscription?.unsubscribe();
    this.modelStatusSubscription?.unsubscribe();
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
  async sendMessage() {
    if (!this.userInput.trim() || this.isGenerating || !this.aiCoachService.isReady()) {
      return;
    }

    const userMessage = this.userInput.trim();
    this.userInput = '';
    this.isGenerating = true;

    try {
      console.log('[ChatWindow] Sending message:', userMessage);
      
      // Generate AI response
      const response = await this.aiCoachService.generateResponse(userMessage);
      
      console.log('[ChatWindow] Received response:', response);
      
      // Update messages from the service
      this.updateMessages();
      
    } catch (error) {
      console.error('[ChatWindow] Error generating response:', error);
      
      // Add error message
      this.messages.push({
        role: 'assistant',
        content: "I'm sorry, I encountered an error while processing your message. Please try again.",
        timestamp: new Date()
      });
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Handle Enter key press in input
   */
  onKeyPress(event: KeyboardEvent) {
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
    return this.aiCoachService.isReady();
  }

  /**
   * Check if model is ready
   */
  get isModelReady(): boolean {
    return this.modelDownloadService.isModelReady();
  }

  /**
   * Get AI device type for display
   */
  get aiDevice(): string {
    switch (this.aiState.device) {
      case 'webgpu':
        return 'WebGPU (Accelerated)';
      case 'wasm':
        return 'WebAssembly';
      default:
        return 'Unknown';
    }
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
}
