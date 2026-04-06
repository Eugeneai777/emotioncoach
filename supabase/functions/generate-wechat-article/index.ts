import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const CAMP_URL = "https://wechat.eugenewe.net/promo/synergy";

async function callAI(prompt: string, system: string, model = "google/gemini-2.5-flash"): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const resp = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`AI API error ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

async function generateImage(prompt: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const resp = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-pro-image-preview",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Image API error ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!imageUrl) throw new Error("No image in response");
  return imageUrl; // data:image/png;base64,...
}

// Upload base64 image to Supabase Storage, return public URL
async function uploadToStorage(supabase: any, base64DataUrl: string, filename: string): Promise<string> {
  const base64Data = base64DataUrl.replace(/^data:image\/\w+;base64,/, '');
  const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

  const { error } = await supabase.storage
    .from('wechat-article-images')
    .upload(filename, binaryData, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from('wechat-article-images')
    .getPublicUrl(filename);

  return urlData.publicUrl;
}

async function getWechatAccessToken(): Promise<string> {
  const proxyUrl = Deno.env.get('WECHAT_PROXY_URL');
  const proxyToken = Deno.env.get('WECHAT_PROXY_TOKEN');
  const appId = Deno.env.get('WECHAT_APP_ID');
  const appSecret = Deno.env.get('WECHAT_APP_SECRET');

  if (!appId || !appSecret) throw new Error("WeChat credentials not configured");

  const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;

  if (proxyUrl) {
    const resp = await fetch(`${proxyUrl}/wechat-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(proxyToken ? { 'Authorization': `Bearer ${proxyToken}` } : {}),
      },
      body: JSON.stringify({ target_url: tokenUrl, method: 'GET' }),
    });
    const data = await resp.json();
    if (data.data?.access_token) return data.data.access_token;
    if (data.access_token) return data.access_token;
    throw new Error(`Failed to get access token: ${JSON.stringify(data)}`);
  }

  const resp = await fetch(tokenUrl);
  const data = await resp.json();
  if (!data.access_token) throw new Error(`Token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function wechatApiCall(accessToken: string, path: string, body: any): Promise<any> {
  const proxyUrl = Deno.env.get('WECHAT_PROXY_URL');
  const proxyToken = Deno.env.get('WECHAT_PROXY_TOKEN');
  const targetUrl = `https://api.weixin.qq.com${path}?access_token=${accessToken}`;

  if (proxyUrl) {
    const resp = await fetch(`${proxyUrl}/wechat-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(proxyToken ? { 'Authorization': `Bearer ${proxyToken}` } : {}),
      },
      body: JSON.stringify({ target_url: targetUrl, method: 'POST', body }),
    });
    return await resp.json();
  }

  const resp = await fetch(targetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return await resp.json();
}

async function uploadImageToWechat(accessToken: string, imageDataUrl: string): Promise<string> {
  const proxyUrl = Deno.env.get('WECHAT_PROXY_URL');
  const proxyToken = Deno.env.get('WECHAT_PROXY_TOKEN');

  // Extract base64 data
  const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
  const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

  const targetUrl = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=image`;

  // Build multipart form data
  const boundary = '----WechatBoundary' + Date.now();
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="article_image.png"\r\nContent-Type: image/png\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;

  const headerBytes = new TextEncoder().encode(header);
  const footerBytes = new TextEncoder().encode(footer);
  const bodyBytes = new Uint8Array(headerBytes.length + binaryData.length + footerBytes.length);
  bodyBytes.set(headerBytes, 0);
  bodyBytes.set(binaryData, headerBytes.length);
  bodyBytes.set(footerBytes, headerBytes.length + binaryData.length);

  if (proxyUrl) {
    // For proxy, send as base64 with metadata
    const resp = await fetch(`${proxyUrl}/wechat-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(proxyToken ? { 'Authorization': `Bearer ${proxyToken}` } : {}),
      },
      body: JSON.stringify({
        target_url: targetUrl,
        method: 'POST',
        content_type: `multipart/form-data; boundary=${boundary}`,
        binary_body_base64: btoa(String.fromCharCode(...bodyBytes)),
      }),
    });
    const data = await resp.json();
    return data.data?.media_id || data.media_id || '';
  }

  const resp = await fetch(targetUrl, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body: bodyBytes,
  });
  const data = await resp.json();
  return data.media_id || '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Auth check: service_role key or admin user
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || '';
      if (token !== Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') && token !== anonKey) {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin');
          if (!roles || roles.length === 0) {
            return new Response(JSON.stringify({ error: '无权限' }), {
              status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }
      }
    }

    const body = await req.json().catch(() => ({}));
    const { action = 'generate_and_publish', article_id } = body;

    if (action === 'generate_only' || action === 'generate_and_publish') {
      console.log('Step 1: Generating article content...');

      const articlePrompt = `你是一位资深公众号写手，曾在《人物》《GQ》做过深度报道，擅长写真实细腻的故事。

这次的任务是为「7天有劲训练营」写一篇转化型公众号文章。

【产品信息】
- 产品名：7天有劲训练营
- 落地页链接：${CAMP_URL}
- 核心交付：7天每日打卡（AI情绪教练+真人录音冥想）、1V1真人教练辅导、海沃塔团队辅导、知乐胶囊
- 目标人群：高压职场人、情绪长期压抑者、感觉"活着没劲"的人
- 痛点：不是不努力，是内耗太严重

【写作要求】
1. 创造一个全新的、极度真实的人物故事：
   - 具体职业和城市（每次不同，如上海金融、成都教师、广州设计师等）
   - 具体生活细节（身体反应、日常动作、感官描写）
   - 参加训练营的Day1/3/7体验（含AI教练对话、冥想感受）
2. 风格：克制、细腻、有画面感，不煽情不鸡汤
3. 转化引导自然，结尾明确提到报名链接
4. 制造适度紧迫感

JSON格式输出（不要markdown代码块）：
{
  "title": "标题15字以内",
  "digest": "摘要25字以内",
  "scene1_desc": "封面图英文描述（疲惫但有希望的画面）",
  "scene2_desc": "第二张配图英文描述（训练中的温暖瞬间）",
  "scene3_desc": "第三张配图英文描述（转变后的画面）",
  "section1_title": "段落1标题4-8字",
  "section1_content": "共鸣开头200-300字",
  "section2_title": "段落2标题",
  "section2_content": "训练营体验300-400字",
  "section3_title": "段落3标题",
  "section3_content": "变化与感悟200-250字",
  "section4_title": "段落4标题",
  "section4_content": "行动号召120-150字"
}`;

      const contentRaw = await callAI(
        articlePrompt,
        "你是专业公众号深度内容创作者。只输出纯JSON，不要任何markdown格式。"
      );

      let cleaned = contentRaw.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.split("\n").slice(1).join("\n");
        if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
        cleaned = cleaned.trim();
      }
      if (cleaned.startsWith("json")) cleaned = cleaned.slice(4).trim();

      const article = JSON.parse(cleaned);
      console.log(`Article title: ${article.title}`);

      // Step 2: Generate images
      console.log('Step 2: Generating illustrations...');
      const images: string[] = [];
      for (const key of ["scene1_desc", "scene2_desc", "scene3_desc"]) {
        const desc = article[key];
        const prompt = `Realistic soft illustration, muted warm tones, delicate watercolor and digital art blend. ${desc}. No text, no words, no letters. Cinematic lighting, intimate atmosphere, editorial magazine quality.`;
        console.log(`  Generating: ${desc.substring(0, 60)}...`);
        const imgDataUrl = await generateImage(prompt);
        images.push(imgDataUrl);
      }

      // Step 3: Assemble HTML
      console.log('Step 3: Assembling HTML...');
      const nl2br = (t: string) => t.replace(/\\n/g, '<br/>').replace(/\n/g, '<br/>');

      const contentHtml = `
<div style="max-width:580px;margin:0 auto;background:#fff;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;color:#2c2c2c;">
  <img style="width:100%;display:block;" src="${images[0]}" alt="封面" />
  <div style="padding:28px 22px 44px;">
    <h1 style="font-size:23px;font-weight:700;color:#1a1a1a;line-height:1.6;margin:0 0 10px;">${article.title}</h1>
    <p style="font-size:13px;color:#999;margin:0 0 24px;padding-bottom:20px;border-bottom:1px solid #f0f0f0;">有劲AI · 7天有劲训练营</p>
    <p style="font-size:14.5px;color:#777;line-height:1.8;margin:0 0 28px;padding:16px 20px;background:#fafafa;border-radius:8px;font-style:italic;">${article.digest}</p>
    
    <div style="margin-bottom:36px;">
      <h2 style="font-size:17px;font-weight:600;color:#1a1a1a;margin:0 0 16px;padding-left:14px;border-left:3px solid #d97706;">${article.section1_title}</h2>
      <p style="font-size:15.5px;line-height:2.1;color:#3a3a3a;text-align:justify;">${nl2br(article.section1_content)}</p>
    </div>
    
    <div style="width:36px;height:2px;background:linear-gradient(90deg,#d97706,#fbbf24);border-radius:1px;margin:0 auto 36px;"></div>
    
    <div style="margin-bottom:36px;">
      <h2 style="font-size:17px;font-weight:600;color:#1a1a1a;margin:0 0 16px;padding-left:14px;border-left:3px solid #d97706;">${article.section2_title}</h2>
      <p style="font-size:15.5px;line-height:2.1;color:#3a3a3a;text-align:justify;">${nl2br(article.section2_content)}</p>
      <img style="width:100%;border-radius:10px;margin:24px 0;box-shadow:0 2px 16px rgba(0,0,0,0.06);" src="${images[1]}" alt="训练营体验" />
    </div>
    
    <div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border-radius:12px;padding:20px 22px;margin:24px 0;border:1px solid #fde68a;">
      <h3 style="font-size:16px;font-weight:600;color:#92400e;margin:0 0 12px;">💪 7天有劲训练营 · 核心交付</h3>
      <p style="font-size:14px;color:#78350f;line-height:2;">✓ 每日AI情绪教练陪练 + 真人录音冥想<br/>✓ 专属1V1真人教练辅导<br/>✓ 海沃塔团队辅导（同频社群）<br/>✓ 知乐胶囊（情绪调节营养补充）<br/>✓ 7天系统化情绪管理训练</p>
    </div>
    
    <div style="margin-bottom:36px;">
      <h2 style="font-size:17px;font-weight:600;color:#1a1a1a;margin:0 0 16px;padding-left:14px;border-left:3px solid #d97706;">${article.section3_title}</h2>
      <p style="font-size:15.5px;line-height:2.1;color:#3a3a3a;text-align:justify;">${nl2br(article.section3_content)}</p>
      <img style="width:100%;border-radius:10px;margin:24px 0;box-shadow:0 2px 16px rgba(0,0,0,0.06);" src="${images[2]}" alt="改变" />
    </div>
    
    <div style="text-align:center;padding:32px 24px;background:linear-gradient(135deg,#78716c,#d97706);border-radius:14px;margin-top:36px;">
      <p style="color:rgba(255,255,255,0.92);font-size:15px;line-height:1.9;margin:0 0 20px;">${nl2br(article.section4_content)}</p>
      <a href="${CAMP_URL}" style="display:inline-block;padding:16px 48px;background:#fff;color:#92400e;font-size:17px;font-weight:700;border-radius:28px;text-decoration:none;box-shadow:0 4px 12px rgba(0,0,0,0.12);">了解「7天有劲训练营」→</a>
      <p style="color:rgba(255,255,255,0.7);font-size:12px;margin-top:14px;">点击即可查看详情 · 每期限额招募</p>
    </div>
  </div>
  <div style="text-align:center;padding:28px 20px;color:#bbb;font-size:12px;line-height:1.8;">
    有劲AI · 每个人都值得被温柔对待<br/>
    <a href="${CAMP_URL}" style="color:#d97706;text-decoration:none;">👉 点击了解7天有劲训练营</a>
  </div>
</div>`;

      // Save to database
      const { data: articleRecord, error: insertError } = await supabase
        .from('wechat_articles')
        .insert({
          title: article.title,
          digest: article.digest,
          content_html: contentHtml,
          cover_image_url: images[0],
          article_images: images,
          story_theme: `${article.section1_title} - AI原创故事`,
          target_product: '7day_camp',
          target_url: CAMP_URL,
          status: action === 'generate_only' ? 'draft' : 'publishing',
          scheduled_for: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (insertError) throw insertError;
      console.log(`Article saved: ${articleRecord.id}`);

      if (action === 'generate_and_publish') {
        // Step 4: Publish to WeChat
        try {
          console.log('Step 4: Publishing to WeChat...');
          const accessToken = await getWechatAccessToken();

          // Upload cover image
          console.log('  Uploading cover image...');
          const coverMediaId = await uploadImageToWechat(accessToken, images[0]);
          
          if (!coverMediaId) {
            throw new Error('Failed to upload cover image to WeChat');
          }

          // Create draft
          console.log('  Creating draft...');
          const draftResult = await wechatApiCall(accessToken, '/cgi-bin/draft/add', {
            articles: [{
              title: article.title,
              author: '有劲AI',
              digest: article.digest,
              content: contentHtml,
              thumb_media_id: coverMediaId,
              content_source_url: CAMP_URL,
            }],
          });

          const mediaId = draftResult.data?.media_id || draftResult.media_id;
          if (!mediaId) {
            console.error('Draft creation response:', JSON.stringify(draftResult));
            throw new Error('Failed to create draft');
          }

          // Submit for publishing
          console.log('  Submitting for publish...');
          const publishResult = await wechatApiCall(accessToken, '/cgi-bin/freepublish/submit', {
            media_id: mediaId,
          });

          const publishId = publishResult.data?.publish_id || publishResult.publish_id;

          await supabase
            .from('wechat_articles')
            .update({
              status: 'published',
              wechat_media_id: mediaId,
              wechat_publish_id: publishId?.toString(),
              published_at: new Date().toISOString(),
            })
            .eq('id', articleRecord.id);

          console.log('✅ Article published successfully!');
          return new Response(JSON.stringify({
            success: true,
            article_id: articleRecord.id,
            title: article.title,
            status: 'published',
            media_id: mediaId,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (publishError) {
          console.error('Publish error:', publishError);
          await supabase
            .from('wechat_articles')
            .update({
              status: 'failed',
              publish_error: publishError instanceof Error ? publishError.message : String(publishError),
            })
            .eq('id', articleRecord.id);

          return new Response(JSON.stringify({
            success: false,
            article_id: articleRecord.id,
            title: article.title,
            status: 'failed',
            error: publishError instanceof Error ? publishError.message : String(publishError),
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        article_id: articleRecord.id,
        title: article.title,
        status: 'draft',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'publish' && article_id) {
      // Publish an existing draft
      const { data: existing } = await supabase
        .from('wechat_articles')
        .select('*')
        .eq('id', article_id)
        .single();

      if (!existing) {
        return new Response(JSON.stringify({ error: '文章不存在' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        const accessToken = await getWechatAccessToken();
        const coverMediaId = await uploadImageToWechat(accessToken, existing.cover_image_url);

        const draftResult = await wechatApiCall(accessToken, '/cgi-bin/draft/add', {
          articles: [{
            title: existing.title,
            author: '有劲AI',
            digest: existing.digest,
            content: existing.content_html,
            thumb_media_id: coverMediaId,
            content_source_url: existing.target_url,
          }],
        });

        const mediaId = draftResult.data?.media_id || draftResult.media_id;
        const publishResult = await wechatApiCall(accessToken, '/cgi-bin/freepublish/submit', {
          media_id: mediaId,
        });
        const publishId = publishResult.data?.publish_id || publishResult.publish_id;

        await supabase
          .from('wechat_articles')
          .update({
            status: 'published',
            wechat_media_id: mediaId,
            wechat_publish_id: publishId?.toString(),
            published_at: new Date().toISOString(),
          })
          .eq('id', article_id);

        return new Response(JSON.stringify({ success: true, status: 'published' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        await supabase
          .from('wechat_articles')
          .update({
            status: 'failed',
            publish_error: err instanceof Error ? err.message : String(err),
          })
          .eq('id', article_id);

        return new Response(JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
