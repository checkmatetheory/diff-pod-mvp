export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audio_assets: {
        Row: {
          asset_type: string
          audio_url: string
          created_at: string
          duration_seconds: number | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          asset_type: string
          audio_url: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          asset_type?: string
          audio_url?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      conference_portfolios: {
        Row: {
          brand_logo_url: string | null
          created_at: string
          default_intro_audio_id: string | null
          default_outro_audio_id: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_logo_url?: string | null
          created_at?: string
          default_intro_audio_id?: string | null
          default_outro_audio_id?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_logo_url?: string | null
          created_at?: string
          default_intro_audio_id?: string | null
          default_outro_audio_id?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conference_portfolios_default_intro_audio_id_fkey"
            columns: ["default_intro_audio_id"]
            isOneToOne: false
            referencedRelation: "audio_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conference_portfolios_default_outro_audio_id_fkey"
            columns: ["default_outro_audio_id"]
            isOneToOne: false
            referencedRelation: "audio_assets"
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
      custom_voices: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_trained: boolean | null
          name: string
          training_audio_url: string | null
          updated_at: string
          user_id: string
          voice_id: string | null
          voice_type: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_trained?: boolean | null
          name: string
          training_audio_url?: string | null
          updated_at?: string
          user_id: string
          voice_id?: string | null
          voice_type?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_trained?: boolean | null
          name?: string
          training_audio_url?: string | null
          updated_at?: string
          user_id?: string
          voice_id?: string | null
          voice_type?: string | null
        }
        Relationships: []
      }
      episode_analytics: {
        Row: {
          created_at: string
          downloads: number | null
          engagement_rate: number | null
          id: string
          listening_time_seconds: number | null
          portfolio_id: string | null
          session_id: string | null
          sponsor_revenue: number | null
          updated_at: string
          views: number | null
        }
        Insert: {
          created_at?: string
          downloads?: number | null
          engagement_rate?: number | null
          id?: string
          listening_time_seconds?: number | null
          portfolio_id?: string | null
          session_id?: string | null
          sponsor_revenue?: number | null
          updated_at?: string
          views?: number | null
        }
        Update: {
          created_at?: string
          downloads?: number | null
          engagement_rate?: number | null
          id?: string
          listening_time_seconds?: number | null
          portfolio_id?: string | null
          session_id?: string | null
          sponsor_revenue?: number | null
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "episode_analytics_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "conference_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "episode_analytics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_series: {
        Row: {
          category: Database["public"]["Enums"]["event_category"]
          created_at: string
          description: string | null
          frequency: string | null
          id: string
          name: string
          portfolio_company_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["event_category"]
          created_at?: string
          description?: string | null
          frequency?: string | null
          id?: string
          name: string
          portfolio_company_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["event_category"]
          created_at?: string
          description?: string | null
          frequency?: string | null
          id?: string
          name?: string
          portfolio_company_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_series_portfolio_company_id_fkey"
            columns: ["portfolio_company_id"]
            isOneToOne: false
            referencedRelation: "portfolio_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      podcast_hosts: {
        Row: {
          created_at: string
          host_role: string | null
          id: string
          session_id: string | null
          speaking_percentage: number | null
          voice_id: string | null
        }
        Insert: {
          created_at?: string
          host_role?: string | null
          id?: string
          session_id?: string | null
          speaking_percentage?: number | null
          voice_id?: string | null
        }
        Update: {
          created_at?: string
          host_role?: string | null
          id?: string
          session_id?: string | null
          speaking_percentage?: number | null
          voice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "podcast_hosts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "podcast_hosts_voice_id_fkey"
            columns: ["voice_id"]
            isOneToOne: false
            referencedRelation: "custom_voices"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_analytics: {
        Row: {
          avg_engagement_rate: number | null
          created_at: string
          id: string
          last_updated: string
          portfolio_id: string | null
          total_downloads: number | null
          total_episodes: number | null
          total_sponsor_revenue: number | null
          total_views: number | null
        }
        Insert: {
          avg_engagement_rate?: number | null
          created_at?: string
          id?: string
          last_updated?: string
          portfolio_id?: string | null
          total_downloads?: number | null
          total_episodes?: number | null
          total_sponsor_revenue?: number | null
          total_views?: number | null
        }
        Update: {
          avg_engagement_rate?: number | null
          created_at?: string
          id?: string
          last_updated?: string
          portfolio_id?: string | null
          total_downloads?: number | null
          total_episodes?: number | null
          total_sponsor_revenue?: number | null
          total_views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_analytics_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "conference_portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_companies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          sector: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          sector?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          sector?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
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
      sponsor_placements: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          placement_type: string
          session_id: string | null
          sponsor_id: string | null
          timestamp_seconds: number | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          placement_type: string
          session_id?: string | null
          sponsor_id?: string | null
          timestamp_seconds?: number | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          placement_type?: string
          session_id?: string | null
          sponsor_id?: string | null
          timestamp_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_placements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_placements_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          ad_audio_url: string | null
          ad_script: string | null
          contact_email: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          ad_audio_url?: string | null
          ad_script?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          ad_audio_url?: string | null
          ad_script?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle_end: string | null
          billing_cycle_start: string | null
          created_at: string
          id: string
          sessions_limit: number
          sessions_used: number
          status: string
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle_end?: string | null
          billing_cycle_start?: string | null
          created_at?: string
          id?: string
          sessions_limit?: number
          sessions_used?: number
          status?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle_end?: string | null
          billing_cycle_start?: string | null
          created_at?: string
          id?: string
          sessions_limit?: number
          sessions_used?: number
          status?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          audio_duration: number | null
          category: Database["public"]["Enums"]["event_category"] | null
          content_type: Database["public"]["Enums"]["content_type"] | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          event_series_id: string | null
          generated_summary: string | null
          generated_title: string | null
          host_count: number | null
          id: string
          intro_audio_id: string | null
          outro_audio_id: string | null
          podcast_url: string | null
          portfolio_company_id: string | null
          portfolio_id: string | null
          processed_at: string
          processing_status: string | null
          session_data: Json | null
          session_name: string
          speaker_names: string[] | null
          sponsor_revenue: number | null
          tags: string[] | null
          thumbnail_url: string | null
          transcript_summary: string | null
          user_id: string
        }
        Insert: {
          audio_duration?: number | null
          category?: Database["public"]["Enums"]["event_category"] | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          event_series_id?: string | null
          generated_summary?: string | null
          generated_title?: string | null
          host_count?: number | null
          id?: string
          intro_audio_id?: string | null
          outro_audio_id?: string | null
          podcast_url?: string | null
          portfolio_company_id?: string | null
          portfolio_id?: string | null
          processed_at?: string
          processing_status?: string | null
          session_data?: Json | null
          session_name: string
          speaker_names?: string[] | null
          sponsor_revenue?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          transcript_summary?: string | null
          user_id: string
        }
        Update: {
          audio_duration?: number | null
          category?: Database["public"]["Enums"]["event_category"] | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          event_series_id?: string | null
          generated_summary?: string | null
          generated_title?: string | null
          host_count?: number | null
          id?: string
          intro_audio_id?: string | null
          outro_audio_id?: string | null
          podcast_url?: string | null
          portfolio_company_id?: string | null
          portfolio_id?: string | null
          processed_at?: string
          processing_status?: string | null
          session_data?: Json | null
          session_name?: string
          speaker_names?: string[] | null
          sponsor_revenue?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          transcript_summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_event_series_id_fkey"
            columns: ["event_series_id"]
            isOneToOne: false
            referencedRelation: "event_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sessions_intro_audio_id_fkey"
            columns: ["intro_audio_id"]
            isOneToOne: false
            referencedRelation: "audio_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sessions_outro_audio_id_fkey"
            columns: ["outro_audio_id"]
            isOneToOne: false
            referencedRelation: "audio_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sessions_portfolio_company_id_fkey"
            columns: ["portfolio_company_id"]
            isOneToOne: false
            referencedRelation: "portfolio_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sessions_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "conference_portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      viewing_progress: {
        Row: {
          completed: boolean | null
          id: string
          last_viewed_at: string
          progress_seconds: number
          session_id: string | null
          total_seconds: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          id?: string
          last_viewed_at?: string
          progress_seconds?: number
          session_id?: string | null
          total_seconds?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          id?: string
          last_viewed_at?: string
          progress_seconds?: number
          session_id?: string | null
          total_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "viewing_progress_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      website_monitors: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          last_check: string | null
          monitoring_frequency: string | null
          portfolio_id: string | null
          selector_config: Json | null
          updated_at: string
          user_id: string
          website_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_check?: string | null
          monitoring_frequency?: string | null
          portfolio_id?: string | null
          selector_config?: Json | null
          updated_at?: string
          user_id: string
          website_url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_check?: string | null
          monitoring_frequency?: string | null
          portfolio_id?: string | null
          selector_config?: Json | null
          updated_at?: string
          user_id?: string
          website_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_monitors_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "conference_portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      content_type: "video_audio" | "audio_only" | "transcript" | "live_session"
      event_category:
        | "conference"
        | "earnings_call"
        | "board_meeting"
        | "investor_update"
        | "due_diligence"
        | "portfolio_review"
        | "market_update"
        | "team_meeting"
      subscription_tier: "free" | "starter" | "pro" | "enterprise"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      content_type: ["video_audio", "audio_only", "transcript", "live_session"],
      event_category: [
        "conference",
        "earnings_call",
        "board_meeting",
        "investor_update",
        "due_diligence",
        "portfolio_review",
        "market_update",
        "team_meeting",
      ],
      subscription_tier: ["free", "starter", "pro", "enterprise"],
    },
  },
} as const
