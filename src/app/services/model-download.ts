import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { filter, map } from 'rxjs/operators';

// Extend ServiceWorkerRegistration interface for backgroundFetch
declare global {
  interface ServiceWorkerRegistration {
    backgroundFetch?: any;
  }
}

export interface ModelDownloadStatus {
  isDownloading: boolean;
  progress: number;
  isComplete: boolean;
  error?: string;
  cached: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ModelDownloadService {
  private statusSubject = new BehaviorSubject<ModelDownloadStatus>({
    isDownloading: false,
    progress: 0,
    isComplete: false,
    cached: false
  });

  public status$ = this.statusSubject.asObservable();

  constructor() {
    this.initializeServiceWorkerListener();
    this.checkModelCache();
  }

  /**
   * Check if the model is already cached
   */
  async checkModelCache(): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator)) {
        console.warn('[ModelDownload] Service Worker not supported');
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      if (!registration.active) {
        console.warn('[ModelDownload] No active service worker');
        return false;
      }

      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        
        messageChannel.port1.onmessage = (event) => {
          const cached = event.data.cached || false;
          this.updateStatus({ cached });
          resolve(cached);
        };

        registration.active?.postMessage(
          { type: 'CHECK_MODEL_CACHE' },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('[ModelDownload] Error checking model cache:', error);
      return false;
    }
  }

  /**
   * Initiate model download using Background Fetch
   */
  async downloadModel(): Promise<boolean> {
    try {
      console.log('[ModelDownload] Starting model download...');
      
      // Check if Background Fetch is supported
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker not supported');
      }

      const registration = await navigator.serviceWorker.ready;
      
      if (!registration.backgroundFetch) {
        throw new Error('Background Fetch API not supported in this browser');
      }

      this.updateStatus({ isDownloading: true, progress: 0, error: undefined });

      // Request download from service worker
      const result = await new Promise<any>((resolve, reject) => {
        const messageChannel = new MessageChannel();
        
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            resolve(event.data);
          } else {
            reject(new Error(event.data.error || 'Download initiation failed'));
          }
        };

        if (registration.active) {
          registration.active.postMessage(
            { type: 'INITIATE_MODEL_DOWNLOAD' },
            [messageChannel.port2]
          );
        } else {
          reject(new Error('No active service worker available'));
        }
      });

      console.log('[ModelDownload] Download initiated:', result);
      return true;

    } catch (error) {
      console.error('[ModelDownload] Failed to start download:', error);
      this.updateStatus({ 
        isDownloading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Listen for service worker messages
   */
  private initializeServiceWorkerListener(): void {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('[ModelDownload] Service worker message:', event.data);
      
      switch (event.data.type) {
        case 'MODEL_NOT_CACHED':
          this.updateStatus({ cached: false });
          break;
          
        case 'MODEL_DOWNLOAD_COMPLETE':
          this.updateStatus({ 
            isDownloading: false, 
            isComplete: true, 
            progress: 100,
            cached: true,
            error: undefined
          });
          break;
          
        case 'MODEL_DOWNLOAD_FAILED':
          this.updateStatus({ 
            isDownloading: false, 
            error: event.data.message || 'Download failed' 
          });
          break;
      }
    });
  }

  /**
   * Update download status
   */
  private updateStatus(update: Partial<ModelDownloadStatus>): void {
    const currentStatus = this.statusSubject.value;
    this.statusSubject.next({ ...currentStatus, ...update });
  }

  /**
   * Reset download status
   */
  resetStatus(): void {
    this.statusSubject.next({
      isDownloading: false,
      progress: 0,
      isComplete: false,
      cached: false
    });
  }

  /**
   * Get current status synchronously
   */
  getCurrentStatus(): ModelDownloadStatus {
    return this.statusSubject.value;
  }

  /**
   * Check if model is ready for use
   */
  isModelReady(): boolean {
    const status = this.getCurrentStatus();
    return status.cached && !status.isDownloading;
  }

  /**
   * Check Background Fetch API support
   */
  async isBackgroundFetchSupported(): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator)) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      return 'backgroundFetch' in registration;
    } catch {
      return false;
    }
  }

  /**
   * Get estimated download size in MB
   */
  getModelSize(): number {
    return 1; // 1MB for testing (will be 529MB in production)
  }

  /**
   * Get model download URL
   */
  getModelUrl(): string {
    return '/assets/gemma-model.bin';
  }
}
