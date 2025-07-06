import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, Play, Share2, Download, Headphones, Building2, Users, DollarSign, Mic, Volume2, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { EventCard } from "@/components/EventCard";
import { SessionCard } from "@/components/SessionCard";
import { toast } from "@/hooks/use-toast";

const sampleEvents = [
  {
    id: "1",
    title: "TechCrunch Disrupt 2024",
    description: "The premier startup conference featuring the latest innovations in technology and entrepreneurship.",
    date: "2024-10-15",
    location: "San Francisco, CA",
    sessions: 24,
    status: "completed" as const,
    thumbnail: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=225&fit=crop",
    category: "Technology",
    views: 15420
  },
  {
    id: "2", 
    title: "Web Summit 2024",
    description: "Europe's largest tech conference bringing together global leaders in innovation.",
    date: "2024-11-11",
    location: "Lisbon, Portugal",
    sessions: 18,
    status: "upcoming" as const,
    thumbnail: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=225&fit=crop",
    category: "Technology",
    views: 12800
  },
  {
    id: "3",
    title: "SaaStr Annual 2024",
    description: "The world's largest community of SaaS executives, founders, and entrepreneurs.",
    date: "2024-09-10",
    location: "San Francisco, CA",
    sessions: 21,
    status: "live" as const,
    thumbnail: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=400&h=225&fit=crop",
    category: "SaaS",
    views: 9650
  }
];

const recentSessions = [
  {
    id: "1",
    title: "AI in Healthcare - Expert Panel Discussion",
    speakers: ["Dr. Sarah Chen", "Marcus Rodriguez"],
    duration: "42:18",
    uploadDate: "2024-01-15",
    status: "complete" as const,
    thumbnail: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=225&fit=crop",
    views: 8500,
    downloads: 1200,
    revenue: 1250,
    category: "Healthcare"
  },
  {
    id: "2",
    title: "Crypto Market Trends - Q4 Analysis",
    speakers: ["Alexandra Kim", "David Thompson", "Lisa Park"],
    duration: "38:45",
    uploadDate: "2024-01-14",
    status: "complete" as const,
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop",
    views: 12400,
    downloads: 890,
    revenue: 980,
    category: "Finance"
  },
  {
    id: "3",
    title: "Tech Startup Funding Landscape",
    speakers: ["James Wilson", "Emma Chang"],
    duration: "35:12",
    uploadDate: "2024-01-13",
    status: "generating" as const,
    progress: 65,
    category: "Startup"
  }
];

export default function Events() {
  const [events] = useState(sampleEvents);
  const [sessions] = useState(recentSessions);
  const featuredEvent = events[0];

  const handleSettingsClick = () => {
    toast({
      title: "Settings coming soon!",
      description: "Event settings and management features are being developed.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
          <div className="space-y-3">
            <h1 className="text-5xl font-bold text-gradient-primary animate-fade-in">
              Conference Events
            </h1>
            <p className="text-xl text-muted-foreground animate-slide-up">
              Manage conferences, upload sessions, and generate AI-powered podcasts
            </p>
          </div>
          <div className="flex gap-4 flex-wrap animate-fade-in">
            <Link to="/events/new">
              <Button variant="gradient" size="lg">
                <Plus className="h-5 w-5 mr-2" />
                New Event
              </Button>
            </Link>
            <Button variant="outline" size="lg" onClick={handleSettingsClick}>
              <Settings className="h-5 w-5 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="shadow-glow hover-lift animate-scale-in">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">{events.length}</div>
                  <p className="text-sm text-muted-foreground font-medium">Active Events</p>
                </div>
                <Calendar className="h-10 w-10 text-primary opacity-70" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-glow hover-lift animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-accent mb-2">
                    {events.reduce((sum, e) => sum + e.sessions, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Total Sessions</p>
                </div>
                <Mic className="h-10 w-10 text-accent opacity-70" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-glow hover-lift animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {events.reduce((sum, e) => sum + (e.views || 0), 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Total Views</p>
                </div>
                <Play className="h-10 w-10 text-primary opacity-70" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-glow hover-lift animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-accent mb-2">
                    {sessions.filter(s => s.status === 'complete').length}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Ready Sessions</p>
                </div>
                <Headphones className="h-10 w-10 text-accent opacity-70" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Event */}
        {featuredEvent && (
          <div className="space-y-6 mb-16">
            <h2 className="text-3xl font-semibold text-foreground">Featured Event</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <EventCard event={featuredEvent} featured />
              </div>
              <div className="space-y-4">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Event Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Sessions</span>
                      <span className="font-semibold">{featuredEvent.sessions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Views</span>
                      <span className="font-semibold">{featuredEvent.views?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="secondary">{featuredEvent.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* All Events Grid */}
        <div className="space-y-8 mb-16">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-semibold text-foreground">All Events</h2>
            <Button variant="outline" onClick={handleSettingsClick}>
              <Settings className="h-4 w-4 mr-2" />
              Manage All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {events.slice(1).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold text-foreground">Recent Sessions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>

        {/* Empty State */}
        {events.length === 0 && (
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-muted flex items-center justify-center">
              <Calendar className="h-16 w-16 text-muted-foreground" />
            </div>
            <h3 className="text-3xl font-semibold mb-4">Create Your First Event</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
              Set up a conference event to start uploading sessions and generating AI-powered podcasts
            </p>
            <Link to="/events/new">
              <Button variant="gradient" size="lg">
                <Plus className="h-6 w-6 mr-3" />
                Create Event
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}