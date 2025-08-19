import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Quote, 
  RefreshCw, 
  Copy, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  Scissors,
  Sparkles
} from 'lucide-react';
import { SessionContentProps } from "@/types/session-types";
import { supabase } from "@/integrations/supabase/client";
import { PublishModal } from "@/components/ui/PublishModal";
import { BaseContentItem } from "@/types/publish";

export const SessionContent = ({
  session,
  showPreview,
  isProcessing,
  hasError,
  isEditing,
  refreshing,
  onRefreshSession,
  onCopy,
  onDownload
}: SessionContentProps) => {
  const [activeTab, setActiveTab] = useState("clips");
  const [retrying, setRetrying] = useState(false);
  const [selectedClip, setSelectedClip] = useState<any>(null);
  const [isClipModalOpen, setIsClipModalOpen] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  const sessionData = session.session_data as Record<string, unknown> | undefined;
  const videoStatus = (session as any).video_processing_status as string | undefined;
  const videoClips = (sessionData?.video_clips as any[]) || [];

  // Clip data validation function
  const validateClipData = (clips: any[]): boolean => {
    if (!clips || clips.length === 0) return true; // No clips is valid
    
    // Check if clips are empty objects or missing critical fields
    const invalidClips = clips.filter(clip => 
      !clip || 
      typeof clip !== 'object' || 
      Object.keys(clip).length === 0 || 
      !clip.id || 
      !clip.title
    );
    
    const validClips = clips.length - invalidClips.length;
    console.log(`🔍 Clip validation: ${validClips}/${clips.length} valid clips`);
    
    return invalidClips.length === 0;
  };

  // Check if clips have video URLs
  const hasValidVideoUrls = (clips: any[]): boolean => {
    if (!clips || clips.length === 0) return true;
    
    const clipsWithUrls = clips.filter(clip => 
      clip && (clip.videoUrl || clip.url || clip.downloadUrl || clip.mp4Url || clip.playUrl)
    ).length;
    
    console.log(`🎬 Video URL validation: ${clipsWithUrls}/${clips.length} clips have video URLs`);
    
    return clipsWithUrls > 0;
  };

  // Auto-recovery when corrupted data detected
  useEffect(() => {
    const needsRecovery = videoClips.length > 0 && (
      !validateClipData(videoClips) || 
      !hasValidVideoUrls(videoClips)
    );
    
    if (needsRecovery && !isRecovering) {
      console.warn('🔧 Detected corrupted clip data, triggering auto-recovery...');
      handleAutoRecovery();
    }
  }, [videoClips, isRecovering]);

  // Auto-recovery function
  const handleAutoRecovery = async () => {
    setIsRecovering(true);
    try {
      console.log('🔄 Attempting automatic clip recovery...');
      
      // Clear any cached data
      localStorage.removeItem('sessionData');
      sessionStorage.clear();
      
      // Try to recover clips from Vizard
      if (session?.video_processing_job_id) {
        const { data, error } = await supabase.functions.invoke('vizard-poll', {
          body: { 
            sessionId: session.id, 
            jobId: session.video_processing_job_id 
          }
        });
        
        if (data?.status === 'completed') {
          console.log('✅ Auto-recovery successful');
          setTimeout(() => onRefreshSession(), 1000);
        }
      }
    } catch (error) {
      console.error('❌ Auto-recovery failed:', error);
    } finally {
      setIsRecovering(false);
    }
  };

  // Manual recovery function
  const handleManualRecovery = async () => {
    setIsRecovering(true);
    try {
      console.log('🔧 Manual clip recovery initiated...');
      
      // Clear all cached data
      localStorage.clear();
      sessionStorage.clear();
      
      // Force refresh from database
      await onRefreshSession();
      
      // If still no clips, try the manual fix function
      setTimeout(async () => {
        if (videoClips.length === 0 || !hasValidVideoUrls(videoClips)) {
          const { data, error } = await supabase.functions.invoke('manual-clip-fix', {
            body: {}
          });
          
          if (data?.success) {
            setTimeout(() => onRefreshSession(), 1000);
          }
        }
      }, 2000);
      
    } catch (error) {
      console.error('❌ Manual recovery failed:', error);
    } finally {
      setIsRecovering(false);
    }
  };

  // Debug logging to understand data structure
  console.log('🎬 Video clips data:', {
    videoClips: videoClips,
    sampleClip: videoClips[0],
    isValid: validateClipData(videoClips),
    hasVideoUrls: hasValidVideoUrls(videoClips),
    thumbnailKeys: videoClips[0] ? Object.keys(videoClips[0]).filter(key => key.toLowerCase().includes('thumb') || key.toLowerCase().includes('image') || key.toLowerCase().includes('preview') || key.toLowerCase().includes('cover')) : []
  });

  // Helper functions for virality and formatting (from Browse page)
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getViralityColor = (score: number) => {
    if (score >= 90) return 'bg-green-600 text-white border-2 border-green-200 hover:bg-green-600';
    if (score >= 80) return 'bg-[#4A8BC2] text-white border-2 border-blue-200 hover:bg-[#4A8BC2]';
    if (score >= 70) return 'bg-yellow-600 text-white border-2 border-yellow-200 hover:bg-yellow-600';
    return 'bg-gray-600 text-white border-2 border-gray-200 hover:bg-gray-600';
  };

  const getViralityRank = (score: number) => {
    if (score >= 90) return '#1';
    if (score >= 80) return '#2';
    if (score >= 70) return '#3';
    return `#${Math.floor(score / 10)}`;
  };

  // Generate video thumbnail from video URL or use fallback
  const generateVideoThumbnail = (clip: any) => {
    // If we have a video URL, create a video element to extract thumbnail
    if (clip.videoUrl) {
      return (
        <div className="w-full h-full relative bg-gray-900">
          <video
            src={clip.videoUrl}
            className="w-full h-full object-cover"
            preload="metadata"
            muted
            playsInline
            poster={clip.thumbnailUrl || undefined}
            onLoadedMetadata={(e) => {
              // Set video to middle frame for thumbnail
              const video = e.currentTarget;
              video.currentTime = Math.min(video.duration / 2, 5); // Middle or 5 seconds
            }}
          />
          {/* Dark overlay for better text visibility */}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
      );
    }
    
    // Fallback for clips without video URL
    return (
      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
        <div className="text-center text-white">
          <Scissors className="h-8 w-8 mx-auto mb-2 opacity-60" />
          <p className="text-xs opacity-80">Video Processing</p>
        </div>
      </div>
    );
  };

  // Clip modal handlers
  const handleViewClip = (clip: any) => {
    // Debug logging to understand video URL issues
    console.log('🎬 Opening clip:', {
      clipId: clip.id,
      title: clip.title,
      videoUrl: clip.videoUrl,
      thumbnailUrl: clip.thumbnailUrl,
      hasVideoUrl: !!clip.videoUrl,
      allClipKeys: Object.keys(clip)
    });
    
    // If no video URL, try to recover before opening modal
    if (!clip.videoUrl) {
      console.warn('⚠️ Clip has no video URL, attempting recovery...');
      handleManualRecovery();
      return;
    }
    
    // Transform clip to BaseContentItem format
    const baseContent: BaseContentItem = {
      id: clip.id,
      title: clip.title,
      type: 'reel' as const,
      thumbnail_url: clip.thumbnailUrl,
      content_url: clip.videoUrl,
      description: clip.transcript,
      duration: clip.duration,
      viralityScore: clip.viralityScore,
      reasoning: clip.viralityReasoning,
      transcript: clip.transcript,
      suggestedCaption: clip.suggestedCaption,
      suggestedHashtags: clip.suggestedHashtags,
      speaker_name: session?.speaker_microsites?.name || 'Unknown Speaker',
      event_name: session?.events?.name || 'Unknown Event'
    };
    
    console.log('🎯 Transformed to BaseContentItem:', {
      id: baseContent.id,
      content_url: baseContent.content_url,
      hasContentUrl: !!baseContent.content_url
    });
    
    setSelectedClip(baseContent);
    setIsClipModalOpen(true);
  };

  const handleCloseClipModal = () => {
    setSelectedClip(null);
    setIsClipModalOpen(false);
  };

  const handlePublish = async (platforms: string[], caption: string) => {
    console.log('Publishing to platforms:', platforms, 'with caption:', caption);
    // TODO: Implement actual publishing logic
  };

  const handleDownloadClip = (clip: BaseContentItem) => {
    if (clip.content_url) {
      const a = document.createElement('a');
      a.href = clip.content_url;
      a.download = `${clip.title}.mp4`;
      a.click();
    }
  };

  if (isProcessing) {
    return (
      <div className="flex-1 lg:max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing Content...
            </CardTitle>
            <CardDescription>
              Please wait while we analyze and generate content from your upload.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">This may take a few minutes...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex-1 lg:max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Processing Error
            </CardTitle>
            <CardDescription>
              There was an error processing your content. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button 
                onClick={onRefreshSession} 
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Retry Processing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="flex-1 lg:max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              No Content Generated Yet
            </CardTitle>
            <CardDescription>
              Upload content to generate blog posts, social media content, and more.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1">
      {/* Header section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Generated Content
          </h2>
          <p className="text-muted-foreground mt-1">
            AI-generated content from your uploaded material
          </p>
        </div>
        <Button
          onClick={onRefreshSession}
          variant="outline"
          size="sm"
          disabled={refreshing}
          className="hover:bg-gray-100"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      
      {/* Tabs section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="clips" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                AI Clips
              </TabsTrigger>
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="quotes" className="flex items-center gap-2">
                <Quote className="h-4 w-4" />
                Key Quotes
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="overview" className="mt-0">
                <div className="space-y-6">
                  {/* Title and Summary */}
                  {sessionData.ai_title && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">Generated Title</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCopy(sessionData.ai_title as string, 'Title')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xl font-medium text-foreground">
                        {sessionData.ai_title as string}
                      </p>
                    </div>
                  )}

                  {sessionData.ai_summary && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">Summary</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCopy(sessionData.ai_summary as string, 'Summary')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {sessionData.ai_summary as string}
                      </p>
                    </div>
                  )}

                  {/* Processing Info */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Processing Method: {sessionData.processing_method as string || 'Unknown'}</span>
                      <span>Content Length: {sessionData.content_length as number || 0} characters</span>
                      {sessionData.processed_at && (
                        <span>
                          Processed: {new Date(sessionData.processed_at as string).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* AI Clips Tab */}
              <TabsContent value="clips" className="mt-0">
                {Array.isArray(sessionData.video_clips) && (sessionData.video_clips as any[]).length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">AI-Generated Clips</h3>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {(sessionData.video_clips as any[]).filter((c) => (c?.viralityScore ?? 0) >= 66).length} clips
                      </Badge>
                    </div>
                    
                    {/* Clip Data Validation Warning */}
                    {videoClips.length > 0 && (!validateClipData(videoClips) || !hasValidVideoUrls(videoClips)) && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                          <div className="flex-1">
                            <h4 className="font-medium text-yellow-800">Clips not loading properly?</h4>
                            <p className="text-sm text-yellow-700">
                              Your video clips are safe in our database! Sometimes browser cache can cause display issues.
                            </p>
                          </div>
                          <Button 
                            onClick={handleManualRecovery}
                            disabled={isRecovering}
                            variant="outline" 
                            size="sm"
                            className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                          >
                            {isRecovering ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Recovering...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Fix Clips
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Card-based grid like Browse page */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {(sessionData.video_clips as any[])
                        .filter((c) => (c?.viralityScore ?? 0) >= 66)
                        .sort((a, b) => (b?.viralityScore ?? 0) - (a?.viralityScore ?? 0))
                        .map((clip) => (
                          <div key={clip.id} className="group cursor-pointer">
                            <div 
                              className="relative aspect-[4/5] rounded-lg overflow-hidden bg-card shadow-card hover:shadow-card-hover transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2"
                              onClick={() => handleViewClip(clip)}
                            >
                              {/* Video thumbnail */}
                              {generateVideoThumbnail(clip)}
                              
                              {/* Play button overlay */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-md border-2 border-white/40 group-hover:scale-110 transition-transform duration-300">
                                  <Play className="h-8 w-8 text-white ml-1" fill="white" />
                                </div>
                              </div>

                              {/* Virality Score Badge */}
                              {clip.viralityScore && (
                                <div className="absolute top-3 left-3">
                                  <Badge className={`${getViralityColor(clip.viralityScore)} font-semibold shadow-lg backdrop-blur-sm !bg-opacity-100 hover:!bg-opacity-100`}>
                                    {getViralityRank(clip.viralityScore)} ({clip.viralityScore}/100)
                                  </Badge>
                                </div>
                              )}

                              {/* Duration Badge */}
                              {clip.duration && (
                                <div className="absolute bottom-3 left-3">
                                  <Badge variant="secondary" className="bg-black/70 text-white">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatDuration(clip.duration)}
                                  </Badge>
                                </div>
                              )}

                              {/* Content info overlay on hover */}
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                <h3 className="text-white font-semibold text-base mb-1 line-clamp-2">{clip.title}</h3>
                                <p className="text-white/90 text-sm font-medium">{session?.speaker_microsites?.name || 'Unknown Speaker'}</p>
                                <p className="text-white/70 text-xs">{session?.events?.name || 'Unknown Event'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                <div className="text-center py-12">
                  <div className="mb-4">
                    <Scissors className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {videoStatus === 'failed' ? 'Video Processing Issue' : 'Generating AI Clips'}
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      {videoStatus === 'failed' 
                        ? 'There was an issue processing your video. Let\'s try to retrieve your clips.'
                        : videoStatus === 'completed' 
                          ? 'Your video was processed successfully. Retrieving the generated clips...' 
                          : 'We\'re analyzing your video to extract the most viral moments. This usually takes a few minutes.'
                      }
                    </p>
                  </div>

                  {/* Seamless retry button - no Vizard details exposed */}
                  {videoStatus === 'failed' && (
                    <div className="mt-6">
                      <Button 
                        onClick={async () => {
                          try {
                            setRetrying(true);
                            console.log('🔄 Retrying video processing...');
                            
                            const { data, error } = await supabase.functions.invoke('retry-video-processing', {
                              body: { sessionId: session.id }
                            });
                            
                            if (error) {
                              console.error('❌ Retry error:', error);
                              alert('Unable to retrieve clips. Please try again later.');
                            } else {
                              console.log('✅ Retry result:', data);
                              if (data.success) {
                                alert(`Success! Retrieved ${data.clipsCount} video clips`);
                                setTimeout(() => onRefreshSession(), 1000);
                              } else {
                                alert(data.message || 'No clips found. The video may still be processing.');
                              }
                            }
                          } catch (error) {
                            console.error('❌ Retry failed:', error);
                            alert('Unable to retrieve clips. Please try again later.');
                          } finally {
                            setRetrying(false);
                          }
                        }}
                        disabled={retrying || refreshing}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {retrying ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Retrieving Clips...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Retry Processing
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        This will check for any completed video clips
                      </p>
                    </div>
                  )}

                  {/* Manual check for existing job IDs */}
                  {(session as any).video_processing_job_id && !videoClips.length && videoStatus !== 'failed' && (
                    <Button 
                      onClick={async () => {
                        try {
                          console.log('🔍 Manually checking for clips...');
                          const { data, error } = await supabase.functions.invoke('vizard-poll', {
                            body: { 
                              sessionId: session.id, 
                              jobId: (session as any).video_processing_job_id 
                            }
                          });
                          
                          if (error) {
                            console.error('❌ Manual poll error:', error);
                          } else {
                            console.log('📊 Manual poll result:', data);
                            if (data.status === 'completed') {
                              setTimeout(() => onRefreshSession(), 1000);
                            }
                          }
                        } catch (error) {
                          console.error('❌ Manual polling failed:', error);
                        }
                      }}
                      variant="outline" 
                      size="sm"
                      className="mt-3"
                      disabled={refreshing}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {refreshing ? 'Checking...' : 'Check for Clips'}
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Key Quotes Tab */}
            <TabsContent value="quotes" className="mt-0">
              {sessionData.key_quotes && Array.isArray(sessionData.key_quotes) && (sessionData.key_quotes as string[]).length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Key Quotes</h3>
                  <div className="grid gap-4">
                    {(sessionData.key_quotes as string[]).map((quote, index) => (
                      <div key={index} className="border-l-4 border-primary pl-4">
                        <div className="flex items-start justify-between">
                          <blockquote className="text-sm italic flex-1">
                            "{quote}"
                          </blockquote>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCopy(quote, 'Quote')}
                            className="ml-2"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No key quotes found in this session.</p>
              )}
            </div>
              </TabsContent>
          </Tabs>

      {/* Professional Publish Modal */}
      <PublishModal
        isOpen={isClipModalOpen}
        onClose={handleCloseClipModal}
        content={selectedClip}
        onPublish={handlePublish}
        onDownload={handleDownloadClip}
        title="Publish Your Video Clip"
      />
    </div>
  );
};