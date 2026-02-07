

## Problem

The comment count in the bottom bar always shows "0" even when comments exist. Two root causes:

1. **Database out of sync**: The `comments_count` column in the `community_posts` table is `0` for this post, yet there is 1 actual comment in the `post_comments` table. The update logic after submitting a comment uses the stale prop value `(post.comments_count || 0) + 1`, which can produce incorrect counts.

2. **No local state tracking**: `PostDetailSheet` displays `post.comments_count` directly from the prop (which never changes after the sheet opens). Even after a user submits a new comment and the DB is updated, the displayed count stays at whatever value was passed in.

## Solution

### 1. Add local `commentsCount` state in `PostDetailSheet.tsx`

- Create a `commentsCount` state initialized from `post.comments_count`
- After a successful comment submission, increment the local state
- Display the local state value instead of the prop in the bottom bar
- Sync the state when the `post` prop changes

### 2. Fix the DB update to use actual count

- After inserting a comment, query the real count from `post_comments` table and update `community_posts.comments_count` with the accurate value (instead of relying on the potentially stale prop)

### 3. Fix the existing stale data

- Run a one-time SQL migration to sync `comments_count` for all posts based on the actual count in the `post_comments` table

---

## Technical Details

### File: `src/components/community/PostDetailSheet.tsx`

**Add state** (near line 72):
```typescript
const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
```

**Sync state when post changes** (add useEffect):
```typescript
useEffect(() => {
  setCommentsCount(post.comments_count || 0);
}, [post.comments_count]);
```

**Fix comment submission** (lines 347-350): Replace the stale prop-based update with an actual count query:
```typescript
// Query actual comment count
const { count } = await supabase
  .from("post_comments")
  .select("*", { count: "exact", head: true })
  .eq("post_id", post.id);

await supabase.from("community_posts").update({
  comments_count: count || 0
}).eq("id", post.id);

setCommentsCount(count || 0);
```

**Update display** (line 644): Change from `post.comments_count || 0` to `commentsCount`.

### Database Migration

Sync all existing posts' `comments_count` with the actual count:
```sql
UPDATE community_posts cp
SET comments_count = (
  SELECT COUNT(*)
  FROM post_comments pc
  WHERE pc.post_id = cp.id
);
```

