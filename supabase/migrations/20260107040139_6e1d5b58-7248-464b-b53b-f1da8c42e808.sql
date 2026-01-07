-- Allow null user_id for guest orders
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;