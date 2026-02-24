

## Optimize Coach Space Mobile Layout

### Problem
The Coach Space page header is overcrowded on mobile:
- **Left side**: Logo + Back button + Home button (3 elements)
- **Center**: Title "教练空间"
- **Right side**: HelpTooltip + Info button + Bell button (3 elements)

This causes icons to overlap and squeeze together on small screens.

### Solution

**1. Simplify the header actions in `CoachSpace.tsx`**
- Remove the redundant `HelpTooltip` button (its functionality overlaps with the Info button)
- Remove the `showHomeButton` prop (the logo already navigates home, and there's a back button)
- Keep only the Bell (notifications) button as the right action

**2. Clean up the welcome section in `CoachSpace.tsx`**
- Reduce vertical padding on the welcome text area to make more room for content
- Tighten spacing between sections

### Files to Modify

**`src/pages/CoachSpace.tsx`**
- Remove `HelpTooltip` import and usage from `rightActions`
- Remove `Info` button from `rightActions` (or keep only one of Info/HelpTooltip)
- Remove `showHomeButton` prop from `PageHeader`
- Reduce `py-4` to `py-3` on the welcome section
- Keep the layout clean with only essential actions

### Technical Details

Changes to `CoachSpace.tsx` header section:
```tsx
<PageHeader
  title="教练空间"
  rightActions={
    <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')}>
      <Bell className="w-5 h-5" />
    </Button>
  }
/>
```

Remove unused imports: `Info`, `HelpTooltip`.

This reduces the header from 6 elements to 4 (logo, back, title, bell), giving each element proper spacing on mobile.

