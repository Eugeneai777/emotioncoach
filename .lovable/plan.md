

# 轮播图已购隐藏优化（修订）

## 现状

轮播图只有 **2 张卡片**：
1. `assessment` — "找到你的卡点"（点击弹出4个测评选择器）
2. `women-camp` — "7天有劲训练营"

测评选择器内含4个测评：
- 中场觉醒力测评（免费）
- 35+女性竞争力（免费）
- 财富卡点测评（¥9.9，package_key: `wealth_block_assessment`）
- 情绪健康测评（¥9.9，package_key: `emotion_health_assessment`）

## 方案

### 轮播卡片层级（2张卡片）

| 卡片 | 隐藏条件 |
|---|---|
| `women-camp` | `synergy_bundle` 已购 |
| `assessment` | 4个测评**全部**已完成/已购 → 隐藏；否则保留 |

### 测评选择器层级（弹窗内4项）

已购/已完成的测评从弹窗列表中过滤掉，只展示用户尚未体验的测评。

检查逻辑：
- 财富卡点：orders 表 `wealth_block_assessment` 已购
- 情绪健康：orders 表 `emotion_health_assessment` 已购
- 中场觉醒力：`awakening_entries` 表有完成记录
- 女性竞争力：`awakening_entries` 表有完成记录

### 边界处理

- 全部轮播已购 → 隐藏整个轮播区域
- 只剩1张 → 禁用自动轮播和圆点指示器
- 弹窗内测评全部已完成 → `assessment` 卡片也隐藏
- 未登录 → 全部展示

### 文件变更

| 文件 | 操作 |
|---|---|
| `src/pages/MiniAppEntry.tsx` | PromoBanner 增加购买/完成状态查询；过滤轮播卡片；过滤测评选择器列表 |

