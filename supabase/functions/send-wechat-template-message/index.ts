import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 系统级模板ID配置 - 从环境变量读取或使用默认值
// 注意：WECHAT_TEMPLATE_FOLLOWUP 已停用，智能跟进场景改用 WECHAT_TEMPLATE_DEFAULT
const SYSTEM_TEMPLATE_IDS: Record<string, string> = {
  // 打卡相关场景使用打卡模板 (thing10, thing4, time3)
  'checkin_success': Deno.env.get('WECHAT_TEMPLATE_CHECKIN') || '',
  'checkin_streak_milestone': Deno.env.get('WECHAT_TEMPLATE_CHECKIN') || '',
  'checkin_reminder': Deno.env.get('WECHAT_TEMPLATE_CHECKIN') || '',
  'checkin_streak_break_warning': Deno.env.get('WECHAT_TEMPLATE_CHECKIN') || '',
  // 登录成功使用专用模板 (thing3, character_string1, time2)
  'login_success': Deno.env.get('WECHAT_TEMPLATE_LOGIN') || '',
  // 智能跟进提醒场景统一使用通用模板 (thing1, thing19, time21)
  'after_briefing': Deno.env.get('WECHAT_TEMPLATE_DEFAULT') || '',
  'emotion_improvement': Deno.env.get('WECHAT_TEMPLATE_DEFAULT') || '',
  'goal_milestone': Deno.env.get('WECHAT_TEMPLATE_DEFAULT') || '',
  'sustained_low_mood': Deno.env.get('WECHAT_TEMPLATE_DEFAULT') || '',
  'inactivity': Deno.env.get('WECHAT_TEMPLATE_DEFAULT') || '',
  'consistent_checkin': Deno.env.get('WECHAT_TEMPLATE_DEFAULT') || '',
  'encouragement': Deno.env.get('WECHAT_TEMPLATE_DEFAULT') || '',
  // 其他场景使用通用模板
  'default': Deno.env.get('WECHAT_TEMPLATE_DEFAULT') || '',
};

// =============== 消息变体系统 ===============

interface MessageVariant {
  first: string;
  content: string;
  remark: string;
  priority?: number; // 优先级，数字越大优先级越高
}

interface MessageContext {
  hour: number;
  isWeekend: boolean;
  lunarMonth?: number;
  lunarDay?: number;
  solarMonth: number;
  solarDay: number;
  streakDays?: number;
  inactiveDays?: number;
  emotionTrend?: 'improving' | 'stable' | 'declining';
  displayName: string;
  isBirthday?: boolean;
}

// 获取农历日期（简化版，仅支持常见节日）
function getLunarDate(date: Date): { month: number; day: number } | null {
  // 这是简化实现，实际项目中可使用完整的农历库
  // 返回 null 表示无法确定
  return null;
}

// 检测当前节日/特殊日期
function detectSpecialDay(ctx: MessageContext): string | null {
  const { solarMonth, solarDay, lunarMonth, lunarDay } = ctx;
  
  // 农历节日（如果有农历数据）
  if (lunarMonth && lunarDay) {
    if (lunarMonth === 1 && lunarDay >= 1 && lunarDay <= 15) return 'spring_festival'; // 春节期间
    if (lunarMonth === 1 && lunarDay === 15) return 'lantern_festival'; // 元宵节
    if (lunarMonth === 5 && lunarDay === 5) return 'dragon_boat'; // 端午节
    if (lunarMonth === 8 && lunarDay === 15) return 'mid_autumn'; // 中秋节
    if (lunarMonth === 9 && lunarDay === 9) return 'double_ninth'; // 重阳节
  }
  
  // 阳历节日
  if (solarMonth === 1 && solarDay === 1) return 'new_year'; // 元旦
  if (solarMonth === 2 && solarDay === 14) return 'valentines'; // 情人节
  if (solarMonth === 3 && solarDay === 8) return 'womens_day'; // 妇女节
  if (solarMonth === 5 && solarDay >= 8 && solarDay <= 14) {
    // 母亲节（5月第二个周日，简化为5月8-14日）
    const date = new Date(new Date().getFullYear(), 4, solarDay);
    if (date.getDay() === 0) return 'mothers_day';
  }
  if (solarMonth === 6 && solarDay >= 15 && solarDay <= 21) {
    // 父亲节（6月第三个周日）
    const date = new Date(new Date().getFullYear(), 5, solarDay);
    if (date.getDay() === 0) return 'fathers_day';
  }
  if (solarMonth === 5 && solarDay === 1) return 'labor_day'; // 劳动节
  if (solarMonth === 6 && solarDay === 1) return 'childrens_day'; // 儿童节
  if (solarMonth === 9 && solarDay === 10) return 'teachers_day'; // 教师节
  if (solarMonth === 10 && solarDay === 1) return 'national_day'; // 国庆节
  if (solarMonth === 11 && solarDay === 11) return 'singles_day'; // 双十一
  if (solarMonth === 12 && solarDay === 24) return 'christmas_eve'; // 平安夜
  if (solarMonth === 12 && solarDay === 25) return 'christmas'; // 圣诞节
  if (solarMonth === 12 && solarDay === 31) return 'new_years_eve'; // 跨年夜
  
  // 生日
  if (ctx.isBirthday) return 'birthday';
  
  return null;
}

