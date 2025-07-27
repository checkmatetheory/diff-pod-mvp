import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Loader2 } from 'lucide-react';

interface SessionHeaderProps {
  session: any;
  showPreview: boolean;
  onBackClick: () => void;
  onTogglePreview: () => void;
}

export const SessionHeader = ({ session, showPreview, onBackClick, onTogglePreview }: SessionHeaderProps) => {
  const getStatusBadge = () => {
    switch (session.processing_status) {
      case 'processing':
      case 'uploaded':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing...
          </Badge>
        );
      case 'complete':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Complete
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {session.processing_status}
          </Badge>
        );
    }
  };

  return (
    <>
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          onClick={onBackClick}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {session?.event_id ? 'Back to Event Management' : 'Back to Dashboard'}
        </Button>
      </div>

      {/* Session Info Card */}
      <Card className="shadow-card mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">{session.session_name || session.generated_title || 'Session'}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {session.audio_duration ? `${Math.floor(session.audio_duration / 60)} min` : 'N/A'}
                </div>
                <span>{session.created_at ? new Date(session.created_at).toLocaleDateString() : ''}</span>
              </div>
              <div className="flex gap-2">
                {getStatusBadge()}
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Preview Mode
                </Badge>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onTogglePreview}
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          </div>
        </CardHeader>
      </Card>
    </>
  );
}; 