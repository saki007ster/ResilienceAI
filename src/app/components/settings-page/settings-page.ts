import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HeadTts, TTSOptions } from '../../services/head-tts';
import { AiCoachEnhancedService as AiCoachService } from '../../services/ai-coach-enhanced.service';

interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  autoSpeak: boolean;
  showNotifications: boolean;
  animateAvatar: boolean;
  showTimestamps: boolean;
}

interface AISettings {
  device: 'webgpu' | 'wasm' | 'auto';
  responseStyle: 'supportive' | 'direct' | 'detailed';
  maxHistoryLength: number;
  enableConstitutionalAI: boolean;
}

interface AudioSettings {
  selectedVoiceIndex: number;
  rate: number;
  pitch: number;
  volume: number;
  autoSpeakResponses: boolean;
}

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss'
})
export class SettingsPage implements OnInit, OnDestroy {
  // Settings objects
  appSettings: AppSettings = {
    theme: 'auto',
    autoSpeak: false,
    showNotifications: true,
    animateAvatar: true,
    showTimestamps: true
  };

  aiSettings: AISettings = {
    device: 'auto',
    responseStyle: 'supportive',
    maxHistoryLength: 50,
    enableConstitutionalAI: true
  };

  audioSettings: AudioSettings = {
    selectedVoiceIndex: 0,
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    autoSpeakResponses: false
  };

