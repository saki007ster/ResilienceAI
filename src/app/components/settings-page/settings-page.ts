import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HeadTts, TTSOptions } from '../../services/head-tts';
import { AiCoachEnhancedService as AiCoachService } from '../../services/ai-coach-enhanced.service';
import { SettingsService, AllSettings, AppSettings, AiSettings, AudioSettings } from '../../services/settings.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss'
})
export class SettingsPage implements OnInit, OnDestroy {
  settings: AllSettings;
  availableVoices: SpeechSynthesisVoice[] = [];
  activeSection: string = 'app';
  storageUsed: string = '0 MB';
  conversationCount: number = 0;

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

  private settingsSubscription: Subscription;

  constructor(
    private ttsService: HeadTts,
    private aiCoachService: AiCoachService,
    private settingsService: SettingsService
  ) {
    this.settings = this.settingsService.getSettings();
    this.settingsSubscription = this.settingsService.settings$.subscribe(settings => {
      this.settings = settings;
    });
  }

  ngOnInit(): void {
    this.loadVoices();
    this.calculateStorageUsage();
  }

  ngOnDestroy(): void {
    this.settingsSubscription.unsubscribe();
  }

  updateSettings(part: 'app' | 'ai' | 'audio', newSettings: Partial<AppSettings> | Partial<AiSettings> | Partial<AudioSettings>) {
    this.settingsService.updateSettings({ [part]: newSettings });
  }

  updateAppSettings() {
    this.updateSettings('app', this.settings.app);
  }

  updateAiSettings() {
    this.updateSettings('ai', this.settings.ai);
  }

  updateAudioSettings() {
    this.updateSettings('audio', this.settings.audio);
    this.applyAudioSettings();
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  setTheme(theme: string): void {
    if (theme === 'light' || theme === 'dark' || theme === 'auto') {
      this.settings.app.theme = theme;
      this.updateAppSettings();
    }
  }
  
  setDevice(device: string): void {
    if (device === 'auto' || device === 'webgpu' || device === 'wasm') {
      this.settings.ai.device = device;
      this.updateAiSettings();
    }
  }
  
  setResponseStyle(style: string): void {
    if (style === 'supportive' || style === 'direct' || style === 'detailed') {
      this.settings.ai.responseStyle = style;
      this.updateAiSettings();
    }
  }
  
  loadVoices(): void {
    this.availableVoices = this.ttsService.getVoices();
    // Fallback if voices are not loaded yet
    if (this.availableVoices.length === 0) {
      setTimeout(() => this.loadVoices(), 500);
    }
  }

  applyAudioSettings(): void {
    const ttsOptions: TTSOptions = {
      voice: this.availableVoices[this.settings.audio.selectedVoiceIndex],
      rate: this.settings.audio.rate,
      pitch: this.settings.audio.pitch,
      volume: this.settings.audio.volume
    };
    this.ttsService.setOptions(ttsOptions);
  }

  testTTS(): void {
    this.applyAudioSettings();
    this.ttsService.speak('This is a test of the text to speech voice.');
  }

  getSelectedVoiceName(): string {
    if (this.availableVoices.length > 0 && this.settings.audio.selectedVoiceIndex < this.availableVoices.length) {
      return this.availableVoices[this.settings.audio.selectedVoiceIndex].name;
    }
    return 'No voice selected';
  }

  calculateStorageUsage(): void {
    this.storageUsed = this.aiCoachService.getStorageUsage();
    this.conversationCount = this.aiCoachService.getConversationCount();
  }

  exportUserData(): void {
    this.aiCoachService.exportConversationHistory();
  }

  clearConversationHistory(): void {
    if (confirm('Are you sure you want to clear all conversation history? This cannot be undone.')) {
      this.aiCoachService.clearConversationHistory();
      this.calculateStorageUsage();
      alert('Conversation history cleared.');
    }
  }

  resetAllSettings(): void {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      this.settingsService.resetToDefaults();
      this.applyAudioSettings();
      alert('Settings reset to defaults successfully!');
    }
  }
}
