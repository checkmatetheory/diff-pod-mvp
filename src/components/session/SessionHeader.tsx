import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { SessionHeaderProps } from "@/types/session-types";

export const SessionHeader = ({ session, showPreview, onBackClick, onTogglePreview }: SessionHeaderProps) => {
  return (
    <div className="mb-8">
      {/* Back button */}
      <Button variant="ghost" onClick={onBackClick} className="mb-6 hover:bg-gray-100">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Event Management
      </Button>

      {/* Main header content */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-foreground mb-3 leading-tight">
            {session.session_name || session.generated_title || 'Untitled Session'}
          </h1>
          
          <div className="flex items-center gap-3 mb-4">
            <Badge 
              variant={
                session.processing_status === 'complete' ? 'default' :
                session.processing_status === 'processing' ? 'secondary' :
                session.processing_status === 'error' ? 'destructive' : 'outline'
              }
              className="px-3 py-1 text-sm font-medium"
            >
              {session.processing_status === 'complete' ? 'complete' :
               session.processing_status === 'processing' ? 'processing' :
               session.processing_status === 'error' ? 'error' : 'pending'}
            </Badge>
            
            {session.content_type && (
              <Badge variant="outline" className="px-3 py-1 text-sm">
                {session.content_type}
              </Badge>
            )}
          </div>

          {/* Session metadata */}
          <div className="text-sm text-muted-foreground space-y-1">
            {session.events?.name && (
              <p className="font-medium">From: {session.events.name}</p>
            )}
            {session.speaker_microsites?.name && (
              <p>Speaker: {session.speaker_microsites.name}</p>
            )}
            {session.created_at && (
              <p>Created: {new Date(session.created_at).toLocaleDateString()}</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 lg:flex-col lg:items-end">
          <Button 
            variant="outline" 
            onClick={onTogglePreview}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-gray-200"></div>
    </div>
  );
}; 