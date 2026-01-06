import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action_text, reflection, difficulty, action_type = 'giving', journal_id, camp_id } = await req.json()

    if (!action_text) {
      return new Response(
        JSON.stringify({ error: 'action_text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user from auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call AI to generate witness statement
    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY not configured')
    }

    const systemPrompt = `你是一位财富心理见证专家。你的任务是为用户的给予行动生成"AI见证语"。

见证语的特点：
1. 简洁有力，2-3句话
2. 确认并命名用户的行为转变
3. 用"心穷→心富"、"匮乏→丰盛"、"恐惧→信任"等框架描述行为跃迁
4. 让用户感到被看见、被确认

行为跃迁类型说明：
- 心穷→心富：从索取心态转向给予心态
- 匮乏→丰盛：从稀缺思维转向丰盛思维  
- 恐惧→信任：从控制需求转向信任放手
- 封闭→开放：从自我保护转向敞开接纳
- 条件→无条件：从交换逻辑转向纯粹给予

你必须返回以下JSON格式：
{
  "ai_witness": "见证语内容",
  "transition_label": "心穷→心富" 或 "匮乏→丰盛" 或其他跃迁类型
}`

    const userMessage = `用户完成了以下给予行动：

行动内容：${action_text}
${reflection ? `用户反思：${reflection}` : ''}
${difficulty ? `执行难度：${difficulty}/5` : ''}

请生成见证语和行为跃迁标签。`

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI API error:', errorText)
      throw new Error(`AI API error: ${response.status}`)
    }

    const aiResponse = await response.json()
    const content = aiResponse.choices?.[0]?.message?.content || ''

    // Parse the JSON response
    let witnessData = {
      ai_witness: '这是一次勇敢的给予行动。你正在建立新的财富信用。',
      transition_label: '心穷→心富'
    }

    try {
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleanedContent)
      if (parsed.ai_witness) {
        witnessData = parsed
      }
    } catch (parseError) {
      console.error('Failed to parse AI response, using default:', parseError)
    }

    // Save to database using service role
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: savedRecord, error: insertError } = await adminClient
      .from('user_action_witness')
      .insert({
        user_id: user.id,
        journal_id: journal_id || null,
        camp_id: camp_id || null,
        action_type,
        original_action: action_text,
        user_reflection: reflection || null,
        ai_witness: witnessData.ai_witness,
        transition_label: witnessData.transition_label,
        difficulty_rating: difficulty || null
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to save witness record:', insertError)
      throw insertError
    }

    // Get total witness count for this user
    const { count } = await adminClient
      .from('user_action_witness')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    return new Response(
      JSON.stringify({
        success: true,
        witness: witnessData,
        record: savedRecord,
        totalWitnessCount: count || 1
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in witness-action:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
