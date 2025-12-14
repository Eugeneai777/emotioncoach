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
      api_cost_logs: {
        Row: {
          created_at: string | null
          estimated_cost_cny: number | null
          estimated_cost_usd: number | null
          feature_key: string | null
          function_name: string
          id: string
          input_tokens: number | null
          metadata: Json | null
          model: string | null
          output_tokens: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          estimated_cost_cny?: number | null
          estimated_cost_usd?: number | null
          feature_key?: string | null
          function_name: string
          id?: string
          input_tokens?: number | null
          metadata?: Json | null
          model?: string | null
          output_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          estimated_cost_cny?: number | null
          estimated_cost_usd?: number | null
          feature_key?: string | null
          function_name?: string
          id?: string
          input_tokens?: number | null
          metadata?: Json | null
          model?: string | null
          output_tokens?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      appointment_reviews: {
        Row: {
          appointment_id: string
          coach_id: string
          coach_replied_at: string | null
          coach_reply: string | null
          comment: string | null
          created_at: string | null
          flag_reason: string | null
          id: string
          is_anonymous: boolean | null
          is_flagged: boolean | null
          is_visible: boolean | null
          quick_tags: string[] | null
          rating_communication: number | null
          rating_helpfulness: number | null
          rating_overall: number
          rating_professionalism: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          appointment_id: string
          coach_id: string
          coach_replied_at?: string | null
          coach_reply?: string | null
          comment?: string | null
          created_at?: string | null
          flag_reason?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_flagged?: boolean | null
          is_visible?: boolean | null
          quick_tags?: string[] | null
          rating_communication?: number | null
          rating_helpfulness?: number | null
          rating_overall: number
          rating_professionalism?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          appointment_id?: string
          coach_id?: string
          coach_replied_at?: string | null
          coach_reply?: string | null
          comment?: string | null
          created_at?: string | null
          flag_reason?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_flagged?: boolean | null
          is_visible?: boolean | null
          quick_tags?: string[] | null
          rating_communication?: number | null
          rating_helpfulness?: number | null
          rating_overall?: number
          rating_professionalism?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "coaching_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_reviews_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "human_coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_corrections: {
        Row: {
          alert_id: string | null
          completed_at: string | null
          correction_amount: number
          correction_type: string
          created_at: string
          error_message: string | null
          expected_amount: number
          feature_key: string | null
          feature_name: string | null
          id: string
          original_amount: number
          status: string
          usage_record_id: string | null
          user_id: string
        }
        Insert: {
          alert_id?: string | null
          completed_at?: string | null
          correction_amount: number
          correction_type: string
          created_at?: string
          error_message?: string | null
          expected_amount: number
          feature_key?: string | null
          feature_name?: string | null
          id?: string
          original_amount: number
          status?: string
          usage_record_id?: string | null
          user_id: string
        }
        Update: {
          alert_id?: string | null
          completed_at?: string | null
          correction_amount?: number
          correction_type?: string
          created_at?: string
          error_message?: string | null
          expected_amount?: number
          feature_key?: string | null
          feature_name?: string | null
          id?: string
          original_amount?: number
          status?: string
          usage_record_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_corrections_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "cost_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
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
      coach_call_signals: {
        Row: {
          call_id: string | null
          created_at: string | null
          from_user_id: string
          id: string
          signal_data: Json
          signal_type: string
          to_user_id: string
        }
        Insert: {
          call_id?: string | null
          created_at?: string | null
          from_user_id: string
          id?: string
          signal_data: Json
          signal_type: string
          to_user_id: string
        }
        Update: {
          call_id?: string | null
          created_at?: string | null
          from_user_id?: string
          id?: string
          signal_data?: Json
          signal_type?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_call_signals_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "coach_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_calls: {
        Row: {
          appointment_id: string | null
          call_status: string
          callee_id: string
          caller_id: string
          caller_type: string
          connected_at: string | null
          created_at: string | null
          duration_seconds: number | null
          end_reason: string | null
          ended_at: string | null
          id: string
          quality_rating: number | null
          started_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          call_status?: string
          callee_id: string
          caller_id: string
          caller_type: string
          connected_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          quality_rating?: number | null
          started_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          call_status?: string
          callee_id?: string
          caller_id?: string
          caller_type?: string
          connected_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          quality_rating?: number | null
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_calls_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "coaching_appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_certifications: {
        Row: {
          admin_note: string | null
          cert_name: string
          cert_number: string | null
          cert_type: string
          coach_id: string
          created_at: string | null
          expiry_date: string | null
          id: string
          image_url: string | null
          issue_date: string | null
          issuing_authority: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_note?: string | null
          cert_name: string
          cert_number?: string | null
          cert_type: string
          coach_id: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          issue_date?: string | null
          issuing_authority?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_note?: string | null
          cert_name?: string
          cert_number?: string | null
          cert_type?: string
          coach_id?: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          issue_date?: string | null
          issuing_authority?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_certifications_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "human_coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_prompt_versions: {
        Row: {
          change_note: string | null
          coach_template_id: string
          created_at: string | null
          created_by: string | null
          id: string
          stage_prompts: Json | null
          system_prompt: string
          version_number: number
        }
        Insert: {
          change_note?: string | null
          coach_template_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          stage_prompts?: Json | null
          system_prompt: string
          version_number: number
        }
        Update: {
          change_note?: string | null
          coach_template_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          stage_prompts?: Json | null
          system_prompt?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "coach_prompt_versions_coach_template_id_fkey"
            columns: ["coach_template_id"]
            isOneToOne: false
            referencedRelation: "coach_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_services: {
        Row: {
          advance_booking_days: number | null
          cancel_hours_before: number | null
          coach_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          price: number
          service_name: string
        }
        Insert: {
          advance_booking_days?: number | null
          cancel_hours_before?: number | null
          coach_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          price: number
          service_name: string
        }
        Update: {
          advance_booking_days?: number | null
          cancel_hours_before?: number | null
          coach_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          price?: number
          service_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_services_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "human_coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_templates: {
        Row: {
          briefing_table_name: string | null
          briefing_tool_config: Json | null
          coach_key: string
          created_at: string | null
          description: string | null
          disable_option_buttons: boolean | null
          display_order: number | null
          edge_function_name: string | null
          emoji: string
          enable_briefing_share: boolean | null
          enable_community: boolean | null
          enable_daily_reminder: boolean | null
          enable_emotion_alert: boolean | null
          enable_intensity_tracking: boolean | null
          enable_notifications: boolean | null
          enable_onboarding: boolean | null
          enable_scenarios: boolean | null
          enable_training_camp: boolean | null
          enable_voice_control: boolean | null
          gradient: string | null
          history_label: string | null
          history_label_short: string | null
          history_route: string
          id: string
          is_active: boolean | null
          is_prompt_locked: boolean | null
          is_system: boolean | null
          more_info_route: string | null
          page_route: string
          placeholder: string | null
          primary_color: string | null
          prompt_locked_at: string | null
          prompt_locked_by: string | null
          scenarios: Json | null
          stage_prompts: Json | null
          steps: Json | null
          steps_emoji: string | null
          steps_title: string | null
          subtitle: string | null
          system_prompt: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          briefing_table_name?: string | null
          briefing_tool_config?: Json | null
          coach_key: string
          created_at?: string | null
          description?: string | null
          disable_option_buttons?: boolean | null
          display_order?: number | null
          edge_function_name?: string | null
          emoji?: string
          enable_briefing_share?: boolean | null
          enable_community?: boolean | null
          enable_daily_reminder?: boolean | null
          enable_emotion_alert?: boolean | null
          enable_intensity_tracking?: boolean | null
          enable_notifications?: boolean | null
          enable_onboarding?: boolean | null
          enable_scenarios?: boolean | null
          enable_training_camp?: boolean | null
          enable_voice_control?: boolean | null
          gradient?: string | null
          history_label?: string | null
          history_label_short?: string | null
          history_route: string
          id?: string
          is_active?: boolean | null
          is_prompt_locked?: boolean | null
          is_system?: boolean | null
          more_info_route?: string | null
          page_route: string
          placeholder?: string | null
          primary_color?: string | null
          prompt_locked_at?: string | null
          prompt_locked_by?: string | null
          scenarios?: Json | null
          stage_prompts?: Json | null
          steps?: Json | null
          steps_emoji?: string | null
          steps_title?: string | null
          subtitle?: string | null
          system_prompt?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          briefing_table_name?: string | null
          briefing_tool_config?: Json | null
          coach_key?: string
          created_at?: string | null
          description?: string | null
          disable_option_buttons?: boolean | null
          display_order?: number | null
          edge_function_name?: string | null
          emoji?: string
          enable_briefing_share?: boolean | null
          enable_community?: boolean | null
          enable_daily_reminder?: boolean | null
          enable_emotion_alert?: boolean | null
          enable_intensity_tracking?: boolean | null
          enable_notifications?: boolean | null
          enable_onboarding?: boolean | null
          enable_scenarios?: boolean | null
          enable_training_camp?: boolean | null
          enable_voice_control?: boolean | null
          gradient?: string | null
          history_label?: string | null
          history_label_short?: string | null
          history_route?: string
          id?: string
          is_active?: boolean | null
          is_prompt_locked?: boolean | null
          is_system?: boolean | null
          more_info_route?: string | null
          page_route?: string
          placeholder?: string | null
          primary_color?: string | null
          prompt_locked_at?: string | null
          prompt_locked_by?: string | null
          scenarios?: Json | null
          stage_prompts?: Json | null
          steps?: Json | null
          steps_emoji?: string | null
          steps_title?: string | null
          subtitle?: string | null
          system_prompt?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      coach_time_slots: {
        Row: {
          appointment_id: string | null
          coach_id: string
          created_at: string | null
          end_time: string
          id: string
          slot_date: string
          start_time: string
          status: string | null
        }
        Insert: {
          appointment_id?: string | null
          coach_id: string
          created_at?: string | null
          end_time: string
          id?: string
          slot_date: string
          start_time: string
          status?: string | null
        }
        Update: {
          appointment_id?: string | null
          coach_id?: string
          created_at?: string | null
          end_time?: string
          id?: string
          slot_date?: string
          start_time?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_time_slots_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "human_coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_appointments: {
        Row: {
          amount_paid: number
          appointment_date: string
          cancel_reason: string | null
          cancelled_at: string | null
          coach_id: string
          coach_notes: string | null
          created_at: string | null
          duration_minutes: number
          end_time: string
          id: string
          meeting_link: string | null
          meeting_type: string | null
          order_id: string | null
          payment_status: string | null
          reviewed_at: string | null
          room_id: string | null
          service_id: string | null
          service_name: string | null
          slot_id: string | null
          start_time: string
          status: string | null
          updated_at: string | null
          user_id: string
          user_notes: string | null
        }
        Insert: {
          amount_paid: number
          appointment_date: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          coach_id: string
          coach_notes?: string | null
          created_at?: string | null
          duration_minutes: number
          end_time: string
          id?: string
          meeting_link?: string | null
          meeting_type?: string | null
          order_id?: string | null
          payment_status?: string | null
          reviewed_at?: string | null
          room_id?: string | null
          service_id?: string | null
          service_name?: string | null
          slot_id?: string | null
          start_time: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          user_notes?: string | null
        }
        Update: {
          amount_paid?: number
          appointment_date?: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          coach_id?: string
          coach_notes?: string | null
          created_at?: string | null
          duration_minutes?: number
          end_time?: string
          id?: string
          meeting_link?: string | null
          meeting_type?: string | null
          order_id?: string | null
          payment_status?: string | null
          reviewed_at?: string | null
          room_id?: string | null
          service_id?: string | null
          service_name?: string | null
          slot_id?: string | null
          start_time?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coaching_appointments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "human_coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "coach_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_appointments_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "coach_time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_briefing_tags: {
        Row: {
          communication_briefing_id: string
          created_at: string | null
          id: string
          tag_id: string
        }
        Insert: {
          communication_briefing_id: string
          created_at?: string | null
          id?: string
          tag_id: string
        }
        Update: {
          communication_briefing_id?: string
          created_at?: string | null
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_briefing_tags_communication_briefing_id_fkey"
            columns: ["communication_briefing_id"]
            isOneToOne: false
            referencedRelation: "communication_briefings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_briefing_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "communication_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_briefings: {
        Row: {
          act_content: string | null
          action_completed: boolean | null
          avoid_script: string | null
          communication_difficulty: number | null
          communication_theme: string
          conversation_id: string | null
          created_at: string | null
          difficulty_keywords: string[] | null
          growth_insight: string | null
          id: string
          influence_content: string | null
          micro_action: string | null
          outcome_feedback_at: string | null
          outcome_rating: number | null
          perspective_shift: string | null
          recommended_script: string | null
          scenario_analysis: string | null
          scenario_type: string | null
          see_content: string | null
          strategy: string | null
          target_type: string | null
          understand_content: string | null
        }
        Insert: {
          act_content?: string | null
          action_completed?: boolean | null
          avoid_script?: string | null
          communication_difficulty?: number | null
          communication_theme: string
          conversation_id?: string | null
          created_at?: string | null
          difficulty_keywords?: string[] | null
          growth_insight?: string | null
          id?: string
          influence_content?: string | null
          micro_action?: string | null
          outcome_feedback_at?: string | null
          outcome_rating?: number | null
          perspective_shift?: string | null
          recommended_script?: string | null
          scenario_analysis?: string | null
          scenario_type?: string | null
          see_content?: string | null
          strategy?: string | null
          target_type?: string | null
          understand_content?: string | null
        }
        Update: {
          act_content?: string | null
          action_completed?: boolean | null
          avoid_script?: string | null
          communication_difficulty?: number | null
          communication_theme?: string
          conversation_id?: string | null
          created_at?: string | null
          difficulty_keywords?: string[] | null
          growth_insight?: string | null
          id?: string
          influence_content?: string | null
          micro_action?: string | null
          outcome_feedback_at?: string | null
          outcome_rating?: number | null
          perspective_shift?: string | null
          recommended_script?: string | null
          scenario_analysis?: string | null
          scenario_type?: string | null
          see_content?: string | null
          strategy?: string | null
          target_type?: string | null
          understand_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_briefings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_coaching_sessions: {
        Row: {
          act_content: Json | null
          briefing_requested: boolean | null
          conversation_id: string | null
          created_at: string | null
          current_stage: number | null
          id: string
          influence_content: Json | null
          messages: Json | null
          scenario_description: string | null
          see_content: Json | null
          stage_selections: Json | null
          status: string | null
          understand_content: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          act_content?: Json | null
          briefing_requested?: boolean | null
          conversation_id?: string | null
          created_at?: string | null
          current_stage?: number | null
          id?: string
          influence_content?: Json | null
          messages?: Json | null
          scenario_description?: string | null
          see_content?: Json | null
          stage_selections?: Json | null
          status?: string | null
          understand_content?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          act_content?: Json | null
          briefing_requested?: boolean | null
          conversation_id?: string | null
          created_at?: string | null
          current_stage?: number | null
          id?: string
          influence_content?: Json | null
          messages?: Json | null
          scenario_description?: string | null
          see_content?: Json | null
          stage_selections?: Json | null
          status?: string | null
          understand_content?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_coaching_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_tags: {
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
      cost_alert_settings: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          notify_email: string | null
          notify_wecom: boolean | null
          threshold_cny: number
          updated_at: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notify_email?: string | null
          notify_wecom?: boolean | null
          threshold_cny: number
          updated_at?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notify_email?: string | null
          notify_wecom?: boolean | null
          threshold_cny?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      cost_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          actual_cost_cny: number | null
          alert_message: string | null
          alert_type: string
          correction_id: string | null
          correction_status: string | null
          created_at: string | null
          id: string
          is_acknowledged: boolean | null
          metadata: Json | null
          threshold_cny: number | null
          user_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actual_cost_cny?: number | null
          alert_message?: string | null
          alert_type: string
          correction_id?: string | null
          correction_status?: string | null
          created_at?: string | null
          id?: string
          is_acknowledged?: boolean | null
          metadata?: Json | null
          threshold_cny?: number | null
          user_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actual_cost_cny?: number | null
          alert_message?: string | null
          alert_type?: string
          correction_id?: string | null
          correction_status?: string | null
          created_at?: string | null
          id?: string
          is_acknowledged?: boolean | null
          metadata?: Json | null
          threshold_cny?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_alerts_correction_id_fkey"
            columns: ["correction_id"]
            isOneToOne: false
            referencedRelation: "billing_corrections"
            referencedColumns: ["id"]
          },
        ]
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
      customer_service_config: {
        Row: {
          config_key: string
          config_value: Json
          description: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_value: Json
          description?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          description?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      customer_tickets: {
        Row: {
          category: string | null
          contact_info: string | null
          created_at: string
          description: string
          id: string
          priority: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          subject: string
          ticket_no: string
          ticket_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          contact_info?: string | null
          created_at?: string
          description: string
          id?: string
          priority?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          subject: string
          ticket_no: string
          ticket_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          contact_info?: string | null
          created_at?: string
          description?: string
          id?: string
          priority?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          subject?: string
          ticket_no?: string
          ticket_type?: string
          updated_at?: string
          user_id?: string | null
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
      emotion_coach_preferences: {
        Row: {
          category: string
          created_at: string | null
          custom_option: string
          frequency: number | null
          id: string
          stage: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          custom_option: string
          frequency?: number | null
          id?: string
          stage: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          custom_option?: string
          frequency?: number | null
          id?: string
          stage?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      emotion_coaching_sessions: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          current_stage: number | null
          event_summary: string | null
          id: string
          messages: Json | null
          stage_1_insight: string | null
          stage_2_insight: string | null
          stage_3_insight: string | null
          stage_4_insight: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          current_stage?: number | null
          event_summary?: string | null
          id?: string
          messages?: Json | null
          stage_1_insight?: string | null
          stage_2_insight?: string | null
          stage_3_insight?: string | null
          stage_4_insight?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          current_stage?: number | null
          event_summary?: string | null
          id?: string
          messages?: Json | null
          stage_1_insight?: string | null
          stage_2_insight?: string | null
          stage_3_insight?: string | null
          stage_4_insight?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emotion_coaching_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
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
      feature_cost_rules: {
        Row: {
          created_at: string | null
          default_cost: number
          description: string | null
          display_order: number | null
          feature_name: string
          feature_type: string
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_cost?: number
          description?: string | null
          display_order?: number | null
          feature_name: string
          feature_type: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_cost?: number
          description?: string | null
          display_order?: number | null
          feature_name?: string
          feature_type?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
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
      feature_items: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          item_key: string
          item_name: string
          sub_category: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          item_key: string
          item_name: string
          sub_category?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          item_key?: string
          item_name?: string
          sub_category?: string | null
          updated_at?: string | null
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
      gratitude_coach_briefings: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          daily_declaration: string | null
          event_summary: string | null
          gratitude_items: Json | null
          id: string
          insight: string | null
          stage_1_content: string | null
          stage_2_content: string | null
          stage_3_content: string | null
          stage_4_content: string | null
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          daily_declaration?: string | null
          event_summary?: string | null
          gratitude_items?: Json | null
          id?: string
          insight?: string | null
          stage_1_content?: string | null
          stage_2_content?: string | null
          stage_3_content?: string | null
          stage_4_content?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          daily_declaration?: string | null
          event_summary?: string | null
          gratitude_items?: Json | null
          id?: string
          insight?: string | null
          stage_1_content?: string | null
          stage_2_content?: string | null
          stage_3_content?: string | null
          stage_4_content?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gratitude_coach_briefings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      gratitude_coaching_sessions: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          current_stage: number | null
          id: string
          messages: Json | null
          stage_1_insight: string | null
          stage_2_insight: string | null
          stage_3_insight: string | null
          stage_4_insight: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          current_stage?: number | null
          id?: string
          messages?: Json | null
          stage_1_insight?: string | null
          stage_2_insight?: string | null
          stage_3_insight?: string | null
          stage_4_insight?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          current_stage?: number | null
          id?: string
          messages?: Json | null
          stage_1_insight?: string | null
          stage_2_insight?: string | null
          stage_3_insight?: string | null
          stage_4_insight?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gratitude_coaching_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      gratitude_entries: {
        Row: {
          ai_analyzed: boolean | null
          category: string | null
          content: string
          created_at: string | null
          date: string | null
          id: string
          themes: string[] | null
          user_id: string
        }
        Insert: {
          ai_analyzed?: boolean | null
          category?: string | null
          content: string
          created_at?: string | null
          date?: string | null
          id?: string
          themes?: string[] | null
          user_id: string
        }
        Update: {
          ai_analyzed?: boolean | null
          category?: string | null
          content?: string
          created_at?: string | null
          date?: string | null
          id?: string
          themes?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      gratitude_reports: {
        Row: {
          analysis_content: string | null
          created_at: string | null
          end_date: string
          highlights: Json | null
          id: string
          report_type: string
          start_date: string
          theme_stats: Json | null
          total_entries: number | null
          user_id: string
        }
        Insert: {
          analysis_content?: string | null
          created_at?: string | null
          end_date: string
          highlights?: Json | null
          id?: string
          report_type: string
          start_date: string
          theme_stats?: Json | null
          total_entries?: number | null
          user_id: string
        }
        Update: {
          analysis_content?: string | null
          created_at?: string | null
          end_date?: string
          highlights?: Json | null
          id?: string
          report_type?: string
          start_date?: string
          theme_stats?: Json | null
          total_entries?: number | null
          user_id?: string
        }
        Relationships: []
      }
      gratitude_theme_definitions: {
        Row: {
          color: string
          created_at: string | null
          description: string | null
          display_order: number | null
          emoji: string
          id: string
          keywords: string[] | null
          name: string
        }
        Insert: {
          color: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          emoji: string
          id: string
          keywords?: string[] | null
          name: string
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          emoji?: string
          id?: string
          keywords?: string[] | null
          name?: string
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
      human_coaches: {
        Row: {
          admin_note: string | null
          avatar_url: string | null
          badge_type: string | null
          bio: string | null
          case_studies: Json | null
          created_at: string | null
          display_order: number | null
          education: string | null
          experience_years: number | null
          id: string
          intro_video_url: string | null
          is_accepting_new: boolean | null
          is_verified: boolean | null
          name: string
          phone: string | null
          positive_rate: number | null
          rating: number | null
          rating_communication: number | null
          rating_helpfulness: number | null
          rating_professionalism: number | null
          specialties: string[] | null
          status: string | null
          title: string | null
          total_reviews: number | null
          total_sessions: number | null
          training_background: string | null
          trust_level: number | null
          updated_at: string | null
          user_id: string | null
          verified_at: string | null
        }
        Insert: {
          admin_note?: string | null
          avatar_url?: string | null
          badge_type?: string | null
          bio?: string | null
          case_studies?: Json | null
          created_at?: string | null
          display_order?: number | null
          education?: string | null
          experience_years?: number | null
          id?: string
          intro_video_url?: string | null
          is_accepting_new?: boolean | null
          is_verified?: boolean | null
          name: string
          phone?: string | null
          positive_rate?: number | null
          rating?: number | null
          rating_communication?: number | null
          rating_helpfulness?: number | null
          rating_professionalism?: number | null
          specialties?: string[] | null
          status?: string | null
          title?: string | null
          total_reviews?: number | null
          total_sessions?: number | null
          training_background?: string | null
          trust_level?: number | null
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
        }
        Update: {
          admin_note?: string | null
          avatar_url?: string | null
          badge_type?: string | null
          bio?: string | null
          case_studies?: Json | null
          created_at?: string | null
          display_order?: number | null
          education?: string | null
          experience_years?: number | null
          id?: string
          intro_video_url?: string | null
          is_accepting_new?: boolean | null
          is_verified?: boolean | null
          name?: string
          phone?: string | null
          positive_rate?: number | null
          rating?: number | null
          rating_communication?: number | null
          rating_helpfulness?: number | null
          rating_professionalism?: number | null
          specialties?: string[] | null
          status?: string | null
          title?: string | null
          total_reviews?: number | null
          total_sessions?: number | null
          training_background?: string | null
          trust_level?: number | null
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
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
      orders: {
        Row: {
          amount: number
          created_at: string | null
          expired_at: string | null
          id: string
          order_no: string
          package_key: string
          package_name: string
          paid_at: string | null
          qr_code_url: string | null
          status: string | null
          trade_no: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          expired_at?: string | null
          id?: string
          order_no: string
          package_key: string
          package_name: string
          paid_at?: string | null
          qr_code_url?: string | null
          status?: string | null
          trade_no?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          expired_at?: string | null
          id?: string
          order_no?: string
          package_key?: string
          package_name?: string
          paid_at?: string | null
          qr_code_url?: string | null
          status?: string | null
          trade_no?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      package_feature_settings: {
        Row: {
          cost_per_use: number | null
          created_at: string | null
          feature_id: string
          free_quota: number | null
          free_quota_period: string | null
          id: string
          is_enabled: boolean | null
          max_duration_minutes: number | null
          package_id: string
          updated_at: string | null
        }
        Insert: {
          cost_per_use?: number | null
          created_at?: string | null
          feature_id: string
          free_quota?: number | null
          free_quota_period?: string | null
          id?: string
          is_enabled?: boolean | null
          max_duration_minutes?: number | null
          package_id: string
          updated_at?: string | null
        }
        Update: {
          cost_per_use?: number | null
          created_at?: string | null
          feature_id?: string
          free_quota?: number | null
          free_quota_period?: string | null
          id?: string
          is_enabled?: boolean | null
          max_duration_minutes?: number | null
          package_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_feature_settings_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "feature_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_feature_settings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
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
      package_free_quotas: {
        Row: {
          created_at: string | null
          feature_type: string
          free_quota: number
          id: string
          package_id: string | null
          period: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          feature_type: string
          free_quota?: number
          id?: string
          package_id?: string | null
          period?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          feature_type?: string
          free_quota?: number
          id?: string
          package_id?: string | null
          period?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_free_quotas_package_id_fkey"
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
      panic_sessions: {
        Row: {
          breathing_completed: boolean | null
          created_at: string | null
          cycles_completed: number | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          outcome: string | null
          reminders_viewed: number | null
          started_at: string
          user_id: string
        }
        Insert: {
          breathing_completed?: boolean | null
          created_at?: string | null
          cycles_completed?: number | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          outcome?: string | null
          reminders_viewed?: number | null
          started_at?: string
          user_id: string
        }
        Update: {
          breathing_completed?: boolean | null
          created_at?: string | null
          cycles_completed?: number | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          outcome?: string | null
          reminders_viewed?: number | null
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      parent_coaching_sessions: {
        Row: {
          briefing_id: string | null
          briefing_requested: boolean | null
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
          problem_type: string | null
          see_it: Json | null
          sense_it: Json | null
          stage_selections: Json | null
          status: string | null
          summary: string | null
          teen_context: Json | null
          transform_it: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          briefing_id?: string | null
          briefing_requested?: boolean | null
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
          problem_type?: string | null
          see_it?: Json | null
          sense_it?: Json | null
          stage_selections?: Json | null
          status?: string | null
          summary?: string | null
          teen_context?: Json | null
          transform_it?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          briefing_id?: string | null
          briefing_requested?: boolean | null
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
          problem_type?: string | null
          see_it?: Json | null
          sense_it?: Json | null
          stage_selections?: Json | null
          status?: string | null
          summary?: string | null
          teen_context?: Json | null
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
      parent_problem_profile: {
        Row: {
          created_at: string | null
          id: string
          intake_answers: Json | null
          intake_completed_at: string | null
          primary_problem_type: string
          secondary_problem_types: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          intake_answers?: Json | null
          intake_completed_at?: string | null
          primary_problem_type: string
          secondary_problem_types?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          intake_answers?: Json | null
          intake_completed_at?: string | null
          primary_problem_type?: string
          secondary_problem_types?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_problem_profile_primary_problem_type_fkey"
            columns: ["primary_problem_type"]
            isOneToOne: false
            referencedRelation: "parent_problem_types"
            referencedColumns: ["type_key"]
          },
        ]
      }
      parent_problem_types: {
        Row: {
          coaching_direction: Json | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          intake_questions: Json | null
          is_active: boolean | null
          parent_common_emotions: Json | null
          parent_pain_points: Json | null
          stage_prompts: Json | null
          system_prompt_modifier: string | null
          teen_context_focus: Json | null
          type_color: string | null
          type_icon: string | null
          type_key: string
          type_name: string
          updated_at: string | null
        }
        Insert: {
          coaching_direction?: Json | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          intake_questions?: Json | null
          is_active?: boolean | null
          parent_common_emotions?: Json | null
          parent_pain_points?: Json | null
          stage_prompts?: Json | null
          system_prompt_modifier?: string | null
          teen_context_focus?: Json | null
          type_color?: string | null
          type_icon?: string | null
          type_key: string
          type_name: string
          updated_at?: string | null
        }
        Update: {
          coaching_direction?: Json | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          intake_questions?: Json | null
          is_active?: boolean | null
          parent_common_emotions?: Json | null
          parent_pain_points?: Json | null
          stage_prompts?: Json | null
          system_prompt_modifier?: string | null
          teen_context_focus?: Json | null
          type_color?: string | null
          type_icon?: string | null
          type_key?: string
          type_name?: string
          updated_at?: string | null
        }
        Relationships: []
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
      parent_teen_bindings: {
        Row: {
          binding_code: string
          bound_at: string | null
          code_expires_at: string
          created_at: string | null
          id: string
          parent_user_id: string
          status: string | null
          teen_nickname: string | null
          teen_user_id: string | null
          unbound_at: string | null
          updated_at: string | null
        }
        Insert: {
          binding_code: string
          bound_at?: string | null
          code_expires_at: string
          created_at?: string | null
          id?: string
          parent_user_id: string
          status?: string | null
          teen_nickname?: string | null
          teen_user_id?: string | null
          unbound_at?: string | null
          updated_at?: string | null
        }
        Update: {
          binding_code?: string
          bound_at?: string | null
          code_expires_at?: string
          created_at?: string | null
          id?: string
          parent_user_id?: string
          status?: string | null
          teen_nickname?: string | null
          teen_user_id?: string | null
          unbound_at?: string | null
          updated_at?: string | null
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
          benefits: Json | null
          commission_rate_l1: number
          commission_rate_l2: number
          created_at: string | null
          description: string | null
          display_order: number | null
          gradient: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          level_name: string
          min_prepurchase: number
          partner_type: string
          price: number | null
          updated_at: string | null
        }
        Insert: {
          benefits?: Json | null
          commission_rate_l1: number
          commission_rate_l2?: number
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          gradient?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          level_name: string
          min_prepurchase: number
          partner_type: string
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          benefits?: Json | null
          commission_rate_l1?: number
          commission_rate_l2?: number
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          gradient?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          level_name?: string
          min_prepurchase?: number
          partner_type?: string
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      partner_posters: {
        Row: {
          call_to_action: string
          created_at: string
          entry_type: string
          headline: string
          id: string
          partner_id: string
          scan_count: number
          selling_points: string[]
          subtitle: string
          template_key: string
          updated_at: string
          urgency_text: string | null
        }
        Insert: {
          call_to_action: string
          created_at?: string
          entry_type?: string
          headline: string
          id?: string
          partner_id: string
          scan_count?: number
          selling_points: string[]
          subtitle: string
          template_key: string
          updated_at?: string
          urgency_text?: string | null
        }
        Update: {
          call_to_action?: string
          created_at?: string
          entry_type?: string
          headline?: string
          id?: string
          partner_id?: string
          scan_count?: number
          selling_points?: string[]
          subtitle?: string
          template_key?: string
          updated_at?: string
          urgency_text?: string | null
        }
        Relationships: []
      }
      partner_referrals: {
        Row: {
          conversion_status: string | null
          converted_at: string | null
          created_at: string
          has_joined_group: boolean | null
          id: string
          joined_camp_at: string | null
          joined_camp_id: string | null
          joined_group_at: string | null
          level: number
          parent_referral_id: string | null
          partner_id: string
          referred_user_id: string
        }
        Insert: {
          conversion_status?: string | null
          converted_at?: string | null
          created_at?: string
          has_joined_group?: boolean | null
          id?: string
          joined_camp_at?: string | null
          joined_camp_id?: string | null
          joined_group_at?: string | null
          level?: number
          parent_referral_id?: string | null
          partner_id: string
          referred_user_id: string
        }
        Update: {
          conversion_status?: string | null
          converted_at?: string | null
          created_at?: string
          has_joined_group?: boolean | null
          id?: string
          joined_camp_at?: string | null
          joined_camp_id?: string | null
          joined_group_at?: string | null
          level?: number
          parent_referral_id?: string | null
          partner_id?: string
          referred_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_referrals_joined_camp_id_fkey"
            columns: ["joined_camp_id"]
            isOneToOne: false
            referencedRelation: "training_camps"
            referencedColumns: ["id"]
          },
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
          default_entry_price: number | null
          default_entry_type: string | null
          default_quota_amount: number | null
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
          wecom_group_name: string | null
          wecom_group_qrcode_url: string | null
          withdrawn_amount: number
        }
        Insert: {
          available_balance?: number
          commission_rate_l1?: number
          commission_rate_l2?: number
          created_at?: string
          default_entry_price?: number | null
          default_entry_type?: string | null
          default_quota_amount?: number | null
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
          wecom_group_name?: string | null
          wecom_group_qrcode_url?: string | null
          withdrawn_amount?: number
        }
        Update: {
          available_balance?: number
          commission_rate_l1?: number
          commission_rate_l2?: number
          created_at?: string
          default_entry_price?: number | null
          default_entry_type?: string | null
          default_quota_amount?: number | null
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
          wecom_group_name?: string | null
          wecom_group_qrcode_url?: string | null
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
      poster_scan_logs: {
        Row: {
          id: string
          ip_hash: string | null
          partner_id: string
          poster_id: string
          referrer: string | null
          scanned_at: string
          user_agent: string | null
        }
        Insert: {
          id?: string
          ip_hash?: string | null
          partner_id: string
          poster_id: string
          referrer?: string | null
          scanned_at?: string
          user_agent?: string | null
        }
        Update: {
          id?: string
          ip_hash?: string | null
          partner_id?: string
          poster_id?: string
          referrer?: string | null
          scanned_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auth_provider: string | null
          camp_checkin_requirement: string | null
          camp_evening_reminder_time: string | null
          camp_late_warning_enabled: boolean | null
          camp_makeup_allowed: boolean | null
          camp_makeup_days_limit: number | null
          camp_morning_reminder_time: string | null
          carousel_auto_play: boolean | null
          carousel_interval: number | null
          carousel_modules: Json | null
          cloned_voice_id: string | null
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
          timezone: string | null
          updated_at: string
          voice_clone_status: string | null
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
          auth_provider?: string | null
          camp_checkin_requirement?: string | null
          camp_evening_reminder_time?: string | null
          camp_late_warning_enabled?: boolean | null
          camp_makeup_allowed?: boolean | null
          camp_makeup_days_limit?: number | null
          camp_morning_reminder_time?: string | null
          carousel_auto_play?: boolean | null
          carousel_interval?: number | null
          carousel_modules?: Json | null
          cloned_voice_id?: string | null
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
          timezone?: string | null
          updated_at?: string
          voice_clone_status?: string | null
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
          auth_provider?: string | null
          camp_checkin_requirement?: string | null
          camp_evening_reminder_time?: string | null
          camp_late_warning_enabled?: boolean | null
          camp_makeup_allowed?: boolean | null
          camp_makeup_days_limit?: number | null
          camp_morning_reminder_time?: string | null
          carousel_auto_play?: boolean | null
          carousel_interval?: number | null
          carousel_modules?: Json | null
          cloned_voice_id?: string | null
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
          timezone?: string | null
          updated_at?: string
          voice_clone_status?: string | null
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
      prompt_change_logs: {
        Row: {
          change_note: string | null
          change_type: string
          changed_at: string | null
          changed_by: string | null
          coach_template_id: string
          id: string
          new_stage_prompts: Json | null
          new_system_prompt: string | null
          old_stage_prompts: Json | null
          old_system_prompt: string | null
        }
        Insert: {
          change_note?: string | null
          change_type: string
          changed_at?: string | null
          changed_by?: string | null
          coach_template_id: string
          id?: string
          new_stage_prompts?: Json | null
          new_system_prompt?: string | null
          old_stage_prompts?: Json | null
          old_system_prompt?: string | null
        }
        Update: {
          change_note?: string | null
          change_type?: string
          changed_at?: string | null
          changed_by?: string | null
          coach_template_id?: string
          id?: string
          new_stage_prompts?: Json | null
          new_system_prompt?: string | null
          old_stage_prompts?: Json | null
          old_system_prompt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_change_logs_coach_template_id_fkey"
            columns: ["coach_template_id"]
            isOneToOne: false
            referencedRelation: "coach_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      review_quick_tags: {
        Row: {
          display_order: number | null
          id: string
          is_active: boolean | null
          tag_name: string
          tag_type: string | null
        }
        Insert: {
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          tag_name: string
          tag_type?: string | null
        }
        Update: {
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          tag_name?: string
          tag_type?: string | null
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
      support_conversations: {
        Row: {
          created_at: string
          feedback_id: string | null
          id: string
          messages: Json | null
          session_id: string
          ticket_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          feedback_id?: string | null
          id?: string
          messages?: Json | null
          session_id: string
          ticket_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          feedback_id?: string | null
          id?: string
          messages?: Json | null
          session_id?: string
          ticket_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_conversations_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "user_feedback"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_conversations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "customer_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_knowledge_base: {
        Row: {
          camp_type: string | null
          category: string
          coach_key: string | null
          content: string
          created_at: string
          created_by: string | null
          display_order: number | null
          doc_type: string | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          package_key: string | null
          partner_level: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          camp_type?: string | null
          category: string
          coach_key?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          display_order?: number | null
          doc_type?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          package_key?: string | null
          partner_level?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          camp_type?: string | null
          category?: string
          coach_key?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          display_order?: number | null
          doc_type?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          package_key?: string | null
          partner_level?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
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
      teen_access_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          parent_user_id: string
          teen_nickname: string | null
          usage_count: number | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          parent_user_id: string
          teen_nickname?: string | null
          usage_count?: number | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          parent_user_id?: string
          teen_nickname?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      teen_coaching_contexts: {
        Row: {
          additional_context: Json | null
          binding_id: string
          communication_opportunity: string | null
          created_at: string | null
          id: string
          inferred_situation: string | null
          inferred_teen_feeling: string | null
          is_used: boolean | null
          parent_session_id: string | null
          parent_willing_change: string | null
          problem_type: string | null
          used_at: string | null
        }
        Insert: {
          additional_context?: Json | null
          binding_id: string
          communication_opportunity?: string | null
          created_at?: string | null
          id?: string
          inferred_situation?: string | null
          inferred_teen_feeling?: string | null
          is_used?: boolean | null
          parent_session_id?: string | null
          parent_willing_change?: string | null
          problem_type?: string | null
          used_at?: string | null
        }
        Update: {
          additional_context?: Json | null
          binding_id?: string
          communication_opportunity?: string | null
          created_at?: string | null
          id?: string
          inferred_situation?: string | null
          inferred_teen_feeling?: string | null
          is_used?: boolean | null
          parent_session_id?: string | null
          parent_willing_change?: string | null
          problem_type?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teen_coaching_contexts_binding_id_fkey"
            columns: ["binding_id"]
            isOneToOne: false
            referencedRelation: "parent_teen_bindings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teen_coaching_contexts_parent_session_id_fkey"
            columns: ["parent_session_id"]
            isOneToOne: false
            referencedRelation: "parent_coaching_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teen_coaching_contexts_problem_type_fkey"
            columns: ["problem_type"]
            isOneToOne: false
            referencedRelation: "parent_problem_types"
            referencedColumns: ["type_key"]
          },
        ]
      }
      teen_usage_logs: {
        Row: {
          binding_id: string | null
          created_at: string | null
          id: string
          mood_indicator: string | null
          session_duration_seconds: number | null
          teen_user_id: string
        }
        Insert: {
          binding_id?: string | null
          created_at?: string | null
          id?: string
          mood_indicator?: string | null
          session_duration_seconds?: number | null
          teen_user_id: string
        }
        Update: {
          binding_id?: string | null
          created_at?: string | null
          id?: string
          mood_indicator?: string | null
          session_duration_seconds?: number | null
          teen_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teen_usage_logs_binding_id_fkey"
            columns: ["binding_id"]
            isOneToOne: false
            referencedRelation: "parent_teen_bindings"
            referencedColumns: ["id"]
          },
        ]
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
      user_feedback: {
        Row: {
          admin_note: string | null
          category: string | null
          contact_info: string | null
          content: string
          created_at: string
          feedback_type: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_note?: string | null
          category?: string | null
          contact_info?: string | null
          content: string
          created_at?: string
          feedback_type?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_note?: string | null
          category?: string | null
          contact_info?: string | null
          content?: string
          created_at?: string
          feedback_type?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
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
      user_free_quota_usage: {
        Row: {
          created_at: string | null
          feature_type: string
          id: string
          period_start: string | null
          updated_at: string | null
          used_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feature_type: string
          id?: string
          period_start?: string | null
          updated_at?: string | null
          used_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feature_type?: string
          id?: string
          period_start?: string | null
          updated_at?: string | null
          used_count?: number | null
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
      user_voice_clones: {
        Row: {
          created_at: string | null
          elevenlabs_voice_id: string
          id: string
          sample_storage_path: string | null
          updated_at: string | null
          user_id: string
          voice_name: string | null
        }
        Insert: {
          created_at?: string | null
          elevenlabs_voice_id: string
          id?: string
          sample_storage_path?: string | null
          updated_at?: string | null
          user_id: string
          voice_name?: string | null
        }
        Update: {
          created_at?: string | null
          elevenlabs_voice_id?: string
          id?: string
          sample_storage_path?: string | null
          updated_at?: string | null
          user_id?: string
          voice_name?: string | null
        }
        Relationships: []
      }
      user_voice_recordings: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          emotion_type: string | null
          id: string
          is_ai_generated: boolean | null
          reminder_index: number
          storage_path: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          emotion_type?: string | null
          id?: string
          is_ai_generated?: boolean | null
          reminder_index: number
          storage_path: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          emotion_type?: string | null
          id?: string
          is_ai_generated?: boolean | null
          reminder_index?: number
          storage_path?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vibrant_life_sage_briefings: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          id: string
          reasoning: string | null
          recommended_coach_type: string | null
          user_id: string
          user_issue_summary: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          reasoning?: string | null
          recommended_coach_type?: string | null
          user_id: string
          user_issue_summary?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          reasoning?: string | null
          recommended_coach_type?: string | null
          user_id?: string
          user_issue_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vibrant_life_sage_briefings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
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
      voice_chat_sessions: {
        Row: {
          billed_minutes: number
          coach_key: string
          created_at: string | null
          duration_seconds: number
          id: string
          total_cost: number
          transcript_summary: string | null
          user_id: string
        }
        Insert: {
          billed_minutes?: number
          coach_key: string
          created_at?: string | null
          duration_seconds?: number
          id?: string
          total_cost?: number
          transcript_summary?: string | null
          user_id: string
        }
        Update: {
          billed_minutes?: number
          coach_key?: string
          created_at?: string | null
          duration_seconds?: number
          id?: string
          total_cost?: number
          transcript_summary?: string | null
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
      add_partner_pending_balance: {
        Args: { p_amount: number; p_partner_id: string }
        Returns: undefined
      }
      confirm_partner_commission: {
        Args: { p_amount: number; p_partner_id: string }
        Returns: undefined
      }
      deduct_user_quota: {
        Args: { p_amount?: number; p_user_id: string }
        Returns: {
          remaining_quota: number
        }[]
      }
      get_user_permissions: {
        Args: { p_user_id: string }
        Returns: {
          access_level: string
          access_value: string
          category: string
          feature_key: string
          feature_name: string
          package_name: string
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
