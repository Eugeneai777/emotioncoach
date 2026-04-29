import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_BASE_URL = Deno.env.get("OPENAI_PROXY_URL") || "https://api.openai.com";
const OPENAI_IMAGE_MODEL = Deno.env.get("OPENAI_IMAGE_MODEL") || "gpt-image-2";

const sizeMap: Record<string, string> = {
  "9:16": "1024x1536",
  "16:9": "1536x1024",
  "1:1": "1024x1024",
};

const styleMap: Record<string, string> = {
  cyberpunk: "cinematic cyberpunk, neon city, high contrast lighting, futuristic details",
  anime: "premium Japanese anime short drama style, clean line art, expressive faces, cinematic lighting",
  chinese: "modern Chinese visual style, refined oriental atmosphere, cinematic ink-inspired color grading",
  realistic: "high-end realistic 3D cinematic short drama style, natural skin, film still lighting",
  comic: "American graphic novel style, bold composition, dramatic contrast, crisp details",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildPrompt(input: any) {
  const characters = Array.isArray(input.characters) ? input.characters : [];
  const scene = input.scene || {};
  const characterBible = characters
    .map((char: any, index: number) => {
      const ref = char.referenceImageUrl ? ` Reference image URL: ${char.referenceImageUrl}.` : "";
      return `${index + 1}. ${char.name || "Character"}: ${char.description || ""}\nVisual lock: ${char.imagePrompt || ""}.${ref}`;
    })
    .join("\n\n");

  const referenceUrls = Array.isArray(input.referenceImageUrls)
    ? input.referenceImageUrls.filter((url: unknown) => typeof url === "string" && url.startsWith("http"))
    : [];

  return `Create one production-ready image for a vertical short-drama storyboard frame using GPT Image 2.0.

Series title: ${input.title || "Untitled short drama"}
Fixed visual style: ${styleMap[input.style] || input.style || styleMap.anime}
Aspect ratio: ${input.aspectRatio || "9:16"}

SERIES VISUAL BIBLE:
- Keep the same art style, color palette, lighting language, lens quality, and character proportions across every frame.
- Use cinematic short-drama composition with strong emotional tension.
- Keep faces, age, hairstyle, outfit, body type, recognizable props, and identity consistent with the character bible.
- No text, no subtitles, no logos, no watermarks, no UI elements.

CHARACTER BIBLE:
${characterBible || "No named characters provided. Keep all visible people consistent with the scene prompt."}

REFERENCE CONTINUITY:
${referenceUrls.length > 0 ? referenceUrls.map((url, i) => `Reference ${i + 1}: ${url}`).join("\n") : "No previous reference image. Establish the canonical look for this series."}

CURRENT SCENE:
Scene number: ${scene.sceneNumber || input.sceneNumber || "unknown"}
Shot type: ${scene.panel || "cinematic medium shot"}
Action: ${scene.characterAction || ""}
Dialogue/emotion context: ${scene.dialogue || ""}
Image prompt from script: ${scene.imagePrompt || input.prompt || ""}

NEGATIVE CONSISTENCY RULES:
Do not change any established face, age, hairstyle, outfit, body shape, color palette, art style, or identity. Do not add random extra main characters. Do not include readable text.`;
}

async function fetchReferenceImages(urls: string[]) {
  const files: Blob[] = [];
  for (const url of urls.slice(0, 3)) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const blob = await res.blob();
      if (blob.type.startsWith("image/")) files.push(blob);
    } catch (e) {
      console.warn("reference image fetch failed", e);
    }
  }
  return files;
}

async function callOpenAIImage(prompt: string, aspectRatio: string, referenceUrls: string[]) {
  const size = sizeMap[aspectRatio] || sizeMap["9:16"];
  const refs = await fetchReferenceImages(referenceUrls);

  if (refs.length > 0) {
    const form = new FormData();
    form.append("model", OPENAI_IMAGE_MODEL);
    form.append("prompt", prompt);
    form.append("size", size);
    for (const [index, blob] of refs.entries()) {
      form.append("image", blob, `reference-${index + 1}.png`);
    }

    const editResponse = await fetch(`${OPENAI_BASE_URL}/v1/images/edits`, {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: form,
    });

    if (editResponse.ok) {
      const data = await editResponse.json();
      const b64 = data.data?.[0]?.b64_json;
      if (b64) return b64;
    } else {
      const text = await editResponse.text();
      console.warn("OpenAI image edit failed, falling back to generation:", editResponse.status, text);
      if (editResponse.status === 429) throw new Error("AI 请求频率超限，请稍后重试");
      if (editResponse.status === 402) throw new Error("AI 额度不足，请充值后重试");
    }
  }

  const response = await fetch(`${OPENAI_BASE_URL}/v1/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_IMAGE_MODEL,
      prompt,
      size,
      n: 1,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("OpenAI image generation error:", response.status, text);
    if (response.status === 429) throw new Error("AI 请求频率超限，请稍后重试");
    if (response.status === 402) throw new Error("AI 额度不足，请充值后重试");
    throw new Error(`GPT Image 2.0 生成失败：${response.status}`);
  }

  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("GPT Image 2.0 未返回图片数据");
  return b64;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const input = await req.json();
    if (!input.scene && input.action !== "character_reference") {
      return jsonResponse({ error: "缺少分镜 scene 参数" }, 400);
    }

    const prompt = buildPrompt(input);
    const referenceImageUrls = [
      ...(Array.isArray(input.characterReferenceUrls) ? input.characterReferenceUrls : []),
      ...(Array.isArray(input.referenceImageUrls) ? input.referenceImageUrls : []),
    ].filter((url: unknown) => typeof url === "string" && url.startsWith("http"));

    const b64 = await callOpenAIImage(prompt, input.aspectRatio || "9:16", referenceImageUrls);
    const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const safeTitle = String(input.title || "drama").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 36) || "drama";
    const sceneNum = input.scene?.sceneNumber || input.sceneNumber || Date.now();
    const filePath = `drama-scenes/${safeTitle}/${Date.now()}-scene-${sceneNum}.png`;

    const { error: uploadError } = await supabase.storage
      .from("public-share-images")
      .upload(filePath, binary, { contentType: "image/png", upsert: false });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error("图片上传失败");
    }

    const { data: urlData } = supabase.storage.from("public-share-images").getPublicUrl(filePath);

    return jsonResponse({ imageUrl: urlData.publicUrl, prompt, model: OPENAI_IMAGE_MODEL });
  } catch (e) {
    console.error("drama-scene-image-openai error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "图片生成失败" }, 500);
  }
});
