

## 优化语音教练接通体验

### 问题诊断
1. **挂断后又自动重连**：`CoachVoiceChat` 的 `getOrCreateSessionId` 在 30s 内复用上次 session；用户挂断 → `navigate(-1)` 回上一页 → 若上一页又跳回 `/life-coach-voice`（或用户再次进入），会被识别为"断线重连"自动接通。
2. **跳出注册页**：`LifeCoachVoice.tsx` 在 `useAuth` 还没 hydrate 完成时 `user=null`，立即 `navigate('/auth?redirect=...')`；`AwakeningBottomNav` 中心按钮无未登录拦截，未登录用户点按钮直接进语音页 → 闪现登录注册页。
3. **接通界面像截图**：`ConnectionProgress` 完整渲染 5 个图标 + 进度条 + "连接成功" + 网络徽章 + 余额行，停留时间长且画面信息密集。

### 改造方案

**1. 修复挂断不复用 session — `src/components/coach/CoachVoiceChat.tsx`**
- 在 PTT 模式的强制挂断（顶部"挂断"和"返回"按钮）里，显式清除 `localStorage.removeItem('voice_chat_session')`，再 disconnect + onClose。
- 同时在 `endCall` 正常流程末尾，PTT 模式下也清除该 key（PTT 用户语义就是"结束就是结束"，不应自动续）。
- 效果：再次进入语音页时一定走全新 session，不会被旧 session 残留触发立刻"已连接"重连。

**2. 修复闪现注册页 — `src/pages/LifeCoachVoice.tsx`**
- 引入 `useAuth` 的 `loading` 状态（若 hook 未暴露则用本地短延时兜底），`loading=true` 时 return `<ConnectionProgress phase="preparing" />` 占位，避免 `user=null` 误判。
- 仅在 `!loading && !user` 时才跳 `/auth`。
- 入口侧 `AwakeningBottomNav.tsx` 给中心按钮加未登录拦截：未登录直接 `navigate('/auth?redirect=/life-coach-voice')`，避免进入语音页内再二次跳转产生闪烁。

**3. 极简化接通过程 + 提速 — `src/components/coach/CoachVoiceChat.tsx`**
- 接通态的视觉替换：移除当前的 `ConnectionProgress`（5 图标 + 进度条 + 网络徽章 + 余额行）和 `coachTitle / coachEmoji` 满屏布局。
- 改为极简 loading：屏幕中央仅显示一个柔和呼吸光圈 + 一行小字「正在接通…」+ 底部一个浅色"取消"。无 emoji、无标题、无图标条、无余额行、无网络徽章。
- 跳过非必要的串行步骤以加速：
  - `checkQuota`、`getMaxDurationForUser` 由"串行 await 后再 connect" 改为**与 `connect()` 并行触发**（`Promise.all` 不阻塞 WebRTC 握手）。额度不足时再走中断分支（已存在的 `insufficientDuringCall` 路径）。
  - 移除接通阶段的 `ConnectionStatusBadge` 与 `InCallNetworkHint` 渲染（连接前不显示），仅在接通成功后保留 in-call 网络提示。
  - 将 `connectionPhase` 多阶段动画过渡缩短：当前每阶段都有 ~200-400ms 视觉延迟，PTT 模式下直接跳过中间阶段，`preparing → connected` 一步切。
- 接通成功后立即切到 PTT 主界面（大圆按钮），不再展示"✓ 连接成功"过渡画面。

### 涉及文件
- `src/components/coach/CoachVoiceChat.tsx`（清 session、并行预检、极简接通 UI、跳过过渡动画）
- `src/pages/LifeCoachVoice.tsx`（auth loading 占位）
- `src/components/awakening/AwakeningBottomNav.tsx`（未登录拦截）

### 验证清单
- [ ] 挂断后再次点中心按钮，进入页面是"全新接通"，不会瞬间显示"已连接"
- [ ] 未登录点中心按钮直接进 `/auth`，登录后正确回到 `/life-coach-voice`，无闪烁
- [ ] 接通画面只剩"呼吸光圈 + 正在接通… + 取消"，无图标条/进度条/网络徽章/余额行
- [ ] 从点击到出现 PTT 大圆按钮的总耗时明显缩短（额度查询不再阻塞 WebRTC）

