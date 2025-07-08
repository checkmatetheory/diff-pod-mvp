import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Share2, 
  Mail, 
  Users, 
  Calendar,
  ExternalLink,
  Download,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AudioPlayer } from "@/components/ui/audio-player";
import { toast } from "sonner";

interface Event {
  id: string;
  subdomain: string;
  name: string;
  description: string;
  next_event_date: string;
  next_event_registration_url: string;
  branding: any;
}

interface Session {
  id: string;
  session_name: string;
  description: string;
  generated_summary: string;
  podcast_url: string;
  speaker_names: string[];
  created_at: string;
  _content?: {
    content_type: string;
    content_data: any;
  }[];
}

export default function PublicEvent() {
  const { subdomain } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  useEffect(() => {
    if (subdomain) {
      fetchEventData();
      trackView();
    }
  }, [subdomain]);

  const trackView = async () => {
    try {
      const { data: eventData } = await supabase
        .from('events')
        .select('id')
        .eq('subdomain', subdomain)
        .single();

      if (eventData) {
        await supabase
          .from('diffusion_analytics')
          .insert({
            event_id: eventData.id,
            metric_type: 'recap_view',
            metric_value: 1,
          });
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const fetchEventData = async () => {
    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('is_active', true)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Fetch sessions with content
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('user_sessions')
        .select(`
          *,
          _content:content(*)
        `)
        .eq('event_id', eventData.id)
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);
    } catch (error) {
      console.error('Error fetching event data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !event) return;

    try {
      // Check if lead already exists
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('email', email)
        .eq('event_id', event.id)
        .single();

      if (!existingLead) {
        // Create new lead
        await supabase
          .from('leads')
          .insert({
            email,
            event_id: event.id,
            source: 'recap_page',
            attended_status: 'non_attendee',
          });

        // Track analytics
        await supabase
          .from('diffusion_analytics')
          .insert({
            event_id: event.id,
            metric_type: 'email_capture',
            metric_value: 1,
          });
      }

      setEmailSubmitted(true);
      toast.success("Thank you! You now have full access to all content.");
    } catch (error) {
      console.error('Error submitting email:', error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleShare = async (session: Session, platform: string) => {
    try {
      // Create share record
      await supabase
        .from('shares')
        .insert({
          session_id: session.id,
          event_id: event?.id,
          platform,
          share_url: window.location.href,
          attribution_text: `Check out this recap from ${event?.name}`,
        });

      // Track analytics
      await supabase
        .from('diffusion_analytics')
        .insert({
          event_id: event?.id,
          session_id: session.id,
          metric_type: 'share',
          metric_value: 1,
        });

      // Generate share URL
      const shareText = `🎧 Just listened to "${session.session_name}" from ${event?.name}. Amazing insights!`;
      const shareUrl = window.location.href;

      let shareLink = "";
      switch (platform) {
        case "linkedin":
          shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
          break;
        case "twitter":
          shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
          break;
        case "email":
          shareLink = `mailto:?subject=${encodeURIComponent(`Check out this recap from ${event?.name}`)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
          break;
      }

      if (shareLink) {
        window.open(shareLink, '_blank');
      }

      toast.success(`Shared on ${platform}!`);
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error("Failed to share. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <p className="text-gray-600">This event page doesn't exist or is no longer active.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
              <p className="text-gray-600 mt-2">{event.description}</p>
            </div>
            {event.next_event_registration_url && (
              <Button 
                onClick={() => window.open(event.next_event_registration_url, '_blank')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Register for Next Event
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Email Gate */}
        {!emailSubmitted && (
          <Card className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardContent className="p-6">
              <div className="text-center">
                <Mail className="w-12 h-12 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Get Full Access</h2>
                <p className="mb-6 opacity-90">
                  Enter your email to unlock all session recaps and exclusive content
                </p>
                <form onSubmit={handleEmailSubmit} className="flex gap-2 max-w-md mx-auto">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 text-gray-900"
                    required
                  />
                  <Button type="submit" variant="secondary">
                    Unlock
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{session.session_name}</CardTitle>
                <CardDescription>
                  {session.speaker_names?.join(", ") || "Multiple speakers"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-3">
                  {session.generated_summary || session.description}
                </p>

                {session.podcast_url && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>2 min recap</span>
                    </div>
                    <AudioPlayer audioUrl={session.podcast_url} />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSession(session)}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Listen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare(session, "linkedin")}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {sessions.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Session recaps will appear here once they're uploaded and processed.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Session Detail Modal */}
        {selectedSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedSession.session_name}</CardTitle>
                    <CardDescription>
                      {selectedSession.speaker_names?.join(", ") || "Multiple speakers"}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSession(null)}
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedSession.podcast_url && (
                  <div>
                    <h3 className="font-semibold mb-2">Podcast Recap</h3>
                    <AudioPlayer audioUrl={selectedSession.podcast_url} />
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <p className="text-gray-600">
                    {selectedSession.generated_summary || selectedSession.description}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleShare(selectedSession, "linkedin")}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share on LinkedIn
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleShare(selectedSession, "twitter")}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share on Twitter
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleShare(selectedSession, "email")}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Share via Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 