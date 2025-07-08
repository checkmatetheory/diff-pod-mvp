import { useState, useEffect } from "react";
import { Plus, ExternalLink, Share2, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Event {
  id: string;
  subdomain: string;
  name: string;
  description: string;
  next_event_date: string;
  is_active: boolean;
  created_at: string;
  _analytics?: {
    total_leads: number;
    total_shares: number;
    total_views: number;
  };
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          _analytics:diffusion_analytics(
            metric_type,
            metric_value
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process analytics data
      const processedEvents = data?.map(event => {
        const analytics = event._analytics || [];
        const total_leads = analytics
          .filter((a: any) => a.metric_type === 'email_capture')
          .reduce((sum: number, a: any) => sum + a.metric_value, 0);
        const total_shares = analytics
          .filter((a: any) => a.metric_type === 'share')
          .reduce((sum: number, a: any) => sum + a.metric_value, 0);
        const total_views = analytics
          .filter((a: any) => a.metric_type === 'recap_view')
          .reduce((sum: number, a: any) => sum + a.metric_value, 0);

        return {
          ...event,
          _analytics: { total_leads, total_shares, total_views }
        };
      }) || [];

      setEvents(processedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventUrl = (subdomain: string) => {
    return `${window.location.origin}/event/${subdomain}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground">Manage your event content diffusion</p>
        </div>
        <Button onClick={() => navigate('/events/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No events yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first event to start generating viral content
              </p>
              <Button onClick={() => navigate('/events/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Event
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                    <CardDescription>{event.description}</CardDescription>
                  </div>
                  <Badge variant={event.is_active ? "default" : "secondary"}>
                    {event.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subdomain:</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {event.subdomain}
                    </code>
                  </div>
                  
                  {event.next_event_date && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Next Event:</span>
                      <span>{new Date(event.next_event_date).toLocaleDateString()}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {event._analytics?.total_leads || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Leads</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {event._analytics?.total_shares || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Shares</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {event._analytics?.total_views || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Views</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => navigate(`/events/${event.id}/manage`)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(getEventUrl(event.subdomain), '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Site
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/events/${event.id}/analytics`)}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analytics
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}