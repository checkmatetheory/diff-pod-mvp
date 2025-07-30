// Core AI Processing Types for Video Clip Generation
// This file defines our internal, provider-agnostic types

// Our internal, provider-agnostic Clip type
export interface Clip {
  // Core Identification
  id: string;
  sessionId: string;
  
  // Video Properties
  title: string;
  duration: number; // seconds (30-180 range)
  aspectRatio: '9:16'; // locked to vertical
  quality: '1080p'; // sweet spot for cost vs user satisfaction
  
  // File URLs
  videoUrl: string;
  thumbnailUrl: string;
  
  // AI Analysis
  viralityScore: number; // 0-100 (only show >66, prioritize >75)
  viralityReasoning: string; // why this clip has viral potential
  transcript: string;
  
  // Content Metadata
  eventName: string;
  speakerName: string;
  
  // Publishing
  suggestedCaption: string; // one caption for all platforms
  suggestedHashtags: string[]; // universal hashtags
  
  // Workflow State
  status: 'processing' | 'ready' | 'published' | 'failed';
  
  // Timestamps
  createdAt: string;
  processedAt?: string;
  
  // Future Publishing Tracking (for later)
  publishedTo?: {
    platform: string;
    publishedAt: string;
    performanceMetrics?: any; // for future analytics
  }[];
}

// Job submitted to AI processing
export interface ProcessingJob {
  id: string;
  sessionId: string;
  videoUrl: string;
  eventName: string;
  speakerName: string;
  language: string; // ISO 639-1 code (e.g., 'en', 'es')
  preferredDurations: number[]; // [30, 60, 90] for multiple length options
  maxClips: number; // limit number of clips generated
  minViralityScore: number; // only return clips above this threshold
  webhookUrl?: string; // for async processing notifications
  metadata?: {
    eventDate?: string;
    eventDescription?: string;
    tags?: string[];
    [key: string]: any;
  };
}

// Standard result from any AI provider
export interface ProcessingResult {
  jobId: string;
  sessionId: string;
  status: 'processing' | 'completed' | 'failed';
  clips: Clip[];
  error?: string;
  processingTimeMs?: number;
  creditsUsed?: number;
  metadata?: {
    totalDuration: number;
    clipsGenerated: number;
    averageViralityScore: number;
    [key: string]: any;
  };
}

// The adapter interface that all AI providers must implement
export interface AIProvider {
  name: string;
  version: string;
  
  // Submit a video for processing
  submitJob(job: ProcessingJob): Promise<{ jobId: string; estimatedCompletionTime?: number }>;
  
  // Check job status and get results
  getJobStatus(jobId: string): Promise<ProcessingResult>;
  
  // Get clips for a completed job
  getClips(jobId: string): Promise<Clip[]>;
  
  // Cancel a running job (optional)
  cancelJob?(jobId: string): Promise<boolean>;
  
  // Provider-specific health check
  healthCheck(): Promise<boolean>;
  
  // Provider-specific configuration
  configure(config: ProviderConfig): void;
}

// Configuration for AI providers
export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  webhookSecret?: string;
  customSettings?: {
    [key: string]: any;
  };
}

// Supported AI providers
export type SupportedProvider = 'vizard' | 'runway' | 'openai' | 'custom';

// Provider capabilities metadata
export interface ProviderCapabilities {
  maxVideoLength: number; // minutes
  maxFileSize: number; // bytes
  supportedFormats: string[]; // ['mp4', 'mov', 'avi']
  supportedLanguages: string[]; // ISO 639-1 codes
  supportedAspectRatios: string[]; // ['9:16', '16:9', '1:1']
  maxClipsPerJob: number;
  averageProcessingTime: number; // minutes per hour of video
  costPerMinute?: number; // for cost estimation
  features: {
    realTimeProcessing: boolean;
    batchProcessing: boolean;
    webhookSupport: boolean;
    customBranding: boolean;
    advancedAnalytics: boolean;
  };
} 