import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { SOCIAL_PLATFORMS, getPlatformStyles, CAPTION_TEMPLATES } from "@/constants/platforms";
import { BaseContentItem, FavoriteContentItem, extractBaseContent } from "@/types/publish";

/**
 * Centralized hook for PublishModal functionality
 * Consolidates all logic currently duplicated across SessionDetail, Browse, and Favorites
 */
export function usePublishModal() {
  // ===== STATE MANAGEMENT =====
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [caption, setCaption] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { toast } = useToast();

  // ===== HELPER FUNCTIONS =====
  /**
   * Format duration from seconds to MM:SS format
   * Consistent across all modals
   */
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  /**
   * Get virality score color styling
   * Consistent across all modals
   */
  const getViralityColor = useCallback((score: number): string => {
    if (score >= 90) return 'bg-green-600 text-white border-2 border-green-200 hover:bg-green-600';
    if (score >= 80) return 'bg-[#4A8BC2] text-white border-2 border-blue-200 hover:bg-[#4A8BC2]';
    if (score >= 70) return 'bg-yellow-600 text-white border-2 border-yellow-200 hover:bg-yellow-600';
    return 'bg-gray-600 text-white border-2 border-gray-200 hover:bg-gray-600';
  }, []);

  /**
   * Get virality rank display
   * Consistent across all modals
   */
  const getViralityRank = useCallback((score: number): string => {
    if (score >= 90) return '#1';
    if (score >= 80) return '#2';
    if (score >= 70) return '#3';
    return `#${Math.floor(score / 10)}`;
  }, []);

  /**
   * Generate platform button styles with LinkedIn fix
   * Uses the centralized PLATFORM_STYLES from constants
   */
  const getPlatformButtonStyles = useCallback((platformId: string, isSelected: boolean) => {
    const styles = getPlatformStyles(platformId, isSelected);
    
    return {
      backgroundColor: styles.backgroundColor,
      color: isSelected ? '#ffffff' : 'inherit',
      borderColor: styles.borderColor,
      borderWidth: '2px'
    };
  }, []);

  /**
   * Generate smart caption based on content
   * Uses templates from constants with fallback logic
   */
  const generateSmartCaption = useCallback((content: BaseContentItem | FavoriteContentItem): string => {
    const baseContent = extractBaseContent(content);
    if (!baseContent) return '';

    // Use existing suggested caption if available
    if (baseContent.suggestedCaption) {
      return baseContent.suggestedCaption;
    }

    // Generate from template based on content
    return CAPTION_TEMPLATES.default(
      baseContent.speaker_name,
      baseContent.event_name
    );
  }, []);

  // ===== INTERACTION HANDLERS =====
  /**
   * Handle platform selection/deselection
   * Consistent logic across all modals
   */
  const togglePlatform = useCallback((platformId: string) => {
    setSelectedPlatforms(prev => {
      const isSelected = prev.includes(platformId);
      if (isSelected) {
        return prev.filter(p => p !== platformId);
      } else {
        return [...prev, platformId];
      }
    });
  }, []);

  /**
   * Handle play/pause toggle
   * Consistent across all modals
   */
  const togglePlayback = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  /**
   * Initialize modal with content
   * Sets up caption and resets state
   */
  const initializeModal = useCallback((content: BaseContentItem | FavoriteContentItem | null) => {
    if (!content) return;

    const smartCaption = generateSmartCaption(content);
    setCaption(smartCaption);
    setSelectedPlatforms([]);
    setIsPlaying(false);
    setIsSubmitting(false);
  }, [generateSmartCaption]);

  /**
   * Reset modal state
   * Called when modal closes
   */
  const resetModal = useCallback(() => {
    setSelectedPlatforms([]);
    setCaption('');
    setIsPlaying(false);
    setIsSubmitting(false);
  }, []);

  /**
   * Handle successful publish
   * Shows success toast but keeps platform selections for multiple publishes
   */
  const handlePublishSuccess = useCallback((platforms: string[], contentTitle: string) => {
    toast({
      title: "Published successfully!",
      description: `"${contentTitle}" has been published to ${platforms.join(', ')}`,
    });
    // Don't reset modal - allow user to publish to other platforms
    // Only reset submitting state
    setIsSubmitting(false);
  }, [toast]);

  /**
   * Handle publish error
   * Shows error toast and resets submitting state
   */
  const handlePublishError = useCallback((error: unknown) => {
    console.error('Publish error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to publish content';
    toast({
      title: "Publish failed",
      description: errorMessage,
      variant: "destructive",
    });
    setIsSubmitting(false);
  }, [toast]);

  /**
   * Handle download action
   * Shows download toast (mock for now)
   */
  const handleDownload = useCallback((contentTitle: string) => {
    toast({
      title: "Download started",
      description: `Downloading "${contentTitle}"`,
    });
  }, [toast]);

  /**
   * Handle schedule action
   * Shows schedule toast (mock for now)
   */
  const handleSchedule = useCallback(() => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: "Select platforms",
        description: "Please select at least one platform to schedule",
        variant: "destructive",
      });
      return;
    }

    toast({ 
      title: "Scheduled!", 
      description: "Your video will be published at the optimal time" 
    });
  }, [selectedPlatforms.length, toast]);

  // ===== VALIDATION =====
  /**
   * Check if publish is ready
   * Validates required fields
   */
  const canPublish = useCallback((): boolean => {
    return selectedPlatforms.length > 0 && caption.trim().length > 0 && !isSubmitting;
  }, [selectedPlatforms.length, caption, isSubmitting]);

  // ===== FUTURE OAUTH HOOKS =====
  /**
   * Handle platform authentication (future implementation)
   * Ready for OAuth flows
   */
  const connectPlatform = useCallback(async (platformId: string): Promise<void> => {
    // Future OAuth implementation
    console.log(`Connecting to ${platformId}...`);
    toast({
      title: "Coming soon!",
      description: `${platformId} integration is being prepared`,
    });
  }, [toast]);

  /**
   * Check if platform is connected (future implementation)
   * Ready for OAuth state management
   */
  const isPlatformConnected = useCallback((platformId: string): boolean => {
    // Future OAuth implementation - check stored tokens
    return false; // For now, all platforms are "disconnected"
  }, []);

  // ===== RETURN HOOK INTERFACE =====
  return {
    // State
    selectedPlatforms,
    caption,
    isPlaying,
    isSubmitting,
    
    // Platform data
    platforms: SOCIAL_PLATFORMS,
    
    // State setters
    setSelectedPlatforms,
    setCaption,
    setIsPlaying,
    setIsSubmitting,
    
    // Helper functions
    formatDuration,
    getViralityColor,
    getViralityRank,
    getPlatformButtonStyles,
    generateSmartCaption,
    
    // Interaction handlers
    togglePlatform,
    togglePlayback,
    initializeModal,
    resetModal,
    handlePublishSuccess,
    handlePublishError,
    handleDownload,
    handleSchedule,
    
    // Validation
    canPublish,
    
    // Future OAuth (ready for implementation)
    connectPlatform,
    isPlatformConnected,
  };
} 