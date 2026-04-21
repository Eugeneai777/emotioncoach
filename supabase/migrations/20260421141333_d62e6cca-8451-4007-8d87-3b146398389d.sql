-- Add BEFORE INSERT trigger to auto-apply tier price when creating coach services
CREATE OR REPLACE FUNCTION public.apply_tier_price_on_service_insert()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  tier_price numeric;
BEGIN
  IF (NEW.price IS NULL OR NEW.price = 0) THEN
    SELECT cpt.price INTO tier_price
    FROM public.human_coaches hc
    JOIN public.coach_price_tiers cpt ON cpt.id = hc.price_tier_id
    WHERE hc.id = NEW.coach_id;
    
    IF tier_price IS NOT NULL THEN
      NEW.price := tier_price;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_tier_price_on_service_insert ON public.coach_services;

CREATE TRIGGER trg_apply_tier_price_on_service_insert
BEFORE INSERT ON public.coach_services
FOR EACH ROW EXECUTE FUNCTION public.apply_tier_price_on_service_insert();