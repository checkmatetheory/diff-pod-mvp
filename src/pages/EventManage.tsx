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

interface Event {
  id: string;
  name: string;
  subdomain: string;
  description: string;
  next_event_date: string;
  is_active: boolean;
  created_at: string;
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
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    totalDuration: 0,
    avgDuration: 0
  });

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
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Header />
          <main className="flex-1">
            <div className="container mx-auto px-6 py-8">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/events')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Events
                </Button>
              </div>

              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold">{event.name}</h1>
                  <p className="text-muted-foreground mt-2">{event.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant={event.is_active ? "default" : "secondary"}>
                      {event.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      /{event.subdomain}
                    </span>
                    {event.next_event_date && (
                      <span className="text-sm text-muted-foreground">
                        Next: {new Date(event.next_event_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => navigate(`/upload?event=${event.id}`)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Content
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(getEventUrl(event.subdomain), '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Public Site
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/events/${event.id}/analytics`)}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                    <Mic className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalSessions}</div>
                    <p className="text-xs text-muted-foreground">
                      Content pieces uploaded
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Processed</CardTitle>
                    <Play className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.completedSessions}</div>
                    <p className="text-xs text-muted-foreground">
                      Ready for sharing
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatDuration(stats.totalDuration)}</div>
                    <p className="text-xs text-muted-foreground">
                      Audio content generated
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatDuration(Math.round(stats.avgDuration))}</div>
                    <p className="text-xs text-muted-foreground">
                      Per session recap
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Content Management */}
              <Tabs defaultValue="sessions" className="w-full">
                <TabsList>
                  <TabsTrigger value="sessions">Content ({sessions.length})</TabsTrigger>
                  <TabsTrigger value="settings">Event Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="sessions" className="mt-6">
                  {sessions.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No content yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                          Upload your first piece of content to start creating viral recaps for {event.name}
                        </p>
                        <Button 
                          onClick={() => navigate(`/upload?event=${event.id}`)}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Upload First Content
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {sessions.map((session) => (
                        <Card key={session.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg">{session.session_name}</h3>
                                  <Badge className={getStatusColor(session.processing_status)}>
                                    {getStatusText(session.processing_status)}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(session.created_at).toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {formatDuration(session.audio_duration)}
                                  </span>
                                  {session.session_data?.source_url && (
                                    <span className="flex items-center gap-1">
                                      <ExternalLink className="h-4 w-4" />
                                      YouTube
                                    </span>
                                  )}
                                </div>

                                {session.generated_summary && (
                                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                    {session.generated_summary}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/session/${session.id}`)}
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                                {session.processing_status === 'complete' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Copy share URL to clipboard
                                      const shareUrl = `${getEventUrl(event.subdomain)}`;
                                      navigator.clipboard.writeText(shareUrl);
                                      toast({
                                        title: "Link copied!",
                                        description: "Event link copied to clipboard for sharing.",
                                      });
                                    }}
                                  >
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Share
                                  </Button>
                                )}
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem 
                                          className="text-red-600 focus:text-red-600 cursor-pointer"
                                          onSelect={(e) => e.preventDefault()}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Content</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete "{session.session_name}"? This action cannot be undone and will permanently remove:
                                            <ul className="list-disc list-inside mt-2 space-y-1">
                                              <li>The session recording and transcript</li>
                                              <li>Generated AI summary and insights</li>
                                              <li>Audio podcast file</li>
                                              <li>All analytics data for this content</li>
                                            </ul>
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteSession(session.id)}
                                            disabled={deletingSessionId === session.id}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                          >
                                            {deletingSessionId === session.id ? (
                                              <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
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
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Event Settings
                      </CardTitle>
                      <CardDescription>
                        Manage your event configuration and branding
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Event Name</label>
                            <p className="text-sm text-muted-foreground">{event.name}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Subdomain</label>
                            <p className="text-sm text-muted-foreground">/{event.subdomain}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Status</label>
                            <p className="text-sm text-muted-foreground">
                              {event.is_active ? "Active" : "Inactive"}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Created</label>
                            <p className="text-sm text-muted-foreground">
                              {new Date(event.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Description</label>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Public URL</label>
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {getEventUrl(event.subdomain)}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(getEventUrl(event.subdomain), '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default EventManage; 