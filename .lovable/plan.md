

## Optimize /courses Page for Mobile

### Problems Identified
1. **Header too tall** -- `py-6` padding plus large `text-2xl` title and subtitle wastes vertical space
2. **Category filters overflow** -- 5 buttons wrapping onto 3 rows, each with a BookOpen icon and Badge, consuming ~150px of screen height
3. **Excessive margins** -- `mb-8` on tabs and category section, `mb-6` on search, `py-8` on main content
4. **Course cards too verbose** -- Large padding, oversized buttons, and decorative elements

### Solution

**File: `src/pages/Courses.tsx`**

1. **Compact header**
   - Reduce padding from `py-6` to `py-3`
   - Reduce title from `text-2xl sm:text-3xl` to `text-xl`
   - Remove subtitle text on mobile (keep on sm+)
   - Remove the empty spacer div (`w-[80px]`)

2. **Streamline category filters**
   - Remove the `BookOpen` icon from each filter button (redundant)
   - Use smaller, more compact pill-style buttons
   - Reduce gap and margins (`mb-8` to `mb-4`, `gap-2` to `gap-1.5`)

3. **Tighten spacing throughout**
   - Main content padding: `py-8` to `py-4`
   - Tab list margin: `mb-8` to `mb-4`
   - Search margin: `mb-6` to `mb-4`

4. **Compact course cards**
   - Reduce card title from `text-lg` to `text-base`
   - Limit description to 2 lines on mobile
   - Remove source text on mobile to save space

### Technical Details

All changes are in `src/pages/Courses.tsx`:

**Header** (lines 230-261): Reduce padding, title size, hide subtitle on mobile, remove spacer div.

**Tabs** (line 266): Change `mb-8` to `mb-4`.

**Search** (line 283): Change `mb-6` to `mb-4`.

**Category filters** (lines 294-310): Remove `BookOpen` icons, change `mb-8` to `mb-4`, `gap-2` to `gap-1.5`.

**Main content** (line 264): Change `py-8` to `py-4`.

**Course cards** (lines 324-396): Reduce title size, tighten description clamp.

