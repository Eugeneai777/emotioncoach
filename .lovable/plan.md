

# 将所有6个人群入口页的左上角链接改为"主页"

## 现状

| 页面 | 当前文字 | 当前跳转 |
|------|---------|---------|
| MamaAssistant | 有劲生活馆 | `/` |
| WorkplacePage | 有劲生活馆 | `/` |
| UsAI | 有劲生活馆 | `/` |
| XiaojinHome | 亲子教练 | `/parent-coach` |
| ElderCarePage | 亲子教练 | `/parent-coach` |
| LaogeAI | 无顶部链接 | — |

## 改动

统一改为：🏠 图标 + "主页"文字，点击跳转 `/mini-app`（同时设置 `skip_preferred_redirect`，防止被自动重定向回来）。

| 文件 | 改动 |
|------|------|
| `src/pages/MamaAssistant.tsx` | 文字改"主页"，路由改 `/mini-app`，加 `skip_preferred_redirect` |
| `src/pages/WorkplacePage.tsx` | 同上 |
| `src/pages/UsAI.tsx` | 同上 |
| `src/pages/xiaojin/XiaojinHome.tsx` | 文字改"主页"，路由改 `/mini-app`，加 `skip_preferred_redirect` |
| `src/pages/ElderCarePage.tsx` | 同上 |
| `src/pages/LaogeAI.tsx` | 在 Hero 上方添加 top bar（与其他5个页面一致），包含"主页"链接和分享按钮，添加 `useNavigate` 导入 |

