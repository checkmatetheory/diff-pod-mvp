/**
 * Environment-Aware Upload Configuration
 * Optimized for both local development and production environments
 */

// Note: getStorageConfig import removed to prevent circular dependency
// Environment detection moved inline

// Environment detection (inline to prevent circular dependencies)
const isDevelopment = import.meta.env.DEV || 
                     (typeof window !== 'undefined' && (
                       window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.port === '8080'
                     ));

// Environment-specific upload configurations
const UPLOAD_CONFIGS = {
  development: {
    // Local development - optimized for Supabase storage limits
    MAX_FILE_SIZE: 15 * 1024 * 1024 * 1024, // 15GB
    TUS_THRESHOLD: 100 * 1024 * 1024, // 100MB (use TUS for large files)
    CHUNK_SIZE_SMALL: 1 * 1024 * 1024,  // 1MB (safe for local testing)
    CHUNK_SIZE_MEDIUM: 2 * 1024 * 1024,  // 2MB (reliable for local)
    CHUNK_SIZE_LARGE: 4 * 1024 * 1024, // 4MB (max for local Supabase)
    MAX_RETRIES: 3, // Fewer retries needed locally
    RETRY_DELAYS: [0, 500, 1500, 3000], // Faster retries
    PROGRESS_UPDATE_INTERVAL: 100, // More frequent updates for development
  },
  production: {
    // Production - optimized for Supabase storage limits and reliability
    MAX_FILE_SIZE: 50 * 1024 * 1024 * 1024, // 50GB (Supabase Pro limit)
    TUS_THRESHOLD: 100 * 1024 * 1024, // 100MB (use TUS for large files)
    CHUNK_SIZE_SMALL: 1 * 1024 * 1024,  // 1MB (safe for all connections)
    CHUNK_SIZE_MEDIUM: 2 * 1024 * 1024,  // 2MB (conservative)
    CHUNK_SIZE_LARGE: 4 * 1024 * 1024, // 4MB (max for Supabase compatibility)
    MAX_RETRIES: 8, // More retries for network issues
    RETRY_DELAYS: [0, 1000, 3000, 5000, 10000, 15000, 30000, 60000], // Aggressive retry strategy
    PROGRESS_UPDATE_INTERVAL: 500, // Less frequent updates to reduce overhead
  }
};

// Get current environment configuration
const currentUploadConfig = isDevelopment ? UPLOAD_CONFIGS.development : UPLOAD_CONFIGS.production;

// Export environment-aware upload limits
export const UPLOAD_LIMITS = {
  ...currentUploadConfig,
  
  // Common configuration for both environments
  // File size thresholds for chunk selection
  MEDIUM_FILE_THRESHOLD: 500 * 1024 * 1024, // 500MB
  LARGE_FILE_THRESHOLD: 1024 * 1024 * 1024,  // 1GB
  
  // File type validation
  ALLOWED_VIDEO_TYPES: [
    'video/mp4',
    'video/quicktime', // .mov
    'video/x-msvideo', // .avi
    'video/webm',
    'video/ogg',
    'video/x-ms-wmv' // .wmv
  ],
  
  // Security: Blocked file patterns
  BLOCKED_PATTERNS: ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif', '.dll', '.vbs', '.ps1'],
  
  // Rate limiting (files per minute per user)
  MAX_FILES_PER_MINUTE: 5
} as const;

// Helper functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validateFileSize = (fileSize: number): boolean => {
  return fileSize <= UPLOAD_LIMITS.MAX_FILE_SIZE;
};

// Additional helper functions for file validation
export const isFileSizeValid = (fileSize: number): boolean => {
  return fileSize <= UPLOAD_LIMITS.MAX_FILE_SIZE;
};

export const isFileTypeValid = (fileType: string): boolean => {
  return UPLOAD_LIMITS.ALLOWED_VIDEO_TYPES.includes(fileType);
};

export const hasBlockedPattern = (fileName: string): boolean => {
  return UPLOAD_LIMITS.BLOCKED_PATTERNS.some(pattern => 
    fileName.toLowerCase().includes(pattern.toLowerCase())
  );
};

