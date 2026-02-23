

## 修复 6 个 Bug (#320 - #326)

### Bug #320 (中) - 好友收到的是压缩的推广二维码
**问题**：QR 码图片在微信转发时被压缩。
**方案**：这是微信自身的图片压缩行为，非代码问题。建议在下载按钮旁添加文案提示"建议使用原图发送"，或者将 QR 码生成尺寸从 200px 提升到 300px 以提高抗压缩能力。
**改动文件**：暂无代码改动，属于平台限制。如需优化可提升 QR 码分辨率。

---

### Bug #321 (高) - 付费9.9复制链接发好友，好友跳回原来支付页面
**问题**：合伙人在"我的推广中心"选择付费 9.9 模式后复制推广链接给好友，好友点开后跳回到支付页面但没有触发付费。这是因为之前 `partners` 表缺少公共 SELECT RLS 策略，导致 `PayEntry` 页面无法读取合伙人信息，显示"无效链接"。
**方案**：已在上一步通过添加 RLS 策略修复。现在未登录用户可以正常读取 active 状态的合伙人信息。
**状态**：已修复。

---

### Bug #322 (高) - 未注册用户可以不付费参加21天情绪训练营
**问题**：需进一步调查具体的绕过路径。可能是训练营入口缺少购买状态校验。
**方案**：检查训练营入口的购买校验逻辑，确保未付费用户无法直接进入。这需要进一步定位代码路径后修复。

---

### Bug #323 (高) - 情绪健康测评结果页点AI教练对话报 unknown error
**根因**：`assessment-emotion-coach` 边缘函数在创建会话时向 `conversations` 表插入 `coach_type` 和 `metadata` 字段，向 `emotion_coaching_sessions` 表插入 `source` 和 `metadata` 字段，但这些列在数据库中不存在。

数据库现状：
- `conversations` 表只有：id, user_id, title, created_at, updated_at
- `emotion_coaching_sessions` 表没有 `source` 和 `metadata` 列

**方案**：
1. 数据库迁移：为 `conversations` 添加 `coach_type TEXT` 和 `metadata JSONB` 列；为 `emotion_coaching_sessions` 添加 `source TEXT` 和 `metadata JSONB` 列
2. 无需改边缘函数代码

**改动**：数据库迁移 SQL

---

### Bug #324 (中) - 注册页面显示微信注册
**问题**：注册页面同时显示了邮箱/手机注册和微信注册选项，对于从推广链接进入的用户可能造成困惑。
**方案**：需进一步确认具体场景（是否需要移除微信注册选项或调整优先级）。这个问题更偏向产品决策，暂不做代码改动。

---

### Bug #325 (中) - 状态扫描完成/反应模式识别窗口背景遮挡页面
**问题**：`LayerTransitionCard` 组件使用 `fixed inset-0 bg-background/95` 全屏遮罩，透明度太低（5%透明），几乎完全遮挡了背景内容。
**方案**：将背景改为 `bg-background/80` 增加透明度，同时缩小弹窗卡片使其不会覆盖太多内容。或者按用户建议"只显示中间提示窗口"，将遮罩透明度降低。

**改动文件**：`src/components/emotion-health/LayerTransitionCard.tsx`
- 将 `bg-background/95` 改为 `bg-black/40`（半透明黑色遮罩）

---

### Bug #326 (中) - 情绪健康测评与AI教练文字部分重合
**问题**：在 `EmotionHealthQuestionsLite` 顶部标题栏中，层级标签和"情绪健康测评"标题在窄屏上可能重叠。
**方案**：调整标题区域布局，确保文字不重叠。

**改动文件**：`src/components/emotion-health/EmotionHealthQuestionsLite.tsx`
- 为标题行添加 `overflow-hidden` 和 `min-w-0` 防止溢出
- 标题文字添加 `truncate` 防止重叠

---

### 实施优先级
1. **#323** - 数据库迁移（根因修复）
2. **#325** - 弹窗遮罩优化
3. **#326** - 文字重叠修复
4. **#321** - 已修复（RLS 策略已添加）
5. **#320** - 微信压缩，平台限制
6. **#322** - 需进一步排查训练营入口校验逻辑
7. **#324** - 产品决策问题

### 技术细节

#### 数据库迁移 SQL（Bug #323）
```sql
-- 为 conversations 表添加缺失的列
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS coach_type TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 为 emotion_coaching_sessions 表添加缺失的列
ALTER TABLE public.emotion_coaching_sessions 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'coach',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 添加索引优化查询
CREATE INDEX IF NOT EXISTS idx_emotion_coaching_sessions_source 
ON emotion_coaching_sessions(source);
```

#### LayerTransitionCard 遮罩修改（Bug #325）
将第 21 行的 `bg-background/95` 改为 `bg-black/40`，让遮罩更通透。

#### EmotionHealthQuestionsLite 标题修复（Bug #326）
在标题行的 flex 容器中添加 `min-w-0`，标题 `h1` 添加 `truncate` 防止溢出重叠。