// 获取时间段问候
function getTimeGreeting(hour: number): { period: string; greeting: string } {
  if (hour >= 5 && hour < 9) return { period: 'early_morning', greeting: '早安' };
  if (hour >= 9 && hour < 12) return { period: 'morning', greeting: '上午好' };
  if (hour >= 12 && hour < 14) return { period: 'noon', greeting: '中午好' };
  if (hour >= 14 && hour < 18) return { period: 'afternoon', greeting: '下午好' };
  if (hour >= 18 && hour < 22) return { period: 'evening', greeting: '晚上好' };
  return { period: 'night', greeting: '夜深了' };
}

// 节日特殊消息
const holidayMessages: Record<string, { first: string; remark: string }> = {
  'spring_festival': { 
    first: '🧧 新春快乐，{name}', 
    remark: '新的一年，愿您心想事成，万事如意 🎊' 
  },
  'lantern_festival': { 
    first: '🏮 元宵节快乐，{name}', 
    remark: '团团圆圆，幸福美满 🌕' 
  },
  'dragon_boat': { 
    first: '🐲 端午安康，{name}', 
    remark: '粽香四溢，愿您一切安好 🎋' 
  },
  'mid_autumn': { 
    first: '🥮 中秋快乐，{name}', 
    remark: '月圆人团圆，思念与祝福同在 🌙' 
  },
  'double_ninth': { 
    first: '🍂 重阳安康，{name}', 
    remark: '登高望远，愿您健康长寿 🏔️' 
  },
  'new_year': { 
    first: '🎉 新年快乐，{name}', 
    remark: '新的一年，新的开始，愿您心想事成 ✨' 
  },
  'valentines': { 
    first: '💕 情人节快乐，{name}', 
    remark: '愿爱与被爱，温暖您的每一天 💝' 
  },
  'womens_day': { 
    first: '🌸 女神节快乐，{name}', 
    remark: '愿您永远美丽自信，活出精彩 💐' 
  },
  'mothers_day': { 
    first: '🌹 母亲节快乐，{name}', 
    remark: '感恩您的付出，愿您被温柔以待 💗' 
  },
  'fathers_day': { 
    first: '👔 父亲节快乐，{name}', 
    remark: '感谢您的守护，愿您健康幸福 💙' 
  },
  'labor_day': { 
    first: '🎊 劳动节快乐，{name}', 
    remark: '劳动最光荣，也别忘了好好休息 🌿' 
  },
  'childrens_day': { 
    first: '🎈 儿童节快乐，{name}', 
    remark: '愿您永葆童心，快乐每一天 🎠' 
  },
  'teachers_day': { 
    first: '📚 教师节快乐，{name}', 
    remark: '感谢每一位传道授业的老师 🍎' 
  },
  'national_day': { 
    first: '🇨🇳 国庆节快乐，{name}', 
    remark: '祝祖国繁荣昌盛，愿您假期愉快 🎆' 
  },
  'singles_day': { 
    first: '🛒 双十一快乐，{name}', 
    remark: '理性消费，对自己好一点 💝' 
  },
  'christmas_eve': { 
    first: '🎄 平安夜好，{name}', 
    remark: '愿平安与温暖伴您度过每一天 🌟' 
  },
  'christmas': { 
    first: '🎅 圣诞快乐，{name}', 
    remark: '愿您收获满满的爱与祝福 🎁' 
  },
  'new_years_eve': { 
    first: '🎊 跨年快乐，{name}', 
    remark: '告别过去，拥抱新的一年 ✨' 
  },
  'birthday': { 
    first: '🎂 生日快乐，{name}', 
    remark: '愿您的每一个愿望都能实现 🎁' 
  },
};

