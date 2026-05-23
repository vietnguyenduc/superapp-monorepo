import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    
    // Create standard Supabase client with the caller's JWT to verify their identity
    const supabaseCaller = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Verify caller is admin_master
    const { data: { user }, error: authError } = await supabaseCaller.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Unauthorized request');
    }
    
    const { data: callerProfile } = await supabaseCaller.from('users').select('role').eq('id', user.id).single();
    if (callerProfile?.role !== 'admin_master') {
      throw new Error('Forbidden: Only admin_master can revoke sessions');
    }

    const { target_user_id } = await req.json();

    if (!target_user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing target_user_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Use Service Role to force-logout the user globally
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { error: revokeError } = await supabaseAdmin.auth.admin.signOut(target_user_id, 'global');

    if (revokeError) {
      throw revokeError;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'User sessions revoked globally' }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Lỗi server nội bộ' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
});
