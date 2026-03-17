

## Plan: Fix First Login Default Redirect to /mini-app

**Problem**: New users after first login get redirected to `/coach/vibrant_life_sage` instead of `/mini-app`. This happens because:
1. `Auth.tsx` (line 241): When no `preferred_coach` is set, redirects to `"/"` 
2. `SmartHomeRedirect.tsx` (line 7/90): The `"/"` route resolves to `DEFAULT_COACH = "/coach/vibrant_life_sage"` for users without a preferred coach

**Fix**: Change the default fallback to `/mini-app` in both files.

### Changes

**1. `src/pages/Auth.tsx`** (line 241)
- Change `targetRedirect = "/"` → `targetRedirect = "/mini-app"` in the else branch (no preferred_coach)

**2. `src/pages/SmartHomeRedirect.tsx`** (lines 7, 90, 94)
- Change `DEFAULT_COACH` from `"/coach/vibrant_life_sage"` to `"/mini-app"`
- This ensures all fallback paths (no user, no preferred_coach, errors) go to the portal

This ensures first-time users and users without a coach preference always land on the main portal `/mini-app`.

