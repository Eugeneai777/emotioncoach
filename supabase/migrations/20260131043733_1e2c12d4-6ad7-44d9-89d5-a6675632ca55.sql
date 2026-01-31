-- 创建冥想音频存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('meditation-audio', 'meditation-audio', true)
ON CONFLICT (id) DO NOTHING;

-- 创建公开读取策略
CREATE POLICY "Public read access for meditation audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'meditation-audio');

-- 创建管理员上传策略（通过 service role 上传）
CREATE POLICY "Admin upload for meditation audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'meditation-audio');