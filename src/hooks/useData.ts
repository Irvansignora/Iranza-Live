import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import type { Client, LiveSession, SessionMetrics, ViewerTimeline, MediaAsset } from '@/lib/database.types'

// ── Clients hook ──
export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('clients')
      .select('*, profile:profiles(id, full_name, email, avatar_url)')
      .eq('is_active', true)
      .order('name')
    setClients((data as Client[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { clients, loading, refetch: fetch }
}

// ── Session metrics hook ──
export function useSessionMetrics(sessionId: string | null) {
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null)
  const [timeline, setTimeline] = useState<ViewerTimeline[]>([])

  useEffect(() => {
    if (!sessionId) return

    async function load() {
      const [{ data: m }, { data: t }] = await Promise.all([
        supabase.from('session_metrics').select('*').eq('session_id', sessionId as string).order('recorded_at', { ascending: false }).limit(1).single(),
        supabase.from('viewer_timeline').select('*').eq('session_id', sessionId as string).order('timestamp').limit(100),
      ])
      if (m) setMetrics(m)
      if (t) setTimeline(t)
    }

    load()

    // Realtime subscription
    const channel = supabase
      .channel(`metrics:${sessionId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'session_metrics', filter: `session_id=eq.${sessionId}` },
        (payload) => setMetrics(payload.new as SessionMetrics)
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'viewer_timeline', filter: `session_id=eq.${sessionId}` },
        (payload) => setTimeline(prev => [...prev, payload.new as ViewerTimeline])
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

  return { metrics, timeline }
}

// ── Dashboard summary stats hook ──
export function useDashboardStats(period: 'today' | '7d' | '30d') {
  const [stats, setStats] = useState({
    totalSessions: 0,
    liveSessions: 0,
    totalViewers: 0,
    totalRevenue: 0,
    totalFollowers: 0,
    avgEngagement: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)

      const now = new Date()
      let from: Date
      if (period === 'today') {
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else if (period === '7d') {
        from = new Date(now.getTime() - 7 * 24 * 3600 * 1000)
      } else {
        from = new Date(now.getTime() - 30 * 24 * 3600 * 1000)
      }

      const { data: sessions } = await supabase
        .from('live_sessions')
        .select('id, status')
        .gte('scheduled_start', from.toISOString())

      const sessionIds = sessions?.map(s => s.id) || []

      if (sessionIds.length > 0) {
        const { data: metrics } = await supabase
          .from('session_metrics')
          .select('*')
          .in('session_id', sessionIds)

        const m = metrics || []
        setStats({
          totalSessions: sessions?.length || 0,
          liveSessions: sessions?.filter(s => s.status === 'live').length || 0,
          totalViewers: m.reduce((sum, r) => sum + (r.peak_viewers || 0), 0),
          totalRevenue: m.reduce((sum, r) => sum + (r.total_revenue || 0), 0),
          totalFollowers: m.reduce((sum, r) => sum + (r.new_followers || 0), 0),
          avgEngagement: m.length ? m.reduce((sum, r) => sum + (r.engagement_rate || 0), 0) / m.length : 0,
        })
      } else {
        setStats({ totalSessions: 0, liveSessions: 0, totalViewers: 0, totalRevenue: 0, totalFollowers: 0, avgEngagement: 0 })
      }

      setLoading(false)
    }

    load()
  }, [period])

  return { stats, loading }
}

// ── Media assets hook ──
export function useMediaAssets(sessionId?: string, clientId?: string) {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let q = supabase.from('media_assets').select('*').order('created_at', { ascending: false })
      if (sessionId) q = q.eq('session_id', sessionId)
      if (clientId) q = q.eq('client_id', clientId)
      const { data } = await q
      setAssets(data || [])
      setLoading(false)
    }
    load()
  }, [sessionId, clientId])

  return { assets, loading }
}

// ── Realtime studio watcher ──
export function useStudioRealtime() {
  const { fetchStudios } = useAppStore()

  useEffect(() => {
    const channel = supabase
      .channel('studios_realtime')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'studios' },
        () => fetchStudios()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchStudios])
}

// ── Notifications realtime hook ──
export function useNotificationsRealtime() {
  const { profile } = useAuthStore()
  const { fetchNotifications } = useAppStore()

  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel(`notifs:${profile.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        () => fetchNotifications(profile.id)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile?.id, fetchNotifications])
}
