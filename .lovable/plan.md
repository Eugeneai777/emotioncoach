

# 去掉聊天页内部 ← 返回按钮

## 修改内容

**文件**: `src/pages/YoujinLifeChat.tsx`（第 229-237 行）

将当前 header 中的返回按钮+标题区域，改为只保留标题：

```tsx
// 改前（229-237）
<div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 ...">
  <button onClick={() => navigate("/youjin-life")} ...>
    <ArrowLeft ... />
  </button>
  <div>
    <p>有劲AI</p>
    <p>一句话帮你搞定</p>
  </div>
</div>

// 改后
<div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 ...">
  <div>
    <p>有劲AI</p>
    <p>一句话帮你搞定</p>
  </div>
</div>
```

仅删除 `<button>` 元素（第 230-232 行），其余不变。用户通过顶部 `PageHeader` 的返回键或微信原生返回即可回到 `/mini-app`。

