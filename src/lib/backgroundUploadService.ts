/**
 * Background Upload Service
 * Manages file uploads using Web Workers for non-blocking performance
 * Integrates with IndexedDB and network management for reliability
 */

import { uploadDatabase, type UploadRecord } from './uploadDatabase';
import { networkManager } from './networkManager';
import { UPLOAD_LIMITS } from '@/constants/upload';

interface UploadOptions {
  file: File;
  fileName: string;
  userId: string;
  eventId: string;
  projectId: string;
  accessToken: string;
  metadata?: Record<string, any>;
}

interface UploadProgress {
  uploadId: string;
  bytesUploaded: number;
  bytesTotal: number;
  percentage: number;
  speed: number;
  estimatedTimeRemaining?: number;
}

type UploadEventType = 
  | 'started'
  | 'progress' 
  | 'paused'
  | 'resumed'
  | 'completed'
  | 'failed'
  | 'cancelled';

interface UploadEvent {
  type: UploadEventType;
  uploadId: string;
  data?: any;
  error?: string;
}

type UploadEventHandler = (event: UploadEvent) => void;

class BackgroundUploadService {
  private worker: Worker | null = null;
  private eventHandlers: Map<string, UploadEventHandler[]> = new Map();
  private activeUploads: Map<string, UploadRecord> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize IndexedDB
      await uploadDatabase.initialize();

      // Create upload worker
      this.worker = new Worker('/upload-worker.js');
      this.setupWorkerHandlers();

      // Load active uploads from database
      await this.loadActiveUploads();

      // Setup network monitoring
      networkManager.onConnectionChange((status) => {
        if (status.online) {
          this.resumeAllUploads();
        } else {
          this.pauseAllUploads();
        }
      });

