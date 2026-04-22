

## 把 4 个场景按钮升级成与主页同款"暗色发光卡片"

### 现状问题
当前芯片是浅色 pill（`bg-indigo-50/70` 等），而主页主体（audience 头像卡、exploreBlocks、PromoBanner）全是**深色渐变 + 彩色光晕 + ring 边**的高级感风格。两套视觉语言并存，芯片显得像贴上去的便签。

### 设计目标
让 4 个场景按钮变成主页"同一个家族"的小卡片：保留紧凑（不回到大横卡），但视觉上对齐 `exploreBlocks` 的暗色发光质感。

### 新版设计

#### 一、视觉规格（对齐 exploreBlocks 风格）

```
┌──────────────────────────────────────────────────┐
│  🎙️ 想说点什么？按住和有劲AI说              │
│  ──────────────────────────────────────       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  │  🌙      │ │  💼      │ │  💗      │ │  💰      │
│  │ 深夜焦虑 │ │ 职场迷茫 │ │ 关系困扰 │ │ 财富卡点 │
│  │ 睡不着…  │ │ 想换工作 │ │ 吵架了…  │ │ 钱的烦恼 │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘
│  ↑ 4 列等宽小卡（窄屏 2×2），暗色渐变+光晕+ring
└──────────────────────────────────────────────────┘
```

**单卡样式**（参照 exploreBlocks）：
- 容器：`rounded-xl p-3 bg-gradient-to-br ring-1 shadow-lg` + 各自主题色（indigo/amber/rose/emerald 的 `/15→/8` 渐变 + `/25` ring + `/10` glow）
- emoji：放大到 `text-2xl`，带 `bg-{color}-500/20` 圆形底
- 标题：`text-[12px] font-bold text-foreground`
- 副标题（**新增**）：`text-[10px] text-muted-foreground` —— 一句具体场景钩子（"睡不着翻来覆去"/"想离职没勇气"/"刚和TA吵完架"/"赚得少存不下"）
- 点击：`whileTap scale-95` + 整卡轻微亮起

#### 二、布局
- `grid grid-cols-4 gap-2`（≥640px）
- `grid grid-cols-2 gap-2`（手机窄屏自动 2×2）
- 不再用 `flex flex-wrap pill`

#### 三、文案优化（更口语、更具体）

| emoji | 标题 | 副标题钩子 |
|---|---|---|
| 🌙 | 深夜焦虑 | 翻来覆去睡不着 |
| 💼 | 职场迷茫 | 想换工作没勇气 |
| 💗 | 关系困扰 | 刚和TA吵完架 |
| 💰 | 财富卡点 | 赚多少都存不下 |

#### 四、标题区微调
- 原："什么时候可以找有劲AI？" → 改："🎙️ 想说点什么？按住和有劲AI说"
- 副标题删除（钩子已下沉到每张卡）
- 保留左侧 `w-1 h-4` 渐变小竖条（与主页其他 section 标题一致）

### 涉及文件

**`src/pages/MiniAppEntry.tsx`**（仅 2 处修改，约 30 行）

1. **102-127 行**：`useCases` 加入 `subtitle`、改成暗色风格的 `bg/ring/glow/iconBg/iconColor` 字段（参照 exploreBlocks 数据结构）
2. **592-621 行**：芯片区 UI 重写为 `grid grid-cols-2 sm:grid-cols-4 gap-2` + 暗色发光卡片

### 不动
- 点击行为：仍 `navigate(/life-coach-voice?topic=${topic})`，topic 值不变（anxiety/career/relationship/wealth），edge function 场景映射保持
- 4 个 topic 与 `vibrant-life-realtime-token` 的 `SCENARIO_CONFIGS` key 映射逻辑
- 用户见证、"还想探索更多"折叠区、PromoBanner、audience 头像区
- PTT 语音教练主流程、计费、字幕

### 验证
- [ ] 4 张小卡视觉与上方"日常工具/专业测评/系统训练营/健康商城"四宫格观感统一（同样的暗色渐变 + ring + glow）
- [ ] 窄屏（375px）2×2 排列不挤，宽屏（≥640px）一行 4 列
- [ ] 每张卡的副标题钩子一眼能看懂"什么时候用"
- [ ] 点击仍直达 PTT 语音并触发对应场景开场白