// 场景消息变体配置
const scenarioMessageVariants: Record<string, MessageVariant[]> = {
  'after_briefing': [
    // 早安版
    { first: '早安，{name}，您的情绪简报已生成', content: '新的一天，带着觉察开始', remark: '每一个清晨都是新的开始 🌅', priority: 1 },
    // 午间版
    { first: '{name}，午间时光，简报已就绪', content: '今日情绪梳理已完成，记得查看洞察', remark: '忙碌中也要关照自己 🌿', priority: 1 },
    // 晚间版
    { first: '晚上好，{name}，今日简报已生成', content: '一天的情绪旅程已记录', remark: '夜晚是回顾与沉淀的好时光 🌙', priority: 1 },
    // 深夜版
    { first: '夜深了，{name}，简报已为您准备好', content: '今日的情绪故事已记录', remark: '好好休息，明天会更好 🌟', priority: 1 },
    // 周末版
    { first: '周末愉快，{name}，简报已生成', content: '放松之余，也来看看内心的声音', remark: '周末是与自己对话的好时机 🍃', priority: 2 },
    // 默认版
    { first: '您好，{name}，您的情绪简报已生成', content: '今日情绪梳理已完成，记得查看成长洞察', remark: '每一次记录都是成长的印记 🌿', priority: 0 },
  ],
  'emotion_improvement': [
    // 持续改善版
    { first: '太棒了，{name}，情绪持续好转', content: '您的努力正在收获成果', remark: '保持这份积极的力量 💪', priority: 1 },
    // 初步改善版
    { first: '{name}，劲老师发现您的情绪有好转', content: '每一点进步都值得肯定', remark: '您的每一步努力都被看见 ✨', priority: 0 },
    // 大幅改善版
    { first: '🎉 {name}，情绪有了明显改善', content: '从低谷到现在，您真的很棒', remark: '相信自己，您比想象中更强大 💫', priority: 2 },
  ],
  'goal_milestone': [
    // 7天里程碑
    { first: '🎉 恭喜{name}，完成7天小目标', content: '一周的坚持，已经很棒了', remark: '好的开始是成功的一半 🌱', priority: 1 },
    // 21天里程碑
    { first: '🏆 太厉害了，{name}，21天习惯养成', content: '21天的坚持，习惯已在形成', remark: '您正在成为更好的自己 💪', priority: 2 },
    // 30天里程碑
    { first: '🌟 {name}，30天成就解锁', content: '一个月的努力，成果斐然', remark: '坚持的力量，超乎想象 🎯', priority: 2 },
    // 100天里程碑
    { first: '🎊 百日大成就！{name}，太了不起了', content: '100天的坚持，您是真正的英雄', remark: '这份毅力，值得所有掌声 👏', priority: 3 },
    // 默认版
    { first: '🎉 恭喜{name}达成目标里程碑', content: '目标进度已更新，快来查看', remark: '每一个小目标都值得庆祝 💪', priority: 0 },
  ],
  'sustained_low_mood': [
    // 温柔关怀版
    { first: '{name}，劲老师想轻轻问候您', content: '发现您最近情绪有些波动', remark: '无论什么时候，我都在这里陪着您 💚', priority: 0 },
    // 深度关怀版
    { first: '亲爱的{name}，您还好吗', content: '劲老师注意到您这几天情绪有些低落', remark: '低谷也是旅程的一部分，我陪您走过 🤗', priority: 1 },
    // 周末关怀版
    { first: '周末好，{name}，来看看您', content: '周末放松之余，也来陪陪自己', remark: '给自己一个温暖的拥抱 🫂', priority: 2 },
    // 夜间关怀版
    { first: '夜深了，{name}，还没休息吗', content: '夜晚容易多想，但别忘了您很棒', remark: '好好休息，明天的太阳照常升起 🌙', priority: 1 },
  ],
  'inactivity': [
    // 3天不活跃
    { first: '嗨，{name}，好久不见', content: '有空来记录一下最近的心情吧', remark: '慢慢来，劲老师等着您 🌸', priority: 1 },
    // 7天不活跃
    { first: '{name}，一周没见，想您了', content: '不管忙或闲，都欢迎回来', remark: '这里永远有您的位置 🏡', priority: 2 },
    // 14天不活跃
    { first: '亲爱的{name}，两周了呢', content: '有什么需要，随时来找劲老师', remark: '门一直为您敞开 🚪', priority: 2 },
    // 30天不活跃
    { first: '{name}，一个月了，真的很想您', content: '不管多久没来，回来就好', remark: '您的成长旅程，随时可以继续 🌈', priority: 3 },
    // 默认版
    { first: '您好，{name}，好久不见', content: '有空来记录一下最近的心情吧', remark: '慢慢来，劲老师等着您 🌸', priority: 0 },
  ],
  'consistent_checkin': [
    // 3天连续
    { first: '棒棒的，{name}，连续3天打卡', content: '好的开始，继续保持', remark: '坚持就是力量 💪', priority: 1 },
    // 7天连续
    { first: '🎉 {name}，一周连续打卡达成', content: '7天的坚持，习惯正在养成', remark: '您比想象中更有毅力 🌟', priority: 2 },
    // 14天连续
    { first: '🏆 太棒了，{name}，14天连续打卡', content: '两周的努力，真的很了不起', remark: '您正在成为更好的自己 ✨', priority: 2 },
    // 21天连续
    { first: '🌟 {name}，21天习惯养成大师', content: '21天的坚持，习惯已经形成', remark: '这份自律，值得所有掌声 👏', priority: 3 },
    // 30天连续
    { first: '🎊 满月成就！{name}，30天连续打卡', content: '一个月的坚持，您是榜样', remark: '持续的努力终将收获美好 🌈', priority: 3 },
    // 默认版
    { first: '您好，{name}，坚持的力量真棒', content: '已连续记录情绪，非常了不起', remark: '持续的努力终将收获美好 🌟', priority: 0 },
  ],
  'encouragement': [
    // 早安鼓励
    { first: '早安，{name}，新的一天开始了', content: '今天也要好好照顾自己哦', remark: '每一天都是新的开始 🌅', priority: 1 },
    // 午间鼓励
    { first: '午安，{name}，忙碌中也要休息', content: '适当放松，效率更高', remark: '照顾好自己才能更好前行 🌿', priority: 1 },
    // 晚间鼓励
    { first: '晚上好，{name}，辛苦了一天', content: '今天的您，很棒哦', remark: '好好休息，明天继续加油 🌙', priority: 1 },
    // 周末鼓励
    { first: '周末愉快，{name}', content: '难得的休息日，好好放松吧', remark: '适当的休息是为了更好的出发 🍃', priority: 2 },
    // 默认版
    { first: '您好，{name}，这是来自劲老师的问候', content: '今天也要好好照顾自己哦', remark: '您值得被温柔以待 💝', priority: 0 },
  ],
};

