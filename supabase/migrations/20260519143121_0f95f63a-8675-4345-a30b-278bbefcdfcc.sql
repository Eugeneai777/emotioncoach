
-- ============= coach_voice_clones =============
CREATE TABLE public.coach_voice_clones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_name text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male','female')),
  source text NOT NULL DEFAULT 'cloned' CHECK (source IN ('cloned','preset')),
  elevenlabs_voice_id text NOT NULL,
  sample_storage_path text,
  display_order int NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_name, source)
);

CREATE INDEX idx_coach_voice_clones_active ON public.coach_voice_clones (is_active, display_order);

ALTER TABLE public.coach_voice_clones ENABLE ROW LEVEL SECURITY;
-- 无 policy = 客户端零权限。仅服务角色（edge function）可读写。

CREATE TRIGGER trg_coach_voice_clones_updated_at
BEFORE UPDATE ON public.coach_voice_clones
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= coach_voice_generations =============
CREATE TABLE public.coach_voice_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_clone_id uuid NOT NULL REFERENCES public.coach_voice_clones(id) ON DELETE CASCADE,
  coach_name text NOT NULL,
  template_key text NOT NULL,
  hook_type text NOT NULL CHECK (hook_type IN ('direct399','communityNurture')),
  text_content text NOT NULL,
  audio_storage_path text NOT NULL,
  duration_seconds numeric,
  created_by_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_coach_voice_generations_recent ON public.coach_voice_generations (created_at DESC);

ALTER TABLE public.coach_voice_generations ENABLE ROW LEVEL SECURITY;
-- 无 policy = 客户端零权限，仅 edge function 操作。

-- ============= Storage policies (voice-recordings bucket already exists, private) =============
-- 服务角色已自带全权限，无需新增 policy（service_role bypass RLS）。
