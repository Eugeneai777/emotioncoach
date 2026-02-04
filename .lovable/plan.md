
## 5个轻入口微信分享 OG Meta 标签优化方案

### 现状分析

| 轻入口页面 | 当前 OG pageKey | 问题 |
|-----------|----------------|------|
| `/wealth-assessment-lite` | ❌ 缺失 | 无 DynamicOGMeta 组件 |
| `/emotion-health-lite` | ❌ 缺失 | 无 DynamicOGMeta 组件 |
| `/scl90-lite` | ❌ 缺失 | 无 DynamicOGMeta 组件 |
| `/alive-check-lite` | `aliveCheck` | 借用主功能配置 |
| `/emotion-button-lite` | `emotionButtonIntro` | 借用介绍页配置 |
| `/awakening-lite` | `awakening` | 借用主功能配置 |

**核心问题：**
- 3 个页面完全缺失 OG Meta 组件
- 所有页面没有独立的分享卡片配置
- `pathToKeyMap` 缺少轻入口路径映射
- 数据库没有轻入口专属 OG 配置记录

---

### 实施方案

#### 第一步：数据库 - 新增 6 个轻入口 OG 配置

在 `og_configurations` 表中插入专属配置：

| page_key | og_title | description | 特点 |
|----------|----------|-------------|------|
| `wealthAssessmentLite` | 3分钟测你的财富卡点 | 先测评后付费，发现你的财富盲点 | 强调"先体验后付费" |
| `emotionHealthLite` | 情绪健康快速自测 | 了解你的情绪健康状态，科学测评 | 突出科学性 |
| `scl90Lite` | SCL-90心理健康自测 | 专业量表，快速了解心理健康 | 强调专业性 |
| `aliveCheckLite` | 死了吗安全打卡 | 让关心你的人安心，每日报平安 | 情感诉求 |
| `emotionButtonLite` | 30秒情绪急救按钮 | 9种情绪场景，即时缓解负面情绪 | 强调即时效果 |
| `awakeningLite` | 觉察日记 | 把日常积累成个人成长的复利资产 | 强调长期价值 |

统一使用现有 OG 图片：`og-ai-series-*.png`

---

#### 第二步：代码 - 更新路径映射

**修改 `src/config/ogConfig.ts`**

在 `pathToKeyMap` 中添加 6 个轻入口路径：

```text
'/wealth-assessment-lite': 'wealthAssessmentLite'
'/emotion-health-lite': 'emotionHealthLite'  
'/scl90-lite': 'scl90Lite'
'/alive-check-lite': 'aliveCheckLite'
'/emotion-button-lite': 'emotionButtonLite'
'/awakening-lite': 'awakeningLite'
```

---

#### 第三步：代码 - 为缺失页面添加 DynamicOGMeta

**修改 3 个缺失 OG Meta 的页面：**

| 文件 | 操作 |
|------|------|
| `src/pages/WealthAssessmentLite.tsx` | 添加 `<DynamicOGMeta pageKey="wealthAssessmentLite" />` |
| `src/pages/EmotionHealthLite.tsx` | 添加 `<DynamicOGMeta pageKey="emotionHealthLite" />` |
| `src/pages/SCL90Lite.tsx` | 添加 `<DynamicOGMeta pageKey="scl90Lite" />` |

**修改 3 个使用错误 pageKey 的页面：**

| 文件 | 当前 | 改为 |
|------|------|------|
| `src/pages/AliveCheckLite.tsx` | `pageKey="aliveCheck"` | `pageKey="aliveCheckLite"` |
| `src/pages/EmotionButtonLite.tsx` | `pageKey="emotionButtonIntro"` | `pageKey="emotionButtonLite"` |
| `src/pages/AwakeningLite.tsx` | `pageKey="awakening"` | `pageKey="awakeningLite"` |

---

### OG 配置内容设计

每个轻入口的分享卡片优化方向：

| 产品 | og_title | description | 核心卖点 |
|------|----------|-------------|---------|
| 财富卡点 | 有劲AI • 3分钟测财富卡点 | 先测评后付费，¥9.9发现你的财富盲点 | 低门槛 + 价格透明 |
| 情绪健康 | 有劲AI • 情绪健康自测 | 科学量表评估，了解你的情绪状态 | 科学 + 专业 |
| SCL-90 | 有劲AI • 心理健康自测 | 专业SCL-90量表，90题全面评估 | 专业 + 全面 |
| 死了吗 | 有劲AI • 安全打卡 | 每日报平安，让关心你的人安心 | 情感 + 关怀 |
| 情绪按钮 | 有劲AI • 情绪急救 | 30秒缓解负面情绪，9种场景全覆盖 | 即时 + 全覆盖 |
| 觉察日记 | 有劲AI • 觉察日记 | 把平凡日常积累成个人成长复利 | 长期价值 |