// 选择最佳消息变体
function selectBestVariant(scenario: string, ctx: MessageContext, notification: any): MessageVariant {
  const variants = scenarioMessageVariants[scenario] || scenarioMessageVariants['encouragement'];
  const { hour, isWeekend, streakDays, inactiveDays } = ctx;
  const time = getTimeGreeting(hour);
  
  let selectedVariant: MessageVariant | null = null;
  let highestPriority = -1;
  
  for (const variant of variants) {
    let matches = false;
    let priority = variant.priority || 0;
    
    // 根据场景特定条件匹配
    if (scenario === 'consistent_checkin' && streakDays) {
      if (streakDays >= 30 && variant.first.includes('30天')) { matches = true; priority += 10; }
      else if (streakDays >= 21 && variant.first.includes('21天')) { matches = true; priority += 8; }
      else if (streakDays >= 14 && variant.first.includes('14天')) { matches = true; priority += 6; }
      else if (streakDays >= 7 && variant.first.includes('7天') || variant.first.includes('一周')) { matches = true; priority += 4; }
      else if (streakDays >= 3 && variant.first.includes('3天')) { matches = true; priority += 2; }
    }
    
    if (scenario === 'goal_milestone' && streakDays) {
      if (streakDays >= 100 && variant.first.includes('100天')) { matches = true; priority += 10; }
      else if (streakDays >= 30 && variant.first.includes('30天')) { matches = true; priority += 8; }
      else if (streakDays >= 21 && variant.first.includes('21天')) { matches = true; priority += 6; }
      else if (streakDays >= 7 && variant.first.includes('7天')) { matches = true; priority += 4; }
    }
    
    if (scenario === 'inactivity' && inactiveDays) {
      if (inactiveDays >= 30 && variant.first.includes('一个月')) { matches = true; priority += 10; }
      else if (inactiveDays >= 14 && variant.first.includes('两周')) { matches = true; priority += 6; }
      else if (inactiveDays >= 7 && variant.first.includes('一周')) { matches = true; priority += 4; }
      else if (inactiveDays >= 3 && variant.first.includes('好久不见')) { matches = true; priority += 2; }
    }
    
    // 周末匹配
    if (isWeekend && variant.first.includes('周末')) {
      matches = true;
      priority += 5;
    }
    
    // 时间段匹配
    if (time.period === 'early_morning' && variant.first.includes('早安')) {
      matches = true;
      priority += 3;
    } else if (time.period === 'noon' && variant.first.includes('午')) {
      matches = true;
      priority += 3;
    } else if (time.period === 'evening' && variant.first.includes('晚上好')) {
      matches = true;
      priority += 3;
    } else if (time.period === 'night' && variant.first.includes('夜深')) {
      matches = true;
      priority += 3;
    }
    
    // 更新最佳选择
    if (matches && priority > highestPriority) {
      selectedVariant = variant;
      highestPriority = priority;
    }
  }
  
  // 如果没有特殊匹配，返回默认变体（priority为0的）
  if (!selectedVariant) {
    selectedVariant = variants.find(v => (v.priority || 0) === 0) || variants[0];
  }
  
  return selectedVariant;
}

