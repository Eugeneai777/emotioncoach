import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 🔒 SECURITY: Whitelist of allowed domains for image proxying
// Only WeChat/WeCom related domains are allowed to prevent SSRF attacks
const ALLOWED_DOMAINS = [
  'platform.wechatwork.qq.com',
  'qyapi.weixin.qq.com',
  'mmbiz.qpic.cn',
  'wx.qlogo.cn',
  'thirdwx.qlogo.cn',
  'wework.qpic.cn',
  'mmbiz.qlogo.cn',
  'p.qpic.cn',
  'shp.qpic.cn',
  'res.wx.qq.com',
];

// 🔒 SECURITY: Patterns for blocking private/internal IP ranges
const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^169\.254\./,  // Link-local / AWS metadata endpoint
  /\.internal$/,
  /\.local$/,
  /^0\./,
  /^224\./,  // Multicast
  /^255\./,  // Broadcast
];

// Maximum allowed image size (5MB)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * 🔒 SECURITY: Validates if a URL is allowed for proxying
 * - Only allows HTTP/HTTPS protocols
 * - Blocks private/internal IP ranges
 * - Only allows whitelisted domains
 */
function isAllowedUrl(urlString: string): { allowed: boolean; reason?: string } {
  try {
    const url = new URL(urlString);
    
    // 1. Protocol check - only HTTP/HTTPS allowed
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { allowed: false, reason: 'Only HTTP/HTTPS protocols allowed' };
    }
    
    const hostname = url.hostname.toLowerCase();
    
    // 2. Block private/internal IP ranges
    if (PRIVATE_IP_PATTERNS.some(pattern => pattern.test(hostname))) {
      return { allowed: false, reason: 'Private/internal addresses not allowed' };
    }
    
    // 3. Check domain whitelist
    const isWhitelisted = ALLOWED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
    
    if (!isWhitelisted) {
      return { allowed: false, reason: 'Domain not in whitelist' };
    }
    
    return { allowed: true };
  } catch (e) {
    return { allowed: false, reason: 'Invalid URL format' };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const imageUrl = url.searchParams.get('url');

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔒 SECURITY: Validate the URL before fetching
    const validation = isAllowedUrl(imageUrl);
    if (!validation.allowed) {
      console.error(`[SECURITY] Blocked URL: ${imageUrl} - Reason: ${validation.reason}`);
      return new Response(
        JSON.stringify({ error: 'URL not allowed', reason: validation.reason }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Proxying image:', imageUrl);

    // Fetch the image from the validated external URL
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageProxy/1.0)',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch image:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch image' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔒 SECURITY: Validate content-type is an image
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      console.error(`[SECURITY] Non-image content-type blocked: ${contentType}`);
      return new Response(
        JSON.stringify({ error: 'Content is not an image' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the image data
    const imageData = await response.arrayBuffer();

    // 🔒 SECURITY: Validate image size
    if (imageData.byteLength > MAX_IMAGE_SIZE) {
      console.error(`[SECURITY] Image too large: ${imageData.byteLength} bytes`);
      return new Response(
        JSON.stringify({ error: 'Image too large (max 5MB)' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Image fetched successfully, content-type:', contentType, 'size:', imageData.byteLength);

    // Return the image with proper headers
    return new Response(imageData, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
