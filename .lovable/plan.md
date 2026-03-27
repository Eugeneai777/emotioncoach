

# /promo/synergy 落地页：照片修复 + 暖色重构 + 教练排版优化

## 问题诊断

### 1. 黛汐老师照片文字干扰
CSS 裁剪（`object-position`）无法可靠去除照片上的叠加文字——文字不在固定位置，裁剪会丢失脸部。**需要你提供一张无文字覆盖的干净版黛汐照片**。本轮先用 CSS `object-position: center 20%` 尽量避开底部文字区域，后续替换干净照片。

### 2. 肖剑雄照片错误
将 `coach-xiaojianxiong.jpg` 替换为本次上传的 `肖院长.png`。

### 3. 整体色调（20分 → 目标80+）
当前通体深黑（`bg-[#0a0e1a]`），需全面改为**暖白橙色调**，参考公众号海报风格。

### 4. 教练排版不满意
当前教练区是简单的 flex 横排卡片，文字信息密集但层次不清。需参考公众号海报教练团队的**卡片式排版**：大头像居中 + 姓名突出 + 标签分行。

## 改动方案

### A. 全页色调重构（SynergyPromoPage.tsx，约100处 class 修改）

| 区域 | 旧 | 新 |
|------|----|----|
| 页面底色 | `bg-[#0a0e1a]` | `bg-gradient-to-b from-orange-50 via-amber-50/30 to-white` |
| Hero 区 | 深紫渐变 | 暖橙渐变 `from-amber-600 via-orange-500 to-amber-700` + 白色文字 |
| 文字主色 | `text-slate-100/200/300` | `text-slate-800/700/600` |
| 卡片背景 | `bg-slate-800/50` | `bg-white shadow-sm border border-amber-100/50` |
| Section 交替色 | `bg-slate-900/50` | `bg-amber-50/40` 或 `bg-orange-50/30` |
| CTA 按钮 | 蓝紫渐变 | `bg-gradient-to-r from-orange-500 to-amber-600` |
| 强调色 | cyan/purple | amber/orange/emerald |
| 粒子特效 | `bg-blue-400/30` | `bg-amber-400/20` |

### B. 教练排版重构（参考公众号海报风格）

**总教练黛汐（大卡片）**：
- 圆形头像 96px 居中显示（非左对齐）
- 头像下方：姓名（大字）+ "总教练"角色标签
- 资质认证标签横排
- 座右铭斜体

**其余5位教练（网格卡片，移动端2列、桌面3列）**：
- 每张卡片：圆形头像 64px 居中
- 头像下方：姓名 + 角色小标签
- 一行专业标签
- 一行擅长方向
- 卡片白底 + 细边框 + 微阴影

**AI教练 & 知乐胶囊辅助角色**：保持紧凑双列，调为暖色调。

### C. 资源替换

| 文件 | 操作 |
|------|------|
| `src/assets/coach-xiaojianxiong.jpg` | 替换为 `肖院长.png` |
| `src/assets/coach-daixi.jpg` | 暂保留，CSS 调整 `object-position`；**请另外提供无文字版照片** |

### D. 分享卡片同步（SynergyShareCard.tsx）
将分享海报的深色背景也调整为暖橙色调，保持品牌一致。

## 改动文件

| 文件 | 改动量 |
|------|--------|
| `src/pages/SynergyPromoPage.tsx` | 大量 class 修改（色调）+ 教练区 JSX 重构 |
| `src/components/promo/SynergyShareCard.tsx` | 色调同步 |
| `src/assets/coach-xiaojianxiong.jpg` | 替换为正确照片 |

## 待你提供

黛汐老师的无文字版干净照片（当前照片上的文字无法通过代码消除）。

