

# 专属亮点图标替换

## 改动

**文件**: `src/pages/SynergyPromoPage.tsx`，第100-101行

将：
```typescript
{ icon: "👤", title: "1V1教练专属辅导", detail: "资深教练一对一，量身定制成长方案", tag: "稀缺" },
{ icon: "👥", title: "海沃塔团队研讨", detail: "犹太精英学习法，同频伙伴深度共创", tag: "特色" },
```

改为：
```typescript
{ icon: "🎯", title: "1V1教练专属辅导", detail: "资深教练一对一，量身定制成长方案", tag: "稀缺" },
{ icon: "💡", title: "海沃塔团队研讨", detail: "犹太精英学习法，同频伙伴深度共创", tag: "特色" },
```

两行改动，纯数据替换。现有 `grid-cols-2` 布局手机端和电脑端已兼容，无需额外适配。

