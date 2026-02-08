

## Fix: Page Stuck Without Vertical Scrolling After Share Dialog

### Root Cause

After opening and closing the share dialog (or the image preview), the page's scroll gets locked and never restored. This is caused by **Radix Dialog's scroll lock attribute (`data-scroll-locked`) being left on the body element** after the dialog closes.

The existing `ScrollUnlocker` in `App.tsx` only cleans up scroll locks on **route changes** -- it does not help when the user stays on the same page (`/wealth-block`).

The problem is made worse by the interaction between two overlapping scroll-lock mechanisms:
- **Radix Dialog** adds `data-scroll-locked` attribute and inline styles to body
- **ShareImagePreview** manually sets `document.body.style.overflow = 'hidden'`

When these two close in a staggered sequence (dialog closes first, then image preview closes), the cleanup from one can conflict with the other, leaving scroll permanently locked.

```text
Problem flow:
  Open share dialog --> Radix adds data-scroll-locked + overflow:hidden
  Click "分享" on iOS --> ShareImagePreview opens --> sets overflow:hidden again
                      --> Dialog closes (50ms delay) --> Radix tries cleanup
                      --> User closes preview --> restores overflow only
                      --> data-scroll-locked still on body!
                      --> Page cannot scroll
```

### Fix

#### 1. WealthInviteCardDialog: Clean up scroll locks when dialog closes

Add a `useEffect` that watches the `open` state. When the dialog closes, explicitly remove `data-scroll-locked` and clear any residual inline overflow styles from the body. This ensures cleanup regardless of how or why the dialog was closed.

**File:** `src/components/wealth-camp/WealthInviteCardDialog.tsx`

#### 2. ShareImagePreview: Comprehensive scroll lock cleanup on close

Currently the cleanup only sets `document.body.style.overflow = ''`. Enhance it to also remove the `data-scroll-locked` attribute and other position-related styles that Radix may have set, ensuring the page is fully scrollable again.

**File:** `src/components/ui/share-image-preview.tsx`

### Changes Summary

| File | Change |
|------|--------|
| `src/components/wealth-camp/WealthInviteCardDialog.tsx` | Add useEffect to clean scroll locks when dialog closes |
| `src/components/ui/share-image-preview.tsx` | Enhance cleanup to remove `data-scroll-locked` and all residual styles |

