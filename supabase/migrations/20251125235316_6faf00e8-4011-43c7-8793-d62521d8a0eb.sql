-- Create training camps table
CREATE TABLE public.training_camps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Training camp information
  camp_name TEXT NOT NULL DEFAULT '21天情绪日记训练营',
  camp_type TEXT NOT NULL DEFAULT 'emotion_journal_21',
  duration_days INTEGER NOT NULL DEFAULT 21,
  
  -- Time configuration
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Progress tracking
  current_day INTEGER DEFAULT 0,
  completed_days INTEGER DEFAULT 0,
  check_in_dates JSONB DEFAULT '[]'::jsonb,
  
  -- Milestone status
  milestone_7_reached BOOLEAN DEFAULT FALSE,
  milestone_14_reached BOOLEAN DEFAULT FALSE,
  milestone_21_completed BOOLEAN DEFAULT FALSE,
  
  -- Status
  status TEXT DEFAULT 'active',
  
  -- Source template
  template_id UUID,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_camps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own camps"
  ON public.training_camps
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own camps"
  ON public.training_camps
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own camps"
  ON public.training_camps
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own camps"
  ON public.training_camps
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create goal templates table
CREATE TABLE public.goal_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Template metadata
  template_name TEXT NOT NULL,
  template_description TEXT,
  template_icon TEXT DEFAULT '🎯',
  template_category TEXT DEFAULT 'custom',
  
  -- Goal configuration
  goal_type TEXT NOT NULL,
  goal_category TEXT DEFAULT 'frequency',
  target_count INTEGER NOT NULL DEFAULT 3,
  description TEXT,
  
  -- Intensity goal configuration
  intensity_min NUMERIC,
  intensity_max NUMERIC,
  intensity_target_days INTEGER,
  
  -- Tag goal configuration
  target_tag_id UUID,
  target_tag_name TEXT,
  target_reduction_percent NUMERIC,
  
  -- Training camp specific
  is_training_camp BOOLEAN DEFAULT FALSE,
  camp_duration_days INTEGER DEFAULT 21,
  daily_task_template JSONB,
  milestone_rewards JSONB,
  
  -- Usage statistics
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.goal_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own templates"
  ON public.goal_templates
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger for training_camps
CREATE TRIGGER update_training_camps_updated_at
  BEFORE UPDATE ON public.training_camps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for goal_templates
CREATE TRIGGER update_goal_templates_updated_at
  BEFORE UPDATE ON public.goal_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();