import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSessionData } from "@/hooks/useSessionData";
import { useSessionSpeakers } from "@/hooks/useSessionSpeakers";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import QuickEditSpeakerModal from "@/components/ui/QuickEditSpeakerModal";
import AdvancedSpeakerModal from "@/components/ui/AdvancedSpeakerModal";
import AddSpeakerModal from "@/components/ui/AddSpeakerModal";
import SelectExistingSpeakerModal from "@/components/ui/SelectExistingSpeakerModal";

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
  
  // Local component state (not extracted to hooks)
  const [isEditing, setIsEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Speaker management state
  const [selectedSpeakerForEdit, setSelectedSpeakerForEdit] = useState<any>(null);
  const [selectedSpeakerForAdvanced, setSelectedSpeakerForAdvanced] = useState<any>(null);
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
  const [isAddSpeakerModalOpen, setIsAddSpeakerModalOpen] = useState(false);
  const [isSelectExistingModalOpen, setIsSelectExistingModalOpen] = useState(false);
  const [allSpeakers, setAllSpeakers] = useState<any[]>([]);

  // Mock preview mode toggle
  const [showPreview, setShowPreview] = useState(true);

  // Speaker management handlers
  const handleEditSpeaker = (speaker: any) => {
    setSelectedSpeakerForEdit(speaker);
    setIsQuickEditOpen(true);
  };

  const handleAdvancedSpeaker = (speaker: any) => {
    setSelectedSpeakerForAdvanced(speaker);
    setIsAdvancedModalOpen(true);
  };

  const handleDeleteSpeaker = (speaker: any) => {
    setSelectedSpeakerForAdvanced(speaker);
    setIsAdvancedModalOpen(true);
    // The advanced modal will handle the delete flow
  };

  const handleSpeakerUpdate = (updatedSpeaker: any) => {
    // Update speaker in local state
    setSpeakers(prev => prev.map(s => 
      s.speakers?.id === updatedSpeaker.id 
        ? { ...s, speakers: updatedSpeaker }
        : s
    ));
  };

  const handleSpeakerDelete = (speakerId: string) => {
    // Remove speaker from local state
    setSpeakers(prev => prev.filter(s => s.speakers?.id !== speakerId));
  };

  const handleViewMicrosite = (speaker: any) => {
    // Find the microsite data for this speaker
    const micrositeData = speakers.find(s => s.speakers?.id === speaker.id);
    if (micrositeData?.events?.subdomain && speaker.slug) {
      const url = `/event/${micrositeData.events.subdomain}/speaker/${speaker.slug}`;
      window.open(url, '_blank');
    } else {
      toast({
        title: "Microsite not ready",
        description: "Speaker microsite is being prepared and will be available soon.",
      });
    }
  };

  const handleAddNewSpeaker = () => {
    setIsAddSpeakerModalOpen(true);
  };

  const handleAddExistingSpeaker = () => {
    setIsSelectExistingModalOpen(true);
  };

  const handleSpeakerCreated = async (newSpeaker: any) => {
    if (!session?.event_id || !id || !user?.id) {
      toast({
        title: "Error",
        description: "Missing session or event information.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🚀 Creating microsite and linking new speaker to session...');
      
      // Step 1: Create microsite for this speaker + event
      const { data: newMicrosite, error: micrositeError } = await supabase
        .from('speaker_microsites')
        .insert({
          speaker_id: newSpeaker.id,
          event_id: session.event_id,
          microsite_url: newSpeaker.slug,
          is_live: true,
          approval_status: 'approved',
          published_at: new Date().toISOString(),
          created_by: user.id
        })
        .select('id')
        .single();

      if (micrositeError) {
        console.error('Error creating microsite for new speaker:', micrositeError);
        throw micrositeError;
      }

      console.log('✅ Created microsite for new speaker:', newMicrosite.id);

      // Step 2: Create junction table entry to link microsite to this session
      const { error: junctionError } = await (supabase as any)
        .from('speaker_microsite_sessions')
        .insert({
          microsite_id: newMicrosite.id,
          session_id: id,
          created_by: user.id
        });

      if (junctionError) {
        console.error('Error linking session to new speaker microsite:', junctionError);
        throw junctionError;
      }

      console.log('✅ Linked new speaker to session via junction table');
      
      // Step 3: Refresh the speakers list to show the newly created speaker
      await fetchAllSpeakers();
      
      toast({
        title: "Speaker added successfully",
        description: `${newSpeaker.full_name} has been added to this session and their microsite is ready.`,
      });
      
    } catch (error) {
      console.error('Error adding new speaker to session:', error);
      toast({
        title: "Error adding speaker",
        description: "The speaker was created but couldn't be added to this session. Please try adding them as an existing speaker.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveSpeaker = async (speaker: any) => {
    if (!session?.event_id || !id) {
      toast({
        title: "Error",
        description: "Missing session or event information.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find the microsite for this speaker in this event
      const { data: microsite } = await supabase
        .from('speaker_microsites')
        .select('id')
        .eq('speaker_id', speaker.id)
        .eq('event_id', session.event_id)
        .single();

      if (!microsite) {
        toast({
          title: "Error",
          description: "Speaker microsite not found.",
          variant: "destructive",
        });
        return;
      }

      // Remove the session link from the junction table
      const { error: deleteError } = await (supabase as any)
        .from('speaker_microsite_sessions')
        .delete()
        .eq('microsite_id', microsite.id)
        .eq('session_id', id);

      if (deleteError) {
        console.error('Error removing speaker from session:', deleteError);
        toast({
          title: "Error",
          description: "Failed to remove speaker from session.",
          variant: "destructive",
        });
        return;
      }

      // Check if this was the last session for this speaker in this event
      const { data: remainingSessions, error: checkError } = await (supabase as any)
        .from('speaker_microsite_sessions')
        .select('id')
        .eq('microsite_id', microsite.id);

      if (checkError) {
        console.error('Error checking remaining sessions:', checkError);
      }

      // If no sessions remain, optionally delete the microsite
      // (You can decide whether to auto-delete or keep it for manual cleanup)
      
      // Refresh the speakers list
      await fetchAllSpeakers();
      
      toast({
        title: "Speaker removed",
        description: `${speaker.full_name} has been removed from this session.`,
      });
    } catch (error) {
      console.error('Error removing speaker:', error);
      toast({
        title: "Error", 
        description: "Failed to remove speaker from session.",
        variant: "destructive",
      });
    }
  };

  const handleExistingSpeakersSelected = async (selectedSpeakers: any[]) => {
    if (!session?.event_id || !id) {
      toast({
        title: "Error",
        description: "No event or session information available.",
        variant: "destructive",
      });
      return;
    }

    try {
      // For each selected speaker, create/find their microsite and link it to this session
      const speakerPromises = selectedSpeakers.map(async (speaker) => {
        // Step 1: Check if a microsite already exists for this speaker + event combination
        const { data: existingMicrosite } = await supabase
          .from('speaker_microsites')
          .select('id, microsite_url')
          .eq('speaker_id', speaker.id)
          .eq('event_id', session.event_id)
          .single();

        let micrositeId = existingMicrosite?.id;

        if (!existingMicrosite) {
          // Step 2: Create new microsite for this speaker + event
          const { data: newMicrosite, error: micrositeError } = await supabase
            .from('speaker_microsites')
            .insert({
              speaker_id: speaker.id,
              event_id: session.event_id,
              microsite_url: speaker.slug,
              is_live: true,
              approval_status: 'approved',
              published_at: new Date().toISOString(),
              created_by: user?.id
            })
            .select('id')
            .single();

          if (micrositeError) {
            console.error(`Error creating microsite for ${speaker.full_name}:`, micrositeError);
            throw micrositeError;
          }

          micrositeId = newMicrosite.id;
          console.log(`Created new microsite for ${speaker.full_name}`);
        } else {
          console.log(`Using existing microsite for ${speaker.full_name}`);
        }

        // Step 3: Create junction table entry to link microsite to this session
        const { error: junctionError } = await (supabase as any)
          .from('speaker_microsite_sessions')
          .upsert({
            microsite_id: micrositeId,
            session_id: id,
            created_by: user?.id
          }, {
            onConflict: 'microsite_id, session_id'
          });

        if (junctionError) {
          console.error(`Error linking session to microsite for ${speaker.full_name}:`, junctionError);
          throw junctionError;
        }

        console.log(`Linked session to microsite for ${speaker.full_name}`);
      });

      await Promise.all(speakerPromises);
      
      // Refresh the speakers list to show the newly added speakers
      await fetchAllSpeakers();
      
      const speakerNames = selectedSpeakers.map(s => s.full_name).join(', ');
      toast({
        title: "Speakers added successfully",
        description: `${speakerNames} ${selectedSpeakers.length === 1 ? 'has' : 'have'} been added to this session.`,
      });
    } catch (error) {
      console.error('Error adding speakers to session:', error);
      toast({
        title: "Error adding speakers",
        description: "There was an error adding speakers to this session. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get IDs of speakers already in this EVENT to exclude from selection
  const getExistingSpeakerIds = () => {
    const eventSpeakerIds = [];
    
    // From fetched speakers (current microsites for this event)
    speakers.forEach(s => {
      if (s.speakers?.id) {
        eventSpeakerIds.push(s.speakers.id);
      }
    });
    
    return eventSpeakerIds.filter(Boolean);
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

  const handleBackClick = () => {
    if (session?.event_id) {
      navigate(`/events/${session.event_id}/manage`);
    } else {
      navigate('/dashboard');
    }
  };

  const handlePreviewPublicPage = () => {
    // Get event subdomain from speakers data or direct event fetch
    const eventSubdomain = speakers[0]?.events?.subdomain || event?.subdomain;
    if (eventSubdomain) {
      window.open(`/event/${eventSubdomain}`, '_blank');
    } else {
      toast({
        title: "Event page not available",
        description: "The public event page is being prepared and will be available soon.",
        variant: "destructive",
      });
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
                  speakers={speakers}
                  event={event}
                  onAddExistingSpeaker={handleAddExistingSpeaker}
                  onAddNewSpeaker={handleAddNewSpeaker}
                  onEditSpeaker={handleEditSpeaker}
                  onAdvancedSpeaker={handleAdvancedSpeaker}
                  onDeleteSpeaker={handleDeleteSpeaker}
                  onRemoveSpeaker={handleRemoveSpeaker}
                  onViewMicrosite={handleViewMicrosite}
                  onCopyUrl={handleCopy}
                  onPreviewPublicPage={handlePreviewPublicPage}
                />
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>

      {/* Add the modals */}
      <QuickEditSpeakerModal
        speaker={selectedSpeakerForEdit}
        isOpen={isQuickEditOpen}
        onClose={() => {
          setIsQuickEditOpen(false);
          setSelectedSpeakerForEdit(null);
        }}
        onUpdate={handleSpeakerUpdate}
      />

      <AdvancedSpeakerModal
        speaker={selectedSpeakerForAdvanced}
        isOpen={isAdvancedModalOpen}
        onClose={() => {
          setIsAdvancedModalOpen(false);
          setSelectedSpeakerForAdvanced(null);
        }}
        onUpdate={handleSpeakerUpdate}
        onDelete={handleSpeakerDelete}
      />

      <AddSpeakerModal
        isOpen={isAddSpeakerModalOpen}
        onClose={() => setIsAddSpeakerModalOpen(false)}
        onSpeakerCreated={handleSpeakerCreated}
      />

      <SelectExistingSpeakerModal
        isOpen={isSelectExistingModalOpen}
        onClose={() => setIsSelectExistingModalOpen(false)}
        onSpeakersSelected={handleExistingSpeakersSelected}
        excludeSpeakerIds={getExistingSpeakerIds()}
      />
    </SidebarProvider>
  );
};

export default SessionDetail;