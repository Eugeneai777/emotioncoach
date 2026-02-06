import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// 激活码字符集（排除易混淆字符：O/0, I/1/L）
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_PREFIX = 'WB-';
const CODE_LENGTH = 8;

// 生成单个激活码
function generateSingleCode(): string {
  let code = CODE_PREFIX;
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
}

// 批量生成唯一激活码
function generateUniqueCodes(count: number, existingCodes: Set<string>): string[] {
  const codes: string[] = [];
  const newCodes = new Set<string>();
  
  let attempts = 0;
  const maxAttempts = count * 10; // 防止无限循环
  
  while (codes.length < count && attempts < maxAttempts) {
    const code = generateSingleCode();
    if (!existingCodes.has(code) && !newCodes.has(code)) {
      codes.push(code);
      newCodes.add(code);
    }
    attempts++;
  }
  
  return codes;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 验证用户身份和权限
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: '未授权访问' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // 使用用户 token 验证身份
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error('[generate-activation-codes] Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: '未授权访问' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 使用 service role 检查管理员权限
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    if (!roleData) {
      console.error('[generate-activation-codes] User is not admin:', user.id);
      return new Response(
        JSON.stringify({ success: false, error: '需要管理员权限' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 解析请求参数
    const { count, batch_name, source_channel, expires_at } = await req.json();

    // 验证参数
    if (!count || count < 1 || count > 1000) {
      return new Response(
        JSON.stringify({ success: false, error: '生成数量必须在 1-1000 之间' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!batch_name || typeof batch_name !== 'string' || batch_name.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: '批次名称不能为空' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[generate-activation-codes] Generating ${count} codes for batch: ${batch_name}`);

    // 获取所有已存在的激活码
    const { data: existingData, error: fetchError } = await adminClient
      .from('wealth_assessment_activation_codes')
      .select('code');
    
    if (fetchError) {
      console.error('[generate-activation-codes] Fetch existing codes error:', fetchError);
      throw fetchError;
    }

    const existingCodes = new Set((existingData || []).map(d => d.code));
    
    // 生成唯一激活码
    const newCodes = generateUniqueCodes(count, existingCodes);
    
    if (newCodes.length < count) {
      console.warn(`[generate-activation-codes] Only generated ${newCodes.length}/${count} unique codes`);
    }

    // 准备插入数据
    const insertData = newCodes.map(code => ({
      code,
      batch_name: batch_name.trim(),
      source_channel: source_channel || null,
      expires_at: expires_at ? new Date(expires_at).toISOString() : null,
      is_used: false,
    }));

    // 批量插入数据库
    const { data: insertedData, error: insertError } = await adminClient
      .from('wealth_assessment_activation_codes')
      .insert(insertData)
      .select('code, batch_name, source_channel, expires_at');
    
    if (insertError) {
      console.error('[generate-activation-codes] Insert error:', insertError);
      throw insertError;
    }

    console.log(`[generate-activation-codes] Successfully inserted ${insertedData?.length} codes`);

    return new Response(
      JSON.stringify({
        success: true,
        codes: insertedData || [],
        count: insertedData?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[generate-activation-codes] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || '生成激活码失败' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
