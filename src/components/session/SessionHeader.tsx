import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { SessionHeaderProps } from "@/types/session-types";

export const SessionHeader = ({ session, showPreview, onBackClick, onTogglePreview }: SessionHeaderProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={onBackClick} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Event Management
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onTogglePreview}
          className="flex items-center gap-2"
        >
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {session.session_name || session.generated_title || 'Untitled Session'}
          </h1>
          
          <div className="flex items-center gap-3">
            <Badge variant={
              session.processing_status === 'complete' ? 'default' :
              session.processing_status === 'processing' ? 'secondary' :
              session.processing_status === 'error' ? 'destructive' : 'outline'
            }>
              {session.processing_status || 'pending'}
            </Badge>
            
            {session.content_type && (
              <Badge variant="outline">
                {session.content_type}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 