

## 把"什么时候可以找有劲AI"重设计成芯片区 → 直达语音教练

### 现状
该区块当前是 4 张大横卡（带插画背景 + "聊一聊 →"），点击跳转到 `/youjin-life/chat?topic=xxx`（文字聊天）。用户上传截图显示卡片视觉沉重、占屏长，且"聊一聊"是文字模式，与首页主推的 PTT 语音教练（中心红色按钮）形成两套入口，转化路径分裂。

### 目标
- 把 4 张大卡压缩为一行可横滑的**情绪芯片**（emoji + 短词），视觉更轻、上屏更密
- 点击芯片直接进入 `/life-coach-voice`（PTT 语音教练，与首页中心按钮同一入口、同一会话规则），带上 `topic` 参数让教练开场就贴近场景

### 设计

#### 一、芯片区视觉（替换 622-663 行的卡片列表）

```
什么时候可以找有劲AI？        [图标 🎙️ 同首页中心按钮]
任何时刻，任何情绪 —— 按住说话即可
[🌙 深夜焦虑] [💼 职场迷茫] [💗 关系困扰] [💰 财富卡点]
       ↑ 横滑 pill 芯片，单行，自适应换行
```

- 容器：`flex flex-wrap gap-2`（窄屏自动换行成 2 行 × 2 列）
- 单芯片：圆角 full、px-3 py-2、emoji + 8px + 文字、白底 + 该场景主题色边框（保留原 indigo/amber/rose/emerald 色系做色彩记忆）
- 点击：`scale-95` 反馈 + 轻微 `bg-{color}-50` 高亮
- 副标题改为"按住说话即可"（呼应 PTT，与首页中心按钮语义一致）

#### 二、点击行为 → 复用首页中心按钮的 PTT 语音

- `onClick={() => navigate('/life-coach-voice?topic=anxiety')}`
- 4 个 topic 值沿用现有：`anxiety / career / relationship / wealth`
- `LifeCoachVoice.tsx` 读取 `useSearchParams().get('topic')`，作为新 prop `initialTopic` 传给 `CoachVoiceChat`
- `CoachVoiceChat` 在生成 system instruction / 第一句问候时，按 topic 注入一句场景化开场白（如 anxiety → "看到你这会儿在为深夜焦虑找我，先深呼吸一下…"）

> 与首页中心红色按钮的 PTT 完全一致：同 `tokenEndpoint`、同 `voiceType`、同 `pttMode`、同 `useVoiceSessionLock` 互斥锁。区别只是带了个 topic 让教练知道入口语境。

#### 三、useCases 数据精简

把 102-147 行的 `useCases` 数组瘦身：去掉 `bg / accent / iconBg / illustrationKey / desc`，保留 `emoji / title / topic / colorClass`（例如 `colorClass: 'border-indigo-200 text-indigo-600 bg-indigo-50/60'`）。原插画 `scene_*` 资源继续保留在仓库中（其他页面可能复用）。

### 涉及文件

1. **`src/pages/MiniAppEntry.tsx`**
   - 精简 `useCases` 数据（102-147）
   - 重写芯片区 UI（612-665）
   - 副标题改"按住说话即可"
2. **`src/pages/LifeCoachVoice.tsx`**
   - 读取 `?topic=` 参数，透传给 `CoachVoiceChat`
3. **`src/components/coach/CoachVoiceChat.tsx`**
   - 新增可选 prop `initialTopic?: 'anxiety' | 'career' | 'relationship' | 'wealth'`
   - 在已有的 system prompt 拼装处追加一句场景化引导（仅 4 行 if/else 映射）

### 不动
- 首页中心红色 PTT 按钮、CoachVoiceChat 主流程、计费、字幕节奏修复、芯片缓存、`/youjin-life/chat` 文字聊天页（保留作为兜底入口，不再从此区暴露）
- 用户见证、"还想探索更多"折叠区
- 4 张插画资源（其他页面引用保持不变）

### 验证
- [ ] 区块高度从 ~520px 压缩到 ~100px
- [ ] 点击任一芯片 → 直接进入语音教练全屏页（不弹中间步骤）
- [ ] 教练开场白能呼应所选 topic
- [ ] 与首页中心红色按钮共享同一会话锁（不会双开）
- [ ] 无 topic 参数时 `/life-coach-voice` 行为与现在完全一致

