

## Plan: Minimal View for Reminders & Notifications in Settings

Extend the existing `isProfileOnly` pattern to also support `view=reminders` and `view=notifications`.

### Changes in `src/pages/Settings.tsx`

1. Replace `isProfileOnly` with a more general `minimalView` check:
   ```ts
   const viewParam = searchParams.get("view");
   const isMinimalView = viewParam === "profile" || viewParam === "reminders" || viewParam === "notifications";
   ```

2. Map `viewParam` to the correct tab and title:
   - `view=profile` → tab `"profile"`, title `"个人资料"`
   - `view=reminders` → tab `"reminders"`, title `"提醒设置"`
   - `view=notifications` → tab `"notifications"`, title `"通知偏好"`

3. Replace all `isProfileOnly` references with `isMinimalView` (hide TabsList, hide logo, set title dynamically).

4. Set `defaultTab` based on `viewParam` when in minimal mode.

### Changes in `src/pages/MyPage.tsx`

Update the settings item routes:
- 提醒设置: `/settings?view=reminders` (was `/settings?tab=reminders`)
- 通知偏好: `/settings?view=notifications` (was `/settings?tab=notifications`)

### Files Changed
- `src/pages/Settings.tsx`
- `src/pages/MyPage.tsx`

