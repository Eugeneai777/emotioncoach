// supabase/functions/_shared/doubao-tts.ts
// Doubao (Volcengine) TTS 共享调用：V3 优先 + V1 兜底，返回 mp3 Uint8Array

async function tryV3(
  appId: string,
  accessKey: string,
  text: string,
  speaker: string,
  resourceId: string,
): Promise<{ ok: boolean; audioBase64?: string; error?: string }> {
  const resp = await fetch('https://openspeech.bytedance.com/api/v3/tts/unidirectional', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-App-Id': appId,
      'X-Api-Access-Key': accessKey,
      'X-Api-Resource-Id': resourceId,
      'X-Api-Request-Id': crypto.randomUUID(),
    },
    body: JSON.stringify({
      user: { uid: 'coach_voice_studio' },
      req_params: {
        text,
        speaker,
        audio_params: { format: 'mp3', sample_rate: 24000 },
      },
    }),
  });

  if (!resp.ok) {
    return { ok: false, error: `HTTP ${resp.status}: ${(await resp.text()).slice(0, 200)}` };
  }
  const body = await resp.text();
  const chunks: string[] = [];
  for (const line of body.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try {
      const c = JSON.parse(t);
      if (c.code === 20000000) break;
      if (c.code === 0 && c.data) chunks.push(c.data);
      if (c.code !== 0 && c.code !== 20000000) {
        return { ok: false, error: `${c.code}: ${c.message}` };
      }
    } catch { /* skip */ }
  }
  if (!chunks.length) return { ok: false, error: 'no audio chunks' };
  return { ok: true, audioBase64: chunks.join('') };
}

async function tryV1(
  appId: string,
  accessToken: string,
  text: string,
  voiceType: string,
  cluster: string,
): Promise<{ ok: boolean; audioBase64?: string; error?: string }> {
  const resp = await fetch('https://openspeech.bytedance.com/api/v1/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer;${accessToken}` },
    body: JSON.stringify({
      app: { appid: appId, token: accessToken, cluster },
      user: { uid: 'coach_voice_studio' },
      audio: { voice_type: voiceType, encoding: 'mp3', speed_ratio: 1.0, volume_ratio: 1.0, pitch_ratio: 1.0 },
      request: { reqid: crypto.randomUUID(), text, text_type: 'plain', operation: 'query', with_frontend: 1, frontend_type: 'unitTson' },
    }),
  });
  if (!resp.ok) return { ok: false, error: `HTTP ${resp.status}` };
  const result = await resp.json();
  if (result.code !== 3000) return { ok: false, error: `${result.code}: ${result.message}` };
  return { ok: true, audioBase64: result.data };
}

function base64ToUint8(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * 合成 mp3。优先 V3（bigtts 走 seed-tts-2.0 → 1.0），失败后 V1 兜底。
 * 抛错时附带 lastError 方便定位。
 */
export async function synthesizeDoubaoMp3(text: string, voiceType: string): Promise<{ mp3: Uint8Array; base64: string }> {
  const appId = Deno.env.get('DOUBAO_APP_ID');
  const accessToken = Deno.env.get('DOUBAO_ACCESS_TOKEN');
  const appKey = Deno.env.get('DOUBAO_APP_KEY');
  if (!appId || !accessToken) throw new Error('DOUBAO_APP_ID / DOUBAO_ACCESS_TOKEN 未配置');

  const isBigtts = voiceType.includes('bigtts') || voiceType.includes('mega');
  const v3Resources = isBigtts ? ['seed-tts-2.0', 'seed-tts-1.0'] : ['seed-tts-1.0'];
  const keys = [accessToken, ...(appKey && appKey !== accessToken ? [appKey] : [])];

  const attempts: Array<{ label: string; fn: () => Promise<{ ok: boolean; audioBase64?: string; error?: string }> }> = [];
  for (const k of keys) {
    for (const rid of v3Resources) {
      attempts.push({ label: `V3/${rid}/${k.slice(0, 4)}`, fn: () => tryV3(appId, k, text, voiceType, rid) });
    }
  }
  const v1Clusters = isBigtts ? ['volcano_mega_tts', 'volcano_tts'] : ['volcano_tts', 'volcano_mega_tts'];
  for (const c of v1Clusters) {
    attempts.push({ label: `V1/${c}`, fn: () => tryV1(appId, accessToken, text, voiceType, c) });
  }

  let lastError = '';
  for (const a of attempts) {
    const r = await a.fn();
    if (r.ok && r.audioBase64) {
      console.log(`[doubao-tts] ✅ ${a.label} ${voiceType}`);
      return { mp3: base64ToUint8(r.audioBase64), base64: r.audioBase64 };
    }
    lastError = `${a.label}: ${r.error?.slice(0, 120)}`;
    console.warn(`[doubao-tts] ❌ ${a.label}: ${r.error?.slice(0, 80)}`);
  }
  throw new Error(`Doubao TTS 全部失败。最后: ${lastError}`);
}
