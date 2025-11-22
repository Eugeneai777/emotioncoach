export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      briefing_tags: {
        Row: {
          briefing_id: string
          created_at: string
          id: string
          tag_id: string
        }
        Insert: {
          briefing_id: string
          created_at?: string
          id?: string
          tag_id: string
        }
        Update: {
          briefing_id?: string
          created_at?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "briefing_tags_briefing_id_fkey"
            columns: ["briefing_id"]
            isOneToOne: false
            referencedRelation: "briefings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "briefing_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      briefings: {
        Row: {
          action: string | null
          conversation_id: string
          created_at: string
          emotion_intensity: number | null
          emotion_theme: string
          growth_story: string | null
          id: string
          insight: string | null
          intensity_keywords: string[] | null
          intensity_reasoning: string | null
          stage_1_content: string | null
          stage_2_content: string | null
          stage_3_content: string | null
          stage_4_content: string | null
        }
        Insert: {
          action?: string | null
          conversation_id: string
          created_at?: string
          emotion_intensity?: number | null
          emotion_theme: string
          growth_story?: string | null
          id?: string
          insight?: string | null
          intensity_keywords?: string[] | null
          intensity_reasoning?: string | null
          stage_1_content?: string | null
          stage_2_content?: string | null
          stage_3_content?: string | null
          stage_4_content?: string | null
        }
        Update: {
          action?: string | null
          conversation_id?: string
          created_at?: string
          emotion_intensity?: number | null
          emotion_theme?: string
          growth_story?: string | null
          id?: string
          insight?: string | null
          intensity_keywords?: string[] | null
          intensity_reasoning?: string | null
          stage_1_content?: string | null
          stage_2_content?: string | null
          stage_3_content?: string | null
          stage_4_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "briefings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      emotion_goals: {
        Row: {
          baseline_weekly_count: number | null
          created_at: string
          description: string | null
          end_date: string
          goal_category: string | null
          goal_type: string
          id: string
          intensity_baseline: number | null
          intensity_max: number | null
          intensity_min: number | null
          intensity_target_days: number | null
          is_active: boolean
          start_date: string
          target_count: number
          target_reduction_percent: number | null
          target_tag_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          baseline_weekly_count?: number | null
          created_at?: string
          description?: string | null
          end_date: string
          goal_category?: string | null
          goal_type: string
          id?: string
          intensity_baseline?: number | null
          intensity_max?: number | null
          intensity_min?: number | null
          intensity_target_days?: number | null
          is_active?: boolean
          start_date: string
          target_count: number
          target_reduction_percent?: number | null
          target_tag_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          baseline_weekly_count?: number | null
          created_at?: string
          description?: string | null
          end_date?: string
          goal_category?: string | null
          goal_type?: string
          id?: string
          intensity_baseline?: number | null
          intensity_max?: number | null
          intensity_min?: number | null
          intensity_target_days?: number | null
          is_active?: boolean
          start_date?: string
          target_count?: number
          target_reduction_percent?: number | null
          target_tag_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emotion_goals_target_tag_id_fkey"
            columns: ["target_tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      emotion_quick_logs: {
        Row: {
          created_at: string
          emotion_intensity: number
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          emotion_intensity: number
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          emotion_intensity?: number
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          companion_type: string | null
          conversation_style: string | null
          created_at: string
          display_name: string | null
          has_seen_onboarding: boolean | null
          id: string
          intensity_reminder_enabled: boolean | null
          intensity_reminder_time: string | null
          last_intensity_reminder_shown: string | null
          last_reminder_shown: string | null
          notification_frequency: string | null
          preferred_encouragement_style: string | null
          reminder_enabled: boolean | null
          reminder_time: string | null
          smart_notification_enabled: boolean | null
          updated_at: string
          voice_gender: string | null
          voice_rate: number | null
          wecom_bot_enabled: boolean | null
          wecom_bot_encoding_aes_key: string | null
          wecom_bot_token: string | null
          wecom_enabled: boolean | null
          wecom_mention_all: boolean | null
          wecom_webhook_url: string | null
        }
        Insert: {
          companion_type?: string | null
          conversation_style?: string | null
          created_at?: string
          display_name?: string | null
          has_seen_onboarding?: boolean | null
          id: string
          intensity_reminder_enabled?: boolean | null
          intensity_reminder_time?: string | null
          last_intensity_reminder_shown?: string | null
          last_reminder_shown?: string | null
          notification_frequency?: string | null
          preferred_encouragement_style?: string | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          smart_notification_enabled?: boolean | null
          updated_at?: string
          voice_gender?: string | null
          voice_rate?: number | null
          wecom_bot_enabled?: boolean | null
          wecom_bot_encoding_aes_key?: string | null
          wecom_bot_token?: string | null
          wecom_enabled?: boolean | null
          wecom_mention_all?: boolean | null
          wecom_webhook_url?: string | null
        }
        Update: {
          companion_type?: string | null
          conversation_style?: string | null
          created_at?: string
          display_name?: string | null
          has_seen_onboarding?: boolean | null
          id?: string
          intensity_reminder_enabled?: boolean | null
          intensity_reminder_time?: string | null
          last_intensity_reminder_shown?: string | null
          last_reminder_shown?: string | null
          notification_frequency?: string | null
          preferred_encouragement_style?: string | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          smart_notification_enabled?: boolean | null
          updated_at?: string
          voice_gender?: string | null
          voice_rate?: number | null
          wecom_bot_enabled?: boolean | null
          wecom_bot_encoding_aes_key?: string | null
          wecom_bot_token?: string | null
          wecom_enabled?: boolean | null
          wecom_mention_all?: boolean | null
          wecom_webhook_url?: string | null
        }
        Relationships: []
      }
      smart_notifications: {
        Row: {
          action_data: Json | null
          action_text: string | null
          action_type: string | null
          context: Json | null
          created_at: string
          dismissed_at: string | null
          icon: string | null
          id: string
          is_dismissed: boolean
          is_read: boolean
          message: string
          notification_type: string
          priority: number
          read_at: string | null
          scenario: string
          title: string
          user_id: string
        }
        Insert: {
          action_data?: Json | null
          action_text?: string | null
          action_type?: string | null
          context?: Json | null
          created_at?: string
          dismissed_at?: string | null
          icon?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          message: string
          notification_type: string
          priority?: number
          read_at?: string | null
          scenario: string
          title: string
          user_id: string
        }
        Update: {
          action_data?: Json | null
          action_text?: string | null
          action_type?: string | null
          context?: Json | null
          created_at?: string
          dismissed_at?: string | null
          icon?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          message?: string
          notification_type?: string
          priority?: number
          read_at?: string | null
          scenario?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          last_sentiment_check: string | null
          name: string
          sentiment: string | null
          sentiment_confidence: number | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          last_sentiment_check?: string | null
          name: string
          sentiment?: string | null
          sentiment_confidence?: number | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          last_sentiment_check?: string | null
          name?: string
          sentiment?: string | null
          sentiment_confidence?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_description: string | null
          achievement_name: string
          achievement_type: string
          earned_at: string
          icon: string | null
          id: string
          related_goal_id: string | null
          user_id: string
        }
        Insert: {
          achievement_description?: string | null
          achievement_name: string
          achievement_type: string
          earned_at?: string
          icon?: string | null
          id?: string
          related_goal_id?: string | null
          user_id: string
        }
        Update: {
          achievement_description?: string | null
          achievement_name?: string
          achievement_type?: string
          earned_at?: string
          icon?: string | null
          id?: string
          related_goal_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_related_goal_id_fkey"
            columns: ["related_goal_id"]
            isOneToOne: false
            referencedRelation: "emotion_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_behavior_analysis: {
        Row: {
          active_goals_count: number
          analysis_date: string
          avg_emotion_intensity: number | null
          checkin_count: number
          created_at: string
          days_since_last_checkin: number | null
          dominant_emotions: string[] | null
          emotion_trend: string | null
          goals_at_risk: number
          goals_on_track: number
          growth_indicators: Json | null
          id: string
          last_checkin_at: string | null
          needs_care: boolean
          needs_encouragement: boolean
          needs_reminder: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          active_goals_count?: number
          analysis_date?: string
          avg_emotion_intensity?: number | null
          checkin_count?: number
          created_at?: string
          days_since_last_checkin?: number | null
          dominant_emotions?: string[] | null
          emotion_trend?: string | null
          goals_at_risk?: number
          goals_on_track?: number
          growth_indicators?: Json | null
          id?: string
          last_checkin_at?: string | null
          needs_care?: boolean
          needs_encouragement?: boolean
          needs_reminder?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          active_goals_count?: number
          analysis_date?: string
          avg_emotion_intensity?: number | null
          checkin_count?: number
          created_at?: string
          days_since_last_checkin?: number | null
          dominant_emotions?: string[] | null
          emotion_trend?: string | null
          goals_at_risk?: number
          goals_on_track?: number
          growth_indicators?: Json | null
          id?: string
          last_checkin_at?: string | null
          needs_care?: boolean
          needs_encouragement?: boolean
          needs_reminder?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wecom_bot_config: {
        Row: {
          created_at: string
          created_by: string | null
          enabled: boolean
          encoding_aes_key: string
          id: string
          token: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          encoding_aes_key: string
          id?: string
          token: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          encoding_aes_key?: string
          id?: string
          token?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      wecom_messages: {
        Row: {
          content: string | null
          create_time: number | null
          created_at: string | null
          from_user: string | null
          id: string
          msg_id: string | null
          msg_type: string
          processed: boolean | null
          response_content: string | null
          response_sent: boolean | null
          to_user: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          create_time?: number | null
          created_at?: string | null
          from_user?: string | null
          id?: string
          msg_id?: string | null
          msg_type: string
          processed?: boolean | null
          response_content?: string | null
          response_sent?: boolean | null
          to_user?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          create_time?: number | null
          created_at?: string | null
          from_user?: string | null
          id?: string
          msg_id?: string | null
          msg_type?: string
          processed?: boolean | null
          response_content?: string | null
          response_sent?: boolean | null
          to_user?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wecom_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wecom_user_mappings: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          system_user_id: string
          updated_at: string
          wecom_user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          system_user_id: string
          updated_at?: string
          wecom_user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          system_user_id?: string
          updated_at?: string
          wecom_user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
