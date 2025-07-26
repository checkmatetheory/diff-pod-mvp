import { LucideIcon } from "lucide-react";

/**
 * Base content item interface that all publishable content must implement
 * This ensures type safety across different content sources (sessions, browse, favorites)
 */
export interface BaseContentItem {
  id: string;
  title: string;
  type: 'reel' | 'photo';
  thumbnail_url?: string;
  content_url?: string;
  description?: string;
  duration?: number;
  
  // Viral content properties
  viralityScore?: number;
  reasoning?: string;
  transcript?: string;
  suggestedCaption?: string;
  suggestedHashtags?: string[];
  
  // Speaker/Event context (optional - may vary by source)
  speaker_name?: string;
  event_name?: string;
}

/**
 * Extended content item for favorites (includes nested content_items structure)
 */
export interface FavoriteContentItem {
  id: string;
  content_item_id: string;
  created_at: string;
  content_items: BaseContentItem | null;
}

/**
 * Platform configuration for social media integrations
 * Extensible for future OAuth and API integrations
 */
export interface PlatformConfig {
  id: 'linkedin' | 'twitter' | 'instagram' | 'youtube';
  name: string;
  icon: LucideIcon;
  color: string;
  
  // Future OAuth properties
  isConnected?: boolean;
  authUrl?: string;
  requiresAuth?: boolean;
}

/**
 * Generic props interface for the PublishModal component
 * Uses TypeScript generics to work with different content types
 */
export interface PublishModalProps<T extends BaseContentItem | FavoriteContentItem> {
  isOpen: boolean;
  onClose: () => void;
  content: T | null;
  onPublish: (platforms: string[], caption: string) => Promise<void>;
  onDownload: (content: T) => void;
  title?: string;
  loading?: boolean;
}

/**
 * Publishing state interface for managing modal state
 */
export interface PublishingState {
  selectedPlatforms: string[];
  caption: string;
  isPlaying: boolean;
  isSubmitting: boolean;
}

/**
 * Platform publishing result for future API integrations
 */
export interface PublishResult {
  platform: string;
  success: boolean;
  postId?: string;
  error?: string;
  url?: string;
}

/**
 * Publishing options for advanced features
 */
export interface PublishOptions {
  scheduleTime?: Date;
  includeBranding?: boolean;
  customHashtags?: string[];
  crossPost?: boolean;
}

/**
 * Type guards for content item validation
 */
export function isBaseContentItem(item: any): item is BaseContentItem {
  return item && typeof item.id === 'string' && typeof item.title === 'string';
}

export function isFavoriteContentItem(item: any): item is FavoriteContentItem {
  return item && typeof item.content_item_id === 'string' && item.content_items;
}

/**
 * Helper function to extract base content from any content type
 */
export function extractBaseContent(item: BaseContentItem | FavoriteContentItem): BaseContentItem | null {
  if (isFavoriteContentItem(item)) {
    return item.content_items;
  }
  if (isBaseContentItem(item)) {
    return item;
  }
  return null;
} 