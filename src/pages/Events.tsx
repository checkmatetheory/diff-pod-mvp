import { useState, useEffect, useRef, useMemo } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { 
  Plus, 
  ExternalLink, 
  Users, 
  DollarSign,
  TrendingUp,
  Play,
  Clock,
  Award,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useCreateEventModal } from "@/contexts/CreateEventModalContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Event {
  id: string;
  subdomain: string;
  name: string;
  description: string;
  next_event_date: string | null;
  is_active: boolean;
  status: 'planning' | 'live' | 'completed';
  revenue_attributed: number;
  tickets_sold: number;
  qualified_leads: number;
  speaker_count: number;
  pending_approvals: number;
  top_performing_speaker: string;
  conversion_rate: number;
  created_at: string;
  branding_config?: any;
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { openModal } = useCreateEventModal(); // Remove isOpen completely
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  // Listen for custom event when events are actually created
  useEffect(() => {
    const handleEventCreated = () => {
      if (user) {
        fetchEvents();
      }
    };

    window.addEventListener('eventCreated', handleEventCreated);
    
    return () => {
      window.removeEventListener('eventCreated', handleEventCreated);
    };
  }, [user]);

  const fetchEvents = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch events created by the user (using type assertion since types are outdated)
      const { data: eventsData, error } = await (supabase as any)
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }); // Newest first

      if (error) throw error;

      // Transform the data to match our interface
      const transformedEvents: Event[] = await Promise.all(
        (eventsData || []).map(async (event: any) => {
          // Get sessions count for this event
          const { data: sessions, error: sessionsError } = await (supabase as any)
            .from('user_sessions')
            .select('id, processing_status')
            .eq('event_id', event.id);

          // Get speaker microsites count for this event (using type assertion)
          const { data: speakers, error: speakersError } = await (supabase as any)
            .from('speaker_microsites')
            .select('id, approval_status')
            .eq('event_id', event.id);

          const sessionCount = sessions?.length || 0;
          const speakerCount = speakers?.length || 0;
          const pendingApprovals = speakers?.filter((s: any) => s.approval_status === 'pending').length || 0;

          // Determine status based on event data
          let status: 'planning' | 'live' | 'completed' = 'planning';
          if (event.is_active && event.next_event_date) {
            const eventDate = new Date(event.next_event_date);
            const now = new Date();
            if (eventDate > now) {
              status = 'live';
            } else {
              status = 'completed';
            }
          }

          return {
            id: event.id,
            subdomain: event.subdomain,
            name: event.name,
            description: event.description || '',
            next_event_date: event.next_event_date,
            is_active: event.is_active,
            status,
            created_at: event.created_at,
            branding_config: event.branding_config,
            // Mock data for now - these would come from attribution tracking
      revenue_attributed: 0,
      tickets_sold: 0,
      qualified_leads: 0,
            speaker_count: speakerCount,
            pending_approvals: pendingApprovals,
      top_performing_speaker: 'TBD',
      conversion_rate: 0,
          };
        })
      );

      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Optimized filtering with useMemo for performance
  const filteredEvents = useMemo(() => {
    if (!searchTerm) return events;
    const searchLower = searchTerm.toLowerCase();
    return events.filter(event => 
      event.name.toLowerCase().includes(searchLower) ||
      event.description.toLowerCase().includes(searchLower) ||
      event.status.toLowerCase().includes(searchLower) ||
      event.top_performing_speaker.toLowerCase().includes(searchLower)
    );
  }, [events, searchTerm]);

  const totalRevenue = events.reduce((sum, event) => sum + event.revenue_attributed, 0);
  const totalTickets = events.reduce((sum, event) => sum + event.tickets_sold, 0);
  const liveEvents = events.filter(e => e.status === 'live').length;

  if (loading) {
    return (
      <>
      <SidebarProvider>
        <div className="min-h-screen flex w-full relative overflow-hidden">
          {/* Sky Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100" />
          
          {/* Floating Cloud Elements */}
          <div className="absolute top-10 right-20 w-32 h-20 bg-white/30 rounded-full blur-xl" />
          <div className="absolute top-32 left-1/4 w-24 h-16 bg-white/20 rounded-full blur-lg" />
          <div className="absolute bottom-40 right-1/3 w-40 h-24 bg-white/25 rounded-full blur-xl" />
          
          <AppSidebar onCreateEvent={openModal} />
          <SidebarInset className="flex-1 relative z-10">
            <Header />
            <main className="flex-1 p-8">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-white/40 backdrop-blur-sm rounded-lg w-1/3"></div>
                <div className="grid grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-white/40 backdrop-blur-sm rounded-xl"></div>
                  ))}
                </div>
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-48 bg-white/40 backdrop-blur-sm rounded-xl"></div>
                  ))}
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
      </>
    );
  }

  return (
    <>
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative overflow-hidden">
        {/* Sky Background with Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100" />
        
        {/* Floating Cloud Elements */}
        <div className="absolute top-10 right-20 w-32 h-20 bg-white/30 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-32 left-1/4 w-24 h-16 bg-white/20 rounded-full blur-lg animate-pulse delay-700" />
        <div className="absolute bottom-40 right-1/3 w-40 h-24 bg-white/25 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-10 w-20 h-12 bg-white/15 rounded-full blur-lg animate-pulse delay-500" />
        
        <AppSidebar onCreateEvent={openModal} />
        <SidebarInset className="flex-1 relative z-10">
          <Header />
          <main className="flex-1 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
              
              {/* Clean Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold mb-2 text-gray-800">Events</h1>
                  <p className="text-gray-600">
                    Turn speakers into your most effective sales channel
                  </p>
                </div>
                <Button 
                  size="lg" 
                  onClick={openModal}
                  className="bg-blue-600/90 hover:bg-blue-700/90 backdrop-blur-sm shadow-xl border border-blue-500/20 hover:shadow-2xl transition-all duration-300"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  New Event
                </Button>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-lg mb-12">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-textSecondary" />
                <Input
                  placeholder="Search events by name, description, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 py-3 text-base border-accent bg-white shadow-sm rounded-full focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Essential Metrics - Glassmorphism Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 backdrop-blur-md bg-white/40 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 mb-1 font-medium">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-800">
                          {formatCurrency(totalRevenue)}
                        </p>
                      </div>
                      <div className="p-3 bg-green-100/60 backdrop-blur-sm rounded-xl">
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 backdrop-blur-md bg-white/40 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-700 mb-1 font-medium">Tickets Sold</p>
                        <p className="text-2xl font-bold text-blue-800">
                          {totalTickets.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100/60 backdrop-blur-sm rounded-xl">
                        <TrendingUp className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 backdrop-blur-md bg-white/40 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-700 mb-1 font-medium">Live Events</p>
                        <p className="text-2xl font-bold text-purple-800">
                          {liveEvents}
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100/60 backdrop-blur-sm rounded-xl">
                        <Play className="h-8 w-8 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Events List - Glass Cards */}
              <div className="space-y-6">
                {/* Empty State - No Events */}
                {events.length === 0 && (
                  <Card className="border-0 backdrop-blur-md bg-white/40 shadow-xl border border-white/30">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="text-center max-w-md">
                        <div className="p-4 bg-gray-100/60 backdrop-blur-sm rounded-2xl inline-block mb-4">
                          <Award className="h-16 w-16 text-gray-400 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-gray-800">Ready to launch your first event?</h3>
                        <p className="text-gray-600 mb-6">
                          Create speaker microsites that turn into measurable revenue
                        </p>
                        <Button 
                          onClick={openModal} 
                          size="lg"
                          className="bg-blue-600/90 hover:bg-blue-700/90 backdrop-blur-sm shadow-xl border border-blue-500/20"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Your First Event
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Empty State - No Search Results */}
                {events.length > 0 && filteredEvents.length === 0 && (
                  <Card className="border-0 backdrop-blur-md bg-white/40 shadow-xl border border-white/30">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="text-center max-w-md">
                        <div className="p-4 bg-gray-100/60 backdrop-blur-sm rounded-2xl inline-block mb-4">
                          <Search className="h-16 w-16 text-gray-400 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-gray-800">No events found</h3>
                        <p className="text-gray-600 mb-6">
                          Try adjusting your search terms to find the events you're looking for
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Events List */}
                {filteredEvents.map((event) => (
                  <Card key={event.id} className="border-0 backdrop-blur-md bg-white/50 shadow-xl border border-white/40 hover:shadow-2xl hover:bg-sky-600/60 transition-all duration-300">
                    <CardContent className="p-8">
                      
                      {/* Event Header */}
                      <div className="flex justify-between items-start mb-8">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-semibold text-gray-800">{event.name}</h3>
                            <Badge 
                              variant={event.status === 'live' ? 'default' : 'secondary'}
                              className={
                                event.status === 'live' 
                                  ? 'bg-green-100/80 text-green-800 backdrop-blur-sm border border-green-200/50' 
                                  : event.status === 'planning'
                                  ? 'bg-blue-100/80 text-blue-700 backdrop-blur-sm border border-blue-200/50'
                                  : 'bg-gray-100/80 text-gray-700 backdrop-blur-sm border border-gray-200/50'
                              }
                            >
                              {event.status === 'live' && <Play className="w-3 h-3 mr-1" />}
                              {event.status === 'planning' && <Clock className="w-3 h-3 mr-1" />}
                              {event.status}
                            </Badge>
                            {event.pending_approvals > 0 && (
                              <Badge className="bg-orange-100/80 text-orange-700 backdrop-blur-sm border border-orange-200/50">
                                {event.pending_approvals} pending
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600">{event.description}</p>
                        </div>
                        
                        <div className="flex gap-3">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => navigate(`/events/${event.id}/manage`)}
                            className="bg-blue-600/90 hover:bg-blue-700/90 backdrop-blur-sm shadow-lg border border-blue-500/20"
                          >
                            Manage
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/event/${event.subdomain}`, '_blank')}
                            className="backdrop-blur-sm bg-white/50 border border-white/40 hover:bg-white/70 shadow-lg"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Key Metrics - Glass Style */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-4 backdrop-blur-sm bg-white/40 rounded-xl border border-white/30 shadow-lg">
                          <p className="text-lg font-bold text-gray-800">
                            {formatCurrency(event.revenue_attributed)}
                          </p>
                          <p className="text-sm text-gray-600">Revenue</p>
                        </div>
                        <div className="text-center p-4 backdrop-blur-sm bg-white/40 rounded-xl border border-white/30 shadow-lg">
                          <p className="text-lg font-bold text-gray-800">
                            {event.tickets_sold.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">Tickets</p>
                        </div>
                        <div className="text-center p-4 backdrop-blur-sm bg-white/40 rounded-xl border border-white/30 shadow-lg">
                          <p className="text-lg font-bold text-gray-800">
                            {event.qualified_leads.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">Leads</p>
                        </div>
                        <div className="text-center p-4 backdrop-blur-sm bg-white/40 rounded-xl border border-white/30 shadow-lg">
                          <p className="text-lg font-bold text-gray-800">
                            {event.conversion_rate}%
                          </p>
                          <p className="text-sm text-gray-600">CVR</p>
                        </div>
                      </div>

                      {/* Event Details - Clean */}
                      <div className="flex justify-between items-center text-sm text-gray-600 border-t border-white/30 pt-6">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {event.speaker_count} speakers
                          </span>
                          <span className="flex items-center gap-1">
                            <Award className="w-4 w-4" />
                            Top: {event.top_performing_speaker}
                          </span>
                        </div>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {event.next_event_date 
                            ? new Date(event.next_event_date).toLocaleDateString()
                            : 'Date TBD'
                          }
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
    </>
  );
}