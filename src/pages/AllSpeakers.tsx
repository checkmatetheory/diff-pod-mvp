import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  TrendingUp, 
  ExternalLink, 
  Mail, 
  Linkedin, 
  Building, 
  MapPin,
  Play,
  Eye,
  Share2,
  DollarSign,
  Calendar,
  Award,
  Search,
  Filter,
  Plus,
  User
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { toast } from "sonner";
import SpeakerProfileModal from "@/components/ui/SpeakerProfileModal";
import { useCreateEventModal } from "@/contexts/CreateEventModalContext";

interface Speaker {
  id: string;
  full_name: string;
  email: string;
  company: string;
  job_title: string;
  bio: string;
  linkedin_url: string;
  headshot_url: string | null;
  slug: string;
  created_at: string;
  // Aggregated metrics
  total_sessions: number;
  total_views: number;
  total_microsites: number;
  avg_engagement: number;
  revenue_attributed: number;
  latest_session_date: string | null;
  top_performing_event: string | null;
}

interface Event {
  id: string;
  name: string;
  subdomain: string;
}

export default function AllSpeakers() {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("revenue");
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const { openModal } = useCreateEventModal();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchSpeakersAndEvents();
    }
  }, [user]);

  // Cleanup modal state when component unmounts or navigates away
  useEffect(() => {
    return () => {
      setEditingSpeakerId(null);
      setSelectedSpeaker(null);
      setModalOpen(false);
    };
  }, []);

  const fetchSpeakersAndEvents = async () => {
    try {
      setLoading(true);
      
      // Fetch speakers with microsite data using junction table
      const { data: speakersData, error: speakersError } = await (supabase as any)
        .from('speakers')
        .select(`
          id,
          full_name,
          email,
          company,
          job_title,
          bio,
          linkedin_url,
          headshot_url,
          slug,
          created_at,
          speaker_microsites (
            id,
            is_live,
            event_id,
            speaker_microsite_sessions (
              user_sessions (
                events (
                  subdomain
                )
              )
            )
          )
        `)
        .eq('created_by', user!.id)
        .order('created_at', { ascending: false });

      if (speakersError) throw speakersError;

      // Fetch user's events
      const { data: eventsData, error: eventsError } = await (supabase as any)
        .from('events')
        .select('id, name, subdomain')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Process speakers data to calculate metrics
      const processedSpeakers = speakersData?.map(speaker => {
        const microsites = speaker.speaker_microsites || [];
        const attributions = microsites.flatMap(m => m.attribution_tracking || []);
        
        return {
          ...speaker,
          total_sessions: microsites.length,
          total_views: microsites.length * 150, // Mock data - would come from real analytics
          total_microsites: microsites.length,
          avg_engagement: Math.random() * 100, // Mock data
          revenue_attributed: attributions.reduce((sum, attr) => sum + (attr.conversion_value || 0), 0),
          latest_session_date: microsites[0]?.created_at || null,
          top_performing_event: microsites[0]?.speaker_microsite_sessions?.[0]?.user_sessions?.events?.name || null
        };
      }) || [];

      setSpeakers(processedSpeakers);
      setEvents(eventsData || []);
    } catch (error) {
      console.error('Error fetching speakers:', error);
      toast.error("Failed to load speakers data");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort speakers
  const filteredSpeakers = speakers
    .filter(speaker => {
      const matchesSearch = speaker.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           speaker.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           speaker.job_title.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (selectedEvent === "all") return matchesSearch;
      
      // Filter by event would require additional logic based on speaker's events
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "revenue":
          return b.revenue_attributed - a.revenue_attributed;
        case "sessions":
          return b.total_sessions - a.total_sessions;
        case "engagement":
          return b.avg_engagement - a.avg_engagement;
        case "recent":
          return new Date(b.latest_session_date || 0).getTime() - new Date(a.latest_session_date || 0).getTime();
        default:
          return b.revenue_attributed - a.revenue_attributed;
      }
    });

  // Calculate totals
  const totalStats = speakers.reduce((acc, speaker) => ({
    totalSpeakers: acc.totalSpeakers + 1,
    totalSessions: acc.totalSessions + speaker.total_sessions,
    totalRevenue: acc.totalRevenue + speaker.revenue_attributed,
    totalViews: acc.totalViews + speaker.total_views
  }), { totalSpeakers: 0, totalSessions: 0, totalRevenue: 0, totalViews: 0 });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getMicrositeUrl = (speaker: Speaker) => {
    // Find the first live microsite for this speaker
    const liveMicrosite = (speaker as any).speaker_microsites?.find((m: any) => m.is_live);
    
    if (liveMicrosite?.speaker_microsite_sessions?.length > 0) {
      const session = liveMicrosite.speaker_microsite_sessions[0];
      const eventSubdomain = session?.user_sessions?.events?.subdomain;
      
      if (eventSubdomain && speaker.slug) {
        return `/event/${eventSubdomain}/speaker/${speaker.slug}`;
      }
    }
    
    return null;
  };

  const handleMicrositeClick = (speaker: Speaker) => {
    const micrositeUrl = getMicrositeUrl(speaker);
    if (micrositeUrl) {
      window.open(micrositeUrl, '_blank');
    }
  };

  const openSpeakerModal = (speaker: Speaker) => {
    setEditingSpeakerId(speaker.id);
    setSelectedSpeaker(speaker);
    setModalOpen(true);
  };

  const closeSpeakerModal = () => {
    setEditingSpeakerId(null);
    setSelectedSpeaker(null);
    setModalOpen(false);
  };

  const handleSpeakerUpdate = (updatedSpeaker: Speaker) => {
    setSpeakers(prev => prev.map(speaker => 
      speaker.id === updatedSpeaker.id ? { ...speaker, ...updatedSpeaker } : speaker
    ));
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <AppSidebar onCreateEvent={openModal} />
          <SidebarInset className="flex-1">
            <Header />
            <main className="flex-1 p-8">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-4">Loading speakers...</p>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <>
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar onCreateEvent={openModal} />
        <SidebarInset className="flex-1">
          <Header />
          <main className="flex-1 overflow-auto">
            {/* Subtle Sky Background */}
            <div className="min-h-full relative">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/20 to-sky-50/30" />
              
              {/* Minimal Cloud Elements */}
              <div className="absolute top-20 right-1/4 w-20 h-10 bg-white/10 rounded-full blur-lg" />
              <div className="absolute bottom-1/3 left-1/6 w-28 h-14 bg-white/8 rounded-full blur-xl" />
              
              <div className="relative z-10 p-8">
                
                {/* Header */}
                <div className="backdrop-blur-sm bg-white/40 p-6 rounded-2xl border border-white/30 shadow-lg mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-800 mb-2">All Speakers</h1>
                      <p className="text-gray-600">Manage your speaker network and track performance metrics</p>
                    </div>
                    <Button 
                      onClick={() => navigate('/upload')}
                      className="backdrop-blur-sm bg-green-500/90 hover:bg-green-600 text-white border-0"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Content
                    </Button>
                  </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <Card className="border-0 backdrop-blur-md bg-white/50 shadow-lg border border-white/30">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100/80 backdrop-blur-sm flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Total Speakers</p>
                          <p className="text-2xl font-bold text-gray-800">{totalStats.totalSpeakers}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 backdrop-blur-md bg-white/50 shadow-lg border border-white/30">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100/80 backdrop-blur-sm flex items-center justify-center">
                          <Play className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
                          <p className="text-2xl font-bold text-gray-800">{totalStats.totalSessions}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 backdrop-blur-md bg-white/50 shadow-lg border border-white/30">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100/80 backdrop-blur-sm flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Revenue Attributed</p>
                          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalStats.totalRevenue)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 backdrop-blur-md bg-white/50 shadow-lg border border-white/30">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-100/80 backdrop-blur-sm flex items-center justify-center">
                          <Eye className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Total Views</p>
                          <p className="text-2xl font-bold text-gray-800">{formatNumber(totalStats.totalViews)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Filters and Search */}
                <Card className="border-0 backdrop-blur-md bg-white/50 shadow-lg border border-white/30 mb-8">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search speakers by name, company, or role..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 backdrop-blur-sm bg-white/60 border border-white/40 focus:bg-white/80"
                        />
                      </div>
                      <div className="flex gap-4">
                        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                          <SelectTrigger className="w-48 backdrop-blur-sm bg-white/60 border border-white/40">
                            <SelectValue placeholder="Filter by event" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Events</SelectItem>
                            {events.map((event) => (
                              <SelectItem key={event.id} value={event.id}>
                                {event.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-48 backdrop-blur-sm bg-white/60 border border-white/40">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="revenue">Revenue Impact</SelectItem>
                            <SelectItem value="sessions">Session Count</SelectItem>
                            <SelectItem value="engagement">Engagement</SelectItem>
                            <SelectItem value="recent">Most Recent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Speakers Grid */}
                {filteredSpeakers.length === 0 ? (
                  <Card className="border-0 backdrop-blur-md bg-white/50 shadow-lg border border-white/30">
                    <CardContent className="p-12 text-center">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No speakers found</h3>
                      <p className="text-gray-500 mb-6">Start by uploading content for your speakers to see them here.</p>
                      <Button 
                        onClick={() => navigate('/upload')}
                        className="backdrop-blur-sm bg-green-500/90 hover:bg-green-600 text-white border-0"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Speaker Content
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSpeakers.map((speaker) => (
                      <Card key={speaker.id} className="border-0 backdrop-blur-md bg-white/50 shadow-lg border border-white/30 hover:shadow-xl hover:bg-white/60 transition-all duration-300 group cursor-pointer relative">
                        <CardContent className="p-6">
                          {/* Microsite Link Icon - Top Right */}
                          {getMicrositeUrl(speaker) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-3 right-3 h-8 w-8 p-0 backdrop-blur-sm bg-white/60 border border-white/40 hover:bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMicrositeClick(speaker);
                              }}
                              title="Visit Speaker Microsite"
                            >
                              <ExternalLink className="h-4 w-4 text-gray-600" />
                            </Button>
                          )}
                          
                          <div className="flex items-start gap-4 mb-4">
                            <Avatar className="h-16 w-16">
                              {speaker.headshot_url ? (
                                <AvatarImage src={speaker.headshot_url} alt={speaker.full_name} />
                              ) : (
                                <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                  {speaker.full_name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-800 truncate">{speaker.full_name}</h3>
                              <p className="text-sm text-gray-600 truncate">{speaker.job_title}</p>
                              <p className="text-sm text-gray-500 truncate">{speaker.company}</p>
                            </div>
                            {speaker.revenue_attributed > 0 && (
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                Top Performer
                              </Badge>
                            )}
                          </div>

                          {/* Metrics Grid */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="text-center p-3 rounded-lg bg-white/40 backdrop-blur-sm">
                              <p className="text-lg font-bold text-gray-800">{speaker.total_sessions}</p>
                              <p className="text-xs text-gray-600">Sessions</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-white/40 backdrop-blur-sm">
                              <p className="text-lg font-bold text-green-600">{formatCurrency(speaker.revenue_attributed)}</p>
                              <p className="text-xs text-gray-600">Revenue</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-white/40 backdrop-blur-sm">
                              <p className="text-lg font-bold text-gray-800">{formatNumber(speaker.total_views)}</p>
                              <p className="text-xs text-gray-600">Views</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-white/40 backdrop-blur-sm">
                              <p className="text-lg font-bold text-gray-800">{speaker.avg_engagement.toFixed(0)}%</p>
                              <p className="text-xs text-gray-600">Engagement</p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className={`flex-1 backdrop-blur-sm border border-white/40 hover:bg-white/80 active:scale-95 transition-all duration-200 ${
                                editingSpeakerId === speaker.id 
                                  ? 'bg-blue-50/80 border-blue-200 text-blue-700' 
                                  : 'bg-white/60'
                              }`}
                              onClick={() => openSpeakerModal(speaker)}
                              disabled={editingSpeakerId === speaker.id}
                            >
                              <User className="h-4 w-4 mr-2" />
                              {editingSpeakerId === speaker.id ? 'Editing...' : 'Edit Profile'}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="backdrop-blur-sm bg-white/60 border border-white/40 hover:bg-white/80"
                              onClick={() => window.open(`mailto:${speaker.email}`, '_blank')}
                              title="Send email"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            {speaker.linkedin_url && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="backdrop-blur-sm bg-white/60 border border-white/40 hover:bg-white/80"
                                onClick={() => window.open(speaker.linkedin_url, '_blank')}
                                title="View LinkedIn"
                              >
                                <Linkedin className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>

      {/* Speaker Profile Modal */}
      <SpeakerProfileModal
        speaker={selectedSpeaker}
        isOpen={modalOpen}
        onClose={closeSpeakerModal}
        onUpdate={handleSpeakerUpdate}
      />
    </SidebarProvider>


    </>
  );
} 