import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  MessageSquare, 
  Quote, 
  RefreshCw, 
  Copy, 
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Mic
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
            <TabsList className="grid grid-cols-4 w-full h-12 mx-6 mt-6 mb-0">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="blog" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Blog Post
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Social Media
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

                  {/* Podcast Section */}
                  {session.podcast_url && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Mic className="h-5 w-5" />
                          Generated Podcast
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDownload('audio')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      <audio controls className="w-full">
                        <source src={session.podcast_url} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
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

              {/* Blog Content Tab */}
              <TabsContent value="blog" className="mt-0">
                {sessionData.blog_content ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Blog Post Content</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCopy(sessionData.blog_content as string, 'Blog Post')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDownload('markdown')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {sessionData.blog_content as string}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No blog content generated yet.</p>
                )}
              </TabsContent>

              {/* Social Media Tab */}
              <TabsContent value="social" className="mt-0">
                {sessionData.social_posts ? (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Social Media Posts</h3>
                    
                    {(sessionData.social_posts as Record<string, unknown>).twitter && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-blue-500">Twitter/X Post</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCopy((sessionData.social_posts as Record<string, unknown>).twitter as string, 'Twitter Post')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">
                            {(sessionData.social_posts as Record<string, unknown>).twitter as string}
                          </p>
                        </div>
                      </div>
                    )}

                    {(sessionData.social_posts as Record<string, unknown>).linkedin && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-blue-700">LinkedIn Post</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCopy((sessionData.social_posts as Record<string, unknown>).linkedin as string, 'LinkedIn Post')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">
                            {(sessionData.social_posts as Record<string, unknown>).linkedin as string}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No social media content generated yet.</p>
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