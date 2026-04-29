我会在不改变现有页面逻辑和功能的前提下，做一轮“从小程序打开到主页面、点击专区/测评/语音教练/文字教练/训练营/学习”的系统性能优化。

## 已检查到的主要慢点

1. 小程序首次打开 `/mini-app` 仍然很慢
   - 当前性能记录显示：首次内容显示约 12 秒，资源请求约 117 个脚本。
   - 主要不是图片问题，图片已经压缩；更大的瓶颈是入口启动时加载了太多全局脚本、监控脚本、语音相关工具、分享相关依赖。

2. 点击“学习”进入 `/camps?filter=my` 时网络资源暴增
   - 点击后资源从 117 增至 248，总脚本约 2.6MB。
   - 明显出现了不应在“学习页首屏”加载的重资源：`WechatPayDialog`、支付组件、大 logo PNG 等。
   - 原因是 `CampList.tsx` 顶层直接 import `UnifiedPayDialog`，即使用户只是查看学习记录，也会下载支付弹窗及微信/支付宝支付逻辑。

3. 各专区页面打开慢
   - 女性专区、银发陪伴、情侣夫妻、职场解压等页面顶层直接 import `CoachVoiceChat`。
   - `CoachVoiceChat` 约 3000 行，并引入 RealtimeAudio、DoubaoRealtimeAudio、MiniProgramAudio、计费、网络检测等大量语音通话依赖。
   - 这些页面只是打开专区主页时，不一定马上语音通话，但语音模块已经被打包/下载。

4. 分享弹窗依赖拖慢专区首屏
   - 多个专区顶层引入 `IntroShareDialog`。
   - 该组件继续引入二维码、海报生成、图片预览、分享卡片等逻辑；这些只有用户点击“分享”时才需要，不应阻塞专区页面打开。

5. 动态测评页面打开慢
   - `DynamicAssessmentPage.tsx` 顶层直接 import 分享海报弹窗、支付弹窗、历史记录等组件。
   - 测评首屏只需要标题和介绍，但当前会提前加载海报/支付/历史等非首屏模块。

6. 语音 AI 教练页面打开慢
   - `/life-coach-voice` 顶层直接 import `CoachVoiceChat` 和 RealtimeAudio 工具，进入页面即拉取大语音模块。
   - 现有预热逻辑会并行调用 token endpoint 和麦克风预热，功能保留，但需要把“页面壳”和“语音通话重组件”拆开，先显示连接页再加载通话模块。

7. 主页面底部“语音教练”可能被 auth loading 阻塞
   - 底部导航 `AwakeningBottomNav` 每个页面都调用 `useAuth()`。
   - 点击语音教练时如果认证状态还在 loading，会直接 return，造成用户感知“点了没反应”。需要提供即时反馈或改成不阻塞导航。

## 本次优化目标

- 小程序打开主页面：减少首屏必须下载的脚本和非关键副作用。
- 点击专区：只加载专区主页必要 UI，不提前加载语音通话、分享海报、支付弹窗。
- 点击测评：先快速显示测评介绍页，再按需加载支付/分享/历史。
- 点击语音 AI 教练：先显示轻量加载界面，再加载语音核心模块，并保留原有计费、麦克风、PTT、小程序兼容逻辑。
- 点击文字教练：保留现有对话逻辑，但把语音模块、通知/社区/推荐等非首屏模块按需加载。
- 点击训练营/学习：学习列表不提前加载支付模块；训练营详情/购买时才加载支付。
- 识别其它 >1-2 秒页面：先按代码证据列出高风险页面并同步优化第一批，后续可继续实测补齐。

## 具体改造方案

### 1. 全局启动瘦身

修改 `src/main.tsx`：

- 保留必要的错误捕获和 chunk reload。
- 将非关键监控初始化延后到浏览器空闲时执行，例如：
  - `installApiErrorTracker()`
  - `installStabilityCollector()`
  - `installMonitorReporter()`
- 不改变监控功能，只是不让它们抢首屏资源。

预期效果：减少 `/mini-app` 首次打开时的同步脚本压力。

### 2. 路由预加载从“泛预加载”改成“意图预加载”

修改 `src/utils/preloadRoutes.ts` 和 `src/pages/MiniAppEntry.tsx`：

- 保留 `/my-page`、`/auth` 的空闲预加载。
- 不再一次性预加载 6 个专区全部页面，避免小程序首页打开后后台立刻下载一堆页面代码。
- 增加 `preloadRouteOnIntent(route)`：
  - 用户触摸/按下/鼠标进入某个入口卡片时，才预加载对应目标页。
  - 点击前通常已有几十到几百毫秒窗口，能提高体感速度，又不会拖慢主页面首屏。

### 3. 专区页面拆掉首屏重依赖

优化以下页面：

- `src/pages/MamaAssistant.tsx`
- `src/pages/ElderCarePage.tsx`
- `src/pages/UsAI.tsx`
- `src/pages/WorkplacePage.tsx`
- 视情况同步处理 `LaogeAI.tsx`、`XiaojinHome.tsx`

改造方式：

- `CoachVoiceChat` 改为 `React.lazy`，只有用户点击“智能语音/语音教练”后才加载。
- `IntroShareDialog` 改为懒加载包装组件，只有用户点击“分享”按钮时才加载二维码/海报生成逻辑。
- 对移动端小程序环境减少首屏动画延迟：保留视觉效果，但降低多段 `motion` 延迟造成的“内容晚出现”体感。
- 对有购买状态查询的专区，只让营销条/按钮状态渐进更新，不阻塞专区主体 UI 先显示。

### 4. 语音教练页面分层加载

优化：

- `src/pages/LifeCoachVoice.tsx`
- `src/components/voice/GlobalVoiceProvider.tsx` 如有需要同步调整

