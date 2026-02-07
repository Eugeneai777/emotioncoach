
## Problem

Comment section displays "用户" (User) for all non-anonymous comments instead of showing the commenter's actual nickname/display name and avatar. This is because `CommentSection.tsx` only queries the `post_comments` table and never fetches profile data.

Other components (like `CommunityWaterfall` and `PostDetailSheet`) already correctly fetch `display_name` and `avatar_url` from the `profiles` table.

## Solution

Update `CommentSection.tsx` to fetch commenter profile information (display name and avatar) from the `profiles` table, following the same pattern already used in `CommunityWaterfall.tsx`.

## Changes

### File: `src/components/community/CommentSection.tsx`

1. **Import `AvatarImage`**: Add it to the existing Avatar import so we can display actual user avatars.

2. **Add profile state**: Create a `Map<string, { display_name: string | null; avatar_url: string | null }>` to store commenter profiles.

3. **Fetch profiles after loading comments**: After comments are loaded, collect unique `user_id`s (excluding anonymous ones), then batch-query the `profiles` table for `id, display_name, avatar_url` — the same approach used in `CommunityWaterfall.tsx` (lines 342-354).

4. **Update display logic** (line 94): Change from:
   ```
   const displayName = comment.is_anonymous ? "匿名用户" : "用户";
   ```
   To:
   ```
   const profile = profiles.get(comment.user_id);
   const displayName = comment.is_anonymous
     ? "匿名用户"
     : (profile?.display_name || "用户" + comment.user_id.slice(0, 6));
   ```

5. **Show avatar image**: Add `<AvatarImage>` for non-anonymous comments that have an `avatar_url`, replacing the current fallback-only Avatar.

These changes are purely display-side and do not affect any comment submission, payment, or other business logic.
