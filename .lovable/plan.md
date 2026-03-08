

## 两个问题需要修复

### 问题 1：构建错误 — PayEntry.tsx 语法错误
上次编辑时，`fetchPartnerInfo` 的函数声明行（`const fetchPartnerInfo = async () => {`）被意外删除，导致第 135 行的 `try` 块变成了孤立代码。

**修复**：在第 134 行（`useEffect` 结束后）重新插入 `const fetchPartnerInfo = async () => {`。

### 问题 2：标题与 AI教练按钮 文字重叠
从截图可以看到，PageHeader 中标题 "情绪健康测评" 使用 `absolute left-1/2 -translate-x-1/2` 居中定位，而右侧的 AI教练按钮较宽，导致两者在移动端视觉上重叠。

**修复**：
- 在 `PageHeader.tsx` 中，给标题添加 `max-w-[40%] truncate` 限制宽度并截断溢出文字
- 或者在 `EmotionHealthPage.tsx` 中缩短标题文字，改为 "情绪测评"

**推荐方案**：修改 PageHeader 的标题样式，添加 `max-w-[40%] truncate text-center`，这样所有页面都能受益，不会出现标题与右侧按钮重叠的问题。

| 文件 | 修改 |
|------|------|
| `src/pages/PayEntry.tsx` | 第 134 行插入 `const fetchPartnerInfo = async () => {` |
| `src/components/PageHeader.tsx` | 标题添加 `max-w-[40%] truncate` 防止与右侧按钮重叠 |

