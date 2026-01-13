/**
 * Shared authentication helpers for Edge Functions
 * 
 * This module provides security utilities for different types of endpoints:
 * - Cron/batch jobs: Use CRON_SECRET validation
 * - Internal service calls: Use service role key validation  
 * - User endpoints: Use JWT validation via Supabase client
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Validates that the request has a valid cron secret for batch/scheduled operations.
 * This prevents unauthorized public access to cron jobs.
 * 
 * Expected header: Authorization: Bearer <CRON_SECRET>
 * 
 * @returns Error response if validation fails, null if valid
 */
export function validateCronSecret(req: Request): Response | null {
  const cronSecret = Deno.env.get('CRON_SECRET');
  
  // If CRON_SECRET is not configured, deny all access for security
  if (!cronSecret) {
    console.error('CRON_SECRET is not configured - denying access');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const authHeader = req.headers.get('authorization');
  
  // Check for Bearer token format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('Missing or invalid authorization header for cron endpoint');
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const providedSecret = authHeader.replace('Bearer ', '');
  
  if (providedSecret !== cronSecret) {
    console.warn('Invalid cron secret provided');
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  return null; // Validation passed
}

/**
 * Validates that the request is an internal service call using service role key.
 * Used for functions that should only be called by other Edge Functions.
 * 
 * Expected header: Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
 * 
 * @returns Error response if validation fails, null if valid
 */
export function validateServiceRole(req: Request): Response | null {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not configured');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('Missing authorization header for internal endpoint');
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const providedKey = authHeader.replace('Bearer ', '');
  
  if (providedKey !== serviceRoleKey) {
    console.warn('Invalid service role key provided');
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  return null; // Validation passed
}
