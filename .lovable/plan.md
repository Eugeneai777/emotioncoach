

## Remove Product/Awakening Icons and Improve CoachHeader Spacing

### Problem
The CoachHeader navigation bar is too crowded, especially on mobile/tablet screens. The 产品中心 (ShoppingBag) and 觉醒日记 (Lightbulb) icon buttons take up space unnecessarily -- these features are already accessible via the hamburger menu.

### Solution

**File: `src/components/coach/CoachHeader.tsx`**

1. **Remove the "套餐 & 觉醒" icon group entirely** (lines 265-285)
   - Delete the entire `div` containing the ShoppingBag and Lightbulb buttons
   - These are redundant since both "产品中心" and "觉察" are already in the hamburger menu config

2. **Clean up unused imports**
   - Remove `ShoppingBag` and `Lightbulb` from the lucide-react import (line 3)

This frees up horizontal space in the header, giving the hamburger menu and coach space dropdown more breathing room.

### Technical Details

In `src/components/coach/CoachHeader.tsx`:
- Delete lines 265-285 (the `hidden md:flex` container with ShoppingBag and Lightbulb buttons)
- Update import on line 3 to remove `ShoppingBag` and `Lightbulb`

No other files need changes -- both routes (`/packages` and `/awakening`) remain accessible through the hamburger menu defined in `hamburgerMenuConfig.ts`.

