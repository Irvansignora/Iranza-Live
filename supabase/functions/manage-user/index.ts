// supabase/functions/manage-user/index.ts

// Edge Function: manage-user
// Lets a super_admin/admin create a new user WITH a password they set
// (instead of Supabase's signUp(), which can only set a random throwaway
// password client-side), and reset a user's password later.
//
// Uses the SERVICE_ROLE key — this is why it must run server-side as an
// Edge Function, never in the frontend bundle.
//
// Deploy:
//   supabase functions deploy manage-user
//
// Required secrets (set once):
//   supabase secrets set SUPABASE_URL=https://xxxx.supabase.co
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase
//  in most projects already — only set them manually if the function can't
//  find them.)

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type ActionBody =
  | { action: 'create'; email: string; password: string; full_name: string; role: string; company_name?: string }
  | { action: 'reset_password'; user_id: string; password: string }

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Client using the CALLER's JWT — used only to verify who is calling
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: callerUser, error: callerErr } = await callerClient.auth.getUser()
    if (callerErr || !callerUser?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Admin client — full privileges, used for the actual user management
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Verify the caller's profile role is admin/super_admin
    const { data: callerProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', callerUser.user.id)
      .single()

    if (!callerProfile || !['super_admin', 'admin'].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden — admin role required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: ActionBody = await req.json()

    if (body.action === 'create') {
      if (!body.email || !body.password || !body.full_name) {
        return new Response(JSON.stringify({ error: 'email, password, full_name wajib diisi' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (body.password.length < 6) {
        return new Response(JSON.stringify({ error: 'Password minimal 6 karakter' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true, // skip email confirmation — admin is vouching for this account
        user_metadata: {
          full_name: body.full_name,
          role: body.role,
          company_name: body.company_name || null,
        },
      })

      if (createErr) {
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // The handle_new_user() trigger should create the profiles row from
      // user_metadata automatically. If the trigger doesn't set role/company
      // for some reason, patch it here as a safety net.
      if (created.user) {
        await adminClient.from('profiles').update({
          role: body.role,
          company_name: body.company_name || null,
        }).eq('id', created.user.id)
      }

      return new Response(JSON.stringify({ success: true, user_id: created.user?.id }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (body.action === 'reset_password') {
      if (!body.user_id || !body.password) {
        return new Response(JSON.stringify({ error: 'user_id dan password wajib diisi' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (body.password.length < 6) {
        return new Response(JSON.stringify({ error: 'Password minimal 6 karakter' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { error: updateErr } = await adminClient.auth.admin.updateUserById(body.user_id, {
        password: body.password,
      })

      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
