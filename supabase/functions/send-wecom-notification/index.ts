import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { webhookUrl, notification } = await req.json();

    if (!webhookUrl) {
      throw new Error("Webhook URL is required");
    }

    if (!notification || !notification.title || !notification.message) {
      throw new Error("Valid notification data is required");
    }

    // Construct WeChat Work Markdown message
    const markdown = `# ${notification.icon || '📢'} ${notification.title}\n\n${notification.message}`;

    // Send to WeChat Work
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        msgtype: 'markdown',
        markdown: {
          content: markdown,
        },
      }),
    });

    const result = await response.json();

    if (result.errcode !== 0) {
      console.error('WeChat Work API error:', result);
      throw new Error(`WeChat Work API error: ${result.errmsg || 'Unknown error'}`);
    }

    console.log('WeChat Work notification sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent to WeChat Work successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error sending WeChat Work notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
