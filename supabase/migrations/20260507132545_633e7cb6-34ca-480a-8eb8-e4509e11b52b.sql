-- 1) Add claim_code column to partner_assessment_results
ALTER TABLE public.partner_assessment_results
  ADD COLUMN IF NOT EXISTS claim_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS partner_assessment_results_claim_code_key
  ON public.partner_assessment_results(claim_code)
  WHERE claim_code IS NOT NULL;

-- 2) Generator function (6-char, no 0/O/1/I/L)
CREATE OR REPLACE FUNCTION public.generate_assessment_claim_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

    SELECT EXISTS(SELECT 1 FROM public.partner_assessment_results WHERE claim_code = v_code)
      INTO v_exists;

    IF NOT v_exists THEN
      RETURN v_code;
    END IF;

    v_attempt := v_attempt + 1;
    IF v_attempt > 20 THEN
      RAISE EXCEPTION 'Failed to generate unique claim_code after 20 attempts';
    END IF;
  END LOOP;
END;
$$;

-- 3) Trigger: auto-fill on insert if null
CREATE OR REPLACE FUNCTION public.set_assessment_claim_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.claim_code IS NULL THEN
    NEW.claim_code := public.generate_assessment_claim_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_assessment_claim_code ON public.partner_assessment_results;
CREATE TRIGGER trg_set_assessment_claim_code
  BEFORE INSERT ON public.partner_assessment_results
  FOR EACH ROW
  EXECUTE FUNCTION public.set_assessment_claim_code();

-- 4) Backfill historical rows for male_midlife_vitality
DO $$
DECLARE
  r RECORD;
  v_code TEXT;
BEGIN
  FOR r IN
    SELECT par.id
    FROM public.partner_assessment_results par
    JOIN public.partner_assessment_templates pat ON pat.id = par.template_id
    WHERE par.claim_code IS NULL
      AND pat.assessment_key = 'male_midlife_vitality'
  LOOP
    v_code := public.generate_assessment_claim_code();
    UPDATE public.partner_assessment_results
       SET claim_code = v_code
     WHERE id = r.id;
  END LOOP;
END $$;