

## 将"AI对话点数"改为"尝鲜会员"

### 需要修改的文件

根据搜索结果，需要修改以下4个文件中的"AI对话点数"文本：

| 文件 | 修改位置 | 修改内容 |
|:-----|:---------|:---------|
| `src/config/youjinPartnerProducts.ts` | 第5行 | `name: 'AI对话点数'` → `name: '尝鲜会员'` |
| `src/config/productComparison.ts` | 第90行 | `name: "AI对话点数"` → `name: "尝鲜会员"` |
| `src/components/ProductComparisonTable.tsx` | 第596、599行 | 注释和显示文本改为"尝鲜会员" |
| `src/components/partner/EntryTypeSelector.tsx` | 第12行 | `label: 'AI对话点数'` → `label: '尝鲜会员'` |

### 具体修改

#### 1. `src/config/youjinPartnerProducts.ts`
```typescript
// 修改前
{ key: 'ai_points', name: 'AI对话点数', value: '50点', icon: '🤖' },

// 修改后
{ key: 'ai_points', name: '尝鲜会员', value: '50点', icon: '🎫' },
```

#### 2. `src/config/productComparison.ts`
```typescript
// 修改前
{ name: "AI对话点数", category: "体验包内容", l1: "50点", l2: "50点", l3: "50点" },

// 修改后
{ name: "尝鲜会员", category: "体验包内容", l1: "50点", l2: "50点", l3: "50点" },
```

#### 3. `src/components/ProductComparisonTable.tsx`
```tsx
// 修改前
{/* AI对话点数 */}
<div className="...">
  <span className="text-2xl">🤖</span>
  <p className="font-medium text-sm mt-1">AI对话点数</p>
  <p className="text-xs text-blue-600 dark:text-blue-400">50点</p>
</div>

// 修改后
{/* 尝鲜会员 */}
<div className="...">
  <span className="text-2xl">🎫</span>
  <p className="font-medium text-sm mt-1">尝鲜会员</p>
  <p className="text-xs text-blue-600 dark:text-blue-400">50点</p>
</div>
```

#### 4. `src/components/partner/EntryTypeSelector.tsx`
```typescript
// 修改前
{ key: 'basic', label: 'AI对话点数', description: '50点', icon: '🤖' },

// 修改后
{ key: 'basic', label: '尝鲜会员', description: '50点', icon: '🎫' },
```

### 备注

- 图标从 🤖（机器人）改为 🎫（票券），更符合"尝鲜会员"的含义
- key 值保持 `ai_points` 和 `basic` 不变，避免影响现有数据关联

