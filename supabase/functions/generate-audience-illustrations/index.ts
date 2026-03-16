import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LINE_ART_STYLE = "minimalist single-color line art sketch on a transparent/white background, thin elegant strokes, no fill colors, no shading, simple and clean, suitable as a small icon or card decoration";

const AUDIENCE_PROMPTS: Record<string, string> = {
  // === 人群入口 (warm flat style) ===
  mama: "Generate a flat-style illustration for a mental health mini-program card: a gentle mother holding a baby, soft pink and warm tones, minimalist cute style, no text, no real faces, square composition, suitable for a mobile card thumbnail. Warm pastel color palette.",
  workplace: "Generate a flat-style illustration for a mental health mini-program card: a person sitting at a desk with a laptop, taking a deep breath with eyes closed, soft blue and indigo tones, minimalist style, no text, no real faces, square composition, suitable for a mobile card thumbnail.",
  couple: "Generate a flat-style illustration for a mental health mini-program card: two people sitting together holding hands, soft purple and violet tones, minimalist romantic style, no text, no real faces, square composition, suitable for a mobile card thumbnail.",
  youth: "Generate a warm flat-style illustration featuring a prominent teenage student character in the center, wearing a school uniform with a backpack, standing confidently with arms slightly open, looking upward with hope. The character should be the main focal point taking up most of the image. Soft amber and orange gradient background. No text, stylized face (not realistic), square composition, suitable for a mobile app card.",
  midlife: "Generate a warm flat-style illustration featuring a prominent middle-aged man character in the center, wearing smart casual clothes, standing tall at a mountain peak looking at the horizon with determination. The character should be the main focal point taking up most of the image. Warm orange and sunset red gradient background. No text, stylized face (not realistic), square composition, suitable for a mobile app card.",
  senior: "Generate a warm flat-style illustration featuring a prominent elderly couple character in the center, a grandfather and grandmother sitting together on a park bench, surrounded by green leaves and flowers. The characters should be the main focal point taking up most of the image. Soft emerald and teal gradient background. No text, stylized faces (not realistic), square composition, suitable for a mobile app card.",

  // === 四大板块 (line art) ===
  block_daily_tools: `${LINE_ART_STYLE}. A person meditating cross-legged with a small heart floating above, surrounded by tiny stars. Square composition.`,
  block_assessments: `${LINE_ART_STYLE}. A clipboard with a checklist and a magnifying glass examining it, with a small brain icon. Square composition.`,
  block_training: `${LINE_ART_STYLE}. A person climbing steps upward with a flag at the top, showing growth journey. Square composition.`,
  block_health_store: `${LINE_ART_STYLE}. A shopping bag with a leaf and a pill capsule, representing health products. Square composition.`,

  // === 使用场景 (line art) ===
  scene_anxiety: `${LINE_ART_STYLE}. A person sitting by a window at night with a crescent moon, holding a phone with gentle light. Square composition.`,
  scene_workplace: `${LINE_ART_STYLE}. A person at a desk with thought bubbles showing question marks turning into lightbulbs. Square composition.`,
  scene_relationship: `${LINE_ART_STYLE}. Two people sitting back-to-back with a broken heart between them being repaired. Square composition.`,
  scene_growth: `${LINE_ART_STYLE}. A person watering a small plant that's growing from their head, symbolizing personal growth. Square composition.`,

  // === 用户见证头像 (line art portraits) ===
  avatar_0: `${LINE_ART_STYLE}. Portrait of a young woman with short hair and gentle smile, front-facing bust. Square.`,
  avatar_1: `${LINE_ART_STYLE}. Portrait of a man with short hair and confident expression, front-facing bust. Square.`,
  avatar_2: `${LINE_ART_STYLE}. Portrait of a young woman with ponytail and soft eyes, front-facing bust. Square.`,
  avatar_3: `${LINE_ART_STYLE}. Portrait of a woman with medium-length hair and warm smile, front-facing bust. Square.`,
  avatar_4: `${LINE_ART_STYLE}. Portrait of a man with glasses and thoughtful expression, front-facing bust. Square.`,
  avatar_5: `${LINE_ART_STYLE}. Portrait of a woman with hair bun and kind eyes, front-facing bust. Square.`,
  avatar_6: `${LINE_ART_STYLE}. Portrait of a young man with messy hair and cheerful smile, front-facing bust. Square.`,
  avatar_7: `${LINE_ART_STYLE}. Portrait of a man with crew cut and determined look, front-facing bust. Square.`,
  avatar_8: `${LINE_ART_STYLE}. Portrait of an elderly man with reading glasses and wise smile, front-facing bust. Square.`,
  avatar_9: `${LINE_ART_STYLE}. Portrait of a man with neat hair and friendly smile, front-facing bust. Square.`,
  avatar_10: `${LINE_ART_STYLE}. Portrait of a teenage boy with backpack strap visible and hopeful eyes, front-facing bust. Square.`,
  avatar_11: `${LINE_ART_STYLE}. Portrait of a young woman with earrings and professional look, front-facing bust. Square.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const forceRegenerate = body.force === true;
    const targetIds = body.audience_ids as string[] | undefined;

    const audienceIds = targetIds || Object.keys(AUDIENCE_PROMPTS);
    const results: Record<string, string> = {};
    const errors: Record<string, string> = {};

    for (const audienceId of audienceIds) {
      const prompt = AUDIENCE_PROMPTS[audienceId];
      if (!prompt) {
        errors[audienceId] = "Unknown audience ID";
        continue;
      }

      // Check if already exists
      if (!forceRegenerate) {
        const { data: existing } = await supabase
          .from('audience_illustrations')
          .select('image_url')
          .eq('audience_id', audienceId)
          .single();

        if (existing?.image_url) {
          results[audienceId] = existing.image_url;
          console.log(`Skipping ${audienceId}: already exists`);
          continue;
        }
      }

      console.log(`Generating illustration for: ${audienceId}`);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`AI error for ${audienceId}:`, response.status, errText);
        errors[audienceId] = `AI error: ${response.status}`;
        continue;
      }

      const data = await response.json();
      const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageData) {
        errors[audienceId] = "No image returned";
        continue;
      }

      // Extract base64 and upload
      const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!base64Match) {
        errors[audienceId] = "Invalid image format";
        continue;
      }

      const imageFormat = base64Match[1];
      const base64Content = base64Match[2];
      const imageBytes = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));

      const fileName = `${audienceId}.${imageFormat}`;

      if (forceRegenerate) {
        await supabase.storage.from("audience-illustrations").remove([fileName]);
      }

      const { error: uploadError } = await supabase.storage
        .from("audience-illustrations")
        .upload(fileName, imageBytes, {
          contentType: `image/${imageFormat}`,
          upsert: true,
        });

      if (uploadError) {
        console.error(`Upload error for ${audienceId}:`, uploadError);
        errors[audienceId] = "Upload failed";
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("audience-illustrations")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      await supabase
        .from('audience_illustrations')
        .upsert({
          audience_id: audienceId,
          image_url: publicUrl,
          created_at: new Date().toISOString(),
        }, { onConflict: 'audience_id' });

      results[audienceId] = publicUrl;
      console.log(`Done: ${audienceId} -> ${publicUrl}`);

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 2000));
    }

    return new Response(JSON.stringify({ results, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-audience-illustrations error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
