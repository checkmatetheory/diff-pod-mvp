import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Copy, ExternalLink } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SpeakerManagementCard from "@/components/ui/SpeakerManagementCard";
import QuickEditSpeakerModal from "@/components/ui/QuickEditSpeakerModal";
import AdvancedSpeakerModal from "@/components/ui/AdvancedSpeakerModal";
import AddSpeakerModal from "@/components/ui/AddSpeakerModal";
import SelectExistingSpeakerModal from "@/components/ui/SelectExistingSpeakerModal";

interface SessionSidebarProps {
  session: any;
  speakers: any[];
  event: any;
  setSpeakers: React.Dispatch<React.SetStateAction<any[]>>;
  fetchAllSpeakers: () => Promise<void>;
}

export const SessionSidebar = ({
  session,
  speakers,
  event,
  setSpeakers,
  fetchAllSpeakers
}: SessionSidebarProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Speaker management state (moved from SessionDetail.tsx)
  const [selectedSpeakerForEdit, setSelectedSpeakerForEdit] = useState<any>(null);
  const [selectedSpeakerForAdvanced, setSelectedSpeakerForAdvanced] = useState<any>(null);
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
  const [isAddSpeakerModalOpen, setIsAddSpeakerModalOpen] = useState(false);
  const [isSelectExistingModalOpen, setIsSelectExistingModalOpen] = useState(false);

  // Speaker management handlers (moved from SessionDetail.tsx)
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
    if (!session?.event_id || !session?.id || !user?.id) {
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
          session_id: session.id,
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
    if (!session?.event_id || !session?.id) {
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
        .eq('session_id', session.id);

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
    if (!session?.event_id || !session?.id) {
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
            session_id: session.id,
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

  const handleCopyUrl = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${type} content copied successfully`,
    });
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

  const getPublicUrl = () => {
    const eventSubdomain = speakers[0]?.events?.subdomain || event?.subdomain;
    return eventSubdomain 
      ? `${window.location.origin}/event/${eventSubdomain}`
      : 'Event page URL will be available once event is configured.';
  };

  const hasEventSubdomain = () => {
    return !!(speakers[0]?.events?.subdomain || event?.subdomain);
  };

  return (
    <>
      <div className="w-full lg:w-80 space-y-6">
        {/* Quick Actions */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleAddExistingSpeaker}
            >
              <Users className="h-4 w-4 mr-2" />
              Add Existing Speaker
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleAddNewSpeaker}
            >
              <Users className="h-4 w-4 mr-2" />
              Add New Speaker
            </Button>
          </CardContent>
        </Card>

        {/* Public URL */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Public Event Page</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label htmlFor="public-url">Shareable URL</Label>
              <div className="flex gap-2">
                <Input
                  id="public-url"
                  value={getPublicUrl()}
                  readOnly
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleCopyUrl(getPublicUrl(), "URL")}
                  disabled={!hasEventSubdomain()}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full"
                onClick={handlePreviewPublicPage}
                disabled={!hasEventSubdomain()}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview Public Page
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Speakers & Microsites */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Speakers & Microsites</CardTitle>
            <CardDescription className="text-xs">
              Each speaker gets their own lead generation microsite
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {speakers && speakers.length > 0 ? (
                speakers.map((micrositeData, index) => (
                  <SpeakerManagementCard
                    key={micrositeData.id}
                    speaker={{
                      id: micrositeData.speakers.id,
                      full_name: micrositeData.speakers.full_name,
                      email: micrositeData.speakers.email,
                      company: micrositeData.speakers.company,
                      job_title: micrositeData.speakers.job_title,
                      bio: micrositeData.speakers.bio,
                      linkedin_url: micrositeData.speakers.linkedin_url,
                      headshot_url: micrositeData.speakers.headshot_url,
                      slug: micrositeData.speakers.slug,
                      created_at: micrositeData.speakers.created_at
                    }}
                    onEdit={handleEditSpeaker}
                    onAdvanced={handleAdvancedSpeaker}
                    onDelete={handleDeleteSpeaker}
                    onRemove={handleRemoveSpeaker}
                    onViewMicrosite={handleViewMicrosite}
                    compact={true}
                  />
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No speakers assigned to this session.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Speaker Management Modals (moved from SessionDetail.tsx) */}
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
    </>
  );
}; 