---

### 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/config/ogConfig.ts` | 修改 | 添加 6 个轻入口路径映射 |
| `src/pages/WealthAssessmentLite.tsx` | 修改 | 添加 DynamicOGMeta 组件 |
| `src/pages/EmotionHealthLite.tsx` | 修改 | 添加 DynamicOGMeta 组件 |
| `src/pages/SCL90Lite.tsx` | 修改 | 添加 DynamicOGMeta 组件 |
| `src/pages/AliveCheckLite.tsx` | 修改 | 更新 pageKey |
| `src/pages/EmotionButtonLite.tsx` | 修改 | 更新 pageKey |
| `src/pages/AwakeningLite.tsx` | 修改 | 更新 pageKey |
| 数据库迁移 | 新建 | 插入 6 条 OG 配置记录 |

---

### 技术细节

**数据库插入 SQL：**

```sql
INSERT INTO og_configurations (page_key, title, og_title, description, image_url, url, site_name, is_active)
VALUES 
  ('wealthAssessmentLite', '财富卡点测评 - 有劲AI', '有劲AI • 3分钟测财富卡点', '先测评后付费，¥9.9发现你的财富盲点', 'https://vlsuzskvykddwrxbmcbu.supabase.co/storage/v1/object/public/og-images/og-ai-series-1768516908677.png', 'https://wechat.eugenewe.net/wealth-assessment-lite', NULL, true),
  ('emotionHealthLite', '情绪健康测评 - 有劲AI', '有劲AI • 情绪健康自测', '科学量表评估，了解你的情绪状态', 'https://vlsuzskvykddwrxbmcbu.supabase.co/storage/v1/object/public/og-images/og-ai-series-1768516908677.png', 'https://wechat.eugenewe.net/emotion-health-lite', NULL, true),
  ('scl90Lite', 'SCL-90心理测评 - 有劲AI', '有劲AI • 心理健康自测', '专业SCL-90量表，90题全面评估', 'https://vlsuzskvykddwrxbmcbu.supabase.co/storage/v1/object/public/og-images/og-ai-series-1768516908677.png', 'https://wechat.eugenewe.net/scl90-lite', NULL, true),
  ('aliveCheckLite', '死了吗安全打卡 - 有劲AI', '有劲AI • 安全打卡', '每日报平安，让关心你的人安心', 'https://vlsuzskvykddwrxbmcbu.supabase.co/storage/v1/object/public/og-images/og-ai-series-1768516908677.png', 'https://wechat.eugenewe.net/alive-check-lite', NULL, true),
  ('emotionButtonLite', '情绪急救按钮 - 有劲AI', '有劲AI • 情绪急救', '30秒缓解负面情绪，9种场景全覆盖', 'https://vlsuzskvykddwrxbmcbu.supabase.co/storage/v1/object/public/og-images/og-ai-series-1768516908677.png', 'https://wechat.eugenewe.net/emotion-button-lite', NULL, true),
  ('awakeningLite', '觉察日记 - 有劲AI', '有劲AI • 觉察日记', '把平凡日常积累成个人成长复利', 'https://vlsuzskvykddwrxbmcbu.supabase.co/storage/v1/object/public/og-images/og-ai-series-1768516908677.png', 'https://wechat.eugenewe.net/awakening-lite', NULL, true);
```

**代码修改示例（WealthAssessmentLite.tsx）：**

```tsx
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";

export default function WealthAssessmentLitePage() {
  // ...existing code...
  
  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-background">
      <DynamicOGMeta pageKey="wealthAssessmentLite" />
      
      {/* 测评页 */}
      {pageState === "questions" && (
        // ...
      )}
    </div>
  );
}
```

---

### 验收标准

1. ✅ 6 个轻入口在微信分享时显示正确的标题和描述
2. ✅ 分享卡片图片正常加载（使用统一 og-ai-series 图片）
3. ✅ 每个轻入口 URL 正确指向对应页面
4. ✅ 微信 JS-SDK 分享配置正确触发
5. ✅ 后台 og_configurations 表可动态修改配置
