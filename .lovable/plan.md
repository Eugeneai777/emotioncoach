

## Plan: Fix MyPage — Profile-only Settings, Learning Center, Settings Module

### Changes Overview

Three issues to fix, all in `src/pages/MyPage.tsx` and `src/pages/Settings.tsx`:

---

### Step 1: Account Info → Profile-only Settings Page

**Problem**: Clicking the account card opens `/settings` which shows all 4 tabs (个人资料, 账户, 提醒设置, 通知偏好) plus "设置" title and logo — user only needs profile editing.

**Solution**: Navigate to `/settings?tab=profile&minimal=true` from MyPage. In `Settings.tsx`:
- When `searchParams` has `minimal=true`, hide the TabsList entirely and only render the `profile` tab content
- Hide the PageHeader title text ("设置" → empty or "个人资料")
- Hide the logo icon in PageHeader by passing a prop or conditionally rendering

Alternatively, simpler approach: Add a query param `?view=profile` and in Settings.tsx, when `view=profile`, render only the profile TabsContent without the tab bar, and set PageHeader title to "个人资料" with no logo.

**File: `src/pages/Settings.tsx`**:
- Check for `searchParams.get('view') === 'profile'`
- When true: skip TabsList, only render profile content, set title to "个人资料", pass `showLogo={false}` or similar

**File: `src/pages/MyPage.tsx`**:
- Change account card `onClick` from `navigate("/settings")` to `navigate("/settings?view=profile")`

---

### Step 2: Settings Module — Add Reminders & Notifications, Remove Help/Privacy

**File: `src/pages/MyPage.tsx`**:

Update `SETTINGS_ITEMS` array:
- Add: `{ icon: Bell, label: "提醒设置", route: "/settings?tab=reminders" }`
- Add: `{ icon: MessageSquare, label: "通知偏好", route: "/settings?tab=notifications" }`
- Remove: "隐私安全" and "帮助反馈"
- Keep: "退出登录"

Final settings grid (2x2):
| 提醒设置 | 通知偏好 |
| 退出登录 | (empty or remove grid, use 3-col) |

Actually 3 items → use a single column list or 3-col grid. A vertical list with dividers would be cleaner for 3 items.

Update `handleSettingsClick`:
- "提醒设置" → `navigate("/settings?tab=reminders")`
- "通知偏好" → `navigate("/settings?tab=notifications")`

---

### Step 3: Learning Center — Show User's Purchased/Completed Content

**Problem**: The current routes (`/assessment-picker`, `/camps`, `/courses`) show generic catalogs, not filtered to user's purchases.

**Solution**: The existing pages already show user-specific data to some degree (AssessmentPicker shows completion status, Courses has a "personal" tab, CampList shows available camps). The issue is these pages show ALL items, not just the user's purchased ones.

Best approach for static UI improvement: Add query params to filter by "my" content:
- 测评: Navigate to `/assessment-picker` — this page already shows completion badges. No change needed here, it works.
- 训练营: Navigate to `/camps` — already shows user's camps.  
- 课程: Navigate to `/courses` — change to start on the "personal" tab by default: `/courses?tab=personal`

If these pages don't filter by user purchases, the real fix is on those pages. But per the plan constraints, we keep it to MyPage routing. The most impactful fix is ensuring the routes are correct and pass the right default view.

---

### Step 4: PageHeader cleanup for profile view

**File: `src/pages/Settings.tsx`**:
- When `view=profile`: use `<PageHeader title="个人资料" />` instead of `<PageHeader title="设置" />`
- The logo is part of PageHeader and always shows — to hide it, we can pass a new prop `showLogo={false}` to PageHeader

**File: `src/components/PageHeader.tsx`**:
- Add optional `showLogo?: boolean` prop (default `true`)
- Conditionally render the logo image based on this prop

---

### Files Changed
1. `src/pages/MyPage.tsx` — Update account card route, settings items, learning center routes
2. `src/pages/Settings.tsx` — Add `view=profile` mode that hides tabs and shows only profile content
3. `src/components/PageHeader.tsx` — Add `showLogo` prop to optionally hide logo

### Constraints
- No changes to payment flows, business logic, or data fetching
- Existing Settings page functionality preserved (direct `/settings` access still works normally)

