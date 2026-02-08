

## 修复分享卡片两个问题：反应模式显示英文 + 未调用手机原生分享

### 问题 1：反应模式显示英文 "avoid" 而非中文 "逃避型"

数据库存储的 `reaction_pattern` 是英文 key（如 `avoid`、`chase`、`trauma`），但 `AssessmentValueShareCard` 直接显示了这个原始 key，没有翻译成中文。

```text
数据流：
  数据库 reaction_pattern = "avoid"
  → WealthBlockResult 传入 result.reactionPattern = "avoid"
  → WealthInviteCardDialog 传入 reactionPattern = "avoid"  
  → AssessmentValueShareCard 直接渲染 "avoid" ← 问题在这里
```

项目中已有翻译配置 `reactionPatternConfig.ts`：
- `avoid` → `逃避型`
- `chase` → `追逐型`
- `trauma` → `创伤型`
- `harmony` → `和谐型`

**修复**：在 `AssessmentValueShareCard` 中引入 `getPatternConfig`，将英文 key 翻译为中文名称显示。

### 问题 2：点"分享"按钮没有调用手机原生分享

当前代码中已经有 `handleNativeShare` 函数（会调用 `navigator.share()`），但主按钮绑定的是 `handleDownload`。`handleDownload` 在 iOS/微信 H5 环境下直接跳到图片预览（长按保存），跳过了原生分享。

```text
当前按钮行为：
  点击"分享" → handleDownload → 检测到 iOS → 直接显示图片预览
  
期望行为：
  点击"分享" → handleNativeShare → navigator.share() → 系统分享面板
                                  → 失败时才回退到图片预览/下载
```

**修复**：将主按钮的 `onClick` 改为一个统一分享函数：
- 在支持 Web Share API 的环境（iOS、Android）：优先调用 `navigator.share` 弹出系统分享面板
- 在小程序或不支持原生分享的环境：退回到生成图片预览（长按保存）

### 修复细节

#### 文件 1：`src/components/wealth-block/AssessmentValueShareCard.tsx`

- 引入 `getPatternConfig` 
- 将 `reactionPattern` 通过 `getPatternConfig` 翻译后显示中文名
- 例如传入 `"avoid"` → 显示 `"逃避型"`

#### 文件 2：`src/components/wealth-camp/WealthInviteCardDialog.tsx`

- 将主按钮的 `onClick` 从 `handleDownload` 改为新的 `handleShare` 函数
- `handleShare` 逻辑：
  1. 生成卡片图片（canvas → blob）
  2. 如果环境支持 `navigator.share`：调用原生分享
  3. 如果原生分享不可用或失败：回退到图片预览/下载
- 移除 `handleDownload` 中重复的环境检测逻辑，统一到一个入口

### 文件变更总表

| 文件 | 操作 |
|------|------|
| `src/components/wealth-block/AssessmentValueShareCard.tsx` | 修改 - 引入 getPatternConfig 翻译英文 key |
| `src/components/wealth-camp/WealthInviteCardDialog.tsx` | 修改 - 主按钮改用 handleNativeShare 优先原生分享 |

