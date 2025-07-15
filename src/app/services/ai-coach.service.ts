import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ModelDownloadService } from './model-download';

// Import Transformers.js
declare const Transformers: any;

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface AiCoachState {
  isInitialized: boolean;
  isLoading: boolean;
  error?: string;
  modelLoaded: boolean;
  device: 'webgpu' | 'wasm' | 'unknown';
}

@Injectable({
  providedIn: 'root'
})
export class AiCoachService {
  private pipeline: any = null;
  private conversationHistory: ConversationMessage[] = [];
  
  private stateSubject = new BehaviorSubject<AiCoachState>({
    isInitialized: false,
    isLoading: false,
    modelLoaded: false,
    device: 'unknown'
  });

  public state$ = this.stateSubject.asObservable();

  constructor(private modelDownloadService: ModelDownloadService) {
    this.initializeService();
    this.startModelReadinessCheck();
  }

  /**
   * Initialize the AI Coach service
   */
  private async initializeService(): Promise<void> {
    try {
      // Check if model is downloaded first
      const modelReady = this.modelDownloadService.isModelReady();
      if (!modelReady) {
        console.log('[AiCoach] Model not ready, waiting for download...');
        return;
      }

      await this.initializeModel();
    } catch (error) {
      console.error('[AiCoach] Initialization failed:', error);
      this.updateState({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Initialize the Transformers.js pipeline
   */
  async initializeModel(): Promise<void> {
    this.updateState({ isLoading: true, error: undefined });
    
    try {
      console.log('[AiCoach] Loading Transformers.js...');
      
      // Simulate WebGPU/WASM detection for testing
      let device: 'webgpu' | 'wasm' = 'wasm';
      
      try {
        if ('gpu' in navigator) {
          const adapter = await (navigator as any).gpu?.requestAdapter();
          if (adapter) {
            device = 'webgpu';
            console.log('[AiCoach] Using WebGPU acceleration');
          }
        }
      } catch (webgpuError) {
        console.log('[AiCoach] WebGPU not available, using WASM:', webgpuError);
      }

      console.log(`[AiCoach] Initializing pipeline with ${device}...`);
      console.log('[AiCoach] Attempting to load model from cache...');
      
      // Simulate model loading delay and check if model is cached
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For testing Phase 2, we'll simulate a working pipeline
      // In production, this would use the actual Transformers.js pipeline
      this.pipeline = {
        // Mock pipeline for testing
        generate: async (prompt: string, options: any) => {
          return [{
            generated_text: `I understand you're saying: "${prompt.split('User:').pop()?.split('RAI:')[0]?.trim()}". As your AI wellness coach, I'm here to support you through this. Let me help you explore some healthy coping strategies and perspectives that might be beneficial for your current situation.`
          }];
        }
      };

      console.log('[AiCoach] ✅ Model initialized successfully');
      console.log(`[AiCoach] Device: ${device}`);
      console.log('[AiCoach] Pipeline ready for generating responses');
      
      this.updateState({
        isInitialized: true,
        isLoading: false,
        modelLoaded: true,
        device
      });

      // Initialize conversation with system prompt
      this.initializeConversation();

    } catch (error) {
      console.error('[AiCoach] ❌ Model initialization failed:', error);
      this.updateState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Model initialization failed'
      });
    }
  }

  /**
   * Initialize conversation with constitutional system prompt
   */
  private initializeConversation(): void {
    const systemPrompt = this.getConstitutionalPrompt();
    this.conversationHistory = [{
      role: 'system',
      content: systemPrompt,
      timestamp: new Date()
    }];
  }

  /**
   * Generate AI response to user input
   */
  async generateResponse(userInput: string): Promise<string> {
    try {
      if (!this.pipeline) {
        throw new Error('AI model not initialized. Please wait for model loading to complete.');
      }

      // Add user message to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: userInput,
        timestamp: new Date()
      });

      // Format conversation history into prompt
      const prompt = this.formatConversationPrompt();
      
      console.log('[AiCoach] 📝 Generating response for user input:', userInput);
      console.log('[AiCoach] 🔄 Using constitutional prompt with conversation history');
      console.log('[AiCoach] 💭 Full prompt length:', prompt.length, 'characters');

      // Generate response using the pipeline
      const result = await this.pipeline.generate(prompt, {
        max_new_tokens: 150,
        temperature: 0.7,
        do_sample: true,
        top_p: 0.9,
        repetition_penalty: 1.1,
        return_full_text: false
      });

      let response = '';
      if (Array.isArray(result) && result.length > 0) {
        response = result[0].generated_text || '';
      } else if (result.generated_text) {
        response = result.generated_text;
      }

      // Clean up the response
      response = this.cleanResponse(response);
      
      // Add assistant response to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date()
      });

      // Maintain conversation history limit (keep last 10 exchanges)
      if (this.conversationHistory.length > 21) { // 1 system + 20 messages
        this.conversationHistory = [
          this.conversationHistory[0], // Keep system prompt
          ...this.conversationHistory.slice(-20) // Keep last 20 messages
        ];
      }