改造方式：

- `LifeCoachVoice` 不再顶层 import `CoachVoiceChat` 和 RealtimeAudio 预热工具。
- 页面先显示轻量“正在准备语音教练”界面。
- 用户已登录后，再动态 import：
  - `CoachVoiceChat`
  - `RealtimeAudio` 预热方法
- 保留原有功能：
  - 登录拦截
  - topic 场景映射
  - token endpoint 预热
  - 麦克风预热
  - PTT 模式
  - 计费/扣点逻辑

这样语音页仍会加载重模块，但不会阻塞路由切换和首屏反馈。

### 5. 文字教练页面减重

优化 `src/pages/DynamicCoach.tsx`：

- 将 `CoachVoiceChat` 改为懒加载，只在 `showVoiceChat === true` 时加载。
- 将非首屏模块按需加载或延后加载，例如：
  - 社区模块
  - 视频推荐
  - 工具推荐
  - 训练营推荐
  - 通知模块
- 教练模板和文字对话首屏保留，确保用户能快速看到输入框和引导内容。

### 6. 测评页面首屏优化

优化：

- `src/pages/DynamicAssessmentPage.tsx`
- `src/pages/AssessmentTools.tsx`

改造方式：

- `AssessmentPromoShareDialog` 改为点击分享时才懒加载。
- `AssessmentPayDialog` 改为需要支付时才懒加载。
- `DynamicAssessmentHistory` 改为用户点击“历史记录”时才加载。
- `AssessmentTools` 的完成状态查询继续保留，但页面先渲染工具/测评列表；完成标识异步补齐，不阻塞点击。
- 对 `/assessment/:assessmentKey` 增加意图预加载：从入口页或测评列表触摸卡片时预加载对应页面。

### 7. 训练营和“学习”页优化

优化 `src/pages/CampList.tsx`：

- `UnifiedPayDialog` 改为懒加载，只有打开支付弹窗时才下载支付逻辑。
- 在 `filter=my` 的学习页模式中，不加载支付弹窗和购买相关重组件。
- `camp_templates` 查询仅在非 filter 模式需要浏览训练营时启用；进入 `/camps?filter=my` 时不需要先查全部训练营模板。
- `myAssessments` 当前存在二段查询：先查 `partner_assessment_results`，再查 templates。保留逻辑，但优化为：
  - 限制字段和数量。
  - 如果没有动态测评记录，不发第二次模板查询。
  - 页面先显示学习页壳和骨架，训练营与测评分区并行渐进显示。

### 8. 底部导航点击提速

优化 `src/components/awakening/AwakeningBottomNav.tsx`：

- “学习”和“我的”按钮增加触摸预加载：`onPointerDown` 预加载 `/camps?filter=my`、`/my-page`。
- 中间“语音教练”按钮不再因为 auth loading 完全无响应：
  - 如果 loading 中，先预加载 `/life-coach-voice`。
  - loading 结束后继续现有登录判断。
  - 或直接导航到目标页，由目标页做登录拦截，减少点击无反馈。

### 9. 其它疑似 >1-2 秒页面同步列入首批优化

根据当前代码结构，以下页面属于高风险慢页面，会同步做“按需加载”处理：

- `/life-coach-voice`：语音核心模块重。
- `/coach/:coachKey`：文字教练页顶层包含语音、通知、推荐、社区模块。
- `/camps`、`/camps?filter=my`：支付弹窗和学习记录多查询。
- `/assessment/:assessmentKey`：支付/分享/历史弹窗首屏提前加载。
- `/mama`、`/elder-care`、`/us-ai`、`/workplace`：专区页提前加载语音和分享海报依赖。
- `/laoge`：有多组购买/完成状态查询，可渐进渲染。
- `/xiaojin`：额度查询和升级弹窗可保持功能但避免阻塞主体 UI。

## 不会改变的功能

- 不改变现有路由路径。
- 不改变购买、支付、训练营权益、订单判断逻辑。
- 不改变语音 AI 教练的 token、计费、麦克风、小程序兼容逻辑。
- 不改变文字教练的消息发送、智能推荐、通知逻辑。
- 不改变测评计分、支付解锁、AI 洞察生成逻辑。
- 不改变分享海报功能，只改为点击分享时加载。

## 预期效果

- `/mini-app` 首屏减少后台脚本竞争，主页面显示更快。
- 从 `/mini-app` 点 6 个专区：先显示专区 UI，再按需加载语音/分享模块。
- 点“学习”：不再提前下载支付弹窗，进入学习记录页更快。
- 点训练营浏览：页面可先显示骨架/列表，支付模块只在购买时下载。
- 点测评：测评介绍页更快出现。
- 点语音教练：会先有即时准备反馈，再进入通话，不再像白屏或卡住。

## 验证方式

实施后会检查：

1. `/mini-app` 手机尺寸首屏显示是否正常。
2. 6 个入口卡片跳转是否正常，且专区主页内容快速出现。
3. 各专区的分享按钮仍能打开分享弹窗并生成海报。
4. 各专区语音按钮仍能打开 `CoachVoiceChat`。
5. `/life-coach-voice?topic=anxiety` 仍能登录拦截、场景映射、进入语音准备流程。
6. `/coach/:coachKey` 文字教练仍能加载模板、发送消息，语音入口仍可用。
7. `/assessment/:assessmentKey` 测评介绍、开始答题、支付弹窗、分享弹窗、历史记录仍可用。
8. `/camps?filter=my` 学习页记录显示正常。
9. `/camps` 训练营列表、购买弹窗、购买后跳转仍正常。
10. 浏览器性能记录中，首屏不再提前出现 `WechatPayDialog`、`CoachVoiceChat` 等非当前操作必需模块。