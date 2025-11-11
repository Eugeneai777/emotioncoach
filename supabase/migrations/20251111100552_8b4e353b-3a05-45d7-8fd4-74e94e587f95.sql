-- Create tags table for custom emotion tags
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#10b981',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for briefing-tag relationships
CREATE TABLE public.briefing_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  briefing_id UUID NOT NULL REFERENCES public.briefings(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(briefing_id, tag_id)
);

-- Enable RLS on tags table
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for tags
CREATE POLICY "Users can view their own tags"
ON public.tags
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags"
ON public.tags
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
ON public.tags
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
ON public.tags
FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on briefing_tags table
ALTER TABLE public.briefing_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for briefing_tags
CREATE POLICY "Users can view tags on their briefings"
ON public.briefing_tags
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.briefings
    JOIN public.conversations ON briefings.conversation_id = conversations.id
    WHERE briefings.id = briefing_tags.briefing_id
    AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add tags to their briefings"
ON public.briefing_tags
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.briefings
    JOIN public.conversations ON briefings.conversation_id = conversations.id
    WHERE briefings.id = briefing_tags.briefing_id
    AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove tags from their briefings"
ON public.briefing_tags
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.briefings
    JOIN public.conversations ON briefings.conversation_id = conversations.id
    WHERE briefings.id = briefing_tags.briefing_id
    AND conversations.user_id = auth.uid()
  )
);

-- Create index for better query performance
CREATE INDEX idx_briefing_tags_briefing_id ON public.briefing_tags(briefing_id);
CREATE INDEX idx_briefing_tags_tag_id ON public.briefing_tags(tag_id);
CREATE INDEX idx_tags_user_id ON public.tags(user_id);