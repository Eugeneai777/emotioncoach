

# 分享信息卡片 - 添加生成与下载功能（含合伙人二维码）

将现有的 `ShareInfoCard` 从"复制链接"升级为可生成并下载/保存一张带合伙人二维码的信息卡片。

## 卡片内容设计
- 产品介绍信息（财富卡点测评名称、简短描述）
- 合伙人专属二维码（扫码即可进入测评）
- 品牌标识（有劲AI）
- **不包含**任何个人测评结果

## 技术方案

### 1. 新增边缘函数卡片模板
在 `supabase/functions/generate-share-card/index.ts` 中新增 `wealth-info` 卡片类型：
- 复用现有的字体加载、QR 码生成等基础设施
- 使用 satori 渲染纯信息卡片 SVG（产品介绍 + 合伙人二维码）
- 卡片视觉风格：深色金色调（与现有测评卡片风格统一）

### 2. 新增客户端生成工具函数
在 `src/utils/serverShareCard.ts` 中新增：
- `WealthInfoCardData` 接口（仅含 partnerCode 等基础字段）
- `generateServerInfoCard` 函数：调用边缘函数生成信息卡片
- `generateServerInfoCardDataUrl` 函数：返回 data URL 版本

### 3. 改造 `ShareInfoCard` 组件
- 点击后触发服务端卡片生成（而非复制链接）
- 需要获取当前用户的合伙人信息（partner_code）
- 移动端：打开 `ShareImagePreview` 预览（支持长按保存）
- 桌面端：直接触发文件下载
- 加载状态：显示 loading spinner
- 错误处理：toast 提示

### 4. 修改结果页
`WealthBlockResult.tsx` 无需改动，已引入 `ShareInfoCard`。

## 卡片视觉内容（纯信息，无测评数据）
```
┌─────────────────────────────┐
│  ── 财富觉醒之旅 ──          │
│                             │
│  AI财富卡点测评              │
│  30个真实场景 · 深度诊断      │
│  行为/情绪/信念三层扫描       │
│  专属AI语音1对1解读           │
│                             │
│  [扫码开启你的财富觉醒]  [QR] │
│                             │
│  Powered by 有劲AI           │
└─────────────────────────────┘
```

## 文件变更清单
| 文件 | 变更 |
|------|------|
| `supabase/functions/generate-share-card/index.ts` | 新增 `wealth-info` 卡片模板 |
| `src/utils/serverShareCard.ts` | 新增信息卡片生成函数 |
| `src/components/wealth-block/ShareInfoCard.tsx` | 重写为生成/下载卡片逻辑 |

