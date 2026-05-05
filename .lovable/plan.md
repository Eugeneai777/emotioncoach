
# /drama-script 重构方案：深色三栏短剧工作台

## 目标

把现在 7000+ px 的长卷轴单页，改成像剪映专业版/达芬奇那样一目了然的深色工作台：
- 左栏：脚本库（已保存的脚本/集数）
- 中栏：分镜网格画板（每镜一张缩略卡）
- 右栏：当前选中分镜的详情面板（图、视频、音频、提示词、操作）
- 顶栏：当前脚本标题、保存/导出/续集等全局操作
- 底栏：进度&状态条（生图/生视频任务）

不改业务逻辑、不改后端、不改数据结构，纯前端重排。

## 布局结构

```text
┌──────────────────────────────────────────────────────────────────┐
│ TopBar  剧名｜模式｜保存｜导出｜生成续集｜⏷一致性 96            │
├────────────┬───────────────────────────────────┬─────────────────┤
│            │                                   │                 │
│  脚本库    │      分镜网格（2-4 列缩略卡）     │  选中分镜详情   │
│  Sidebar   │                                   │  Inspector      │
│            │  ┌────┐ ┌────┐ ┌────┐ ┌────┐      │                 │
│ ▸ 系列A    │  │ 1  │ │ 2  │ │ 3  │ │ 4  │      │  [大图]         │
│   ├ 第1集*│  └────┘ └────┘ └────┘ └────┘      │  [视频]         │
│   └ 第2集 │  ┌────┐ ┌────┐ ┌────┐ ┌────┐      │  [音频]         │
│ ▸ 系列B    │  │ 5  │ │ 6  │ │ 7  │ │ 8  │      │  分镜文字       │
│            │  └────┘ └────┘ └────┘ └────┘      │  AI提示词(折叠) │
│ + 新建脚本 │                                   │  操作按钮       │
│            │   封面 / 角色定妆 / 分镜 三标签   │                 │
├────────────┴───────────────────────────────────┴─────────────────┤
│ StatusBar  生图 2/8｜生视频 1/3｜配音 0/8｜剩余配额 ¥xx          │
└──────────────────────────────────────────────────────────────────┘
```

桌面 ≥1024px：三栏；移动端：左/右两栏自动收成抽屉，中栏全宽。

## 设计 Token（深色专业工作台）

写入 `src/index.css` 的 `:root` 与 `.dark`，这块页面强制用 `.dark` 主题：

- 背景：`--workbench-bg 220 13% 9%`（接近 #14171c）
- 面板：`--workbench-panel 220 13% 13%`
- 边框：`--workbench-border 220 9% 22%`
- 强调主色：`--workbench-accent 24 100% 58%`（剪映式橙红，按钮/激活态）
- 次强调：`--workbench-info 199 90% 60%`（生成中/视频）
- 成功：`--workbench-ok 142 70% 45%`
- 文本：`--workbench-fg 0 0% 96%`、`--workbench-muted 220 9% 65%`
- 分镜缩略卡阴影：`--workbench-glow 0 0 0 1px hsl(var(--workbench-accent) / 0.6)`

字号收紧：标题 14px / 正文 13px / 标签 11px。

## 拆分文件

把 3026 行的 `DramaScriptGenerator.tsx` 拆成工作台壳 + 子组件，所有现有 state、useCallback、`generateSceneImage`/`generateSequel`/自动保存等逻辑全部上移到 `DramaWorkbenchContext`（一个本地 Context Provider），子组件通过 `useDramaWorkbench()` 拿数据，不动业务逻辑：

```
src/components/admin/drama-workbench/
├── DramaWorkbench.tsx          // 壳：三栏 + 顶栏 + 底栏
├── context.tsx                 // Provider，包住原文件中的 state/逻辑
├── TopBar.tsx                  // 剧名、模式、保存/导出/续集
├── ScriptLibrarySidebar.tsx    // 左栏：savedScripts 列表+新建+续集快捷
├── CanvasArea.tsx              // 中栏：Tab 切换 封面 / 角色 / 分镜 / 一致性
├── SceneGrid.tsx               // 分镜网格 2-4 列缩略卡
├── SceneThumbCard.tsx          // 单个缩略卡（图/状态徽章/序号）
├── SceneInspector.tsx          // 右栏：当前选中分镜的详情和操作
├── CharacterPanel.tsx          // 角色定妆图区（迁自原文件）
├── CoverPosterPanel.tsx        // 封面海报区
├── ConsistencyBadge.tsx        // 一致性评分胶囊
└── StatusBar.tsx               // 底部任务进度条
```

`DramaScriptGenerator.tsx` 改为薄壳：保留原 props，渲染 `<DramaWorkbenchProvider><DramaWorkbench /></DramaWorkbenchProvider>`，因此 `/drama-script` 与 `/admin/drama-script` 两条路由零改动。

