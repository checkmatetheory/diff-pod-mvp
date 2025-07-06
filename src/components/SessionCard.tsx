import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Share2, 
  Download, 
  Clock, 
  Users, 
  DollarSign, 
  Eye,
  FileText,
  Headphones,
  Mic
} from "lucide-react";
import { Link } from "react-router-dom";

interface SessionCardProps {
  session: {
    id: string;
    title: string;
    description?: string;
    speakers: string[];
    duration: string;
    uploadDate: string;
    status: 'complete' | 'generating' | 'processing' | 'failed';
    thumbnail?: string;
    views?: number;
    downloads?: number;
    revenue?: number;
    progress?: number;
    category?: string;
  };
  compact?: boolean;
}

export const SessionCard = ({ session, compact = false }: SessionCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800 border-green-200';
      case 'generating': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'complete': return 'Complete';
      case 'generating': return 'Generating...';
      case 'processing': return 'Processing';
      case 'failed': return 'Failed';
      default: return status;
    }
  };

  const isProcessing = session.status === 'generating' || session.status === 'processing';

  if (compact) {
    return (
      <Card className="shadow-card hover-lift group">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              {session.thumbnail ? (
                <img 
                  src={session.thumbnail} 
                  alt={session.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <Mic className="h-6 w-6 text-primary/60" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                {session.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {session.speakers.slice(0, 2).join(", ")}
                {session.speakers.length > 2 && ` +${session.speakers.length - 2} more`}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span>{session.duration}</span>
                <span>•</span>
                <span>{new Date(session.uploadDate).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(session.status)}>
                {getStatusText(session.status)}
              </Badge>
              <Link to={`/session/${session.id}`}>
                <Button variant="outline" size="sm">
                  <Play className="h-3 w-3 mr-1" />
                  View
                </Button>
              </Link>
            </div>
          </div>
          
          {isProcessing && session.progress !== undefined && (
            <div className="mt-3">
              <Progress value={session.progress} className="h-1" />
              <p className="text-xs text-muted-foreground mt-1">
                {session.progress}% complete
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-card hover-lift animate-slide-up group">
      <div className="relative h-48">
        {session.thumbnail ? (
          <img 
            src={session.thumbnail} 
            alt={session.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <Headphones className="h-16 w-16 text-primary/40" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge className={getStatusColor(session.status)}>
            {getStatusText(session.status)}
          </Badge>
        </div>
        {session.category && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className="bg-black/50 text-white border-white/20">
              {session.category}
            </Badge>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
          {session.title}
        </CardTitle>
        {session.description && (
          <CardDescription className="line-clamp-2">
            {session.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Speakers:</span> {session.speakers.join(", ")}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{session.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{session.speakers.length} speakers</span>
            </div>
            <span>{new Date(session.uploadDate).toLocaleDateString()}</span>
          </div>
        </div>

        {(session.views || session.downloads || session.revenue) && (
          <div className="flex items-center gap-4 text-sm">
            {session.views && (
              <div className="flex items-center gap-1 text-primary">
                <Eye className="h-3 w-3" />
                <span className="font-medium">{session.views.toLocaleString()}</span>
              </div>
            )}
            {session.downloads && (
              <div className="flex items-center gap-1 text-accent">
                <Download className="h-3 w-3" />
                <span className="font-medium">{session.downloads.toLocaleString()}</span>
              </div>
            )}
            {session.revenue && (
              <div className="flex items-center gap-1 text-green-600">
                <DollarSign className="h-3 w-3" />
                <span className="font-medium">${session.revenue}</span>
              </div>
            )}
          </div>
        )}

        {isProcessing && session.progress !== undefined && (
          <div className="space-y-2">
            <Progress value={session.progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {session.progress}% complete - {getStatusText(session.status)}
            </p>
          </div>
        )}
        
        <div className="flex gap-2">
          {session.status === 'complete' ? (
            <>
              <Link to={`/session/${session.id}`} className="flex-1">
                <Button variant="gradient" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  View Recap
                </Button>
              </Link>
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button variant="outline" className="flex-1" disabled>
              <Play className="h-4 w-4 mr-2" />
              {getStatusText(session.status)}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};