  // Available options
  availableVoices: SpeechSynthesisVoice[] = [];
  themes = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'auto', label: 'Auto', icon: '🔄' }
  ];

  responseStyles = [
    { value: 'supportive', label: 'Supportive & Empathetic', description: 'Warm, understanding responses focused on emotional support' },
    { value: 'direct', label: 'Direct & Practical', description: 'Clear, actionable advice with minimal emotional language' },
    { value: 'detailed', label: 'Detailed & Educational', description: 'In-depth explanations with background information' }
  ];

  devices = [
    { value: 'auto', label: 'Auto-detect', description: 'Let the system choose the best option' },
    { value: 'webgpu', label: 'WebGPU', description: 'Hardware acceleration (faster, requires modern GPU)' },
    { value: 'wasm', label: 'WebAssembly', description: 'CPU-based processing (compatible with all devices)' }
  ];

  // Active section
  activeSection: string = 'app';

  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Statistics
  storageUsed: string = '0 MB';
  conversationCount: number = 0;

  constructor(
    private ttsService: HeadTts,
    private aiCoachService: AiCoachService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
    this.loadVoices();
    this.calculateStorageUsage();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    try {
      const savedAppSettings = localStorage.getItem('app_settings');
      if (savedAppSettings) {
        this.appSettings = { ...this.appSettings, ...JSON.parse(savedAppSettings) };
      }

      const savedAiSettings = localStorage.getItem('ai_settings');
      if (savedAiSettings) {
        this.aiSettings = { ...this.aiSettings, ...JSON.parse(savedAiSettings) };
      }

      const savedAudioSettings = localStorage.getItem('audio_settings');
      if (savedAudioSettings) {
        this.audioSettings = { ...this.audioSettings, ...JSON.parse(savedAudioSettings) };
      }

      console.log('[Settings] Loaded settings from localStorage');
    } catch (error) {
      console.error('[Settings] Failed to load settings:', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('app_settings', JSON.stringify(this.appSettings));
      localStorage.setItem('ai_settings', JSON.stringify(this.aiSettings));
      localStorage.setItem('audio_settings', JSON.stringify(this.audioSettings));
      console.log('[Settings] Settings saved to localStorage');
    } catch (error) {
      console.error('[Settings] Failed to save settings:', error);
    }
  }

  /**
   * Load available TTS voices
   */
  private async loadVoices(): Promise<void> {
    try {
      // Wait for voices to be available
      const waitForVoices = () => {
        return new Promise<void>((resolve) => {
          const loadVoices = () => {
            this.availableVoices = speechSynthesis.getVoices();
            if (this.availableVoices.length > 0) {
              console.log('[Settings] Loaded', this.availableVoices.length, 'TTS voices');
              resolve();
            } else {
              setTimeout(loadVoices, 100);
            }
          };
          
          if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
          }
          loadVoices();
        });
      };

      await waitForVoices();
    } catch (error) {
      console.error('[Settings] Failed to load voices:', error);
    }
  }

  /**
   * Calculate storage usage
   */
  private calculateStorageUsage(): void {
    try {
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length;
        }
      }
      
      const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
      this.storageUsed = sizeInMB + ' MB';

      // Count conversations (mock data for now)
      const chatHistory = localStorage.getItem('chat_history');
      if (chatHistory) {
        try {
          const history = JSON.parse(chatHistory);
          this.conversationCount = Array.isArray(history) ? history.length : 0;
        } catch {
          this.conversationCount = 0;
        }
      }
    } catch (error) {
      console.error('[Settings] Failed to calculate storage:', error);
      this.storageUsed = 'Unknown';
    }
  }

  /**
   * Set active settings section
   */
  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  /**
   * Update app settings
   */
  updateAppSettings(): void {
    this.saveSettings();
    this.applyTheme();
  }

  /**
   * Update AI settings
   */
  updateAiSettings(): void {
    this.saveSettings();
    // Could trigger AI service reconfiguration here
  }

  /**
   * Update audio settings
   */
  updateAudioSettings(): void {
    this.saveSettings();
    this.applyAudioSettings();
  }

  /**
   * Apply theme setting
   */
  private applyTheme(): void {
    const root = document.documentElement;
    
    if (this.appSettings.theme === 'dark') {
      root.classList.add('dark-theme');
    } else if (this.appSettings.theme === 'light') {
      root.classList.remove('dark-theme');
    } else {
      // Auto theme - use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark-theme');
      } else {
        root.classList.remove('dark-theme');
      }
    }
  }

  /**
   * Apply audio settings to TTS service
   */
  private applyAudioSettings(): void {
    const selectedVoice = this.availableVoices[this.audioSettings.selectedVoiceIndex];
    const ttsOptions: TTSOptions = {
      voice: selectedVoice,
      rate: this.audioSettings.rate,
      pitch: this.audioSettings.pitch,
      volume: this.audioSettings.volume
    };

    // Apply settings to TTS service
    // Note: Actual implementation would depend on TTS service API
    console.log('[Settings] Applied audio settings:', ttsOptions);
  }

  /**
   * Test TTS with current settings
   */
  testTTS(): void {
    const testText = "Hello! This is how I sound with your current audio settings.";
    this.ttsService.speak(testText);
  }

  /**
   * Reset all settings to defaults
   */
  resetAllSettings(): void {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      this.appSettings = {
        theme: 'auto',
        autoSpeak: false,
        showNotifications: true,
        animateAvatar: true,
        showTimestamps: true
      };

      this.aiSettings = {
        device: 'auto',
        responseStyle: 'supportive',
        maxHistoryLength: 50,
        enableConstitutionalAI: true
      };

      this.audioSettings = {
        selectedVoiceIndex: 0,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        autoSpeakResponses: false
      };

      this.saveSettings();
      this.applyTheme();
      this.applyAudioSettings();
      
      alert('Settings reset to defaults successfully!');
    }
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory(): void {
    if (confirm('Are you sure you want to clear all conversation history? This cannot be undone.')) {
      localStorage.removeItem('chat_history');
      localStorage.removeItem('conversation_messages');
      this.conversationCount = 0;
      this.calculateStorageUsage();
      alert('Conversation history cleared successfully!');
    }
  }

  /**
   * Export user data
   */
  exportUserData(): void {
    try {
      const userData = {
        appSettings: this.appSettings,
        aiSettings: this.aiSettings,
        audioSettings: this.audioSettings,
        chatHistory: JSON.parse(localStorage.getItem('chat_history') || '[]'),
        exportDate: new Date().toISOString()
      };

      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `resilience-ai-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      alert('Data exported successfully!');
    } catch (error) {
      console.error('[Settings] Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  }

  /**
   * Get selected voice name
   */
  getSelectedVoiceName(): string {
    const voice = this.availableVoices[this.audioSettings.selectedVoiceIndex];
    return voice ? `${voice.name} (${voice.lang})` : 'Default Voice';
  }

  /**
   * Set theme with type safety
   */
  setTheme(theme: string): void {
    if (theme === 'light' || theme === 'dark' || theme === 'auto') {
      this.appSettings.theme = theme;
      this.updateAppSettings();
    }
  }

  /**
   * Set device with type safety
   */
  setDevice(device: string): void {
    if (device === 'webgpu' || device === 'wasm' || device === 'auto') {
      this.aiSettings.device = device;
      this.updateAiSettings();
    }
  }

  /**
   * Set response style with type safety
   */
  setResponseStyle(style: string): void {
    if (style === 'supportive' || style === 'direct' || style === 'detailed') {
      this.aiSettings.responseStyle = style;
      this.updateAiSettings();
    }
  }
}
