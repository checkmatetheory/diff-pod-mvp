import { supabase } from "@/integrations/supabase/client";

// Attribution event types
export type AttributionEvent = 
  | 'view'
  | 'share' 
  | 'click'
  | 'conversion'
  | 'email_capture'
  | 'registration'
  | 'ticket_purchase';

// UTM source types
export type UTMSource = 
  | 'microsite'
  | 'linkedin' 
  | 'twitter'
  | 'email'
  | 'direct'
  | 'referral';

// Referral code structure
export interface ReferralCode {
  code: string;
  speaker_id: string;
  event_id: string;
  type: 'speaker_share' | 'event_registration' | 'affiliate';
  expires_at?: string;
}

// Attribution data structure
export interface AttributionData {
  microsite_id?: string;
  event_id: string;
  speaker_id?: string;
  event_type: AttributionEvent;
  utm_source?: UTMSource;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referral_code?: string;
  visitor_ip?: string;
  user_agent?: string;
  referrer_url?: string;
  session_id: string;
  conversion_value?: number;
  metadata?: Record<string, any>;
}

// Attribution utilities class
class AttributionTracker {
  private sessionId: string;

  constructor() {
    // Get or create session ID
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('attribution_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('attribution_session_id', sessionId);
    }
    return sessionId;
  }

  // Generate unique referral code
  generateReferralCode(speakerId: string, eventId: string, type: ReferralCode['type'] = 'speaker_share'): string {
    const prefix = type === 'speaker_share' ? 'SPK' : type === 'event_registration' ? 'REG' : 'AFF';
    const shortEventId = eventId.substring(0, 8);
    const shortSpeakerId = speakerId.substring(0, 8);
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 5);
    
