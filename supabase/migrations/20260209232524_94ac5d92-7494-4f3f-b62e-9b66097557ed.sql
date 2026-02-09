
-- Fix: auto-sync likes_count via trigger instead of frontend updates

CREATE OR REPLACE FUNCTION public.sync_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET likes_count = (
      SELECT count(*) FROM post_likes WHERE post_id = NEW.post_id
    ) WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET likes_count = (
      SELECT count(*) FROM post_likes WHERE post_id = OLD.post_id
    ) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_sync_likes_count
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.sync_likes_count();

-- Fix existing data
UPDATE community_posts SET likes_count = (
  SELECT count(*) FROM post_likes WHERE post_likes.post_id = community_posts.id
);
