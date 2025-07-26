import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Play, 
  Pause,
  Calendar,
  Download,
  Edit3
} from "lucide-react";
import { usePublishModal } from "@/hooks/usePublishModal";
import { PublishModalProps, BaseContentItem, FavoriteContentItem, extractBaseContent } from "@/types/publish";

/**
 * Shared PublishModal component
 * Consolidates all publish modal functionality across SessionDetail, Browse, and Favorites
 * Uses the centralized usePublishModal hook for consistent behavior
 */
export function PublishModal<T extends BaseContentItem | FavoriteContentItem>({
  isOpen,
  onClose,
  content,
  onPublish,
  onDownload,
  title = "Publish Your Video",
  loading = false
}: PublishModalProps<T>) {
  // ===== HOOK USAGE =====
  const {
    selectedPlatforms,
    caption,
    isPlaying,
    isSubmitting,
    platforms,
    setCaption,
    formatDuration,
    getViralityColor,
    getViralityRank,
    getPlatformButtonStyles,
    togglePlatform,
    togglePlayback,
    initializeModal,
    resetModal,
    handlePublishSuccess,
    handlePublishError,
    handleDownload: handleDownloadInternal,
    handleSchedule,
    canPublish
  } = usePublishModal();

  // ===== EFFECTS =====
  /**
   * Initialize modal when content changes
   */
  useEffect(() => {
    if (content && isOpen) {
      initializeModal(content);
    }
  }, [content, isOpen, initializeModal]);

  // ===== HELPER FUNCTIONS =====
  /**
   * Get base content for rendering (handles both direct and nested content)
   */
  const getDisplayContent = (): BaseContentItem | null => {
    return extractBaseContent(content as BaseContentItem | FavoriteContentItem);
  };

  /**
   * Get content title for display
   */
  const getContentTitle = (): string => {
    const baseContent = getDisplayContent();
    return baseContent?.title || 'Untitled';
  };

  // ===== EVENT HANDLERS =====
  /**
   * Handle modal close with cleanup
   */
  const handleClose = () => {
    resetModal();
    onClose();
  };

  /**
   * Handle publish button click
   */
  const handlePublishClick = async () => {
    if (!canPublish() || !content) return;

    try {
      await onPublish(selectedPlatforms, caption);
      handlePublishSuccess(selectedPlatforms, getContentTitle());
    } catch (error) {
      handlePublishError(error);
    }
  };

  /**
   * Handle download button click
   */
  const handleDownloadClick = () => {
    if (!content) return;
    onDownload(content);
    handleDownloadInternal(getContentTitle());
  };

  // ===== RENDER GUARDS =====
  if (!content) return null;

  const displayContent = getDisplayContent();
  if (!displayContent) return null;

  // ===== MAIN RENDER =====
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ===== VIDEO PREVIEW SECTION ===== */}
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-[9/16] max-w-sm mx-auto">
              {/* Placeholder/Thumbnail */}
              <div className="w-full h-full bg-gradient-to-br from-blueLight via-accentLight to-accent flex items-center justify-center">
                <div className="w-20 h-20 bg-white/40 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <div className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center">
                    <div className="w-5 h-5 bg-white/80 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              {/* Play/Pause Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="lg"
                  className="bg-black/50 hover:bg-black/70 text-white rounded-full w-16 h-16"
                  onClick={togglePlayback}
                >
                  {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                </Button>
              </div>

              {/* Virality Score Badge */}
              {displayContent.viralityScore && (
                <div className="absolute top-4 left-4 right-4">
                  <Badge className={`${getViralityColor(displayContent.viralityScore)} font-semibold shadow-lg !bg-opacity-100 hover:!bg-opacity-100`}>
                    {getViralityRank(displayContent.viralityScore)} Virality score ({displayContent.viralityScore}/100)
                  </Badge>
                </div>
              )}

              {/* Video Info Overlay */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="font-bold text-lg mb-1">{displayContent.title}</h3>
                <p className="text-sm opacity-80">
                  {displayContent.duration ? formatDuration(displayContent.duration) + ' • ' : ''}
                  {displayContent.event_name || 'Event'}
                </p>
              </div>
            </div>

            {/* Virality Reasoning */}
            {displayContent.reasoning && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2 text-sm text-muted-foreground">
                    Why this clip has viral potential:
                  </h4>
                  <p className="text-sm leading-relaxed">{displayContent.reasoning}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ===== PUBLISHING FORM SECTION ===== */}
          <div className="space-y-6">
            {/* Platform Selection */}
            <div>
              <h3 className="font-semibold mb-3">Select Platforms</h3>
              <div className="grid grid-cols-2 gap-3">
                {platforms.map((platform) => {
                  const Icon = platform.icon;
                  const isSelected = selectedPlatforms.includes(platform.id);
                  const buttonStyles = getPlatformButtonStyles(platform.id, isSelected);
                  
                  return (
                    <Button
                      key={platform.id}
                      variant="outline" 
                      className="h-12 transition-all"
                      style={buttonStyles}
                      onClick={() => togglePlatform(platform.id)}
                    >
                      <Icon className="h-5 w-5 mr-2" />
                      {platform.name}
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Will post to 1 account per platform
              </p>
            </div>

            {/* Caption Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Caption</h3>
                <Button variant="ghost" size="sm">
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your caption..."
                className="min-h-[120px] resize-none"
              />
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>AI-optimized for engagement</span>
                <span>{caption.length} characters</span>
              </div>
            </div>

            {/* Hashtags */}
            {displayContent.suggestedHashtags && displayContent.suggestedHashtags.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-sm">Suggested Hashtags</h4>
                <div className="flex flex-wrap gap-2">
                  {displayContent.suggestedHashtags.map((hashtag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {hashtag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t">
              <Button 
                className="w-full bg-black hover:bg-gray-800 text-white"
                onClick={handlePublishClick}
                disabled={!canPublish() || loading}
              >
                {loading || isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Publishing...
                  </div>
                ) : (
                  'Publish now'
                )}
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleSchedule}
                  disabled={loading || isSubmitting}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDownloadClick}
                  disabled={loading || isSubmitting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 