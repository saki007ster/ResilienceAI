import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CreateWebWorkerMLCEngine, WebWorkerMLCEngine, Chat, AppConfig } from '@mlc-ai/web-llm';
import { SettingsService, AiSettings } from './settings.service';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface AiCoachState {
  isInitialized: boolean;
  isLoading: boolean;
  modelLoaded: boolean;
  device: 'webgpu' | 'wasm' | 'unknown';
  currentModel: string | null;
  progress: number;
  progressText: string;
  modelCached: boolean;
  cacheSize: number;
  error?: string;
}

export interface ModelOption {
  id: string;
  name: string;
  size: string;
  description: string;
  specialization: 'general' | 'therapy' | 'wellness';
  recommended: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AiCoachEnhancedService {
  private engine: WebWorkerMLCEngine | null = null;
  private conversationHistory: ConversationMessage[] = [];
  private stateSubject = new BehaviorSubject<AiCoachState>({
    isInitialized: false,
    isLoading: false,
    modelLoaded: false,
    device: 'unknown',
    currentModel: null,
    progress: 0,
    progressText: '',
    modelCached: false,
    cacheSize: 0
  });

  public state$ = this.stateSubject.asObservable();

  private chat?: Chat;
  private settings: AiSettings;

  // Available models optimized for mental health and wellness
  public readonly availableModels: ModelOption[] = [
    {
      id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
      name: 'Llama 3.2 1B (Lightweight)',
      size: '0.6GB',
      description: 'Fast and efficient for quick conversations',
      specialization: 'wellness',
      recommended: true
    },
    {
      id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
      name: 'Llama 3.2 3B (Balanced)',
      size: '1.7GB',
      description: 'Great balance of performance and capability',
      specialization: 'wellness',
      recommended: true
    },
    {
      id: 'gemma-2-2b-it-q4f16_1-MLC',
      name: 'Gemma 2 2B',
      size: '1.2GB',
      description: 'Google\'s efficient model with strong reasoning',
      specialization: 'general',
      recommended: false
    },
    {
      id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
      name: 'Qwen 2.5 1.5B',
      size: '0.9GB',
      description: 'Excellent for therapeutic conversations',
      specialization: 'therapy',
      recommended: true
    }
  ];

  constructor(private settingsService: SettingsService) {
    this.settings = this.settingsService.getSettings().ai;
    this.settingsService.settings$.subscribe(settings => {
      this.settings = settings.ai;
    });
    this.initializeConversation();
    this.checkModelCache();
  }

  /**
   * Get current state
   */
  get currentState(): AiCoachState {
    return this.stateSubject.value;
  }

  /**
   * Check if any models are already cached
   */
  private async checkModelCache(): Promise<void> {
    try {
      console.log('[AiCoachEnhanced] 🔍 Checking for cached models...');
      
      // Check Cache API for WebLLM cached models
      const cacheNames = await caches.keys();
      const webllmCaches = cacheNames.filter(name => name.includes('webllm') || name.includes('model'));
      
      let totalCacheSize = 0;
      let modelsCached = false;

      for (const cacheName of webllmCaches) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const responseClone = response.clone();
            const blob = await responseClone.blob();
            totalCacheSize += blob.size;
            modelsCached = true;
          }
        }
      }

