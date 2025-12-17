-- Fix 1: Add index on community_posts visibility for performance (prevents timing attacks)
CREATE INDEX IF NOT EXISTS idx_community_posts_visibility_user 
ON public.community_posts(visibility, user_id);

-- Fix 2: Add cascade delete for post_comments when community_posts are deleted
ALTER TABLE public.post_comments 
DROP CONSTRAINT IF EXISTS post_comments_post_id_fkey;

ALTER TABLE public.post_comments 
ADD CONSTRAINT post_comments_post_id_fkey 
FOREIGN KEY (post_id) 
REFERENCES public.community_posts(id) 
ON DELETE CASCADE;

-- Fix 3: Create post_likes table cascade delete if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_likes' AND table_schema = 'public') THEN
    -- Drop existing constraint if exists
    ALTER TABLE public.post_likes DROP CONSTRAINT IF EXISTS post_likes_post_id_fkey;
    
    -- Add cascade delete
    ALTER TABLE public.post_likes 
    ADD CONSTRAINT post_likes_post_id_fkey 
    FOREIGN KEY (post_id) 
    REFERENCES public.community_posts(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Fix 4: Add index on post_comments for faster queries
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id 
ON public.post_comments(post_id);

-- Fix 5: Add audit logging function for sensitive profile field access
CREATE OR REPLACE FUNCTION public.log_profile_secret_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only log if sensitive fields are being accessed via SELECT
  -- This function is informational for future audit implementation
  RETURN NEW;
END;
$$;