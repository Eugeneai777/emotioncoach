

## Plan: Wire Up "My Page" Interactive Features

### Problem Summary
Four issues with the current static-only MyPage:
1. Account info card is display-only — no way to edit profile (name, avatar, phone, password)
2. Order cards missing price
3. Learning center cards link to generic list pages, not user's purchased/completed items
4. Settings buttons have no click handlers (no navigation, no logout)

---

### Step 1: Make Account Info Card Editable

**File: `src/pages/MyPage.tsx`**

- Add a `ChevronRight` arrow on the account info card
- Wrap the entire card in an `onClick` that navigates to `/settings` (the existing Settings page already has profile editing: avatar uploader, display name, phone manager, account credentials/password)
- Load real user data: use `useAuth()` hook to get the user, then query `profiles` table for `display_name`, `avatar_url`, `phone`
- Display actual avatar (via `AvatarImage`), real nickname, and masked phone number
- Show membership status by querying orders for a paid membership record

### Step 2: Add Price to Order Cards

**File: `src/pages/MyPage.tsx`**

- Update mock order data structure to include `amount` field (e.g., `amount: 299`)
- Display price in each order card row (e.g., "¥299.00") next to the product name or in the detail line
- Later when wired to real data, this maps directly to `orders.amount`

### Step 3: Fix Learning Center Navigation

**File: `src/pages/MyPage.tsx`**

Update the three module routes to point to pages that show the user's own purchased/completed content:

| Module | Current Route | New Route | Rationale |
|--------|--------------|-----------|-----------|
| 测评 | `/assessment-picker` | `/assessment-picker` | Keep — this page already lists assessments the user can access |
| 训练营 | `/camps` | `/camps` | Keep — the CampList page already shows user's camps |
| 课程 | `/video-courses` | `/courses` | Fix — `/video-courses` doesn't exist as a route; `/courses` is the actual registered route (Courses page) |

The key fix is changing the course route from the non-existent `/video-courses` to `/courses`.

### Step 4: Wire Up Settings Actions

**File: `src/pages/MyPage.tsx`**

Add `route` and `action` properties to each settings item:

| Item | Action |
|------|--------|
| 通知设置 | `navigate('/settings')` (Settings page has notification tab) |
| 隐私安全 | `navigate('/privacy')` (existing Privacy Policy page) |
| 帮助反馈 | `navigate('/customer-support')` (existing Customer Support page) |
| 退出登录 | Call `signOut()` from `useAuth()` hook, then `navigate('/auth')` |

Import `useAuth` hook and wire the logout item with a confirmation dialog or direct sign-out.

---

### Files Changed
- `src/pages/MyPage.tsx` — All four fixes in this single file

### Constraints
- No changes to existing pages, routes, payment flows, or business logic
- Uses existing routes and components (Settings, Privacy, CustomerSupport, Courses)
- Account data loading uses existing `useAuth` + `supabase.from('profiles')` pattern

