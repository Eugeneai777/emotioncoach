
-- 更新 bucket 允许更多 MIME 类型
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/mp4', 'audio/x-m4a', 'application/octet-stream']
WHERE id = 'meditation-audio';
