import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 9种情绪的认知提醒配置
const emotionReminders: Record<string, { title: string; reminders: string[] }> = {
  panic: {
    title: "恐慌",
    reminders: [
      "我现在的身体反应是正常的警报，不是危险。",
      "恐慌来得快，也会走得快，它从未停留太久。",
      "我能感觉到心跳，是我的身体在保护我。",
      "恐慌不是失控，而是过度警觉。",
      "呼吸变快不代表坏事，只是身体在应对。",
      "很多人都经历过这样的感觉，我不是例外。",
      "恐慌是暂时的，不会一直持续。",
      "我能察觉到这些信号，是恢复的第一步。",
      "恐慌不是危险，而是我的神经系统太紧张。",
      "我害怕的是身体感觉，而不是真正的事件。",
      "这是误报，不是坏事发生。",
      "我可以不喜欢这种感觉，但我仍然安全。",
      "恐慌来自过去的经验，不是此刻的威胁。",
      "它不是攻击我，只是想保护我。",
      "恐慌看似强烈，但无法伤害我。",
      "我越理解，它越快离开。",
      "注意脚底，我会感觉更稳。",
      "缓慢吸气、缓慢吐气，我会降下来。",
      "我的身体正在从警报切换到安全。",
      "接受恐慌的存在，反而让它更快消退。",
      "我不需要压住它，让它自然流过。",
      "恐慌是一阵风，不会长久停留。",
      "放松肩膀，我的紧绷会下降。",
      "身体比我想象地更快恢复。",
      "这次恐慌来了，我还是撑住了。",
      "我证明了自己比恐慌更强。",
      "我正在学会与这种感觉共存。",
      "我不是恐慌，我只是经历恐慌。",
      "每次平稳下来，都在训练神经系统更坚韧。",
      "我已经在变得有力量。",
      "我不是被困住，我正在成长。",
      "恐慌每次来，我都能处理，我已经做到了。"
    ]
  },
  worry: {
    title: "担心",
    reminders: [
      "我现在是在预想未来，而不是应对现实。",
      "大脑正在播放最坏版本，这是正常的。",
      "担心是大脑的保护机制，不是惩罚。",
      "我注意到自己想太多了，这是第一步。",
      "担心是一种感觉，不是事实。",
      "我现在很紧张，但我仍然安全。",
      "这是大脑忙过头了，不是我做错了。",
      "想法只是想法，不是结局。",
      "我担心的是不确定性，不是事情本身。",
      "累的时候，大脑会自动想坏的。",
      "担心代表我在乎，而不是失败。",
      "我的想象比现实可怕很多。",
      "担心无法改变结果，只会消耗我。",
      "我不是不够好，我只是太紧绷。",
      "担心说明我有责任感。",
      "能觉察担心，就是成熟的征兆。",
      "我不需要一次解决全部，只需先稳住自己。",
      "将注意力放回身体，我会清晰一些。",
      "把想法写下来，杂音会变少。",
      "暂停三秒深呼吸，担心感会下降。",
      "不是每个想法都值得相信。",
      "我可以选择暂时不跟随这些念头。",
      "一步一步来才是最有效的方式。",
      "给自己一些空间，大脑自然会安静。",
      "我已经开始能分辨想法与事实。",
      "大脑不再那么容易把我带向最坏的方向。",
      "担心不能控制我，我有选择。",
      "我能停下来，就是力量的表现。",
      "每一次减少一点担心都是成长。",
      "我越来越信任自己了。",
      "不需要完美，我已经做得很好。",
      "我值得更轻松的生活，而我正在走向那里。"
    ]
  },
  negative: {
    title: "负面",
    reminders: [
      "我现在的心情比较暗，不代表我这个人不好。",
      "负面情绪只是疲劳的信号。",
      "我不是变差了，只是消耗过多。",
      "我能察觉到这种低落，是觉醒。",
      "负面情绪不等于负能量，它只是需要被看见。",
      "我并非失控，只是有点撑不住。",
      "负面想法出现很正常。",
      "情绪变重也不是我的错。",
      "我不是悲观，只是累了。",
      "大脑在低能量时容易放大负面的部分。",
      "负面想法不是事实，只是状态。",
      "我在乎的越多，负面越强烈。",
      "我是在保护自己，而不是逃避。",
      "负面情绪提醒我需要休息。",
      "我并不是一个负面的人。",
      "情绪低，不代表我的人生低。",
      "先停一下，我不需要硬撑。",
      "一点点呼吸，会帮我从混乱回到安稳。",
      "我可以把注意放在身体，而不是想法。",
      "我允许负面存在，它就会慢慢变轻。",
      "现在只需要照顾自己，而不是修复世界。",
      "放下评判，我会轻一些。",
      "我已经努力很久了，可以休息一下。",
      "慢下来，是一种力量。",
      "我的负面来自消耗，而不是失败。",
      "我正在学习与情绪共处，而不是被它吞没。",
      "阴天不会抹掉我的价值。",
      "我的恢复能力比我想象更强。",
      "我正在长成一个能容纳情绪的人。",
      "我值得被理解，也值得被善待。",
      "负面终会过去，我会重新亮起来。",
      "即使现在这样，我依然值得被爱。"
    ]
  },
  fear: {
    title: "恐惧",
    reminders: [
      "我现在的害怕是正常的生存本能。",
      "恐惧是一种保护，而不是失败。",
      "我觉得自己害怕，是因为我在乎。",
      "我能察觉恐惧，这已经是开始。",
      "害怕不代表我软弱。",
      "恐惧出现，并不意味着我做不到。",
      "有些事情本来就会让人紧张。",
      "我不是一个人，很多人也会怕。",
      "我的恐惧来自不确定，不是无能。",
      "想得越多，恐惧越大很正常。",
      "恐惧通常比真实情况夸张许多。",
      "害怕说明我准备迈向新的领域。",
      "我不是逃避，我是在寻找安全感。",
      "恐惧不会决定结果。",
      "别把恐惧当成事实，它只是感觉。",
      "它来是为了提醒我，而不是阻止我。",
      "我不需要一次跨很大，只要一步。",
      "恐惧可以与行动共存。",
      "慢一点，我会更有力气面对。",
      "把恐惧说出来，它就不再那么大。",
      "我越允许它存在，它越不会主导我。",
      "深呼吸是瓦解恐惧的第一步。",
      "我不需要证明，只需要前进一点点。",
      "安全来自我的节奏，而不是速度。",
      "我正在练习在害怕中前进，这很不容易。",
      "我每迈出一次，都在变更强。",
      "恐惧不会消失，但我会越来越稳。",
      "我比自己以为的更勇敢。",
      "我允许自己紧张，却仍选择行动，这就是勇气。",
      "我正在扩大自己的能力范围。",
      "恐惧不会定义我，选择会。",
      "我已经不是以前那个人，我正在成长。"
    ]
  },
  irritable: {
    title: "烦躁",
    reminders: [
      "我现在的烦是累积太多的信号。",
      "烦躁只是满载，而不是坏脾气。",
      "我的身体在说够了。",
      "我能察觉不耐，这是好事。",
      "烦代表我需要空间，而不是问题。",
      "我不是故意凶，是被压得太满。",
      "烦躁只是一种情绪，不是性格。",
      "很多事情同时发生时，烦是正常反应。",
      "我的烦来自长期压抑，而不是突然爆发。",
      "我不是小题大做，我只是累了。",
      "烦躁通常是界限被突破太多次。",
      "不是我不好，是事情太密集。",
      "烦是一种保护机制，提醒我休息。",
      "我需要的不是责怪，而是松一点。",
      "烦并不代表我失控。",
      "烦是需要，而不是缺点。",
      "深呼吸能让烦减掉一半。",
      "离开一下，我会恢复得快很多。",
      "我可以把注意从外界拉回自己。",
      "允许自己暂停，哪怕 1 分钟。",
      "我现在最需要的是放松，而不是忍耐。",
      "松开肩膀，我会轻一点。",
      "不回应，是一种保护，而不是逃避。",
      "给自己空间，情绪自然会下降。",
      "我正在学会在烦躁中保护自己。",
      "我可以在不爆炸的情况下表达我的界限。",
      "烦躁是提醒我优先照顾自己。",
      "我越来越能分辨自己的需要。",
      "我不是坏脾气，我是需要喘息。",
      "我正在变成更稳、更柔软的人。",
      "烦是成长的信号，而不是障碍。",
      "我值得被理解，也值得被放过。"
    ]
  },
  stress: {
    title: "压力",
    reminders: [
      "我现在的压力并非我的错，而是负荷太重。",
      "我感受到沉重，是因为我一直在撑。",
      "压力不是软弱，是努力太久。",
      "我能觉察压力，就是开始卸下它。",
      "我不是失败，我是太拼了。",
      "我承担的比别人看到的更多。",
      "现在的紧绷说明我需要休息。",
      "我不是情绪化，我是太累。",
      "我感受到的高压来自责任，而不是无能。",
      "我的紧绷是长期累积的，不是突然出现。",
      "我不是不够好，我只是被需要太多。",
      "压力大不代表我做得差。",
      "我想做得更好，所以才有压力。",
      "高压状态下，大脑会放大负面。",
      "我不是一个人在承受这些。",
      "压力提醒我该调整节奏了。",
      "慢一点，我的身体会更稳。",
      "深呼吸可以让压力下降。",
      "我不需要一次扛所有事情。",
      "可以先放一个小任务下来。",
      "我值得在忙碌中有一点喘息。",
      "我做的已经够多了。",
      "放松肩膀，压力就会松开一点。",
      "允许自己脆弱，是力量的一种表现。",
      "我正在学会用健康方式应对压力。",
      "我已经比以前更能调节自己。",
      "压力不会定义我，我的选择会。",
      "我正在训练自己变得更有韧性。",
      "我值得被支持，而不是被要求更多。",
      "我已经做得足够好。",
      "未来我会更轻松，因为我正在调整。",
      "我配得上一个更平衡的生活。"
    ]
  },
  powerless: {
    title: "无力",
    reminders: [
      "我现在没有力气，是正常的疲劳反应。",
      "无力不代表我不行，只代表我累了。",
      "我能觉察无力，就是力量的开端。",
      "身体和心都在向我求休息。",
      "无力不等于失败。",
      "我不需要一直有动力。",
      "我的无力说明我太久没有停下来。",
      "我值得休息，而不是责备。",
      "我的无力来自长期消耗，而不是能力不足。",
      "忙得越久，空得越深。",
      "我不是懒散，我是过度付出。",
      "动力不是一直都有的，它需要恢复。",
      "无力说明我在努力活着。",
      "我累得太久，所以提不起劲。",
      "我不需要把自己逼回状态。",
      "无力只是阶段，不是结局。",
      "我现在需要的是补能，而不是行动。",
      "慢一点，身体会回到节奏。",
      "小休息比硬撑有效得多。",
      "我可以让自己什么都不做。",
      "我不需要马上好起来。",
      "呼吸会帮我找到一点点力量。",
      "一点点恢复，就是进步。",
      "先把能量留给最重要的事。",
      "我正在学习温柔地照顾自己。",
      "我不是没动力，我正在蓄力。",
      "我会慢慢恢复，而不是永远这样。",
      "我的节奏会回来。",
      "我的价值不取决于我今天的状态。",
      "我正在成为一个懂得休息的人。",
      "无力的我，依然值得被爱。",
      "我会再次有力量，而且会更稳。"
    ]
  },
  collapse: {
    title: "崩溃",
    reminders: [
      "我现在的崩溃是一种太多了的讯号。",
      "情绪涌出来不代表我弱。",
      "我能感觉到崩溃，是因为我长期撑着。",
      "崩溃是一种释放，而不是坏事。",
      "我不是失控，我是痛太久。",
      "我的眼泪是身体在排压。",
      "崩溃说明我需要被看见。",
      "我不是一个人在撑。",
      "我崩溃不是因为小事，而是累积太多。",
      "我不是脆弱，我是承受太多太久。",
      "崩溃是一种求救信号，而不是失败。",
      "我的界限早已被压得太紧。",
      "崩溃说明我的情绪正在寻求出口。",
      "我值得被理解，而不是被要求坚强。",
      "崩溃不是终点，是调整的开端。",
      "我有权利停下来。",
      "我现在只需要呼吸，不需要解释。",
      "泪水能让身体开始恢复。",
      "允许自己慢慢来，我会稳住。",
      "我不需要马上振作。",
      "给自己一点时间，我会看得更清楚。",
      "抱住自己，我会感觉安全一点。",
      "先把自己放在第一位。",
      "稍微稳一点，就是进步。",
      "我正在从崩溃中重建，这需要勇气。",
      "我不是破碎，我在重整。",
      "每次崩溃之后，我都会变得更懂自己。",
      "我值得一个更温柔的生活。",
      "我正在学习倾听自己的需要。",
      "我会变得更稳，而不是更脆弱。",
      "崩溃会过去，我会继续前进。",
      "我值得被抱住、被理解、被支持。"
    ]
  },
  loss: {
    title: "失落",
    reminders: [
      "我现在的心凉，是正常的情绪反应。",
      "失落不是我做错了什么。",
      "我之所以失落，是因为我在乎。",
      "我能感受到失落，是因为我有期待。",
      "心沉下去，是身体在说我需要安静。",
      "我不是变差，只是有点伤。",
      "失落不等于失败。",
      "有情绪的人，才会失落。",
      "我的失落来自意义，而不是问题。",
      "期待没被回应会让人痛，这是正常的。",
      "我不是玻璃心，我是太真诚。",
      "失落说明我仍然对生活有盼望。",
      "我不是无能，只是希望太重。",
      "我的感受值得被认真对待。",
      "失落不是坏事，是整理的开始。",
      "我不是孤单，我只是心凉了一下。",
      "先让情绪落地，我会更稳。",
      "缓一点，我会感觉自己慢慢回来。",
      "我可以允许自己难过，而不是压住。",
      "深呼吸能让心慢慢暖起来。",
      "我不需要马上积极。",
      "我有资格停下来照顾自己。",
      "先找回一点点能量，而不是强撑。",
      "我的节奏，刚刚好。",
      "我正在学习在失落中找到自己。",
      "我的心会逐渐变得更柔软、更清晰。",
      "失落不是结局，而是调整方向。",
      "我在成为一个更懂自己的大人。",
      "我的价值从来不靠结果决定。",
      "我会重新亮起来，比之前更稳。",
      "有失落的人，也能有很好的未来。",
      "我值得被理解，也值得被温柔以待。"
    ]
  }
};

