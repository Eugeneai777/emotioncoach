

## Add Source Filter to /courses Page

### Problem
Users cannot filter courses by source ("有劲365" vs "绽放公开课"). Currently only category filters (领导力, 个人成长, etc.) exist, making it hard to find all videos from a specific series.

### Solution
Add a source filter row above the category filters, allowing users to quickly switch between "全部来源", "有劲365 (253)", and "绽放公开课 (105)".

### Changes

**File: `src/pages/Courses.tsx`**

1. **Add source filter state**
   - New state: `activeSource` (default: `"all"`)

2. **Compute source stats** from courses data (similar to how `categoryStats` works)

3. **Add source filter buttons** above the existing category filter row
   - Compact pill-style buttons matching the existing category filter design
   - Buttons: "全部来源 (358)" | "有劲365 (253)" | "绽放公开课 (105)"

4. **Update filtering logic** to also filter by `course.source` when a source is selected

5. **Update category counts** to reflect the source filter -- so when "有劲365" is selected, category counts update accordingly (e.g., 领导力 might show 200 instead of 260)

### Layout (mobile)
```text
[全部来源 358] [有劲365 253] [绽放公开课 105]    <-- new row
[全部 253] [个人成长 20] [人际关系 15] ...        <-- existing, counts update
```

### Technical Details

In `src/pages/Courses.tsx`:

- Add `const [activeSource, setActiveSource] = useState("all")` around line 43
- Compute `sourceStats` from `courses` (similar to `categoryStats` on lines 76-80)
- Add source filter before category filter (before line 293), reset `activeCategory` to "all" when source changes
- Update `filteredCourses` (line 83) to add: `if (activeSource !== "all" && course.source !== activeSource) return false`
- Make `categoryStats` computed from source-filtered courses so counts stay accurate

No database or backend changes needed.

