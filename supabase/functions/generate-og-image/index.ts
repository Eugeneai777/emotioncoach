import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STYLE_PROMPTS: Record<string, string> = {
  brand: "Modern gradient with purple and pink tones, sleek and tech-forward, representing AI innovation and personal growth",
  warm: "Warm golden and orange sunset tones, cozy and inviting atmosphere, radiating positivity and warmth",
  professional: "Clean blue and gray corporate style, minimal and elegant, conveying trust and expertise",
  nature: "Fresh green tones with natural elements, organic and calming, representing growth and vitality",
  cosmic: "Deep space purple and blue with subtle stars, mysterious and inspiring, symbolizing infinite possibilities",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keywords, style = 'brand', pageKey } = await req.json();

    if (!keywords || !pageKey) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: keywords and pageKey' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const styleDescription = STYLE_PROMPTS[style] || STYLE_PROMPTS.brand;

    const prompt = `Generate a professional Open Graph sharing image for social media.

Theme Keywords: ${keywords}
Visual Style: ${styleDescription}

Requirements:
- Exact aspect ratio: 1.91:1 (landscape, suitable for 1200x630 pixels)
- Style: Modern, clean, professional with subtle gradients and abstract elements
- CRITICAL: Do NOT include any text, words, letters, numbers, or characters whatsoever
- The image should be purely visual with abstract shapes, gradients, and artistic elements
- High quality, visually appealing, suitable for WeChat/social media sharing as a preview card
- Colors should match the specified visual style
- Ultra high resolution`;

    console.log('Generating OG image with prompt:', prompt);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageData) {
      throw new Error('No image generated from AI');
    }

    // Extract base64 data
    const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error('Invalid image data format');
    }

    const imageType = base64Match[1];
    const base64Data = base64Match[2];
    
    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const fileName = `${pageKey}-ai-${Date.now()}.${imageType}`;
    
    const { error: uploadError } = await supabase.storage
      .from('og-images')
      .upload(fileName, bytes, {
        contentType: `image/${imageType}`,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('og-images')
      .getPublicUrl(fileName);

    console.log('Image uploaded successfully:', urlData.publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: urlData.publicUrl,
        fileName 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error generating OG image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