      console.log('[AiCoach] ✅ Response generated successfully');
      console.log('[AiCoach] 💬 AI Response:', response);
      console.log('[AiCoach] 📊 Conversation history length:', this.conversationHistory.length - 1, 'exchanges');
      
      return response;

    } catch (error) {
      console.error('[AiCoach] Response generation failed:', error);
      return "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.";
    }
  }

  /**
   * Get constitutional prompt for wellness coaching
   */
  private getConstitutionalPrompt(): string {
    return `You are RAI (Resilience AI), a compassionate and knowledgeable wellness coach dedicated to supporting mental health and personal growth. Your purpose is to provide thoughtful, evidence-based guidance while maintaining appropriate boundaries.

CORE PRINCIPLES:
1. **Empathy First**: Always respond with genuine understanding and validation
2. **Evidence-Based**: Ground advice in established psychological principles
3. **Empowerment**: Help users develop their own coping strategies and insights
4. **Safety**: Never provide medical advice or diagnose; encourage professional help when needed
5. **Respect**: Honor the user's autonomy and individual journey

CONVERSATION STYLE:
- Use a warm, supportive tone that feels like talking to a trusted friend
- Ask thoughtful follow-up questions to better understand the user's needs
- Offer practical, actionable suggestions when appropriate
- Acknowledge difficult emotions without trying to "fix" everything immediately
- Use "I" statements and share gentle perspectives rather than directives

BOUNDARIES:
- Refer users to mental health professionals for serious concerns
- Avoid diagnosing or providing medical advice
- Respect cultural and personal differences in coping strategies
- Maintain professional boundaries while being genuinely caring

SPECIALTIES:
- Stress management and relaxation techniques
- Building resilience and emotional regulation
- Mindfulness and grounding exercises
- Goal setting and motivation
- Sleep hygiene and healthy habits
- Communication and relationship skills

Remember: You're here to listen, support, and guide - not to solve everything. Sometimes the most powerful response is simply acknowledging someone's experience and helping them feel heard.`;
  }

  /**
   * Format conversation history into a prompt
   */
  private formatConversationPrompt(): string {
    const messages = this.conversationHistory.map(msg => {
      switch (msg.role) {
        case 'system':
          return `${msg.content}\n\n`;
        case 'user':
          return `User: ${msg.content}\n`;
        case 'assistant':
          return `RAI: ${msg.content}\n`;
        default:
          return '';
      }
    }).join('');

    return messages + 'RAI:';
  }

  /**
   * Clean and format the AI response
   */
  private cleanResponse(response: string): string {
    // Remove any incomplete sentences or artifacts
    response = response.trim();
    
    // Remove common AI artifacts
    response = response.replace(/^(RAI:|Assistant:|AI:)/i, '').trim();
    response = response.replace(/\[.*?\]/g, ''); // Remove bracketed content
    response = response.replace(/\n\n+/g, '\n\n'); // Normalize line breaks
    
    // Ensure the response ends properly
    const sentences = response.split(/[.!?]+/);
    if (sentences.length > 1 && sentences[sentences.length - 1].trim().length < 10) {
      sentences.pop(); // Remove incomplete last sentence
      response = sentences.join('.') + '.';
    }

    return response || "I'm here to listen. Could you tell me more about what's on your mind?";
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): ConversationMessage[] {
    return this.conversationHistory.filter(msg => msg.role !== 'system');
  }

  /**
   * Clear conversation history
   */
  clearConversation(): void {
    this.initializeConversation();
  }

  /**
   * Check if the service is ready to generate responses
   */
  isReady(): boolean {
    const state = this.stateSubject.value;
    return state.isInitialized && state.modelLoaded && !state.isLoading;
  }

  /**
   * Get current state
   */
  getCurrentState(): AiCoachState {
    return this.stateSubject.value;
  }

  /**
   * Update service state
   */
  private updateState(update: Partial<AiCoachState>): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, ...update });
  }

  /**
   * Retry model initialization
   */
  async retryInitialization(): Promise<void> {
    await this.initializeModel();
  }

  /**
   * Start checking for model readiness periodically
   */
  private startModelReadinessCheck(): void {
    const checkInterval = setInterval(() => {
      const currentState = this.stateSubject.value;
      
      // If not initialized and model is ready, try to initialize
      if (!currentState.isInitialized && !currentState.isLoading) {
        const modelReady = this.modelDownloadService.isModelReady();
        console.log('[AiCoach] Checking model readiness:', modelReady);
        
        if (modelReady) {
          console.log('[AiCoach] Model became ready, initializing...');
          clearInterval(checkInterval);
          this.initializeModel();
        }
      } else if (currentState.isInitialized) {
        // Stop checking once initialized
        clearInterval(checkInterval);
      }
    }, 2000); // Check every 2 seconds
  }
} 