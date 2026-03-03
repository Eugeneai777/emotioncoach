

# 将中场觉醒力测评配色从琥珀橙色改为粉紫色系

## 改动范围

需要修改 **5 个文件**，将所有 `amber/orange/rose` 主色调替换为 `pink/purple/fuchsia` 粉紫色系。

### 1. `src/components/midlife-awakening/MidlifeAwakeningStartScreen.tsx`
- Hero 渐变：`from-amber-500 via-orange-500 to-rose-500` → `from-pink-500 via-purple-500 to-fuchsia-500`
- 图标颜色：`text-amber-500` → `text-pink-500`，`text-orange-500` → `text-purple-500`
- 列表圆点：`text-amber-500` → `text-pink-500`
- CTA 按钮：`from-amber-500 to-orange-500` → `from-pink-500 to-purple-500`（含 hover）

### 2. `src/components/midlife-awakening/MidlifeAwakeningResult.tsx`
- "优先突破方向"区块：`amber-50/orange-50` 背景 → `pink-50/purple-50`
- AI 教练 CTA 卡片：`amber → pink/purple` 渐变
- 分享按钮 & 教练按钮：`amber/orange` → `pink/purple`
- 序号徽标：`amber-500/amber-700` → `pink-500/pink-700`
- 注：状态指示色（good/ok/bad 的 emerald/amber/rose）保持不变，因为这些是语义色

### 3. `src/components/midlife-awakening/MidlifeAwakeningShareCard.tsx`
- 背景渐变：`#f59e0b → #ea580c → #e11d48` → `#ec4899 → #a855f7 → #d946ef`（pink→purple→fuchsia）

### 4. `src/components/midlife-awakening/MidlifeAwakeningShareDialog.tsx`
- `buttonGradient`：`from-amber-500 to-orange-500` → `from-pink-500 to-purple-500`

### 5. `src/components/midlife-awakening/MidlifeAIAnalysis.tsx`（如有 amber/orange 主题色也一并替换）

### 不改动的部分
- `midlifeAwakeningData.ts` 中的维度配色（红、琥珀、蓝、绿、紫、玫瑰）— 这些是各维度的语义色，不应统一改
- 评分选项的语义色（emerald/blue/gray/amber/rose 表示同意程度）
- 状态指示色（good=emerald, ok=amber, bad=rose）

