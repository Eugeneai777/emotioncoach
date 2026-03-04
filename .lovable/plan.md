

# 直接生成产品手册档案

不搭建任何新页面，只做两件事：

## 方案

### 1. 创建 Markdown 产品手册文件 (`public/有劲AI产品手册.md`)

直接放在 `public/` 目录下，部署后可通过 URL 直接下载。

内容从 `introShareConfig.ts` 的 17 个产品条目整合，按类别分组：

```text
# 有劲AI · 产品手册
> 每个人的生活教练 — 温暖陪伴 × 系统工具 × 成长社群

---

## 一、AI教练（7款）

### 🌟 AI生活教练
> 24小时智能陪伴
- 5大生活场景智能适配
- 情绪/睡眠/压力全覆盖
- 每次对话自动生成洞察
🔗 https://wechat.eugenewe.net/vibrant-life-intro

### 💜 亲子情绪教练
> 读懂情绪，连结孩子
- 亲子四部曲对话法
- 情绪理解 + 连结修复
- 每次对话生成育儿洞察
🔗 https://wechat.eugenewe.net/parent-coach-intro

... (所有 17 个产品)

## 二、工具类
## 三、合伙人计划
```

### 2. 在平台介绍页底部加一个下载按钮（可选）

在 `PlatformIntro.tsx` 底部加一行：
```tsx
<a href="/有劲AI产品手册.md" download>📥 下载产品手册</a>
```

## 文件变更

| 操作 | 文件 |
|------|------|
| 新建 | `public/有劲AI产品手册.md` — 完整产品手册 |
| 微调 | `src/pages/PlatformIntro.tsx` — 加下载链接（可选） |

部署后直接访问 `https://你的域名/有劲AI产品手册.md` 即可下载。

