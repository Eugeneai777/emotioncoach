

## Problem Analysis

After examining the code, I found **two critical bugs** in `CampList.tsx` and `CampTemplateCard.tsx`:

### Bug 1: Payment success callback does nothing useful
In `CampList.tsx` (line 298-301), the `onSuccess` handler only shows a toast and closes the dialog. It does NOT:
- Create a `user_camp_purchases` record in the database
- Navigate the user to the camp setup flow
- Show a "choose start date" dialog
- Invalidate/refresh any queries so the UI updates

### Bug 2: Card never checks purchase status
`CampTemplateCard.tsx` determines whether to show "购买" based solely on `isPaidCamp = camp.price > 0`. It never queries whether the current user has already purchased, so the button always shows "购买" even after a successful payment.

---

## Fix Plan

### 1. Fix `CampTemplateCard.tsx` — Add purchase status check
- Query `user_camp_purchases` for the current user + camp_type
- If purchased, show "开始训练" or "继续训练" button instead of "购买" button
- Navigate to `/camp-intro/${camp.camp_type}` (or directly to start dialog) when clicked

### 2. Fix `CampList.tsx` — Complete the `onSuccess` handler
- After payment success, insert a `user_camp_purchases` record (with try/catch for idempotency)
- Invalidate the purchase query so the card updates immediately
- Navigate user to the camp intro page where they can select a start date, OR show a `StartCampDialog` directly

### 3. Fix package key format
- Currently using `camp-${selectedCamp.id}` (template UUID) — verify this matches backend order creation expectations (should likely be `camp-${selectedCamp.camp_type}`)

