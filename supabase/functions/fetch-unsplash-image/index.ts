import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keywords, orientation = 'portrait', color, perPage = 6 } = await req.json();
    
    const UNSPLASH_ACCESS_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY');
    if (!UNSPLASH_ACCESS_KEY) {
      throw new Error('UNSPLASH_ACCESS_KEY not configured');
    }

    const query = Array.isArray(keywords) ? keywords.join(' ') : keywords;
    
    const params = new URLSearchParams({
      query,
      orientation,
      per_page: String(perPage),
    });
    
    if (color) {
      params.append('color', color);
    }

    console.log(`Fetching Unsplash images with query: ${query}, orientation: ${orientation}, color: ${color || 'any'}`);

    const response = await fetch(
      `https://api.unsplash.com/search/photos?${params.toString()}`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Unsplash API error:', response.status, errorText);
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();
    
    const images = data.results.map((img: any) => ({
      id: img.id,
      urls: {
        regular: img.urls.regular,
        small: img.urls.small,
        thumb: img.urls.thumb,
      },
      author: {
        name: img.user.name,
        username: img.user.username,
        link: img.user.links.html,
      },
      alt: img.alt_description || img.description || query,
      color: img.color,
    }));

    console.log(`Found ${images.length} images for query: ${query}`);

    return new Response(JSON.stringify({ images, total: data.total }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching Unsplash images:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
