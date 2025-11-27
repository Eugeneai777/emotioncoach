-- 创建生活馆工具管理表
CREATE TABLE public.energy_studio_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  detailed_description TEXT,
  icon_name TEXT NOT NULL DEFAULT 'Sparkles',
  category TEXT NOT NULL CHECK (category IN ('emotion', 'exploration', 'management')),
  gradient TEXT DEFAULT 'from-primary to-primary',
  usage_scenarios JSONB DEFAULT '[]'::jsonb,
  is_available BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.energy_studio_tools ENABLE ROW LEVEL SECURITY;

-- 所有认证用户可查看启用的工具
CREATE POLICY "所有用户可查看启用的工具"
ON public.energy_studio_tools
FOR SELECT
TO authenticated
USING (is_available = true);

-- 管理员可查看所有工具
CREATE POLICY "管理员可查看所有工具"
ON public.energy_studio_tools
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 管理员可管理工具
CREATE POLICY "管理员可管理工具"
ON public.energy_studio_tools
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 创建更新时间触发器
CREATE TRIGGER update_energy_studio_tools_updated_at
BEFORE UPDATE ON public.energy_studio_tools
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 初始化16个系统工具数据
INSERT INTO public.energy_studio_tools (tool_id, title, description, detailed_description, icon_name, category, gradient, usage_scenarios, is_available, is_system, display_order) VALUES
('breathing', '呼吸练习', '通过有意识的呼吸调节身心状态', '当情绪波动时，呼吸练习能快速帮助你平静下来。通过专注于呼吸，你可以激活副交感神经系统，缓解压力和焦虑。我们提供多种呼吸模式，从基础的深呼吸到高级的箱式呼吸法，适合不同场景使用。', 'Wind', 'emotion', 'from-blue-500 to-cyan-500', '["感到焦虑或压力时","睡前放松","工作间隙恢复精力"]', true, true, 1),
('meditation', '冥想计时', '专注当下，培养内心的平静与觉察', '冥想是一种心智训练，帮助你培养专注力和内心平静。通过定期冥想练习，你可以提升情绪调节能力，减少反刍思维，增强自我觉察。我们的冥想计时器支持多种背景音，让你在舒适的环境中进行练习。', 'Timer', 'emotion', 'from-purple-500 to-pink-500', '["早晨开启新的一天","工作前集中注意力","晚上安静心灵"]', true, true, 2),
('mindfulness', '正念练习', '系统化的正念觉察训练方法', '正念练习帮助你回到当下，培养对内心和外界的觉察。通过身体扫描、五感觉察等练习，你可以更好地理解自己的情绪和身体信号，从而做出更明智的选择。', 'HeartPulse', 'emotion', 'from-green-500 to-teal-500', '["感到情绪失控时","需要重新找回平衡","提升日常觉察力"]', true, true, 3),
('first-aid', '情绪急救', '针对强烈情绪的快速应对策略', '当遇到强烈的负面情绪时，情绪急救提供即时的应对策略。根据不同的情绪状态（愤怒、焦虑、悲伤等），我们提供定制化的缓解技巧，帮助你快速稳定情绪。', 'Sparkles', 'emotion', 'from-red-500 to-orange-500', '["突然感到愤怒","陷入焦虑漩涡","情绪崩溃边缘"]', true, true, 4),

('goals', '目标设定', '科学设定并追踪个人成长目标', '清晰的目标是成长的起点。我们帮助你运用SMART原则设定可实现的目标，并提供进度追踪工具。无论是情绪管理、习惯养成还是技能提升，都能在这里找到结构化的支持。', 'Target', 'exploration', 'from-indigo-500 to-purple-500', '["新年规划","职业发展","个人成长"]', true, true, 5),
('values', '价值探索', '发现并明确你的核心价值观', '了解自己的核心价值观，是做出符合内心的选择的基础。通过引导式探索，你将识别出最重要的价值观，并学习如何在日常生活中实践它们。', 'Eye', 'exploration', 'from-yellow-500 to-orange-500', '["感到迷茫时","重大选择前","寻找生活意义"]', true, true, 6),
('vision', '愿景板', '可视化你的梦想与目标', '愿景板让你的梦想具象化。通过收集图片、文字和灵感，创建属于你的视觉目标板，每天提醒自己想要实现的未来。', 'ImageIcon', 'exploration', 'from-pink-500 to-rose-500', '["年度规划","梦想可视化","保持动力"]', true, true, 7),
('strengths', '优势识别', '发现并发展你的独特优势', '每个人都有独特的优势。通过系统化的评估和反思，识别你的天赋才能和性格优势，学习如何在生活中更好地运用它们。', 'BookHeart', 'exploration', 'from-blue-500 to-indigo-500', '["职业规划","自我认知","能力发展"]', true, true, 8),

('habits', '习惯追踪', '培养积极习惯，改变从点滴开始', '习惯的力量在于持续。我们的习惯追踪器帮助你记录每日进展，建立打卡习惯，并通过数据可视化看到自己的成长轨迹。', 'Calendar', 'management', 'from-green-500 to-emerald-500', '["建立新习惯","改掉坏习惯","保持自律"]', true, true, 9),
('energy', '能量管理', '平衡身心能量，保持最佳状态', '能量管理比时间管理更重要。追踪你的身体、情绪和精神能量水平，识别能量波动的规律，学习如何补充和保护你的能量。', 'Battery', 'management', 'from-yellow-500 to-amber-500', '["感到疲惫","精力不足","优化状态"]', true, true, 10),
('sleep', '睡眠记录', '改善睡眠质量，提升整体健康', '良好的睡眠是健康的基石。记录睡眠时间和质量，识别影响睡眠的因素，获取改善睡眠的个性化建议。', 'Moon', 'management', 'from-indigo-500 to-blue-500', '["睡眠问题","提升睡眠质量","建立作息规律"]', true, true, 11),
('exercise', '运动记录', '保持活力，记录每一次运动', '运动不仅有益身体，更能改善情绪。记录运动类型、时长和感受，建立属于你的运动习惯，享受运动带来的积极变化。', 'Dumbbell', 'management', 'from-red-500 to-pink-500', '["建立运动习惯","追踪运动进展","保持动力"]', true, true, 12),
('finance', '财务追踪', '理性管理财务，减少金钱焦虑', '财务状况影响情绪健康。简单记录收支，了解消费习惯，建立健康的金钱关系，减少财务相关的压力。', 'DollarSign', 'management', 'from-green-500 to-teal-500', '["理财规划","控制开支","减少金钱焦虑"]', true, true, 13),
('time', '时间管理', '合理规划时间，提升生活效率', '通过番茄工作法和任务优先级管理，帮助你更有效地利用时间，减少拖延，在工作和生活之间找到平衡。', 'Clock', 'management', 'from-blue-500 to-cyan-500', '["提高效率","对抗拖延","工作生活平衡"]', true, true, 14),
('relationships', '关系维护', '用心经营重要的人际关系', '记录与重要他人的互动，设置联系提醒，培养深度连接。健康的人际关系是情绪健康的重要支柱。', 'Heart', 'management', 'from-pink-500 to-rose-500', '["维系关系","社交提醒","深化连接"]', true, true, 15),
('gratitude', '感恩日记', '培养感恩心态，发现生活美好', '每天记录值得感恩的事情，培养积极心态。研究表明，感恩练习能显著提升幸福感和生活满意度。', 'Megaphone', 'management', 'from-yellow-500 to-orange-500', '["提升幸福感","积极心态","睡前反思"]', true, true, 16);