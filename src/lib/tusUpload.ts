import { Upload as TUSUpload } from 'tus-js-client';
import { UPLOAD_LIMITS } from '@/constants/upload';
import { backgroundUploadService, type UploadOptions } from './backgroundUploadService';
import { networkManager } from './networkManager';
import { uploadDatabase } from './uploadDatabase';

interface TUSUploadOptions {
  file: File;
  fileName: string;
  userId: string;
  projectId: string;
  accessToken: string;
  onProgress?: (percentage: number) => void;
}

interface TUSUploadResult {
  path: string;
  fullPath: string;
}

// Upload persistence utilities
interface UploadState {
  sessionId: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  timestamp: number;
}

export const saveUploadState = (uploadId: string, state: UploadState) => {
  try {
    const uploads = getStoredUploads();
    uploads[uploadId] = state;
    localStorage.setItem('active_uploads', JSON.stringify(uploads));
  } catch (error) {
    console.warn('Failed to save upload state:', error);
  }
};

export const getStoredUploads = (): Record<string, UploadState> => {
  try {
    const stored = localStorage.getItem('active_uploads');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const removeUploadState = (uploadId: string) => {
  try {
    const uploads = getStoredUploads();
    delete uploads[uploadId];
    localStorage.setItem('active_uploads', JSON.stringify(uploads));
  } catch (error) {
    console.warn('Failed to remove upload state:', error);
  }
};

export const clearExpiredUploads = () => {
  try {
    const uploads = getStoredUploads();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    Object.keys(uploads).forEach(id => {
      if (now - uploads[id].timestamp > oneHour) {
        delete uploads[id];
      }
    });
    
    localStorage.setItem('active_uploads', JSON.stringify(uploads));
  } catch (error) {
    console.warn('Failed to clear expired uploads:', error);
  }
};

// Progress throttling utility
class ProgressThrottler {
  private lastUpdate = 0;
  private readonly throttleMs = 500; // Max 2 updates per second
  
  shouldUpdate(): boolean {
    const now = Date.now();
    if (now - this.lastUpdate >= this.throttleMs) {
      this.lastUpdate = now;
      return true;
    }
    return false;
  }
}

/**
 * Enhanced TUS upload with background service integration
 * Uses Web Workers for non-blocking uploads and IndexedDB for persistence
 */
export const uploadFileWithTUSEnhanced = async ({
  file,
  fileName,
  userId,
  projectId,
  accessToken,
  onProgress,
  eventId
}: TUSUploadOptions & { eventId: string }): Promise<TUSUploadResult> => {
  try {
    console.log('🚀 Starting enhanced TUS upload:', {
      fileName,
      fileSize: file.size,
      fileSizeMB: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      networkQuality: networkManager.getConnectionQuality()
    });

    // Use background service for large files or when network quality is poor
    const shouldUseBackgroundService = file.size > 50 * 1024 * 1024 || // > 50MB
                                      networkManager.getConnectionQuality() === 'poor';

    if (shouldUseBackgroundService) {
      console.log('📋 Using background upload service for enhanced reliability');
      
      const uploadOptions: UploadOptions = {
        file,
        fileName,
        userId,
        eventId,
        projectId,
        accessToken
      };

      const uploadId = await backgroundUploadService.startUpload(uploadOptions);

      // Set up progress listener
      const progressUnsubscribe = backgroundUploadService.on('progress', (event) => {
        if (event.uploadId === uploadId && onProgress) {
          onProgress(event.data.percentage);
        }
      });

      // Return promise that resolves when upload completes
      return new Promise((resolve, reject) => {
        const completeUnsubscribe = backgroundUploadService.on('completed', (event) => {
          if (event.uploadId === uploadId) {
            progressUnsubscribe();
            completeUnsubscribe();
            failedUnsubscribe();
            resolve({
              path: fileName,
              fullPath: fileName
            });
          }
        });

        const failedUnsubscribe = backgroundUploadService.on('failed', (event) => {
          if (event.uploadId === uploadId) {
            progressUnsubscribe();
            completeUnsubscribe();
            failedUnsubscribe();
            reject(new Error(event.data?.error || 'Upload failed'));
          }
        });
      });
    } else {
      // Use direct TUS upload for smaller files
      return uploadFileWithTUSDirect({
        file,
        fileName,
        userId,
        projectId,
        accessToken,
        onProgress
      });
    }
  } catch (error) {
    console.error('❌ Enhanced TUS upload failed:', error);
    throw error;
  }
};

/**
 * Direct TUS upload (legacy method with optimizations)
 * Used for smaller files or when background service is not needed
 */
export const uploadFileWithTUSDirect = ({
  file,
  fileName,
  userId,
  projectId,
  accessToken,
  onProgress
}: TUSUploadOptions): Promise<TUSUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const progressThrottler = new ProgressThrottler();
    
    console.log('🚀 Starting direct TUS upload:', {
      fileName,
      fileSize: file.size,
      fileSizeMB: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      uploadId
    });

    // Determine optimal chunk size based on file size and network quality
    let chunkSize = UPLOAD_LIMITS.CHUNK_SIZE_SMALL; // 2MB default
    const networkQuality = networkManager.getConnectionQuality();
    
    if (file.size >= UPLOAD_LIMITS.LARGE_FILE_THRESHOLD) {
      chunkSize = networkQuality === 'excellent' ? UPLOAD_LIMITS.CHUNK_SIZE_LARGE : UPLOAD_LIMITS.CHUNK_SIZE_MEDIUM;
    } else if (file.size >= UPLOAD_LIMITS.MEDIUM_FILE_THRESHOLD) {
      chunkSize = networkQuality === 'poor' ? UPLOAD_LIMITS.CHUNK_SIZE_SMALL : UPLOAD_LIMITS.CHUNK_SIZE_MEDIUM;
    }

    console.log(`📦 Using ${(chunkSize / 1024 / 1024).toFixed(1)}MB chunks (optimized for ${networkQuality} network)`);

    // Initialize upload state
    saveUploadState(uploadId, {
      sessionId: uploadId,
      fileName,
      fileSize: file.size,
      progress: 0,
      status: 'uploading',
      timestamp: Date.now()
    });

    const upload = new TUSUpload(file, {
      endpoint: `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`,
      retryDelays: networkManager.getRetryConfig('upload')?.retryDelays || [0, 1000, 3000, 5000, 10000],
      headers: {
        authorization: `Bearer ${accessToken}`,
        'x-upsert': 'true',
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: 'session-uploads',
        objectName: fileName,
        contentType: file.type,
        cacheControl: '3600',
      },
      chunkSize,
      onError: function (error) {
        console.error('❌ TUS Upload failed:', error);
        saveUploadState(uploadId, {
          sessionId: uploadId,
          fileName,
          fileSize: file.size,
          progress: 0,
          status: 'error',
          timestamp: Date.now()
        });
        reject(new Error(`TUS Upload failed: ${error.message || error}`));
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
        
        // Throttle progress updates - max 2 per second
        if (progressThrottler.shouldUpdate() || percentage >= 100) {
          console.log(`📤 Upload Progress: ${percentage}% (${(bytesUploaded/1024/1024).toFixed(1)}MB/${(bytesTotal/1024/1024).toFixed(1)}MB)`);
          
          // Update persistent state
          saveUploadState(uploadId, {
            sessionId: uploadId,
            fileName,
            fileSize: file.size,
            progress: percentage,
            status: 'uploading',
            timestamp: Date.now()
          });
        
        if (onProgress) {
          onProgress(percentage);
          }
        }
      },
      onSuccess: function () {
        console.log('✅ TUS Upload completed successfully!');
        saveUploadState(uploadId, {
          sessionId: uploadId,
          fileName,
          fileSize: file.size,
          progress: 100,
          status: 'complete',
          timestamp: Date.now()
        });
        
        // Clean up completed upload after 5 minutes
        setTimeout(() => removeUploadState(uploadId), 5 * 60 * 1000);
        
        resolve({
          path: fileName,
          fullPath: fileName
        });
      },
    });

    // Check for previous uploads and resume if found
    upload.findPreviousUploads().then(function (previousUploads) {
      if (previousUploads.length) {
        console.log('🔄 Resuming previous upload...');
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }
      
      upload.start();
    }).catch(reject);
  });
};

/**
 * Main upload function - automatically chooses best method
 */
export const uploadFileWithTUS = uploadFileWithTUSEnhanced;

/**
 * Determine if file should use TUS resumable upload
 * Uses centralized threshold from upload constants
 */
export const shouldUseTUS = (file: File): boolean => {
  return file.size > UPLOAD_LIMITS.TUS_THRESHOLD;
};