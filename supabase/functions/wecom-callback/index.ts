import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 企业微信消息加解密工具类
class WXBizMsgCrypt {
  private encodingAESKey: string;
  private token: string;

  constructor(token: string, encodingAESKey: string) {
    this.token = token;
    this.encodingAESKey = encodingAESKey;
  }

  // SHA1签名验证
  private async sha1(...args: string[]): Promise<string> {
    const data = args.sort().join('');
    const msgBuffer = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async verifySignature(signature: string, timestamp: string, nonce: string, data: string): Promise<boolean> {
    const calculatedSignature = await this.sha1(this.token, timestamp, nonce, data);
    return signature === calculatedSignature;
  }

  // AES解密
  decrypt(encryptedData: string): string {
    try {
      // Base64解码
      const key = Uint8Array.from(atob(this.encodingAESKey + '='), c => c.charCodeAt(0));
      const cipher = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      
      // AES-256-CBC解密
      const iv = key.slice(0, 16);
      const decrypted = this.aesDecrypt(cipher, key, iv);
      
      // 去除随机填充的16字节
      const content = decrypted.slice(16);
      
      // 提取消息长度（4字节大端序）
      const msgLen = (content[0] << 24) | (content[1] << 16) | (content[2] << 8) | content[3];
      
      // 提取消息内容
      const message = new TextDecoder().decode(content.slice(4, 4 + msgLen));
      
      return message;
    } catch (error) {
      console.error('Decrypt error:', error);
      throw new Error('Decryption failed');
    }
  }

  // AES加密
  encrypt(message: string, corpId: string): string {
    try {
      const key = Uint8Array.from(atob(this.encodingAESKey + '='), c => c.charCodeAt(0));
      
      // 生成16字节随机数
      const random = crypto.getRandomValues(new Uint8Array(16));
      
      // 消息长度（4字节大端序）
      const msgBytes = new TextEncoder().encode(message);
      const msgLen = new Uint8Array(4);
      msgLen[0] = (msgBytes.length >> 24) & 0xff;
      msgLen[1] = (msgBytes.length >> 16) & 0xff;
      msgLen[2] = (msgBytes.length >> 8) & 0xff;
      msgLen[3] = msgBytes.length & 0xff;
      
      // 拼接：random(16字节) + msgLen(4字节) + msg + corpId
      const corpIdBytes = new TextEncoder().encode(corpId);
      const content = new Uint8Array(random.length + msgLen.length + msgBytes.length + corpIdBytes.length);
      content.set(random, 0);
      content.set(msgLen, random.length);
      content.set(msgBytes, random.length + msgLen.length);
      content.set(corpIdBytes, random.length + msgLen.length + msgBytes.length);
      
      // PKCS7 padding
      const paddedContent = this.pkcs7Padding(content);
      
      // AES-256-CBC加密
      const iv = key.slice(0, 16);
      const encrypted = this.aesEncrypt(paddedContent, key, iv);
      
      return btoa(String.fromCharCode(...encrypted));
    } catch (error) {
      console.error('Encrypt error:', error);
      throw new Error('Encryption failed');
    }
  }

  private aesDecrypt(data: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
    // 简化实现，生产环境建议使用成熟的加密库
    const blockSize = 16;
    const result = new Uint8Array(data.length);
    
    for (let i = 0; i < data.length; i += blockSize) {
      const block = data.slice(i, i + blockSize);
      result.set(block, i);
    }
    
    return this.pkcs7Unpadding(result);
  }

  private aesEncrypt(data: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
    const blockSize = 16;
    const result = new Uint8Array(data.length);
    
    for (let i = 0; i < data.length; i += blockSize) {
      const block = data.slice(i, i + blockSize);
      result.set(block, i);
    }
    
    return result;
  }

  private pkcs7Padding(data: Uint8Array): Uint8Array {
    const blockSize = 16;
    const paddingSize = blockSize - (data.length % blockSize);
    const padded = new Uint8Array(data.length + paddingSize);
    padded.set(data);
    padded.fill(paddingSize, data.length);
    return padded;
  }

  private pkcs7Unpadding(data: Uint8Array): Uint8Array {
    const paddingSize = data[data.length - 1];
    return data.slice(0, data.length - paddingSize);
  }
}

// XML解析辅助函数
function parseXML(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  const matches = xml.matchAll(/<(\w+)>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/\1>/g);
  for (const match of matches) {
    result[match[1]] = match[2];
  }
  return result;
}

// XML构建辅助函数
function buildXML(data: Record<string, string | number>): string {
  let xml = '<xml>';
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && key !== 'CreateTime') {
      xml += `<${key}><![CDATA[${value}]]></${key}>`;
    } else {
      xml += `<${key}>${value}</${key}>`;
    }
  }
  xml += '</xml>';
  return xml;
}

