import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  showTimestamps: boolean;
}

export interface AiSettings {
  device: 'webgpu' | 'wasm' | 'auto';
  selectedModel: string | null;
  responseStyle: 'supportive' | 'direct' | 'detailed';
  maxHistoryLength: number;
  enableConstitutionalAI: boolean;
}

export interface AudioSettings {
  selectedVoiceIndex: number;
  rate: number;
  pitch: number;
  volume: number;
  autoSpeakResponses: boolean;
}

export interface AllSettings {
  app: AppSettings;
  ai: AiSettings;
  audio: AudioSettings;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private static readonly STORAGE_KEY = 'resilience_ai_settings';

  private defaultSettings: AllSettings = {
    app: {
      theme: 'auto',
      showTimestamps: true
    },
    ai: {
      device: 'auto',
      selectedModel: null,
      responseStyle: 'supportive',
      maxHistoryLength: 50,
      enableConstitutionalAI: true
    },
    audio: {
      selectedVoiceIndex: 0,
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      autoSpeakResponses: false
    }
  };

  private settingsSubject = new BehaviorSubject<AllSettings>(this.loadSettings());
  public settings$ = this.settingsSubject.asObservable();

  constructor() {
    this.applyTheme();
  }

  private loadSettings(): AllSettings {
    try {
      const savedSettings = localStorage.getItem(SettingsService.STORAGE_KEY);
      if (savedSettings) {
        // Deep merge to handle partial or outdated saved settings
        const parsed = JSON.parse(savedSettings);
        return {
          app: { ...this.defaultSettings.app, ...parsed.app },
          ai: { ...this.defaultSettings.ai, ...parsed.ai },
          audio: { ...this.defaultSettings.audio, ...parsed.audio }
        };
      }
    } catch (error) {
      console.error('[SettingsService] Failed to load settings:', error);
    }
    return this.defaultSettings;
  }

  private saveSettings(settings: AllSettings): void {
    try {
      localStorage.setItem(SettingsService.STORAGE_KEY, JSON.stringify(settings));
      this.settingsSubject.next(settings);
    } catch (error) {
      console.error('[SettingsService] Failed to save settings:', error);
    }
  }

  public getSettings(): AllSettings {
    return this.settingsSubject.getValue();
  }

  public updateSettings(newSettings: Partial<AllSettings>): void {
    const currentSettings = this.getSettings();
    const updatedSettings = {
      app: { ...currentSettings.app, ...newSettings.app },
      ai: { ...currentSettings.ai, ...newSettings.ai },
      audio: { ...currentSettings.audio, ...newSettings.audio }
    };
    this.saveSettings(updatedSettings);

    if (newSettings.app?.theme) {
      this.applyTheme();
    }
  }

  public resetToDefaults(): void {
    this.saveSettings(this.defaultSettings);
    this.applyTheme();
  }

  private applyTheme(): void {
    const theme = this.getSettings().app.theme;
    document.body.classList.remove('light-theme', 'dark-theme');

    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.classList.add(prefersDark ? 'dark-theme' : 'light-theme');
    } else {
      document.body.classList.add(`${theme}-theme`);
    }
  }
} 