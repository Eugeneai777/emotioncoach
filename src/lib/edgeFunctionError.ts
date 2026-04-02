/**
 * 从 Supabase Edge Function 调用结果中提取中文错误信息
 * 
 * 当 Edge Function 返回非 2xx 状态码时，SDK 会设置 error 为英文消息
 * "Edge Function returned a non-2xx status code"，而实际的中文错误
 * 信息在 error.context (Response) 或 data.error 中。
 * 
 * 用法：
 * const { data, error } = await supabase.functions.invoke('my-func', { body });
 * if (data?.error || error) {
 *   throw new Error(await extractEdgeFunctionError(data, error, '操作失败'));
 * }
 */

export async function extractEdgeFunctionError(
  data: any,
  error: any,
  fallback = '操作失败，请稍后重试'
): Promise<string> {
  // 1. 优先使用 data 中的业务错误（后端返回的中文信息）
  if (data?.error && typeof data.error === 'string') {
    return data.error;
  }

  // 2. 尝试从 error.context（Response 对象）读取后端返回的错误体
  if (error?.context && typeof error.context?.json === 'function') {
    try {
      const body = await error.context.json();
      if (body?.error && typeof body.error === 'string') {
        return body.error;
      }
    } catch {
      // context 可能已被消费，忽略
    }
  }

  // 3. 如果 error.message 不是 SDK 通用英文消息，使用它
  if (
    error?.message &&
    typeof error.message === 'string' &&
    !error.message.includes('Edge Function returned') &&
    !error.message.includes('non-2xx')
  ) {
    return error.message;
  }

  // 4. 兜底中文
  return fallback;
}
