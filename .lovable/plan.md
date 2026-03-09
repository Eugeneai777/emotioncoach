

# 去除 MamaHero 顶部问候区域

移除 `/mama` 页面顶部的"嘿，妈妈 / 今天辛苦了"问候区域及其场景按钮。

### 改动

| 文件 | 改动 |
|------|------|
| `src/pages/MamaAssistant.tsx` | 删除 `MamaHero` 的 import 和使用 |
| `src/components/mama/MamaHero.tsx` | 删除整个文件 |

页面将从 PageHeader 直接进入能量检测等功能模块。