    return `${prefix}-${shortEventId}-${shortSpeakerId}-${timestamp}${random}`.toUpperCase();
  }

  // Generate UTM parameters for sharing
  generateUTMParameters(options: {
    source: UTMSource;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
    referralCode?: string;
  }): string {
    const params = new URLSearchParams();
    
    params.set('utm_source', options.source);
    if (options.medium) params.set('utm_medium', options.medium);
    if (options.campaign) params.set('utm_campaign', options.campaign);
    if (options.content) params.set('utm_content', options.content);
    if (options.term) params.set('utm_term', options.term);
    if (options.referralCode) params.set('ref', options.referralCode);
    
    // Add tracking timestamp
    params.set('_t', Date.now().toString());

    return params.toString();
  }

  // Parse UTM parameters from URL
  parseUTMParameters(url: string = window.location.href): Partial<AttributionData> {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    return {
      utm_source: params.get('utm_source') as UTMSource || undefined,
      utm_medium: params.get('utm_medium') || undefined,
      utm_campaign: params.get('utm_campaign') || undefined,
      utm_content: params.get('utm_content') || undefined,
      utm_term: params.get('utm_term') || undefined,
      referral_code: params.get('ref') || undefined,
    };
  }

  // Track attribution event
  async track(data: Omit<AttributionData, 'session_id'>): Promise<void> {
    try {
      const attributionData: AttributionData = {
        ...data,
        session_id: this.sessionId,
        visitor_ip: '', // Will be populated by edge function
        user_agent: navigator.userAgent,
        referrer_url: document.referrer || undefined,
      };

      // Add UTM data from current URL if not provided
      if (!data.utm_source) {
        const utmData = this.parseUTMParameters();
        Object.assign(attributionData, utmData);
      }

      const { error } = await supabase
        .from('attribution_tracking')
        .insert(attributionData);

      if (error) throw error;

      // If it's a conversion event, trigger celebration
      if (data.event_type === 'conversion' || data.event_type === 'ticket_purchase') {
        await this.triggerConversionCelebration(attributionData);
      }

    } catch (error) {
      console.error('Attribution tracking error:', error);
    }
  }

  // Track page view
  async trackView(eventId: string, micrositeId?: string, speakerId?: string): Promise<void> {
    await this.track({
      event_id: eventId,
      microsite_id: micrositeId,
      speaker_id: speakerId,
      event_type: 'view',
    });
  }

  // Track share action
  async trackShare(
    eventId: string, 
    platform: UTMSource, 
    micrositeId?: string, 
    speakerId?: string,
    referralCode?: string
  ): Promise<void> {
    await this.track({
      event_id: eventId,
      microsite_id: micrositeId,
      speaker_id: speakerId,
      event_type: 'share',
      utm_source: platform,
      utm_medium: 'social',
      utm_campaign: eventId.substring(0, 8),
      referral_code: referralCode,
    });
  }

  // Track CTA click
  async trackCTAClick(
    eventId: string, 
    micrositeId?: string, 
    speakerId?: string,
    conversionValue?: number
  ): Promise<void> {
    await this.track({
      event_id: eventId,
      microsite_id: micrositeId,
      speaker_id: speakerId,
      event_type: 'click',
      utm_source: 'microsite',
      utm_medium: 'cta',
      utm_campaign: eventId.substring(0, 8),
      conversion_value: conversionValue,
    });
  }

  // Track conversion (registration, purchase, etc.)
  async trackConversion(
    eventId: string,
    conversionType: 'email_capture' | 'registration' | 'ticket_purchase',
    value?: number,
    micrositeId?: string,
    speakerId?: string,
    email?: string
  ): Promise<void> {
    await this.track({
      event_id: eventId,
      microsite_id: micrositeId,
      speaker_id: speakerId,
      event_type: conversionType,
      conversion_value: value,
      metadata: {
        email: email,
        timestamp: new Date().toISOString(),
      }
    });
  }

  // Trigger conversion celebration
  private async triggerConversionCelebration(attribution: AttributionData): Promise<void> {
    try {
      // Create celebration record
      const { error } = await supabase
        .from('conversion_celebrations')
        .insert({
          event_id: attribution.event_id,
          speaker_id: attribution.speaker_id,
          microsite_id: attribution.microsite_id,
          conversion_type: attribution.event_type,
          conversion_value: attribution.conversion_value || 0,
          referral_code: attribution.referral_code,
          attribution_data: attribution,
          celebrated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // If there's a speaker involved, calculate their attribution score
      if (attribution.speaker_id) {
        await this.updateSpeakerAttribution(attribution.speaker_id, attribution.event_id, attribution.conversion_value || 0);
      }

    } catch (error) {
      console.error('Conversion celebration error:', error);
    }
  }

  // Update speaker attribution metrics
  private async updateSpeakerAttribution(speakerId: string, eventId: string, value: number): Promise<void> {
    try {
      // Get current attribution stats
      const { data: currentStats } = await supabase
        .from('speaker_attribution_stats')
        .select('*')
        .eq('speaker_id', speakerId)
        .eq('event_id', eventId)
        .single();

      if (currentStats) {
        // Update existing stats
        await supabase
          .from('speaker_attribution_stats')
          .update({
            total_conversions: currentStats.total_conversions + 1,
            total_value: currentStats.total_value + value,
            last_conversion_at: new Date().toISOString(),
          })
          .eq('speaker_id', speakerId)
          .eq('event_id', eventId);
      } else {
        // Create new stats record
        await supabase
          .from('speaker_attribution_stats')
          .insert({
            speaker_id: speakerId,
            event_id: eventId,
            total_conversions: 1,
            total_value: value,
            first_conversion_at: new Date().toISOString(),
            last_conversion_at: new Date().toISOString(),
          });
      }
    } catch (error) {
      console.error('Speaker attribution update error:', error);
    }
  }

  // Generate share URL with attribution
  generateShareURL(
    baseUrl: string,
    options: {
      source: UTMSource;
      speakerId?: string;
      eventId?: string;
      medium?: string;
      campaign?: string;
      generateReferralCode?: boolean;
    }
  ): string {
    const url = new URL(baseUrl);
    
    // Generate referral code if requested
    let referralCode: string | undefined;
    if (options.generateReferralCode && options.speakerId && options.eventId) {
      referralCode = this.generateReferralCode(options.speakerId, options.eventId, 'speaker_share');
    }

    // Add UTM parameters
    const utmParams = this.generateUTMParameters({
      source: options.source,
      medium: options.medium || 'social',
      campaign: options.campaign || options.eventId?.substring(0, 8),
      referralCode: referralCode,
    });

    url.search = utmParams;
    return url.toString();
  }

  // Get attribution analytics for an event
  async getEventAttributionAnalytics(eventId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('attribution_tracking')
        .select('*')
        .eq('event_id', eventId);

      if (error) throw error;

      // Process analytics
      const analytics = {
        total_views: data.filter(d => d.event_type === 'view').length,
        total_shares: data.filter(d => d.event_type === 'share').length,
        total_clicks: data.filter(d => d.event_type === 'click').length,
        total_conversions: data.filter(d => ['conversion', 'email_capture', 'registration', 'ticket_purchase'].includes(d.event_type)).length,
        total_value: data.reduce((sum, d) => sum + (d.conversion_value || 0), 0),
        by_source: this.groupBy(data, 'utm_source'),
        by_medium: this.groupBy(data, 'utm_medium'),
        by_speaker: this.groupBy(data, 'speaker_id'),
        conversion_funnel: {
          views: data.filter(d => d.event_type === 'view').length,
          clicks: data.filter(d => d.event_type === 'click').length,
          conversions: data.filter(d => ['conversion', 'email_capture', 'registration', 'ticket_purchase'].includes(d.event_type)).length,
        }
      };

      return analytics;
    } catch (error) {
      console.error('Analytics error:', error);
      return null;
    }
  }

  // Utility function to group data
  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((groups, item) => {
      const value = item[key] || 'unknown';
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    }, {});
  }
}

// Export singleton instance
export const attribution = new AttributionTracker();

// Export utility functions
export const {
  generateReferralCode,
  generateUTMParameters,
  parseUTMParameters,
  track,
  trackView,
  trackShare,
  trackCTAClick,
  trackConversion,
  generateShareURL,
  getEventAttributionAnalytics,
} = attribution;

// Export default
export default attribution; 