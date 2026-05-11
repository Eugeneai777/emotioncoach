
-- 1) Add claim_code columns
ALTER TABLE public.competitiveness_assessments
  ADD COLUMN IF NOT EXISTS claim_code TEXT UNIQUE;

ALTER TABLE public.midlife_awakening_assessments
  ADD COLUMN IF NOT EXISTS claim_code TEXT UNIQUE;

-- 2) Generators (mirror partner_assessment / emotion_health pattern)
CREATE OR REPLACE FUNCTION public.generate_competitiveness_claim_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_charset CONSTANT TEXT := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  v_code TEXT;
  v_attempt INT := 0;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := '';
    FOR i IN 1..6 LOOP
      v_code := v_code || substr(v_charset, 1 + floor(random() * length(v_charset))::int, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM public.competitiveness_assessments WHERE claim_code = v_code)
      INTO v_exists;
    IF NOT v_exists THEN RETURN v_code; END IF;
    v_attempt := v_attempt + 1;
    IF v_attempt > 20 THEN
      RAISE EXCEPTION 'Failed to generate unique competitiveness claim_code after 20 attempts';
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_midlife_awakening_claim_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_charset CONSTANT TEXT := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  v_code TEXT;
  v_attempt INT := 0;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := '';
    FOR i IN 1..6 LOOP
      v_code := v_code || substr(v_charset, 1 + floor(random() * length(v_charset))::int, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM public.midlife_awakening_assessments WHERE claim_code = v_code)
      INTO v_exists;
    IF NOT v_exists THEN RETURN v_code; END IF;
    v_attempt := v_attempt + 1;
    IF v_attempt > 20 THEN
      RAISE EXCEPTION 'Failed to generate unique midlife claim_code after 20 attempts';
    END IF;
  END LOOP;
END;
$$;

-- 3) BEFORE INSERT triggers
CREATE OR REPLACE FUNCTION public.set_competitiveness_claim_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.claim_code IS NULL THEN
    NEW.claim_code := public.generate_competitiveness_claim_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_midlife_awakening_claim_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.claim_code IS NULL THEN
    NEW.claim_code := public.generate_midlife_awakening_claim_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_competitiveness_claim_code ON public.competitiveness_assessments;
CREATE TRIGGER trg_set_competitiveness_claim_code
BEFORE INSERT ON public.competitiveness_assessments
FOR EACH ROW EXECUTE FUNCTION public.set_competitiveness_claim_code();

DROP TRIGGER IF EXISTS trg_set_midlife_awakening_claim_code ON public.midlife_awakening_assessments;
CREATE TRIGGER trg_set_midlife_awakening_claim_code
BEFORE INSERT ON public.midlife_awakening_assessments
FOR EACH ROW EXECUTE FUNCTION public.set_midlife_awakening_claim_code();

-- 4) Backfill existing rows
UPDATE public.competitiveness_assessments
   SET claim_code = public.generate_competitiveness_claim_code()
 WHERE claim_code IS NULL;

UPDATE public.midlife_awakening_assessments
   SET claim_code = public.generate_midlife_awakening_claim_code()
 WHERE claim_code IS NULL;
