-- Create declaration_favorites table
CREATE TABLE public.declaration_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  declaration TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'purple',
  custom_background TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.declaration_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own declaration favorites"
ON public.declaration_favorites
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);