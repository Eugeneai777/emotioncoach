
## Problem

"小为"(15228901521) sees a bloom partner invite code dialog when visiting the wealth camp page because:

1. The `BloomInvitePrompt` component is globally mounted in `App.tsx` and triggers for ALL logged-in users
2. The `check-pending-bloom-invite` edge function checks if there are ANY pending bloom invitations in the entire system (currently 4 exist)
3. Since 小为 is not a bloom partner, the system shows her the invite code prompt — even though none of the 4 pending invitations are actually for her

This is a false positive: the prompt should only appear for users who actually have a matching invitation.

## Solution

Update the `check-pending-bloom-invite` edge function to perform a **phone-number match** instead of a generic count. Only return `hasPending: true` if there is a pending bloom invitation whose phone number matches the current user's phone.

### Changes

**1. Edge function: `supabase/functions/check-pending-bloom-invite/index.ts`**

Replace the generic "count all pending invitations" query with logic that:
- Fetches the user's phone and country code from `profiles`
- If the user has no phone on file, return `hasPending: false`
- Query `partner_invitations` for pending bloom invitations and match by normalized phone + country code (reusing the same normalization logic from `auto-claim-bloom-invitation`)
- Only return `hasPending: true` if a match is found

**2. No frontend changes needed** — the `BloomInvitePrompt` component already handles `hasPending: false` correctly by not showing the dialog.

### Technical Detail

Current problematic query in the edge function:
```typescript
// BEFORE: checks if ANY pending bloom invitation exists globally
const { count } = await adminClient
  .from('partner_invitations')
  .select('id', { count: 'exact', head: true })
  .eq('status', 'pending')
  .eq('partner_type', 'bloom');
```

Will be replaced with phone-matched logic:
```typescript
// AFTER: only match invitations for this specific user's phone
const { data: profile } = await adminClient
  .from('profiles')
  .select('phone, phone_country_code')
  .eq('id', user.id)
  .maybeSingle();

if (!profile?.phone) {
  return { hasPending: false };
}

// Fetch pending bloom invitations and match by normalized phone
const { data: invitations } = await adminClient
  .from('partner_invitations')
  .select('invitee_phone, invitee_phone_country_code')
  .eq('status', 'pending')
  .eq('partner_type', 'bloom');

// Normalize and compare phone numbers (same logic as auto-claim)
const hasPending = invitations?.some(inv => /* phone match */);
```

This ensures only users with an actual pending invitation for their phone number will see the prompt.
