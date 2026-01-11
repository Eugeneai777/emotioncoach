-- Create table for user quick menu configuration
CREATE TABLE public.user_quick_menu_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  home_page_path TEXT NOT NULL DEFAULT '/coach-space',
  custom_slot_1 JSONB NOT NULL DEFAULT '{"id": "custom1", "label": "财富日记", "path": "/wealth-camp-checkin", "icon": "BookOpen", "color": "bg-pink-500"}'::jsonb,
  custom_slot_2 JSONB NOT NULL DEFAULT '{"id": "custom2", "label": "能量工作室", "path": "/energy-studio", "icon": "Sparkles", "color": "bg-cyan-500"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_quick_menu_config ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own quick menu config" 
ON public.user_quick_menu_config 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quick menu config" 
ON public.user_quick_menu_config 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quick menu config" 
ON public.user_quick_menu_config 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_quick_menu_config_updated_at
BEFORE UPDATE ON public.user_quick_menu_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();