## 中栏交互（核心改进）

中栏顶部有 4 个标签：

1. **设定** —— 当前的输入表单（题材/画风/强度/分镜数/主题），未生成脚本时默认停在这里
2. **封面 + 角色** —— 海报图、角色定妆图区
3. **分镜画板** ⭐ —— 网格缩略卡（默认 3 列，宽屏 4 列，窄屏 2 列）
4. **一致性 / 续集预览** —— 一致性卡 + 续集预览卡

#### SceneThumbCard（缩略卡）

- 16:9 / 9:16 自适应（按 `imageAspectRatio`）
- 缩略图占满，无图时灰色棋盘格 + "未生成"
- 左上角序号徽章 `#3`
- 右上角状态徽章：🟧 生图中 / 🟦 生视频中 / 🟩 已完成 / ⬜ 未开始
- hover 显示半透明遮罩 + 一句话动作描述（`scene.characterAction` 截断 30 字）
- 点击 → 该卡边框高亮 + 右栏 Inspector 切换到这镜
- 右键 / "⋯" 菜单：重生成图、生成视频、配音、复制提示词

被选中的卡用 `--workbench-accent` 描边 + 微弱外发光。

## 右栏 Inspector（替代原长卡）

固定宽度 `w-[380px]`（>1280px）/ `w-[340px]`（1024-1280px）；<1024px 改成右滑抽屉（`Sheet`）。

内容自上而下：
1. 大预览（图，可点开 lightbox）
2. 视频/音频小播放器（如有）
3. 分镜元数据（动作、台词/旁白、BGM）—— 中文，纯展示
4. 折叠区「AI 生图提示词（English）」+ 复制 / 即梦提示词按钮（沿用上次确认的折叠逻辑）
5. 操作按钮组：生图 / 重生图 / 生视频 / 重生视频 / 配音 / 删本镜
6. 引用图（人物一参考图、上一镜参考图）小预览

## 顶栏 & 底栏

#### TopBar（h-12）
- 左：折叠左栏图标 + 当前剧名（可改）+ 第 N 集胶囊
- 中：模式切换（通用 / 有劲 AI）
- 右：保存 / 导出 JSON / 导出 CSV / 生成续集 / 一致性评分胶囊（点击切到一致性 Tab）

#### StatusBar（h-9）
- 聚合 `sceneImages` / `sceneVideos` / `sceneAudios` 里的 `generating` 状态，显示成 "生图 2/8 · 生视频 1/3 · 配音 0/8"
- 右侧实时显示已生成媒体计数 + "全部生图" / "全部生视频" 全局操作（沿用现有循环）

## 移动端

- TopBar 折叠：剧名 + 三个图标按钮（菜单/Tab/Inspector）
- 左栏 → `Sheet` 抽屉
- 右栏 → `Sheet` 抽屉，点缩略卡时自动弹出
- 中栏 SceneGrid 自动 2 列

## 续集 / 已保存脚本

左栏树状显示 `series_id` 分组：
- ▸ 《系列名》
  - ├ 第1集 *(当前)*
  - └ 第2集
- 鼠标悬浮某集 → 出现 `+续集` `复制` `删除` 三个图标，沿用现有 `generateSequel` / `deleteScript`

## 不改的东西（明确范围）

- 后端 edge function、prompt、数据库字段：完全不变
- 业务逻辑（生图、生视频、续集、保存、自动 1s 防抖回写）：全部沿用，仅迁到 Context 中
- 路由、权限、入口：不变
- 上一轮已加的"图片中文化"、"续集继承定妆图"、"英文提示词折叠"全部保留

## 实施步骤

1. 在 `src/index.css` 增加 `--workbench-*` 设计 token，并新增 `.drama-workbench` 作用域强制深色
2. 新建 `src/components/admin/drama-workbench/context.tsx`，把原文件 1500 行业务逻辑（state + callbacks）原样搬过来导出 `useDramaWorkbench()`
3. 新建上面列的 8 个子组件，把原文件对应的 JSX 块迁过来并按新设计重排
4. 把 `DramaScriptGenerator.tsx` 改成薄壳（≈30 行）
5. 在桌面 1106px / 移动 390px 两个尺寸做视觉验收

## 风险

- 文件拆分量较大；通过 Context 集中 state，避免 props 钻探，降低出错概率
- 现有"未生成脚本时也要看见输入表单"的逻辑通过"设定 Tab 默认激活"保留
- 已保存脚本的载入/续集预览/底部 sticky 操作栏要迁到 TopBar 和 StatusBar，验证没有功能丢失

确认后我会进入构建模式按上述方案实施。
