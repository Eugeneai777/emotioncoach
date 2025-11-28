export interface TrainingCamp {
  id: string;
  user_id: string;
  camp_name: string;
  camp_type: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  current_day: number;
  completed_days: number;
  check_in_dates: string[];
  milestone_7_reached: boolean;
  milestone_14_reached: boolean;
  milestone_21_completed: boolean;
  status: 'active' | 'completed' | 'abandoned';
  template_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MilestoneReward {
  name: string;
  icon: string;
  min_days: number;
}

export interface GoalTemplate {
  id: string;
  user_id: string;
  template_name: string;
  template_description?: string;
  template_icon: string;
  template_category: 'custom' | 'emotion' | 'lifestyle' | 'mindfulness' | 'growth';
  goal_type: string;
  goal_category: string;
  target_count: number;
  description?: string;
  intensity_min?: number;
  intensity_max?: number;
  intensity_target_days?: number;
  target_tag_id?: string;
  target_tag_name?: string;
  target_reduction_percent?: number;
  is_training_camp: boolean;
  camp_duration_days?: number;
  daily_task_template?: any;
  milestone_rewards?: Record<string, MilestoneReward>;
  use_count: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CampStage {
  stage: number;
  title: string;
  lessons: string[];
}

export interface LearningFormat {
  type: string;
  title: string;
  description: string;
  icon: string;
}

export interface CampTemplate {
  id: string;
  camp_type: string;
  camp_name: string;
  camp_subtitle?: string;
  description?: string;
  duration_days: number;
  theme_color: string;
  gradient: string;
  icon: string;
  category?: string;
  stages?: CampStage[];
  learning_formats?: LearningFormat[];
  prerequisites?: {
    required_camp?: string;
    message?: string;
  };
  target_audience?: string[];
  benefits?: string[];
  daily_practice?: any[];
  weekly_activities?: any[];
  research_stats?: any[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}
