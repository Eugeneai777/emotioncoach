-- 创建社区图片存储桶
INSERT INTO storage.buckets (id, name, public) 
VALUES ('community-images', 'community-images', true);

-- 存储桶 RLS 策略
CREATE POLICY "用户可以上传图片"
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'community-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "所有人可以查看图片"
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'community-images');

CREATE POLICY "用户可以删除自己的图片"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'community-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 创建社区帖子表
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- 帖子类型
  post_type TEXT NOT NULL, -- 'story' | 'checkin' | 'achievement' | 'reflection'
  
  -- 内容
  title TEXT,
  content TEXT,
  image_urls TEXT[], -- 支持多图
  
  -- 关联数据
  briefing_id UUID REFERENCES briefings(id),
  camp_id UUID REFERENCES training_camps(id),
  achievement_id UUID REFERENCES user_achievements(id),
  
  -- 展示数据（冗余存储提升性能）
  emotion_theme TEXT,
  emotion_intensity INTEGER,
  insight TEXT,
  action TEXT,
  camp_day INTEGER,
  badges JSONB, -- 勋章数据
  
  -- 隐私设置
  is_anonymous BOOLEAN DEFAULT false,
  visibility TEXT DEFAULT 'public', -- 'public' | 'friends' | 'private'
  
  -- 统计
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 启用 RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- 社区帖子 RLS 策略
CREATE POLICY "所有已认证用户可查看公开帖子"
  ON community_posts FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    (visibility = 'public' OR user_id = auth.uid())
  );

CREATE POLICY "用户可以创建自己的帖子"
  ON community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的帖子"
  ON community_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的帖子"
  ON community_posts FOR DELETE
  USING (auth.uid() = user_id);

-- 创建点赞表
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(post_id, user_id)
);

-- 启用 RLS
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- 点赞 RLS 策略
CREATE POLICY "所有已认证用户可查看点赞"
  ON post_likes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "用户可以点赞"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以取消自己的点赞"
  ON post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- 创建评论表
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 启用 RLS
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- 评论 RLS 策略
CREATE POLICY "所有已认证用户可查看评论"
  ON post_comments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "用户可以创建评论"
  ON post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的评论"
  ON post_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的评论"
  ON post_comments FOR DELETE
  USING (auth.uid() = user_id);

-- 创建索引优化查询性能
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_post_type ON community_posts(post_type);
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_parent_id ON post_comments(parent_id);

-- 创建触发器自动更新 updated_at
CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();