      this.initialized = true;
      console.log('✅ Background Upload Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Background Upload Service:', error);
      throw error;
    }
  }

  private setupWorkerHandlers(): void {
    if (!this.worker) return;

    this.worker.addEventListener('message', (event) => {
      const { type, uploadId, data, error } = event.data;

      switch (type) {
        case 'UPLOAD_STARTED':
          this.handleUploadStarted(uploadId, data);
          break;
        case 'UPLOAD_PROGRESS':
          this.handleUploadProgress(uploadId, data);
          break;
        case 'UPLOAD_SUCCESS':
          this.handleUploadSuccess(uploadId, data);
          break;
        case 'UPLOAD_ERROR':
          this.handleUploadError(uploadId, error);
          break;
        case 'UPLOAD_PAUSED':
          this.handleUploadPaused(uploadId);
          break;
        case 'UPLOAD_RESUMED':
          this.handleUploadResumed(uploadId);
          break;
        case 'UPLOAD_CANCELLED':
          this.handleUploadCancelled(uploadId);
          break;
        default:
          console.warn('Unknown worker message type:', type);
      }
    });

    this.worker.addEventListener('error', (error) => {
      console.error('Upload worker error:', error);
      this.emitEvent('failed', '', { error: 'Worker error occurred' });
    });
  }

  private async loadActiveUploads(): Promise<void> {
    try {
      const uploads = await uploadDatabase.getActiveUploads();
      
      for (const upload of uploads) {
        this.activeUploads.set(upload.id, upload);
        
        // Resume uploads that were in progress
        if (upload.status === 'uploading' && networkManager.isOnline()) {
          await this.resumeUpload(upload.id);
        }
      }

      console.log(`📋 Loaded ${uploads.length} active uploads from database`);
    } catch (error) {
      console.error('Failed to load active uploads:', error);
    }
  }

  async startUpload(options: UploadOptions): Promise<string> {
    await this.initialize();

    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { file, fileName, userId, eventId, projectId, accessToken, metadata = {} } = options;

    // Determine optimal chunk size
    let chunkSize = UPLOAD_LIMITS.CHUNK_SIZE_SMALL; // 2MB default
    if (file.size >= UPLOAD_LIMITS.LARGE_FILE_THRESHOLD) {
      chunkSize = UPLOAD_LIMITS.CHUNK_SIZE_LARGE;
    } else if (file.size >= UPLOAD_LIMITS.MEDIUM_FILE_THRESHOLD) {
      chunkSize = UPLOAD_LIMITS.CHUNK_SIZE_MEDIUM;
    }

    // Create upload record
    const uploadRecord: UploadRecord = {
      id: uploadId,
      sessionId: uploadId,
      fileName,
      fileSize: file.size,
      fileType: file.type,
      chunkSize,
      totalChunks: Math.ceil(file.size / chunkSize),
      uploadedChunks: [],
      progress: 0,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      retryCount: 0,
      maxRetries: 5,
      metadata: {
        userId,
        eventId,
        projectId,
        filePath: `${userId}/${Date.now()}-${fileName}`
      }
    };

    // Save to database
    await uploadDatabase.saveUpload(uploadRecord);
    this.activeUploads.set(uploadId, uploadRecord);

    // Start upload in worker
    const workerData = {
      file: file,
      fileName: uploadRecord.metadata.filePath,
      endpoint: `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        'x-upsert': 'true'
      },
      metadata: {
        bucketName: 'session-uploads',
        objectName: uploadRecord.metadata.filePath,
        contentType: file.type,
        cacheControl: '3600',
        ...metadata
      },
      chunkSize,
      retryDelays: [0, 1000, 3000, 5000, 10000]
    };

    this.worker?.postMessage({
      type: 'START_UPLOAD',
      uploadId,
      data: workerData
    });

    // Record analytics
    await uploadDatabase.recordAnalytics(uploadId, 'upload_started', {
      fileSize: file.size,
      chunkSize,
      networkQuality: networkManager.getConnectionQuality()
    });

    return uploadId;
  }

  async pauseUpload(uploadId: string): Promise<void> {
    const upload = this.activeUploads.get(uploadId);
    if (upload && upload.status === 'uploading') {
      this.worker?.postMessage({
        type: 'PAUSE_UPLOAD',
        uploadId
      });
    }
  }

  async resumeUpload(uploadId: string): Promise<void> {
    const upload = this.activeUploads.get(uploadId);
    if (upload && upload.status === 'paused') {
      this.worker?.postMessage({
        type: 'RESUME_UPLOAD',
        uploadId
      });
    }
  }

  async cancelUpload(uploadId: string): Promise<void> {
    const upload = this.activeUploads.get(uploadId);
    if (upload) {
      this.worker?.postMessage({
        type: 'CANCEL_UPLOAD',
        uploadId
      });
    }
  }

  async pauseAllUploads(): Promise<void> {
    const uploadingUploads = Array.from(this.activeUploads.values())
      .filter(upload => upload.status === 'uploading');

    for (const upload of uploadingUploads) {
      await this.pauseUpload(upload.id);
    }
  }

  async resumeAllUploads(): Promise<void> {
    const pausedUploads = Array.from(this.activeUploads.values())
      .filter(upload => upload.status === 'paused');

    for (const upload of pausedUploads) {
      await this.resumeUpload(upload.id);
    }
  }

  // Event handlers from worker
  private async handleUploadStarted(uploadId: string, data: any): Promise<void> {
    const upload = this.activeUploads.get(uploadId);
    if (upload) {
      upload.status = 'uploading';
      upload.updatedAt = Date.now();
      await uploadDatabase.saveUpload(upload);
    }

    this.emitEvent('started', uploadId, data);
  }

  private async handleUploadProgress(uploadId: string, data: UploadProgress): Promise<void> {
    const upload = this.activeUploads.get(uploadId);
    if (upload) {
      upload.progress = data.percentage;
      upload.updatedAt = Date.now();
      await uploadDatabase.updateUploadProgress(uploadId, data.percentage);
    }

    // Calculate estimated time remaining
    if (data.speed > 0) {
      const remainingBytes = data.bytesTotal - data.bytesUploaded;
      data.estimatedTimeRemaining = Math.round(remainingBytes / data.speed);
    }

    this.emitEvent('progress', uploadId, data);
  }

  private async handleUploadSuccess(uploadId: string, data: any): Promise<void> {
    const upload = this.activeUploads.get(uploadId);
    if (upload) {
      await uploadDatabase.markUploadComplete(uploadId);
      this.activeUploads.delete(uploadId);
    }

    // Record analytics
    await uploadDatabase.recordAnalytics(uploadId, 'upload_completed', {
      duration: upload ? Date.now() - upload.createdAt : 0,
      retryCount: upload?.retryCount || 0
    });

    this.emitEvent('completed', uploadId, data);
  }

  private async handleUploadError(uploadId: string, error: string): Promise<void> {
    const upload = this.activeUploads.get(uploadId);
    if (upload) {
      await uploadDatabase.markUploadFailed(uploadId, error);
      
      // Try to retry with smart logic if retries remain
      if (upload.retryCount < upload.maxRetries) {
        console.log(`🔄 Auto-retrying upload ${uploadId} (attempt ${upload.retryCount + 1}/${upload.maxRetries})`);
        
        setTimeout(async () => {
          await this.resumeUpload(uploadId);
        }, networkManager.calculateRetryDelay(upload.retryCount));
        
        return;
      }
    }

    this.emitEvent('failed', uploadId, { error });
  }

  private async handleUploadPaused(uploadId: string): Promise<void> {
    const upload = this.activeUploads.get(uploadId);
    if (upload) {
      upload.status = 'paused';
      upload.updatedAt = Date.now();
      await uploadDatabase.saveUpload(upload);
    }

    this.emitEvent('paused', uploadId);
  }

  private async handleUploadResumed(uploadId: string): Promise<void> {
    const upload = this.activeUploads.get(uploadId);
    if (upload) {
      upload.status = 'uploading';
      upload.updatedAt = Date.now();
      await uploadDatabase.saveUpload(upload);
    }

    this.emitEvent('resumed', uploadId);
  }

  private async handleUploadCancelled(uploadId: string): Promise<void> {
    const upload = this.activeUploads.get(uploadId);
    if (upload) {
      await uploadDatabase.deleteUpload(uploadId);
      this.activeUploads.delete(uploadId);
    }

    this.emitEvent('cancelled', uploadId);
  }

  // Event management
  on(event: UploadEventType, handler: UploadEventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    
    this.eventHandlers.get(event)!.push(handler);
    
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) handlers.splice(index, 1);
      }
    };
  }

  private emitEvent(type: UploadEventType, uploadId: string, data?: any): void {
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      const event: UploadEvent = { type, uploadId, data };
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('Error in upload event handler:', error);
        }
      });
    }
  }

  // Utility methods
  getActiveUploads(): UploadRecord[] {
    return Array.from(this.activeUploads.values());
  }

  getUpload(uploadId: string): UploadRecord | undefined {
    return this.activeUploads.get(uploadId);
  }

  async cleanup(): Promise<void> {
    // Cleanup expired uploads
    const cleanedCount = await uploadDatabase.cleanupExpiredUploads(24);
    console.log(`🧹 Cleaned up ${cleanedCount} expired uploads`);
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.eventHandlers.clear();
    this.activeUploads.clear();
    this.initialized = false;
  }
}

// Export singleton instance
export const backgroundUploadService = new BackgroundUploadService();
export type { UploadOptions, UploadProgress, UploadEvent, UploadEventType, UploadEventHandler };