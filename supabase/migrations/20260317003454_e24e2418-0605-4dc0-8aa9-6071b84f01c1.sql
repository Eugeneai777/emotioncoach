
CREATE TABLE public.family_album_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  nickname TEXT DEFAULT '长辈',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(share_token)
);

ALTER TABLE public.family_album_shares ENABLE ROW LEVEL SECURITY;

-- Owner can read their own shares
CREATE POLICY "Users can read own shares"
  ON public.family_album_shares FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Owner can create shares
CREATE POLICY "Users can create own shares"
  ON public.family_album_shares FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Owner can update own shares
CREATE POLICY "Users can update own shares"
  ON public.family_album_shares FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Anyone can read shares by token (for guest album view)
CREATE POLICY "Anyone can read shares by token"
  ON public.family_album_shares FOR SELECT
  TO anon
  USING (is_active = true);
