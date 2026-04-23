
## 这次不再用“感觉修好了”来判断

### 目标
把这次问题改成“可证明已修复”：
1. 真正修掉小程序 PTT 链路里的确定性问题  
2. 给出手机端可见的验证信号  
3. 只有满足明确验收条件，才算解决

### 已确认的两个高风险点
1. `supabase/functions/miniprogram-voice-relay/index.ts` 当前会无视客户端发来的 `turn_detection: null`，仍然固定给远端会话启用 `server_vad`。  
   这意味着“小程序 PTT 模式”在服务端并没有被真正执行。

2. `src/utils/MiniProgramAudio.ts` 当前会优先走 Web Audio 录音链路；在小程序 WebView 里，这条链路即使“连接成功”，也可能出现“按钮有状态、但没有实际音频帧发出去”的静默失败。  
   之前多次修复都缺少端到端证据，所以容易误判。

## 实施方案

### 一、先把 PTT 协议真正打通
修改 `supabase/functions/miniprogram-voice-relay/index.ts`：
- 接收并保存客户端 `session_config.turn_detection`
- 在创建远端 realtime session 时，按客户端配置设置
  - PTT：`turn_detection: null`
  - 非 PTT：保留 `server_vad`
- 首次建连后，向客户端回传一个轻量确认事件，例如：
  - `ptt_config_applied`
  - 包含实际生效的 `turn_detection` 值

这样可以明确知道：这次到底有没有真的切到 PTT，而不是只在前端“以为”切了。

### 二、给小程序端加“端到端可见状态”
修改 `src/utils/MiniProgramAudio.ts`：
- 增加 PTT 调试状态回调，输出以下事实信号：
  - WebSocket 是否 open
  - 当前录音源：`web_audio` / `wx_recorder`
  - 按下后是否检测到本地音频能量
  - 已发送音频帧数量
  - 是否收到 relay 的 `ptt_config_applied`
  - 松手后是否发送了 `commit`
  - 是否收到首个用户转写 / AI 响应
- 若按住后在限定时间内没有任何音频能量或没有发送帧：
  - 明确标记为 `mic_silent`
  - 不再只显示“连接成功”

### 三、在 UI 上做一个临时可见的 PTT 健康面板
修改 `src/components/coach/CoachVoiceChat.tsx`：
- 仅在小程序 + PTT 模式下显示一块小型状态面板
- 用非技术化文案展示 5 个关键状态：
  - 通道已连接
  - 按钮已按下
  - 麦克风已采到声音
  - 声音已发送
  - 已收到回复
- 若失败，直接显示失败环节：
  - “按钮按下了，但没有采到声音”
  - “采到声音了，但没有发出去”
  - “已发出去，但服务器仍是自动监听模式”
  - “已提交，但没有生成回复”

这样用户在手机上就能一眼看出卡在哪一段，而不是继续黑盒试错。

### 四、修正录音链路选择策略
修改 `src/utils/MiniProgramAudio.ts`：
- 不再把“Web Audio 可用”直接等同于“Web Audio 可靠”
- 保留当前录音源，但加入健康检查门槛：
  - 按住后若无音频能量 / 无 outbound chunk，则判定当前录音源无效
- 为无效链路打出明确错误码，供 UI 展示
- 避免再次出现“代码逻辑看起来对，但手机上仍然无声”的情况

### 五、把验收标准改成“证据链”
这次验收不再用“按钮会变红 / build 成功 / 我改了逻辑”判断，而是以下 5 条必须全部成立：

#### 1. 未按按钮时
- 用户直接说话
- 不应出现用户转写
- 不应触发 AI 打断或回复

#### 2. 按住按钮时
- 状态面板显示“麦克风已采到声音”
- 音频帧计数持续增加

#### 3. 松开按钮后
- 状态面板显示“已发送”
- 触发 `commit + response.create`

#### 4. 1-2 秒内
- 出现用户转写或 AI 回复
- 说明整条链路通了，而不只是前端按钮动了

#### 5. 服务端配置确认
- 状态面板或日志明确显示当前会话是 `turn_detection: null`
- 证明服务端已真正进入 PTT，而不是还在自动监听

## 涉及文件
- `supabase/functions/miniprogram-voice-relay/index.ts`
- `src/utils/MiniProgramAudio.ts`
- `src/components/coach/CoachVoiceChat.tsx`

### 可选
- `src/components/coach/PushToTalkButton.tsx`  
仅在需要补充“按下中 / 等待连接 / 录音失败”视觉状态时调整

## 技术细节
```text
按下按钮
  -> PTT start
  -> 本地检测到音频能量
  -> outbound chunk count 增长
  -> 松手
  -> commit
  -> response.create
  -> transcript / AI reply

任何一步失败，都要在 UI 上显示失败点
```

## 这次的完成定义
只有当“小程序真机上”看到以下组合证据，才算解决：
- 服务端确认已应用 `turn_detection: null`
- 按住时本地有音频能量
- 按住时音频帧数增长
- 松手后成功 commit
- 随后收到转写或 AI 回复

如果缺少其中任意一项，这次就不标记为“已修复”。
