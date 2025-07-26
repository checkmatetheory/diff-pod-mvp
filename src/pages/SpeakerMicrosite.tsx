import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  MapPin,
  Calendar,
  Bell,
  Star,
  ArrowRight,
  CheckCircle,
  Gift
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
  events: {
    id: string;
    name: string;
    subdomain: string;
    description: string;
    next_event_date: string | null;
    next_event_registration_url: string | null;
    branding: any;
  };
  speakers: {
    id: string;
    full_name: string;
    email: string;
    bio: string;
    headshot_url: string;
    company: string;
    job_title: string;
    slug: string;
  };
  speaker_content: {
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
  } | null;
}

export default function SpeakerMicrosite() {
  const { eventId, speakerId, subdomain, slug } = useParams();
  const [microsite, setMicrosite] = useState<SpeakerMicrosite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  
  // Lead capture state
  const [email, setEmail] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  // Determine which URL format we're using
  const isUUIDFormat = eventId && speakerId;
  const isSlugFormat = subdomain && slug;

  useEffect(() => {
    if (isUUIDFormat || isSlugFormat) {
      fetchMicrositeData();
    }
  }, [eventId, speakerId, subdomain, slug]);

  const fetchMicrositeData = async () => {
    console.log('🔍 Fetching microsite data with params:', { eventId, speakerId, subdomain, slug });
    setLoading(true);
    
    try {
      let micrositeData, micrositeError;

      if (isUUIDFormat) {
        // Use existing UUID-based query
        console.log('Using UUID-based query');
        const result = await supabase
          .from('speaker_microsites')
          .select(`
            *,
            events(*),
            speakers(*),
            speaker_content(*)
          `)
          .eq('event_id', eventId)
          .eq('speaker_id', speakerId)
          .eq('is_live', true);
        
        micrositeData = result.data;
        micrositeError = result.error;
      } else if (isSlugFormat) {
        // Use subdomain + slug based query with joins
        console.log('Using subdomain + slug based query');
        const result = await supabase
          .from('speaker_microsites')
          .select(`
            *,
            events!inner(*),
            speakers!inner(*),
            speaker_content(*)
          `)
          .eq('events.subdomain', subdomain)
          .eq('speakers.slug', slug)
          .eq('is_live', true)
          .eq('approval_status', 'approved');
        
        micrositeData = result.data;
        micrositeError = result.error;
      } else {
        throw new Error('Invalid URL format');
      }

      console.log('Query returned:', { data: micrositeData, error: micrositeError });

      if (micrositeError) {
        console.error('❌ Supabase error:', micrositeError);
        setError(`Database error: ${micrositeError.message}`);
        return;
      }

      const micrositeResult = micrositeData?.[0] || null;

      if (!micrositeResult) {
        console.log('⚠️ No microsite data found for this ID.');
        setError('Speaker microsite not found or not published yet.');
        return;
      }
      
      console.log('✅ Microsite data loaded successfully:', micrositeResult);
      console.log('📋 Speaker content specifically:', micrositeResult?.speaker_content);
      console.log('🎯 Key takeaways RAW:', micrositeResult?.speaker_content?.key_takeaways);
      console.log('💬 Key quotes RAW:', micrositeResult?.speaker_content?.key_quotes);
      console.log('📝 Generated summary RAW:', micrositeResult?.speaker_content?.generated_summary);
      console.log('🎬 Highlight reel RAW:', micrositeResult?.speaker_content?.highlight_reel_url);
      
      // Let's also check the type of these fields
      console.log('🔍 Type analysis:');
      console.log('- key_takeaways type:', typeof micrositeResult?.speaker_content?.key_takeaways);
      console.log('- key_quotes type:', typeof micrositeResult?.speaker_content?.key_quotes);
      console.log('- generated_summary type:', typeof micrositeResult?.speaker_content?.generated_summary);
      setMicrosite(micrositeResult);
      
      if (micrositeResult) {
        await trackView(micrositeResult);
      }
    } catch (error) {
      const e = error as Error;
      console.error('💥 Unexpected error in fetchMicrositeData:', e);
      setError(`An unexpected error occurred: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const trackView = async (micrositeData: SpeakerMicrosite) => {
    try {
      // Use the actual event ID from the microsite data for tracking
      const actualEventId = micrositeData.events.id;
      if (actualEventId && micrositeData) {
        await attribution.trackView(
          actualEventId,
          micrositeData.id,
          micrositeData.speakers.id
        );
      }
    } catch (error) {
      // Silently fail attribution tracking - don't break user experience
      console.warn('Attribution tracking failed (view):', error);
    }
  };

  const trackShare = async (platform: string) => {
    try {
      // Use the actual event ID from the microsite data for tracking
      const actualEventId = microsite?.events.id;
      if (actualEventId && microsite) {
        await attribution.trackShare(
          actualEventId,
          platform as any,
          microsite.id,
          microsite.speakers.id
        );
      }
    } catch (error) {
      // Silently fail attribution tracking - don't break user experience
      console.warn('Attribution tracking failed (share):', error);
    }
  };

  const trackCTAClick = async () => {
    try {
      // Use the actual event ID from the microsite data for tracking
      const actualEventId = microsite?.events.id;
      if (actualEventId && microsite) {
        await attribution.trackCTAClick(
          actualEventId,
          microsite.id,
          microsite.speakers.id,
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
      // Silently fail attribution tracking - don't break user experience
      console.warn('Attribution tracking failed (CTA click):', error);
    }
  };

  const trackLeadCapture = async (leadEmail: string) => {
    try {
      const actualEventId = microsite?.events.id;
      if (actualEventId && microsite) {
        // Track lead conversion with high value
        await attribution.trackCTAClick(
          actualEventId,
          microsite.id,
          microsite.speakers.id,
          500 // High value for email capture
        );

        // Insert lead into database
        await supabase
          .from('leads')
          .insert({
            email: leadEmail,
            event_id: actualEventId,
            source: 'speaker_microsite',
            metadata: {
              speaker_id: microsite.speakers.id,
              speaker_name: microsite.speakers.full_name,
              microsite_id: microsite.id
            }
          });

        // Update conversion count
        await supabase
          .from('speaker_microsites')
          .update({ 
            total_conversions: (microsite.total_conversions || 0) + 1
          })
          .eq('id', microsite.id);
      }
    } catch (error) {
      // Silently fail attribution tracking - don't break user experience
      console.warn('Attribution tracking failed (lead capture):', error);
    }
  };

  const handleShare = async (platform: string) => {
    // Use the actual event ID from the microsite data
    const actualEventId = microsite?.events.id;
    if (!microsite || !actualEventId) return;

    // Generate attribution URL with referral code
    const baseUrl = window.location.href.split('?')[0]; // Remove existing query params
    const attributionUrl = attribution.generateShareURL(baseUrl, {
      source: platform as any,
      speakerId: microsite.speakers.id,
      eventId: actualEventId,
      medium: 'social',
      campaign: `${microsite.events.subdomain}-speaker-share`,
      generateReferralCode: true,
    });

    const text = `Check out ${microsite.speakers.full_name}'s insights from ${microsite.events.name}`;
    
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
    } else if (microsite?.events.next_event_registration_url) {
      window.open(microsite.events.next_event_registration_url, '_blank');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmittingEmail) return;

    setIsSubmittingEmail(true);
    try {
      await trackLeadCapture(email);
      setEmailSubmitted(true);
      toast.success("🎉 You're on the list! We'll notify you when tickets go live.");
    } catch (error) {
      console.error('Error submitting email:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const getNextEventDate = () => {
    if (!microsite?.events.next_event_date) return null;
    return new Date(microsite.events.next_event_date);
  };

  const getEventYear = () => {
    const nextDate = getNextEventDate();
    return nextDate ? nextDate.getFullYear() : new Date().getFullYear() + 1;
  };

  const formatEventDate = () => {
    const nextDate = getNextEventDate();
    if (!nextDate) return 'Next Year';
    return nextDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
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
  const primaryColor = microsite.brand_colors?.primary || 
                      microsite.events?.branding?.primary_color || 
                      '#5B9BD5';
  const accentColor = microsite.brand_colors?.accent || 
                     microsite.events?.branding?.secondary_color || 
                     '#87CEEB';

  // Fix: speaker_content comes as an array, we need the first item
  const rawContent = Array.isArray(microsite.speaker_content) 
    ? microsite.speaker_content[0] 
    : microsite.speaker_content;

  // Add fallback content when speaker_content is missing
  const content = rawContent || {
    generated_summary: `Valuable insights from ${microsite.speakers.full_name} on key topics that matter to your business and industry growth.`,
    key_takeaways: [
      "Expert insights on industry trends and best practices",
      "Actionable strategies for business growth and innovation",
      "Proven approaches for competitive advantage in today's market"
    ],
    key_quotes: [
      "Innovation is not just about technology, it's about solving real problems for real people.",
      "The future belongs to companies that can adapt quickly and think differently.",
      "Success comes from understanding your customers deeply and delivering exceptional value."
    ],
    video_clips: [],
    highlight_reel_url: null
  };

  return (
    <div className="min-h-screen">
      {/* Beautiful Blue Gradient Background */}
      <div className="min-h-screen relative bg-gradient-to-br from-[#4A90E2] via-[#357ABD] to-[#2C5282]">
        {/* Header */}
        <div className="relative">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              {/* Event Logo */}
              <div className="flex items-center gap-3">
                {microsite.custom_logo_url ? (
                  <img 
                    src={microsite.custom_logo_url} 
                    alt="Event Logo" 
                    className="h-10 w-auto filter brightness-0 invert"
                  />
                ) : (
                  <div className="text-white text-xl font-bold">
                    {microsite.events.name}
                  </div>
                )}
              </div>
              
              {/* Primary CTA Button */}
              <Button
                onClick={handleCTAClick}
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {microsite.custom_cta_text || `Register for ${microsite.events.name} ${getEventYear()}`} →
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 pb-12">
          {/* Desktop Layout */}
          <div className="hidden md:block">
            <div className="grid grid-cols-12 gap-8 items-start">
              {/* Left: Speaker Info */}
              <div className="col-span-4 lg:col-span-3">
                <div className="text-center">
                  <img
                    src={microsite.speakers.headshot_url || '/placeholder.svg'}
                    alt={microsite.speakers.full_name}
                    className="w-32 h-32 lg:w-40 lg:h-40 rounded-full object-cover mx-auto mb-4 border-4 border-white/20"
                  />
                  <h2 className="text-white text-xl lg:text-2xl font-bold mb-1">
                    {microsite.speakers.full_name}
                  </h2>
                  <p className="text-white/80 text-sm lg:text-base mb-2">
                    {microsite.speakers.job_title}
                  </p>
                  <p className="text-white/60 text-sm mb-4">
                    @ {microsite.speakers.company}
                  </p>
                  
                  {/* Speaker Attribution */}
                  <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                    <Star className="h-3 w-3 mr-1" />
                    Speaker at {microsite.events.name}
                  </Badge>
                </div>
              </div>

              {/* Right: Content */}
              <div className="col-span-8 lg:col-span-9">
                <div className="mb-8">
                  <h1 className="text-white text-3xl lg:text-5xl font-bold mb-4 leading-tight">
                    {content?.generated_summary ? (
                      content.generated_summary.split('.')[0] + '.'
                    ) : (
                      "Session Insights & Highlights"
                    )}
                  </h1>
                  <p className="text-white/80 text-lg lg:text-xl leading-relaxed max-w-4xl mb-6">
                    {microsite.speakers.bio}
                  </p>
                  
                  {/* Navigation Pills - Desktop */}
                  <div className="flex flex-wrap gap-3 mb-8">
                    {[
                      { id: 'summary', label: 'Summary' },
                      { id: 'takeaways', label: 'Key Insights' },
                      { id: 'quotes', label: 'Quotes' },
                      { id: 'videos', label: 'Videos' },
                      ...(content?.highlight_reel_url ? [{ id: 'reels', label: 'Reels' }] : []),
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'bg-white text-blue-600 shadow-lg'
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden">
            <div className="text-center mb-8">
              <img
                src={microsite.speakers.headshot_url || '/placeholder.svg'}
                alt={microsite.speakers.full_name}
                className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-white/20"
              />
              <h2 className="text-white text-xl font-bold mb-1">
                {microsite.speakers.full_name}
              </h2>
              <p className="text-white/80 text-sm mb-1">
                {microsite.speakers.job_title}
              </p>
              <p className="text-white/60 text-sm mb-4">
                @ {microsite.speakers.company}
              </p>
              
              <Badge className="bg-white/20 text-white border-white/30 mb-6">
                <Star className="h-3 w-3 mr-1" />
                Speaker at {microsite.events.name}
              </Badge>
              
              <h1 className="text-white text-2xl font-bold mb-4 leading-tight">
                {content?.generated_summary ? (
                  content.generated_summary.split('.')[0] + '.'
                ) : (
                  "Session Insights"
                )}
              </h1>

            {/* Navigation Pills - Mobile */}
            <div className="flex justify-center gap-3 mb-8 overflow-x-auto pb-2 px-4">
              {[
                { id: 'summary', label: 'Summary' },
                { id: 'videos', label: 'Videos' },
                { id: 'quotes', label: 'Quotes' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-lg'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Sections */}
          <div className="mt-8">
            {/* Summary Tab */}
            {activeTab === 'summary' && content?.generated_summary && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 lg:p-8">
                <h3 className="text-white text-xl font-bold mb-4">Session Summary</h3>
                <p className="text-white/90 text-lg leading-relaxed">
                  {content.generated_summary}
                </p>
              </div>
            )}

            {/* Key Takeaways Tab */}
            {activeTab === 'takeaways' && content?.key_takeaways && content.key_takeaways.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 lg:p-8">
                <h3 className="text-white text-xl font-bold mb-6">Key Takeaways</h3>
                <div className="space-y-4">
                  {content.key_takeaways.map((takeaway, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0 mt-1">
                        {index + 1}
                      </div>
                      <p className="text-white/90 text-lg leading-relaxed">
                        {takeaway}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quotes Tab */}
            {activeTab === 'quotes' && content?.key_quotes && content.key_quotes.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 lg:p-8">
                <h3 className="text-white text-xl font-bold mb-6">Key Quotes</h3>
                <div className="space-y-6">
                  {content.key_quotes.map((quote, index) => (
                    <blockquote key={index} className="border-l-4 border-white/40 pl-6">
                      <p className="text-white/90 text-lg leading-relaxed italic">
                        "{quote}"
                      </p>
                      <footer className="mt-3">
                        <cite className="text-white/70 text-sm not-italic">
                          — {microsite.speakers.full_name}
                        </cite>
                      </footer>
                    </blockquote>
                  ))}
                </div>
              </div>
            )}

            {/* Videos Tab */}
            {activeTab === 'videos' && content?.video_clips && content.video_clips.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 lg:p-8">
                <h3 className="text-white text-xl font-bold mb-6">Video Highlights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {content.video_clips.map((clip, index) => (
                    <div key={index} className="relative group cursor-pointer rounded-xl overflow-hidden bg-black/20">
                      <div className="aspect-video bg-black/40 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all">
                          <Play className="h-8 w-8 text-white ml-1" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <h4 className="text-white font-medium mb-1">{clip.title}</h4>
                        <p className="text-white/70 text-sm">{Math.floor(clip.duration / 60)}:{(clip.duration % 60).toString().padStart(2, '0')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reels Tab */}
            {activeTab === 'reels' && content?.highlight_reel_url && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 lg:p-8">
                <h3 className="text-white text-xl font-bold mb-6">Short Form Content</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="relative group cursor-pointer rounded-xl overflow-hidden">
                      <div className="aspect-[9/16] bg-black/20 flex items-center justify-center">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all">
                          <Play className="h-5 w-5 text-white ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-white text-xs font-medium">Reel {i}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom CTA Section */}
          <div className="mt-16">
            {!emailSubmitted ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
                <div className="max-w-2xl mx-auto">
                  <div className="mb-8">
                    <Calendar className="h-12 w-12 text-white mx-auto mb-4" />
                    <h2 className="text-white text-2xl lg:text-3xl font-bold mb-4">
                      Don't Miss {microsite.events.name} {getEventYear()}
                    </h2>
                    <p className="text-white/80 text-lg mb-6">
                      Get notified the moment tickets go live for insights that shape the future
                    </p>
                  </div>

                  {/* Email Capture Form */}
                  <div className="mb-8">
                    <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-4">
                      <Input
                        type="email"
                        id="email-signup"
                        name="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/60 flex-1 h-12"
                        required
                        autoComplete="email"
                      />
                      <Button 
                        type="submit" 
                        className="bg-white text-blue-600 hover:bg-white/90 font-semibold px-8 h-12"
                        disabled={isSubmittingEmail}
                      >
                        {isSubmittingEmail ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
                        ) : (
                          <Bell className="h-4 w-4 mr-2" />
                        )}
                        {isSubmittingEmail ? "Adding you..." : "Get Early Access"}
                      </Button>
                    </form>
                    
                    <div className="flex items-center justify-center gap-6 text-white/60 text-sm">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>Early bird pricing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>VIP access</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ✨ Beautiful Success State */
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-8 text-center border-2 border-green-400/30">
                <div className="max-w-2xl mx-auto">
                  <div className="mb-6">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
                      <CheckCircle className="h-16 w-16 text-green-400 mx-auto relative z-10" />
                    </div>
                    <h2 className="text-white text-2xl lg:text-3xl font-bold mb-4 mt-4">
                      You're on the list! 🎉
                    </h2>
                    <p className="text-white/90 text-lg mb-6">
                      We'll notify you the moment tickets for {microsite.events.name} {getEventYear()} go live.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <span className="text-white/60 text-sm">Share:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare('linkedin')}
                      className="text-white/80 hover:text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
                    >
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare('twitter')}
                      className="text-white/80 hover:text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
                    >
                      <Twitter className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare('copy')}
                      className="text-white/80 hover:text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/20 py-6">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
              <span>Built with</span>
              <a 
                href="https://www.diffused.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <img 
                  src="/diffused logo white no bg.png" 
                  alt="Diffused" 
                  className="h-6 w-auto align-middle"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 