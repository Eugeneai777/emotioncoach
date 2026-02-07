

## Problem

The comment input box at the bottom of the post detail page is too small on mobile devices. It uses a single-line `<input type="text">` element squeezed alongside 4 action buttons (like, star, comment, share), with a hard width constraint of `max-w-[calc(100%-180px)]`. This makes it nearly impossible to see what you're typing on smaller screens.

## Solution

Redesign the bottom interaction bar to use a **two-row layout** on mobile: the input row on top, action buttons below. When the user taps the input, it expands into a multi-line `<textarea>` for better visibility. This follows the standard pattern used in WeChat Moments and similar social apps.

## Changes

### File: `src/components/community/PostDetailSheet.tsx` (lines 563-609)

**Current structure** (single row, everything cramped):
```text
[ input field (tiny) ] [send] [heart] [star] [chat] [share]
```

**New structure** (two rows on mobile):
```text
Row 1: [ expanded input field           ] [send]
Row 2: [heart] [star] [chat] [share]
```

Specific changes:

1. **Replace `<input type="text">` with `<textarea>`**: This allows multi-line input and auto-resizing so users can see what they type. Set `min-h-[44px]` and `max-h-[120px]` for touch-friendly sizing with a growth limit.

2. **Remove the cramped width constraint**: Remove `max-w-[calc(100%-180px)]` from the input container. Instead, use a flex column layout that gives the input the full width.

3. **Split into two rows**: Restructure the bottom bar into a vertical flex layout:
   - Top row: input + send button (full width)
   - Bottom row: action buttons (like, star, comment, share) evenly spaced

4. **Auto-resize textarea**: Add auto-height logic so the textarea grows as the user types (up to `max-h-[120px]`), similar to the pattern already used in `CoachInputFooter.tsx`.

5. **Set `font-size: 16px`**: Prevents iOS Safari from auto-zooming on focus (standard mobile UX practice already used elsewhere in the app).

---

### Technical Details

- The textarea will use `resize-none` to prevent manual resize handles, and will auto-grow via JS (`textarea.style.height = 'auto'; textarea.style.height = Math.min(scrollHeight, 120) + 'px'`).
- The bottom bar container changes from `flex items-center` (single row) to `flex flex-col` (stacked rows).
- Action buttons row uses `flex items-center justify-around` for even spacing.
- The `onKeyDown` handler will be updated to support Shift+Enter for new lines while Enter alone still sends.
- Touch targets remain at minimum 44px as per the existing app standard.

