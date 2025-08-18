import { useState } from "react";
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

  const sessionData = session.session_data as Record<string, unknown> | undefined;
  const videoStatus = (session as any).video_processing_status as string | undefined;
  const videoClips = (sessionData?.video_clips as any[]) || [];

  // Debug logging to understand data structure
  console.log('🎬 Video clips data:', {
    videoClips: videoClips,
    sampleClip: videoClips[0],
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
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <p className="text-muted-foreground">Something went wrong. Please refresh or try uploading again.</p>
              </div>
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
            <CardTitle>No Content Available</CardTitle>
            <CardDescription>
              No processed content found for this session.
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

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Content Overview</h3>
                
                {sessionData.ai_summary && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Summary</h4>
                    <p className="text-muted-foreground">{sessionData.ai_summary as string}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCopy(sessionData.ai_summary as string, 'Summary')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Summary
                    </Button>
                  </div>
                )}

                {sessionData.blog_content && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Blog Content</h4>
                    <div className="max-h-96 overflow-y-auto prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-muted-foreground">
                        {(sessionData.blog_content as string).slice(0, 500)}...
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCopy(sessionData.blog_content as string, 'Blog Content')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Blog Post
                    </Button>
                  </div>
                )}

                {sessionData.social_posts && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Social Posts</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(sessionData.social_posts as Record<string, string>).map(([platform, post]) => (
                        <div key={platform} className="border rounded p-3">
                          <h5 className="font-medium capitalize mb-2">{platform}</h5>
                          <p className="text-sm text-muted-foreground mb-2">{post}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onCopy(post, `${platform} post`)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              </TabsContent>

              {/* Key Quotes Tab */}
            <TabsContent value="quotes">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Key Quotes</h3>
                
                {Array.isArray(sessionData.key_quotes) && (sessionData.key_quotes as string[]).length > 0 ? (
                    <div className="grid gap-4">
                      {(sessionData.key_quotes as string[]).map((quote, index) => (
                      <div key={index} className="border-l-4 border-primary pl-4 py-2">
                        <blockquote className="text-muted-foreground italic">
                              "{quote}"
                            </blockquote>
                            <Button
                              variant="ghost"
                              size="sm"
                          className="mt-2"
                              onClick={() => onCopy(quote, 'Quote')}
                            >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Quote
                            </Button>
                        </div>
                      ))}
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