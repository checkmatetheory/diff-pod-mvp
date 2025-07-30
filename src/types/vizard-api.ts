// Vizard AI API Types
// Based on https://docs.vizard.ai/docs/basic

// Vizard API Request Types
export interface VizardCreateProjectRequest {
  lang: string; // ISO 639-1 language code
  preferLength: number[]; // [0] for auto, [1,2,3] for specific ranges
  videoUrl: string;
  videoType: VizardVideoType;
  ext?: string; // required only for videoType 1 (remote files)
  
  // Advanced options (for future expansion)
  projectName?: string;
  description?: string;
  webhookUrl?: string;
}

// Vizard video source types
export enum VizardVideoType {
  REMOTE_FILE = 1,
  YOUTUBE = 2,
  GOOGLE_DRIVE = 3,
  VIMEO = 4,
  STREAMYARD = 5,
  TIKTOK = 6,
  TWITTER = 7,
  RUMBLE = 8,
  TWITCH = 9,
  LOOM = 10,
  FACEBOOK = 11,
  LINKEDIN = 12
}

// Vizard clip length preferences
export enum VizardClipLength {
  AUTO = 0,
  UNDER_30_SECONDS = 1,
  THIRTY_TO_60_SECONDS = 2,
  SIXTY_TO_90_SECONDS = 3,
  NINETY_SECONDS_TO_3_MINUTES = 4
}

// Vizard API Response Types
export interface VizardCreateProjectResponse {
  success: boolean;
  message: string;
  data: {
    projectId: string;
    status: 'processing' | 'completed' | 'failed';
    estimatedCompletionTime?: number; // minutes
    creditsUsed?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface VizardProjectStatusResponse {
  success: boolean;
  message: string;
  data: {
    projectId: string;
    status: 'processing' | 'completed' | 'failed';
    progress?: number; // 0-100
    clips?: VizardClip[];
    metadata?: {
      originalVideoLength: number;
      processedAt?: string;
      totalClips: number;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface VizardClip {
  id: string;
  projectId: string;
  
  // Video properties
  title: string;
  description?: string;
  duration: number; // seconds
  startTime: number; // seconds in original video
  endTime: number; // seconds in original video
  
  // File URLs
  videoUrl: string;
  thumbnailUrl: string;
  gifUrl?: string;
  
  // AI Analysis
  viralityScore?: number; // 0-100
  highlights: string[]; // key moments/topics
  transcript: string;
  keywords: string[];
  
  // Metadata
  quality: string; // '1080p', '720p', etc.
  aspectRatio: string; // '9:16', '16:9', etc.
  fileSize: number; // bytes
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Publishing suggestions
  suggestedTitle?: string;
  suggestedDescription?: string;
  suggestedHashtags?: string[];
}

// Vizard Error Types
export interface VizardError {
  code: string;
  message: string;
  type: 'validation' | 'processing' | 'quota' | 'server' | 'network';
  retryable: boolean;
  details?: {
    field?: string;
    value?: any;
    constraint?: string;
  };
}

// Vizard API Endpoints
export const VIZARD_ENDPOINTS = {
  CREATE_PROJECT: '/hvizard-server-front/open-api/v1/project/create',
  GET_PROJECT_STATUS: '/hvizard-server-front/open-api/v1/project/status',
  GET_PROJECT_CLIPS: '/hvizard-server-front/open-api/v1/project/clips',
  CANCEL_PROJECT: '/hvizard-server-front/open-api/v1/project/cancel'
} as const;

// Vizard Configuration
export interface VizardConfig {
  apiKey: string;
  baseUrl: string; // 'https://elb-api.vizard.ai'
  timeout: number; // milliseconds
  retries: number;
  
  // Default settings
  defaultLanguage: string; // 'en'
  defaultClipLengths: number[]; // [2, 3] for 30s-90s clips
  maxVideoLength: number; // 600 minutes
  maxFileSize: number; // 10GB in bytes
  supportedFormats: string[]; // ['mp4', 'mov', 'avi', '3gp']
}

// Vizard Webhook Types (for async processing)
export interface VizardWebhookPayload {
  eventType: 'project.completed' | 'project.failed' | 'project.progress';
  projectId: string;
  timestamp: string;
  data: {
    status: string;
    progress?: number;
    clips?: VizardClip[];
    error?: VizardError;
  };
  signature: string; // for webhook verification
} 