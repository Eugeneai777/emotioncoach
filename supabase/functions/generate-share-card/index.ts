import satori from 'npm:satori@0.12.0';
import QRCode from 'npm:qrcode@1.5.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Static characters used in card templates - MUST include every Chinese character used in all card templates
const STATIC_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz /:?，·()刚完成了AI财富心理测评卡点觉醒指数反应模式包含个真实场景深度智能分析行为情绪信念三层专属突破路径与动建议扫码体验你的诊断免费让自由从认识己开始有劲高逐步初起嘴穷手眼心追逐和谐逃避创伤型探索者之旅解读语音对总觉得赚钱很难找到破局方案给一码启';

// Font cache
const fontCache = new Map<string, ArrayBuffer>();

async function loadFont(extraChars: string, weight: number): Promise<ArrayBuffer> {
  const allChars = [...new Set(STATIC_CHARS + extraChars)].join('');
  const cacheKey = `font-${weight}-${allChars.length}`;
  if (fontCache.has(cacheKey)) return fontCache.get(cacheKey)!;

  const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@${weight}&text=${encodeURIComponent(allChars)}`;
  
  const cssResp = await fetch(url);
  const css = await cssResp.text();

  const match = css.match(/url\(([^)]+)\)\s*format\('woff2'\)/);
  if (!match) {
    const fallback = css.match(/url\(([^)]+)\)/);
    if (!fallback) throw new Error(`Font URL not found for weight ${weight}`);
    const fontResp = await fetch(fallback[1]);
    const data = await fontResp.arrayBuffer();
    fontCache.set(cacheKey, data);
    return data;
  }

  const fontResp = await fetch(match[1]);
  const data = await fontResp.arrayBuffer();
  fontCache.set(cacheKey, data);
  return data;
}

async function generateQRDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { width: 160, margin: 1 });
}

async function fetchImageBase64(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return null;
    const buffer = await resp.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const contentType = resp.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${btoa(binary)}`;
  } catch {
    return null;
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

const patternNames: Record<string, string> = {
  chase: '追逐型', chasing: '追逐型',
  harmony: '和谐型', harmonize: '和谐型',
  avoid: '逃避型', avoiding: '逃避型',
  trauma: '创伤型', freezing: '创伤型',
};

const poorNames: Record<string, string> = {
  mouth: '嘴穷', hand: '手穷', eye: '眼穷', heart: '心穷',
};

function createWealthCard(data: any, qrDataUrl: string, avatarBase64: string | null): any {
  const { healthScore = 65, reactionPattern = 'chase', displayName = '财富探索者' } = data;
  const patternName = patternNames[reactionPattern] || reactionPattern;
  const scoreColor = getScoreColor(healthScore);

  const avatarNode = avatarBase64
    ? { type: 'img', props: { src: avatarBase64, width: 48, height: 48, style: { borderRadius: '50%', border: '2px solid rgba(251,191,35,0.5)' } } }
    : {
        type: 'div', props: {
          style: { width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #fbbf24, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
          children: { type: 'span', props: { style: { color: '#fff', fontSize: 20, fontWeight: 700 }, children: (displayName || '财')[0] } },
        },
      };

  const valuePoints = [
    { marker: '▸', text: '30个真实财富场景深度测评' },
    { marker: '▸', text: 'AI智能分析行为/情绪/信念三层' },
    { marker: '▸', text: '专属突破路径与行动建议' },
  ];

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex', flexDirection: 'column', width: 340,
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
        borderRadius: 16, overflow: 'hidden', fontFamily: 'Noto Sans SC',
      },
      children: [
        {
          type: 'div', props: {
            style: { display: 'flex', flexDirection: 'column', padding: '20px 20px 16px' },
            children: [
              // User row
              {
                type: 'div', props: {
                  style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
                  children: [
                    avatarNode,
                    {
                      type: 'div', props: {
                        style: { display: 'flex', flexDirection: 'column' },
                        children: [
                          { type: 'span', props: { style: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 500 }, children: displayName } },
                          { type: 'span', props: { style: { color: 'rgba(252,211,77,0.8)', fontSize: 12 }, children: '刚完成了AI财富心理测评' } },
                        ],
                      },
                    },
                  ],
                },
              },
              // Title
              {
                type: 'div', props: {
                  style: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 },
                  children: [
                    { type: 'span', props: { style: { color: '#fff', fontWeight: 700, fontSize: 22 }, children: '财富卡点测评' } },
                    { type: 'span', props: { style: { color: 'rgba(196,181,253,0.7)', fontSize: 12 }, children: 'Powered by 有劲AI' } },
                  ],
                },
              },
              // Score section
              {
                type: 'div', props: {
                  style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, marginBottom: 20 },
                  children: [
                    {
                      type: 'div', props: {
                        style: { display: 'flex', flexDirection: 'column' },
                        children: [
                          { type: 'span', props: { style: { color: 'rgba(255,255,255,0.6)', fontSize: 12 }, children: '我的觉醒指数' } },
                          {
                            type: 'div', props: {
                              style: { display: 'flex', alignItems: 'baseline', gap: 4 },
                              children: [
                                { type: 'span', props: { style: { fontSize: 32, fontWeight: 700, color: scoreColor }, children: String(healthScore) } },
                                { type: 'span', props: { style: { color: 'rgba(255,255,255,0.4)', fontSize: 14 }, children: '/100' } },
                              ],
                            },
                          },
                        ],
                      },
                    },
                    {
                      type: 'div', props: {
                        style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
                        children: [
                          { type: 'span', props: { style: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 }, children: '反应模式' } },
                          { type: 'span', props: { style: { padding: '4px 12px', background: 'rgba(245,158,11,0.3)', borderRadius: 20, color: '#fcd34d', fontSize: 14, fontWeight: 500 }, children: patternName } },
                        ],
                      },
                    },
                  ],
                },
              },
              // Value points
              {
                type: 'div', props: {
                  style: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 },
                  children: [
                    { type: 'span', props: { style: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 500 }, children: '测评包含' } },
                    ...valuePoints.map(p => ({
                      type: 'div',
                      props: {
                        style: { display: 'flex', alignItems: 'center', gap: 8 },
                        children: [
                          { type: 'span', props: { style: { color: '#fbbf24', fontSize: 14 }, children: p.marker } },
                          { type: 'span', props: { style: { color: 'rgba(255,255,255,0.9)', fontSize: 14 }, children: p.text } },
                        ],
                      },
                    })),
                  ],
                },
              },
              // QR section
              {
                type: 'div', props: {
                  style: {
                    display: 'flex', alignItems: 'center', gap: 16,
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(249,115,22,0.2))',
                    borderRadius: 12, padding: 16, border: '1px solid rgba(245,158,11,0.3)',
                  },
                  children: [
                    {
                      type: 'div', props: {
                        style: { display: 'flex', flexDirection: 'column', flex: 1 },
                        children: [
                          { type: 'span', props: { style: { color: '#fff', fontWeight: 500, fontSize: 14, marginBottom: 2 }, children: '扫码体验专属你的' } },
                          { type: 'span', props: { style: { color: '#fcd34d', fontWeight: 700, fontSize: 16 }, children: 'AI财富心理诊断' } },
                          { type: 'span', props: { style: { color: 'rgba(252,211,77,0.7)', fontSize: 12, marginTop: 8 }, children: '免费测评你的财富卡点' } },
                        ],
                      },
                    },
                    {
                      type: 'div', props: {
                        style: { width: 80, height: 80, borderRadius: 8, background: '#fff', padding: 6, display: 'flex' },
                        children: { type: 'img', props: { src: qrDataUrl, width: 68, height: 68 } },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        // Footer
        {
          type: 'div', props: {
            style: { display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', padding: '12px 20px' },
            children: { type: 'span', props: { style: { color: 'rgba(196,181,253,0.5)', fontSize: 12 }, children: '有劲AI · 让财富自由从认识自己开始' } },
          },
        },
      ],
    },
  };
}

/**
 * wealth-info card: Pure promotional card with QR code, NO personal assessment results.
 */
function createWealthInfoCard(qrDataUrl: string): any {
  const features = [
    '总觉得赚钱很难？找到你的财富卡点',
    '行为·情绪·信念 三层深度扫描',
    'AI一对一解读，给你专属破局方案',
  ];

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex', flexDirection: 'column', width: 340,
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
        borderRadius: 16, overflow: 'hidden', fontFamily: 'Noto Sans SC',
      },
      children: [
        // Main content
        {
          type: 'div', props: {
            style: { display: 'flex', flexDirection: 'column', padding: '28px 24px 20px', alignItems: 'center' },
            children: [
              // Decorative header
              { type: 'span', props: { style: { color: 'rgba(252,211,77,0.6)', fontSize: 12, letterSpacing: 4, marginBottom: 12 }, children: '财富觉醒之旅' } },
              // Title
              { type: 'span', props: { style: { color: '#fff', fontWeight: 700, fontSize: 24, marginBottom: 4 }, children: 'AI财富卡点测评' } },
              { type: 'span', props: { style: { color: 'rgba(196,181,253,0.7)', fontSize: 12, marginBottom: 24 }, children: 'Powered by 有劲AI' } },
              // Feature list
              {
                type: 'div', props: {
                  style: { display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginBottom: 24 },
                  children: features.map(text => ({
                    type: 'div',
                    props: {
                      style: { display: 'flex', alignItems: 'center', gap: 10 },
                      children: [
                        { type: 'div', props: { style: { width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', flexShrink: 0 } } },
                        { type: 'span', props: { style: { color: 'rgba(255,255,255,0.9)', fontSize: 15 }, children: text } },
                      ],
                    },
                  })),
                },
              },
              // QR section
              {
                type: 'div', props: {
                  style: {
                    display: 'flex', alignItems: 'center', gap: 16, width: '100%',
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(249,115,22,0.2))',
                    borderRadius: 12, padding: 16, border: '1px solid rgba(245,158,11,0.3)',
                  },
                  children: [
                    {
                      type: 'div', props: {
                        style: { display: 'flex', flexDirection: 'column', flex: 1 },
                        children: [
                          { type: 'span', props: { style: { color: '#fff', fontWeight: 600, fontSize: 15 }, children: '扫码开启你的' } },
                          { type: 'span', props: { style: { color: '#fcd34d', fontWeight: 700, fontSize: 17, marginTop: 2 }, children: '财富觉醒之旅' } },
                        ],
                      },
                    },
                    {
                      type: 'div', props: {
                        style: { width: 80, height: 80, borderRadius: 8, background: '#fff', padding: 6, display: 'flex' },
                        children: { type: 'img', props: { src: qrDataUrl, width: 68, height: 68 } },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        // Footer
        {
          type: 'div', props: {
            style: { display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', padding: '12px 20px' },
            children: { type: 'span', props: { style: { color: 'rgba(196,181,253,0.5)', fontSize: 12 }, children: '有劲AI · 让财富自由从认识自己开始' } },
          },
        },
      ],
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cardType = 'wealth-assessment', data } = await req.json();
    const partnerCode = data.partnerCode;

    const shareUrl = partnerCode
      ? `https://wechat.eugenewe.net/wealth-block?ref=${partnerCode}`
      : 'https://wechat.eugenewe.net/wealth-block';

    if (cardType === 'wealth-info') {
      // Pure info card - no personal data needed
      const [qrDataUrl, fontRegular, fontBold] = await Promise.all([
        generateQRDataUrl(shareUrl),
        loadFont('', 400),
        loadFont('', 700),
      ]);

      const cardMarkup = createWealthInfoCard(qrDataUrl);

      const svg = await satori(cardMarkup, {
        width: 340,
        fonts: [
          { name: 'Noto Sans SC', data: fontRegular, weight: 400, style: 'normal' as const },
          { name: 'Noto Sans SC', data: fontBold, weight: 700, style: 'normal' as const },
        ],
      });

      return new Response(svg, {
        headers: { ...corsHeaders, 'Content-Type': 'image/svg+xml' },
      });
    }

    // Default: wealth-assessment card
    const displayName = data.displayName || '财富探索者';
    const extraChars = displayName + (patternNames[data.reactionPattern] || '') + (poorNames[data.dominantPoor] || '');

    const [qrDataUrl, avatarBase64, fontRegular, fontBold] = await Promise.all([
      generateQRDataUrl(shareUrl),
      data.avatarUrl ? fetchImageBase64(data.avatarUrl) : Promise.resolve(null),
      loadFont(extraChars, 400),
      loadFont(extraChars, 700),
    ]);

    const cardMarkup = createWealthCard(data, qrDataUrl, avatarBase64);

    const svg = await satori(cardMarkup, {
      width: 340,
      fonts: [
        { name: 'Noto Sans SC', data: fontRegular, weight: 400, style: 'normal' as const },
        { name: 'Noto Sans SC', data: fontBold, weight: 700, style: 'normal' as const },
      ],
    });

    return new Response(svg, {
      headers: { ...corsHeaders, 'Content-Type': 'image/svg+xml' },
    });
  } catch (error) {
    console.error('[generate-share-card] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
