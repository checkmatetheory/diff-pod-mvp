import { Database } from '@/integrations/supabase/types';

// Base types from database
export type Session = Database['public']['Tables']['user_sessions']['Row'];
export type Speaker = Database['public']['Tables']['speakers']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];

// Extended types for component usage (with joined data)
export interface SessionWithData extends Session {
  session_data?: {
    extracted_text?: string;
    content_length?: number;
    processing_method?: string;
    content_type?: string;
    processed_at?: string;
    blog_content?: string;
    social_posts?: {
      twitter?: string;
      linkedin?: string;
    };
    key_quotes?: string[];
    ai_title?: string;
    ai_summary?: string;
    podcast_script?: string;
    video_clips?: VideoClip[];
    video_processing_job_id?: string;
    speaker_id?: string;
  };
  video_processing_job_id?: string;
  video_processing_status?: string;
  video_processing_error?: string;
}

export interface SpeakerMicrosite {
  id: string;
  speaker_id: string;
  event_id: string;
  name: string;
  bio?: string;
  brand_colors?: {
    primary?: string;
    accent?: string;
  };
  is_live: boolean;
  approval_status: string;
  speakers?: Speaker;
  events?: Event;
  speaker_content?: SpeakerContent[];
}

export interface SpeakerContent {
  id: string;
  speaker_microsite_id: string;
  generated_summary?: string;
  key_takeaways?: string[];
  key_quotes?: string[];
  video_clips?: VideoClip[];
  highlight_reel_url?: string;
}

export interface VideoClip {
  id: string;
  sessionId: string;
  title: string;
  duration: number;
  aspectRatio: '9:16';
  quality: '1080p';
  videoUrl: string;
  thumbnailUrl: string;
  viralityScore: number;
  viralityReasoning: string;
  transcript: string;
  eventName: string;
  speakerName: string;
  suggestedCaption: string;
  suggestedHashtags: string[];
  status: 'processing' | 'ready' | 'published' | 'failed';
  createdAt: string;
  processedAt?: string;
}

// Component prop types
export interface SessionSidebarProps {
  session: SessionWithData;
  speakers: SpeakerMicrosite[];
  event: Event | null;
  setSpeakers: React.Dispatch<React.SetStateAction<SpeakerMicrosite[]>>;
  fetchAllSpeakers: () => Promise<void>;
}

export interface SessionContentProps {
  session: SessionWithData;
  showPreview: boolean;
  isProcessing: boolean;
  hasError: boolean;
  isEditing: boolean;
  refreshing: boolean;
  onRefreshSession: () => Promise<void>;
  onCopy: (text: string, type: string) => void;
  onDownload: (format: string) => void;
}

export interface SessionHeaderProps {
  session: SessionWithData;
  showPreview: boolean;
  onBackClick: () => void;
  onTogglePreview: () => void;
}

// Hook return types
export interface UseSessionDataReturn {
  session: SessionWithData;
  loading: boolean;
  refreshing: boolean;
  refreshSession: () => Promise<void>;
}

export interface UseSessionSpeakersReturn {
  speakers: SpeakerMicrosite[];
  speaker: Speaker | null;
  event: Event | null;
  fetchAllSpeakers: () => Promise<void>;
  setSpeakers: React.Dispatch<React.SetStateAction<SpeakerMicrosite[]>>;
}

// Modal prop types
export interface SpeakerModalProps {
  speaker: SpeakerMicrosite | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => Promise<void>;
}

export interface AddSpeakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpeakerAdded: () => Promise<void>;
  eventId?: string;
  sessionId?: string;
}

// Content types for publish functionality
export interface BaseContentItem {
  id: string;
  type: 'clip' | 'quote' | 'blog' | 'social';
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
}

// Processing status types
export type ProcessingStatus = 'pending' | 'processing' | 'complete' | 'error';
export type VideoProcessingStatus = 'submitted' | 'processing' | 'completed' | 'failed';
