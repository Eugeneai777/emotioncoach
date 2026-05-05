
## 目标
后端通过 Lovable AI Gateway 调用 **GPT Image 2** 模型（OpenAI 系图像模型），生成图片并保存到 Supabase Storage，前端能预览 + 下载。

## 说明
Lovable AI Gateway 当前公开可用的图像模型主要是 `google/gemini-3-pro-image-preview` 与 `google/gemini-3.1-flash-image-preview`（Nano Banana 2）。所谓 "premium.gpt / GPT Image 2" 走同一个 Gateway 接口，只需把 `model` 切换到 OpenAI 系图像模型即可（如 Gateway 暴露 `openai/gpt-image-2` 时直接用；否则会回退到 `google/gemini-3-pro-image-preview` 并提示用户）。下面方案做成**模型可配置**，无需改代码即可切换。

## 实现内容

### 1. 后端：新增 edge function `generate-gpt-image`
路径：`supabase/functions/generate-gpt-image/index.ts`

职责：
- 校验登录（`getClaims`）
- 入参：`{ prompt: string, model?: string, aspect?: string }`，默认 `model = "openai/gpt-image-2"`，失败自动 fallback 到 `google/gemini-3-pro-image-preview`
- 调用 `https://ai.gateway.lovable.dev/v1/chat/completions`，`modalities: ["image","text"]`
- 解析返回的 base64 → `Uint8Array`
- 上传到现有 `community-images` bucket（已是 public），路径：`gpt-image/{user_id}/{timestamp}.png`
- 返回 `{ imageUrl, fileName, modelUsed }`
- 标准 CORS、429/402 错误透传、`extractEdgeFunctionError` 友好提示
- 可选：复用 `deduct-quota` 扣 5 点（与 `generate-poster-image` 保持一致）

### 2. 前端：新增测试/调用页面 `src/pages/GptImageLab.tsx`
路由：`/gpt-image-lab`

UI（简洁卡片布局，使用现有 design tokens）：
- 多行 `Textarea` 输入 prompt
- 模型下拉：`openai/gpt-image-2`（默认） / `google/gemini-3-pro-image-preview` / `google/gemini-3.1-flash-image-preview`
- "生成"按钮 → `supabase.functions.invoke('generate-gpt-image', ...)`
- 加载态 Skeleton
- 成功后显示预览图 + "下载图片"按钮（`<a href={url} download>`）+ 复制 URL 按钮
- 错误 toast 用 `extractEdgeFunctionError`

### 3. 路由注册
在 `src/App.tsx` 添加 `<Route path="/gpt-image-lab" element={<GptImageLab />} />`。

## 技术细节
- Storage：复用 `community-images` public bucket，无需新建 bucket / migration
- 默认模型常量 `DEFAULT_MODEL = "openai/gpt-image-2"`，集中在 edge function 顶部，方便后续替换
- Fallback 逻辑：第一次调用若返回 4xx 且响应包含 `model_not_found` / `unknown_model`，自动用 `google/gemini-3-pro-image-preview` 重试一次，并把 `modelUsed` 透传给前端
- 前端文件名：从 URL 提取，默认 `gpt-image-{timestamp}.png`

## 文件改动汇总
- 新增 `supabase/functions/generate-gpt-image/index.ts`
- 新增 `src/pages/GptImageLab.tsx`
- 编辑 `src/App.tsx`（注册路由）
