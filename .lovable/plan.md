

# AI漫剧分镜脚本生成器 — 管理后台新页面

## 功能概述

在管理后台新增「AI漫剧脚本」页面，用户输入故事主题/关键词，AI 自动生成包含多场景分镜的漫剧脚本，每个分镜包含画面描述（可直接用于即梦/MJ生图）、角色表情动作、对白台词、镜头语言等。

## 产出结构（JSON）

```text
{
  title: "漫剧标题",
  synopsis: "故事梗概（50-100字）",
  characters: [
    { name: "角色A", description: "外貌/性格描述", imagePrompt: "MJ风格画面提示词" }
  ],
  scenes: [
    {
      sceneNumber: 1,
      panel: "远景/中景/特写",
      imagePrompt: "详细画面描述（英文，适合AI生图）",
      characterAction: "角色表情与动作",
      dialogue: "台词/旁白",
      bgm: "背景音效/氛围提示",
      duration: "建议时长（秒）"
    }
  ],
  totalScenes: 8,
  estimatedDuration: "60s"
}
```

## 实施步骤

### 1. 创建 Edge Function `drama-script-ai`

- 接收参数：`theme`（故事主题）、`genre`（题材：悬疑/爱情/搞笑/治愈/科幻）、`sceneCount`（分镜数量 6-12）、`style`（画风：赛博朋克/日系/国风/写实）
- 系统 Prompt 指导 AI 按分镜结构输出
- 使用 tool calling 提取结构化 JSON
- 调用 `google/gemini-3-flash-preview` 模型

### 2. 创建管理后台页面 `DramaScriptGenerator.tsx`

**输入区域**：
- 故事主题（文本框，必填）
- 题材选择（悬疑/爱情/搞笑/治愈/科幻/恐怖）
- 画风选择（赛博朋克/日系动漫/中国风/3D写实/美式漫画）
- 分镜数量（滑块 6-12，默认8）
- 「生成脚本」按钮

**结果展示**：
- 标题 + 故事梗概卡片
- 角色设定卡片（每个角色含 imagePrompt 可一键复制）
- 分镜时间线（纵向卡片列表），每张卡片显示：场景序号、镜头类型、画面描述、角色动作、对白、音效提示
- 每个 imagePrompt 旁有「复制提示词」按钮（方便粘贴到即梦/MJ）
- 完整脚本 JSON 导出按钮

### 3. 注册路由和侧边栏

- 路由：`/admin/drama-script`
- 侧边栏：放在「内容管理」分组下，图标用 `BookOpen` 或 `Clapperboard`，标签「AI漫剧脚本」
- 仅 `admin` 和 `content_admin` 可访问

## 技术要点

- Edge Function 使用 Lovable AI Gateway + tool calling 确保结构化输出
- imagePrompt 生成英文描述，便于直接用于 MJ/即梦/Stable Diffusion
- 前端复用现有 AdminPageLayout、Card、Button 等 UI 组件
- 无需新建数据库表（纯生成工具，不持久化）

