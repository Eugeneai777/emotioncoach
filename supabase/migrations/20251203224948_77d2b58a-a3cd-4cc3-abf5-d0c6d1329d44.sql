-- 创建用户语音录音表
CREATE TABLE public.user_voice_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reminder_index INTEGER NOT NULL CHECK (reminder_index >= 0 AND reminder_index < 32),
  storage_path TEXT NOT NULL,
  duration_seconds NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, reminder_index)
);

-- 启用 RLS
ALTER TABLE public.user_voice_recordings ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能管理自己的录音
CREATE POLICY "用户可以查看自己的录音" ON public.user_voice_recordings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的录音" ON public.user_voice_recordings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的录音" ON public.user_voice_recordings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的录音" ON public.user_voice_recordings
  FOR DELETE USING (auth.uid() = user_id);

-- 创建 Storage Bucket（私有）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('voice-recordings', 'voice-recordings', false, 10485760, ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg']);

-- Storage RLS 策略
CREATE POLICY "用户可以上传自己的录音" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'voice-recordings' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "用户可以查看自己的录音" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'voice-recordings' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "用户可以删除自己的录音" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'voice-recordings' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );