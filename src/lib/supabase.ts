import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  // IMPORTANT: do NOT throw here. This file is imported at module-load
  // time (before React even mounts), so a synchronous throw crashes the
  // entire app — the result is a fully blank page (just the dark CSS
  // background showing through an empty #root), with no nav, no hero,
  // nothing. That's a much worse failure mode than just having data
  // fetches silently fail.
  //
  // If you're seeing this in the console, check that VITE_SUPABASE_URL
  // and VITE_SUPABASE_ANON_KEY are set for the *Production* environment
  // in your hosting provider's dashboard (e.g. Vercel → Project Settings
  // → Environment Variables), then redeploy.
  console.error(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
    'Using a placeholder client so the app can still render — any ' +
    'Supabase calls (landing content, auth, dashboard data, etc.) will ' +
    'fail until this is fixed.'
  )
}

export const supabase = createClient<any>(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.invalid.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)

export default supabase
