

## 社区帖子「一键美化」排版优化功能

为社区帖子的创建和编辑页面增加 AI 一键美化按钮，用户点击后自动优化文字排版（加段落、标点、分行、适当 Emoji），保留原意不变。

---

### 功能说明

1. 在「发布帖子」和「编辑帖子」的内容输入框旁，各增加一个「一键美化」按钮
2. 用户写完内容后点击按钮，AI 自动优化排版：
   - 合理分段（避免大段文字堆在一起）
   - 修正标点符号
   - 适当添加 Emoji 点缀
   - 纠正明显错别字
   - 保持原意和语气不变
3. 优化后的文本直接替换到输入框中，用户可继续编辑

---

### 技术实现

#### 1. 新建后端函数：`supabase/functions/beautify-post/index.ts`

- 调用 Lovable AI Gateway（`google/gemini-3-flash-preview` 模型）
- System Prompt 指导 AI 进行纯排版优化，不改变内容含义
- 处理 429（限流）和 402（额度不足）错误码
- 清理可能的 Markdown 包裹格式

```text
调用流程：
前端点击按钮 -> supabase.functions.invoke('beautify-post', { body: { content } })
             -> AI 返回优化后文本 -> 替换输入框内容
```

#### 2. 修改前端组件

**`src/components/community/PostComposer.tsx`（创建帖子）**：
- 新增 `beautifying` 状态
- 新增 `handleBeautify` 函数：调用后端 `beautify-post`，将返回结果写入 `content` state
- 在「内容」Label 旁添加「一键美化」按钮（Sparkles 图标），内容为空或正在美化时禁用
- 按钮样式：ghost variant，小号，与 Label 同行右对齐

**`src/components/community/PostEditDialog.tsx`（编辑帖子）**：
- 同样新增 `beautifying` 状态和 `handleBeautify` 函数
- 在「内容」Label 旁添加同样的「一键美化」按钮
- 添加 `Sparkles` 和 `Loader2` 图标的 import

#### 3. AI Prompt 设计

```
你是专业的社区帖子排版优化助手。请优化用户的帖子内容排版，使其更易读、美观。

规则：
1. 合理分段，每段不超过 3-4 句话
2. 修正标点符号（如漏掉的句号、逗号）
3. 纠正明显的错别字
4. 在合适的位置添加 1-3 个相关的 Emoji（不要过多）
5. 严格保持原文含义和语气不变
6. 不要添加标题或额外的内容
7. 直接返回优化后的文本，不要任何解释或 markdown 格式
```

---

### 涉及文件

| 文件 | 操作 |
|------|------|
| `supabase/functions/beautify-post/index.ts` | 新建 |
| `src/components/community/PostComposer.tsx` | 修改 |
| `src/components/community/PostEditDialog.tsx` | 修改 |

不涉及数据库变更，不影响现有支付或其他功能流程。

