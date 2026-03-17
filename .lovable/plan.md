

## Plan: Fix Settings Item Text Truncation on Small Screens

**Problem**: The 3-column grid with `truncate` on the label text causes "提醒..." / "通知..." / "退出..." on small screens (WeChat mini program).

**Solution**: Two changes in `src/pages/MyPage.tsx` (lines 284-300):

1. **Remove `truncate`** from the `<span>` (line 297) — allow text to wrap or display fully
2. **Change layout** from horizontal `flex items-center gap-2.5` to vertical `flex flex-col items-center` so icon sits above text, giving more horizontal space for the label
3. **Reduce text size** to `text-xs` to ensure it fits

This matches the visual pattern already used in the "学习与成长中心" grid (icon on top, label below), creating a consistent UI.

**File**: `src/pages/MyPage.tsx` (lines 287-298)

