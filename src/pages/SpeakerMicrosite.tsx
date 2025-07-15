import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Share2, 
  ExternalLink,
  Mail,
  Linkedin,
  Twitter,
  Copy,
  Eye,
  Users,
  Building,
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AudioPlayer } from "@/components/ui/audio-player";
import { toast } from "sonner";
import { attribution } from "@/lib/attribution";

interface SpeakerMicrosite {
  id: string;
  microsite_url: string;
  custom_cta_text: string;
  custom_cta_url: string;
  brand_colors: {
    primary?: string;
    accent?: string;
  };
  custom_logo_url?: string;
  is_live: boolean;
  total_views: number;
  total_shares: number;
  event: {
    id: string;
    name: string;
    subdomain: string;
    description: string;
    branding_config: any;
  };
  speaker: {
    id: string;
    full_name: string;
    email: string;
    bio: string;
    headshot_url: string;
    company: string;
    job_title: string;
    slug: string;
  };
  content: {
    generated_summary: string;
    key_quotes: string[];
    key_takeaways: string[];
    video_clips: Array<{
      url: string;
      title: string;
      duration: number;
      timestamp: number;
    }>;
    highlight_reel_url: string;
  };
}

export default function SpeakerMicrosite() {
  const { eventId, speakerId } = useParams();
  const [microsite, setMicrosite] = useState<SpeakerMicrosite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId && speakerId) {
      fetchMicrositeData();
      trackView();
    }
  }, [eventId, speakerId]);

  const fetchMicrositeData = async () => {
    try {
      // Fetch microsite data with speaker, event, and content
      const { data: micrositeData, error: micrositeError } = await supabase
        .from('speaker_microsites')
        .select(`
          *,
          event:events(*),
          speaker:speakers(*),
          content:speaker_content(*)
        `)
        .eq('event_id', eventId)
        .eq('speaker_id', speakerId)
        .eq('is_live', true)
        .single();

      if (micrositeError) throw micrositeError;
      
      if (!micrositeData) {
        setError('Speaker microsite not found or not published yet.');
        return;
      }

      setMicrosite(micrositeData);
    } catch (error) {
      console.error('Error fetching microsite:', error);
      setError('Failed to load speaker microsite.');
    } finally {
      setLoading(false);
    }
  };

  const trackView = async () => {
    try {
      if (eventId && microsite) {
        await attribution.trackView(
          eventId,
          microsite.id,
          microsite.speaker.id
        );
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const trackShare = async (platform: string) => {
    try {
      if (eventId && microsite) {
        await attribution.trackShare(
          eventId,
          platform as any,
          microsite.id,
          microsite.speaker.id
        );
      }
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  };

  const trackCTAClick = async () => {
    try {
      if (eventId && microsite) {
        await attribution.trackCTAClick(
          eventId,
          microsite.id,
          microsite.speaker.id,
          100 // Default conversion value for CTA clicks
        );

        // Update microsite view count
        await supabase
          .from('speaker_microsites')
          .update({ 
            total_views: (microsite.total_views || 0) + 1
          })
          .eq('id', microsite.id);
      }
    } catch (error) {
      console.error('Error tracking CTA click:', error);
    }
  };

  const handleShare = async (platform: string) => {
    if (!microsite || !eventId) return;

    // Generate attribution URL with referral code
    const baseUrl = window.location.href.split('?')[0]; // Remove existing query params
    const attributionUrl = attribution.generateShareURL(baseUrl, {
      source: platform as any,
      speakerId: microsite.speaker.id,
      eventId: eventId,
      medium: 'social',
      campaign: `${microsite.event.subdomain}-speaker-share`,
      generateReferralCode: true,
    });

    const text = `Check out ${microsite.speaker.full_name}'s insights from ${microsite.event.name}`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'linkedin':
        shareUrl = `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(attributionUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(attributionUrl)}`;
        break;
      case 'copy':
        await navigator.clipboard.writeText(attributionUrl);
        toast.success('Link copied to clipboard!');
        await trackShare('copy');
        return;
      default:
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=550,height=420');
      await trackShare(platform);
      toast.success(`Shared on ${platform}!`);
    }
  };

  const handleCTAClick = async () => {
    await trackCTAClick();
    if (microsite?.custom_cta_url) {
      window.open(microsite.custom_cta_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
            <div className="h-12 bg-muted rounded w-1/3"></div>
            <div className="h-6 bg-muted rounded w-1/2"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-48 bg-muted rounded"></div>
              <div className="h-48 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !microsite) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-4">Content Not Available</h1>
          <p className="text-muted-foreground mb-6">
            {error || 'This speaker microsite is not available or hasn\'t been published yet.'}
          </p>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Extract brand colors with fallbacks to our sky blue theme
  const primaryColor = microsite.brand_colors?.primary || '#5B9BD5';
  const accentColor = microsite.brand_colors?.accent || '#87CEEB';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div 
        className="border-b border-border/40"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)` 
        }}
      >
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {microsite.custom_logo_url ? (
                <img 
                  src={microsite.custom_logo_url} 
                  alt="Event Logo" 
                  className="h-8 w-auto"
                />
              ) : (
                <img 
                  src="/diffused logo deep blue no bg (1).png" 
                  alt="Diffused" 
                  className="h-8 w-auto"
                />
              )}
              <div className="text-sm text-muted-foreground">
                {microsite.event.name}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare('copy')}
                className="enhanced-button"
              >
                <Copy className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-4xl">
        {/* Speaker Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img
                src={microsite.speaker.headshot_url || '/placeholder.svg'}
                alt={microsite.speaker.full_name}
                className="w-32 h-32 rounded-full object-cover shadow-card-hover border-4 border-white"
              />
              <div 
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-button"
                style={{ backgroundColor: primaryColor }}
              >
                <Users className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-foreground mb-3">
            {microsite.speaker.full_name}
          </h1>
          
          <div className="flex items-center justify-center gap-4 mb-6 text-muted-foreground">
            {microsite.speaker.job_title && (
              <div className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                <span>{microsite.speaker.job_title}</span>
              </div>
            )}
            {microsite.speaker.company && (
              <div className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                <span>{microsite.speaker.company}</span>
              </div>
            )}
          </div>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {microsite.speaker.bio}
          </p>
        </div>

        {/* Content Section */}
        <div className="space-y-12">
          {/* Video Highlights */}
          {microsite.content?.highlight_reel_url && (
            <Card className="enhanced-card">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Play 
                    className="h-6 w-6" 
                    style={{ color: primaryColor }}
                  />
                  Session Highlights
                </h2>
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <video 
                    controls 
                    className="w-full h-full"
                    poster="/placeholder.svg"
                  >
                    <source src={microsite.content.highlight_reel_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Takeaways */}
          {microsite.content?.key_takeaways && microsite.content.key_takeaways.length > 0 && (
            <Card className="enhanced-card">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Key Takeaways</h2>
                <div className="space-y-4">
                  {microsite.content.key_takeaways.map((takeaway, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {index + 1}
                      </div>
                      <p className="text-muted-foreground leading-relaxed flex-1">
                        {takeaway}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {microsite.content?.generated_summary && (
            <Card className="enhanced-card">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Session Summary</h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    {microsite.content.generated_summary}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Quotes */}
          {microsite.content?.key_quotes && microsite.content.key_quotes.length > 0 && (
            <Card className="enhanced-card">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Notable Quotes</h2>
                <div className="grid gap-6">
                  {microsite.content.key_quotes.map((quote, index) => (
                    <blockquote 
                      key={index}
                      className="border-l-4 pl-6 py-4 italic text-lg text-muted-foreground"
                      style={{ borderLeftColor: primaryColor }}
                    >
                      "{quote}"
                    </blockquote>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card 
            className="enhanced-card"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor}10, ${accentColor}15)` 
            }}
          >
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-4">
                Want More Insights Like This?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Don't miss out on future sessions and exclusive content from industry leaders.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={handleCTAClick}
                  className="enhanced-button px-8 py-4 text-lg"
                  style={{ 
                    backgroundColor: primaryColor,
                    color: 'white'
                  }}
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  {microsite.custom_cta_text}
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleShare('linkedin')}
                    className="enhanced-button"
                  >
                    <Linkedin className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleShare('twitter')}
                    className="enhanced-button"
                  >
                    <Twitter className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleShare('copy')}
                    className="enhanced-button"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center border-t border-border/40 pt-8">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Powered by</span>
            <img 
              src="/diffused logo deep blue no bg (1).png" 
              alt="Diffused" 
              className="h-5 w-auto"
            />
            <span>• Turn your event content into microsites</span>
          </div>
        </div>
      </div>
    </div>
  );
} 