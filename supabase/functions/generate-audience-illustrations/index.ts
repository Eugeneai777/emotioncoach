import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Three distinct visual styles for different sections
const BLOCK_STYLE = "bold thick black line art with solid single-color fill (navy blue #1e3a5f), clean geometric shapes, high contrast on white background, no shading gradients, suitable as app icon at small size (48px), square composition, vibrant colors, NOT thin lines, NOT wireframe";
const SCENE_STYLE = "soft watercolor sketch style, gentle pastel color washes (lavender, peach, mint) with loose hand-drawn outlines, dreamy and emotional atmosphere, on white background, square composition, visible at 40px thumbnail size, NOT thin outlines";
const AVATAR_STYLE = "flat cartoon avatar portrait, round face, warm skin tones, soft pastel colored background circle, friendly expression, simple features, suitable as small profile picture (32px), square composition, bold features, high contrast";

const AUDIENCE_PROMPTS: Record<string, string> = {
  // === 人群入口 (warm flat style) ===
  mama: "Generate a flat-style illustration for a mental health mini-program card: a confident modern Chinese woman standing tall in smart casual attire, warm smile, representing empowerment and independence, soft rose-pink and warm tones, minimalist style, no text, no real faces, square composition, suitable for a mobile card thumbnail. Warm pastel color palette.",
  workplace: "Generate a flat-style illustration for a mental health mini-program card: a person sitting at a desk with a laptop, taking a deep breath with eyes closed, soft blue and indigo tones, minimalist style, no text, no real faces, square composition, suitable for a mobile card thumbnail.",
  couple: "Generate a flat-style illustration for a mental health mini-program card: two people sitting together holding hands, soft purple and violet tones, minimalist romantic style, no text, no real faces, square composition, suitable for a mobile card thumbnail.",
  youth: "Generate a warm flat-style illustration featuring a prominent teenage student character in the center, wearing a school uniform with a backpack, standing confidently with arms slightly open, looking upward with hope. The character should be the main focal point taking up most of the image. Soft amber and orange gradient background. No text, stylized face (not realistic), square composition, suitable for a mobile app card.",
  midlife: "Generate a warm flat-style illustration featuring a prominent middle-aged man character in the center, wearing smart casual clothes, standing tall at a mountain peak looking at the horizon with determination. The character should be the main focal point taking up most of the image. Warm orange and sunset red gradient background. No text, stylized face (not realistic), square composition, suitable for a mobile app card.",
  senior: "Generate a warm flat-style illustration featuring a prominent elderly couple character in the center, a grandfather and grandmother sitting together on a park bench, surrounded by green leaves and flowers. The characters should be the main focal point taking up most of the image. Soft emerald and teal gradient background. No text, stylized faces (not realistic), square composition, suitable for a mobile app card.",

  // === 四大板块 (bold icon style) ===
  block_daily_tools: `${BLOCK_STYLE}. A person meditating cross-legged with a heart floating above, surrounded by tiny stars.`,
  block_assessments: `${BLOCK_STYLE}. A clipboard with a checklist and a magnifying glass, with a brain icon.`,
  block_training: `${BLOCK_STYLE}. A person climbing steps upward with a flag at the top, showing growth.`,
  block_health_store: `${BLOCK_STYLE}. A shopping bag with a leaf and a pill capsule, health products.`,

  // === 使用场景 (watercolor sketch) ===
  scene_anxiety: `${SCENE_STYLE}. A person sitting by a window at night with a crescent moon, holding a phone with gentle light.`,
  scene_workplace: `${SCENE_STYLE}. A person at a desk with thought bubbles showing question marks turning into lightbulbs.`,
  scene_relationship: `${SCENE_STYLE}. Two people sitting back-to-back with a heart between them being gently repaired.`,
  scene_growth: `${SCENE_STYLE}. A person watering a small plant growing from their head, symbolizing personal growth.`,

  // === 用户见证头像 (flat cartoon avatars) ===
  avatar_0: `${AVATAR_STYLE}. Young Chinese woman with short bob hair and gentle smile.`,
  avatar_1: `${AVATAR_STYLE}. Chinese man with short hair and confident warm expression.`,
  avatar_2: `${AVATAR_STYLE}. Young Chinese woman with ponytail and soft kind eyes.`,
  avatar_3: `${AVATAR_STYLE}. Chinese woman with medium-length hair and warm smile.`,
  avatar_4: `${AVATAR_STYLE}. Chinese man with glasses and thoughtful expression.`,
  avatar_5: `${AVATAR_STYLE}. Chinese woman with hair bun and kind nurturing eyes.`,
  avatar_6: `${AVATAR_STYLE}. Young Chinese man with messy hair and cheerful smile.`,
  avatar_7: `${AVATAR_STYLE}. Chinese man with crew cut and determined look.`,
  avatar_8: `${AVATAR_STYLE}. Elderly Chinese man with reading glasses and wise smile.`,
  avatar_9: `${AVATAR_STYLE}. Chinese man with neat hair and friendly smile.`,
  avatar_10: `${AVATAR_STYLE}. Chinese teenage boy with backpack strap and hopeful eyes.`,
  avatar_11: `${AVATAR_STYLE}. Young Chinese woman with earrings and professional look.`,
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
