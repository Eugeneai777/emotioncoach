

## Plan: Restructure Bottom Nav + Create "My Page"

### Overview
1. **Modify `AwakeningBottomNav.tsx`**: Replace left "介绍" button with "我的" button pointing to `/my-page`
2. **Create new `/my-page` route and page component**: Static UI with 4 modules + collapsed "介绍" link at bottom
3. **Register route in `App.tsx`**

---

### Step 1: Modify `AwakeningBottomNav.tsx`

- Replace the left button (lines 167-175):
  - Icon: `User` (already imported) instead of `Info`
  - Label: "我的" instead of "介绍"
  - Route: `/my-page` instead of `/awakening-system-intro`
- Final nav order: **【我的】—【开始对话】—【快捷】**

### Step 2: Create `src/pages/MyPage.tsx`

Static UI page with four card-based modules:

1. **账号信息** — Avatar placeholder, nickname, phone number, membership status badge
2. **订单信息** — Order list cards with status badges, each card has a dedicated "物流单号：XXXXXXX" field for shipping tracking
3. **我的课程** — Two tabs: "已学" / "未学", course card placeholders
4. **设置** — Settings list items (notification, privacy, etc.)

Below the 4 modules:
- Collapsible "关于我们" section (using existing Collapsible or Accordion component) containing a link to `/awakening-system-intro` and any other intro content — visually secondary

The page will include `AwakeningBottomNav` at the bottom for consistent navigation.

### Step 3: Register Route in `App.tsx`

- Import `MyPage` and add `<Route path="/my-page" element={<MyPage />} />`

### Constraints
- No changes to payment flows, existing routing logic, or data fetching
- Static UI only — placeholder data, no API calls
- Visual style consistent with existing warm gradient aesthetic

