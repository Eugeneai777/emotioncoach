-- 1. Admin RLS for coach_services
CREATE POLICY "管理员可以管理所有服务"
ON public.coach_services
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Sync trigger function
CREATE OR REPLACE FUNCTION public.sync_coach_services_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price numeric;
BEGIN
  IF NEW.price_tier_id IS DISTINCT FROM OLD.price_tier_id AND NEW.price_tier_id IS NOT NULL THEN
    SELECT price INTO v_price FROM public.coach_price_tiers WHERE id = NEW.price_tier_id;
    IF v_price IS NOT NULL THEN
      UPDATE public.coach_services SET price = v_price WHERE coach_id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Trigger
DROP TRIGGER IF EXISTS trg_sync_coach_services_price ON public.human_coaches;
CREATE TRIGGER trg_sync_coach_services_price
AFTER UPDATE OF price_tier_id ON public.human_coaches
FOR EACH ROW
EXECUTE FUNCTION public.sync_coach_services_price();