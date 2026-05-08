-- 1) Add claim_code column
ALTER TABLE public.emotion_health_assessments
  ADD COLUMN IF NOT EXISTS claim_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS emotion_health_assessments_claim_code_key
  ON public.emotion_health_assessments(claim_code)
  WHERE claim_code IS NOT NULL;

-- 2) Generator function
CREATE OR REPLACE FUNCTION public.generate_emotion_health_claim_code()
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

    SELECT EXISTS(SELECT 1 FROM public.emotion_health_assessments WHERE claim_code = v_code)
      INTO v_exists;

    IF NOT v_exists THEN
      RETURN v_code;
    END IF;

    v_attempt := v_attempt + 1;
    IF v_attempt > 20 THEN
      RAISE EXCEPTION 'Failed to generate unique emotion_health claim_code after 20 attempts';
    END IF;
  END LOOP;
END;
$$;

-- 3) Trigger: auto-fill on insert
CREATE OR REPLACE FUNCTION public.set_emotion_health_claim_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.claim_code IS NULL THEN
    NEW.claim_code := public.generate_emotion_health_claim_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_emotion_health_claim_code ON public.emotion_health_assessments;
CREATE TRIGGER trg_set_emotion_health_claim_code
  BEFORE INSERT ON public.emotion_health_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_emotion_health_claim_code();

-- 4) Backfill historical rows
DO $$
DECLARE
  r RECORD;
  v_code TEXT;
BEGIN
  FOR r IN
    SELECT id FROM public.emotion_health_assessments WHERE claim_code IS NULL
  LOOP
    v_code := public.generate_emotion_health_claim_code();
    UPDATE public.emotion_health_assessments
       SET claim_code = v_code
     WHERE id = r.id;
  END LOOP;
END $$;