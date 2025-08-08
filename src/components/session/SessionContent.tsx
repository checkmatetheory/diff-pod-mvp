import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [activeTab, setActiveTab] = useState("overview");

  const sessionData = session.session_data as Record<string, unknown> | undefined;
  const videoStatus = (session as any).video_processing_status as string | undefined;
  const videoClips = (sessionData?.video_clips as any[]) || [];

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
    <div className="flex-1 lg:max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <CardTitle>Generated Content</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefreshSession}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>
          <CardDescription>
            AI-generated content from your uploaded material
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full h-12 mx-6 mt-6 mb-0">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="quotes" className="flex items-center gap-2">
                <Quote className="h-4 w-4" />
                Key Quotes
              </TabsTrigger>
              <TabsTrigger value="clips" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                AI Clips
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

                  {/* Podcast UI removed: keeping UI focused on clips experience */}

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
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">AI-Generated Clips</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(sessionData.video_clips as any[])
                        .filter((c) => (c?.viralityScore ?? 0) >= 66)
                        .sort((a, b) => (b?.viralityScore ?? 0) - (a?.viralityScore ?? 0))
                        .map((clip) => (
                          <div key={clip.id} className="border rounded-lg overflow-hidden bg-card">
                            {clip.thumbnailUrl && (
                              <img src={clip.thumbnailUrl} alt={clip.title} className="w-full h-40 object-cover" />
                            )}
                            <div className="p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="font-medium truncate">{clip.title || 'Clip'}</div>
                                <Badge variant="secondary">{clip.duration || 0}s</Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Virality</span>
                                <Badge variant="outline">{clip.viralityScore ?? 0}</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                {clip.videoUrl && (
                                  <a className="btn btn-sm" href={clip.videoUrl} target="_blank" rel="noreferrer">
                                    <Button size="sm" variant="default" className="gap-2">
                                      <Play className="h-4 w-4" />
                                      Play
                                    </Button>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg p-6 bg-muted/30">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <Scissors className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          Generating AI Clips
                          {videoStatus && (
                            <Badge variant="secondary" className="capitalize">{videoStatus}</Badge>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">We’re analyzing your video to extract the most viral moments. This usually takes a few minutes.</p>
                      </div>
                    </div>
                    {/* Animated placeholders */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className="border rounded-lg overflow-hidden bg-card">
                          <div className="w-full h-40 bg-muted animate-pulse" />
                          <div className="p-3 space-y-2">
                            <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>Virality</span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border">
                                <Sparkles className="h-3 w-3 text-yellow-500" />
                                <span className="h-3 w-6 bg-muted inline-block animate-pulse rounded" />
                              </span>
                            </div>
                            <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">You’ll see clips appear here automatically once they’re ready.</p>
                  </div>
                )}
              </TabsContent>

              {/* Blog & Social tabs removed */}

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
                  <p className="text-muted-foreground">No key quotes generated yet.</p>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}; 