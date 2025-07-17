import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Plus, 
  ExternalLink, 
  BarChart3, 
  Settings,
  Mic,
  Play,
  Clock,
  Calendar,
  Users,
  Share2,
  Upload,
  Trash2,
  MoreVertical
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import BrandCustomization from "@/components/ui/BrandCustomization";

interface Event {
  id: string;
  name: string;
  subdomain: string;
  description: string;
  next_event_date: string;
  is_active: boolean;
  created_at: string;
  branding: {
    primary_color: string;
    secondary_color: string;
    logo_url: string | null;
    cta_text?: string;
    cta_url?: string;
  };
}

interface Session {
  id: string;
  session_name: string;
  processing_status: string;
  generated_summary: string;
  podcast_url: string;
  created_at: string;
  audio_duration: number;
  session_data: any;
}

const EventManage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [savingBranding, setSavingBranding] = useState(false);
  const [activeTab, setActiveTab] = useState("sessions");
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    totalDuration: 0,
    avgDuration: 0
  });

  const activeSpeakersCount = 0; // Placeholder - will be calculated from actual speakers

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('user_id', user.id)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Fetch sessions for this event
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);

      // Calculate stats
      const totalSessions = sessionsData?.length || 0;
      const completedSessions = sessionsData?.filter(s => s.processing_status === 'complete').length || 0;
      const totalDuration = sessionsData?.reduce((sum, s) => sum + (s.audio_duration || 0), 0) || 0;
      const avgDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;

      setStats({
        totalSessions,
        completedSessions,
        totalDuration,
        avgDuration
      });

    } catch (error) {
      console.error('Error fetching event data:', error);
      toast({
        title: "Error",
        description: "Failed to load event data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800 border-green-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'uploaded': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'complete': return 'Complete';
      case 'processing': return 'Processing...';
      case 'uploaded': return 'Uploaded';
      case 'error': return 'Error';
      default: return status;
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getEventUrl = (subdomain: string) => {
    return `${window.location.origin}/event/${subdomain}`;
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return;
    
    setDeletingSessionId(sessionId);
    try {
      // Delete the session from database
      const { error: deleteError } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id); // Additional security check

      if (deleteError) throw deleteError;

      // Remove from local state
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      // Recalculate stats
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      const totalSessions = updatedSessions.length;
      const completedSessions = updatedSessions.filter(s => s.processing_status === 'complete').length;
      const totalDuration = updatedSessions.reduce((sum, s) => sum + (s.audio_duration || 0), 0);
      const avgDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;

      setStats({
        totalSessions,
        completedSessions,
        totalDuration,
        avgDuration
      });

      toast({
        title: "Session deleted",
        description: "The content has been permanently removed.",
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleViewSession = (sessionId: string) => {
    navigate(`/session/${sessionId}`);
  };

  const handleEditSession = (sessionId: string) => {
    navigate(`/session/${sessionId}?edit=true`);
  };

  const handleBrandingUpdate = async (newBrandConfig: any) => {
    if (!event) return;
    
    setSavingBranding(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({ branding: newBrandConfig })
        .eq('id', event.id);

      if (error) throw error;

      setEvent(prev => prev ? { ...prev, branding: newBrandConfig } : null);
      
      toast({
        title: "Branding updated",
        description: "Your event branding has been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating branding:', error);
      toast({
        title: "Error",
        description: "Failed to update branding. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingBranding(false);
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <SidebarInset className="flex-1">
            <Header />
            <main className="flex-1">
              <div className="container mx-auto px-6 py-8">
                <div className="animate-pulse space-y-6">
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-32 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (!event) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <SidebarInset className="flex-1">
            <Header />
            <main className="flex-1">
              <div className="container mx-auto px-6 py-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">Event not found</h2>
                  <p className="text-muted-foreground mb-4">
                    The event you're looking for doesn't exist or you don't have access to it.
                  </p>
                  <Button onClick={() => navigate('/events')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Events
                  </Button>
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative overflow-hidden">
        {/* Subtle Sky Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/20 to-sky-50/30" />
        
        {/* Minimal Cloud Elements */}
        <div className="absolute top-20 right-1/4 w-20 h-10 bg-white/10 rounded-full blur-lg" />
        <div className="absolute bottom-1/3 left-1/6 w-28 h-14 bg-white/8 rounded-full blur-xl" />
        
        <AppSidebar />
        <SidebarInset className="flex-1 relative z-10">
          <Header />
          <main className="flex-1 px-8 py-12">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Header Section */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/events')}
                    className="backdrop-blur-sm bg-white/50 border border-white/40 hover:bg-white/70"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Events
                  </Button>
                  <div className="backdrop-blur-sm bg-white/40 p-4 rounded-xl border border-white/30 shadow-lg">
                    <h1 className="text-3xl font-bold text-gray-800">{event?.name}</h1>
                    <p className="text-gray-600">{event?.description}</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="backdrop-blur-sm bg-white/50 border border-white/40 hover:bg-white/70"
                    onClick={() => window.open(`/event/${event?.subdomain}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Live
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-blue-600/90 hover:bg-blue-700/90 backdrop-blur-sm shadow-lg border border-blue-500/20"
                    onClick={() => navigate(`/events/${eventId}/analytics`)}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                </div>
              </div>

              {/* Event Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-0 backdrop-blur-md bg-white/50 shadow-lg border border-white/30 hover:shadow-xl hover:bg-white/60 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-700 mb-1 font-medium">Total Sessions</p>
                        <p className="text-2xl font-bold text-gray-800">{sessions.length}</p>
                      </div>
                      <div className="p-3 bg-blue-100/80 backdrop-blur-sm rounded-xl">
                        <Mic className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 backdrop-blur-md bg-white/50 shadow-lg border border-white/30 hover:shadow-xl hover:bg-white/60 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-700 mb-1 font-medium">Active Speakers</p>
                        <p className="text-2xl font-bold text-gray-800">{activeSpeakersCount}</p>
                      </div>
                      <div className="p-3 bg-purple-100/80 backdrop-blur-sm rounded-xl">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 backdrop-blur-md bg-white/50 shadow-lg border border-white/30 hover:shadow-xl hover:bg-white/60 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 mb-1 font-medium">Revenue Generated</p>
                        <p className="text-2xl font-bold text-green-800">$24,500</p>
                      </div>
                      <div className="p-3 bg-green-100/80 backdrop-blur-sm rounded-xl">
                        <Share2 className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 backdrop-blur-md bg-white/50 shadow-lg border border-white/30 hover:shadow-xl hover:bg-white/60 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-700 mb-1 font-medium">Event Status</p>
                        <Badge className={`${event?.is_active ? 'bg-green-100/80 text-green-800' : 'bg-gray-100/80 text-gray-700'} backdrop-blur-sm border ${event?.is_active ? 'border-green-200/50' : 'border-gray-200/50'}`}>
                          {event?.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="p-3 bg-orange-100/80 backdrop-blur-sm rounded-xl">
                        <Calendar className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Tabs */}
              <Card className="border-0 backdrop-blur-md bg-white/50 shadow-xl border border-white/40">
                <CardContent className="p-8">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="backdrop-blur-sm bg-white/60 border border-white/40 p-1">
                      <TabsTrigger value="sessions" className="data-[state=active]:bg-white/80 data-[state=active]:backdrop-blur-sm">
                        Sessions
                      </TabsTrigger>
                      <TabsTrigger value="speakers" className="data-[state=active]:bg-white/80 data-[state=active]:backdrop-blur-sm">
                        Speakers
                      </TabsTrigger>
                      <TabsTrigger value="branding" className="data-[state=active]:bg-white/80 data-[state=active]:backdrop-blur-sm">
                        Branding
                      </TabsTrigger>
                      <TabsTrigger value="settings" className="data-[state=active]:bg-white/80 data-[state=active]:backdrop-blur-sm">
                        Settings
                      </TabsTrigger>
                    </TabsList>

                    {/* Sessions Tab */}
                    <TabsContent value="sessions" className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="backdrop-blur-sm bg-white/40 p-4 rounded-xl border border-white/30">
                          <h3 className="text-xl font-semibold text-gray-800">Session Management</h3>
                          <p className="text-gray-600">Upload and manage your conference sessions</p>
                        </div>
                        <Button 
                          onClick={() => navigate('/upload')}
                          className="bg-blue-600/90 hover:bg-blue-700/90 backdrop-blur-sm shadow-lg border border-blue-500/20"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Session
                        </Button>
                      </div>

                      {/* Sessions List */}
                      <div className="space-y-4">
                        {sessions.length === 0 ? (
                          <div className="text-center py-12">
                            <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h4 className="text-lg font-medium text-gray-700 mb-2">No Sessions Yet</h4>
                            <p className="text-gray-500 mb-4">
                              Upload your first session to get started with speaker attribution tracking.
                            </p>
                            <Button 
                              variant="outline" 
                              className="backdrop-blur-sm bg-white/50 border border-white/40 hover:bg-white/70"
                              onClick={() => navigate('/upload')}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload First Session
                            </Button>
                          </div>
                        ) : (
                          sessions.map((session) => (
                            <Card key={session.id} className="border-0 backdrop-blur-md bg-white/40 shadow-lg border border-white/30 hover:shadow-xl hover:bg-white/60 transition-all duration-300">
                              <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100/80 backdrop-blur-sm rounded-xl">
                                      <Play className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-lg text-gray-800">{session.session_name}</h4>
                                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-4 w-4" />
                                          {formatDuration(session.audio_duration)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Calendar className="h-4 w-4" />
                                          {new Date(session.created_at).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Badge className={getStatusColor(session.processing_status)}>
                                      {getStatusText(session.processing_status)}
                                    </Badge>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="backdrop-blur-sm bg-white/50 border border-white/40 hover:bg-white/70">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="backdrop-blur-md bg-white/90 border border-white/50">
                                        <DropdownMenuItem onClick={() => handleViewSession(session.id)}>
                                          View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleEditSession(session.id)}>
                                          Edit Session
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => handleDeleteSession(session.id)}
                                          className="text-red-600"
                                        >
                                          Delete Session
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </TabsContent>

                    {/* Speakers Tab Content */}
                    <TabsContent value="speakers" className="space-y-6">
                      <div className="backdrop-blur-sm bg-white/50 rounded-xl p-6 border border-white/40 shadow-lg">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-semibold text-gray-800">Speaker Management</h3>
                          <Button 
                            size="sm"
                            className="bg-blue-600/90 hover:bg-blue-700/90 backdrop-blur-sm"
                            onClick={() => navigate('/upload')}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Speaker Content
                          </Button>
                        </div>
                        
                        <div className="text-center py-12">
                          <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h4 className="text-lg font-medium text-gray-700 mb-2">No Speakers Yet</h4>
                          <p className="text-gray-500 mb-4">
                            Upload speaker content to create attribution microsites and track ROI.
                          </p>
                          <Button 
                            variant="outline" 
                            className="backdrop-blur-sm bg-white/50 border border-white/40 hover:bg-white/70"
                            onClick={() => navigate('/upload')}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload First Speaker
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Branding Tab Content */}
                    <TabsContent value="branding" className="space-y-6">
                      <div className="backdrop-blur-sm bg-white/50 rounded-xl p-6 border border-white/40 shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6">Event Branding</h3>
                        <BrandCustomization
                          value={event?.branding || {
                            primary_color: "#5B9BD5",
                            secondary_color: "#4A8BC2", 
                            logo_url: null
                          }}
                          onChange={handleBrandingUpdate}
                          showCTA={true}
                          className="backdrop-blur-sm bg-white/30"
                        />
                      </div>
                    </TabsContent>

                    {/* Settings Tab Content */}
                    <TabsContent value="settings" className="space-y-6">
                      <div className="backdrop-blur-sm bg-white/50 rounded-xl p-6 border border-white/40 shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6">Event Settings</h3>
                        <div className="space-y-4">
                          <div className="p-4 bg-white/30 rounded-lg border border-white/20">
                            <h4 className="font-medium text-gray-700 mb-2">Event Status</h4>
                            <Badge variant={event?.is_active ? "default" : "secondary"}>
                              {event?.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="p-4 bg-white/30 rounded-lg border border-white/20">
                            <h4 className="font-medium text-gray-700 mb-2">Public URL</h4>
                            <p className="text-sm text-gray-600">
                              http://localhost:8082/event/{event?.subdomain}
                            </p>
                          </div>
                          <div className="p-4 bg-white/30 rounded-lg border border-white/20">
                            <h4 className="font-medium text-gray-700 mb-2">Event ID</h4>
                            <p className="text-sm text-gray-600 font-mono">
                              {event?.id}
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                  </Tabs>
                </CardContent>
              </Card>

            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default EventManage; 