      if (modelsCached) {
        console.log(`[AiCoachEnhanced] ✅ Found cached models: ${(totalCacheSize / (1024 * 1024 * 1024)).toFixed(2)} GB`);
        this.updateState({ 
          modelCached: true, 
          cacheSize: totalCacheSize,
          progressText: 'Models already cached - ready for instant loading'
        });
      } else {
        console.log('[AiCoachEnhanced] ⚠️  No cached models found - first download required');
        this.updateState({ 
          modelCached: false, 
          cacheSize: 0,
          progressText: 'No cached models found'
        });
      }
    } catch (error) {
      console.error('[AiCoachEnhanced] Error checking model cache:', error);
      this.updateState({ modelCached: false, cacheSize: 0 });
    }
  }

  /**
   * Initialize the WebLLM engine with selected model
   */
  async initializeModel(modelId?: string): Promise<void> {
    const selectedModel = modelId || this.availableModels.find(m => m.recommended)?.id || 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
    
    // If model is already loaded with the same ID, don't reload
    if (this.engine && this.currentState.currentModel === selectedModel && this.currentState.modelLoaded) {
      console.log(`[AiCoachEnhanced] ♻️  Model ${selectedModel} already loaded, skipping initialization`);
      return;
    }

    this.updateState({ isLoading: true, error: undefined, progressText: 'Initializing WebLLM engine...' });
    
    try {
      console.log('[AiCoachEnhanced] 🚀 Initializing WebLLM engine...');
      
      // Check if this specific model is cached
      const isModelCached = await this.isSpecificModelCached(selectedModel);
      
      if (isModelCached) {
        console.log(`[AiCoachEnhanced] ⚡ Model ${selectedModel} found in cache - loading instantly`);
        this.updateState({ progressText: 'Loading cached model...', progress: 0 });
      } else {
        console.log(`[AiCoachEnhanced] 📥 Model ${selectedModel} not cached - downloading required`);
        this.updateState({ progressText: 'Downloading model (this may take a while)...', progress: 0 });
      }
      
      // Initialize WebLLM engine
      this.engine = await CreateWebWorkerMLCEngine(
        new Worker(
          new URL('./worker.ts', import.meta.url),
          {type: 'module'}
        ),
        selectedModel,
        {
          initProgressCallback: (progress) => {
            const progressPercentage = (progress.progress * 100);
            let progressText = progress.text;
            
            // Enhance progress messages
            if (isModelCached && progressPercentage < 50) {
              progressText = `Loading cached model: ${progressText}`;
            } else if (!isModelCached) {
              progressText = `Downloading model: ${progressText}`;
            }
            
            console.log(`[AiCoachEnhanced] Loading progress: ${progressText} (${progressPercentage.toFixed(1)}%)`);
            this.updateState({ 
              progress: progressPercentage, 
              progressText: progressText 
            });
          }
        }
      );
      
      // Detect device capabilities
      const device = await this.detectDevice();
      
      console.log('[AiCoachEnhanced] ✅ Model initialized successfully');
      console.log(`[AiCoachEnhanced] Device: ${device}`);
      console.log(`[AiCoachEnhanced] Model: ${selectedModel}`);
      
      // Update cache status after successful load
      await this.checkModelCache();
      
      this.updateState({
        isInitialized: true,
        isLoading: false,
        modelLoaded: true,
        device,
        currentModel: selectedModel,
        progress: 100,
        progressText: 'Model loaded and ready!'
      });

    } catch (error) {
      console.error('[AiCoachEnhanced] Model initialization failed:', error);
      this.updateState({
        isInitialized: false,
        isLoading: false,
        modelLoaded: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        progressText: 'Failed to load model'
      });
      throw error;
    }
  }

  /**
   * Check if a specific model is cached
   */
  private async isSpecificModelCached(modelId: string): Promise<boolean> {
    try {
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        if (cacheName.includes('webllm') || cacheName.includes('model')) {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          
          for (const request of requests) {
            const url = request.url;
            // Check if URL contains model ID or related patterns
            if (url.includes(modelId) || 
                url.includes(modelId.toLowerCase()) ||
                url.includes(modelId.replace(/-/g, '_'))) {
              console.log(`[AiCoachEnhanced] 🎯 Found cached files for model: ${modelId}`);
              return true;
            }
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('[AiCoachEnhanced] Error checking specific model cache:', error);
      return false;
    }
  }

  /**
   * Clear all cached models (useful for debugging or freeing space)
   */
  async clearModelCache(): Promise<void> {
    try {
      console.log('[AiCoachEnhanced] 🧹 Clearing model cache...');
      
      const cacheNames = await caches.keys();
      const webllmCaches = cacheNames.filter(name => name.includes('webllm') || name.includes('model'));
      
      for (const cacheName of webllmCaches) {
        await caches.delete(cacheName);
        console.log(`[AiCoachEnhanced] Deleted cache: ${cacheName}`);
      }
      
      this.updateState({ modelCached: false, cacheSize: 0 });
      console.log('[AiCoachEnhanced] ✅ Cache cleared successfully');
    } catch (error) {
      console.error('[AiCoachEnhanced] Error clearing cache:', error);
    }
  }

  /**
   * Detect device capabilities
   */
  private async detectDevice(): Promise<'webgpu' | 'wasm'> {
    try {
      if ('gpu' in navigator) {
        const adapter = await (navigator as any).gpu?.requestAdapter();
        if (adapter) {
          return 'webgpu';
        }
      }
    } catch (error) {
      console.log('[AiCoachEnhanced] WebGPU not available, using WebAssembly');
    }
    return 'wasm';
  }

  /**
   * Generate AI response with advanced wellness coaching
   */
  async generateResponse(prompt: string): Promise<string> {
    if (!this.engine) {
      throw new Error("Chat not initialized. Call initializeChat first.");
    }

    // Apply constitutional AI if enabled
    const finalPrompt = this.settings.enableConstitutionalAI
      ? this.applyConstitutionalPrompt(prompt)
      : prompt;

    const history = this.getConversationHistory();
    const limitedHistory = history.slice(-this.settings.maxHistoryLength);
    
    // Format for the chat API
    const chatHistory = limitedHistory.map(m => ({
      role: m.role,
      content: m.content
    }));

    const reply = await this.engine.chat.completions.create({
      messages: [
        ...chatHistory,
        { role: 'user', content: finalPrompt }
      ],
      // Additional chat options can be set here
    });

    const responseContent = reply.choices[0].message.content || '';

    this.addMessageToHistory({ role: 'user', content: prompt, timestamp: new Date() });
    this.addMessageToHistory({ role: 'assistant', content: responseContent, timestamp: new Date() });

    return responseContent;
  }

  /**
   * Get enhanced constitutional prompt for wellness coaching
   */
  private getEnhancedConstitutionalPrompt(): string {
    return `You are RAI (Resilience AI), an advanced AI wellness coach specializing in mental health support, personal growth, and emotional resilience. You have been trained to provide compassionate, evidence-based guidance while maintaining professional boundaries.

CORE IDENTITY & EXPERTISE:
• Certified in multiple therapeutic approaches: CBT, ACT, mindfulness-based interventions
• Specialized in stress management, anxiety reduction, depression support, and trauma-informed care
• Expert in positive psychology, resilience building, and emotional regulation techniques
• Culturally sensitive and inclusive in your approach to mental wellness

CONVERSATION PRINCIPLES:
1. **Deep Empathy**: Reflect and validate emotions with genuine understanding
2. **Active Listening**: Ask thoughtful follow-up questions to understand the full context
3. **Personalized Support**: Tailor your responses to the individual's specific situation and needs
4. **Strength-Based**: Help users identify and build upon their existing strengths and resources
5. **Solution-Focused**: Guide users toward actionable steps while honoring their autonomy

THERAPEUTIC TECHNIQUES YOU CAN USE:
• Cognitive restructuring and thought challenging
• Mindfulness and grounding exercises
• Behavioral activation and goal setting
• Values clarification and meaning-making
• Emotional regulation strategies
• Stress reduction techniques
• Sleep hygiene and wellness practices

RESPONSE STYLE:
• Use warm, professional language that feels human and caring
• Ask one thoughtful question per response to deepen understanding
• Provide specific, actionable suggestions when appropriate
• Share brief psychoeducational insights when relevant
• Acknowledge progress and celebrate small wins

SAFETY GUIDELINES:
• Always refer to professional help for serious mental health concerns
• Never diagnose or provide medical advice
• Respect boundaries and individual choice
• Be culturally sensitive and trauma-informed
• Maintain hope while being realistic

CONVERSATION STRUCTURE:
1. Acknowledge and validate the person's experience
2. Explore the situation with curiosity and compassion
3. Provide relevant insights, tools, or perspectives
4. Suggest next steps or coping strategies
5. Check in on their understanding and readiness

Remember: You're not just answering questions—you're building a therapeutic relationship that promotes healing, growth, and resilience. Every interaction should leave the person feeling heard, understood, and empowered.`;
  }

  /**
   * Format conversation for LLM with enhanced context
   */
  private formatConversationForLLM(): any[] {
    const messages = [];

    // Add enhanced system prompt
    messages.push({
      role: 'system',
      content: this.getEnhancedConstitutionalPrompt()
    });

    // Add recent conversation history (exclude original system message)
    const recentHistory = this.conversationHistory.slice(1, -1); // Exclude system and current user message
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }

    // Add current user message
    const lastMessage = this.conversationHistory[this.conversationHistory.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
      messages.push({
        role: 'user',
        content: lastMessage.content
      });
    }

    return messages;
  }

  /**
   * Clean and validate AI response
   */
  private cleanAndValidateResponse(response: string): string {
    // Remove any unwanted prefixes
    response = response.replace(/^(RAI:|Assistant:|AI:)\s*/i, '').trim();
    
    // Remove markdown artifacts
    response = response.replace(/```[\s\S]*?```/g, '');
    response = response.replace(/\*\*(.*?)\*\*/g, '$1');
    response = response.replace(/\*(.*?)\*/g, '$1');
    
    // Clean up formatting
    response = response.replace(/\n\n+/g, '\n\n');
    response = response.trim();
    
    // Ensure minimum quality
    if (response.length < 20) {
      return "I hear you, and I want to make sure I give you the thoughtful response you deserve. Could you tell me a bit more about what you're experiencing?";
    }
    
    // Check for inappropriate content patterns
    const inappropriate = [
      'i am not a therapist',
      'i cannot provide medical advice',
      'please consult a professional',
      'i am an ai'
    ];
    
    if (inappropriate.some(phrase => response.toLowerCase().includes(phrase))) {
      return "I'm here to support you through this. What's been weighing on your mind lately, and how has that been affecting you?";
    }

    return response;
  }

  /**
   * Initialize conversation with constitutional system prompt
   */
  private initializeConversation(): void {
    this.conversationHistory = [{
      role: 'system',
      content: this.getEnhancedConstitutionalPrompt(),
      timestamp: new Date()
    }];
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
   * Retry initialization if failed
   */
  async retryInitialization(): Promise<void> {
    if (!this.currentState.isInitialized && !this.currentState.isLoading) {
      await this.initializeModel();
    }
  }

  /**
   * Switch to different model
   */
  async switchModel(modelId: string): Promise<void> {
    console.log(`[AiCoachEnhanced] Switching to model: ${modelId}`);
    this.updateState({ isInitialized: false, modelLoaded: false });
    await this.initializeModel(modelId);
  }

  /**
   * Get model information
   */
  getModelInfo(): ModelOption | undefined {
    const currentModelId = this.currentState.currentModel;
    return this.availableModels.find(m => m.id === currentModelId);
  }

  /**
   * Update internal state
   */
  private updateState(updates: Partial<AiCoachState>): void {
    const currentState = this.stateSubject.value;
    const newState = { ...currentState, ...updates };
    this.stateSubject.next(newState);
  }

  private applyConstitutionalPrompt(prompt: string): string {
    // This is a simplified example. A real implementation would be more robust.
    const principles = [
      "Please be a supportive, empathetic, and friendly AI wellness coach.",
      "Do not provide medical advice. Instead, suggest users consult a professional.",
      "Encourage positive self-reflection and mindfulness.",
      "If the user expresses thoughts of self-harm, immediately provide resources for help and express concern."
    ];

    // This could be customized based on `this.settings.responseStyle`
    return `${principles.join(' ')}\n\nUser: ${prompt}\nAI:`;
  }
  
  public getStorageUsage(): string {
    const history = localStorage.getItem('conversation_messages');
    if (!history) return '0 MB';
    const sizeInMB = (history.length / (1024 * 1024)).toFixed(2);
    return `${sizeInMB} MB`;
  }

  public getConversationCount(): number {
    const history = this.getConversationHistory();
    return history.length;
  }

  public exportConversationHistory(): void {
    const history = this.getConversationHistory();
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resilience-ai-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  public clearConversationHistory(): void {
    localStorage.removeItem('conversation_messages');
    this.conversationHistory = [];
  }

  private addMessageToHistory(message: ConversationMessage): void {
    this.conversationHistory.push(message);
    this.saveConversationHistory();
  }

  private saveConversationHistory(): void {
    localStorage.setItem('conversation_messages', JSON.stringify(this.conversationHistory));
  }
} 