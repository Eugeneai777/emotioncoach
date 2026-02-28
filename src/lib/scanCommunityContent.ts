/**
 * 社区内容风险扫描工具 - 在发帖/评论提交后异步调用 scan-risk-content
 * 不阻塞用户操作，后台静默扫描
 */

import { supabase } from "@/integrations/supabase/client";

interface ScanParams {
  content: string;
  userId: string;
  contentSource: 'community_post' | 'post_comment';
  sourceDetail?: string;
  sourceId?: string;
  page?: string;
}

/**
 * 异步扫描社区内容（不阻塞主流程）
 * 在帖子/评论成功插入后调用
 */
export function scanCommunityContent(params: ScanParams) {
  const { content, userId, contentSource, sourceDetail, sourceId, page } = params;

  // 内容太短不扫描
  if (!content || content.trim().length < 4) return;

  // 异步调用，不等待结果
  supabase.functions.invoke('scan-risk-content', {
    body: {
      content: content.trim(),
      user_id: userId,
      content_source: contentSource,
      source_detail: sourceDetail || (contentSource === 'community_post' ? '社区帖子' : '社区评论'),
      source_id: sourceId || `community_${Date.now()}`,
      platform: 'web',
      page: page || '/community',
    },
  }).then(({ error }) => {
    if (error) {
      console.warn('[scanCommunityContent] Risk scan failed:', error.message);
    }
  }).catch((e) => {
    console.warn('[scanCommunityContent] Risk scan error:', e);
  });
}
