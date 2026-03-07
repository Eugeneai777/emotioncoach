

## Problem Analysis

The team member name shows "未设置" because the edge function `manage-partner-team` queries a **`nickname` column that doesn't exist** in the `profiles` table. The database query fails silently (returns null profiles), so the fallback "未设置" is displayed.

The user `炯谦` has `display_name = '炯谦'` and `phone = '18898593978'` in the profiles table, but the query never succeeds due to the invalid column reference.

## Fix

**File: `supabase/functions/manage-partner-team/index.ts`**

Two changes needed:

1. **Line 92 (list action)**: Remove `nickname` from the select query
   - Change: `"id, display_name, nickname, phone"` → `"id, display_name, phone"`

2. **Line 99**: Remove `nickname` fallback
   - Change: `profile?.display_name || profile?.nickname || "未设置"` → `profile?.display_name || "未设置"`

3. **Line 126 (add action)**: Same fix for the add action's profile query
   - Change: `"id, display_name, nickname, phone"` → `"id, display_name, phone"`

4. **Line 148**: Remove `nickname` fallback in success message
   - Change: `profiles[0].display_name || profiles[0].nickname || phone` → `profiles[0].display_name || phone`

