import { Linkedin, Twitter, Instagram, Youtube } from "lucide-react";
import { PlatformConfig } from "@/types/publish";

/**
 * Centralized platform configurations for all publish modals
 * This ensures consistency across SessionDetail, Browse, and Favorites pages
 */
export const SOCIAL_PLATFORMS: PlatformConfig[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    color: '#2563eb', // Blue-600
    requiresAuth: true, // Future OAuth
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: Twitter,
    color: '#000000', // Black
    requiresAuth: true, // Future OAuth
  },
  {
    id: 'instagram',
    name: 'Instagram', 
    icon: Instagram,
    color: '#a855f7', // Purple-500
    requiresAuth: true, // Future OAuth
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: '#dc2626', // Red-600
    requiresAuth: true, // Future OAuth
  },
] as const;

/**
 * Platform-specific styling for buttons
 * Used in the inline styles fix for consistent platform colors
 */
export const PLATFORM_STYLES = {
  linkedin: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  twitter: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  instagram: {
    backgroundColor: '#a855f7',
    borderColor: '#a855f7',
  },
  youtube: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  default: {
    backgroundColor: 'transparent',
    borderColor: '#e5e7eb', // Gray-200
  },
} as const;

/**
 * Helper function to get platform configuration by ID
 */
export function getPlatformConfig(platformId: string): PlatformConfig | undefined {
  return SOCIAL_PLATFORMS.find(platform => platform.id === platformId);
}

/**
 * Helper function to get platform styles for buttons
 */
export function getPlatformStyles(platformId: string, isSelected: boolean) {
  if (!isSelected) {
    return PLATFORM_STYLES.default;
  }
  
  const styles = PLATFORM_STYLES[platformId as keyof typeof PLATFORM_STYLES];
  return styles || PLATFORM_STYLES.default;
}

/**
 * Default caption templates for different content types
 */
export const CAPTION_TEMPLATES = {
  default: (speakerName?: string, eventName?: string) => 
    `🚀 Amazing insights from ${speakerName || 'this speaker'}${eventName ? ` at ${eventName}` : ''}! #Innovation #Leadership`,
  
  innovation: (speakerName?: string, eventName?: string) => 
    `💡 Game-changing insights from ${speakerName || 'this speaker'}${eventName ? ` at ${eventName}` : ''}! #Innovation #TechTalk`,
    
  leadership: (speakerName?: string, eventName?: string) => 
    `👑 Leadership wisdom from ${speakerName || 'this speaker'}${eventName ? ` at ${eventName}` : ''}! #Leadership #BusinessStrategy`,
} as const;

/**
 * Platform-specific character limits (for future validation)
 */
export const PLATFORM_LIMITS = {
  linkedin: {
    maxLength: 3000,
    recommendedLength: 1300,
  },
  twitter: {
    maxLength: 280,
    recommendedLength: 240,
  },
  instagram: {
    maxLength: 2200,
    recommendedLength: 1500,
  },
  youtube: {
    maxLength: 5000,
    recommendedLength: 3000,
  },
} as const; 