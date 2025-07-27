import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Star, MoreHorizontal, BookmarkPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  session_name: string;
  description?: string;
  category?: string;
  content_type?: string;
  duration_seconds?: number;
  tags?: string[];
  thumbnail_url?: string;
  created_at: string;
}

interface ContentRowProps {
  title: string;
  sessions: Session[];
  className?: string;
}

const ContentRow = ({ title, sessions, className }: ContentRowProps) => {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "Unknown";
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const formatCategory = (category?: string) => {
    if (!category) return "";
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Button variant="ghost" size="sm">View All</Button>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {sessions.map((session) => (
          <Card 
            key={session.id} 
            className="min-w-[300px] max-w-[300px] hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer group"
          >
            <div className="relative">
              {session.thumbnail_url ? (
                <img 
                  src={session.thumbnail_url} 
                  alt={session.session_name}
                  className="w-full h-40 object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-accent/20 rounded-t-lg flex items-center justify-center">
                  <Play className="h-8 w-8 text-primary" />
                </div>
              )}
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-t-lg flex items-center justify-center">
                <Button size="sm" variant="secondary" className="gap-2">
                  <Play className="h-4 w-4" />
                  Play
                </Button>
              </div>

              {/* Duration badge */}
              {session.duration_seconds && (
                <Badge variant="secondary" className="absolute bottom-2 right-2 gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(session.duration_seconds)}
                </Badge>
              )}
            </div>

            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm line-clamp-2 leading-tight">
                  {session.session_name}
                </CardTitle>
                <Button size="sm" variant="ghost" className="p-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <BookmarkPlus className="h-4 w-4" />
                </Button>
              </div>
              
              {session.description && (
                <CardDescription className="text-xs line-clamp-2">
                  {session.description}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="pt-0 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {session.category && (
                  <Badge variant="outline" className="text-xs px-2 py-0">
                    {formatCategory(session.category)}
                  </Badge>
                )}
              </div>

              {session.tags && session.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {session.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                      {tag}
                    </Badge>
                  ))}
                  {session.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      +{session.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {sessions.length === 0 && (
          <div className="min-w-[300px] max-w-[300px] h-60 border-2 border-dashed border-muted-foreground/20 rounded-lg flex flex-col items-center justify-center text-muted-foreground">
            <Play className="h-8 w-8 mb-2" />
            <p className="text-sm">No sessions yet</p>
            <p className="text-xs">Upload your first session</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface ContentLayoutProps {
  sessions: Session[];
  isLoading?: boolean;
}

export const ContentLayout = ({ sessions, isLoading }: ContentLayoutProps) => {
  const navigate = useNavigate();
  const [featuredSession, setFeaturedSession] = useState<Session | null>(null);

  useEffect(() => {
    if (sessions.length > 0) {
      // Set the most recent session as featured
      const latest = sessions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      setFeaturedSession(latest);
    }
  }, [sessions]);

  if (isLoading) {
    return (
      <div className="space-y-8 p-6">
        <div className="animate-pulse">
          <div className="h-64 bg-muted rounded-lg mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-6 bg-muted rounded w-48 mb-4"></div>
                <div className="flex gap-4">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="min-w-[300px] h-60 bg-muted rounded-lg"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Group sessions by category for content rows
  const sessionsByCategory = sessions.reduce((acc, session) => {
    const category = session.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  const recentSessions = sessions
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-8 p-6">
      {/* Hero Section */}
      {featuredSession && (
        <div className="relative h-64 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg overflow-hidden">
          {featuredSession.thumbnail_url ? (
            <img 
              src={featuredSession.thumbnail_url} 
              alt={featuredSession.session_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <img 
              src="/diff media hero.png" 
              alt="Diffused Media"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6">
            <Badge className="mb-2">Featured</Badge>
            <h1 className="text-2xl font-bold text-white mb-2 line-clamp-2">
              {featuredSession.session_name}
            </h1>
            {featuredSession.description && (
              <p className="text-white/80 text-sm mb-4 line-clamp-2 max-w-2xl">
                {featuredSession.description}
              </p>
            )}
            <div className="flex gap-3">
              <Button className="gap-2">
                <Play className="h-4 w-4" />
                Play Now
              </Button>
              <Button variant="secondary" className="gap-2">
                <Star className="h-4 w-4" />
                Add to Favorites
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content Rows */}
      <div className="space-y-8">
        <ContentRow title="Recently Added" sessions={recentSessions} />
        
        {Object.entries(sessionsByCategory).map(([category, categorySessions]) => (
          <ContentRow 
            key={category}
            title={category.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')}
            sessions={categorySessions}
          />
        ))}

        {sessions.length === 0 && (
          <div className="text-center py-12">
            <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload your first conference session to get started
            </p>
            <Button onClick={() => navigate('/upload')}>Upload Session</Button>
          </div>
        )}
      </div>
    </div>
  );
};