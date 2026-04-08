import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Verify admin role from JWT */
async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const adminClient = createClient(supabaseUrl, serviceKey);

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await adminClient.auth.getUser(token);
  if (error || !user) return null;

  const { data: roles } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .limit(1);

  if (!roles || roles.length === 0) return null;
  return { user, adminClient };
}

/** Call MCP Server tool */
async function callMcpTool(toolName: string, args: Record<string, unknown>) {
  const mcpUrl = Deno.env.get('XHS_MCP_SERVER_URL');
  const mcpKey = Deno.env.get('XHS_MCP_API_KEY');

  if (!mcpUrl) {
    throw new Error('XHS_MCP_SERVER_URL 未配置，请先部署 MCP Server 并配置密钥');
  }

  const body = {
    jsonrpc: '2.0',
    id: crypto.randomUUID(),
    method: 'tools/call',
    params: { name: toolName, arguments: args },
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
  };
  if (mcpKey) {
    headers['X-API-Key'] = mcpKey;
  }

  const resp = await fetch(mcpUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`MCP Server 响应错误 (${resp.status}): ${text}`);
  }

  const contentType = resp.headers.get('content-type') ?? '';

  // Handle SSE response
  if (contentType.includes('text/event-stream')) {
    const text = await resp.text();
    const lines = text.split('\n');
    let lastData = '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        lastData = line.slice(6);
      }
    }
    if (lastData) {
      return JSON.parse(lastData);
    }
    throw new Error('SSE 响应中没有找到数据');
  }

  return await resp.json();
}

/** Extract text content from MCP result */
function extractContent(mcpResult: any): any {
  if (mcpResult?.result?.content) {
    const textParts = mcpResult.result.content
      .filter((c: any) => c.type === 'text')
      .map((c: any) => c.text);
    
    // Try to parse as JSON
    const combined = textParts.join('\n');
    try {
      return JSON.parse(combined);
    } catch {
      return combined;
    }
  }
  return mcpResult;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const auth = await verifyAdmin(req);
    if (!auth) {
      return jsonResponse({ error: '需要管理员权限' }, 401);
    }

    const { action, keyword, note_id, limit = 20 } = await req.json();
    const { adminClient } = auth;

    switch (action) {
      case 'search': {
        if (!keyword || typeof keyword !== 'string') {
          return jsonResponse({ error: '请输入搜索关键词' }, 400);
        }

        // Check cache first
        const { data: cached } = await adminClient
          .from('xhs_search_cache')
          .select('results, cached_at')
          .eq('keyword', keyword.trim())
          .gt('expires_at', new Date().toISOString())
          .order('cached_at', { ascending: false })
          .limit(1)
          .single();

        if (cached) {
          return jsonResponse({
            success: true,
            data: cached.results,
            cached: true,
            cached_at: cached.cached_at,
          });
        }

        // Call MCP Server
        const mcpResult = await callMcpTool('search_notes', {
          keyword: keyword.trim(),
          limit: Math.min(limit, 50),
        });

        const results = extractContent(mcpResult);

        // Cache results
        await adminClient.from('xhs_search_cache').insert({
          keyword: keyword.trim(),
          results,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });

        return jsonResponse({ success: true, data: results, cached: false });
      }

      case 'detail': {
        if (!note_id || typeof note_id !== 'string') {
          return jsonResponse({ error: '请提供笔记 ID' }, 400);
        }

        const mcpResult = await callMcpTool('get_note', { note_id });
        const detail = extractContent(mcpResult);

        return jsonResponse({ success: true, data: detail });
      }

      case 'status': {
        // Check if MCP server is configured and reachable
        const mcpUrl = Deno.env.get('XHS_MCP_SERVER_URL');
        if (!mcpUrl) {
          return jsonResponse({
            success: true,
            configured: false,
            message: 'MCP Server 尚未配置',
          });
        }

        try {
          // Try a simple ping via MCP initialize
          const resp = await fetch(mcpUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json, text/event-stream',
              ...(Deno.env.get('XHS_MCP_API_KEY') ? { 'X-API-Key': Deno.env.get('XHS_MCP_API_KEY')! } : {}),
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: '1',
              method: 'initialize',
              params: {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: { name: 'xhs-proxy', version: '1.0.0' },
              },
            }),
          });

          return jsonResponse({
            success: true,
            configured: true,
            reachable: resp.ok,
            status: resp.status,
          });
        } catch (e) {
          return jsonResponse({
            success: true,
            configured: true,
            reachable: false,
            error: e.message,
          });
        }
      }

      default:
        return jsonResponse({ error: `未知操作: ${action}` }, 400);
    }
  } catch (error) {
    console.error('[xhs-mcp-proxy] Error:', error);
    return jsonResponse({ error: error.message || '服务器内部错误' }, 500);
  }
});
