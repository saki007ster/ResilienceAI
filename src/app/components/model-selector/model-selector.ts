import { Component, Output, EventEmitter, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModelOption, AiCoachEnhancedService } from '../../services/ai-coach-enhanced.service';
import { SettingsService } from '../../services/settings.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-model-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './model-selector.html',
  styleUrl: './model-selector.scss'
})
export class ModelSelector {
  @Input() currentModel: string | null = null;
  @Input() isLoading: boolean = false;
  @Input() isInitialized: boolean = false;
  @Input() progress: number = 0;
  @Input() progressText: string = '';
  @Input() modelCached: boolean = false;
  @Input() cacheSize: number = 0;
  
  @Output() modelSelected = new EventEmitter<string>();
  @Output() initializeTriggered = new EventEmitter<void>();
  @Output() clearCacheTriggered = new EventEmitter<void>();

  private settingsService = inject(SettingsService);
  private router = inject(Router);
  private aiCoachService = inject(AiCoachEnhancedService);

  availableModels: ModelOption[] = [];
  selectedModelId: string = '';

  ngOnInit() {
    this.availableModels = this.aiCoachService.availableModels;
    // Set default selection to the first recommended model
    if (this.availableModels.length > 0 && !this.selectedModelId) {
      this.selectedModelId = this.availableModels.find(m => m.recommended)?.id || this.availableModels[0].id;
    }
  }

  ngOnChanges() {
    // Update selection when current model changes
    if (this.currentModel) {
      this.selectedModelId = this.currentModel;
    }
  }

  onModelChange(modelId: string) {
    this.selectedModelId = modelId;
    if (this.isInitialized) {
      this.modelSelected.emit(modelId);
    }
  }

  onInitializeClick() {
    if (this.selectedModelId) {
      this.modelSelected.emit(this.selectedModelId);
      const currentAiSettings = this.settingsService.getSettings().ai;
      this.settingsService.updateSettings({
        ai: { ...currentAiSettings, selectedModel: this.selectedModelId }
      });
      this.initializeTriggered.emit();
      this.router.navigate(['/chat']);
    }
  }

  onClearCache() {
    if (confirm('Are you sure you want to clear all cached models? This will free up storage space but require re-downloading models.')) {
      this.clearCacheTriggered.emit();
    }
  }

  getModelById(modelId: string): ModelOption | undefined {
    return this.availableModels.find(model => model.id === modelId);
  }

  getSpecializationIcon(specialization: string): string {
    switch (specialization) {
      case 'therapy': return '🧠';
      case 'wellness': return '💚';
      case 'general': return '🤖';
      default: return '💬';
    }
  }

  getSpecializationLabel(specialization: string): string {
    switch (specialization) {
      case 'therapy': return 'Therapy';
      case 'wellness': return 'Wellness';
      case 'general': return 'General';
      default: return 'AI';
    }
  }

  formatCacheSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  isModelCached(modelId: string): boolean {
    // This is a simple check - in a real implementation, you might want to 
    // track which specific models are cached
    return this.modelCached && this.cacheSize > 0;
  }
} 