const EMOTION_TYPES = Object.keys(emotionReminders);
const REMINDERS_PER_EMOTION = 32;

// Preset warm female voice (Sarah from ElevenLabs)
const PRESET_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body - support single emotion type generation
    const body = await req.json().catch(() => ({}));
    const targetEmotionType = body.emotionType as string | undefined;

    // Check if user has a cloned voice
    const { data: voiceClone } = await supabase
      .from('user_voice_clones')
      .select('elevenlabs_voice_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const voiceIdToUse = voiceClone?.elevenlabs_voice_id || PRESET_VOICE_ID;

    // Determine which emotion to generate
    let emotionToGenerate: string | null = null;

    if (targetEmotionType) {
      // Specific emotion requested
      if (!EMOTION_TYPES.includes(targetEmotionType)) {
        throw new Error(`Invalid emotion type: ${targetEmotionType}`);
      }
      emotionToGenerate = targetEmotionType;
    } else {
      // Auto-detect next incomplete emotion
      for (const emotionType of EMOTION_TYPES) {
        const { count } = await serviceSupabase
          .from('user_voice_recordings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('emotion_type', emotionType)
          .eq('is_ai_generated', true);
        
        if ((count || 0) < REMINDERS_PER_EMOTION) {
          emotionToGenerate = emotionType;
          console.log(`Found incomplete emotion: ${emotionType} (${count || 0}/${REMINDERS_PER_EMOTION})`);
          break;
        }
      }
    }

    if (!emotionToGenerate) {
      // All emotions complete - calculate total
      let totalGenerated = 0;
      for (const et of EMOTION_TYPES) {
        const { count } = await serviceSupabase
          .from('user_voice_recordings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('emotion_type', et)
          .eq('is_ai_generated', true);
        totalGenerated += (count || 0);
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: 'All emotions already generated',
        allComplete: true,
        emotionType: null,
        generated: 0,
        total: REMINDERS_PER_EMOTION,
        totalGenerated,
        totalReminders: EMOTION_TYPES.length * REMINDERS_PER_EMOTION
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const emotionConfig = emotionReminders[emotionToGenerate];
    const reminders = emotionConfig.reminders;

    console.log(`Generating ${emotionToGenerate} (${emotionConfig.title}) for user ${user.id}`);

    // Check which reminders already exist for this emotion
    const { data: existingRecordings } = await serviceSupabase
      .from('user_voice_recordings')
      .select('reminder_index')
      .eq('user_id', user.id)
      .eq('emotion_type', emotionToGenerate)
      .eq('is_ai_generated', true);

    const existingIndices = new Set((existingRecordings || []).map(r => r.reminder_index));
    
    let successCount = existingIndices.size;
    const errors: string[] = [];

    console.log(`${emotionToGenerate}: ${existingIndices.size}/${REMINDERS_PER_EMOTION} already exist`);

    // Generate remaining reminders for this emotion
    for (let i = 0; i < reminders.length; i++) {
      if (existingIndices.has(i)) {
        continue; // Skip already generated
      }

      const reminderText = reminders[i];

      try {
        // Call ElevenLabs TTS API
        const ttsResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceIdToUse}`,
          {
            method: 'POST',
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': ELEVENLABS_API_KEY,
            },
            body: JSON.stringify({
              text: reminderText,
              model_id: 'eleven_multilingual_v2',
              voice_settings: {
                stability: 0.75,
                similarity_boost: 0.75,
                style: 0.0,
                use_speaker_boost: true
              }
            }),
          }
        );

        if (!ttsResponse.ok) {
          const errorText = await ttsResponse.text();
          throw new Error(`ElevenLabs API error: ${ttsResponse.status} - ${errorText}`);
        }

        const audioBuffer = await ttsResponse.arrayBuffer();
        const audioData = new Uint8Array(audioBuffer);

        // Upload to Supabase Storage with emotion type in path
        const filePath = `${user.id}/${emotionToGenerate}/reminder_${i}.mp3`;
        
        const { error: uploadError } = await serviceSupabase.storage
          .from('voice-recordings')
          .upload(filePath, audioData, {
            contentType: 'audio/mpeg',
            upsert: true
          });

        if (uploadError) {
          throw new Error(`Storage upload error: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = serviceSupabase.storage
          .from('voice-recordings')
          .getPublicUrl(filePath);

        // Save to database with emotion_type
        const { error: dbError } = await serviceSupabase
          .from('user_voice_recordings')
          .upsert({
            user_id: user.id,
            reminder_index: i,
            reminder_text: reminderText,
            audio_url: urlData.publicUrl,
            is_ai_generated: true,
            emotion_type: emotionToGenerate
          }, {
            onConflict: 'user_id,emotion_type,reminder_index'
          });

        if (dbError) {
          throw new Error(`Database error: ${dbError.message}`);
        }

        successCount++;
        console.log(`Generated ${emotionToGenerate} reminder ${i + 1}/${REMINDERS_PER_EMOTION}`);

      } catch (error: unknown) {
        const errorMsg = `Error generating ${emotionToGenerate} reminder ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
        // Continue with next reminder instead of failing completely
      }
    }

    // Check if this emotion is now complete
    const isEmotionComplete = successCount >= REMINDERS_PER_EMOTION;
    
    // Check overall progress
    let totalGenerated = 0;
    for (const et of EMOTION_TYPES) {
      const { count } = await serviceSupabase
        .from('user_voice_recordings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('emotion_type', et)
        .eq('is_ai_generated', true);
      totalGenerated += (count || 0);
    }

    const allComplete = totalGenerated >= EMOTION_TYPES.length * REMINDERS_PER_EMOTION;

    return new Response(JSON.stringify({
      success: true,
      emotionType: emotionToGenerate,
      emotionTitle: emotionConfig.title,
      generated: successCount,
      total: REMINDERS_PER_EMOTION,
      isEmotionComplete,
      totalGenerated,
      totalReminders: EMOTION_TYPES.length * REMINDERS_PER_EMOTION,
      allComplete,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error in generate-all-reminders:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
