import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Clock, 
  Download, 
  ExternalLink, 
  Share2, 
  Copy, 
  FileText, 
  Video, 
  Loader2, 
  RefreshCw, 
  Trash2, 
  MessageSquare,
  Edit,
  Save,
  X 
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { AudioPlayer } from "@/components/ui/audio-player";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [speaker, setSpeaker] = useState<any>(null);


  const fetchSpeaker = async (speakerId: string) => {
    if (!speakerId) {
      setSpeaker(null);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("speakers")
        .select("id, full_name, email, company, job_title, bio, headshot_url, slug")
        .eq("id", speakerId)
        .single();
      
      if (error) {
        console.error('Error fetching speaker:', error);
        setSpeaker(null);
        return;
      }
      
      setSpeaker(data);
    } catch (error) {
      console.error('Error fetching speaker:', error);
      setSpeaker(null);
    }
  };

  const refreshSession = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) {
        console.error('Error refreshing session:', error);
        return;
      }
      
      setSession(data);
      
      if (data?.processing_status === 'complete') {
        toast({
          title: "Processing complete!",
          description: "Your content has been processed and is ready to view.",
        });
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("user_sessions")
          .select("*")
          .eq("id", id)
          .single();
        
        if (error) {
          console.error('Error fetching session:', error);
          return;
        }
        
        setSession(data);
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);


  // Fetch speaker data when session loads
  useEffect(() => {
    if (session?.session_data?.speaker_id) {
      fetchSpeaker(session.session_data.speaker_id);
    }
  }, [session]);  // Auto-refresh when processing - with better performance
  useEffect(() => {
    if (session?.processing_status === 'processing' || session?.processing_status === 'uploaded') {
      const interval = setInterval(async () => {
        // Only refresh if not already refreshing to prevent overlapping requests
        if (!refreshing) {
          try {
            const { data, error } = await supabase
              .from("user_sessions")
              .select("*")
              .eq("id", id)
              .single();
            
            if (error) {
              console.error('Error in auto-refresh:', error);
              return;
            }
            
            // Only update state if the data actually changed
            if (data && JSON.stringify(data) !== JSON.stringify(session)) {
              setSession(data);
              
              // If processing completed, show notification and stop auto-refresh
              if (data.processing_status === 'complete' && session?.processing_status !== 'complete') {
                toast({
                  title: "Processing complete!",
                  description: "Your content has been processed and is ready to view.",
                });
              }
            }
          } catch (error) {
            console.error('Error in auto-refresh:', error);
          }
        }
      }, 5000); // Increased to 5 seconds to reduce frequency

      return () => clearInterval(interval);
    }
  }, [session?.processing_status, id, refreshing, session, toast]);

  // Stop auto-refresh when processing is complete
  useEffect(() => {
    if (session?.processing_status === 'complete' || session?.processing_status === 'error') {
      // Clear any existing intervals by re-running the effect
    }
  }, [session?.processing_status]);

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <SidebarInset className="flex-1">
            <Header />
            <main className="flex-1">
              <div className="container mx-auto px-6 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-lg">Loading session...</span>
                  </div>
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (!session) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <SidebarInset className="flex-1">
            <Header />
            <main className="flex-1">
              <div className="container mx-auto px-6 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <h2 className="text-2xl font-semibold text-destructive mb-2">Session not found</h2>
                    <p className="text-muted-foreground mb-4">The session you're looking for doesn't exist or you don't have access to it.</p>
                    <Button onClick={() => navigate('/dashboard')}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </div>
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  const isProcessing = session.processing_status === 'processing' || session.processing_status === 'uploaded';
  const hasError = session.processing_status === 'error';
  const isComplete = session.processing_status === 'complete';
  
  // Debug logging
  console.log('🔍 SessionDetail Debug:', {
    sessionId: session.id,
    processingStatus: session.processing_status,
    isProcessing,
    hasError,
    isComplete,
    hasSessionData: !!session.session_data,
    hasBlogContent: !!session.session_data?.blog_content,
    hasSocialPosts: !!session.session_data?.social_posts,
    hasKeyQuotes: !!session.session_data?.key_quotes,
    sessionDataKeys: session.session_data ? Object.keys(session.session_data) : 'No session_data'
  });
  
  const getStatusBadge = () => {
    switch (session.processing_status) {
      case 'processing':
      case 'uploaded':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing...
          </Badge>
        );
      case 'complete':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Complete
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {session.processing_status}
          </Badge>
        );
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${type} content copied successfully`,
    });
  };

  const handleDownload = (format: string) => {
    toast({
      title: "Download started",
      description: `Downloading ${session.session_name || session.generated_title} as ${format}`,
    });
  };

  const handlePublish = () => {
    toast({
      title: "Published successfully",
      description: "Your session recap is now live and shareable",
    });
  };

  const handleDeleteSession = async () => {
    if (!session?.id) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', session.id);

      if (error) throw error;

      toast({
        title: "Session deleted",
        description: "The content has been permanently removed.",
      });
      
      // Navigate back to events or dashboard
      navigate('/events');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Header />
          <main className="flex-1">
            <div className="container mx-auto px-6 py-8">
              {/* Header Section */}
              <div className="flex items-center gap-4 mb-6">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </div>

              <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Content */}
                <div className="flex-1">
                  {/* Session Info Card */}
                  <Card className="shadow-card mb-6">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-2xl mb-2">{session.session_name || session.generated_title || 'Session'}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {session.audio_duration ? `${Math.floor(session.audio_duration / 60)} min` : 'N/A'}
                            </div>
                            <span>{session.created_at ? new Date(session.created_at).toLocaleDateString() : ''}</span>
                          </div>
                          {getStatusBadge()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                            {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                            {isEditing ? 'Save' : 'Edit'}
                          </Button>
                          {isProcessing && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={refreshSession}
                              disabled={refreshing}
                            >
                              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                              {refreshing ? 'Refreshing...' : 'Refresh'}
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Session</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{session.session_name || session.generated_title || 'this session'}"? This action cannot be undone and will permanently remove:
                                  <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>The session recording and transcript</li>
                                    <li>Generated AI summary and insights</li>
                                    <li>Video and media files</li>
                                    <li>All analytics data for this content</li>
                                  </ul>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteSession}
                                  disabled={deleting}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  {deleting ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete Permanently
                                    </>
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Processing Status Alert */}
                  {isProcessing && (
                    <Alert className="mb-6 border-blue-200 bg-blue-50">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <AlertTitle>Processing Content</AlertTitle>
                      <AlertDescription>
                        Your content is being processed with AI. This usually takes 30-60 seconds. 
                        The page will automatically update when processing is complete.
                        <div className="mt-2 text-sm text-muted-foreground">
                          Status: {session.processing_status} • Last updated: {new Date().toLocaleTimeString()}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {hasError && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertTitle>Processing Error</AlertTitle>
                      <AlertDescription>
                        There was an error processing your content. Please try refreshing or contact support.
                        <div className="mt-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={refreshSession}
                            disabled={refreshing}
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Refreshing...' : 'Retry'}
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Content Tabs */}
                  <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="grid w-full grid-cols-6">
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                      <TabsTrigger value="videos">Videos</TabsTrigger>
                      <TabsTrigger value="blog">Blog</TabsTrigger>
                      <TabsTrigger value="social">Social</TabsTrigger>
                      <TabsTrigger value="quotes">Quotes</TabsTrigger>
                      <TabsTrigger value="transcript">Transcript</TabsTrigger>
                    </TabsList>

                    <TabsContent value="summary" className="mt-6">
                      <Card className="shadow-card">
                        <CardHeader>
                          <CardTitle>Executive Summary</CardTitle>
                          <CardDescription>AI-generated summary of key discussion points</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {isProcessing ? (
                            <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                              <div className="text-center space-y-3">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                                <p>AI is analyzing your content and generating a professional summary...</p>
                                <p className="text-sm">This usually takes 30-60 seconds</p>
                              </div>
                            </div>
                          ) : hasError ? (
                            <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                              <div className="text-center space-y-3">
                                <p>There was an error generating the summary.</p>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={refreshSession}
                                  disabled={refreshing}
                                >
                                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                  Retry
                                </Button>
                              </div>
                            </div>
                          ) : isEditing ? (
                            <Textarea 
                              value={session.generated_summary || session.transcript_summary || 'No summary available.'}
                              className="min-h-[200px] resize-none"
                              placeholder="Edit summary..."
                            />
                          ) : (
                            <div className="prose max-w-none">
                              <p className="text-foreground leading-relaxed">
                                {session.generated_summary || session.transcript_summary || 'No summary available yet. The content is being processed.'}
                              </p>
                            </div>
                          )}
                          {!isProcessing && !hasError && (
                            <div className="flex gap-2 mt-4">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleCopy(session.generated_summary || session.transcript_summary || 'No summary available.', "Summary")}
                                disabled={!session.generated_summary && !session.transcript_summary}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDownload("PDF")}
                                disabled={!session.generated_summary && !session.transcript_summary}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                PDF
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="videos" className="mt-6">
                      <Card className="shadow-card">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Video className="h-5 w-5" />
                            Video Content
                          </CardTitle>
                          <CardDescription>
                            Access your uploaded video content and media
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {isProcessing ? (
                            <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                              <div className="text-center space-y-3">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                                <p>Editing your short from videos...</p>
                                <p className="text-sm">Creating speaker microsite and generating content</p>
                              </div>
                            </div>
                          ) : hasError ? (
                            <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                              <div className="text-center space-y-3">
                                <p>There was an error processing the video content.</p>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={refreshSession}
                                  disabled={refreshing}
                                >
                                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                  Retry
                                </Button>
                              </div>
                            </div>
                          ) : session.podcast_url ? (
                            <AudioPlayer 
                              audioUrl={session.podcast_url} 
                              title={session.session_name || session.generated_title}
                              className="w-full"
                            />
                          ) : (
                            <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                              <div className="text-center space-y-3">
                                <Video className="h-12 w-12 mx-auto opacity-50" />
                                <p>No video content uploaded yet.</p>
                                <p className="text-sm">Video content will appear here once uploaded and processed.</p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="blog" className="mt-6">
                      <Card className="shadow-card">
                        <CardHeader>
                          <CardTitle>Blog Article</CardTitle>
                          <CardDescription>Ready-to-publish blog post</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {isProcessing ? (
                            <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                              <div className="text-center space-y-3">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                                <p>AI is generating your blog content...</p>
                                <p className="text-sm">Creating professional article with insights</p>
                              </div>
                            </div>
                          ) : hasError ? (
                            <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                              <div className="text-center space-y-3">
                                <p>There was an error generating the blog content.</p>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={refreshSession}
                                  disabled={refreshing}
                                >
                                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                  Retry
                                </Button>
                              </div>
                            </div>
                          ) : isEditing ? (
                            <Textarea 
                              value={session.session_data?.blog_content || 'No blog content available.'}
                              className="min-h-[400px] resize-none font-mono text-sm"
                              placeholder="Edit blog content..."
                            />
                          ) : (
                            <div className="prose max-w-none">
                              <div className="whitespace-pre-wrap text-foreground">
                                {session.session_data?.blog_content || 'No blog content available yet. The content is being processed.'}
                              </div>
                            </div>
                          )}
                          {!isProcessing && !hasError && (
                            <div className="flex gap-2 mt-4">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleCopy(session.session_data?.blog_content || 'No blog content available.', "Blog")}
                                disabled={!session.session_data?.blog_content}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy HTML
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDownload("Markdown")}
                                disabled={!session.session_data?.blog_content}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Markdown
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="social" className="mt-6">
                      <div className="space-y-6">
                        <Card className="shadow-card">
                          <CardHeader>
                            <CardTitle>Twitter Thread</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {isProcessing ? (
                              <div className="flex items-center justify-center min-h-[150px] text-muted-foreground">
                                <div className="text-center space-y-3">
                                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                  <p>Generating Twitter content...</p>
                                </div>
                              </div>
                            ) : hasError ? (
                              <div className="flex items-center justify-center min-h-[150px] text-muted-foreground">
                                <div className="text-center space-y-3">
                                  <p>Error generating Twitter content.</p>
                                  <Button variant="outline" size="sm" onClick={refreshSession} disabled={refreshing}>
                                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                    Retry
                                  </Button>
                                </div>
                              </div>
                            ) : isEditing ? (
                              <Textarea 
                                value={session.session_data?.social_posts?.twitter || 'No Twitter content available.'}
                                className="min-h-[150px] resize-none"
                                placeholder="Edit Twitter content..."
                              />
                            ) : (
                              <div className="bg-muted/30 p-4 rounded-lg">
                                <p className="whitespace-pre-wrap">{session.session_data?.social_posts?.twitter || 'No Twitter content available yet.'}</p>
                              </div>
                            )}
                            {!isProcessing && !hasError && (
                              <div className="flex gap-2 mt-4">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleCopy(session.session_data?.social_posts?.twitter || 'No Twitter content available.', "Twitter thread")}
                                  disabled={!session.session_data?.social_posts?.twitter}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        <Card className="shadow-card">
                          <CardHeader>
                            <CardTitle>LinkedIn Post</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {isProcessing ? (
                              <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                                <div className="text-center space-y-3">
                                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                  <p>Generating LinkedIn content...</p>
                                </div>
                              </div>
                            ) : hasError ? (
                              <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                                <div className="text-center space-y-3">
                                  <p>Error generating LinkedIn content.</p>
                                  <Button variant="outline" size="sm" onClick={refreshSession} disabled={refreshing}>
                                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                    Retry
                                  </Button>
                                </div>
                              </div>
                            ) : isEditing ? (
                              <Textarea 
                                value={session.session_data?.social_posts?.linkedin || 'No LinkedIn content available.'}
                                className="min-h-[200px] resize-none"
                                placeholder="Edit LinkedIn content..."
                              />
                            ) : (
                              <div className="bg-muted/30 p-4 rounded-lg">
                                <p className="whitespace-pre-wrap">{session.session_data?.social_posts?.linkedin || 'No LinkedIn content available yet.'}</p>
                              </div>
                            )}
                            {!isProcessing && !hasError && (
                              <div className="flex gap-2 mt-4">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleCopy(session.session_data?.social_posts?.linkedin || 'No LinkedIn content available.', "LinkedIn post")}
                                  disabled={!session.session_data?.social_posts?.linkedin}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="quotes" className="mt-6">
                      <div className="space-y-4">
                        {isProcessing ? (
                          <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                            <div className="text-center space-y-3">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                              <p>Extracting key quotes...</p>
                              <p className="text-sm">Finding the most impactful statements</p>
                            </div>
                          </div>
                        ) : hasError ? (
                          <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                            <div className="text-center space-y-3">
                              <p>Error extracting quotes.</p>
                              <Button variant="outline" size="sm" onClick={refreshSession} disabled={refreshing}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                Retry
                              </Button>
                            </div>
                          </div>
                        ) : session.session_data?.key_quotes && session.session_data.key_quotes.length > 0 ? (
                          session.session_data.key_quotes.map((quote, index) => (
                            <Card key={index} className="shadow-card">
                              <CardContent className="p-6">
                                <blockquote className="text-lg italic mb-4">
                                  "{quote}"
                                </blockquote>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold">Key Insight {index + 1}</p>
                                    <p className="text-sm text-muted-foreground">Extracted from content</p>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleCopy(quote, "Quote")}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                            <div className="text-center space-y-3">
                              <MessageSquare className="h-12 w-12 mx-auto opacity-50" />
                              <p>No key quotes available yet.</p>
                              <p className="text-sm">Quotes will appear here once processing is complete.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="transcript" className="mt-6">
                      <Card className="shadow-card">
                        <CardHeader>
                          <CardTitle>Full Transcript</CardTitle>
                          <CardDescription>Complete session transcript with timestamps</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {isProcessing ? (
                            <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                              <div className="text-center space-y-3">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                                <p>Processing transcript...</p>
                                <p className="text-sm">Extracting text content</p>
                              </div>
                            </div>
                          ) : hasError ? (
                            <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
                              <div className="text-center space-y-3">
                                <p>Error processing transcript.</p>
                                <Button variant="outline" size="sm" onClick={refreshSession} disabled={refreshing}>
                                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                  Retry
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-muted/30 p-4 rounded-lg max-h-96 overflow-y-auto">
                              <pre className="whitespace-pre-wrap text-sm">
                                {session.session_data?.extracted_text || session.transcript_summary || 'No transcript content available yet.'}
                              </pre>
                            </div>
                          )}
                          {!isProcessing && !hasError && (
                            <div className="flex gap-2 mt-4">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleCopy(session.session_data?.extracted_text || session.transcript_summary || 'No transcript content available.', "Transcript")}
                                disabled={!session.session_data?.extracted_text && !session.transcript_summary}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDownload("TXT")}
                                disabled={!session.session_data?.extracted_text && !session.transcript_summary}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Sidebar */}
                <div className="w-full lg:w-80 space-y-6">
                  {/* Quick Actions */}
                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        className="w-full bg-accent hover:bg-accent-hover"
                        onClick={handlePublish}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Publish Recap
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Session
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download All
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Public URL */}
                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="text-lg">Public Recap</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Label htmlFor="public-url">Shareable URL</Label>
                        <div className="flex gap-2">
                          <Input
                            id="public-url"
                            value={session.public_url || session.generated_public_url || 'No public URL available.'}
                            readOnly
                            className="flex-1"
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCopy(session.public_url || session.generated_public_url || 'No public URL available.', "URL")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full"
                          onClick={() => window.open(`/recap/${session.id}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Preview Public Page
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Speakers */}
                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="text-lg">Speakers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {session.session_data?.speaker_name ? (
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              {speaker?.headshot_url ? (
                                <AvatarImage src={speaker.headshot_url} alt={speaker.full_name} />
                              ) : null}
                              <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                {session.session_data.speaker_name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{session.session_data.speaker_name}</span>
                              {speaker?.job_title && speaker?.company && (
                                <span className="text-xs text-muted-foreground">
                                  {speaker.job_title} at {speaker.company}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            No speaker assigned to this session.</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default SessionDetail;