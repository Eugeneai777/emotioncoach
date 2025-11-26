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
  | 'goal_progress';

export interface CarouselSettings {
  modules: CarouselModule[];
  autoPlay: boolean;
  interval: number;
}
