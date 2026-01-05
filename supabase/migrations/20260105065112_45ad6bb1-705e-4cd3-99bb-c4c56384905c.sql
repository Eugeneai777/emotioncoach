-- Add share status tracking to wealth_journal_entries
ALTER TABLE public.wealth_journal_entries 
ADD COLUMN IF NOT EXISTS share_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS shared_at timestamp with time zone;