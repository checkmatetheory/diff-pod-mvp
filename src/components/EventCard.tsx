import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Upload, Eye, Settings, Share2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    date: string;
    location?: string;
    sessions: number;
    totalSessions?: number;
    status: 'upcoming' | 'live' | 'completed';
    thumbnail?: string;
    category: string;
    views?: number;
  };
  featured?: boolean;
}

export const EventCard = ({ event, featured = false }: EventCardProps) => {
  const navigate = useNavigate();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-500 text-white animate-pulse';
      case 'completed': return 'bg-green-500 text-white';
      case 'upcoming': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live': return 'Live Now';
      case 'completed': return 'Completed';
      case 'upcoming': return 'Upcoming';
      default: return status;
    }
  };

  if (featured) {
    return (
      <Card className="overflow-hidden shadow-glow hover-lift animate-fade-in group">
        <div className="relative h-64 bg-gradient-to-br from-primary/20 to-accent/20">
          {event.thumbnail ? (
            <img 
              src={event.thumbnail} 
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <img 
              src="/diff media hero.png" 
              alt="Diffused Media"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute top-4 left-4">
            <Badge className={getStatusColor(event.status)}>
              {getStatusText(event.status)}
            </Badge>
          </div>
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
              {event.category}
            </Badge>
          </div>
        </div>
        
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
            {event.title}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {event.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(event.date).toLocaleDateString()}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{event.sessions} sessions</span>
            </div>
            {event.views && (
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{event.views.toLocaleString()} views</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="gradient" 
              className="flex-1 bg-primary hover:bg-primary/90 text-white border-0"
              onClick={() => navigate('/upload')}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Session
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-card hover-lift animate-slide-up group">
      <div className="relative h-48">
        {event.thumbnail ? (
          <img 
            src={event.thumbnail} 
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <img 
            src="/diff media hero.png" 
            alt="Diffused Media"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        <div className="absolute top-3 right-3">
          <Badge className={getStatusColor(event.status)}>
            {getStatusText(event.status)}
          </Badge>
        </div>
        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="bg-black/50 text-white border-white/20">
            {event.category}
          </Badge>
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
          {event.title}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {event.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(event.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{event.sessions} sessions</span>
          </div>
          {event.views && (
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{event.views.toLocaleString()}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="gradient" 
            className="flex-1 bg-primary hover:bg-primary/90 text-white border-0"
            onClick={() => navigate('/upload')}
          >
            <Upload className="h-3 w-3 mr-2" />
            Upload
          </Button>
          <Button variant="outline" size="icon-sm">
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};