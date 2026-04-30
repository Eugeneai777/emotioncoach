const TRADITIONAL_TO_SIMPLIFIED: Record<string, string> = {
  '謝': '谢', '時': '时', '會': '会', '聞': '闻', '國': '国', '這': '这',
  '為': '为', '與': '与', '還': '还', '後': '后', '說': '说', '話': '话',
  '語': '语', '轉': '转', '換': '换', '輸': '输', '識': '识', '別': '别',
  '個': '个', '們': '们', '來': '来', '過': '过', '對': '对', '開': '开',
  '關': '关', '點': '点', '擊': '击', '頁': '页', '面': '面', '簡': '简',
  '報': '报', '課': '课', '程': '程', '觀': '观', '看': '看', '應': '应',
  '該': '该', '現': '现', '邏': '逻', '輯': '辑', '功': '功', '能': '能',
  '響': '响', '優': '优', '化': '化', '設': '设', '計': '计', '發': '发',
  '動': '动', '態': '态', '顯': '显', '示': '示', '內': '内', '容': '容',
  '長': '长', '經': '经', '歷': '历', '問': '问', '題': '题',
  '學': '学', '習': '习', '實': '实', '測': '测', '試': '试', '數': '数',
  '據': '据', '庫': '库', '寫': '写', '讀': '读', '圖': '图', '標': '标',
  '選': '选', '項': '项', '鈕': '钮', '廣': '广', '場': '场', '壓': '压',
  '難': '难', '親': '亲', '覺': '觉', '察': '察', '理': '理',
  '變': '变', '帶': '带', '著': '着', '麼': '么',
  '樣': '样', '裡': '里', '裏': '里', '氣': '气', '從': '从', '讓': '让',
  '很': '很', '務': '务', '區': '区', '體': '体', '驗': '验', '線': '线',
  '統': '统', '產': '产', '業': '业', '買': '买', '賣': '卖', '價': '价',
  '額': '额', '歲': '岁', '萬': '万', '幫': '帮', '嗎': '吗',
  '呢': '呢', '啟': '启', '錄': '录', '戶': '户', '專': '专', '層': '层',
  '獲': '获', '權': '权', '證': '证', '認': '认', '準': '准', '備': '备',
  '處': '处', '復': '复', '複': '复', '雜': '杂', '單': '单', '義': '义',
  '風': '风', '險': '险', '醫': '医', '師': '师', '愛': '爱', '兒': '儿',
  '媽': '妈', '寶': '宝', '樂': '乐', '頂': '顶', '級': '级', '儲': '储',
  '調': '调', '查': '查', '夠': '够', '並': '并', '啓': '启', '總': '总',
  '嗎': '吗', '隨': '随', '機': '机', '斷': '断', '續': '续', '連': '连',
  '聽': '听', '雖': '虽', '傷': '伤', '煩': '烦', '憂': '忧', '慮': '虑',
  '壞': '坏', '傳': '传', '達': '达', '記': '记', '憶': '忆', '聲': '声',
  '夢': '梦', '壓': '压', '慣': '惯', '鬱': '郁', '沖': '冲', '穩': '稳',
};

export const normalizeToSimplifiedChinese = (text: string): string => {
  if (!text) return text;
  return Array.from(text).map((char) => TRADITIONAL_TO_SIMPLIFIED[char] ?? char).join('');
};

const KOREAN_RE = /[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/;
const CJK_RE = /[\u3400-\u9fff]/g;
const LATIN_RE = /[A-Za-z]/g;
const MEANINGFUL_PUNCT_RE = /[，。！？、,.!?]/g;

const COMMON_NOISE_TRANSCRIPTS = new Set([
  '谢谢观看',
  '感谢观看',
  '下个视频见',
  '再见',
  '拜拜',
  '字幕由',
  '优优独播剧场',
  '请不吝点赞订阅转发打赏支持明镜与点点栏目',
]);

const stripCaptionNoise = (text: string): string => {
  return text
    .replace(/字幕[：:]?.*$/g, '')
    .replace(/本字幕由.*$/g, '')
    .replace(/请不吝.*$/g, '')
    .replace(/谢谢观看[，,。！!\s]*(下个视频见|再见)?/g, '')
    .replace(/感谢观看[，,。！!\s]*(下个视频见|再见)?/g, '')
    .trim();
};

export interface VoiceTranscriptNormalizationResult {
  text: string;
  dropped: boolean;
  reason?: 'empty' | 'korean' | 'latin_noise' | 'caption_noise' | 'symbol_noise' | 'too_short_noise';
}

export const normalizeVoiceTranscript = (
  rawText: string,
  role: 'user' | 'assistant'
): VoiceTranscriptNormalizationResult => {
  const simplified = normalizeToSimplifiedChinese(rawText || '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!simplified) return { text: '', dropped: true, reason: 'empty' };

  if (role === 'assistant') {
    return { text: simplified, dropped: false };
  }

  const withoutCaptionNoise = stripCaptionNoise(simplified);
  if (!withoutCaptionNoise) return { text: '', dropped: true, reason: 'caption_noise' };

  const compact = withoutCaptionNoise.replace(/\s+/g, '');
  if (COMMON_NOISE_TRANSCRIPTS.has(compact)) {
    return { text: '', dropped: true, reason: 'caption_noise' };
  }

  const cjkCount = (withoutCaptionNoise.match(CJK_RE) || []).length;
  const latinCount = (withoutCaptionNoise.match(LATIN_RE) || []).length;
  const punctCount = (withoutCaptionNoise.match(MEANINGFUL_PUNCT_RE) || []).length;
  const visibleLength = Array.from(withoutCaptionNoise.replace(/\s/g, '')).length;

  if (KOREAN_RE.test(withoutCaptionNoise) && cjkCount === 0) {
    return { text: '', dropped: true, reason: 'korean' };
  }

  if (KOREAN_RE.test(withoutCaptionNoise) && cjkCount < 4) {
    return { text: '', dropped: true, reason: 'korean' };
  }

  if (cjkCount === 0 && latinCount > 0 && visibleLength <= 24) {
    return { text: '', dropped: true, reason: 'latin_noise' };
  }

  if (cjkCount === 0 && latinCount === 0 && punctCount === 0) {
    return { text: '', dropped: true, reason: 'symbol_noise' };
  }

  if (cjkCount > 0 && cjkCount <= 1 && visibleLength <= 2) {
    return { text: '', dropped: true, reason: 'too_short_noise' };
  }

  return { text: withoutCaptionNoise, dropped: false };
};