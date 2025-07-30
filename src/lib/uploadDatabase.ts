/**
 * IndexedDB-based Upload Database
 * Provides reliable, offline-capable storage for upload state and progress
 * Handles large file metadata and chunked upload tracking
 */

interface UploadRecord {
  id: string;
  sessionId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  chunkSize: number;
  totalChunks: number;
  uploadedChunks: number[];
  progress: number;
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'failed' | 'cancelled';
  createdAt: number;
  updatedAt: number;
  lastError?: string;
  retryCount: number;
  maxRetries: number;
  metadata: {
    userId: string;
    eventId: string;
    projectId: string;
    filePath: string;
    tusUrl?: string;
    resumeUrl?: string;
  };
}

interface UploadChunk {
  uploadId: string;
  chunkIndex: number;
  chunkData: ArrayBuffer;
  uploaded: boolean;
  retryCount: number;
}

class UploadDatabase {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'EventMicrositeUploads';
  private readonly dbVersion = 1;
  private readonly stores = {
    uploads: 'uploads',
    chunks: 'chunks',
    analytics: 'analytics'
  };

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Uploads store
        if (!db.objectStoreNames.contains(this.stores.uploads)) {
          const uploadStore = db.createObjectStore(this.stores.uploads, { keyPath: 'id' });
          uploadStore.createIndex('status', 'status', { unique: false });
          uploadStore.createIndex('createdAt', 'createdAt', { unique: false });
          uploadStore.createIndex('userId', 'metadata.userId', { unique: false });
        }

        // Chunks store for large file handling
        if (!db.objectStoreNames.contains(this.stores.chunks)) {
          const chunkStore = db.createObjectStore(this.stores.chunks, { keyPath: ['uploadId', 'chunkIndex'] });
          chunkStore.createIndex('uploadId', 'uploadId', { unique: false });
          chunkStore.createIndex('uploaded', 'uploaded', { unique: false });
        }

        // Analytics store for upload performance tracking
        if (!db.objectStoreNames.contains(this.stores.analytics)) {
          const analyticsStore = db.createObjectStore(this.stores.analytics, { keyPath: 'id', autoIncrement: true });
          analyticsStore.createIndex('uploadId', 'uploadId', { unique: false });
          analyticsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async saveUpload(upload: UploadRecord): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores.uploads], 'readwrite');
      const store = transaction.objectStore(this.stores.uploads);
      
      upload.updatedAt = Date.now();
      const request = store.put(upload);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save upload'));
    });
  }

  async getUpload(uploadId: string): Promise<UploadRecord | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores.uploads], 'readonly');
      const store = transaction.objectStore(this.stores.uploads);
      const request = store.get(uploadId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Failed to get upload'));
    });
  }

  async getActiveUploads(): Promise<UploadRecord[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores.uploads], 'readonly');
      const store = transaction.objectStore(this.stores.uploads);
      const index = store.index('status');
      
      const activeStatuses = ['pending', 'uploading', 'paused'];
      const uploads: UploadRecord[] = [];
      let pendingRequests = activeStatuses.length;

      activeStatuses.forEach(status => {
        const request = index.getAll(status);
        request.onsuccess = () => {
          uploads.push(...request.result);
          pendingRequests--;
          if (pendingRequests === 0) {
            resolve(uploads.sort((a, b) => b.createdAt - a.createdAt));
          }
        };
        request.onerror = () => reject(new Error('Failed to get active uploads'));
      });
    });
  }

  async updateUploadProgress(uploadId: string, progress: number, uploadedChunks?: number[]): Promise<void> {
    const upload = await this.getUpload(uploadId);
    if (!upload) throw new Error('Upload not found');

    upload.progress = progress;
    if (uploadedChunks) {
      upload.uploadedChunks = uploadedChunks;
    }
    upload.updatedAt = Date.now();

    await this.saveUpload(upload);
  }

  async markUploadComplete(uploadId: string): Promise<void> {
    const upload = await this.getUpload(uploadId);
    if (!upload) throw new Error('Upload not found');

    upload.status = 'completed';
    upload.progress = 100;
    upload.updatedAt = Date.now();

    await this.saveUpload(upload);
    
    // Clean up chunks after successful upload
    await this.deleteUploadChunks(uploadId);
  }

  async markUploadFailed(uploadId: string, error: string): Promise<void> {
    const upload = await this.getUpload(uploadId);
    if (!upload) throw new Error('Upload not found');

    upload.status = 'failed';
    upload.lastError = error;
    upload.retryCount++;
    upload.updatedAt = Date.now();

    await this.saveUpload(upload);
  }

  async saveChunk(chunk: UploadChunk): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores.chunks], 'readwrite');
      const store = transaction.objectStore(this.stores.chunks);
      const request = store.put(chunk);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save chunk'));
    });
  }

  async getUploadChunks(uploadId: string): Promise<UploadChunk[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores.chunks], 'readonly');
      const store = transaction.objectStore(this.stores.chunks);
      const index = store.index('uploadId');
      const request = index.getAll(uploadId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get chunks'));
    });
  }

  async deleteUploadChunks(uploadId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores.chunks], 'readwrite');
      const store = transaction.objectStore(this.stores.chunks);
      const index = store.index('uploadId');
      const request = index.getAll(uploadId);

      request.onsuccess = () => {
        const chunks = request.result;
        let pendingDeletes = chunks.length;

        if (pendingDeletes === 0) {
          resolve();
          return;
        }

        chunks.forEach(chunk => {
          const deleteRequest = store.delete([chunk.uploadId, chunk.chunkIndex]);
          deleteRequest.onsuccess = () => {
            pendingDeletes--;
            if (pendingDeletes === 0) resolve();
          };
          deleteRequest.onerror = () => reject(new Error('Failed to delete chunk'));
        });
      };
      request.onerror = () => reject(new Error('Failed to get chunks for deletion'));
    });
  }

  async deleteUpload(uploadId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Delete upload record and associated chunks
    await this.deleteUploadChunks(uploadId);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores.uploads], 'readwrite');
      const store = transaction.objectStore(this.stores.uploads);
      const request = store.delete(uploadId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete upload'));
    });
  }

  async cleanupExpiredUploads(maxAgeHours: number = 24): Promise<number> {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    const uploads = await this.getActiveUploads();
    
    let cleanedCount = 0;
    for (const upload of uploads) {
      if (upload.createdAt < cutoffTime && 
          (upload.status === 'failed' || upload.status === 'completed')) {
        await this.deleteUpload(upload.id);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  async getUploadAnalytics(uploadId: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores.analytics], 'readonly');
      const store = transaction.objectStore(this.stores.analytics);
      const index = store.index('uploadId');
      const request = index.getAll(uploadId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get analytics'));
    });
  }

  async recordAnalytics(uploadId: string, event: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const record = {
      uploadId,
      event,
      data,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores.analytics], 'readwrite');
      const store = transaction.objectStore(this.stores.analytics);
      const request = store.add(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to record analytics'));
    });
  }
}

// Export singleton instance
export const uploadDatabase = new UploadDatabase();
export type { UploadRecord, UploadChunk };