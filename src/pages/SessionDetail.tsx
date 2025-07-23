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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  X,
  Play,
  Pause,
  Calendar,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  Edit3,
  Globe,
  Users
} from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { AudioPlayer } from "@/components/ui/audio-player";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import SpeakerManagementCard from "@/components/ui/SpeakerManagementCard";
import QuickEditSpeakerModal from "@/components/ui/QuickEditSpeakerModal";
import AdvancedSpeakerModal from "@/components/ui/AdvancedSpeakerModal";
import AddSpeakerModal from "@/components/ui/AddSpeakerModal";
import SelectExistingSpeakerModal from "@/components/ui/SelectExistingSpeakerModal";

// Mock data for preview
const mockViralClips = [
  {
    id: '1',
    title: 'The Rise of Women\'s Sports Investment',
    duration: 75, // 1:15
    viralityScore: 88,
    reasoning: 'This video discusses a timely and relevant topic—women\'s sports investment—which is gaining traction and interest. The speaker\'s enthusiasm and optimism about the future of women\'s sports can resonate with viewers, encouraging shares and discussions. The mention of record-breaking transfer fees adds a compelling hook, while the call for investment and patience creates a sense of community and shared purpose. However, the pacing and depth of the content may limit its appeal to a broader audience, preventing a perfect score.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=600&fit=crop',
    transcript: 'and uh the good news is success begets more success and i think right now you\'re seeing this sweep you know throughout the world and and at the end of the day everyone realizes especially these athletes you know none of these women are looking for a handout they all understand that the broader business needs to justify those revenues and those salaries and so they\'ve been incredibly patient...',
    suggestedCaption: '🏆 Women\'s sports are leveling up! Ready for the future 💪🏽 #WomensSports #InvestInHer',
    suggestedHashtags: ['#WomensSports', '#InvestInHer', '#SportsInvestment', '#FutureOfSports'],
    eventName: 'Web Summit Qatar 2025',
    speakerName: 'Sarah Chen'
  },
  {
    id: '2',
    title: 'Listening to Your Inner Voice: The Journey of an Entrepreneur',
    duration: 53,
    viralityScore: 85,
    reasoning: 'This video has strong emotional resonance, as it shares a personal journey of self-discovery and entrepreneurship. The relatable theme of listening to one\'s inner voice can inspire viewers, especially those interested in personal development and business. The storytelling aspect, combined with a motivational message, enhances its shareability. However, the pacing could be slightly faster to maintain high engagement throughout the entire duration.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop',
    transcript: 'I listened to that voice inside of me that was like, you don\'t actually wanna be here. You don\'t actually wanna be doing this. You know, that was in 2004. So here we are a couple decades later, and I\'ve never heard that voice since. The only voice that I hear, and I realize how blessed I am to live this professionally. I\'ve only had a voice encouraging me to keep doing more, to be motivated...',
    suggestedCaption: '💭 What if your inner voice could lead you to success? This entrepreneur\'s journey will inspire you 🚀 #Entrepreneurship #InnerVoice',
    suggestedHashtags: ['#Entrepreneurship', '#InnerVoice', '#PersonalDevelopment', '#StartupLife'],
    eventName: 'TechConf 2025',
    speakerName: 'Alex Rivera'
  },
  {
    id: '3',
    title: 'The Evolution of Content Consumption in the Digital Age',
    duration: 180, // 3:00
    viralityScore: 92,
    reasoning: 'This clip captures a transformative insight about how digital platforms are reshaping content consumption patterns. The speaker\'s expertise and the trending nature of this topic make it highly shareable among marketing professionals and content creators. The actionable insights provided create immediate value for viewers, driving engagement and shares.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=600&fit=crop',
    transcript: 'What if your favorite athletes lived together? The reality show featuring professional athletes which most successful collaboration between traditional media and digital platforms. This represents the future of content consumption where audiences demand authentic, behind-the-scenes access to their heroes...',
    suggestedCaption: '🔮 The future of content is here! How digital platforms are changing everything we know about media consumption 📱✨ #DigitalTransformation #ContentStrategy',
    suggestedHashtags: ['#DigitalTransformation', '#ContentStrategy', '#MediaEvolution', '#FutureOfMedia'],
    eventName: 'Digital Marketing Summit 2025',
    speakerName: 'Dr. Maya Patel'
  }
];

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [speaker, setSpeaker] = useState<any>(null);
  const [speakers, setSpeakers] = useState<any[]>([]);
  
  // New state for speaker management
  const [selectedSpeakerForEdit, setSelectedSpeakerForEdit] = useState<any>(null);
  const [selectedSpeakerForAdvanced, setSelectedSpeakerForAdvanced] = useState<any>(null);
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
  const [isAddSpeakerModalOpen, setIsAddSpeakerModalOpen] = useState(false);
  const [isSelectExistingModalOpen, setIsSelectExistingModalOpen] = useState(false);
  const [allSpeakers, setAllSpeakers] = useState<any[]>([]);
  
  // New state for publish modal
  const [selectedClip, setSelectedClip] = useState<any>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin']);

  // Mock preview mode toggle
  const [showPreview, setShowPreview] = useState(true); // Set to true to show preview by default

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

  const fetchAllSpeakers = async () => {
    if (!session?.event_id || !id) return;
    
    try {
      // Step 1: Get microsite IDs for this session from junction table
      const { data: sessionLinks, error: linkError } = await (supabase as any)
        .from('speaker_microsite_sessions')
        .select('microsite_id')
        .eq('session_id', id);

      if (linkError) {
        console.error('Error fetching session links:', linkError);
        return;
      }

      if (!sessionLinks || sessionLinks.length === 0) {
        console.log('No speakers linked to this session via junction table');
        setSpeakers([]);
        return;
      }

      const micrositeIds = sessionLinks.map(link => link.microsite_id);

      // Step 2: Get microsites and speaker data for those IDs
      const { data: microsites, error: micrositeError } = await supabase
        .from('speaker_microsites')
        .select(`
          *,
          speakers (
            id, full_name, email, company, job_title, bio, headshot_url, slug
          ),
          events (
            id, name, subdomain
          )
        `)
        .in('id', micrositeIds);

      if (micrositeError) {
        console.error('Error fetching speaker microsites:', micrositeError);
        return;
      }

      console.log('Fetched speakers from junction table:', microsites);
      setSpeakers(microsites || []);
    } catch (error) {
      console.error('Error fetching speakers:', error);
    }
  };

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

  const handleSpeakerCreated = (newSpeaker: any) => {
    // Add the new speaker to the session
    // This would typically involve creating a microsite for this session
    fetchAllSpeakers(); // Refresh the speakers list
    toast({
      title: "Speaker added successfully",
      description: `${newSpeaker.full_name} has been added to this session.`,
    });
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
          // Step 2: Create new microsite for this speaker + event (without session_id)
          const { data: newMicrosite, error: micrositeError } = await supabase
            .from('speaker_microsites')
            .insert({
              speaker_id: speaker.id,
              event_id: session.event_id,
              microsite_url: speaker.slug, // This will be used to construct the full URL
              is_live: true,
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
    
    // From session_data speaker_ids (legacy)
    if (session?.session_data?.speaker_ids) {
      eventSpeakerIds.push(...session.session_data.speaker_ids);
    }
    
    // From fetched speakers (current microsites for this event)
    speakers.forEach(s => {
      if (s.speakers?.id) {
        eventSpeakerIds.push(s.speakers.id);
      }
    });
    
    return eventSpeakerIds.filter(Boolean);
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
    // Also fetch all speakers for the event
    if (session?.event_id) {
      fetchAllSpeakers();
    }
  }, [session]);

  // Auto-refresh when processing - with better performance
  useEffect(() => {
    if (!session || session.processing_status === 'complete' || session.processing_status === 'error') {
      return;
    }

    const interval = setInterval(() => {
      refreshSession();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [session?.processing_status, id]);

  // Helper functions for viral clips
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getViralityColor = (score: number) => {
    if (score >= 90) return 'bg-green-500 text-white';
    if (score >= 80) return 'bg-blue-500 text-white';
    if (score >= 70) return 'bg-yellow-500 text-black';
    return 'bg-gray-500 text-white';
  };

  const getViralityRank = (score: number) => {
    if (score >= 90) return '#1';
    if (score >= 80) return '#2';
    if (score >= 70) return '#3';
    return `#${Math.floor(score / 10)}`;
  };

  const handlePublishClip = (clip: any) => {
    setSelectedClip(clip);
    setCaption(clip.suggestedCaption);
    setIsPublishModalOpen(true);
  };

  const handleDownloadClip = (clip: any) => {
    toast({
      title: "Download started",
      description: `Downloading "${clip.title}"`,
    });
  };

  const handlePublish = () => {
    toast({
      title: "Published successfully!",
      description: `"${selectedClip?.title}" has been published to ${selectedPlatforms.join(', ')}`,
    });
    setIsPublishModalOpen(false);
  };

  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-600' },
    { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'bg-black' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-600' },
  ];

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

  const handlePublishRecap = () => {
    toast({
      title: "Published successfully",
      description: "Your session recap is now live and shareable",
    });
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
                          <div className="flex gap-2">
                            {getStatusBadge()}
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              Preview Mode
                            </Badge>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowPreview(!showPreview)}
                        >
                          {showPreview ? 'Hide Preview' : 'Show Preview'}
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>

                  {isProcessing && (
                    <Alert className="mb-6 border-blue-200 bg-blue-50">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <AlertTitle>🧠 AI is finding your most viral moments...</AlertTitle>
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
                  <Tabs defaultValue="videos" className="w-full">
                    <TabsList className="grid w-full grid-cols-6">
                      <TabsTrigger value="videos">Videos</TabsTrigger>
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                      <TabsTrigger value="blog">Blog</TabsTrigger>
                      <TabsTrigger value="social">Social</TabsTrigger>
                      <TabsTrigger value="quotes">Quotes</TabsTrigger>
                      <TabsTrigger value="transcript">Transcript</TabsTrigger>
                    </TabsList>

                    {/* UPDATED VIDEOS TAB */}
                    <TabsContent value="videos" className="mt-6">
                      <div className="space-y-6">
                        {showPreview ? (
                          <>
                            {/* Header */}
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-xl font-bold">Your Viral Clips ({mockViralClips.length})</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Generated from {session.session_name || 'your session'} • Ready to publish
                                </p>
                              </div>
                              <Button variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Download All
                              </Button>
                            </div>

                            {/* Clips Grid */}
                            <div className="space-y-6">
                              {mockViralClips.map((clip, index) => (
                                <div key={clip.id} className="flex gap-6 p-6 border rounded-lg hover:shadow-md transition-shadow bg-white">
                                  {/* Video Thumbnail */}
                                  <div className="relative flex-shrink-0">
                                    <div className="w-48 h-72 bg-black rounded-lg overflow-hidden relative cursor-pointer"
                                         onClick={() => handlePublishClip(clip)}>
                                      <img 
                                        src={clip.thumbnail} 
                                        alt={clip.title}
                                        className="w-full h-full object-cover"
                                      />
                                      
                                      {/* Play Button Overlay */}
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                                        <div className="bg-white/20 rounded-full p-3">
                                          <Play className="h-8 w-8 text-white" />
                                        </div>
                                      </div>

                                      {/* Duration Badge */}
                                      <div className="absolute bottom-3 right-3">
                                        <Badge variant="secondary" className="bg-black/70 text-white">
                                          <Clock className="h-3 w-3 mr-1" />
                                          {formatDuration(clip.duration)}
                                        </Badge>
                                      </div>

                                      {/* Virality Score Badge */}
                                      <div className="absolute top-3 left-3">
                                        <Badge className={getViralityColor(clip.viralityScore)}>
                                          {getViralityRank(clip.viralityScore)} Virality score ({clip.viralityScore}/100)
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 flex flex-col">
                                    <div className="flex-1">
                                      {/* Title and Event */}
                                      <h3 className="text-xl font-bold mb-2 leading-tight">{clip.title}</h3>
                                      <p className="text-sm text-muted-foreground mb-4">
                                        Generated from <span className="font-medium">{clip.eventName}</span>
                                      </p>

                                      {/* Virality Reasoning */}
                                      <div className="mb-6">
                                        <p className="text-sm leading-relaxed text-gray-700">
                                          {clip.reasoning}
                                        </p>
                                      </div>

                                      {/* Transcript Preview */}
                                      <div className="mb-6">
                                        <h4 className="font-medium text-sm mb-2">Transcript</h4>
                                        <p className="text-sm text-gray-600 line-clamp-3">
                                          {clip.transcript}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                      <Button 
                                        className="flex-1 bg-black hover:bg-gray-800 text-white"
                                        onClick={() => handlePublishClip(clip)}
                                      >
                                        <Share2 className="h-4 w-4 mr-2" />
                                        Publish
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        onClick={() => handleDownloadClip(clip)}
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
                            <div className="text-center space-y-3">
                              <Video className="h-12 w-12 mx-auto opacity-50" />
                              <p>No video content uploaded yet.</p>
                              <p className="text-sm">Video content will appear here once uploaded and processed.</p>
                              <Button 
                                variant="outline" 
                                onClick={() => setShowPreview(true)}
                                className="mt-4"
                              >
                                Show Preview Mode
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

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
                        {/* Show speakers from fetched microsites (PRIORITY: always show these first) */}
                        {speakers.length > 0 ? (
                          speakers.map((micrositeData, index) => (
                            <SpeakerManagementCard
                              key={micrositeData.speakers?.id || index}
                              speaker={{
                                id: micrositeData.speakers?.id || `unknown-${index}`,
                                full_name: micrositeData.speakers?.full_name || 'Unknown Speaker',
                                email: micrositeData.speakers?.email || '',
                                company: micrositeData.speakers?.company || '',
                                job_title: micrositeData.speakers?.job_title || '',
                                bio: micrositeData.speakers?.bio || '',
                                linkedin_url: micrositeData.speakers?.linkedin_url || '',
                                headshot_url: micrositeData.speakers?.headshot_url || null,
                                slug: micrositeData.speakers?.slug || '',
                                created_at: micrositeData.speakers?.created_at || ''
                              }}
                              onEdit={handleEditSpeaker}
                              onAdvanced={handleAdvancedSpeaker}
                              onDelete={handleDeleteSpeaker}
                              onRemove={handleRemoveSpeaker}
                              onViewMicrosite={handleViewMicrosite}
                              compact={true}
                            />
                          ))
                        ) : 
                        /* FALLBACK: Handle multiple speakers from new format */
                        session.session_data?.speaker_names && session.session_data.speaker_names.length > 0 ? (
                          session.session_data.speaker_names.map((speakerName: string, index: number) => {
                            const speakerId = session.session_data?.speaker_ids?.[index];
                            const speakerData = speakers.find(s => s.speakers?.id === speakerId)?.speakers;
                            
                            return (
                              <SpeakerManagementCard
                                key={index}
                                speaker={{
                                  id: speakerId || `temp-${index}`,
                                  full_name: speakerName,
                                  email: speakerData?.email || '',
                                  company: speakerData?.company || '',
                                  job_title: speakerData?.job_title || '',
                                  bio: speakerData?.bio || '',
                                  linkedin_url: speakerData?.linkedin_url || '',
                                  headshot_url: speakerData?.headshot_url || null,
                                  slug: speakerData?.slug || '',
                                  created_at: speakerData?.created_at || ''
                                }}
                                onEdit={handleEditSpeaker}
                                onAdvanced={handleAdvancedSpeaker}
                                onDelete={handleDeleteSpeaker}
                                onRemove={handleRemoveSpeaker}
                                onViewMicrosite={handleViewMicrosite}
                                compact={true}
                              />
                            );
                          })
                        ) : 
                        /* FALLBACK: Handle legacy single speaker format */
                        session.session_data?.speaker_name ? (
                          <SpeakerManagementCard
                            speaker={{
                              id: speaker?.id || 'legacy',
                              full_name: session.session_data.speaker_name,
                              email: speaker?.email || '',
                              company: speaker?.company || '',
                              job_title: speaker?.job_title || '',
                              bio: speaker?.bio || '',
                              linkedin_url: speaker?.linkedin_url || '',
                              headshot_url: speaker?.headshot_url || null,
                              slug: speaker?.slug || '',
                              created_at: speaker?.created_at || ''
                            }}
                            onEdit={handleEditSpeaker}
                            onAdvanced={handleAdvancedSpeaker}
                            onDelete={handleDeleteSpeaker}
                            onRemove={handleRemoveSpeaker}
                            onViewMicrosite={handleViewMicrosite}
                            compact={true}
                          />
                        ) : (
                          <div className="text-sm text-muted-foreground text-center py-4">
                            No speakers assigned to this session.
                          </div>
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

              {/* PUBLISH MODAL */}
        <Dialog open={isPublishModalOpen} onOpenChange={setIsPublishModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Publish Your Video</DialogTitle>
            </DialogHeader>

            {selectedClip && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Video Preview */}
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-[9/16] max-w-sm mx-auto">
                    <img 
                      src={selectedClip.thumbnail}
                      alt={selectedClip.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Play/Pause Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="lg"
                        className="bg-black/50 hover:bg-black/70 text-white rounded-full w-16 h-16"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                      </Button>
                    </div>

                    {/* Video Info Overlay */}
                    <div className="absolute top-4 left-4 right-4">
                      <Badge className={getViralityColor(selectedClip.viralityScore)}>
                        {getViralityRank(selectedClip.viralityScore)} Virality score ({selectedClip.viralityScore}/100)
                      </Badge>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="font-bold text-lg mb-1">{selectedClip.title}</h3>
                      <p className="text-sm opacity-80">
                        {formatDuration(selectedClip.duration)} • {selectedClip.eventName}
                      </p>
                    </div>
                  </div>

                  {/* Virality Reasoning */}
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2 text-sm text-muted-foreground">
                        Why this clip has viral potential:
                      </h4>
                      <p className="text-sm leading-relaxed">{selectedClip.reasoning}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Publishing Form */}
                <div className="space-y-6">
                  {/* Platform Selection */}
                  <div>
                    <h3 className="font-semibold mb-3">Select Platforms</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {platforms.map((platform) => {
                        const Icon = platform.icon;
                        const isSelected = selectedPlatforms.includes(platform.id);
                        
                        return (
                          <Button
                            key={platform.id}
                            variant={isSelected ? "default" : "outline"}
                            className={`h-12 ${isSelected ? platform.color : ''}`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedPlatforms(prev => prev.filter(p => p !== platform.id));
                              } else {
                                setSelectedPlatforms(prev => [...prev, platform.id]);
                              }
                            }}
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
                  <div>
                    <h4 className="font-medium mb-2 text-sm">Suggested Hashtags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedClip.suggestedHashtags.map((hashtag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {hashtag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4 border-t">
                    <Button 
                      className="w-full bg-black hover:bg-gray-800 text-white"
                      onClick={handlePublish}
                      disabled={selectedPlatforms.length === 0}
                    >
                      Publish now
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => toast({ title: "Scheduled!", description: "Your video will be published at the optimal time" })}
                        disabled={selectedPlatforms.length === 0}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule
                      </Button>
                      <Button variant="outline" onClick={() => handleDownloadClip(selectedClip)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      {/* Add the modals before the closing tags */}
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