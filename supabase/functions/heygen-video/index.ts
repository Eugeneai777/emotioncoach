import { corsHeaders } from "../_shared/cors.ts";

const HEYGEN_API = "https://api.heygen.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("HEYGEN_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "HEYGEN_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { action, ...params } = await req.json();

    // Action: list_avatars
    if (action === "list_avatars") {
      const res = await fetch(`${HEYGEN_API}/v2/avatars`, {
        headers: { "X-Api-Key": apiKey, "Accept": "application/json" },
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: list_voices
    if (action === "list_voices") {
      const res = await fetch(`${HEYGEN_API}/v2/voices`, {
        headers: { "X-Api-Key": apiKey, "Accept": "application/json" },
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: generate - create a video
    if (action === "generate") {
      const { scenes, avatar_id, voice_id, dimension } = params;
      
      // Generate one video with multiple scenes as separate clips
      // HeyGen v2 supports video_inputs array
      const video_inputs = scenes.map((scene: { text: string; background?: string }) => ({
        character: {
          type: "avatar",
          avatar_id: avatar_id,
          avatar_style: "normal",
        },
        voice: {
          type: "text",
          voice_id: voice_id,
          input_text: scene.text,
          speed: 0.95,
        },
        background: {
          type: "color",
          value: scene.background || "#1a1a2e",
        },
      }));

      const body = {
        video_inputs,
        dimension: dimension || { width: 1080, height: 1920 },
      };

      console.log("Generating HeyGen video with body:", JSON.stringify(body).slice(0, 500));

      const res = await fetch(`${HEYGEN_API}/v2/video/generate`, {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      console.log("Generate response:", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: status - check video status
    if (action === "status") {
      const { video_id } = params;
      const res = await fetch(`${HEYGEN_API}/v1/video_status.get?video_id=${video_id}`, {
        headers: { "X-Api-Key": apiKey, "Accept": "application/json" },
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use: list_avatars, list_voices, generate, status" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("HeyGen edge function error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
