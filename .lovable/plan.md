

## 修复：9.9 支付按钮无法固定在底部

### 根本原因

`AssessmentIntroCard` 的父级 `motion.div`（`WealthBlockAssessment.tsx` 第 741-744 行）设置了：

```tsx
style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
```

CSS 规范中，**任何设置了 `transform` 的元素都会创建新的包含块（containing block）**，导致其内部的 `position: fixed` 元素不再相对于视口定位，而是相对于该 transform 元素定位。这就是按钮无法固定在屏幕底部的原因。

### 修复方案

将固定底栏从 `AssessmentIntroCard` 内部移到父页面 `WealthBlockAssessment.tsx` 中，放在 transform 容器的**外部**。

### 改动文件

| 文件 | 改动 |
|------|------|
| `src/components/wealth-block/AssessmentIntroCard.tsx` | 移除固定底栏（第 600-621 行），移除外层 Fragment `<>...</>`，恢复为单一 `motion.div` 返回 |
| `src/pages/WealthBlockAssessment.tsx` | 在 `main` 标签外部、transform 容器外部添加固定底栏，条件为 `showIntro && !hasPurchased && !isRedirectingForAuth && !authLoading && !isPurchaseLoading` |

### 具体结构（修复后）

```text
<页面组件>
  <main> (普通容器)
    <Tabs>
      <motion.div style={{ transform: 'translateZ(0)' }}>  <-- 创建新包含块
        <AssessmentIntroCard />  <-- 内部不再有 fixed 元素
      </motion.div>
    </Tabs>
  </main>

  {/* 在 transform 容器外部，直接挂在页面根级 */}
  {showIntro && !hasPurchased && (
    <div className="fixed bottom-0 inset-x-0 z-50 ...">
      ¥9.9 [立即测评]
    </div>
  )}
</页面组件>
```

共 2 个文件修改，无数据库改动。
