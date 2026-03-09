
CREATE TABLE public.mama_energy_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  energy_body INTEGER NOT NULL DEFAULT 5,
  energy_emotion INTEGER NOT NULL DEFAULT 5,
  energy_patience INTEGER NOT NULL DEFAULT 5,
  energy_connection INTEGER NOT NULL DEFAULT 5,
  energy_self INTEGER NOT NULL DEFAULT 5,
  total_score INTEGER GENERATED ALWAYS AS (energy_body + energy_emotion + energy_patience + energy_connection + energy_self) STORED,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date)
);

ALTER TABLE public.mama_energy_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own energy logs"
  ON public.mama_energy_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own energy logs"
  ON public.mama_energy_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own energy logs"
  ON public.mama_energy_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