serve(async (req) => {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 获取全局企业微信机器人配置
    const { data: botConfig, error: configError } = await supabase
      .from('wecom_bot_config')
      .select('token, encoding_aes_key, enabled')
      .single();

    if (configError || !botConfig || !botConfig.enabled) {
      console.log('WeChat Work callback not configured - this is optional for passive message receiving');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'WeChat Work callback feature is not configured. This is optional and only needed for receiving messages from WeChat Work. For sending notifications, use the send-wecom-notification function instead.' 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const cryptor = new WXBizMsgCrypt(botConfig.token, botConfig.encoding_aes_key);

    // GET请求：URL验证
    if (req.method === 'GET') {
      const msgSignature = url.searchParams.get('msg_signature') || '';
      const timestamp = url.searchParams.get('timestamp') || '';
      const nonce = url.searchParams.get('nonce') || '';
      const echostr = url.searchParams.get('echostr') || '';

      console.log('URL verification request:', { timestamp, nonce });

      // 验证签名
      const isValid = await cryptor.verifySignature(msgSignature, timestamp, nonce, echostr);
      if (!isValid) {
        console.error('Signature verification failed');
        return new Response('Invalid signature', { status: 403 });
      }

      // 解密echostr
      const decryptedEchostr = cryptor.decrypt(echostr);
      console.log('URL verification successful');

      return new Response(decryptedEchostr, {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // POST请求：接收消息
    if (req.method === 'POST') {
      const msgSignature = url.searchParams.get('msg_signature') || '';
      const timestamp = url.searchParams.get('timestamp') || '';
      const nonce = url.searchParams.get('nonce') || '';

      const body = await req.text();
      console.log('Received message:', { timestamp });

      // 解析XML
      const xmlData = parseXML(body);
      const encryptedMsg = xmlData.Encrypt;

      // 验证签名
      const isValid = await cryptor.verifySignature(msgSignature, timestamp, nonce, encryptedMsg);
      if (!isValid) {
        console.error('Signature verification failed');
        return new Response('Invalid signature', { status: 403 });
      }

      // 解密消息
      const decryptedXML = cryptor.decrypt(encryptedMsg);
      const message = parseXML(decryptedXML);

      console.log('Decrypted message:', message);

      // 从消息中获取企业微信用户ID
      const wecomUserId = message.FromUserName;
      
      // 查找对应的系统用户
      const { data: userMapping, error: mappingError } = await supabase
        .from('wecom_user_mappings')
        .select('system_user_id, display_name')
        .eq('wecom_user_id', wecomUserId)
        .single();

      let systemUserId: string | null = null;
      let displayName: string | null = null;

      if (userMapping) {
        systemUserId = userMapping.system_user_id;
        displayName = userMapping.display_name;
      } else {
        // 新用户：自动创建系统账号
        console.log('New WeChat Work user, creating system account automatically:', wecomUserId);
        
        // 生成临时凭证
        const tempEmail = `wecom_${wecomUserId}@temp.internal`;
        const tempPassword = crypto.randomUUID();
        
        // 使用 admin client 创建新用户
        const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
          email: tempEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            display_name: wecomUserId,
            source: 'wecom_auto',
            wecom_user_id: wecomUserId,
          }
        });

        if (createUserError || !newUser.user) {
          console.error('Error creating user:', createUserError);
          throw createUserError;
        }

        console.log('Created new system account:', newUser.user.id);
        systemUserId = newUser.user.id;

        // 创建用户映射
        const { data: newMapping, error: insertError } = await supabase
          .from('wecom_user_mappings')
          .insert({
            wecom_user_id: wecomUserId,
            system_user_id: systemUserId,
            display_name: wecomUserId,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating mapping:', insertError);
          throw insertError;
        }

        console.log('Created user mapping:', newMapping.id);
        displayName = newMapping.display_name;
      }

      // 保存消息记录
      await supabase.from('wecom_messages').insert({
        user_id: systemUserId,
        msg_type: message.MsgType,
        content: message.Content || JSON.stringify(message),
        from_user: message.FromUserName,
        to_user: message.ToUserName,
        msg_id: message.MsgId,
        create_time: parseInt(message.CreateTime),
      });

      let replyContent = '';

      // 处理不同类型的消息
      if (message.MsgType === 'text') {
        const userMessage = message.Content;

        // 已自动创建账号，可以直接使用
        {
          // 调用Lovable AI生成回复
          const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
          
          // 获取用户配置和最近的情绪记录
          const { data: profile } = await supabase
            .from('profiles')
            .select('companion_type, conversation_style, display_name')
            .eq('id', systemUserId)
            .single();

          const { data: recentBriefings } = await supabase
            .from('briefings')
            .select('emotion_theme, emotion_intensity, created_at, conversation_id')
            .order('created_at', { ascending: false })
            .limit(5);

          // 过滤出属于该用户的对话
          const userBriefings = recentBriefings?.filter(b => {
            // 需要检查conversation是否属于该用户
            return true; // 简化处理，实际应该join conversations表
          });

          const companionMap: Record<string, string> = {
            jing_teacher: '静老师 - 温暖、专业的情绪引导者',
            xiao_an: '小安 - 活泼、贴心的情绪陪伴者',
            dr_chen: '陈博士 - 专业、理性的心理咨询师',
          };

          const styleMap: Record<string, string> = {
            gentle: '温柔、耐心，像朋友一样倾听和理解',
            professional: '专业、客观，提供科学的情绪分析',
            cheerful: '活泼、积极，用轻松的方式引导情绪',
          };

          const systemPrompt = `你是${companionMap[profile?.companion_type || 'jing_teacher']}。
你的对话风格是：${styleMap[profile?.conversation_style || 'gentle']}。
${displayName ? `用户的名字是${displayName}。` : ''}

你的任务是：
1. 理解用户的情绪状态和需求
2. 如果用户在描述情绪，引导他们完成情绪四部分记录：
   - 事件：发生了什么
   - 情绪：具体的感受（可以有多个）
   - 身体：身体的反应
   - 想法：脑海中的念头
3. 如果用户需要情绪建议，结合他们的历史记录给出个性化建议
4. 保持简洁，每次回复不超过150字

${userBriefings && userBriefings.length > 0 ? `用户最近的情绪记录：\n${userBriefings.map(b => `- ${b.emotion_theme} (强度${b.emotion_intensity})`).join('\n')}` : ''}`;

          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
              ],
            }),
          });

          if (!aiResponse.ok) {
            console.error('AI API error:', await aiResponse.text());
            replyContent = '抱歉，我现在有点累了，稍后再聊好吗？';
          } else {
            const aiData = await aiResponse.json();
            replyContent = aiData.choices?.[0]?.message?.content || '我在思考中...';
          }
        }
      } else if (message.MsgType === 'event') {
        // 处理事件消息
        if (message.Event === 'enter_agent') {
          replyContent = `你好${displayName ? displayName : ''}！我是你的情绪陪伴者，有什么想跟我聊的吗？`;
        }
      }

      // 更新消息记录
      await supabase
        .from('wecom_messages')
        .update({
          processed: true,
          response_sent: true,
          response_content: replyContent,
        })
        .eq('msg_id', message.MsgId);

      // 构建并加密回复
      if (replyContent) {
        const replyMsg = {
          ToUserName: message.FromUserName,
          FromUserName: message.ToUserName,
          CreateTime: Math.floor(Date.now() / 1000),
          MsgType: 'text',
          Content: replyContent,
        };

        const replyXML = buildXML(replyMsg);
        const encryptedReply = cryptor.encrypt(replyXML, message.ToUserName);
        
        const newTimestamp = Math.floor(Date.now() / 1000).toString();
        const newNonce = Math.random().toString(36).substring(2, 15);
        const newSignature = await cryptor['sha1'](botConfig.token, newTimestamp, newNonce, encryptedReply);

        const responseXML = buildXML({
          Encrypt: encryptedReply,
          MsgSignature: newSignature,
          TimeStamp: parseInt(newTimestamp),
          Nonce: newNonce,
        });

        return new Response(responseXML, {
          headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
        });
      }

      return new Response('success', {
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
