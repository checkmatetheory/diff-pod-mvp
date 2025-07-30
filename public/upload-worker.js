/**
 * Background Upload Worker
 * Handles file uploads in a separate thread to prevent blocking the UI
 * Supports TUS resumable uploads, retry logic, and progress reporting
 */

// Import TUS client for Web Workers (using CDN)
importScripts('https://cdn.jsdelivr.net/npm/tus-js-client@3.1.3/dist/tus.min.js');

class UploadWorker {
  constructor() {
    this.activeUploads = new Map();
    this.setupMessageHandlers();
  }

  setupMessageHandlers() {
    self.addEventListener('message', (event) => {
      const { type, data, uploadId } = event.data;

      switch (type) {
        case 'START_UPLOAD':
          this.startUpload(uploadId, data);
          break;
        case 'PAUSE_UPLOAD':
          this.pauseUpload(uploadId);
          break;
        case 'RESUME_UPLOAD':
          this.resumeUpload(uploadId);
          break;
        case 'CANCEL_UPLOAD':
          this.cancelUpload(uploadId);
          break;
        case 'GET_STATUS':
          this.getUploadStatus(uploadId);
          break;
        default:
          this.postMessage({
            type: 'ERROR',
            uploadId,
            error: `Unknown message type: ${type}`
          });
      }
    });
  }

  async startUpload(uploadId, uploadData) {
    const {
      file,
      fileName,
      endpoint,
      headers,
      metadata,
      chunkSize,
      retryDelays
    } = uploadData;

    try {
      this.postMessage({
        type: 'UPLOAD_STARTED',
        uploadId,
        data: { fileName, fileSize: file.size }
      });

      // Create File object from transferred data
      const uploadFile = new File([file], fileName, { type: file.type });

      // Configure TUS upload
      const upload = new tus.Upload(uploadFile, {
        endpoint,
        retryDelays: retryDelays || [0, 1000, 3000, 5000, 10000],
        chunkSize: chunkSize || 2 * 1024 * 1024, // 2MB default
        headers,
        metadata,
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,

        onError: (error) => {
          this.postMessage({
            type: 'UPLOAD_ERROR',
            uploadId,
            error: error.message || error.toString()
          });
        },

        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
          
          this.postMessage({
            type: 'UPLOAD_PROGRESS',
            uploadId,
            data: {
              bytesUploaded,
              bytesTotal,
              percentage,
              speed: this.calculateUploadSpeed(uploadId, bytesUploaded)
            }
          });
        },

        onSuccess: () => {
          this.postMessage({
            type: 'UPLOAD_SUCCESS',
            uploadId,
            data: {
              path: fileName,
              fullPath: fileName
            }
          });
          
          this.cleanup(uploadId);
        }
      });

      // Store upload instance and metadata
      this.activeUploads.set(uploadId, {
        upload,
        startTime: Date.now(),
        lastProgressTime: Date.now(),
        lastProgressBytes: 0,
        status: 'starting'
      });

      // Check for previous uploads and resume if found
      const previousUploads = await upload.findPreviousUploads();
      if (previousUploads.length > 0) {
        this.postMessage({
          type: 'UPLOAD_RESUMING',
          uploadId,
          data: { previousUploadFound: true }
        });
        
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }

      // Start the upload
      this.activeUploads.get(uploadId).status = 'uploading';
      upload.start();

    } catch (error) {
      this.postMessage({
        type: 'UPLOAD_ERROR',
        uploadId,
        error: error.message || error.toString()
      });
    }
  }

  pauseUpload(uploadId) {
    const uploadInfo = this.activeUploads.get(uploadId);
    if (uploadInfo && uploadInfo.upload) {
      uploadInfo.upload.abort();
      uploadInfo.status = 'paused';
      
      this.postMessage({
        type: 'UPLOAD_PAUSED',
        uploadId
      });
    }
  }

  resumeUpload(uploadId) {
    const uploadInfo = this.activeUploads.get(uploadId);
    if (uploadInfo && uploadInfo.upload && uploadInfo.status === 'paused') {
      uploadInfo.upload.start();
      uploadInfo.status = 'uploading';
      
      this.postMessage({
        type: 'UPLOAD_RESUMED',
        uploadId
      });
    }
  }

  cancelUpload(uploadId) {
    const uploadInfo = this.activeUploads.get(uploadId);
    if (uploadInfo && uploadInfo.upload) {
      uploadInfo.upload.abort(true); // true = should remove upload
      uploadInfo.status = 'cancelled';
      
      this.postMessage({
        type: 'UPLOAD_CANCELLED',
        uploadId
      });
      
      this.cleanup(uploadId);
    }
  }

  getUploadStatus(uploadId) {
    const uploadInfo = this.activeUploads.get(uploadId);
    if (uploadInfo) {
      this.postMessage({
        type: 'UPLOAD_STATUS',
        uploadId,
        data: {
          status: uploadInfo.status,
          startTime: uploadInfo.startTime,
          duration: Date.now() - uploadInfo.startTime
        }
      });
    } else {
      this.postMessage({
        type: 'UPLOAD_NOT_FOUND',
        uploadId
      });
    }
  }

  calculateUploadSpeed(uploadId, bytesUploaded) {
    const uploadInfo = this.activeUploads.get(uploadId);
    if (!uploadInfo) return 0;

    const now = Date.now();
    const timeDiff = now - uploadInfo.lastProgressTime;
    const bytesDiff = bytesUploaded - uploadInfo.lastProgressBytes;

    if (timeDiff > 0) {
      const speed = (bytesDiff / timeDiff) * 1000; // bytes per second
      
      // Update tracking values
      uploadInfo.lastProgressTime = now;
      uploadInfo.lastProgressBytes = bytesUploaded;
      
      return Math.round(speed);
    }

    return 0;
  }

  cleanup(uploadId) {
    this.activeUploads.delete(uploadId);
  }

  postMessage(message) {
    self.postMessage(message);
  }
}

// Initialize the worker
const uploadWorker = new UploadWorker();

// Handle worker termination
self.addEventListener('beforeunload', () => {
  // Cleanup any active uploads
  uploadWorker.activeUploads.forEach((uploadInfo, uploadId) => {
    if (uploadInfo.upload) {
      uploadInfo.upload.abort();
    }
  });
});