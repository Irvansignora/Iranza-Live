/**
 * useFavicon.ts — Dynamically sets the browser favicon from
 * landing_settings.logo_url (Cloudinary URL), app-wide.
 *
 * Usage: call useFavicon() once near the root of the app (e.g. in App.tsx).
 */

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

function setFaviconHref(url: string) {
  // Remove any existing favicon links to avoid duplicates/stale icons
  document.querySelectorAll("link[rel*='icon']").forEach(el => el.remove())

  const link = document.createElement('link')
  link.rel = 'icon'
  link.href = url
  document.head.appendChild(link)
}

export function useFavicon() {
  useEffect(() => {
    let cancelled = false

    supabase
      .from('landing_settings')
      .select('settings')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        const logoUrl = (data?.settings as { logo_url?: string } | undefined)?.logo_url
        if (logoUrl) setFaviconHref(logoUrl)
        // If no logo set, leave the static /favicon.svg from index.html as-is.
      })

    return () => { cancelled = true }
  }, [])
}
