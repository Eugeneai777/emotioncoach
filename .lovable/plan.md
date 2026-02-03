

## 底部信息修改 - 统一样式 + 点击触发微信注册流程

### 需求理解

根据用户截图和反馈：

1. **去掉不同颜色** - 所有文字使用统一灰色样式（不再使用红色）
2. **点击"关注公众号"** - 触发微信注册/关注公众号流程（跳转到 `/wechat-auth?mode=follow`）
3. **移动端排版** - 底部信息需要**滚动才能看到**（不是固定在底部）

---

### 解决方案

#### 文件: `src/components/wealth-block/WealthBlockQuestions.tsx`

**修改内容：**

```tsx
{/* 仅首屏（第一题）显示底部信息 */}
{currentIndex === 0 && (
  <div className="mt-8 pt-6 border-t border-border/30 space-y-3 text-center pb-[env(safe-area-inset-bottom)]">
    {/* 关注公众号链接 - 点击跳转到微信关注流程 */}
    <a 
      href="/wechat-auth?mode=follow"
      className="text-muted-foreground text-sm block"
    >
      点此关注公众号
    </a>
    
    {/* 付费提示 - 统一灰色，不再使用红色 */}
    <p className="text-muted-foreground text-xs">
      需付费后方可查看结果，结果纯属娱乐仅供参考
    </p>
    
    {/* 公司信息和ICP备案 */}
    <p className="text-muted-foreground text-xs">
      北京好企劲商务信息咨询有限公司 京ICP备2023001408号-5
    </p>
  </div>
)}
```

---

### 修改说明

| 修改点 | 原值 | 新值 |
|--------|------|------|
| 链接地址 | `https://mp.weixin.qq.com/s/...` | `/wechat-auth?mode=follow` |
| 链接颜色 | `text-blue-500` | `text-muted-foreground` |
| 付费提示颜色 | `text-red-500` | `text-muted-foreground` |
| 间距 | `mt-6 pt-4` | `mt-8 pt-6` |
| 分隔线 | `border-border/50` | `border-border/30` |

---

### 布局效果（符合截图）

```text
┌────────────────────────────────────────┐
│ [固定头部]                              │
│  ← 财富卡点测评               1/30     │
│  ████░░░░░░░░░░░░░░░░░░░░             │
│  ✨ 完成测评后将获得专业分析报告        │
├────────────────────────────────────────┤
│                                        │
│  [题目卡片]                             │
│  Q1: 您对财富增长的期望是？             │
│  ○ 选项A                               │
│  ○ 选项B                               │
│  ○ 选项C                               │
│                                        │
├────────────────────────────────────────┤
│  [上一题] [下一题]                      │
├────────────────────────────────────────┤
│                                        │
│  ─────────────────────────────         │ ← 分隔线
│                                        │
│       点此关注公众号                    │ ← 统一灰色
│  需付费后方可查看结果，结果纯属娱乐...  │ ← 统一灰色
│  北京好企劲商务信息咨询有限公司...      │ ← 统一灰色
│                                        │
└────────────────────────────────────────┘
   ↑ 需要滚动才能看到
```

---

### 技术要点

| 要点 | 说明 |
|------|------|
| 内部路由跳转 | 使用 `/wechat-auth?mode=follow` 进入公众号关注引导页 |
| 统一颜色 | 全部使用 `text-muted-foreground`，与截图一致 |
| 滚动可见 | 不使用 fixed/sticky，保持在文档流中，需滚动查看 |
| 增加间距 | `mt-8 pt-6` 让底部信息与按钮区域有更明显分隔 |

---

### 修改文件总览

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/wealth-block/WealthBlockQuestions.tsx` | 修改 | 统一文字颜色、修改链接跳转目标 |

