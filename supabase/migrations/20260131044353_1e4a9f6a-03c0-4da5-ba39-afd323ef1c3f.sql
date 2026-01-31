
-- 增加 meditation-audio bucket 的文件大小限制到 100MB
UPDATE storage.buckets 
SET file_size_limit = 104857600,  -- 100MB in bytes
    allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
WHERE id = 'meditation-audio';
