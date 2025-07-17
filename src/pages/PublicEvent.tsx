/**
 * PublicEvent.tsx - Event Mega-Microsite Component
 * 
 * This is the public-facing landing page for each event that serves as the central hub
 * for all event content and speaker microsites. It's designed to maximize conversions
 * and viral sharing through the speaker network.
 * 
 * Key Features:
 * - Dynamic branding based on event configuration
 * - Speaker showcase grid with direct links to microsites
 * - Attribution tracking for all interactions
 * - Email capture with lead generation
 * - Social sharing with UTM tracking
 * - Mobile-responsive design
 * - SEO optimized
 * 
 * Route: /event/:subdomain
 * 
 * @author Diffused Engineering Team
 * @version 2.0.0
 * @last-updated 2025-01-08
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar,
  Users, 
  ExternalLink,
  Mail,
  Linkedin,
  Twitter,
  Copy,
  Play,
  TrendingUp,
  Building,
  MapPin,
  Clock,
  Share2,
  ArrowRight,
  CheckCircle,
  Star
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { attribution, type UTMSource } from "@/lib/attribution";
import ConversionCelebration, { useConversionCelebrations } from "@/components/ui/ConversionCelebration";

/**
 * Event data structure with comprehensive branding configuration
 */
interface EventData {
  id: string;
  subdomain: string;
  name: string;
  description: string;
  next_event_date: string | null;
  next_event_registration_url: string | null;
  branding: {
    primary_color: string;
    secondary_color: string;
    logo_url: string | null;
    cta_text?: string;
    cta_url?: string;
  };
  is_active: boolean;
  created_at: string;
}

/**
 * Speaker microsite data with content and metrics
 */
interface SpeakerMicrosite {
  id: string;
  microsite_url: string;
  custom_cta_text: string;
  custom_cta_url: string;
  is_live: boolean;
  total_views: number;
  total_shares: number;
  published_at: string;
  speaker: {
    id: string;
    full_name: string;
    bio: string;
    headshot_url: string;
    company: string;
    job_title: string;
    slug: string;
  };
  speaker_content: {
    generated_summary: string;
    key_takeaways: string[];
    key_quotes: string[];
    highlight_reel_url: string | null;
  } | null;
}

/**
 * Event analytics and engagement metrics
 */
interface EventMetrics {
  total_views: number;
  total_shares: number;
  total_leads: number;
  speaker_count: number;
  engagement_rate: number;
}

/**
 * Loading states for better UX
 */
interface LoadingState {
  event: boolean;
  speakers: boolean;
  emailSubmission: boolean;
}

/**
 * Error handling states
 */
interface ErrorState {
  event: string | null;
  speakers: string | null;
  emailSubmission: string | null;
}

/**
 * Main PublicEvent Component
 * 
 * Renders a comprehensive event landing page with speaker microsites,
 * branding, analytics, and conversion optimization features.
 */
