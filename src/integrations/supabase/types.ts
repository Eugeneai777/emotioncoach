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
      breathing_sessions: {
        Row: {
          created_at: string | null
          duration: number
          id: string
          pattern_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration: number
          id?: string
          pattern_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration?: number
          id?: string
          pattern_type?: string
          user_id?: string
        }
        Relationships: []
      }
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
      camp_daily_progress: {
        Row: {
          camp_id: string
          checked_in_at: string | null
          checkin_type: string | null
          created_at: string | null
          declaration_completed: boolean | null
          declaration_completed_at: string | null
          emotion_logs_count: number | null
          has_shared_to_community: boolean | null
          id: string
          is_checked_in: boolean | null
          last_emotion_log_at: string | null
          progress_date: string
          recommended_videos: Json | null
          reflection_briefing_id: string | null
          reflection_completed: boolean | null
          reflection_completed_at: string | null
          shared_at: string | null
          updated_at: string | null
          user_id: string
          validation_passed: boolean | null
          video_learning_completed: boolean | null
          videos_watched_count: number | null
        }
        Insert: {
          camp_id: string
          checked_in_at?: string | null
          checkin_type?: string | null
          created_at?: string | null
          declaration_completed?: boolean | null
          declaration_completed_at?: string | null
          emotion_logs_count?: number | null
          has_shared_to_community?: boolean | null
          id?: string
          is_checked_in?: boolean | null
          last_emotion_log_at?: string | null
          progress_date: string
          recommended_videos?: Json | null
          reflection_briefing_id?: string | null
          reflection_completed?: boolean | null
          reflection_completed_at?: string | null
          shared_at?: string | null
          updated_at?: string | null
          user_id: string
          validation_passed?: boolean | null
          video_learning_completed?: boolean | null
          videos_watched_count?: number | null
        }
        Update: {
          camp_id?: string
          checked_in_at?: string | null
          checkin_type?: string | null
          created_at?: string | null
          declaration_completed?: boolean | null
          declaration_completed_at?: string | null
          emotion_logs_count?: number | null
          has_shared_to_community?: boolean | null
          id?: string
          is_checked_in?: boolean | null
          last_emotion_log_at?: string | null
          progress_date?: string
          recommended_videos?: Json | null
          reflection_briefing_id?: string | null
          reflection_completed?: boolean | null
          reflection_completed_at?: string | null
          shared_at?: string | null
          updated_at?: string | null
          user_id?: string
          validation_passed?: boolean | null
          video_learning_completed?: boolean | null
          videos_watched_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "camp_daily_progress_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "training_camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camp_daily_progress_reflection_briefing_id_fkey"
            columns: ["reflection_briefing_id"]
            isOneToOne: false
            referencedRelation: "briefings"
            referencedColumns: ["id"]
          },
        ]
      }
      camp_daily_tasks: {
        Row: {
          camp_id: string
          completed_at: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_completed: boolean | null
          progress_date: string
          task_description: string | null
          task_title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          camp_id: string
          completed_at?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_completed?: boolean | null
          progress_date: string
          task_description?: string | null
          task_title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          camp_id?: string
          completed_at?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_completed?: boolean | null
          progress_date?: string
          task_description?: string | null
          task_title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "camp_daily_tasks_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "training_camps"
            referencedColumns: ["id"]
          },
        ]
      }
      camp_templates: {
        Row: {
          benefits: Json | null
          camp_name: string
          camp_subtitle: string | null
          camp_type: string
          category: string | null
          created_at: string | null
          daily_practice: Json | null
          description: string | null
          display_order: number | null
          duration_days: number
          gradient: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          learning_formats: Json | null
          original_price: number | null
          prerequisites: Json | null
          price: number | null
          price_note: string | null
          research_stats: Json | null
          stages: Json | null
          target_audience: Json | null
          theme_color: string | null
          updated_at: string | null
          weekly_activities: Json | null
        }
        Insert: {
          benefits?: Json | null
          camp_name: string
          camp_subtitle?: string | null
          camp_type: string
          category?: string | null
          created_at?: string | null
          daily_practice?: Json | null
          description?: string | null
          display_order?: number | null
          duration_days: number
          gradient?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          learning_formats?: Json | null
          original_price?: number | null
          prerequisites?: Json | null
          price?: number | null
          price_note?: string | null
          research_stats?: Json | null
          stages?: Json | null
          target_audience?: Json | null
          theme_color?: string | null
          updated_at?: string | null
          weekly_activities?: Json | null
        }
        Update: {
          benefits?: Json | null
          camp_name?: string
          camp_subtitle?: string | null
          camp_type?: string
          category?: string | null
          created_at?: string | null
          daily_practice?: Json | null
          description?: string | null
          display_order?: number | null
          duration_days?: number
          gradient?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          learning_formats?: Json | null
          original_price?: number | null
          prerequisites?: Json | null
          price?: number | null
          price_note?: string | null
          research_stats?: Json | null
          stages?: Json | null
          target_audience?: Json | null
          theme_color?: string | null
          updated_at?: string | null
          weekly_activities?: Json | null
        }
        Relationships: []
      }
      camp_video_tasks: {
        Row: {
          camp_id: string
          created_at: string | null
          id: string
          is_completed: boolean | null
          match_score: number | null
          progress_date: string
          reason: string | null
          user_id: string
          video_id: string
          watched_at: string | null
        }
        Insert: {
          camp_id: string
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          match_score?: number | null
          progress_date: string
          reason?: string | null
          user_id: string
          video_id: string
          watched_at?: string | null
        }
        Update: {
          camp_id?: string
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          match_score?: number | null
          progress_date?: string
          reason?: string | null
          user_id?: string
          video_id?: string
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "camp_video_tasks_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "training_camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camp_video_tasks_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          achievement_id: string | null
          action: string | null
          badges: Json | null
          briefing_id: string | null
          camp_day: number | null
          camp_id: string | null
          comments_count: number | null
          content: string | null
          created_at: string | null
          emotion_intensity: number | null
          emotion_theme: string | null
          id: string
          image_urls: string[] | null
          insight: string | null
          is_anonymous: boolean | null
          likes_count: number | null
          post_type: string
          shares_count: number | null
          title: string | null
          updated_at: string | null
          user_id: string
          visibility: string | null
        }
        Insert: {
          achievement_id?: string | null
          action?: string | null
          badges?: Json | null
          briefing_id?: string | null
          camp_day?: number | null
          camp_id?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          emotion_intensity?: number | null
          emotion_theme?: string | null
          id?: string
          image_urls?: string[] | null
          insight?: string | null
          is_anonymous?: boolean | null
          likes_count?: number | null
          post_type: string
          shares_count?: number | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          visibility?: string | null
        }
        Update: {
          achievement_id?: string | null
          action?: string | null
          badges?: Json | null
          briefing_id?: string | null
          camp_day?: number | null
          camp_id?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          emotion_intensity?: number | null
          emotion_theme?: string | null
          id?: string
          image_urls?: string[] | null
          insight?: string | null
          is_anonymous?: boolean | null
          likes_count?: number | null
          post_type?: string
          shares_count?: number | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "user_achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_briefing_id_fkey"
            columns: ["briefing_id"]
            isOneToOne: false
            referencedRelation: "briefings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "training_camps"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_logs: {
        Row: {
          contact_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          contact_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          id: string
          intimacy_level: number
          last_contact: string
          name: string
          notes: string | null
          relationship: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          intimacy_level: number
          last_contact?: string
          name: string
          notes?: string | null
          relationship: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          intimacy_level?: number
          last_contact?: string
          name?: string
          notes?: string | null
          relationship?: string
          user_id?: string
        }
        Relationships: []
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
      custom_carousel_cards: {
        Row: {
          action_data: Json | null
          action_text: string | null
          action_type: string | null
          background_type: string | null
          background_value: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          emoji: string | null
          has_reminder: boolean | null
          id: string
          image_position: string | null
          image_url: string | null
          is_active: boolean | null
          last_reminder_shown: string | null
          reminder_message: string | null
          reminder_time: string | null
          subtitle: string | null
          text_color: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_data?: Json | null
          action_text?: string | null
          action_type?: string | null
          background_type?: string | null
          background_value?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          emoji?: string | null
          has_reminder?: boolean | null
          id?: string
          image_position?: string | null
          image_url?: string | null
          is_active?: boolean | null
          last_reminder_shown?: string | null
          reminder_message?: string | null
          reminder_time?: string | null
          subtitle?: string | null
          text_color?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_data?: Json | null
          action_text?: string | null
          action_type?: string | null
          background_type?: string | null
          background_value?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          emoji?: string | null
          has_reminder?: boolean | null
          id?: string
          image_position?: string | null
          image_url?: string | null
          is_active?: boolean | null
          last_reminder_shown?: string | null
          reminder_message?: string | null
          reminder_time?: string | null
          subtitle?: string | null
          text_color?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      declaration_favorites: {
        Row: {
          created_at: string
          custom_background: string | null
          declaration: string
          id: string
          theme: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_background?: string | null
          declaration: string
          id?: string
          theme?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_background?: string | null
          declaration?: string
          id?: string
          theme?: string
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
      energy_logs: {
        Row: {
          emotional_energy: number | null
          id: string
          logged_at: string | null
          mental_energy: number | null
          notes: string | null
          physical_energy: number | null
          user_id: string
        }
        Insert: {
          emotional_energy?: number | null
          id?: string
          logged_at?: string | null
          mental_energy?: number | null
          notes?: string | null
          physical_energy?: number | null
          user_id: string
        }
        Update: {
          emotional_energy?: number | null
          id?: string
          logged_at?: string | null
          mental_energy?: number | null
          notes?: string | null
          physical_energy?: number | null
          user_id?: string
        }
        Relationships: []
      }
      energy_studio_tools: {
        Row: {
          category: string
          created_at: string | null
          description: string
          detailed_description: string | null
          display_order: number | null
          gradient: string | null
          icon_name: string
          id: string
          is_available: boolean | null
          is_system: boolean | null
          title: string
          tool_id: string
          updated_at: string | null
          usage_scenarios: Json | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          detailed_description?: string | null
          display_order?: number | null
          gradient?: string | null
          icon_name?: string
          id?: string
          is_available?: boolean | null
          is_system?: boolean | null
          title: string
          tool_id: string
          updated_at?: string | null
          usage_scenarios?: Json | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          detailed_description?: string | null
          display_order?: number | null
          gradient?: string | null
          icon_name?: string
          id?: string
          is_available?: boolean | null
          is_system?: boolean | null
          title?: string
          tool_id?: string
          updated_at?: string | null
          usage_scenarios?: Json | null
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          calories: number | null
          distance: number | null
          duration: number
          exercise_type: string
          id: string
          logged_at: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          calories?: number | null
          distance?: number | null
          duration: number
          exercise_type: string
          id?: string
          logged_at?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          calories?: number | null
          distance?: number | null
          duration?: number
          exercise_type?: string
          id?: string
          logged_at?: string | null
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      feature_definitions: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          display_order: number | null
          feature_key: string
          feature_name: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          feature_key: string
          feature_name: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          feature_key?: string
          feature_name?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      finance_records: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: string
          note: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          id?: string
          note?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          note?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      goal_templates: {
        Row: {
          camp_duration_days: number | null
          created_at: string
          daily_task_template: Json | null
          description: string | null
          goal_category: string | null
          goal_type: string
          id: string
          intensity_max: number | null
          intensity_min: number | null
          intensity_target_days: number | null
          is_training_camp: boolean | null
          last_used_at: string | null
          milestone_rewards: Json | null
          target_count: number
          target_reduction_percent: number | null
          target_tag_id: string | null
          target_tag_name: string | null
          template_category: string | null
          template_description: string | null
          template_icon: string | null
          template_name: string
          updated_at: string
          use_count: number | null
          user_id: string
        }
        Insert: {
          camp_duration_days?: number | null
          created_at?: string
          daily_task_template?: Json | null
          description?: string | null
          goal_category?: string | null
          goal_type: string
          id?: string
          intensity_max?: number | null
          intensity_min?: number | null
          intensity_target_days?: number | null
          is_training_camp?: boolean | null
          last_used_at?: string | null
          milestone_rewards?: Json | null
          target_count?: number
          target_reduction_percent?: number | null
          target_tag_id?: string | null
          target_tag_name?: string | null
          template_category?: string | null
          template_description?: string | null
          template_icon?: string | null
          template_name: string
          updated_at?: string
          use_count?: number | null
          user_id: string
        }
        Update: {
          camp_duration_days?: number | null
          created_at?: string
          daily_task_template?: Json | null
          description?: string | null
          goal_category?: string | null
          goal_type?: string
          id?: string
          intensity_max?: number | null
          intensity_min?: number | null
          intensity_target_days?: number | null
          is_training_camp?: boolean | null
          last_used_at?: string | null
          milestone_rewards?: Json | null
          target_count?: number
          target_reduction_percent?: number | null
          target_tag_id?: string | null
          target_tag_name?: string | null
          template_category?: string | null
          template_description?: string | null
          template_icon?: string | null
          template_name?: string
          updated_at?: string
          use_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      gratitude_entries: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          completed: boolean | null
          created_at: string | null
          habit_id: string
          id: string
          logged_at: string | null
          notes: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          habit_id: string
          id?: string
          logged_at?: string | null
          notes?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          habit_id?: string
          id?: string
          logged_at?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          target_frequency: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          target_frequency?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          target_frequency?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meditation_sessions: {
        Row: {
          background_sound: string | null
          created_at: string | null
          duration: number
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          background_sound?: string | null
          created_at?: string | null
          duration: number
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          background_sound?: string | null
          created_at?: string | null
          duration?: number
          id?: string
          notes?: string | null
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
      package_features: {
        Row: {
          access_level: string | null
          access_value: string | null
          created_at: string | null
          feature_id: string | null
          id: string
          package_id: string | null
        }
        Insert: {
          access_level?: string | null
          access_value?: string | null
          created_at?: string | null
          feature_id?: string | null
          id?: string
          package_id?: string | null
        }
        Update: {
          access_level?: string | null
          access_value?: string | null
          created_at?: string | null
          feature_id?: string | null
          id?: string
          package_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_features_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "feature_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_features_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          ai_quota: number | null
          created_at: string | null
          description: string | null
          display_order: number | null
          duration_days: number | null
          id: string
          is_active: boolean | null
          original_price: number | null
          package_key: string
          package_name: string
          price: number | null
          product_line: string
          updated_at: string | null
        }
        Insert: {
          ai_quota?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_days?: number | null
          id?: string
          is_active?: boolean | null
          original_price?: number | null
          package_key: string
          package_name: string
          price?: number | null
          product_line: string
          updated_at?: string | null
        }
        Update: {
          ai_quota?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_days?: number | null
          id?: string
          is_active?: boolean | null
          original_price?: number | null
          package_key?: string
          package_name?: string
          price?: number | null
          product_line?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      parent_coaching_sessions: {
        Row: {
          briefing_id: string | null
          camp_id: string | null
          child_type: string | null
          conversation_id: string | null
          created_at: string | null
          current_stage: number | null
          event_description: string | null
          feel_it: Json | null
          id: string
          messages: Json | null
          micro_action: string | null
          see_it: Json | null
          sense_it: Json | null
          stage_selections: Json | null
          status: string | null
          summary: string | null
          transform_it: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          briefing_id?: string | null
          camp_id?: string | null
          child_type?: string | null
          conversation_id?: string | null
          created_at?: string | null
          current_stage?: number | null
          event_description?: string | null
          feel_it?: Json | null
          id?: string
          messages?: Json | null
          micro_action?: string | null
          see_it?: Json | null
          sense_it?: Json | null
          stage_selections?: Json | null
          status?: string | null
          summary?: string | null
          transform_it?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          briefing_id?: string | null
          camp_id?: string | null
          child_type?: string | null
          conversation_id?: string | null
          created_at?: string | null
          current_stage?: number | null
          event_description?: string | null
          feel_it?: Json | null
          id?: string
          messages?: Json | null
          micro_action?: string | null
          see_it?: Json | null
          sense_it?: Json | null
          stage_selections?: Json | null
          status?: string | null
          summary?: string | null
          transform_it?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_coaching_sessions_briefing_id_fkey"
            columns: ["briefing_id"]
            isOneToOne: false
            referencedRelation: "briefings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_coaching_sessions_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "training_camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_coaching_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_session_tags: {
        Row: {
          created_at: string | null
          id: string
          session_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          session_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          session_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_session_tags_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "parent_coaching_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_session_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "parent_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_benefits: {
        Row: {
          benefit_description: string | null
          benefit_icon: string | null
          benefit_name: string
          benefit_value: number | null
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
        }
        Insert: {
          benefit_description?: string | null
          benefit_icon?: string | null
          benefit_name: string
          benefit_value?: number | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
        }
        Update: {
          benefit_description?: string | null
          benefit_icon?: string | null
          benefit_name?: string
          benefit_value?: number | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      partner_commissions: {
        Row: {
          commission_amount: number
          commission_level: number
          commission_rate: number
          confirm_at: string | null
          confirmed_at: string | null
          created_at: string
          id: string
          order_amount: number
          order_id: string
          order_type: string
          partner_id: string
          product_line: string | null
          source_user_id: string
          status: string
        }
        Insert: {
          commission_amount: number
          commission_level: number
          commission_rate: number
          confirm_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          order_amount: number
          order_id: string
          order_type: string
          partner_id: string
          product_line?: string | null
          source_user_id: string
          status?: string
        }
        Update: {
          commission_amount?: number
          commission_level?: number
          commission_rate?: number
          confirm_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          order_amount?: number
          order_id?: string
          order_type?: string
          partner_id?: string
          product_line?: string | null
          source_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_level_rules: {
        Row: {
          commission_rate_l1: number
          commission_rate_l2: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          level_name: string
          min_prepurchase: number
          partner_type: string
        }
        Insert: {
          commission_rate_l1: number
          commission_rate_l2?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level_name: string
          min_prepurchase: number
          partner_type: string
        }
        Update: {
          commission_rate_l1?: number
          commission_rate_l2?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level_name?: string
          min_prepurchase?: number
          partner_type?: string
        }
        Relationships: []
      }
      partner_redemption_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          id: string
          partner_id: string
          redeemed_at: string | null
          redeemed_by: string | null
          status: string
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          partner_id: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          status?: string
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          partner_id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_redemption_codes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_referrals: {
        Row: {
          created_at: string
          id: string
          level: number
          parent_referral_id: string | null
          partner_id: string
          referred_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number
          parent_referral_id?: string | null
          partner_id: string
          referred_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          parent_referral_id?: string | null
          partner_id?: string
          referred_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_referrals_parent_referral_id_fkey"
            columns: ["parent_referral_id"]
            isOneToOne: false
            referencedRelation: "partner_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_referrals_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_withdrawals: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          partner_id: string
          payment_info: Json
          payment_method: string
          processed_at: string | null
          processed_by: string | null
          status: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          id?: string
          partner_id: string
          payment_info: Json
          payment_method: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          partner_id?: string
          payment_info?: Json
          payment_method?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_withdrawals_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          available_balance: number
          commission_rate_l1: number
          commission_rate_l2: number
          created_at: string
          id: string
          partner_code: string
          partner_level: string | null
          partner_type: string | null
          pending_balance: number
          prepurchase_count: number | null
          prepurchase_expires_at: string | null
          source: string
          source_admin_id: string | null
          source_note: string | null
          source_order_id: string | null
          status: string
          total_earnings: number
          total_l2_referrals: number
          total_referrals: number
          updated_at: string
          user_id: string
          withdrawn_amount: number
        }
        Insert: {
          available_balance?: number
          commission_rate_l1?: number
          commission_rate_l2?: number
          created_at?: string
          id?: string
          partner_code: string
          partner_level?: string | null
          partner_type?: string | null
          pending_balance?: number
          prepurchase_count?: number | null
          prepurchase_expires_at?: string | null
          source?: string
          source_admin_id?: string | null
          source_note?: string | null
          source_order_id?: string | null
          status?: string
          total_earnings?: number
          total_l2_referrals?: number
          total_referrals?: number
          updated_at?: string
          user_id: string
          withdrawn_amount?: number
        }
        Update: {
          available_balance?: number
          commission_rate_l1?: number
          commission_rate_l2?: number
          created_at?: string
          id?: string
          partner_code?: string
          partner_level?: string | null
          partner_type?: string | null
          pending_balance?: number
          prepurchase_count?: number | null
          prepurchase_expires_at?: string | null
          source?: string
          source_admin_id?: string | null
          source_note?: string | null
          source_order_id?: string | null
          status?: string
          total_earnings?: number
          total_l2_referrals?: number
          total_referrals?: number
          updated_at?: string
          user_id?: string
          withdrawn_amount?: number
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_anonymous: boolean | null
          likes_count: number | null
          parent_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          post_id: string
          reason: string
          reporter_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          post_id: string
          reason: string
          reporter_id: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          post_id?: string
          reason?: string
          reporter_id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          camp_checkin_requirement: string | null
          camp_evening_reminder_time: string | null
          camp_late_warning_enabled: boolean | null
          camp_makeup_allowed: boolean | null
          camp_makeup_days_limit: number | null
          camp_morning_reminder_time: string | null
          carousel_auto_play: boolean | null
          carousel_interval: number | null
          carousel_modules: Json | null
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
          reminder_auto_dismiss_seconds: number | null
          reminder_enabled: boolean | null
          reminder_time: string | null
          smart_notification_enabled: boolean | null
          updated_at: string
          voice_gender: string | null
          voice_rate: number | null
          wechat_appid: string | null
          wechat_appsecret: string | null
          wechat_enabled: boolean | null
          wechat_encoding_aes_key: string | null
          wechat_proxy_auth_token: string | null
          wechat_proxy_enabled: boolean | null
          wechat_proxy_url: string | null
          wechat_template_ids: Json | null
          wechat_token: string | null
          wecom_agent_id: string | null
          wecom_bot_enabled: boolean | null
          wecom_bot_encoding_aes_key: string | null
          wecom_bot_token: string | null
          wecom_corp_id: string | null
          wecom_corp_secret: string | null
          wecom_enabled: boolean | null
          wecom_mention_all: boolean | null
          wecom_webhook_url: string | null
        }
        Insert: {
          camp_checkin_requirement?: string | null
          camp_evening_reminder_time?: string | null
          camp_late_warning_enabled?: boolean | null
          camp_makeup_allowed?: boolean | null
          camp_makeup_days_limit?: number | null
          camp_morning_reminder_time?: string | null
          carousel_auto_play?: boolean | null
          carousel_interval?: number | null
          carousel_modules?: Json | null
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
          reminder_auto_dismiss_seconds?: number | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          smart_notification_enabled?: boolean | null
          updated_at?: string
          voice_gender?: string | null
          voice_rate?: number | null
          wechat_appid?: string | null
          wechat_appsecret?: string | null
          wechat_enabled?: boolean | null
          wechat_encoding_aes_key?: string | null
          wechat_proxy_auth_token?: string | null
          wechat_proxy_enabled?: boolean | null
          wechat_proxy_url?: string | null
          wechat_template_ids?: Json | null
          wechat_token?: string | null
          wecom_agent_id?: string | null
          wecom_bot_enabled?: boolean | null
          wecom_bot_encoding_aes_key?: string | null
          wecom_bot_token?: string | null
          wecom_corp_id?: string | null
          wecom_corp_secret?: string | null
          wecom_enabled?: boolean | null
          wecom_mention_all?: boolean | null
          wecom_webhook_url?: string | null
        }
        Update: {
          camp_checkin_requirement?: string | null
          camp_evening_reminder_time?: string | null
          camp_late_warning_enabled?: boolean | null
          camp_makeup_allowed?: boolean | null
          camp_makeup_days_limit?: number | null
          camp_morning_reminder_time?: string | null
          carousel_auto_play?: boolean | null
          carousel_interval?: number | null
          carousel_modules?: Json | null
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
          reminder_auto_dismiss_seconds?: number | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          smart_notification_enabled?: boolean | null
          updated_at?: string
          voice_gender?: string | null
          voice_rate?: number | null
          wechat_appid?: string | null
          wechat_appsecret?: string | null
          wechat_enabled?: boolean | null
          wechat_encoding_aes_key?: string | null
          wechat_proxy_auth_token?: string | null
          wechat_proxy_enabled?: boolean | null
          wechat_proxy_url?: string | null
          wechat_template_ids?: Json | null
          wechat_token?: string | null
          wecom_agent_id?: string | null
          wecom_bot_enabled?: boolean | null
          wecom_bot_encoding_aes_key?: string | null
          wecom_bot_token?: string | null
          wecom_corp_id?: string | null
          wecom_corp_secret?: string | null
          wecom_enabled?: boolean | null
          wecom_mention_all?: boolean | null
          wecom_webhook_url?: string | null
        }
        Relationships: []
      }
      sleep_logs: {
        Row: {
          created_at: string | null
          id: string
          logged_at: string | null
          notes: string | null
          quality_score: number | null
          sleep_time: string
          user_id: string
          wake_time: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          logged_at?: string | null
          notes?: string | null
          quality_score?: number | null
          sleep_time: string
          user_id: string
          wake_time: string
        }
        Update: {
          created_at?: string | null
          id?: string
          logged_at?: string | null
          notes?: string | null
          quality_score?: number | null
          sleep_time?: string
          user_id?: string
          wake_time?: string
        }
        Relationships: []
      }
      smart_notifications: {
        Row: {
          action_data: Json | null
          action_text: string | null
          action_type: string | null
          coach_type: string | null
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
          coach_type?: string | null
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
          coach_type?: string | null
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
      sms_verification_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          id: string
          phone_number: string
          purpose: string
          verified_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          phone_number: string
          purpose?: string
          verified_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          phone_number?: string
          purpose?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          combo_amount: number | null
          combo_name: string | null
          created_at: string
          end_date: string | null
          id: string
          mysql_combo_id: string | null
          mysql_order_id: string | null
          package_id: string | null
          start_date: string
          status: string
          subscription_type: string
          total_quota: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          combo_amount?: number | null
          combo_name?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          mysql_combo_id?: string | null
          mysql_order_id?: string | null
          package_id?: string | null
          start_date?: string
          status?: string
          subscription_type: string
          total_quota?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          combo_amount?: number | null
          combo_name?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          mysql_combo_id?: string | null
          mysql_order_id?: string | null
          package_id?: string | null
          start_date?: string
          status?: string
          subscription_type?: string
          total_quota?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
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
      tasks: {
        Row: {
          completed: boolean | null
          created_at: string
          estimated_time: number | null
          id: string
          priority: string
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          estimated_time?: number | null
          id?: string
          priority: string
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          estimated_time?: number | null
          id?: string
          priority?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      training_camps: {
        Row: {
          camp_name: string
          camp_type: string
          check_in_dates: Json | null
          completed_days: number | null
          created_at: string
          current_day: number | null
          duration_days: number
          end_date: string
          id: string
          milestone_14_reached: boolean | null
          milestone_21_completed: boolean | null
          milestone_7_reached: boolean | null
          start_date: string
          status: string | null
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          camp_name?: string
          camp_type?: string
          check_in_dates?: Json | null
          completed_days?: number | null
          created_at?: string
          current_day?: number | null
          duration_days?: number
          end_date: string
          id?: string
          milestone_14_reached?: boolean | null
          milestone_21_completed?: boolean | null
          milestone_7_reached?: boolean | null
          start_date: string
          status?: string | null
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          camp_name?: string
          camp_type?: string
          check_in_dates?: Json | null
          completed_days?: number | null
          created_at?: string
          current_day?: number | null
          duration_days?: number
          end_date?: string
          id?: string
          milestone_14_reached?: boolean | null
          milestone_21_completed?: boolean | null
          milestone_7_reached?: boolean | null
          start_date?: string
          status?: string | null
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_records: {
        Row: {
          amount: number
          conversation_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          record_type: string
          source: string
          user_id: string
        }
        Insert: {
          amount?: number
          conversation_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          record_type: string
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          conversation_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          record_type?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      user_accounts: {
        Row: {
          created_at: string
          id: string
          last_sync_at: string | null
          mysql_user_id: string | null
          mysql_uuid: string | null
          quota_expires_at: string | null
          remaining_quota: number | null
          sync_source: string | null
          total_quota: number
          updated_at: string
          used_quota: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_sync_at?: string | null
          mysql_user_id?: string | null
          mysql_uuid?: string | null
          quota_expires_at?: string | null
          remaining_quota?: number | null
          sync_source?: string | null
          total_quota?: number
          updated_at?: string
          used_quota?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_sync_at?: string | null
          mysql_user_id?: string | null
          mysql_uuid?: string | null
          quota_expires_at?: string | null
          remaining_quota?: number | null
          sync_source?: string | null
          total_quota?: number
          updated_at?: string
          used_quota?: number
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
      user_camp_purchases: {
        Row: {
          camp_name: string
          camp_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          payment_method: string | null
          payment_status: string | null
          purchase_price: number
          purchased_at: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          camp_name: string
          camp_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          purchase_price: number
          purchased_at?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          camp_name?: string
          camp_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          purchase_price?: number
          purchased_at?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
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
      user_values: {
        Row: {
          created_at: string | null
          id: string
          priority: number | null
          user_id: string
          value_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          priority?: number | null
          user_id: string
          value_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          priority?: number | null
          user_id?: string
          value_name?: string
        }
        Relationships: []
      }
      video_courses: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          keywords: string[] | null
          source: string | null
          tags: string[] | null
          title: string
          video_url: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          keywords?: string[] | null
          source?: string | null
          tags?: string[] | null
          title: string
          video_url: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          keywords?: string[] | null
          source?: string | null
          tags?: string[] | null
          title?: string
          video_url?: string
        }
        Relationships: []
      }
      video_favorites: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_favorites_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      video_watch_history: {
        Row: {
          completed: boolean | null
          id: string
          user_id: string
          video_id: string
          watch_duration: number | null
          watched_at: string | null
        }
        Insert: {
          completed?: boolean | null
          id?: string
          user_id: string
          video_id: string
          watch_duration?: number | null
          watched_at?: string | null
        }
        Update: {
          completed?: boolean | null
          id?: string
          user_id?: string
          video_id?: string
          watch_duration?: number | null
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_watch_history_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      vision_items: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      wechat_template_messages: {
        Row: {
          data: Json
          error_message: string | null
          id: string
          msgid: string | null
          openid: string
          scenario: string
          sent_at: string | null
          status: string | null
          template_id: string
          url: string | null
          user_id: string
        }
        Insert: {
          data: Json
          error_message?: string | null
          id?: string
          msgid?: string | null
          openid: string
          scenario: string
          sent_at?: string | null
          status?: string | null
          template_id: string
          url?: string | null
          user_id: string
        }
        Update: {
          data?: Json
          error_message?: string | null
          id?: string
          msgid?: string | null
          openid?: string
          scenario?: string
          sent_at?: string | null
          status?: string | null
          template_id?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wechat_user_mappings: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          is_registered: boolean | null
          nickname: string | null
          openid: string
          phone_number: string | null
          registered_at: string | null
          subscribe_status: boolean | null
          subscribe_time: string | null
          system_user_id: string
          unionid: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          is_registered?: boolean | null
          nickname?: string | null
          openid: string
          phone_number?: string | null
          registered_at?: string | null
          subscribe_status?: boolean | null
          subscribe_time?: string | null
          system_user_id: string
          unionid?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          is_registered?: boolean | null
          nickname?: string | null
          openid?: string
          phone_number?: string | null
          registered_at?: string | null
          subscribe_status?: boolean | null
          subscribe_time?: string | null
          system_user_id?: string
          unionid?: string | null
          updated_at?: string | null
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
      deduct_user_quota: {
        Args: { p_amount?: number; p_user_id: string }
        Returns: {
          remaining_quota: number
        }[]
      }
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
