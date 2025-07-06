import { Calendar, Users, Clock, Play, Star, Eye } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const conferenceEvents = [
  {
    id: "1",
    title: "TechCrunch Disrupt 2024",
    description: "The premier startup conference featuring the latest innovations in technology and entrepreneurship.",
    category: "Technology",
    date: "2024-10-15",
    duration: "8h 30m",
    speakers: ["Reid Hoffman", "Sarah Guo", "Josh Kopelman"],
    sessions: 24,
    views: 15420,
    thumbnail: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=225&fit=crop",
    featured: true
  },
  {
    id: "2",
    title: "Web Summit 2024",
    description: "Europe's largest tech conference bringing together global leaders in innovation.",
    category: "Technology",
    date: "2024-11-11",
    duration: "6h 45m",
    speakers: ["Melinda Gates", "Drew Houston", "Stewart Butterfield"],
    sessions: 18,
    views: 12800,
    thumbnail: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=225&fit=crop"
  },
  {
    id: "3",
    title: "SaaStr Annual 2024",
    description: "The world's largest community of SaaS executives, founders, and entrepreneurs.",
    category: "SaaS",
    date: "2024-09-10",
    duration: "7h 15m",
    speakers: ["Jason Lemkin", "Tien Tzuo", "Ali Ghodsi"],
    sessions: 21,
    views: 9650,
    thumbnail: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=400&h=225&fit=crop"
  },
  {
    id: "4",
    title: "Collision Conference 2024",
    description: "North America's fastest-growing tech conference with startups and Fortune 500s.",
    category: "Startup",
    date: "2024-06-17",
    duration: "5h 20m",
    speakers: ["Katrina Lake", "Logan Green", "Apoorva Mehta"],
    sessions: 16,
    views: 8200,
    thumbnail: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=225&fit=crop"
  },
  {
    id: "5",
    title: "Money20/20 2024",
    description: "The leading global fintech conference connecting the entire fintech ecosystem.",
    category: "Fintech",
    date: "2024-10-27",
    duration: "6h 10m",
    speakers: ["Max Levchin", "Renaud Laplanche", "Nigel Morris"],
    sessions: 19,
    views: 7800,
    thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=225&fit=crop"
  },
  {
    id: "6",
    title: "Rise Conference 2024",
    description: "Asia's largest tech conference featuring the most promising startups and investors.",
    category: "Investment",
    date: "2024-07-15",
    duration: "4h 35m",
    speakers: ["Aileen Lee", "Hans Tung", "Jenny Lee"],
    sessions: 14,
    views: 6500,
    thumbnail: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=225&fit=crop"
  }
];

const categoryColors = {
  Technology: "hsl(var(--chart-1))",
  SaaS: "hsl(var(--chart-2))",
  Startup: "hsl(var(--chart-3))",
  Fintech: "hsl(var(--chart-4))",
  Investment: "hsl(var(--chart-5))"
};

export default function Conferences() {
  const featuredEvent = conferenceEvents.find(event => event.featured);
  const regularEvents = conferenceEvents.filter(event => !event.featured);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Header />
          
          <main className="flex-1 p-6 space-y-8">
            {/* Hero Section - Featured Conference */}
            {featuredEvent && (
              <section className="relative">
                <div className="relative h-[400px] rounded-2xl overflow-hidden bg-gradient-to-r from-primary/20 to-accent/20">
                  <div className="absolute inset-0 bg-black/50" />
                  <img 
                    src={featuredEvent.thumbnail} 
                    alt={featuredEvent.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-end p-8">
                    <div className="text-white space-y-4 max-w-2xl">
                      <Badge 
                        variant="secondary" 
                        className="mb-2"
                        style={{ backgroundColor: categoryColors[featuredEvent.category as keyof typeof categoryColors] }}
                      >
                        Featured Conference
                      </Badge>
                      <h1 className="text-4xl font-bold mb-2">{featuredEvent.title}</h1>
                      <p className="text-lg text-white/90 mb-4">{featuredEvent.description}</p>
                      <div className="flex items-center gap-6 text-sm text-white/80">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(featuredEvent.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{featuredEvent.duration}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{featuredEvent.sessions} Sessions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span>{featuredEvent.views.toLocaleString()} views</span>
                        </div>
                      </div>
                      <Button size="lg" className="mt-6">
                        <Play className="h-5 w-5 mr-2" />
                        Watch Now
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* All Conferences Grid */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">All Conferences</h2>
                <p className="text-muted-foreground">{conferenceEvents.length} conferences available</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularEvents.map((event) => (
                  <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                    <div className="relative">
                      <img 
                        src={event.thumbnail} 
                        alt={event.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge 
                          variant="secondary"
                          style={{ backgroundColor: categoryColors[event.category as keyof typeof categoryColors] }}
                        >
                          {event.category}
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <Badge variant="outline" className="bg-black/50 text-white border-white/20">
                          {event.duration}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-2">
                      <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{event.sessions} sessions</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          <span>{event.views.toLocaleString()} views</span>
                        </div>
                        <Button size="sm" className="ml-auto">
                          <Play className="h-3 w-3 mr-1" />
                          Watch
                        </Button>
                      </div>
                      
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground mb-1">Speakers:</p>
                        <div className="flex flex-wrap gap-1">
                          {event.speakers.slice(0, 2).map((speaker, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {speaker}
                            </Badge>
                          ))}
                          {event.speakers.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{event.speakers.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}