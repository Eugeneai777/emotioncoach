

# 全网去除新手引导方案

## 涉及的引导系统

应用中有 **3 套独立的新手引导系统**，需要全部移除：

### 1. GlobalOnboarding（全局弹窗引导）
- **文件**: `src/components/GlobalOnboarding.tsx`
- **调用位置**: `src/App.tsx` 第 240 行
- 进入应用时弹出的 3 步引导弹窗

### 2. PageTour（页面级引导）
- **组件**: `src/components/PageTour.tsx`
- **Hook**: `src/hooks/usePageTour.ts`
- **配置**: `src/config/pageTourConfig.ts`
- **使用页面**（共 13 个）：
  - `ParentCoach.tsx`
  - `Community.tsx`
  - `VibrantLifeHistory.tsx`
  - `HumanCoachDetail.tsx`
  - `HumanCoaches.tsx`
  - `BloomPartnerIntro.tsx`
  - `Packages.tsx`
  - `AliveCheck.tsx`
  - `EnergyStudio.tsx`
  - `GratitudeHistory.tsx`
  - 以及其他使用 `usePageTour` 的页面

### 3. WelcomeOnboarding（欢迎弹窗）
- **文件**: `src/components/WelcomeOnboarding.tsx`
- 需要查找其调用位置并移除

---

## 修改清单

### 第一步：移除 GlobalOnboarding
| 文件 | 操作 |
|------|------|
| `src/App.tsx` | 删除 `GlobalOnboarding` 的 import 和 `<GlobalOnboarding />` 渲染 |

### 第二步：移除所有 PageTour 引用（13+ 个页面）
在每个使用页面中：
- 删除 `import { PageTour }` 和 `import { usePageTour }` 和 `import { pageTourConfig }`
- 删除 `const { showTour, completeTour } = usePageTour(...)` 调用
- 删除 `<PageTour ... />` JSX 渲染

涉及页面：`ParentCoach`, `Community`, `VibrantLifeHistory`, `HumanCoachDetail`, `HumanCoaches`, `BloomPartnerIntro`, `Packages`, `AliveCheck`, `EnergyStudio`, `GratitudeHistory` 等

### 第三步：移除 WelcomeOnboarding 引用
- 找到调用 `WelcomeOnboarding` 的页面，删除相关引用

### 第四步：清理（可选但推荐）
以下文件不再被引用，可以保留但不会被使用：
- `src/components/GlobalOnboarding.tsx`
- `src/components/PageTour.tsx`
- `src/components/WelcomeOnboarding.tsx`
- `src/hooks/usePageTour.ts`
- `src/config/pageTourConfig.ts`

> 注意：`IntakeOnboardingDialog` 和 `ParentOnboardingGuide` 是业务功能组件（亲子问卷引导和训练营推荐），不属于"新手引导"范畴，将保留不动。

---

## 技术要点
- 纯删除操作，不涉及新增代码
- 不影响任何业务功能
- `page_tour_progress` 数据库表保留（历史数据），仅移除前端调用
