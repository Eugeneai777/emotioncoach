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
      ai_coach_calls: {
        Row: {
          call_status: string
          coach_type: string
          connected_at: string | null
          context: Json | null
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          opening_message: string | null
          ring_started_at: string | null
          scenario: string
          scheduled_at: string | null
          user_id: string
        }
        Insert: {
          call_status?: string
          coach_type?: string
          connected_at?: string | null
          context?: Json | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          opening_message?: string | null
          ring_started_at?: string | null
          scenario: string
          scheduled_at?: string | null
          user_id: string
        }
        Update: {
          call_status?: string
          coach_type?: string
          connected_at?: string | null
          context?: Json | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          opening_message?: string | null
          ring_started_at?: string | null
          scenario?: string
          scheduled_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      alive_check_contacts: {
        Row: {
          contact_email: string
          contact_name: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contact_email: string
          contact_name: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contact_email?: string
          contact_name?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      alive_check_logs: {
        Row: {
          ai_witness: string | null
          awakening_type: string | null
          checked_at: string
          created_at: string | null
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          ai_witness?: string | null
          awakening_type?: string | null
          checked_at?: string
          created_at?: string | null
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          ai_witness?: string | null
          awakening_type?: string | null
          checked_at?: string
          created_at?: string | null
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      alive_check_settings: {
        Row: {
          created_at: string | null
          days_threshold: number | null
          emergency_contact_email: string | null
          emergency_contact_name: string | null
          id: string
          is_enabled: boolean | null
          last_notification_at: string | null
          updated_at: string | null
          user_display_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          days_threshold?: number | null
          emergency_contact_email?: string | null
          emergency_contact_name?: string | null
          id?: string
          is_enabled?: boolean | null
          last_notification_at?: string | null
          updated_at?: string | null
          user_display_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          days_threshold?: number | null
          emergency_contact_email?: string | null
          emergency_contact_name?: string | null
          id?: string
          is_enabled?: boolean | null
          last_notification_at?: string | null
          updated_at?: string | null
          user_display_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
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
      app_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      appointment_notification_logs: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          id: string
          recipient_id: string
          recipient_type: string
          scenario: string
          sent_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string | null
          id?: string
          recipient_id: string
          recipient_type: string
          scenario: string
          sent_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string | null
          id?: string
          recipient_id?: string
          recipient_type?: string
          scenario?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_notification_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "coaching_appointments"
            referencedColumns: ["id"]
          },
        ]
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
      awakening_entries: {
        Row: {
          created_at: string
          id: string
          input_text: string
          life_card: Json
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input_text: string
          life_card: Json
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          input_text?: string
          life_card?: Json
          type?: string
          user_id?: string
        }
        Relationships: []
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
      bloom_delivery_completions: {
        Row: {
          assignment_id: string | null
          camp_id: string | null
          camp_type: string
          coach_cost: number | null
          coach_id: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          l1_commission: number | null
          l2_commission: number | null
          order_amount: number
          partner_id: string | null
          profit: number | null
          purchase_id: string | null
          settlement_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assignment_id?: string | null
          camp_id?: string | null
          camp_type: string
          coach_cost?: number | null
          coach_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          l1_commission?: number | null
          l2_commission?: number | null
          order_amount: number
          partner_id?: string | null
          profit?: number | null
          purchase_id?: string | null
          settlement_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assignment_id?: string | null
          camp_id?: string | null
          camp_type?: string
          coach_cost?: number | null
          coach_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          l1_commission?: number | null
          l2_commission?: number | null
          order_amount?: number
          partner_id?: string | null
          profit?: number | null
          purchase_id?: string | null
          settlement_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bloom_delivery_completions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "camp_coach_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloom_delivery_completions_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "training_camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloom_delivery_completions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "human_coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloom_delivery_completions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloom_delivery_completions_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "user_camp_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloom_delivery_completions_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "coach_settlements"
            referencedColumns: ["id"]
          },
        ]
      }
      bloom_monthly_cashflow_summary: {
        Row: {
          calculated_at: string | null
          cash_balance: number | null
          coach_settlement_outflow: number | null
          created_at: string | null
          cumulative_inflow: number | null
          cumulative_outflow: number | null
          id: string
          l1_commission_outflow: number | null
          l2_commission_outflow: number | null
          net_cashflow: number | null
          partner_package_amount: number | null
          partner_package_inflow: number | null
          pending_coach_settlement: number | null
          pending_commission: number | null
          single_camp_amount: number | null
          single_camp_inflow: number | null
          total_cash_inflow: number | null
          total_cash_outflow: number | null
          total_commission_outflow: number | null
          total_pending_payment: number | null
          updated_at: string | null
          year_month: string
        }
        Insert: {
          calculated_at?: string | null
          cash_balance?: number | null
          coach_settlement_outflow?: number | null
          created_at?: string | null
          cumulative_inflow?: number | null
          cumulative_outflow?: number | null
          id?: string
          l1_commission_outflow?: number | null
          l2_commission_outflow?: number | null
          net_cashflow?: number | null
          partner_package_amount?: number | null
          partner_package_inflow?: number | null
          pending_coach_settlement?: number | null
          pending_commission?: number | null
          single_camp_amount?: number | null
          single_camp_inflow?: number | null
          total_cash_inflow?: number | null
          total_cash_outflow?: number | null
          total_commission_outflow?: number | null
          total_pending_payment?: number | null
          updated_at?: string | null
          year_month: string
        }
        Update: {
          calculated_at?: string | null
          cash_balance?: number | null
          coach_settlement_outflow?: number | null
          created_at?: string | null
          cumulative_inflow?: number | null
          cumulative_outflow?: number | null
          id?: string
          l1_commission_outflow?: number | null
          l2_commission_outflow?: number | null
          net_cashflow?: number | null
          partner_package_amount?: number | null
          partner_package_inflow?: number | null
          pending_coach_settlement?: number | null
          pending_commission?: number | null
          single_camp_amount?: number | null
          single_camp_inflow?: number | null
          total_cash_inflow?: number | null
          total_cash_outflow?: number | null
          total_commission_outflow?: number | null
          total_pending_payment?: number | null
          updated_at?: string | null
          year_month?: string
        }
        Relationships: []
      }
      bloom_monthly_profit_summary: {
        Row: {
          calculated_at: string | null
          coach_cost_expense: number | null
          confirmed_partner_count: number | null
          confirmed_partner_revenue: number | null
          confirmed_single_count: number | null
          confirmed_single_revenue: number | null
          created_at: string | null
          cumulative_confirmed: number | null
          cumulative_presale: number | null
          id: string
          l1_commission_expense: number | null
          l2_commission_expense: number | null
          monthly_profit: number | null
          presale_partner_amount: number | null
          presale_partner_count: number | null
          presale_single_amount: number | null
          presale_single_count: number | null
          profit_rate: number | null
          total_commission_expense: number | null
          total_confirmed_revenue: number | null
          total_expense: number | null
          total_presale_amount: number | null
          updated_at: string | null
          year_month: string
        }
        Insert: {
          calculated_at?: string | null
          coach_cost_expense?: number | null
          confirmed_partner_count?: number | null
          confirmed_partner_revenue?: number | null
          confirmed_single_count?: number | null
          confirmed_single_revenue?: number | null
          created_at?: string | null
          cumulative_confirmed?: number | null
          cumulative_presale?: number | null
          id?: string
          l1_commission_expense?: number | null
          l2_commission_expense?: number | null
          monthly_profit?: number | null
          presale_partner_amount?: number | null
          presale_partner_count?: number | null
          presale_single_amount?: number | null
          presale_single_count?: number | null
          profit_rate?: number | null
          total_commission_expense?: number | null
          total_confirmed_revenue?: number | null
          total_expense?: number | null
          total_presale_amount?: number | null
          updated_at?: string | null
          year_month: string
        }
        Update: {
          calculated_at?: string | null
          coach_cost_expense?: number | null
          confirmed_partner_count?: number | null
          confirmed_partner_revenue?: number | null
          confirmed_single_count?: number | null
          confirmed_single_revenue?: number | null
          created_at?: string | null
          cumulative_confirmed?: number | null
          cumulative_presale?: number | null
          id?: string
          l1_commission_expense?: number | null
          l2_commission_expense?: number | null
          monthly_profit?: number | null
          presale_partner_amount?: number | null
          presale_partner_count?: number | null
          presale_single_amount?: number | null
          presale_single_count?: number | null
          profit_rate?: number | null
          total_commission_expense?: number | null
          total_confirmed_revenue?: number | null
          total_expense?: number | null
          total_presale_amount?: number | null
          updated_at?: string | null
          year_month?: string
        }
        Relationships: []
      }
      bloom_partner_orders: {
        Row: {
          completed_at: string | null
          created_at: string | null
          delivery_status: string | null
          emotion_assignment_id: string | null
          emotion_camp_id: string | null
          emotion_completed_at: string | null
          emotion_settlement_id: string | null
          emotion_status: string | null
          id: string
          identity_assignment_id: string | null
          identity_camp_id: string | null
          identity_completed_at: string | null
          identity_settlement_id: string | null
          identity_status: string | null
          life_assignment_id: string | null
          life_camp_id: string | null
          life_completed_at: string | null
          life_settlement_id: string | null
          life_status: string | null
          order_amount: number
          partner_id: string | null
          purchase_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          delivery_status?: string | null
          emotion_assignment_id?: string | null
          emotion_camp_id?: string | null
          emotion_completed_at?: string | null
          emotion_settlement_id?: string | null
          emotion_status?: string | null
          id?: string
          identity_assignment_id?: string | null
          identity_camp_id?: string | null
          identity_completed_at?: string | null
          identity_settlement_id?: string | null
          identity_status?: string | null
          life_assignment_id?: string | null
          life_camp_id?: string | null
          life_completed_at?: string | null
          life_settlement_id?: string | null
          life_status?: string | null
          order_amount?: number
          partner_id?: string | null
          purchase_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          delivery_status?: string | null
          emotion_assignment_id?: string | null
          emotion_camp_id?: string | null
          emotion_completed_at?: string | null
          emotion_settlement_id?: string | null
          emotion_status?: string | null
          id?: string
          identity_assignment_id?: string | null
          identity_camp_id?: string | null
          identity_completed_at?: string | null
          identity_settlement_id?: string | null
          identity_status?: string | null
          life_assignment_id?: string | null
          life_camp_id?: string | null
          life_completed_at?: string | null
          life_settlement_id?: string | null
          life_status?: string | null
          order_amount?: number
          partner_id?: string | null
          purchase_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bloom_partner_orders_emotion_assignment_id_fkey"
            columns: ["emotion_assignment_id"]
            isOneToOne: false
            referencedRelation: "camp_coach_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloom_partner_orders_emotion_camp_id_fkey"
            columns: ["emotion_camp_id"]
            isOneToOne: false
            referencedRelation: "training_camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloom_partner_orders_emotion_settlement_id_fkey"
            columns: ["emotion_settlement_id"]
            isOneToOne: false
            referencedRelation: "coach_settlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloom_partner_orders_identity_assignment_id_fkey"
            columns: ["identity_assignment_id"]
            isOneToOne: false
            referencedRelation: "camp_coach_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloom_partner_orders_identity_camp_id_fkey"
            columns: ["identity_camp_id"]
            isOneToOne: false
            referencedRelation: "training_camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloom_partner_orders_identity_settlement_id_fkey"
            columns: ["identity_settlement_id"]
            isOneToOne: false
            referencedRelation: "coach_settlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloom_partner_orders_life_assignment_id_fkey"
            columns: ["life_assignment_id"]
            isOneToOne: false
            referencedRelation: "camp_coach_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloom_partner_orders_life_camp_id_fkey"
            columns: ["life_camp_id"]
            isOneToOne: false
            referencedRelation: "training_camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloom_partner_orders_life_settlement_id_fkey"
            columns: ["life_settlement_id"]
            isOneToOne: false
            referencedRelation: "coach_settlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloom_partner_orders_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      bloom_partner_profit: {
        Row: {
          created_at: string | null
          emotion_coach_cost: number | null
          finalized_at: string | null
          id: string
          identity_coach_cost: number | null
          l1_commission: number | null
          l2_commission: number | null
          life_coach_cost: number | null
          order_amount: number
          order_id: string
          profit: number | null
          profit_rate: number | null
          status: string | null
          total_coach_cost: number | null
          total_commission: number | null
          total_cost: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emotion_coach_cost?: number | null
          finalized_at?: string | null
          id?: string
          identity_coach_cost?: number | null
          l1_commission?: number | null
          l2_commission?: number | null
          life_coach_cost?: number | null
          order_amount?: number
          order_id: string
          profit?: number | null
          profit_rate?: number | null
          status?: string | null
          total_coach_cost?: number | null
          total_commission?: number | null
          total_cost?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          emotion_coach_cost?: number | null
          finalized_at?: string | null
          id?: string
          identity_coach_cost?: number | null
          l1_commission?: number | null
          l2_commission?: number | null
          life_coach_cost?: number | null
          order_amount?: number
          order_id?: string
          profit?: number | null
          profit_rate?: number | null
          status?: string | null
          total_coach_cost?: number | null
          total_commission?: number | null
          total_cost?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bloom_partner_profit_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "bloom_partner_orders"
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
      cache_store: {
        Row: {
          created_at: string | null
          expires_at: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      camp_coach_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          camp_id: string
          coach_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          product_line: string
          purchase_id: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          camp_id: string
          coach_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          product_line?: string
          purchase_id?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          camp_id?: string
          coach_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          product_line?: string
          purchase_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "camp_coach_assignments_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "training_camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camp_coach_assignments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "human_coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camp_coach_assignments_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "user_camp_purchases"
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
      camp_delivery_reviews: {
        Row: {
          assignment_id: string
          camp_id: string
          coach_id: string
          coach_replied_at: string | null
          coach_reply: string | null
          comment: string | null
          created_at: string | null
          id: string
          is_anonymous: boolean | null
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
          assignment_id: string
          camp_id: string
          coach_id: string
          coach_replied_at?: string | null
          coach_reply?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
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
          assignment_id?: string
          camp_id?: string
          coach_id?: string
          coach_replied_at?: string | null
          coach_reply?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
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
            foreignKeyName: "camp_delivery_reviews_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "camp_coach_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camp_delivery_reviews_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "training_camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camp_delivery_reviews_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "human_coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      camp_entitlements: {
        Row: {
          camp_type: string
          created_at: string | null
          feature_key: string
          id: string
          is_free: boolean | null
        }
        Insert: {
          camp_type: string
          created_at?: string | null
          feature_key: string
          id?: string
          is_free?: boolean | null
        }
        Update: {
          camp_type?: string
          created_at?: string | null
          feature_key?: string
          id?: string
          is_free?: boolean | null
        }
        Relationships: []
      }
      camp_invite_referrals: {
        Row: {
          camp_id: string | null
          camp_type: string
          created_at: string
          id: string
          inviter_user_id: string
          joined_at: string | null
          notification_sent: boolean | null
          notification_sent_at: string | null
          referred_user_id: string
          status: string
        }
        Insert: {
          camp_id?: string | null
          camp_type?: string
          created_at?: string
          id?: string
          inviter_user_id: string
          joined_at?: string | null
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          referred_user_id: string
          status?: string
        }
        Update: {
          camp_id?: string | null
          camp_type?: string
          created_at?: string
          id?: string
          inviter_user_id?: string
          joined_at?: string | null
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          referred_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "camp_invite_referrals_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "training_camps"
            referencedColumns: ["id"]
          },
        ]
      }
      camp_summaries: {
        Row: {
          achievements_unlocked: string[] | null
          ai_coach_message: string | null
          awakening_growth: number | null
          behavior_growth: number | null
          belief_growth: number | null
          biggest_breakthrough: string | null
          camp_id: string | null
          daily_scores: Json | null
          emotion_growth: number | null
          end_awakening: number | null
          focus_areas: string[] | null
          generated_at: string | null
          id: string
          start_awakening: number | null
          user_id: string
        }
        Insert: {
          achievements_unlocked?: string[] | null
          ai_coach_message?: string | null
          awakening_growth?: number | null
          behavior_growth?: number | null
          belief_growth?: number | null
          biggest_breakthrough?: string | null
          camp_id?: string | null
          daily_scores?: Json | null
          emotion_growth?: number | null
          end_awakening?: number | null
          focus_areas?: string[] | null
          generated_at?: string | null
          id?: string
          start_awakening?: number | null
          user_id: string
        }
        Update: {
          achievements_unlocked?: string[] | null
          ai_coach_message?: string | null
          awakening_growth?: number | null
          behavior_growth?: number | null
          belief_growth?: number | null
          biggest_breakthrough?: string | null
          camp_id?: string | null
          daily_scores?: Json | null
          emotion_growth?: number | null
          end_awakening?: number | null
          focus_areas?: string[] | null
          generated_at?: string | null
          id?: string
          start_awakening?: number | null
          user_id?: string
        }
        Relationships: []
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
      coach_price_tiers: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          price: number
          tier_level: number
          tier_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          price: number
          tier_level: number
          tier_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          price?: number
          tier_level?: number
          tier_name?: string
          updated_at?: string | null
        }
        Relationships: []
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
      coach_settlement_rules: {
        Row: {
          base_commission_rate: number
          confirm_days: number
          created_at: string | null
          id: string
          is_active: boolean | null
          rating_2_threshold: number
          rating_3_multiplier: number
          rating_4_multiplier: number
          rating_5_multiplier: number
          rule_name: string
          updated_at: string | null
        }
        Insert: {
          base_commission_rate?: number
          confirm_days?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rating_2_threshold?: number
          rating_3_multiplier?: number
          rating_4_multiplier?: number
          rating_5_multiplier?: number
          rule_name?: string
          updated_at?: string | null
        }
        Update: {
          base_commission_rate?: number
          confirm_days?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rating_2_threshold?: number
          rating_3_multiplier?: number
          rating_4_multiplier?: number
          rating_5_multiplier?: number
          rule_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      coach_settlements: {
        Row: {
          admin_note: string | null
          appointment_id: string
          base_rate: number
          camp_id: string | null
          camp_review_id: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          coach_id: string
          confirm_at: string | null
          confirmed_at: string | null
          created_at: string | null
          final_rate: number
          id: string
          order_amount: number
          paid_at: string | null
          product_line: string
          rating_at_settlement: number | null
          rating_multiplier: number
          review_id: string | null
          settlement_amount: number
          settlement_type: string
          status: string
          updated_at: string | null
        }
        Insert: {
          admin_note?: string | null
          appointment_id: string
          base_rate: number
          camp_id?: string | null
          camp_review_id?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          coach_id: string
          confirm_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          final_rate: number
          id?: string
          order_amount: number
          paid_at?: string | null
          product_line?: string
          rating_at_settlement?: number | null
          rating_multiplier: number
          review_id?: string | null
          settlement_amount: number
          settlement_type?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          admin_note?: string | null
          appointment_id?: string
          base_rate?: number
          camp_id?: string | null
          camp_review_id?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          coach_id?: string
          confirm_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          final_rate?: number
          id?: string
          order_amount?: number
          paid_at?: string | null
          product_line?: string
          rating_at_settlement?: number | null
          rating_multiplier?: number
          review_id?: string | null
          settlement_amount?: number
          settlement_type?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_settlements_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "coaching_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_settlements_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "training_camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_settlements_camp_review_id_fkey"
            columns: ["camp_review_id"]
            isOneToOne: false
            referencedRelation: "camp_delivery_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_settlements_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "human_coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_settlements_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "appointment_reviews"
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
          theme_config: Json | null
          title: string
          training_camp_type: string | null
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
          theme_config?: Json | null
          title: string
          training_camp_type?: string | null
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
          theme_config?: Json | null
          title?: string
          training_camp_type?: string | null
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
      coaching_prepaid_balance: {
        Row: {
          balance: number
          created_at: string | null
          id: string
          total_recharged: number
          total_spent: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          total_recharged?: number
          total_spent?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          total_recharged?: number
          total_spent?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      coaching_prepaid_packages: {
        Row: {
          bonus_amount: number | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          package_key: string
          package_name: string
          price: number
          total_value: number
        }
        Insert: {
          bonus_amount?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          package_key: string
          package_name: string
          price: number
          total_value: number
        }
        Update: {
          bonus_amount?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          package_key?: string
          package_name?: string
          price?: number
          total_value?: number
        }
        Relationships: []
      }
      coaching_prepaid_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          description: string | null
          id: string
          related_appointment_id: string | null
          related_order_no: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          description?: string | null
          id?: string
          related_appointment_id?: string | null
          related_order_no?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          description?: string | null
          id?: string
          related_appointment_id?: string | null
          related_order_no?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_prepaid_transactions_related_appointment_id_fkey"
            columns: ["related_appointment_id"]
            isOneToOne: false
            referencedRelation: "coaching_appointments"
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
      conversion_events: {
        Row: {
          created_at: string | null
          event_type: string
          feature_key: string
          id: string
          metadata: Json | null
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          feature_key: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          feature_key?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
          visitor_id?: string | null
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
      daily_challenges: {
        Row: {
          ai_insight_source: string | null
          challenge_description: string | null
          challenge_title: string
          challenge_type: string
          completed_at: string | null
          completion_reflection: string | null
          created_at: string | null
          difficulty: string | null
          id: string
          is_ai_generated: boolean | null
          is_completed: boolean | null
          journal_entry_id: string | null
          linked_belief: string | null
          linked_focus_area: string | null
          points_reward: number | null
          recommendation_reason: string | null
          source: string | null
          target_date: string
          target_poor_type: string | null
          user_id: string
        }
        Insert: {
          ai_insight_source?: string | null
          challenge_description?: string | null
          challenge_title: string
          challenge_type: string
          completed_at?: string | null
          completion_reflection?: string | null
          created_at?: string | null
          difficulty?: string | null
          id?: string
          is_ai_generated?: boolean | null
          is_completed?: boolean | null
          journal_entry_id?: string | null
          linked_belief?: string | null
          linked_focus_area?: string | null
          points_reward?: number | null
          recommendation_reason?: string | null
          source?: string | null
          target_date: string
          target_poor_type?: string | null
          user_id: string
        }
        Update: {
          ai_insight_source?: string | null
          challenge_description?: string | null
          challenge_title?: string
          challenge_type?: string
          completed_at?: string | null
          completion_reflection?: string | null
          created_at?: string | null
          difficulty?: string | null
          id?: string
          is_ai_generated?: boolean | null
          is_completed?: boolean | null
          journal_entry_id?: string | null
          linked_belief?: string | null
          linked_focus_area?: string | null
          points_reward?: number | null
          recommendation_reason?: string | null
          source?: string | null
          target_date?: string
          target_poor_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_challenges_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "wealth_journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_todo_summaries: {
        Row: {
          ai_summary: string | null
          completed_count: number | null
          completion_rate: number | null
          created_at: string | null
          date: string
          id: string
          insights: string | null
          overdue_items: Json | null
          total_count: number | null
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          completed_count?: number | null
          completion_rate?: number | null
          created_at?: string | null
          date?: string
          id?: string
          insights?: string | null
          overdue_items?: Json | null
          total_count?: number | null
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          completed_count?: number | null
          completion_rate?: number | null
          created_at?: string | null
          date?: string
          id?: string
          insights?: string | null
          overdue_items?: Json | null
          total_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      daily_todos: {
        Row: {
          call_id: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          date: string
          description: string | null
          estimated_time: number | null
          id: string
          priority: string | null
          source: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          call_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          estimated_time?: number | null
          id?: string
          priority?: string | null
          source?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          call_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          estimated_time?: number | null
          id?: string
          priority?: string | null
          source?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_todos_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "ai_coach_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_logs: {
        Row: {
          ai_analysis: Json | null
          chosen_option: string | null
          concerns: string | null
          created_at: string
          decision_question: string
          id: string
          is_resolved: boolean | null
          option_a: string | null
          option_b: string | null
          outcome_note: string | null
          resolved_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          chosen_option?: string | null
          concerns?: string | null
          created_at?: string
          decision_question: string
          id?: string
          is_resolved?: boolean | null
          option_a?: string | null
          option_b?: string | null
          outcome_note?: string | null
          resolved_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          chosen_option?: string | null
          concerns?: string | null
          created_at?: string
          decision_question?: string
          id?: string
          is_resolved?: boolean | null
          option_a?: string | null
          option_b?: string | null
          outcome_note?: string | null
          resolved_at?: string | null
          updated_at?: string
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
          key_insight: string | null
          messages: Json | null
          session_summary: string | null
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
          key_insight?: string | null
          messages?: Json | null
          session_summary?: string | null
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
          key_insight?: string | null
          messages?: Json | null
          session_summary?: string | null
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
      emotion_health_assessments: {
        Row: {
          ai_analysis: Json | null
          answers: Json
          anxiety_index: number
          avoidance_score: number
          blocked_dimension: string
          created_at: string | null
          energy_index: number
          exhaustion_score: number
          id: string
          is_paid: boolean | null
          order_id: string | null
          paid_at: string | null
          primary_pattern: string
          recommended_path: string
          secondary_pattern: string | null
          stress_index: number
          suppression_score: number
          tension_score: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          answers: Json
          anxiety_index: number
          avoidance_score: number
          blocked_dimension: string
          created_at?: string | null
          energy_index: number
          exhaustion_score: number
          id?: string
          is_paid?: boolean | null
          order_id?: string | null
          paid_at?: string | null
          primary_pattern: string
          recommended_path: string
          secondary_pattern?: string | null
          stress_index: number
          suppression_score: number
          tension_score: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          answers?: Json
          anxiety_index?: number
          avoidance_score?: number
          blocked_dimension?: string
          created_at?: string | null
          energy_index?: number
          exhaustion_score?: number
          id?: string
          is_paid?: boolean | null
          order_id?: string | null
          paid_at?: string | null
          primary_pattern?: string
          recommended_path?: string
          secondary_pattern?: string | null
          stress_index?: number
          suppression_score?: number
          tension_score?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emotion_health_assessments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
      follow_reminder_tracking: {
        Row: {
          action: string
          created_at: string | null
          id: string
          trigger_key: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          trigger_key: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          trigger_key?: string
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
      gratitude_call_records: {
        Row: {
          call_date: string | null
          call_id: string | null
          call_time_slot: string
          created_at: string | null
          gratitude_content: string | null
          id: string
          recorded_at: string | null
          user_id: string
        }
        Insert: {
          call_date?: string | null
          call_id?: string | null
          call_time_slot: string
          created_at?: string | null
          gratitude_content?: string | null
          id?: string
          recorded_at?: string | null
          user_id: string
        }
        Update: {
          call_date?: string | null
          call_id?: string | null
          call_time_slot?: string
          created_at?: string | null
          gratitude_content?: string | null
          id?: string
          recorded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gratitude_call_records_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "ai_coach_calls"
            referencedColumns: ["id"]
          },
        ]
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
          available_balance: number | null
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
          pending_balance: number | null
          phone: string | null
          positive_rate: number | null
          price_tier_id: string | null
          price_tier_set_at: string | null
          price_tier_set_by: string | null
          rating: number | null
          rating_communication: number | null
          rating_helpfulness: number | null
          rating_professionalism: number | null
          specialties: string[] | null
          status: string | null
          title: string | null
          total_earnings: number | null
          total_reviews: number | null
          total_sessions: number | null
          training_background: string | null
          trust_level: number | null
          updated_at: string | null
          user_id: string | null
          verified_at: string | null
          withdrawn_amount: number | null
        }
        Insert: {
          admin_note?: string | null
          available_balance?: number | null
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
          pending_balance?: number | null
          phone?: string | null
          positive_rate?: number | null
          price_tier_id?: string | null
          price_tier_set_at?: string | null
          price_tier_set_by?: string | null
          rating?: number | null
          rating_communication?: number | null
          rating_helpfulness?: number | null
          rating_professionalism?: number | null
          specialties?: string[] | null
          status?: string | null
          title?: string | null
          total_earnings?: number | null
          total_reviews?: number | null
          total_sessions?: number | null
          training_background?: string | null
          trust_level?: number | null
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
          withdrawn_amount?: number | null
        }
        Update: {
          admin_note?: string | null
          available_balance?: number | null
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
          pending_balance?: number | null
          phone?: string | null
          positive_rate?: number | null
          price_tier_id?: string | null
          price_tier_set_at?: string | null
          price_tier_set_by?: string | null
          rating?: number | null
          rating_communication?: number | null
          rating_helpfulness?: number | null
          rating_professionalism?: number | null
          specialties?: string[] | null
          status?: string | null
          title?: string | null
          total_earnings?: number | null
          total_reviews?: number | null
          total_sessions?: number | null
          training_background?: string | null
          trust_level?: number | null
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
          withdrawn_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "human_coaches_price_tier_id_fkey"
            columns: ["price_tier_id"]
            isOneToOne: false
            referencedRelation: "coach_price_tiers"
            referencedColumns: ["id"]
          },
        ]
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
      og_configurations: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_height: number | null
          image_url: string | null
          image_width: number | null
          is_active: boolean | null
          og_title: string | null
          page_key: string
          site_name: string | null
          title: string | null
          updated_at: string | null
          updated_by: string | null
          url: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_height?: number | null
          image_url?: string | null
          image_width?: number | null
          is_active?: boolean | null
          og_title?: string | null
          page_key: string
          site_name?: string | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
          url?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_height?: number | null
          image_url?: string | null
          image_width?: number | null
          is_active?: boolean | null
          og_title?: string | null
          page_key?: string
          site_name?: string | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
          url?: string | null
        }
        Relationships: []
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
      page_tour_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          page_key: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          page_key: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          page_key?: string
          user_id?: string
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
          key_insight: string | null
          messages: Json | null
          micro_action: string | null
          problem_type: string | null
          see_it: Json | null
          sense_it: Json | null
          session_summary: string | null
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
          key_insight?: string | null
          messages?: Json | null
          micro_action?: string | null
          problem_type?: string | null
          see_it?: Json | null
          sense_it?: Json | null
          session_summary?: string | null
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
          key_insight?: string | null
          messages?: Json | null
          micro_action?: string | null
          problem_type?: string | null
          see_it?: Json | null
          sense_it?: Json | null
          session_summary?: string | null
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
      partner_product_commissions: {
        Row: {
          commission_rate_l1: number
          commission_rate_l2: number
          created_at: string | null
          id: string
          is_enabled: boolean
          package_key: string
          partner_level_rule_id: string
          updated_at: string | null
        }
        Insert: {
          commission_rate_l1?: number
          commission_rate_l2?: number
          created_at?: string | null
          id?: string
          is_enabled?: boolean
          package_key: string
          partner_level_rule_id: string
          updated_at?: string | null
        }
        Update: {
          commission_rate_l1?: number
          commission_rate_l2?: number
          created_at?: string | null
          id?: string
          is_enabled?: boolean
          package_key?: string
          partner_level_rule_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_product_commissions_partner_level_rule_id_fkey"
            columns: ["partner_level_rule_id"]
            isOneToOne: false
            referencedRelation: "partner_level_rules"
            referencedColumns: ["id"]
          },
        ]
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
          default_product_type: string | null
          default_quota_amount: number | null
          id: string
          partner_code: string
          partner_level: string | null
          partner_type: string | null
          pending_balance: number
          prepurchase_count: number | null
          prepurchase_expires_at: string | null
          selected_experience_packages: string[] | null
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
          default_product_type?: string | null
          default_quota_amount?: number | null
          id?: string
          partner_code: string
          partner_level?: string | null
          partner_type?: string | null
          pending_balance?: number
          prepurchase_count?: number | null
          prepurchase_expires_at?: string | null
          selected_experience_packages?: string[] | null
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
          default_product_type?: string | null
          default_quota_amount?: number | null
          id?: string
          partner_code?: string
          partner_level?: string | null
          partner_type?: string | null
          pending_balance?: number
          prepurchase_count?: number | null
          prepurchase_expires_at?: string | null
          selected_experience_packages?: string[] | null
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
          ai_call_enabled: boolean | null
          ai_call_preferences: Json | null
          auth_provider: string | null
          avatar_url: string | null
          bio: string | null
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
          deleted_at: string | null
          disabled_at: string | null
          disabled_reason: string | null
          display_name: string | null
          gratitude_reminder_slots: Json | null
          has_seen_onboarding: boolean | null
          id: string
          intensity_reminder_enabled: boolean | null
          intensity_reminder_time: string | null
          is_disabled: boolean | null
          last_intensity_reminder_shown: string | null
          last_reminder_shown: string | null
          last_seen_at: string | null
          mood_status: string | null
          notification_frequency: string | null
          phone: string | null
          phone_country_code: string | null
          preferred_coach: string | null
          preferred_encouragement_style: string | null
          profile_completed: boolean | null
          profile_completed_at: string | null
          reminder_auto_dismiss_seconds: number | null
          reminder_enabled: boolean | null
          reminder_time: string | null
          smart_notification_enabled: boolean | null
          timezone: string | null
          todo_reminder_slots: Json | null
          updated_at: string
          voice_clone_status: string | null
          voice_gender: string | null
          voice_rate: number | null
          wechat_appid: string | null
          wechat_appsecret: string | null
          wechat_bind_prompted: boolean | null
          wechat_bind_prompted_at: string | null
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
          ai_call_enabled?: boolean | null
          ai_call_preferences?: Json | null
          auth_provider?: string | null
          avatar_url?: string | null
          bio?: string | null
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
          deleted_at?: string | null
          disabled_at?: string | null
          disabled_reason?: string | null
          display_name?: string | null
          gratitude_reminder_slots?: Json | null
          has_seen_onboarding?: boolean | null
          id: string
          intensity_reminder_enabled?: boolean | null
          intensity_reminder_time?: string | null
          is_disabled?: boolean | null
          last_intensity_reminder_shown?: string | null
          last_reminder_shown?: string | null
          last_seen_at?: string | null
          mood_status?: string | null
          notification_frequency?: string | null
          phone?: string | null
          phone_country_code?: string | null
          preferred_coach?: string | null
          preferred_encouragement_style?: string | null
          profile_completed?: boolean | null
          profile_completed_at?: string | null
          reminder_auto_dismiss_seconds?: number | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          smart_notification_enabled?: boolean | null
          timezone?: string | null
          todo_reminder_slots?: Json | null
          updated_at?: string
          voice_clone_status?: string | null
          voice_gender?: string | null
          voice_rate?: number | null
          wechat_appid?: string | null
          wechat_appsecret?: string | null
          wechat_bind_prompted?: boolean | null
          wechat_bind_prompted_at?: string | null
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
          ai_call_enabled?: boolean | null
          ai_call_preferences?: Json | null
          auth_provider?: string | null
          avatar_url?: string | null
          bio?: string | null
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
          deleted_at?: string | null
          disabled_at?: string | null
          disabled_reason?: string | null
          display_name?: string | null
          gratitude_reminder_slots?: Json | null
          has_seen_onboarding?: boolean | null
          id?: string
          intensity_reminder_enabled?: boolean | null
          intensity_reminder_time?: string | null
          is_disabled?: boolean | null
          last_intensity_reminder_shown?: string | null
          last_reminder_shown?: string | null
          last_seen_at?: string | null
          mood_status?: string | null
          notification_frequency?: string | null
          phone?: string | null
          phone_country_code?: string | null
          preferred_coach?: string | null
          preferred_encouragement_style?: string | null
          profile_completed?: boolean | null
          profile_completed_at?: string | null
          reminder_auto_dismiss_seconds?: number | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          smart_notification_enabled?: boolean | null
          timezone?: string | null
          todo_reminder_slots?: Json | null
          updated_at?: string
          voice_clone_status?: string | null
          voice_gender?: string | null
          voice_rate?: number | null
          wechat_appid?: string | null
          wechat_appsecret?: string | null
          wechat_bind_prompted?: boolean | null
          wechat_bind_prompted_at?: string | null
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
      scenario_strategy_analytics: {
        Row: {
          briefing_generated: boolean | null
          completed_naturally: boolean | null
          conversation_duration_seconds: number | null
          conversation_id: string | null
          created_at: string
          ended_at: string | null
          id: string
          message_count: number | null
          scenario_id: string
          scenario_title: string
          started_at: string
          strategy_mode: string | null
          updated_at: string
          user_id: string
          user_satisfaction: number | null
        }
        Insert: {
          briefing_generated?: boolean | null
          completed_naturally?: boolean | null
          conversation_duration_seconds?: number | null
          conversation_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          message_count?: number | null
          scenario_id: string
          scenario_title: string
          started_at?: string
          strategy_mode?: string | null
          updated_at?: string
          user_id: string
          user_satisfaction?: number | null
        }
        Update: {
          briefing_generated?: boolean | null
          completed_naturally?: boolean | null
          conversation_duration_seconds?: number | null
          conversation_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          message_count?: number | null
          scenario_id?: string
          scenario_title?: string
          started_at?: string
          strategy_mode?: string | null
          updated_at?: string
          user_id?: string
          user_satisfaction?: number | null
        }
        Relationships: []
      }
      scl90_assessments: {
        Row: {
          ai_analysis: Json | null
          answers: Json
          anxiety_score: number
          camp_conversion_clicked_at: string | null
          camp_conversion_joined_at: string | null
          created_at: string | null
          depression_score: number
          gsi: number
          hostility_score: number
          id: string
          interpersonal_score: number
          is_paid: boolean | null
          obsessive_score: number
          order_id: string | null
          other_score: number
          paid_at: string | null
          paranoid_score: number
          phobic_score: number
          positive_count: number
          positive_score_avg: number
          previous_assessment_id: string | null
          primary_symptom: string | null
          psychoticism_score: number
          secondary_symptom: string | null
          severity_level: string
          somatization_score: number
          total_score: number
          updated_at: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          ai_analysis?: Json | null
          answers: Json
          anxiety_score: number
          camp_conversion_clicked_at?: string | null
          camp_conversion_joined_at?: string | null
          created_at?: string | null
          depression_score: number
          gsi: number
          hostility_score: number
          id?: string
          interpersonal_score: number
          is_paid?: boolean | null
          obsessive_score: number
          order_id?: string | null
          other_score: number
          paid_at?: string | null
          paranoid_score: number
          phobic_score: number
          positive_count: number
          positive_score_avg: number
          previous_assessment_id?: string | null
          primary_symptom?: string | null
          psychoticism_score: number
          secondary_symptom?: string | null
          severity_level: string
          somatization_score: number
          total_score: number
          updated_at?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          ai_analysis?: Json | null
          answers?: Json
          anxiety_score?: number
          camp_conversion_clicked_at?: string | null
          camp_conversion_joined_at?: string | null
          created_at?: string | null
          depression_score?: number
          gsi?: number
          hostility_score?: number
          id?: string
          interpersonal_score?: number
          is_paid?: boolean | null
          obsessive_score?: number
          order_id?: string | null
          other_score?: number
          paid_at?: string | null
          paranoid_score?: number
          phobic_score?: number
          positive_count?: number
          positive_score_avg?: number
          previous_assessment_id?: string | null
          primary_symptom?: string | null
          psychoticism_score?: number
          secondary_symptom?: string | null
          severity_level?: string
          somatization_score?: number
          total_score?: number
          updated_at?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scl90_assessments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scl90_assessments_previous_assessment_id_fkey"
            columns: ["previous_assessment_id"]
            isOneToOne: false
            referencedRelation: "scl90_assessments"
            referencedColumns: ["id"]
          },
        ]
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
      user_action_witness: {
        Row: {
          action_type: string
          ai_witness: string
          camp_id: string | null
          created_at: string
          difficulty_rating: number | null
          id: string
          journal_id: string | null
          original_action: string
          transition_label: string | null
          user_id: string
          user_reflection: string | null
        }
        Insert: {
          action_type?: string
          ai_witness: string
          camp_id?: string | null
          created_at?: string
          difficulty_rating?: number | null
          id?: string
          journal_id?: string | null
          original_action: string
          transition_label?: string | null
          user_id: string
          user_reflection?: string | null
        }
        Update: {
          action_type?: string
          ai_witness?: string
          camp_id?: string | null
          created_at?: string
          difficulty_rating?: number | null
          id?: string
          journal_id?: string | null
          original_action?: string
          transition_label?: string | null
          user_id?: string
          user_reflection?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_action_witness_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "training_camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_action_witness_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "wealth_journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      user_awakening_progress: {
        Row: {
          baseline_awakening: number | null
          baseline_behavior: number | null
          baseline_belief: number | null
          baseline_created_at: string | null
          baseline_dominant_type: string | null
          baseline_emotion: number | null
          baseline_reaction_pattern: string | null
          became_partner_at: string | null
          camp_completed_at: string | null
          consecutive_days: number | null
          created_at: string | null
          current_awakening: number | null
          current_level: number | null
          id: string
          total_challenges_completed: number | null
          total_giving_actions: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          baseline_awakening?: number | null
          baseline_behavior?: number | null
          baseline_belief?: number | null
          baseline_created_at?: string | null
          baseline_dominant_type?: string | null
          baseline_emotion?: number | null
          baseline_reaction_pattern?: string | null
          became_partner_at?: string | null
          camp_completed_at?: string | null
          consecutive_days?: number | null
          created_at?: string | null
          current_awakening?: number | null
          current_level?: number | null
          id?: string
          total_challenges_completed?: number | null
          total_giving_actions?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          baseline_awakening?: number | null
          baseline_behavior?: number | null
          baseline_belief?: number | null
          baseline_created_at?: string | null
          baseline_dominant_type?: string | null
          baseline_emotion?: number | null
          baseline_reaction_pattern?: string | null
          became_partner_at?: string | null
          camp_completed_at?: string | null
          consecutive_days?: number | null
          created_at?: string | null
          current_awakening?: number | null
          current_level?: number | null
          id?: string
          total_challenges_completed?: number | null
          total_giving_actions?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      user_coach_memory: {
        Row: {
          coach_type: string | null
          content: string
          created_at: string | null
          id: string
          importance_score: number | null
          last_mentioned_at: string | null
          layer: string | null
          memory_type: string
          mentioned_count: number | null
          source_session_id: string | null
          user_id: string
        }
        Insert: {
          coach_type?: string | null
          content: string
          created_at?: string | null
          id?: string
          importance_score?: number | null
          last_mentioned_at?: string | null
          layer?: string | null
          memory_type: string
          mentioned_count?: number | null
          source_session_id?: string | null
          user_id: string
        }
        Update: {
          coach_type?: string | null
          content?: string
          created_at?: string | null
          id?: string
          importance_score?: number | null
          last_mentioned_at?: string | null
          layer?: string | null
          memory_type?: string
          mentioned_count?: number | null
          source_session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_favorite_beliefs: {
        Row: {
          belief_text: string
          camp_id: string | null
          created_at: string
          display_order: number | null
          id: string
          is_reminder: boolean | null
          source_day: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          belief_text: string
          camp_id?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_reminder?: boolean | null
          source_day?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          belief_text?: string
          camp_id?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_reminder?: boolean | null
          source_day?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_beliefs_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "training_camps"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feature_usage: {
        Row: {
          created_at: string
          feature_key: string
          id: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          feature_key: string
          id?: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          feature_key?: string
          id?: string
          updated_at?: string
          usage_count?: number
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
      user_quick_menu_config: {
        Row: {
          created_at: string
          custom_slot_1: Json
          custom_slot_2: Json
          custom_slot_3: Json | null
          home_page_path: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_slot_1?: Json
          custom_slot_2?: Json
          custom_slot_3?: Json | null
          home_page_path?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_slot_1?: Json
          custom_slot_2?: Json
          custom_slot_3?: Json | null
          home_page_path?: string
          id?: string
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
      user_training_weights: {
        Row: {
          adjustment_reason: string | null
          behavior_weight: number | null
          belief_weight: number | null
          camp_id: string | null
          created_at: string | null
          emotion_weight: number | null
          focus_areas: Json | null
          id: string
          user_id: string
          week_number: number
        }
        Insert: {
          adjustment_reason?: string | null
          behavior_weight?: number | null
          belief_weight?: number | null
          camp_id?: string | null
          created_at?: string | null
          emotion_weight?: number | null
          focus_areas?: Json | null
          id?: string
          user_id: string
          week_number: number
        }
        Update: {
          adjustment_reason?: string | null
          behavior_weight?: number | null
          belief_weight?: number | null
          camp_id?: string | null
          created_at?: string | null
          emotion_weight?: number | null
          focus_areas?: Json | null
          id?: string
          user_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_training_weights_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "training_camps"
            referencedColumns: ["id"]
          },
        ]
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
      user_wealth_profile: {
        Row: {
          assessment_id: string | null
          coach_strategy: Json | null
          created_at: string
          current_week: number | null
          dominant_belief: string | null
          dominant_emotion: string | null
          dominant_poor: string | null
          health_score: number | null
          id: string
          last_updated_from_journal: string | null
          profile_snapshots: Json | null
          reaction_pattern: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_id?: string | null
          coach_strategy?: Json | null
          created_at?: string
          current_week?: number | null
          dominant_belief?: string | null
          dominant_emotion?: string | null
          dominant_poor?: string | null
          health_score?: number | null
          id?: string
          last_updated_from_journal?: string | null
          profile_snapshots?: Json | null
          reaction_pattern?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_id?: string | null
          coach_strategy?: Json | null
          created_at?: string
          current_week?: number | null
          dominant_belief?: string | null
          dominant_emotion?: string | null
          dominant_poor?: string | null
          health_score?: number | null
          id?: string
          last_updated_from_journal?: string | null
          profile_snapshots?: Json | null
          reaction_pattern?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vibrant_life_sage_briefings: {
        Row: {
          action: string | null
          conversation_id: string | null
          created_at: string | null
          id: string
          insight: string | null
          reasoning: string | null
          recommended_coach_type: string | null
          summary: string | null
          user_id: string
          user_issue_summary: string | null
        }
        Insert: {
          action?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          insight?: string | null
          reasoning?: string | null
          recommended_coach_type?: string | null
          summary?: string | null
          user_id: string
          user_issue_summary?: string | null
        }
        Update: {
          action?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          insight?: string | null
          reasoning?: string | null
          recommended_coach_type?: string | null
          summary?: string | null
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
          api_cost_cny: number | null
          api_cost_usd: number | null
          billed_minutes: number
          coach_key: string
          created_at: string | null
          duration_seconds: number
          id: string
          input_tokens: number | null
          output_tokens: number | null
          total_cost: number
          transcript_summary: string | null
          user_id: string
        }
        Insert: {
          api_cost_cny?: number | null
          api_cost_usd?: number | null
          billed_minutes?: number
          coach_key: string
          created_at?: string | null
          duration_seconds?: number
          id?: string
          input_tokens?: number | null
          output_tokens?: number | null
          total_cost?: number
          transcript_summary?: string | null
          user_id: string
        }
        Update: {
          api_cost_cny?: number | null
          api_cost_usd?: number | null
          billed_minutes?: number
          coach_key?: string
          created_at?: string | null
          duration_seconds?: number
          id?: string
          input_tokens?: number | null
          output_tokens?: number | null
          total_cost?: number
          transcript_summary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wealth_block_assessments: {
        Row: {
          answers: Json
          behavior_score: number
          belief_score: number
          created_at: string | null
          dominant_block: string
          dominant_poor: string | null
          emotion_score: number
          eye_score: number | null
          hand_score: number | null
          heart_score: number | null
          id: string
          mouth_score: number | null
          previous_assessment_id: string | null
          reaction_pattern: string
          updated_at: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          answers: Json
          behavior_score: number
          belief_score: number
          created_at?: string | null
          dominant_block: string
          dominant_poor?: string | null
          emotion_score: number
          eye_score?: number | null
          hand_score?: number | null
          heart_score?: number | null
          id?: string
          mouth_score?: number | null
          previous_assessment_id?: string | null
          reaction_pattern: string
          updated_at?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          answers?: Json
          behavior_score?: number
          belief_score?: number
          created_at?: string | null
          dominant_block?: string
          dominant_poor?: string | null
          emotion_score?: number
          eye_score?: number | null
          hand_score?: number | null
          heart_score?: number | null
          id?: string
          mouth_score?: number | null
          previous_assessment_id?: string | null
          reaction_pattern?: string
          updated_at?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wealth_block_assessments_previous_assessment_id_fkey"
            columns: ["previous_assessment_id"]
            isOneToOne: false
            referencedRelation: "assessment_changes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wealth_block_assessments_previous_assessment_id_fkey"
            columns: ["previous_assessment_id"]
            isOneToOne: false
            referencedRelation: "wealth_block_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      wealth_coach_4_questions_briefings: {
        Row: {
          actions_avoided: string[] | null
          actions_performed: string[] | null
          belief_insight: string | null
          created_at: string
          emotion_feeling: string | null
          id: string
          session_id: string | null
          smallest_progress: string | null
          summary: string | null
          user_id: string
        }
        Insert: {
          actions_avoided?: string[] | null
          actions_performed?: string[] | null
          belief_insight?: string | null
          created_at?: string
          emotion_feeling?: string | null
          id?: string
          session_id?: string | null
          smallest_progress?: string | null
          summary?: string | null
          user_id: string
        }
        Update: {
          actions_avoided?: string[] | null
          actions_performed?: string[] | null
          belief_insight?: string | null
          created_at?: string
          emotion_feeling?: string | null
          id?: string
          session_id?: string | null
          smallest_progress?: string | null
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wealth_coach_4_questions_briefings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "wealth_coach_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      wealth_coach_sessions: {
        Row: {
          created_at: string
          current_stage: number | null
          id: string
          is_completed: boolean | null
          messages: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_stage?: number | null
          id?: string
          is_completed?: boolean | null
          messages?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_stage?: number | null
          id?: string
          is_completed?: boolean | null
          messages?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wealth_journal_entries: {
        Row: {
          action_completed_at: string | null
          action_completion: boolean | null
          action_difficulty: number | null
          action_reflection: string | null
          action_suggestion: string | null
          ai_insight: Json | null
          behavior_block: string | null
          behavior_score: number | null
          behavior_type: string | null
          belief_block: string | null
          belief_score: number | null
          belief_source: string | null
          belief_type: string | null
          briefing_content: Json | null
          camp_id: string | null
          created_at: string
          day_number: number
          emotion_block: string | null
          emotion_need: string | null
          emotion_score: number | null
          emotion_type: string | null
          giving_action: string | null
          id: string
          meditation_completed: boolean | null
          meditation_reflection: string | null
          new_belief: string | null
          old_belief: string | null
          personal_awakening: Json | null
          responsibility_items: string[] | null
          session_id: string | null
          share_completed: boolean | null
          shared_at: string | null
          smallest_progress: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action_completed_at?: string | null
          action_completion?: boolean | null
          action_difficulty?: number | null
          action_reflection?: string | null
          action_suggestion?: string | null
          ai_insight?: Json | null
          behavior_block?: string | null
          behavior_score?: number | null
          behavior_type?: string | null
          belief_block?: string | null
          belief_score?: number | null
          belief_source?: string | null
          belief_type?: string | null
          briefing_content?: Json | null
          camp_id?: string | null
          created_at?: string
          day_number: number
          emotion_block?: string | null
          emotion_need?: string | null
          emotion_score?: number | null
          emotion_type?: string | null
          giving_action?: string | null
          id?: string
          meditation_completed?: boolean | null
          meditation_reflection?: string | null
          new_belief?: string | null
          old_belief?: string | null
          personal_awakening?: Json | null
          responsibility_items?: string[] | null
          session_id?: string | null
          share_completed?: boolean | null
          shared_at?: string | null
          smallest_progress?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action_completed_at?: string | null
          action_completion?: boolean | null
          action_difficulty?: number | null
          action_reflection?: string | null
          action_suggestion?: string | null
          ai_insight?: Json | null
          behavior_block?: string | null
          behavior_score?: number | null
          behavior_type?: string | null
          belief_block?: string | null
          belief_score?: number | null
          belief_source?: string | null
          belief_type?: string | null
          briefing_content?: Json | null
          camp_id?: string | null
          created_at?: string
          day_number?: number
          emotion_block?: string | null
          emotion_need?: string | null
          emotion_score?: number | null
          emotion_type?: string | null
          giving_action?: string | null
          id?: string
          meditation_completed?: boolean | null
          meditation_reflection?: string | null
          new_belief?: string | null
          old_belief?: string | null
          personal_awakening?: Json | null
          responsibility_items?: string[] | null
          session_id?: string | null
          share_completed?: boolean | null
          shared_at?: string | null
          smallest_progress?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wealth_journal_entries_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "training_camps"
            referencedColumns: ["id"]
          },
        ]
      }
      wealth_meditations: {
        Row: {
          audio_url: string
          created_at: string
          day_number: number
          description: string | null
          duration_seconds: number
          id: string
          reflection_prompts: Json | null
          title: string
          transcript: string | null
          updated_at: string
        }
        Insert: {
          audio_url: string
          created_at?: string
          day_number: number
          description?: string | null
          duration_seconds?: number
          id?: string
          reflection_prompts?: Json | null
          title: string
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          audio_url?: string
          created_at?: string
          day_number?: number
          description?: string | null
          duration_seconds?: number
          id?: string
          reflection_prompts?: Json | null
          title?: string
          transcript?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      wechat_login_scenes: {
        Row: {
          confirmed_at: string | null
          created_at: string
          expires_at: string
          id: string
          mode: string
          openid: string | null
          scanned_at: string | null
          scene_str: string
          status: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          mode?: string
          openid?: string | null
          scanned_at?: string | null
          scene_str: string
          status?: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          mode?: string
          openid?: string | null
          scanned_at?: string | null
          scene_str?: string
          status?: string
          user_email?: string | null
          user_id?: string | null
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
      assessment_changes: {
        Row: {
          behavior_change_pct: number | null
          behavior_score: number | null
          belief_change_pct: number | null
          belief_score: number | null
          created_at: string | null
          emotion_change_pct: number | null
          emotion_score: number | null
          id: string | null
          prev_behavior_score: number | null
          prev_belief_score: number | null
          prev_emotion_score: number | null
          previous_assessment_id: string | null
          user_id: string | null
          version: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wealth_block_assessments_previous_assessment_id_fkey"
            columns: ["previous_assessment_id"]
            isOneToOne: false
            referencedRelation: "assessment_changes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wealth_block_assessments_previous_assessment_id_fkey"
            columns: ["previous_assessment_id"]
            isOneToOne: false
            referencedRelation: "wealth_block_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_coach_pending_balance: {
        Args: { p_amount: number; p_coach_id: string }
        Returns: undefined
      }
      add_coaching_balance: {
        Args: {
          p_bonus_amount?: number
          p_description?: string
          p_order_no?: string
          p_paid_amount: number
          p_user_id: string
        }
        Returns: {
          message: string
          new_balance: number
          success: boolean
        }[]
      }
      add_partner_pending_balance: {
        Args: { p_amount: number; p_partner_id: string }
        Returns: undefined
      }
      add_user_quota: {
        Args: { p_amount: number; p_user_id: string }
        Returns: {
          message: string
          new_remaining_quota: number
          success: boolean
        }[]
      }
      cleanup_expired_wechat_login_scenes: { Args: never; Returns: undefined }
      confirm_coach_settlement: {
        Args: { p_amount: number; p_coach_id: string }
        Returns: undefined
      }
      confirm_partner_commission: {
        Args: { p_amount: number; p_partner_id: string }
        Returns: undefined
      }
      deduct_coaching_balance: {
        Args: {
          p_amount: number
          p_appointment_id?: string
          p_description?: string
          p_user_id: string
        }
        Returns: {
          bonus_deducted: number
          message: string
          new_balance: number
          paid_deducted: number
          success: boolean
        }[]
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
      refund_coaching_balance: {
        Args: {
          p_appointment_id?: string
          p_bonus_amount?: number
          p_description?: string
          p_paid_amount: number
          p_user_id: string
        }
        Returns: {
          message: string
          new_balance: number
          success: boolean
        }[]
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
