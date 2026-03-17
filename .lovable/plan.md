
目标：一次性修复“教练空间”所有主页按钮在手机端的显示与可点击问题，避免再出现“改一处坏一片”。

一、根因定位（基于你给的两张手机截图）
1) `PageHeader`（/story-coach、/human-coaches、/team-coaching）  
- 标题是 `absolute` 居中，按钮增多后会覆盖左侧“主页”区域。  
- 结果：视觉重叠、点击命中被标题层挡住。

2) `CoachHeader`（财富教练等教练聊天页）  
- 主页按钮是普通 `button`，没有 `whitespace-nowrap`；左侧容器可被压缩。  
- 结果：`主页` 被挤成竖排/换行，布局失真。

二、实施方案（改两个共享头部组件，页面无需再逐页补丁）
1) 修复 `src/components/PageHeader.tsx`
- 不再用“绝对定位标题 + 左右自由挤压”的方式处理移动端。
- 改为稳定三段式布局（左操作区 / 中间标题 / 右操作区），中间标题 `truncate`，不覆盖两侧按钮。
- 给标题加 `pointer-events-none`，确保即使视觉接近也不会挡住按钮点击。
- 主页按钮增加 `whitespace-nowrap` 与 `shrink-0`，保证“主页”不被挤断。

2) 修复 `src/components/coach/CoachHeader.tsx`
- 左侧容器加 `shrink-0`（必要时 `min-w-0`），防止主页按钮被压缩。
- 主页按钮加 `whitespace-nowrap`、`shrink-0`，杜绝“主/页”换行。
- 保持现有跳转逻辑不变：仍然设置 `skip_preferred_redirect` 后跳 `/mini-app`。

3) 保持行为不变，只改布局
- 不改路由、不改鉴权、不改业务逻辑。
- 仅修复移动端 header 的可视与可点性。

三、技术细节（会按现有风格实现）
- `PageHeader`：从“absolute 标题”切到“中间可收缩标题容器（truncate）”。
- 两个 Header 的主页按钮统一使用：
  - `inline-flex items-center`
  - `whitespace-nowrap`
  - `shrink-0`
- 长标题（如“绽放海沃塔 · 团队教练”）在中间区域自动截断，不再压住左侧按钮。

四、验收标准（手机端）
1) `/story-coach`、`/human-coaches`、`/team-coaching`：
- 主页按钮不重叠、不遮挡、可正常点击。
2) 任一教练聊天页（如财富教练）：
- 主页按钮文字不竖排，不被挤坏。
3) 点击主页按钮：
- 正确回到 `/mini-app`，且不会被“偏好页自动跳回”打断。
4) 其它使用这两个 Header 的页面：
- 标题仍可读，右侧操作按钮可点击，无新增遮挡。

五、风险控制
- 本次只动两个共享 Header 组件，避免继续在页面层做分散补丁。
- 采用“结构性布局修复”而不是继续调 `max-w`/`gap` 的微调，防止再次连锁回归。
