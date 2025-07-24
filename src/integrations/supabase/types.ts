export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      affiliate_payouts: {
        Row: {
          commission_rate: number
          created_at: string
          event_id: string
          id: string
          payment_details: Json | null
          payment_method: string | null
          payout_amount: number
          payout_status: string | null
          processed_at: string | null
          referral_code_id: string | null
          speaker_id: string
          total_conversion_value: number
          total_conversions: number
          updated_at: string
        }
        Insert: {
          commission_rate: number
          created_at?: string
          event_id: string
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          payout_amount: number
          payout_status?: string | null
          processed_at?: string | null
          referral_code_id?: string | null
          speaker_id: string
          total_conversion_value: number
          total_conversions: number
          updated_at?: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          event_id?: string
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          payout_amount?: number
          payout_status?: string | null
          processed_at?: string | null
          referral_code_id?: string | null
          speaker_id?: string
          total_conversion_value?: number
          total_conversions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_payouts_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_payouts_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      attribution_tracking: {
        Row: {
          city: string | null
          conversion_type: string | null
          conversion_value: number | null
          country_code: string | null
          created_at: string
          event_id: string
          event_type: string
          id: string
          microsite_id: string
          referral_code: string | null
          referrer_url: string | null
          session_id: string | null
          tracked_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_ip: string | null
        }
        Insert: {
          city?: string | null
          conversion_type?: string | null
          conversion_value?: number | null
          country_code?: string | null
          created_at?: string
          event_id: string
          event_type: string
          id?: string
          microsite_id: string
          referral_code?: string | null
          referrer_url?: string | null
          session_id?: string | null
          tracked_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_ip?: string | null
        }
        Update: {
          city?: string | null
          conversion_type?: string | null
          conversion_value?: number | null
          country_code?: string | null
          created_at?: string
          event_id?: string
          event_type?: string
          id?: string
          microsite_id?: string
          referral_code?: string | null
          referrer_url?: string | null
          session_id?: string | null
          tracked_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attribution_tracking_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attribution_tracking_microsite_id_fkey"
            columns: ["microsite_id"]
            isOneToOne: false
            referencedRelation: "speaker_microsites"
            referencedColumns: ["id"]
          },
        ]
      }
      content: {
        Row: {
          content_data: Json
          content_type: string
          created_at: string
          event_id: string | null
          id: string
          is_public: boolean | null
          session_id: string | null
          updated_at: string
        }
        Insert: {
          content_data: Json
          content_type: string
          created_at?: string
          event_id?: string | null
          id?: string
          is_public?: boolean | null
          session_id?: string | null
          updated_at?: string
        }
        Update: {
          content_data?: Json
          content_type?: string
          created_at?: string
          event_id?: string | null
          id?: string
          is_public?: boolean | null
          session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      content_favorites: {
        Row: {
          content_item_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_item_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content_item_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_favorites_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          content_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration: number | null
          event_name: string
          id: string
          speaker_name: string
          tags: string[] | null
          thumbnail_url: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: number | null
          event_name: string
          id?: string
          speaker_name: string
          tags?: string[] | null
          thumbnail_url: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: number | null
          event_name?: string
          id?: string
          speaker_name?: string
          tags?: string[] | null
          thumbnail_url?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversion_celebrations: {
        Row: {
          attribution_data: Json | null
          celebrated_at: string
          conversion_type: string
          conversion_value: number | null
          created_at: string
          event_id: string
          id: string
          microsite_id: string | null
          notification_sent: boolean | null
          referral_code: string | null
          speaker_id: string | null
        }
        Insert: {
          attribution_data?: Json | null
          celebrated_at?: string
          conversion_type: string
          conversion_value?: number | null
          created_at?: string
          event_id: string
          id?: string
          microsite_id?: string | null
          notification_sent?: boolean | null
          referral_code?: string | null
          speaker_id?: string | null
        }
        Update: {
          attribution_data?: Json | null
          celebrated_at?: string
          conversion_type?: string
          conversion_value?: number | null
          created_at?: string
          event_id?: string
          id?: string
          microsite_id?: string | null
          notification_sent?: boolean | null
          referral_code?: string | null
          speaker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversion_celebrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_celebrations_microsite_id_fkey"
            columns: ["microsite_id"]
            isOneToOne: false
            referencedRelation: "speaker_microsites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_celebrations_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      diffusion_analytics: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number | null
          session_id: string | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value?: number | null
          session_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diffusion_analytics_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diffusion_analytics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          attendee_badge_url: string | null
          attendee_email: string | null
          attendee_name: string
          created_at: string
          event_id: string | null
          id: string
          is_verified: boolean | null
          user_id: string | null
        }
        Insert: {
          attendee_badge_url?: string | null
          attendee_email?: string | null
          attendee_name: string
          created_at?: string
          event_id?: string | null
          id?: string
          is_verified?: boolean | null
          user_id?: string | null
        }
        Update: {
          attendee_badge_url?: string | null
          attendee_email?: string | null
          attendee_name?: string
          created_at?: string
          event_id?: string | null
          id?: string
          is_verified?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          branding: Json | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          next_event_date: string | null
          next_event_registration_url: string | null
          subdomain: string
          updated_at: string
          user_id: string
        }
        Insert: {
          branding?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          next_event_date?: string | null
          next_event_registration_url?: string | null
          subdomain: string
          updated_at?: string
          user_id: string
        }
        Update: {
          branding?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          next_event_date?: string | null
          next_event_registration_url?: string | null
          subdomain?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          attended_status: string | null
          created_at: string
          email: string
          event_id: string | null
          id: string
          metadata: Json | null
          source: string | null
        }
        Insert: {
          attended_status?: string | null
          created_at?: string
          email: string
          event_id?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
        }
        Update: {
          attended_status?: string | null
          created_at?: string
          email?: string
          event_id?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      microsite_approval_history: {
        Row: {
          change_reason: string | null
          changed_at: string
          changed_by: string
          id: string
          microsite_id: string
          new_status: string
          previous_status: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          changed_by: string
          id?: string
          microsite_id: string
          new_status: string
          previous_status?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string
          id?: string
          microsite_id?: string
          new_status?: string
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "microsite_approval_history_microsite_id_fkey"
            columns: ["microsite_id"]
            isOneToOne: false
            referencedRelation: "speaker_microsites"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_code_usage: {
        Row: {
          attribution_tracking_id: string | null
          conversion_type: string | null
          conversion_value: number | null
          event_id: string
          id: string
          referral_code_id: string
          referrer_url: string | null
          used_at: string
          user_agent: string | null
          visitor_ip: string | null
        }
        Insert: {
          attribution_tracking_id?: string | null
          conversion_type?: string | null
          conversion_value?: number | null
          event_id: string
          id?: string
          referral_code_id: string
          referrer_url?: string | null
          used_at?: string
          user_agent?: string | null
          visitor_ip?: string | null
        }
        Update: {
          attribution_tracking_id?: string | null
          conversion_type?: string | null
          conversion_value?: number | null
          event_id?: string
          id?: string
          referral_code_id?: string
          referrer_url?: string | null
          used_at?: string
          user_agent?: string | null
          visitor_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_code_usage_attribution_tracking_id_fkey"
            columns: ["attribution_tracking_id"]
            isOneToOne: false
            referencedRelation: "attribution_tracking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_code_usage_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_code_usage_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          code_type: string
          created_at: string
          event_id: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          microsite_id: string | null
          speaker_id: string | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          code: string
          code_type: string
          created_at?: string
          event_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          microsite_id?: string | null
          speaker_id?: string | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          code?: string
          code_type?: string
          created_at?: string
          event_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          microsite_id?: string | null
          speaker_id?: string | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_codes_microsite_id_fkey"
            columns: ["microsite_id"]
            isOneToOne: false
            referencedRelation: "speaker_microsites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_codes_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      shares: {
        Row: {
          attribution_text: string | null
          created_at: string
          event_id: string | null
          id: string
          platform: string
          session_id: string | null
          share_url: string | null
          user_id: string | null
        }
        Insert: {
          attribution_text?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          platform: string
          session_id?: string | null
          share_url?: string | null
          user_id?: string | null
        }
        Update: {
          attribution_text?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          platform?: string
          session_id?: string | null
          share_url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shares_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shares_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      speaker_attribution_stats: {
        Row: {
          conversion_rate: number | null
          created_at: string
          event_id: string
          first_conversion_at: string | null
          id: string
          last_conversion_at: string | null
          speaker_id: string
          total_clicks: number | null
          total_conversions: number | null
          total_shares: number | null
          total_value: number | null
          total_views: number | null
          updated_at: string
        }
        Insert: {
          conversion_rate?: number | null
          created_at?: string
          event_id: string
          first_conversion_at?: string | null
          id?: string
          last_conversion_at?: string | null
          speaker_id: string
          total_clicks?: number | null
          total_conversions?: number | null
          total_shares?: number | null
          total_value?: number | null
          total_views?: number | null
          updated_at?: string
        }
        Update: {
          conversion_rate?: number | null
          created_at?: string
          event_id?: string
          first_conversion_at?: string | null
          id?: string
          last_conversion_at?: string | null
          speaker_id?: string
          total_clicks?: number | null
          total_conversions?: number | null
          total_shares?: number | null
          total_value?: number | null
          total_views?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "speaker_attribution_stats_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speaker_attribution_stats_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      speaker_content: {
        Row: {
          ai_model_used: string | null
          ai_processing_completed_at: string | null
          ai_processing_started_at: string | null
          created_at: string
          generated_summary: string | null
          highlight_reel_url: string | null
          id: string
          key_quotes: Json | null
          key_takeaways: Json | null
          microsite_id: string
          processing_duration_seconds: number | null
          processing_error_message: string | null
          processing_status: string | null
          prompt_version: string | null
          social_captions: Json | null
          updated_at: string
          video_clips: Json | null
        }
        Insert: {
          ai_model_used?: string | null
          ai_processing_completed_at?: string | null
          ai_processing_started_at?: string | null
          created_at?: string
          generated_summary?: string | null
          highlight_reel_url?: string | null
          id?: string
          key_quotes?: Json | null
          key_takeaways?: Json | null
          microsite_id: string
          processing_duration_seconds?: number | null
          processing_error_message?: string | null
          processing_status?: string | null
          prompt_version?: string | null
          social_captions?: Json | null
          updated_at?: string
          video_clips?: Json | null
        }
        Update: {
          ai_model_used?: string | null
          ai_processing_completed_at?: string | null
          ai_processing_started_at?: string | null
          created_at?: string
          generated_summary?: string | null
          highlight_reel_url?: string | null
          id?: string
          key_quotes?: Json | null
          key_takeaways?: Json | null
          microsite_id?: string
          processing_duration_seconds?: number | null
          processing_error_message?: string | null
          processing_status?: string | null
          prompt_version?: string | null
          social_captions?: Json | null
          updated_at?: string
          video_clips?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "speaker_content_microsite_id_fkey"
            columns: ["microsite_id"]
            isOneToOne: false
            referencedRelation: "speaker_microsites"
            referencedColumns: ["id"]
          },
        ]
      }
      speaker_microsites: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          brand_colors: Json | null
          created_at: string
          created_by: string
          custom_cta_text: string | null
          custom_cta_url: string | null
          custom_logo_url: string | null
          event_id: string
          id: string
          is_live: boolean | null
          microsite_url: string
          published_at: string | null
          rejection_reason: string | null
          speaker_id: string
          speaker_notification_email: string | null
          speaker_notified_at: string | null
          total_conversions: number | null
          total_earnings: number | null
          total_shares: number | null
          total_views: number | null
          updated_at: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          brand_colors?: Json | null
          created_at?: string
          created_by: string
          custom_cta_text?: string | null
          custom_cta_url?: string | null
          custom_logo_url?: string | null
          event_id: string
          id?: string
          is_live?: boolean | null
          microsite_url: string
          published_at?: string | null
          rejection_reason?: string | null
          speaker_id: string
          speaker_notification_email?: string | null
          speaker_notified_at?: string | null
          total_conversions?: number | null
          total_earnings?: number | null
          total_shares?: number | null
          total_views?: number | null
          updated_at?: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          brand_colors?: Json | null
          created_at?: string
          created_by?: string
          custom_cta_text?: string | null
          custom_cta_url?: string | null
          custom_logo_url?: string | null
          event_id?: string
          id?: string
          is_live?: boolean | null
          microsite_url?: string
          published_at?: string | null
          rejection_reason?: string | null
          speaker_id?: string
          speaker_notification_email?: string | null
          speaker_notified_at?: string | null
          total_conversions?: number | null
          total_earnings?: number | null
          total_shares?: number | null
          total_views?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "speaker_microsites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speaker_microsites_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      speaker_microsite_sessions: {
        Row: {
          id: string
          microsite_id: string
          session_id: string
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          microsite_id: string
          session_id: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          microsite_id?: string
          session_id?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "speaker_microsite_sessions_microsite_id_fkey"
            columns: ["microsite_id"]
            isOneToOne: false
            referencedRelation: "speaker_microsites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speaker_microsite_sessions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      speakers: {
        Row: {
          bio: string | null
          company: string | null
          created_at: string
          created_by: string
          email: string | null
          full_name: string
          headshot_url: string | null
          id: string
          job_title: string | null
          linkedin_data: Json | null
          linkedin_scraped_at: string | null
          linkedin_url: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          company?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          full_name: string
          headshot_url?: string | null
          id?: string
          job_title?: string | null
          linkedin_data?: Json | null
          linkedin_scraped_at?: string | null
          linkedin_url?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          company?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          full_name?: string
          headshot_url?: string | null
          id?: string
          job_title?: string | null
          linkedin_data?: Json | null
          linkedin_scraped_at?: string | null
          linkedin_url?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          audio_duration: number | null
          content_type: string | null
          created_at: string | null
          event_id: string | null
          generated_summary: string | null
          generated_title: string | null
          id: string
          podcast_url: string | null
          processing_status: string | null
          session_data: Json | null
          session_name: string | null
          transcript_summary: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audio_duration?: number | null
          content_type?: string | null
          created_at?: string | null
          event_id?: string | null
          generated_summary?: string | null
          generated_title?: string | null
          id?: string
          podcast_url?: string | null
          processing_status?: string | null
          session_data?: Json | null
          session_name?: string | null
          transcript_summary?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audio_duration?: number | null
          content_type?: string | null
          created_at?: string | null
          event_id?: string | null
          generated_summary?: string | null
          generated_title?: string | null
          id?: string
          podcast_url?: string | null
          processing_status?: string | null
          session_data?: Json | null
          session_name?: string | null
          transcript_summary?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_microsite_url: {
        Args: { event_subdomain: string; speaker_slug: string }
        Returns: string
      }
      generate_referral_code: {
        Args: { p_speaker_id: string; p_event_id: string; p_code_type?: string }
        Returns: string
      }
      generate_speaker_slug: {
        Args: { speaker_name: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
