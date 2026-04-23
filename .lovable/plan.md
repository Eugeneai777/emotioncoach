

## 全平台电脑端语音识别失败 — 根因与修复方案

### 一、根因分级

#### 根因 A（你直接复现的，影响 `/life-coach-voice`）
`src/utils/platform.ts` 的 `isDesktop()` 判断方式：
- `'ontouchstart' in window` 或 `navigator.maxTouchPoints > 0` 任一为 true 就判定为"非桌面"

现实：
- **Windows Chrome / Edge 在很多笔电（含 Surface、ThinkPad、戴尔触屏本）默认 `maxTouchPoints > 0`**
- 部分 Chromium 版本即使纯键鼠电脑也会让 `ontouchstart in window` 为 true
- 结果：电脑被误判为移动端 → `pttMode` 生效 → `presetPushToTalk(true)` → `track.enabled = false` → 麦克风被永久静音 → AI 听不见

#### 根因 B（影响其他所有语音页：女性专区、青少年、UsAI、财富语音、Index 等）
这些页面**根本没有传 `pttMode`**，按理应走连续通话。但：
- `getPlatformInfo()` 选用 WebRTC，路径正确
- 一旦电脑端 `getUserMedia` 已经被静音预热（之前进过 `/life-coach-voice` 卡过 PTT），`acquireMicrophone()` 会**返回那条已被禁用的缓存流**（见 `src/utils/microphoneManager.ts`）
- 即使没进过生活教练，部分 Windows 浏览器在 WebRTC `addTrack` 后若未显式 `track.enabled = true`，浏览器会保持静音 1–2 秒再开
- 加上 `RealtimeAudio.setMicMuted` 是 private，**连续模式下没有任何"确保 enabled=true"的兜底**

合在一起，结论：
> 电脑端"AI 能说、用户说话没反应"的稳定根因 = `isDesktop()` 误判 + `track.enabled` 缺少正向兜底 + 麦克风缓存复用旧的禁用流

### 二、修复方案（分 3 层加固）

#### 第 1 层：重写桌面判定（核心修复）
**文件：`src/utils/platform.ts`**

`isDesktop()` 改为更稳定的多重判定：

```text
isDesktop():
  if isWeChatMiniProgram → false
  if 移动 UA（iPhone/Android/iPad/Mobile）→ false
  if matchMedia('(pointer: fine) and (hover: hover)') → true     # 鼠标设备
  if matchMedia('(pointer: coarse)') 且无 fine pointer → false   # 纯触屏
  默认 → 按窗口宽度兜底（>=1024 视为桌面）
```

不再把 `ontouchstart` 或 `maxTouchPoints` 作为"非桌面"的硬条件——这两个在 Windows 触屏笔电上极不可靠。

新增明确导出 `getPreferredVoiceInteraction(): 'continuous' | 'ptt'`，统一全站调用。

#### 第 2 层：连续通话路径强制开麦（防御性修复）
**文件：`src/utils/RealtimeAudio.ts`**

- 在 `addTrack` 之后、连接进入 `connected` 之前，**只要不是 PTT 模式，就显式 `track.enabled = true`**
- 数据通道 `open` 时再做一次兜底
- 把 `setMicMuted` 暴露为 `public ensureMicEnabled()` 给上层使用

#### 第 3 层：麦克风缓存自愈
**文件：`src/utils/microphoneManager.ts`**

- `acquireMicrophone()` 返回缓存流时，**强制把所有 audio track `enabled = true`**
- 防止上一次 PTT 把缓存流静音后，下一次连续通话拿到一个"活着但静音"的流

#### 第 4 层：自适应 PTT 容错（你已批准的方案 A 落地）
**文件：`src/components/coach/CoachVoiceChat.tsx`**

- `pttMode` 的最终决策改用新的 `getPreferredVoiceInteraction()`
- 显式 UI 提示：电脑端连续模式显示"直接说话即可"，手机端显示"按住说话"
- URL `?force=ptt` / `?force=continuous` 保留作为兜底

#### 第 5 层（可选）：3 秒无声诊断
**文件：`src/components/coach/CoachVoiceChat.tsx` + `RealtimeAudio.ts`**

连续模式下若 3 秒内 `AnalyserNode` 检测到本地无音频能量，自动提示：
> "未检测到你的声音，请检查系统麦克风权限或选择正确的输入设备"

避免未来再遇到罕见环境兼容问题时用户无感。

### 三、影响范围

| 页面 | 当前症状 | 修复后 |
|---|---|---|
| `/life-coach-voice` | 电脑端 PTT 误激活 → AI 听不到 | 电脑端连续通话，正常 |
| `/teen` 青少年 | 电脑端可能拿到旧缓存静音流 → 听不到 | 强制开麦，正常 |
| `/mama` 女性专区 | 同上 | 正常 |
| `/us-ai` 婚姻教练 | 同上 | 正常 |
| `/wealth-coach-voice` | 同上 | 正常 |
| `/coach/*` 各教练 | 同上 | 正常 |
| 手机浏览器 / 微信小程序 | 工作正常 | **行为完全不变** |
| iPad / 触屏笔电 | PTT 模式（当前可用） | 仍按触屏判定走 PTT，行为不变 |

### 四、不涉及

- 计费 / token edge function
- 教练人设 / 工具调用
- 微信小程序 PTT 主链路
- 移动端 PTT 体验

### 五、涉及文件

1. `src/utils/platform.ts` — 重写 `isDesktop()` + 新增 `getPreferredVoiceInteraction()`
2. `src/utils/microphoneManager.ts` — 缓存流自愈，返回前强制 `enabled = true`
3. `src/utils/RealtimeAudio.ts` — 非 PTT 模式下连接后兜底开麦
4. `src/components/coach/CoachVoiceChat.tsx` — 调用新判定 + UI 模式标签 + 3 秒无声诊断

### 六、验收

1. 电脑 Chrome / Edge / Safari / Firefox 打开 `/life-coach-voice` → 显示"连续通话模式"，AI 开场后**直接说话有响应**
2. 同一电脑打开 `/teen`、`/mama`、`/us-ai`、`/wealth-coach-voice`、各 `/coach/*` → 全部能正常识别用户语音
3. 手机 Safari / Android Chrome / 微信浏览器 → 行为与之前完全一致
4. 微信小程序 → PTT 长按模式不变
5. iPad → 仍按 PTT 模式
6. URL `?force=ptt` 和 `?force=continuous` 均能强制覆盖
7. 控制台不再出现 `[PTT] mode set to push_to_talk` 的桌面误激活日志

