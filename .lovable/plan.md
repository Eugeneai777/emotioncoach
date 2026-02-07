

## Problem

When someone comments on a post, the post author does not receive any notification. They have no way to know someone commented unless they manually open the post again.

## Solution

After a comment is successfully submitted, automatically send an in-app notification to the post author using the existing `smart_notifications` system. The notification will tell them who commented and on which post, with a link to view the comment.

Key rules:
- Do NOT notify the author if they are commenting on their own post
- Do NOT notify if the post is anonymous (to protect commenter identity consistency)
- Use the existing `smart_notifications` table for delivery, which already supports real-time push via Supabase Realtime (the author will see it instantly in the notification bell)

## Changes

### File: `src/components/community/PostDetailSheet.tsx`

After the comment is successfully inserted (around line 365, after `toast.success("评论成功")`), add logic to send a notification to the post author:

1. **Skip if self-comment**: If `session.user.id === post.user_id`, do not send a notification.
2. **Insert notification directly** into the `smart_notifications` table with:
   - `user_id`: the post author's ID (`post.user_id`)
   - `notification_type`: `"community"`
   - `scenario`: `"new_comment"`
   - `title`: "你的帖子收到了新评论"
   - `message`: The first 50 characters of the comment content
   - `icon`: "message-circle"
   - `action_type`: `"navigate"`
   - `action_data`: `{ post_id: post.id }` (for future "tap to view" functionality)
   - `priority`: 3

This approach is lightweight (a single DB insert) and avoids calling the AI notification edge function, which would be overkill for a simple "someone commented" alert. The existing real-time subscription in `useSmartNotification` will automatically push the notification to the post author's UI.

---

### Technical Details

The notification insert will be wrapped in a try-catch so that any failure does not block the comment submission flow. It runs after the comment is confirmed saved.

```typescript
// After toast.success("评论成功")
// Send notification to post author (skip if self-comment)
if (session.user.id !== post.user_id) {
  try {
    // Get commenter's display name
    const { data: commenterProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", session.user.id)
      .single();

    const commenterName = commenterProfile?.display_name || "有人";

    await supabase.from("smart_notifications").insert({
      user_id: post.user_id,
      notification_type: "community",
      scenario: "new_comment",
      title: `${commenterName}评论了你的帖子`,
      message: newComment.trim().substring(0, 80),
      icon: "message-circle",
      action_type: "navigate",
      action_data: { post_id: post.id },
      priority: 3,
    });
  } catch (notifError) {
    console.error("发送评论通知失败:", notifError);
    // Non-blocking: don't affect the comment flow
  }
}
```

No new files, edge functions, or database migrations are needed -- the existing `smart_notifications` table and real-time infrastructure handle everything.

