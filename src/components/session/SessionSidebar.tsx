import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Copy, ExternalLink } from 'lucide-react';
import SpeakerManagementCard from "@/components/ui/SpeakerManagementCard";

interface SessionSidebarProps {
  speakers: any[];
  event: any;
  onAddExistingSpeaker: () => void;
  onAddNewSpeaker: () => void;
  onEditSpeaker: (speaker: any) => void;
  onAdvancedSpeaker: (speaker: any) => void;
  onDeleteSpeaker: (speaker: any) => void;
  onRemoveSpeaker: (speaker: any) => void;
  onViewMicrosite: (speaker: any) => void;
  onCopyUrl: (url: string, type: string) => void;
  onPreviewPublicPage: () => void;
}

export const SessionSidebar = ({
  speakers,
  event,
  onAddExistingSpeaker,
  onAddNewSpeaker,
  onEditSpeaker,
  onAdvancedSpeaker,
  onDeleteSpeaker,
  onRemoveSpeaker,
  onViewMicrosite,
  onCopyUrl,
  onPreviewPublicPage
}: SessionSidebarProps) => {
  const getPublicUrl = () => {
    const eventSubdomain = speakers[0]?.events?.subdomain || event?.subdomain;
    return eventSubdomain 
      ? `${window.location.origin}/event/${eventSubdomain}`
      : 'Event page URL will be available once event is configured.';
  };

  const hasEventSubdomain = () => {
    return !!(speakers[0]?.events?.subdomain || event?.subdomain);
  };

  return (
    <div className="w-full lg:w-80 space-y-6">
      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onAddExistingSpeaker}
          >
            <Users className="h-4 w-4 mr-2" />
            Add Existing Speaker
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onAddNewSpeaker}
          >
            <Users className="h-4 w-4 mr-2" />
            Add New Speaker
          </Button>
        </CardContent>
      </Card>

      {/* Public URL */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Public Event Page</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label htmlFor="public-url">Shareable URL</Label>
            <div className="flex gap-2">
              <Input
                id="public-url"
                value={getPublicUrl()}
                readOnly
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onCopyUrl(getPublicUrl(), "URL")}
                disabled={!hasEventSubdomain()}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full"
              onClick={onPreviewPublicPage}
              disabled={!hasEventSubdomain()}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview Public Page
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Speakers & Microsites */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Speakers & Microsites</CardTitle>
          <CardDescription className="text-xs">
            Each speaker gets their own lead generation microsite
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {speakers && speakers.length > 0 ? (
              speakers.map((micrositeData, index) => (
                <SpeakerManagementCard
                  key={micrositeData.id}
                  speaker={{
                    id: micrositeData.speakers.id,
                    full_name: micrositeData.speakers.full_name,
                    email: micrositeData.speakers.email,
                    company: micrositeData.speakers.company,
                    job_title: micrositeData.speakers.job_title,
                    bio: micrositeData.speakers.bio,
                    linkedin_url: micrositeData.speakers.linkedin_url,
                    headshot_url: micrositeData.speakers.headshot_url,
                    slug: micrositeData.speakers.slug,
                    created_at: micrositeData.speakers.created_at
                  }}
                  onEdit={onEditSpeaker}
                  onAdvanced={onAdvancedSpeaker}
                  onDelete={onDeleteSpeaker}
                  onRemove={onRemoveSpeaker}
                  onViewMicrosite={onViewMicrosite}
                  compact={true}
                />
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No speakers assigned to this session.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 