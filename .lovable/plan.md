

# 修复 saveResult 在 StrictMode 下重复调用

## 问题
`CommAssessmentResult.tsx` 第 36-38 行使用了空依赖数组的 `useEffect` 调用 `saveResult()`。在 React StrictMode 下，组件会挂载两次，导致 `saveResult` 被调用两次，每次测评产生两条重复的数据库记录。

## 方案
使用 `useRef` 标记是否已执行过保存，确保 `saveResult` 只执行一次。这与项目中已有的去重模式一致（如 `useDynamicCoachChat` 中的 `journalGeneratedRef`）。

## 修改文件

**`src/components/communication-assessment/CommAssessmentResult.tsx`**

在组件顶部新增一个 ref：
```tsx
const saveCalledRef = useRef(false);
```

修改 useEffect（第 36-38 行）：
```tsx
useEffect(() => {
  if (saveCalledRef.current) return;
  saveCalledRef.current = true;
  saveResult();
}, []);
```

同时在文件顶部的 import 中加入 `useRef`（当前只导入了 `useState, useEffect`）。

仅修改一个文件，改动约 4 行代码。
