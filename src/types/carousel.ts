export interface CarouselModule {
  id: string;
  enabled: boolean;
  order: number;
  priority?: number;
  hasUpdate?: boolean;
}

export interface CarouselContext {
  hasReminder: boolean;
  hasActiveCamp: boolean;
  campHasMilestone: boolean;
  hasGoalUpdate: boolean;
}

export type ModuleId = 
  | 'emotion_steps' 
  | 'daily_reminder' 
  | 'training_camp' 
  | 'today_progress' 
  | 'goal_progress'
  | 'custom';

export interface CustomCard {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  emoji: string;
  background_type: "gradient" | "image" | "solid";
  background_value?: string;
  text_color: "dark" | "light";
  image_url?: string;
  image_position?: "right" | "left" | "top" | "background";
  has_reminder: boolean;
  reminder_time?: string;
  reminder_message?: string;
  last_reminder_shown?: string;
  action_text?: string;
  action_type?: string;
  action_data?: any;
  is_active: boolean;
  display_order: number;
}

export interface CarouselSettings {
  modules: CarouselModule[];
  autoPlay: boolean;
  interval: number;
}
