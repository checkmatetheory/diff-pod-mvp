import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSessionData } from "@/hooks/useSessionData";
import { useSessionSpeakers } from "@/hooks/useSessionSpeakers";
import { useVizardPolling } from "@/hooks/useVizardPolling";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { videoRecoveryService } from "@/lib/videoRecoveryService";

// New extracted components
import { SessionLoadingSkeleton } from "@/components/session/SessionLoadingSkeleton";
import { SessionHeader } from "@/components/session/SessionHeader";
import { SessionContent } from "@/components/session/SessionContent";
import { SessionSidebar } from "@/components/session/SessionSidebar";

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use custom hooks for data fetching
  const { session, loading, refreshing, refreshSession } = useSessionData(id);
  const { speakers, speaker, event, fetchAllSpeakers, setSpeakers } = useSessionSpeakers(session, id);
  
  // Initialize video recovery service
  useEffect(() => {
    if (id) {
      videoRecoveryService.initialize(id);
    }
  }, [id]);
  
  // Enhanced video recovery detection
  useEffect(() => {
    if (session && videoRecoveryService.needsRecovery(session)) {
      console.log('🔧 Video recovery needed, initiating automatic recovery...');
      videoRecoveryService.autoRecover(session.id, session.video_processing_job_id);
    }
  }, [session]);
  
  // Vizard polling for video processing - enhanced to continue polling until clips are retrieved
  const shouldPoll = session?.video_processing_job_id && 
                     !session?.session_data?.video_clips?.length &&
                     (session?.video_processing_status === 'submitted' || 
                      session?.video_processing_status === 'processing' ||
                      !session?.video_processing_status);
  
  useVizardPolling({
    sessionId: session?.id,
    jobId: session?.video_processing_job_id,
    isActive: shouldPoll,
    onComplete: refreshSession
  });
  
  // Local component state (not extracted to hooks)
  const [isEditing, setIsEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Mock preview mode toggle
  const [showPreview, setShowPreview] = useState(true);

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

  const handleBackClick = () => {
    if (session?.event_id) {
      navigate(`/events/${session.event_id}/manage`);
    } else {
      navigate('/dashboard');
    }
  };

  // Loading state
  if (loading) {
    return <SessionLoadingSkeleton />;
  }

  // Not found state
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
                    <Button onClick={handleBackClick}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      {session?.event_id ? 'Back to Event Management' : 'Back to Dashboard'}
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
  
  // Enhanced debug logging with recovery status
  const healthCheck = videoRecoveryService.healthCheck(session);
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
    sessionDataKeys: session.session_data ? Object.keys(session.session_data) : 'No session_data',
    videoHealthCheck: healthCheck
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Header />
          <main className="flex-1">
            <div className="container mx-auto px-6 py-8 animate-fade-in">
              <SessionHeader
                session={session}
                showPreview={showPreview}
                onBackClick={handleBackClick}
                onTogglePreview={() => setShowPreview(!showPreview)}
              />

              <div className="flex flex-col lg:flex-row gap-8">
                <SessionContent
                  session={session}
                  showPreview={showPreview}
                  isProcessing={isProcessing}
                  hasError={hasError}
                  isEditing={isEditing}
                  refreshing={refreshing}
                  onRefreshSession={refreshSession}
                  onCopy={handleCopy}
                  onDownload={handleDownload}
                />

                <SessionSidebar
                  session={session}
                  speakers={speakers}
                  event={event}
                  setSpeakers={setSpeakers}
                  fetchAllSpeakers={fetchAllSpeakers}
                />
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default SessionDetail;