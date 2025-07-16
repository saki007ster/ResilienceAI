import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModelOption } from '../../services/ai-coach-enhanced.service';

@Component({
  selector: 'app-model-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './model-selector.html',
  styleUrl: './model-selector.scss'
})
export class ModelSelector {
  @Input() availableModels: ModelOption[] = [];
  @Input() currentModel: string | null = null;
  @Input() isLoading: boolean = false;
  @Input() isInitialized: boolean = false;
  @Input() progress: number = 0;
  @Input() progressText: string = '';
  
  @Output() modelSelected = new EventEmitter<string>();
  @Output() initializeTriggered = new EventEmitter<void>();

  selectedModelId: string = '';

  ngOnInit() {
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
      this.initializeTriggered.emit();
    }
  }

  getModelById(modelId: string): ModelOption | undefined {
    return this.availableModels.find(m => m.id === modelId);
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
      case 'therapy': return 'Therapy Focused';
      case 'wellness': return 'Wellness Optimized';
      case 'general': return 'General Purpose';
      default: return 'Conversational';
    }
  }
} 