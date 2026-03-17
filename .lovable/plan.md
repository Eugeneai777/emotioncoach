

## Plan: Optimize "My Page" — Modular Layout, Learning Center, About Us

### Problem Summary
1. Current vertical stacking feels cramped; doesn't scale for many orders/courses
2. "My Courses" needs to become "Learning & Growth Center" with sub-modules for assessments, training camps, and courses
3. "About Us" section is too hidden — users won't discover the system intro link

---

### Step 1: Restructure Page Layout with Clear Modular Cards

**File: `src/pages/MyPage.tsx`** — Full rewrite of page content

- **Account Info**: Keep as-is (top card, no changes needed)
- **Order Info**: Wrap in a "view all" expandable pattern — show latest 2 orders, with a "查看全部订单" button that expands or navigates. Each order card stays the same with tracking number support.
- **Settings**: Convert to a horizontal icon grid (2x2) instead of vertical list — more compact, visually distinct as a module card
- **About Us**: Promote from hidden accordion to a visible card at the bottom with a clear "系统介绍" button styled as a prominent entry point (icon + arrow), not buried in a collapsible

### Step 2: Replace "My Courses" with "学习与成长中心"

New section with three sub-modules displayed as tappable category cards in a horizontal row or grid:

1. **测评** (Assessments) — icon: `ClipboardCheck`, color: violet accent
2. **训练营** (Training Camps) — icon: `Flame`, color: amber accent  
3. **课程** (Courses) — icon: `BookOpen`, color: emerald accent

Each card shows:
- Category icon + title
- A count placeholder (e.g., "2项已完成")
- Tappable → navigates to the corresponding list/detail (static placeholder for now, routes like `/assessment-picker`, `/camps`, etc.)

This replaces the old tabs ("已学"/"未学") with a clearer category-first structure that scales better.

### Step 3: Improve "About Us" Visibility

Replace the `Accordion` with a visible card:
- Card with `Info` icon, title "关于我们", and a clear "了解系统介绍 →" button
- Styled with a subtle gradient background to draw attention
- Direct click navigates to `/awakening-system-intro` without needing to expand anything first

### Final Page Structure (top to bottom)
```text
┌──────────────────────┐
│  账号信息 (Card)      │
├──────────────────────┤
│  订单信息 (Card)      │
│  - Latest 2 orders   │
│  - "查看全部" link    │
├──────────────────────┤
│  学习与成长中心       │
│  ┌──────┬──────┬────┐│
│  │测评  │训练营│课程 ││
│  └──────┴──────┴────┘│
├──────────────────────┤
│  设置 (Card/List)     │
├──────────────────────┤
│  关于我们 (Visible)   │
│  → 系统介绍 button    │
└──────────────────────┘
```

### Files Changed
- `src/pages/MyPage.tsx` — Only file modified. No route changes, no business logic changes.

### Constraints
- Static UI only, placeholder data
- No changes to routing, payment flows, or other pages
- Visual style stays consistent with existing warm gradient theme

