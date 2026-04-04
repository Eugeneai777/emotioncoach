
已定位，这次“发送失败”主因不是权限，而是“全量群发被当成一次同步请求执行”，请求在前端 30 秒超时后被判定失败。

1. 结论
- 你这次发的是“全部公众号用户”，实际目标数是 5677 人。
- `batch-send-wechat-template` 已经开始执行：日志里明确有
  `[batch-send] 开始批量发送: 5677 个目标, 模式: openid, 场景: default`
- 但前端网络日志显示同一个请求在 `30002ms` 被中止，错误是：
  `timeout` / `signal is aborted without reason`
- 同时 `send-wechat-template-message` 的日志显示，在页面报错后，后台其实还在继续成功发送部分模板消息。

2. 为什么会失败
- `src/lib/apiErrorTracker.ts` 全局劫持了 `fetch`，默认 30 秒就会 `AbortController.abort()`。
- `src/components/admin/WechatBroadcast.tsx` 用一次 `supabase.functions.invoke("batch-send-wechat-template")` 去发全部 5677 人，没有自定义更长超时，也没有后台任务化。
- `supabase/functions/batch-send-wechat-template/index.ts` 还是串行发送：
  - 每人都调用一次 `send-wechat-template-message`
  - 每次之间还固定 `100ms` 节流
- 仅这 100ms * 5677 人，理论最低就约 568 秒（9.5 分钟），还没算每次微信接口往返时间。
- 所以这类“全量群发”不可能在 30 秒内完成，页面必然先超时报错。

3. 这次不是当前的核心问题
- 不是当前用户没有管理员权限：前端已成功查到你有 `admin` 角色，且批量函数已经真正启动。
- 不是 CORS：请求已成功进入函数。
- 不是“完全没发出去”：日志证明已经有部分用户收到了。

4. 还存在的次级问题
- `Admin.tsx` 允许 `admin / content_admin / partner_admin` 进入后台；
  但 `batch-send-wechat-template` 现在只放行 `admin`。
  这会导致别的后台角色以后仍可能 403。
- `WechatBroadcast.tsx` 直接 `if (error) throw error;`，没有用 `extractEdgeFunctionError`，所以界面只会看到很笼统的失败提示。
- 当前架构下，用户一看见失败就容易重复点发送，造成重复群发风险。

5. 最合理的修复方案
A. 把“全量群发”改成后台任务，而不是一次同步请求
- 新增一个群发任务表，保存：
  - 创建人
  - 场景/标题/内容/跳转链接
  - 目标总数
  - 当前进度
  - 成功数/失败数
  - 状态（pending / running / completed / failed / cancelled）
  - 当前处理游标或分片信息
- 前端点击“发送”后，只创建任务并立即返回 `jobId`，不等待全部发送完成。

B. 后台按分片处理
- 每次只处理一小批（例如 50~100 人）。
- 每批完成后更新进度，再继续下一批。
- 这样既不会被前端 30 秒超时卡死，也更容易重试和恢复。

C. 后台页改成“进度型 UI”
- 发送后显示：
  - 总人数
  - 已处理
  - 成功/失败
  - 最近失败原因
  - 是否完成
- 页面只轮询任务状态，不直接等待长请求返回。

D. 小范围发送保留同步，但加长超时
- 对少量发送（例如几十人）可以保留现有同步方式。
- 在 `WechatBroadcast.tsx` 里像其他批处理页面一样显式传入更长 `signal`。
- 但这只能缓解“小批量”，不能解决 5677 人全量群发。

E. 补上防重复发送保护
- 同一标题/场景/目标集在短时间内若已有运行中任务，先提示“已有群发任务执行中”。
- 防止因为页面超时报错而重复点击，造成重复触达。

6. 需要改的文件
- `src/components/admin/WechatBroadcast.tsx`
  - 从“同步等待全部完成”改为“创建任务 + 轮询进度”
  - 接入中文错误提取
- `src/lib/apiErrorTracker.ts`
  - 不要让全局 30 秒超时误伤后台长任务场景，至少允许调用方覆盖
- `supabase/functions/batch-send-wechat-template/index.ts`
  - 改为“创建任务”或“处理单批次”
- 新增一个处理群发分片的后台函数
- 新增数据库迁移
  - 群发任务表
  - 必要索引与 RLS
- 可选修正
  - 统一后台角色与函数角色校验口径

7. 技术判断
当前失败的真实原因是：
“前端把一个至少要数分钟的全量群发，当成 30 秒内必须返回的同步接口来调用。”
所以即使把 401 修好，这个页面继续群发全部关注者，仍然会失败或部分发送后前端报错。

8. 实施优先级
- P1：把全量群发改成后台任务制
- P1：后台页显示任务进度，避免误判失败
- P2：给小批量同步发送加自定义超时
- P2：统一角色校验
- P2：补防重复发送和失败重试机制
