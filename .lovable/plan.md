

## 擅长领域添加"企业管理"选项

在 `src/components/coach-application/BasicInfoStep.tsx` 的 `SPECIALTY_OPTIONS` 数组中新增一项 `"企业管理"`。

### 修改文件

**`src/components/coach-application/BasicInfoStep.tsx`**

将 `SPECIALTY_OPTIONS` 数组从：

```typescript
const SPECIALTY_OPTIONS = [
  "情绪管理",
  "亲子关系",
  "婚姻家庭",
  "职场压力",
  "人际沟通",
  "个人成长",
  "焦虑抑郁",
  "青少年心理",
];
```

改为：

```typescript
const SPECIALTY_OPTIONS = [
  "情绪管理",
  "亲子关系",
  "婚姻家庭",
  "职场压力",
  "人际沟通",
  "个人成长",
  "焦虑抑郁",
  "青少年心理",
  "企业管理",
];
```

仅此一处改动，无其他影响。

