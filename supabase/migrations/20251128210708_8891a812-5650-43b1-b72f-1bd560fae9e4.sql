-- 插入21天青少年问题家庭训练营模板
INSERT INTO public.camp_templates (
  camp_type,
  camp_name,
  camp_subtitle,
  category,
  duration_days,
  icon,
  theme_color,
  gradient,
  display_order,
  description,
  target_audience,
  benefits,
  prerequisites,
  stages,
  daily_practice,
  learning_formats,
  is_active
) VALUES (
  'parent_emotion_21',
  '21天青少年问题家庭训练营',
  '教你看懂孩子的情绪，让孩子愿意重新靠近你',
  'youjin',
  21,
  '👨‍👩‍👧',
  '#10B981',
  'from-emerald-500 to-teal-500',
  2,
  '通过父母三力模型（稳定力、洞察力、修复力），帮助父母稳定情绪、理解孩子、改善亲子关系。专为青少年父母设计的系统化训练营。',
  jsonb_build_array(
    '孩子抑郁/情绪低落的家长',
    '孩子不愿上学/学业拒绝的家长',
    '孩子网瘾/手机沉迷的家长',
    '孩子脾气暴躁/叛逆冲突的家长',
    '孩子自卑/内向不愿社交的家长',
    '孩子学习焦虑/完美主义的家长',
    '孩子社交冲突/被排挤的家长',
    '家庭情绪失控（父母容易爆炸）的家长'
  ),
  jsonb_build_array(
    '父母情绪爆炸减少40-55%',
    '父母焦虑下降20-35%',
    '孩子崩溃次数减少',
    '亲子冲突明显减少',
    '孩子愿意回应和沟通',
    '家庭氛围从紧绷变松动',
    '建立可持续的家庭情绪系统'
  ),
  NULL,
  jsonb_build_array(
    jsonb_build_object(
      'stage', 1,
      'title', '第一周：父母先稳',
      'days', '1-7',
      'goal', '让你恢复情绪控制，不再爆炸',
      'lessons', jsonb_build_array(
        '焦虑和无力感下降',
        '不再"被孩子牵着走"',
        '冲突减少',
        '孩子开始感觉到你变了（这是关键）'
      )
    ),
    jsonb_build_object(
      'stage', 2,
      'title', '第二周：看懂孩子',
      'days', '8-14',
      'goal', '看懂孩子行为背后的情绪信号',
      'lessons', jsonb_build_array(
        '拒学背后是害怕',
        '网瘾背后是逃避压力',
        '叛逆背后是想保持尊严',
        '内向背后是害怕被否定',
        '沉默背后是"我撑不住了"',
        '看懂之后，你的反应自然会更温柔、更有效'
      )
    ),
    jsonb_build_object(
      'stage', 3,
      'title', '第三周：关系修复',
      'days', '15-21',
      'goal', '让孩子慢慢靠近你',
      'lessons', jsonb_build_array(
        '孩子愿意说一句',
        '愿意做一点',
        '愿意多待5分钟',
        '愿意让你进入他的世界',
        '家里气氛从"紧绷"变成"松动"',
        '你们关系开始有温度',
        '孩子开始恢复力量'
      )
    )
  ),
  jsonb_build_array(
    jsonb_build_object(
      'time', '☀️ 每天',
      'title', '父母稳定练习',
      'content', '让你不再被孩子的情绪牵动，让孩子重新感到"家是安全的地方"',
      'duration', '3分钟',
      'gradient', 'from-amber-500 to-orange-500',
      'type', 'stability'
    ),
    jsonb_build_object(
      'time', '📝 每天',
      'title', '青少年情绪日记（父母版）',
      'content', '帮你看懂孩子表面行为下的真实需求，避免误解、避免错误回应、避免情绪对撞',
      'duration', '5分钟',
      'gradient', 'from-blue-500 to-cyan-500',
      'type', 'insight'
    ),
    jsonb_build_object(
      'time', '💚 每天',
      'title', '亲子连接行动',
      'content', '不讲道理、不对抗，用"关系"取代"冲突"',
      'duration', '2分钟',
      'gradient', 'from-emerald-500 to-teal-500',
      'type', 'connection'
    )
  ),
  jsonb_build_array(
    jsonb_build_object(
      'type', '情绪稳定力（Stability）',
      'title', '父母三力模型第一力',
      'icon', '🌊',
      'description', '每天1次父母稳定练习，让你不再被孩子的情绪牵动，让孩子重新感到"家是安全的地方"',
      'research', '哈佛教育学院研究指出：父母的反应方式，比孩子的行为本身更能影响孩子的情绪轨迹。当父母越急、越吼、越讲道理，孩子的压力系统就越失控。'
    ),
    jsonb_build_object(
      'type', '情绪洞察力（Insight）',
      'title', '父母三力模型第二力',
      'icon', '👁️',
      'description', '每天1次青少年情绪日记（父母版），帮你看懂孩子表面行为下的真实需求，避免误解、避免错误回应、避免情绪对撞',
      'research', '哈佛Dana Center研究发现：当父母能正确辨识孩子情绪，孩子的情绪反应强度可下降25-38%。也就是说：父母"看懂孩子"，孩子就能慢慢稳定下来。'
    ),
    jsonb_build_object(
      'type', '关系修复力（Connection）',
      'title', '父母三力模型第三力',
      'icon', '💚',
      'description', '每天1个可执行的亲子连接行动，不讲道理、不对抗，用"关系"取代"冲突"',
      'research', 'Gottman Institute研究：持续21天进行修复性互动，青少年的合作意愿提高53%。当关系变暖，孩子自然愿意靠近。'
    )
  ),
  true
) ON CONFLICT (camp_type) DO UPDATE SET
  camp_name = EXCLUDED.camp_name,
  camp_subtitle = EXCLUDED.camp_subtitle,
  description = EXCLUDED.description,
  target_audience = EXCLUDED.target_audience,
  benefits = EXCLUDED.benefits,
  stages = EXCLUDED.stages,
  daily_practice = EXCLUDED.daily_practice,
  learning_formats = EXCLUDED.learning_formats,
  updated_at = now();