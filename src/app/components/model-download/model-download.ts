import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ModelDownloadService, ModelDownloadStatus } from '../../services/model-download';

@Component({
  selector: 'app-model-download',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './model-download.html',
  styleUrl: './model-download.scss'
})
export class ModelDownload implements OnInit, OnDestroy {
  status: ModelDownloadStatus = {
    isDownloading: false,
    progress: 0,
    isComplete: false,
    cached: false
  };

  backgroundFetchSupported = false;
  showDownloadPrompt = false;
  private statusSubscription?: Subscription;

  constructor(private modelDownloadService: ModelDownloadService) {}

  async ngOnInit() {
    // Check Background Fetch API support
    this.backgroundFetchSupported = await this.modelDownloadService.isBackgroundFetchSupported();
    
    // Subscribe to download status updates
    this.statusSubscription = this.modelDownloadService.status$.subscribe(
      status => {
        this.status = status;
        
        // Show download prompt if model is not cached and not downloading
        this.showDownloadPrompt = !status.cached && !status.isDownloading && !status.isComplete;
      }
    );

    // Check initial model cache status
    await this.modelDownloadService.checkModelCache();
  }

  ngOnDestroy() {
    this.statusSubscription?.unsubscribe();
  }

  /**
   * Initiate model download with user consent
   */
  async downloadModel() {
    if (!this.backgroundFetchSupported) {
      alert('Your browser does not support background downloads. Please use a modern browser like Chrome or Edge.');
      return;
    }

    const success = await this.modelDownloadService.downloadModel();
    if (!success) {
      console.error('[ModelDownload] Failed to start download');
    }
  }

  /**
   * Retry download if failed
   */
  async retryDownload() {
    this.modelDownloadService.resetStatus();
    await this.downloadModel();
  }

  /**
   * Get model size in MB
   */
  getModelSize(): number {
    return this.modelDownloadService.getModelSize();
  }

  /**
   * Get progress percentage for display
   */
  getProgressPercentage(): number {
    return Math.round(this.status.progress);
  }

  /**
   * Check if download is in progress
   */
  get isDownloading(): boolean {
    return this.status.isDownloading;
  }

  /**
   * Check if model is ready
   */
  get isModelReady(): boolean {
    return this.status.cached && !this.status.isDownloading;
  }

  /**
   * Check if there's an error
   */
  get hasError(): boolean {
    return !!this.status.error;
  }

  /**
   * Get error message
   */
  get errorMessage(): string {
    return this.status.error || '';
  }
}
