

## 替换"陪陪老人"为更高频痛点场景

### 替换方案
"陪陪老人"对当前 35-55 高压人群不是直接痛点，替换为更贴近自身的场景。

| 原 | 新 |
|---|---|
| 👵 陪陪老人 / 想给爸妈打电话 / `elderly` | 😮‍💨 情绪崩溃 / 突然想哭一场 / `meltdown` |

配色沿用 amber/yellow 槽位不变。

### 后端校对
`vibrant-life-realtime-token/index.ts` 的 `SCENARIO_CONFIGS` 需新增 key `"情绪崩溃"`（开场白示例："嘿，先别憋着…我在，想哭就哭出来，慢慢说怎么了"）。其余 7 个 key 已存在。

### 涉及文件
1. **`src/pages/MiniAppEntry.tsx`** — `useCases` 数组中替换该卡的 `emoji / title / subtitle / topic`
2. **`src/pages/LifeCoachVoice.tsx`** — `TOPIC_TO_SCENARIO_KEY` 删 `elderly`，加 `meltdown: "情绪崩溃"`
3. **`supabase/functions/vibrant-life-realtime-token/index.ts`** — `SCENARIO_CONFIGS` 新增 `"情绪崩溃"` 配置（persona 偏共情陪伴、开场放慢语速、不急于给方案）

### 不动
其余 7 张卡、布局、PTT 主流程、计费、首页中心按钮共享会话锁。

### 验证
- [ ] 该卡渲染为 😮‍💨 情绪崩溃 / 突然想哭一场
- [ ] 点击 → PTT 语音教练用"情绪崩溃"开场白回应
- [ ] 其余 7 张卡行为零回归

