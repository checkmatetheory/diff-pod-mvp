/**
 * Upload Configuration Constants
 * Centralized configuration for file upload limits and validation
 */

// File size limits (in bytes)
export const UPLOAD_LIMITS = {
  // Maximum file size: 15GB (matches Supabase Pro plan setting)
  MAX_FILE_SIZE: 16106127360, // 15GB in bytes
  
  // TUS threshold: Files larger than this will use resumable uploads
  TUS_THRESHOLD: 52428800, // 50MB in bytes
  
  // Chunk sizes for TUS uploads - Optimized for smooth progress updates
  CHUNK_SIZE_SMALL: 2 * 1024 * 1024,  // 2MB for files < 500MB (better UX)
  CHUNK_SIZE_MEDIUM: 6 * 1024 * 1024,  // 6MB for files 500MB-1GB  
  CHUNK_SIZE_LARGE: 16 * 1024 * 1024, // 16MB for files >= 1GB (reduced from 32MB)
  
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

export const isFileSizeValid = (fileSize: number): boolean => {
  return fileSize <= UPLOAD_LIMITS.MAX_FILE_SIZE;
};

export const isFileTypeValid = (fileType: string): boolean => {
  return UPLOAD_LIMITS.ALLOWED_VIDEO_TYPES.includes(fileType) || fileType.includes('video');
};

export const hasBlockedPattern = (fileName: string): boolean => {
  const lowerName = fileName.toLowerCase();
  return UPLOAD_LIMITS.BLOCKED_PATTERNS.some(pattern => lowerName.includes(pattern));
};

export const shouldUseTUSUpload = (fileSize: number): boolean => {
  return fileSize > UPLOAD_LIMITS.TUS_THRESHOLD;
};