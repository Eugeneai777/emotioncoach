-- 确保 Storage bucket 存在（如果不存在则创建）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('voice-recordings', 'voice-recordings', false, 10485760, 
        ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'])
ON CONFLICT (id) DO NOTHING;

-- 删除可能存在的旧策略（避免重复）
DROP POLICY IF EXISTS "用户可以上传自己的录音" ON storage.objects;
DROP POLICY IF EXISTS "用户可以查看自己的录音_voice" ON storage.objects;
DROP POLICY IF EXISTS "用户可以删除自己的录音_voice" ON storage.objects;

-- 创建 Storage RLS 策略：用户可以上传录音到自己的文件夹
CREATE POLICY "用户可以上传自己的录音" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'voice-recordings' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 创建 Storage RLS 策略：用户可以查看自己的录音
CREATE POLICY "用户可以查看自己的录音_voice" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'voice-recordings' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 创建 Storage RLS 策略：用户可以删除自己的录音
CREATE POLICY "用户可以删除自己的录音_voice" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'voice-recordings' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );