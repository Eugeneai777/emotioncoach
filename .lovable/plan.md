

## Problem

Currently, clicking on a notification card body does nothing. Users must find and click the small "已读" button at the bottom to mark a notification as read. This is unintuitive -- most users expect tapping the notification itself to mark it as read.

## Solution

Make the entire `Card` component clickable. When a user taps/clicks anywhere on the notification card, it will be marked as read automatically. The card will also get a pointer cursor to signal interactivity.

## Changes

### File: `src/components/NotificationCard.tsx`

1. Add `onClick={handleMarkAsRead}` and `cursor-pointer` to the root `Card` element (line 149), so clicking anywhere on the card triggers the mark-as-read logic.
2. The existing "已读" button, delete button, and action button will continue to work as before (they already use `e.stopPropagation()` where needed).

### Technical Detail

```text
Before:
  <Card className="...">        <-- not clickable

After:
  <Card className="... cursor-pointer" onClick={handleMarkAsRead}>   <-- entire card is clickable
```

The `handleMarkAsRead` function already exists (line 136) and calls `onClick()` which maps to `markAsRead(notificationId)` in the parent. No new functions or hooks are needed.

Since the delete button's handler already calls `e.stopPropagation()`, clicking delete will not accidentally trigger mark-as-read.

