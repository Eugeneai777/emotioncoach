

## Simplify Share Card Generation and Sharing Flow

### Current Problems

The sharing system has **26+ share dialog components** with massive code duplication. Each dialog re-implements nearly identical logic for:

1. **State management**: `isGenerating`, `previewUrl`, `showPreview`, `copied` -- repeated in every dialog
2. **Image generation**: `generateCardBlob` / `generateCanvas` + `canvasToBlob` -- each dialog writes its own version
3. **Environment-aware sharing**: WeChat detection, native share fallback, image preview -- copy-pasted across 14+ files
4. **Copy link**: Clipboard API with toast feedback -- duplicated everywhere
5. **Scroll lock cleanup**: Each dialog needs its own cleanup logic
6. **Avatar proxy**: `getProxiedAvatarUrl` helper is copy-pasted into 4+ files

Meanwhile, there's already a `ShareDialogBase` component that handles all of this -- but **most dialogs don't use it**.

### Current Architecture (Fragmented)

```text
ShareDialogBase (unified, but only used by ~3 dialogs)
    |
    +-- handles generation, preview, copy, environment detection
    
Meanwhile, each legacy dialog does it all manually:
    AliveCheckShareDialog   -- 189 lines of boilerplate
    EmotionButtonShareDialog -- 189 lines of boilerplate  
    WealthJournalShareDialog -- 266 lines of boilerplate
    EmotionHealthShareDialog -- 140 lines of boilerplate
    GratitudeJournalShareDialog -- 263 lines of boilerplate
    WealthInviteCardDialog  -- 798 lines (complex multi-tab)
    ...and 10+ more
```

### Simplification Plan

#### Phase 1: Migrate Legacy Dialogs to ShareDialogBase

Refactor the following 5 highest-duplication dialogs to use `ShareDialogBase` instead of manually implementing generation/sharing logic. Each dialog shrinks from 150-250 lines to ~30-50 lines.

| Dialog | Before | After (est.) | Change |
|--------|--------|--------------|--------|
| `AliveCheckShareDialog` | 189 lines | ~40 lines | -79% |
| `EmotionButtonShareDialog` | 189 lines | ~40 lines | -79% |
| `EmotionHealthShareDialog` | 140 lines | ~35 lines | -75% |
| `WealthJournalShareDialog` | 266 lines | ~60 lines | -77% |
| `GratitudeJournalShareDialog` | 263 lines | ~55 lines | -79% |

**What each refactored dialog looks like:**

```tsx
// Before: 189 lines of boilerplate
// After: ~40 lines
const AliveCheckShareDialog = ({ open, onOpenChange, partnerCode }) => {
  const exportRef = useRef<HTMLDivElement>(null);
  const shareUrl = partnerCode
    ? `${getPromotionDomain()}/energy-studio?tool=alive-check&ref=${partnerCode}`
    : `${getPromotionDomain()}/energy-studio?tool=alive-check`;

  return (
    <ShareDialogBase
      open={open}
      onOpenChange={onOpenChange}
      title="生成分享卡片"
      shareUrl={shareUrl}
      fileName="alive-check-share.png"
      exportCardRef={exportRef}
      buttonGradient="bg-gradient-to-r from-rose-500 to-pink-500"
      previewCard={<AliveCheckShareCard partnerCode={partnerCode} />}
      exportCard={<AliveCheckShareCard ref={exportRef} partnerCode={partnerCode} />}
    />
  );
};
```

#### Phase 2: Consolidate Avatar Proxy Helper

The `getProxiedAvatarUrl` function is copy-pasted into 4+ files. It already exists in `src/utils/avatarUtils.ts`. Remove all local copies and import from the canonical location.

**Files affected:**
- `WealthJournalShareDialog.tsx` -- remove local copy, import from utils
- `WealthInviteCardDialog.tsx` -- remove local copy, import from utils
- `useOneClickShare.ts` -- remove local copy, import from utils

#### Phase 3: Enhance ShareDialogBase with Scroll Lock Cleanup

Add the scroll lock cleanup logic (from the previous fix) directly into `ShareDialogBase`, so no individual dialog needs to worry about it.

**File:** `src/components/ui/share-dialog-base.tsx`

Add:
```tsx
useEffect(() => {
  if (!open) {
    const timer = setTimeout(() => {
      document.body.removeAttribute('data-scroll-locked');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }, 100);
    return () => clearTimeout(timer);
  }
}, [open]);
```

### Files to Edit

| File | Action |
|------|--------|
| `src/components/tools/AliveCheckShareDialog.tsx` | Refactor to use ShareDialogBase |
| `src/components/tools/EmotionButtonShareDialog.tsx` | Refactor to use ShareDialogBase |
| `src/components/emotion-health/EmotionHealthShareDialog.tsx` | Refactor to use ShareDialogBase |
| `src/components/wealth-camp/WealthJournalShareDialog.tsx` | Refactor to use ShareDialogBase |
| `src/components/gratitude/GratitudeJournalShareDialog.tsx` | Refactor to use ShareDialogBase |
| `src/components/ui/share-dialog-base.tsx` | Add scroll lock cleanup |
| `src/hooks/useOneClickShare.ts` | Import avatarUtils instead of local copy |

### What We Are NOT Changing

- **WealthInviteCardDialog** (798 lines): This is a complex multi-tab dialog with 6 different card types, custom tab switching logic, and data fetching. It needs its own dedicated simplification effort and is out of scope for this round.
- **ShareDialogBase API**: No breaking changes to the existing component interface.
- **ShareCardBase / shareCardConfig**: The card rendering and canvas generation layer remains untouched.

### Expected Benefits

- ~700 lines of duplicated code removed
- Scroll lock bug fix automatically applied to all 5 refactored dialogs
- Future share dialogs take 30 lines instead of 190
- Single source of truth for generation, sharing, and environment detection logic

