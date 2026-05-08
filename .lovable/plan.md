# 修复"下载 7 天伴随手册 PDF"页面异常

## 现象
管理员点击「下载 7 天伴随手册 PDF」跳转后，页面立刻显示"页面出现异常 / 刷新页面重试"。

## 根因
`src/pages/admin/AdminHandbookExport.tsx` 把 `useMemo(filename...)` 写在了 `if (roleLoading) return ...` / `if (!isAdmin) return ...` / `if (!recordId) return ...` 这三个**条件 return 之后**（第 91 行）。

React Hooks 规则要求每次渲染调用相同数量、相同顺序的 hook：
- 首次渲染：`roleLoading=true` → 只调用前 7 个 hook 就 return 了
- 数据返回后：`roleLoading=false, isAdmin=true` → 多跑一个 `useMemo`
- React 抛 "Rendered more hooks than during the previous render" → 被全局 ErrorBoundary 捕到 → 显示"页面出现异常"

只改这一个文件即可，不动业务逻辑、不动数据装配、不动 PDF 渲染。

## 修复方案

把 `useMemo(filename...)` 提到所有条件 return 之前；`handbookType` 也一并提前。条件分支只决定渲染什么 JSX，不再决定要不要调用 hook。

### 改后顺序（hook 调用区，必须无条件执行）
```
useParams
useMarketingPoolAdminStatus
useState × 4
useRef
useEffect
useMemo(filename)        // ← 提前到这里
```

### 渲染区（条件 return）
```tsx
if (roleLoading) return <Loader />
if (!isAdmin) return <Navigate to="/admin" />
if (!recordId) return <div>缺少 recordId 参数</div>
return <主 UI />
```

`useMemo` 内部已经做了 `if (!data) return ""` 兜底，提前调用是安全的。

## 不在本次修改范围
- 数据装配 `buildMaleData` / `buildEmotionData` 不动
- AI Edge Function 不动
- HandbookContainer 与 P1-P9 渲染组件不动
- 路由 `/admin/handbook/:type/:recordId` 不动
- 入口按钮不动

## 验证
1. 管理员账号在用户抽屉点「下载 7 天伴随手册 PDF」
2. 新窗口打开 `/admin/handbook/{type}/{recordId}`
3. 顶部出现"7 天伴随手册"标题条 + 灰色"正在生成个性化心声…"
4. 10-20 秒后右上「下载 PDF」按钮可点
5. 点击后浏览器下载 `xxx_xxx_xxxxxxxx_yyyymmdd.pdf`
