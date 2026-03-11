

## Plan: Add Gratitude Records Button to MamaAIChat

Based on the screenshot, the user is viewing the MamaAIChat sheet (AI妈妈教练) and wants a button to navigate to the gratitude journal history.

### Changes

**1. `src/components/mama/MamaAIChat.tsx`**
- Add a "📔 感恩记录" button in the SheetHeader area (next to the title)
- On click, close the chat sheet and navigate to `/gratitude-journal` (the GratitudeHistory page which shows all gratitude entries)
- Use `useNavigate` from react-router-dom
- Style: small outlined button matching the warm theme, placed on the right side of the header

### Implementation Detail
```tsx
// In SheetHeader, add a button beside the title
<SheetHeader className="px-4 pt-4 pb-2.5 border-b border-[#F5E6D3] shrink-0">
  <div className="flex items-center justify-between">
    <SheetTitle className="text-[#3D3028] text-base">💛 AI妈妈教练</SheetTitle>
    <button
      onClick={() => { onOpenChange(false); navigate("/gratitude-journal"); }}
      className="text-xs px-3 py-1.5 rounded-full border border-[#F4845F]/30 text-[#F4845F] bg-[#FFF3EB] hover:bg-[#FFE8D6] transition-colors"
    >
      📔 感恩记录
    </button>
  </div>
</SheetHeader>
```

This routes to `/gratitude-journal` which renders `GratitudeHistory` -- the existing page that displays all saved gratitude entries from the `gratitude_entries` table.