export default function PublicEvent(): JSX.Element {
  // ===== ROUTE PARAMETERS =====
  const { subdomain } = useParams<{ subdomain: string }>();

  // ===== STATE MANAGEMENT =====
  const [event, setEvent] = useState<EventData | null>(null);
  const [speakers, setSpeakers] = useState<SpeakerMicrosite[]>([]);
  const [metrics, setMetrics] = useState<EventMetrics>({
    total_views: 0,
    total_shares: 0,
    total_leads: 0,
    speaker_count: 0,
    engagement_rate: 0
  });
  
  // UI State
  const [email, setEmail] = useState<string>("");
  const [emailSubmitted, setEmailSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<LoadingState>({
    event: true,
    speakers: true,
    emailSubmission: false
  });
  const [errors, setErrors] = useState<ErrorState>({
    event: null,
    speakers: null,
    emailSubmission: null
  });

  // ===== CONVERSION CELEBRATIONS =====
  const { showCelebration, setShowCelebration } = useConversionCelebrations(event?.id);

  // ===== COMPUTED VALUES =====
  /**
   * Extract brand colors with fallbacks to our signature sky blue theme
   */
  const brandColors = useMemo(() => {
    if (!event?.branding) {
      return {
        primary: '#5B9BD5',
        secondary: '#4A8BC2',
        logo: null
      };
    }
    
    return {
      primary: event.branding.primary_color || '#5B9BD5',
      secondary: event.branding.secondary_color || '#4A8BC2',
      logo: event.branding.logo_url
    };
  }, [event?.branding]);

  /**
   * Generate CTA configuration with smart defaults
   */
  const ctaConfig = useMemo(() => {
    const defaultText = event?.next_event_date 
      ? `Register for ${event.name}` 
      : 'Stay Updated';
    
    return {
      text: event?.branding?.cta_text || defaultText,
      url: event?.branding?.cta_url || event?.next_event_registration_url || '#'
    };
  }, [event]);

  // ===== EFFECTS =====
  /**
   * Initialize data loading when component mounts or subdomain changes
   */
  useEffect(() => {
    if (!subdomain) {
      setErrors(prev => ({ ...prev, event: 'Invalid event URL' }));
      return;
    }

    initializeEventData();
  }, [subdomain]);

  /**
   * Track page view when event data is loaded
   */
  useEffect(() => {
    if (event?.id) {
      trackEventView();
    }
  }, [event?.id]);

  // ===== DATA FETCHING FUNCTIONS =====
  /**
   * Initialize all event data (event info, speakers, metrics)
   * Uses parallel loading for optimal performance
   */
  const initializeEventData = useCallback(async (): Promise<void> => {
    try {
      // Load event first, then speakers once we have the event ID
      const eventResult = await fetchEventData();
      
      let speakersResult: PromiseSettledResult<void> = { status: 'fulfilled', value: undefined };
      if (eventResult && eventResult.id) {
        speakersResult = await Promise.allSettled([
          fetchEventSpeakers(eventResult.id)
        ]).then(results => results[0]);
      }

              // Handle speakers loading result  
        if (speakersResult.status === 'rejected') {
          console.error('Failed to load speakers:', speakersResult.reason);
          setErrors(prev => ({ ...prev, speakers: 'Failed to load speaker data' }));
        }

        // Load metrics after we have event ID
        if (eventResult && eventResult.id) {
          await fetchEventMetrics(eventResult.id);
        }

    } catch (error) {
      console.error('Error initializing event data:', error);
      setErrors(prev => ({ 
        ...prev, 
        event: 'An unexpected error occurred while loading the event' 
      }));
    }
  }, [subdomain]);

  /**
   * Fetch event details by subdomain
   * Includes comprehensive error handling and validation
   */
  const fetchEventData = useCallback(async (): Promise<EventData | null> => {
    if (!subdomain) return null;

    setLoading(prev => ({ ...prev, event: true }));
    setErrors(prev => ({ ...prev, event: null }));

    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('is_active', true)
        .single();

      if (eventError) {
        if (eventError.code === 'PGRST116') {
          throw new Error('Event not found or not active');
        }
        throw eventError;
      }

      if (!eventData) {
        throw new Error('Event data is null');
      }

      // Validate required fields
      if (!eventData.name || !eventData.description) {
        throw new Error('Event data is incomplete');
      }

      setEvent(eventData);
      return eventData;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error fetching event data:', error);
      setErrors(prev => ({ ...prev, event: errorMessage }));
      return null;
    } finally {
      setLoading(prev => ({ ...prev, event: false }));
    }
  }, [subdomain]);

  /**
   * Fetch live speaker microsites for the event
   * Only includes approved and published microsites
   */
  const fetchEventSpeakers = useCallback(async (eventId?: string): Promise<void> => {
    const useEventId = eventId || event?.id;
    if (!useEventId) return;

    setLoading(prev => ({ ...prev, speakers: true }));
    setErrors(prev => ({ ...prev, speakers: null }));

    try {
      const { data: speakersData, error: speakersError } = await supabase
        .from('speaker_microsites')
        .select(`
          id,
          microsite_url,
          custom_cta_text,
          custom_cta_url,
          is_live,
          total_views,
          total_shares,
          published_at,
          speaker:speakers (
            id,
            full_name,
            bio,
            headshot_url,
            company,
            job_title,
            slug
          ),
          speaker_content (
            generated_summary,
            key_takeaways,
            key_quotes,
            highlight_reel_url
          )
        `)
        .eq('event_id', useEventId)
        .eq('is_live', true)
        .eq('approval_status', 'approved')
        .order('published_at', { ascending: false });

      if (speakersError) throw speakersError;

      // Filter out any invalid entries and sort by engagement
      const validSpeakers = (speakersData || [])
        .filter(speaker => speaker.speaker)
        .sort((a, b) => (b.total_views + b.total_shares) - (a.total_views + a.total_shares));

      setSpeakers(validSpeakers);

    } catch (error) {
      console.error('Error fetching speakers:', error);
      setErrors(prev => ({ 
        ...prev, 
        speakers: 'Failed to load speaker information' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, speakers: false }));
    }
  }, []);

  /**
   * Fetch event analytics and engagement metrics
   * Aggregates data from attribution tracking and legacy analytics
   */
  const fetchEventMetrics = useCallback(async (eventId: string): Promise<void> => {
    try {
      // Get attribution analytics (new system)
      const analyticsData = await attribution.getEventAttributionAnalytics(eventId);
      
      // Get legacy analytics for backwards compatibility
      const { data: legacyAnalytics } = await supabase
        .from('diffusion_analytics')
        .select('metric_type, metric_value')
        .eq('event_id', eventId);

      // Combine and process metrics
      const legacyViews = legacyAnalytics
        ?.filter(a => a.metric_type === 'recap_view')
        .reduce((sum, a) => sum + a.metric_value, 0) || 0;
      
      const legacyShares = legacyAnalytics
        ?.filter(a => a.metric_type === 'share')
        .reduce((sum, a) => sum + a.metric_value, 0) || 0;
      
      const legacyLeads = legacyAnalytics
        ?.filter(a => a.metric_type === 'email_capture')
        .reduce((sum, a) => sum + a.metric_value, 0) || 0;

      // Combine analytics data
      const totalViews = (analyticsData?.total_views || 0) + legacyViews;
      const totalShares = (analyticsData?.total_shares || 0) + legacyShares;
      const totalLeads = (analyticsData?.total_conversions || 0) + legacyLeads;
      
      setMetrics({
        total_views: totalViews,
        total_shares: totalShares,
        total_leads: totalLeads,
        speaker_count: speakers.length,
        engagement_rate: totalViews > 0 ? ((totalShares + totalLeads) / totalViews) * 100 : 0
      });

    } catch (error) {
      console.error('Error fetching event metrics:', error);
      // Don't set error state for metrics as it's not critical for UX
    }
  }, [speakers.length]);

  // ===== TRACKING FUNCTIONS =====
  /**
   * Track event page view for attribution
   */
  const trackEventView = useCallback(async (): Promise<void> => {
    if (!event?.id) return;

    try {
      await attribution.trackView(event.id);
      
      // Also track in legacy system for backwards compatibility
      await supabase
        .from('diffusion_analytics')
        .insert({
          event_id: event.id,
          metric_type: 'recap_view',
          metric_value: 1,
        });

    } catch (error) {
      console.error('Error tracking view:', error);
      // Don't throw - tracking shouldn't break UX
    }
  }, [event?.id]);

  /**
   * Track social sharing with attribution
   */
  const trackShare = useCallback(async (platform: UTMSource): Promise<void> => {
    if (!event?.id) return;

    try {
      await attribution.trackShare(event.id, platform);
      
      // Legacy tracking
      await supabase
        .from('diffusion_analytics')
        .insert({
          event_id: event.id,
          metric_type: 'share',
          metric_value: 1,
        });

    } catch (error) {
      console.error('Error tracking share:', error);
    }
  }, [event?.id]);

  // ===== INTERACTION HANDLERS =====
  /**
   * Handle email capture with comprehensive validation and tracking
   */
  const handleEmailSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!email.trim() || !event?.id) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(prev => ({ ...prev, emailSubmission: true }));
    setErrors(prev => ({ ...prev, emailSubmission: null }));

    try {
      // Check if lead already exists to prevent duplicates
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('email', email)
        .eq('event_id', event.id)
        .single();

      if (!existingLead) {
        // Create new lead
        const { error: leadError } = await supabase
          .from('leads')
          .insert({
            email: email.trim(),
            event_id: event.id,
            source: 'event_page',
            attended_status: 'non_attendee',
          });

        if (leadError) throw leadError;

        // Track conversion for attribution
        await attribution.trackConversion(
          event.id,
          'email_capture',
          50, // Default value for email captures
          undefined, // No microsite ID for event page captures
          undefined, // No speaker ID for event page captures
          email
        );

        // Legacy analytics tracking
        await supabase
          .from('diffusion_analytics')
          .insert({
            event_id: event.id,
            metric_type: 'email_capture',
            metric_value: 1,
          });
      }

      setEmailSubmitted(true);
      toast.success("Thank you! You now have access to all speaker content.");
      
      // Update metrics optimistically
      setMetrics(prev => ({
        ...prev,
        total_leads: prev.total_leads + 1
      }));

    } catch (error) {
      console.error('Error submitting email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setErrors(prev => ({ ...prev, emailSubmission: errorMessage }));
      toast.error(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, emailSubmission: false }));
    }
  }, [email, event?.id]);

  /**
   * Handle social sharing with attribution tracking
   */
  const handleShare = useCallback(async (platform: UTMSource): Promise<void> => {
    if (!event) return;

    const baseUrl = window.location.href.split('?')[0];
    const shareUrl = attribution.generateShareURL(baseUrl, {
      source: platform,
      eventId: event.id,
      medium: 'social',
      campaign: `${event.subdomain}-event-share`,
    });

    const shareText = `Check out the insights from ${event.name} - featuring industry experts sharing cutting-edge knowledge!`;

    let platformUrl = '';
    
      switch (platform) {
      case 'linkedin':
        platformUrl = `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
          break;
      case 'twitter':
        platformUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
          break;
      case 'copy':
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
        await trackShare('copy');
        return;
      default:
        return;
    }

    if (platformUrl) {
      window.open(platformUrl, '_blank', 'width=550,height=420');
      await trackShare(platform);
      toast.success(`Shared on ${platform}!`);
    }
  }, [event, trackShare]);

  /**
   * Handle CTA click with attribution tracking
   */
  const handleCTAClick = useCallback(async (): Promise<void> => {
    if (!event?.id || !ctaConfig.url || ctaConfig.url === '#') return;

    try {
      // Track CTA click for attribution
      await attribution.trackCTAClick(event.id, undefined, undefined, 100);
      
      // Open CTA URL
      window.open(ctaConfig.url, '_blank');
      
      toast.success('Redirecting to registration...');
    } catch (error) {
      console.error('Error tracking CTA click:', error);
      // Still open URL even if tracking fails
      window.open(ctaConfig.url, '_blank');
    }
  }, [event?.id, ctaConfig.url]);

  // ===== RENDER HELPERS =====
  /**
   * Render loading skeleton with proper accessibility
   */
  const renderLoadingSkeleton = (): JSX.Element => (
    <div className="min-h-screen bg-background" role="status" aria-label="Loading event content">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="animate-pulse space-y-8">
          {/* Hero skeleton */}
          <div className="text-center space-y-4">
            <div className="h-12 bg-muted rounded w-3/4 mx-auto"></div>
            <div className="h-6 bg-muted rounded w-1/2 mx-auto"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
          
          {/* Speaker grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
          </div>
          </div>
        </div>
      </div>
    );

  /**
   * Render error state with recovery options
   */
  const renderErrorState = (): JSX.Element => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md p-6">
        <h1 className="text-3xl font-bold text-foreground mb-4">Event Not Found</h1>
        <p className="text-muted-foreground mb-6">
          {errors.event || 'This event is not available or may have been moved.'}
        </p>
        <div className="space-y-2">
          <Button onClick={() => window.location.reload()} className="w-full">
            Try Again
          </Button>
          <Link to="/">
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>
        </div>
      </div>
    );

  // ===== MAIN RENDER =====
  // Show loading state
  if (loading.event || !event) {
    return renderLoadingSkeleton();
  }

  // Show error state
  if (errors.event) {
    return renderErrorState();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Conversion Celebrations */}
      <ConversionCelebration
        eventId={event.id}
        onClose={() => setShowCelebration(false)}
      />

      {/* Hero Section */}
      <section 
        className="relative py-20 px-6 text-center"
        style={{ 
          background: `linear-gradient(135deg, ${brandColors.primary}15, ${brandColors.secondary}10)` 
        }}
      >
        <div className="container mx-auto max-w-4xl">
          {/* Event branding */}
          <div className="flex justify-center mb-8">
            {brandColors.logo ? (
              <img 
                src={brandColors.logo} 
                alt={`${event.name} logo`}
                className="h-16 w-auto object-contain"
              />
            ) : (
              <div className="flex items-center gap-3">
                <img 
                  src="/diffused logo white no bg.png" 
                  alt="Diffused" 
                  className="h-12 w-auto"
                />
                <span className="text-sm text-muted-foreground">presents</span>
            </div>
            )}
          </div>

          {/* Event title and description */}
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            {event.name}
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            {event.description}
          </p>

          {/* Event metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: brandColors.primary }}>
                {metrics.speaker_count}
              </div>
              <div className="text-sm text-muted-foreground">Expert Speakers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: brandColors.primary }}>
                {metrics.total_views.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Content Views</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: brandColors.primary }}>
                {metrics.total_shares}
              </div>
              <div className="text-sm text-muted-foreground">Social Shares</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: brandColors.primary }}>
                {Math.round(metrics.engagement_rate)}%
              </div>
              <div className="text-sm text-muted-foreground">Engagement</div>
        </div>
      </div>

          {/* CTA Section */}
          <div className="space-y-4">
        {!emailSubmitted && (
              <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <Input
                    type="email"
                  placeholder="Enter your email for full access"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  className="flex-1"
                  disabled={loading.emailSubmission}
                />
                <Button 
                  type="submit" 
                  disabled={loading.emailSubmission || !email.trim()}
                  style={{ backgroundColor: brandColors.primary }}
                  className="text-white px-8"
                >
                  {loading.emailSubmission ? 'Getting Access...' : 'Get Access'}
                  </Button>
                </form>
            )}

            {emailSubmitted && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">You're all set! Explore the content below.</span>
                </div>
              </div>
            )}

            {errors.emailSubmission && (
              <p className="text-sm text-red-600 max-w-md mx-auto">{errors.emailSubmission}</p>
            )}

            {/* Primary CTA */}
            {ctaConfig.url && ctaConfig.url !== '#' && (
              <Button
                onClick={handleCTAClick}
                size="lg"
                className="text-white px-12 py-3 text-lg"
                style={{ backgroundColor: brandColors.secondary }}
              >
                {ctaConfig.text}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Social sharing */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('linkedin')}
              className="enhanced-button"
            >
              <Linkedin className="h-4 w-4 mr-2" />
              Share
            </Button>
                  <Button
                    variant="outline"
                    size="sm"
              onClick={() => handleShare('twitter')}
              className="enhanced-button"
                  >
              <Twitter className="h-4 w-4 mr-2" />
              Tweet
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
              onClick={() => handleShare('copy')}
              className="enhanced-button"
                  >
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
                  </Button>
                </div>
        </div>
      </section>

      {/* Speaker Showcase Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Featured Speakers</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Dive deep into insights from industry leaders. Each speaker has their own dedicated microsite with exclusive content.
                </p>
              </div>

          {/* Speaker Grid */}
          {loading.speakers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-64 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : errors.speakers ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">{errors.speakers}</p>
              <Button onClick={() => fetchEventSpeakers(event?.id)} variant="outline">
                Try Again
              </Button>
            </div>
          ) : speakers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Speaker content is being prepared. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {speakers.map((speaker) => (
                <Card key={speaker.id} className="enhanced-card hover:shadow-card-hover transition-all duration-300 group">
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={speaker.speaker.headshot_url || '/placeholder.svg'}
                        alt={speaker.speaker.full_name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {speaker.speaker.full_name}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {speaker.speaker.job_title}
                          {speaker.speaker.company && (
                            <>
                              <br />
                              <span className="flex items-center gap-1 mt-1">
                                <Building className="h-3 w-3" />
                                {speaker.speaker.company}
                              </span>
                            </>
                          )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {speaker.speaker_content?.generated_summary || speaker.speaker.bio || 'Content coming soon...'}
                    </p>

                    {/* Key takeaways preview */}
                    {speaker.speaker_content?.key_takeaways && speaker.speaker_content.key_takeaways.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Key Takeaways:</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {speaker.speaker_content.key_takeaways.slice(0, 2).map((takeaway, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Star className="h-3 w-3 mt-0.5 flex-shrink-0" style={{ color: brandColors.primary }} />
                              <span className="line-clamp-2">{takeaway}</span>
                            </li>
                          ))}
                        </ul>
                  </div>
                )}

                    {/* Engagement metrics */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{speaker.total_views.toLocaleString()} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Share2 className="h-3 w-3" />
                        <span>{speaker.total_shares} shares</span>
                      </div>
                </div>

                    {/* CTA to speaker microsite */}
                    <Link to={`/event/${event.subdomain}/speaker/${speaker.speaker.slug}`}>
                  <Button
                        className="w-full mt-4"
                        style={{ backgroundColor: brandColors.primary }}
                  >
                        <Play className="h-4 w-4 mr-2" />
                        View Full Content
                  </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Event Details Section */}
      {event.next_event_date && (
        <section className="py-16 px-6 bg-muted/30">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">Next Event</h2>
            <div className="bg-white rounded-2xl p-8 shadow-card">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Calendar className="h-5 w-5" style={{ color: brandColors.primary }} />
                <span className="text-lg font-medium">
                  {new Date(event.next_event_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <p className="text-muted-foreground mb-6">
                Don't miss the next {event.name} - featuring even more industry insights and networking opportunities.
              </p>
              {ctaConfig.url && ctaConfig.url !== '#' && (
                  <Button
                  onClick={handleCTAClick}
                  size="lg"
                  style={{ backgroundColor: brandColors.primary }}
                  className="text-white"
                >
                  {ctaConfig.text}
                  </Button>
              )}
                </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Powered by</span>
              <img 
                src="/diffused logo white no bg.png" 
                alt="Diffused" 
                className="h-5 w-auto"
              />
              <span>• Turn your events into viral microsites</span>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>© 2024 Diffused</span>
              <Separator orientation="vertical" className="h-4" />
              <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
              <Separator orientation="vertical" className="h-4" />
              <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
            </div>
          </div>
      </div>
      </footer>
    </div>
  );
} 