// 替换消息中的占位符
function replacePlaceholders(text: string, ctx: MessageContext, notification: any): string {
  return text
    .replace(/\{name\}/g, ctx.displayName)
    .replace(/\{days\}/g, String(ctx.streakDays || ctx.inactiveDays || ''))
    .replace(/\{emotion\}/g, notification?.emotion || '情绪');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, scenario, notification } = await req.json();

    console.log(`[${scenario}] 收到通知请求 - userId: ${userId}`);

    if (!userId || !scenario || !notification) {
      throw new Error('Missing required parameters');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 获取用户的 OpenID 和配置
    const { data: mapping, error: mappingError } = await supabaseClient
      .from('wechat_user_mappings')
      .select('openid, subscribe_status')
      .eq('system_user_id', userId)
      .maybeSingle();

    if (mappingError || !mapping) {
      console.log(`[${scenario}] 用户尚未绑定微信公众号 - userId: ${userId}`);
      return new Response(
        JSON.stringify({ success: false, reason: 'not_bound' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!mapping.subscribe_status) {
      console.log(`[${scenario}] 用户已取消关注公众号 - userId: ${userId}`);
      return new Response(
        JSON.stringify({ success: false, reason: 'unsubscribed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取用户是否启用微信通知
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('wechat_enabled, display_name')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.log(`[${scenario}] 获取用户配置失败 - userId: ${userId}, error: ${profileError.message}`);
    }
    console.log(`[${scenario}] 用户配置 - userId: ${userId}, wechat_enabled: ${profile?.wechat_enabled}`);
    if (!profile?.wechat_enabled) {
      console.log(`[${scenario}] 用户未启用微信公众号推送 - userId: ${userId}, wechat_enabled: ${profile?.wechat_enabled}`);
      return new Response(
        JSON.stringify({ success: false, reason: 'disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 使用系统级模板ID配置
    const templateId = SYSTEM_TEMPLATE_IDS[scenario] || SYSTEM_TEMPLATE_IDS['default'];
    if (!templateId) {
      console.log(`场景 ${scenario} 未配置系统模板ID`);
      return new Response(
        JSON.stringify({ success: false, reason: 'no_template' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取 access_token（使用系统级配置）
    const appId = Deno.env.get('WECHAT_APP_ID');
    const appSecret = Deno.env.get('WECHAT_APP_SECRET');
    const proxyUrl = Deno.env.get('WECHAT_PROXY_URL');
    const proxyToken = Deno.env.get('WECHAT_PROXY_TOKEN');
    
    if (!appId || !appSecret) {
      throw new Error('WeChat AppID or AppSecret not configured');
    }

    // 获取access_token的辅助函数
    const fetchWechatApi = async (url: string, options?: { method?: string; body?: string }) => {
      if (proxyUrl) {
        console.log('Using proxy server for WeChat API call');
        const proxyHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (proxyToken) {
          proxyHeaders['Authorization'] = `Bearer ${proxyToken}`;
        }
        
        const proxyResponse = await fetch(`${proxyUrl}/wechat-proxy`, {
          method: 'POST',
          headers: proxyHeaders,
          body: JSON.stringify({
            target_url: url,
            method: options?.method || 'GET',
            headers: options?.body ? { 'Content-Type': 'application/json' } : undefined,
            body: options?.body ? JSON.parse(options.body) : undefined,
          }),
        });
        
        const proxyData = await proxyResponse.json();
        return proxyData.data || proxyData;
      } else {
        console.log('Direct call to WeChat API');
        const response = await fetch(url, {
          method: options?.method || 'GET',
          headers: options?.body ? { 'Content-Type': 'application/json' } : undefined,
          body: options?.body,
        });
        return response.json();
      }
    };

    // 获取access_token
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    const tokenData = await fetchWechatApi(tokenUrl);

    if (tokenData.errcode) {
      throw new Error(`Failed to get access token: ${tokenData.errmsg}`);
    }

    const accessToken = tokenData.access_token;
    const displayName = profile?.display_name || '用户';

    // 构建消息上下文
    const now = new Date();
    const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000) - (now.getTimezoneOffset() * 60 * 1000));
    
    // 生日功能暂不支持（profiles表无birthday列）
    const isBirthday = false;
    
    const messageContext: MessageContext = {
      hour: beijingTime.getUTCHours(),
      isWeekend: [0, 6].includes(beijingTime.getUTCDay()),
      solarMonth: beijingTime.getUTCMonth() + 1,
      solarDay: beijingTime.getUTCDate(),
      streakDays: notification.streakDays,
      inactiveDays: notification.inactiveDays,
      emotionTrend: notification.emotionTrend,
      displayName,
      isBirthday,
    };

    // 场景中文映射
    const scenarioNames: Record<string, string> = {
      'daily_reminder': '每日情绪记录',
      'goal_milestone': '目标达成',
      'sustained_low_mood': '情绪关怀',
      'inactivity': '活跃度提醒',
      'weekly_report': '周报生成',
      'goal_at_risk': '目标提醒',
      'checkin_success': '打卡成功',
      'checkin_streak_milestone': '连续打卡里程碑',
      'checkin_reminder': '每日打卡提醒',
      'checkin_streak_break_warning': '打卡即将中断',
      'login_success': '登录成功',
      'after_briefing': '简报生成',
      'emotion_improvement': '情绪改善',
      'consistent_checkin': '坚持打卡',
      'encouragement': '温暖鼓励',
    };

    const scenarioName = scenarioNames[scenario] || '系统通知';

    // 根据场景选择不同的模板数据结构
    let messageData;
    
    // 获取消息内容，支持 message 或 content 字段
    const messageContent = notification.message || notification.content || '欢迎使用';
    
    // 检测打卡相关场景 (thing10, thing4, time3结构)
    const isCheckinScenario = ['checkin_success', 'checkin_streak_milestone', 'checkin_reminder', 'checkin_streak_break_warning'].includes(scenario);
    
    // 检测智能跟进场景 (first, keyword1, keyword2, keyword3, remark结构)
    const isFollowupScenario = ['after_briefing', 'emotion_improvement', 'goal_milestone', 'sustained_low_mood', 'inactivity', 'consistent_checkin', 'encouragement'].includes(scenario);
    
    if (scenario === 'login_success') {
      // 登录成功模板结构：thing3(用户名)、character_string1(账号)、time2(登录时间)
      const loginTime = beijingTime.toLocaleString('zh-CN', { 
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      messageData = {
        thing3: { 
          value: (displayName || '用户').slice(0, 20),
          color: "#173177" 
        },
        character_string1: { 
          value: (notification.account || notification.email || '***').slice(0, 32),
          color: "#173177" 
        },
        time2: { 
          value: loginTime,
          color: "#173177" 
        },
      };
    } else if (isCheckinScenario) {
      // "打卡成功通知"模板结构 (thing10学生姓名, thing4打卡名称, time3时间)
      const timeStr = `${beijingTime.getUTCFullYear()}-${String(beijingTime.getUTCMonth() + 1).padStart(2, '0')}-${String(beijingTime.getUTCDate()).padStart(2, '0')} ${String(beijingTime.getUTCHours()).padStart(2, '0')}:${String(beijingTime.getUTCMinutes()).padStart(2, '0')}`;
      messageData = {
        thing10: { 
          value: (displayName || '用户').slice(0, 20),
          color: "#173177" 
        },
        thing4: { 
          value: `恭喜！已连续打卡${notification.streakDays || 1}天`.slice(0, 20),
          color: "#173177" 
        },
        time3: { 
          value: timeStr,
          color: "#173177" 
        },
      };
    } else if (isFollowupScenario) {
      // 智能跟进场景现在使用 WECHAT_TEMPLATE_DEFAULT (thing1, thing19, time21)
      // 注意：WECHAT_TEMPLATE_FOLLOWUP 已停用
      const timeStr = `${beijingTime.getUTCFullYear()}-${String(beijingTime.getUTCMonth() + 1).padStart(2, '0')}-${String(beijingTime.getUTCDate()).padStart(2, '0')} ${String(beijingTime.getUTCHours()).padStart(2, '0')}:${String(beijingTime.getUTCMinutes()).padStart(2, '0')}`;
      
      // 检测节日/特殊日期
      const specialDay = detectSpecialDay(messageContext);
      
      let thing19Content: string;
      
      if (specialDay && holidayMessages[specialDay]) {
        // 使用节日问候作为内容
        const holidayMsg = holidayMessages[specialDay];
        const greeting = replacePlaceholders(holidayMsg.first, messageContext, notification);
        thing19Content = greeting;
      } else {
        // 使用场景消息变体的内容
        const variant = selectBestVariant(scenario, messageContext, notification);
        thing19Content = replacePlaceholders(notification.title || variant.content, messageContext, notification);
      }
      
      console.log(`Selected message for scenario ${scenario}:`, { thing19Content, specialDay });
      
      messageData = {
        thing1: { 
          value: (displayName || '用户').slice(0, 20),
          color: "#173177" 
        },
        thing19: { 
          value: thing19Content.slice(0, 20),
          color: "#173177" 
        },
        time21: { 
          value: timeStr,
          color: "#173177" 
        },
      };
    } else {
      // "客户跟进提醒"模板结构 (thing1, thing19, time21) - 其他默认场景
      const timeStr = `${beijingTime.getUTCFullYear()}-${String(beijingTime.getUTCMonth() + 1).padStart(2, '0')}-${String(beijingTime.getUTCDate()).padStart(2, '0')} ${String(beijingTime.getUTCHours()).padStart(2, '0')}:${String(beijingTime.getUTCMinutes()).padStart(2, '0')}`;
      
      // 根据场景设置thing19字段内容
      const scenarioThing19Map: Record<string, string> = {
        'daily_reminder': '今日情绪记录提醒',
        'weekly_report': '本周情绪报告已生成',
        'goal_at_risk': '目标风险提醒',
      };
      
      const thing19Value = scenarioThing19Map[scenario] || notification.title || '情绪提醒';
      
      messageData = {
        thing1: { 
          value: (displayName || '用户').slice(0, 20),
          color: "#173177" 
        },
        thing19: { 
          value: thing19Value.slice(0, 20),
          color: "#173177" 
        },
        time21: { 
          value: timeStr,
          color: "#173177" 
        },
      };
    }

    // 发送模板消息
    const sendUrl = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;
    
    const productionUrl = Deno.env.get('VITE_PRODUCTION_URL') || 'https://eugeneai.me';

    const messageBody = {
      touser: mapping.openid,
      template_id: templateId,
      url: `${productionUrl}/?notification=${notification.id}`,
      data: messageData,
    };

    console.log('Sending template message:', JSON.stringify(messageBody, null, 2));

    const result = await fetchWechatApi(sendUrl, {
      method: 'POST',
      body: JSON.stringify(messageBody),
    });

    if (result.errcode !== 0) {
      console.error('WeChat API error:', result);
      throw new Error(`WeChat API error: ${result.errmsg || 'Unknown error'}`);
    }

    // 记录发送历史
    await supabaseClient
      .from('wechat_template_messages')
      .insert({
        user_id: userId,
        openid: mapping.openid,
        template_id: templateId,
        scenario: scenario,
        data: messageData,
        url: messageBody.url,
        status: 'sent',
        msgid: result.msgid?.toString(),
      });

    console.log('微信公众号模板消息发送成功:', result.msgid);

    return new Response(
      JSON.stringify({ success: true, msgid: result.msgid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending WeChat template message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});