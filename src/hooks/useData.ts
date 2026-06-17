import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import type { Client, LiveSession, SessionMetrics, ViewerTimeline, MediaAsset, PlatformType } from '@/lib/database.types'

// ── Clients hook ──
export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    // NOTE: previously this used a nested select (`profile:profiles(...)`)
    // to also pull the linked auth profile. That field was unused in the
    // UI, and PostgREST's nested-select join silently excluded any client
    // whose profile_id is NULL (i.e. every client not yet linked to a
    // user account) — which is the normal case right after creating a
    // client via the admin form. Plain '*' avoids that join entirely.
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('is_active', true)
      .order('name')
    if (error) console.error('useClients fetch error:', error.message)
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

function periodToRange(period: 'today' | '7d' | '30d') {
  const now = new Date()
  let from: Date
  if (period === 'today') {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (period === '7d') {
    from = new Date(now.getTime() - 7 * 24 * 3600 * 1000)
  } else {
    from = new Date(now.getTime() - 30 * 24 * 3600 * 1000)
  }
  const spanMs = now.getTime() - from.getTime()
  const prevFrom = new Date(from.getTime() - spanMs)
  return { from, to: now, prevFrom, prevTo: from }
}

// ── Dashboard summary stats hook (with real period-over-period change %) ──
export function useDashboardStats(period: 'today' | '7d' | '30d') {
  const [stats, setStats] = useState({
    totalSessions: 0,
    liveSessions: 0,
    totalViewers: 0,
    totalRevenue: 0,
    totalFollowers: 0,
    avgEngagement: 0,
    changeViewers: 0,
    changeRevenue: 0,
    changeFollowers: 0,
    changeSessions: 0,
    changeEngagement: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRange(from: Date, to: Date) {
      const { data: sessions } = await supabase
        .from('live_sessions')
        .select('id, status')
        .gte('scheduled_start', from.toISOString())
        .lt('scheduled_start', to.toISOString())

      const sessionIds = sessions?.map(s => s.id) || []
      if (sessionIds.length === 0) {
        return { totalSessions: 0, liveSessions: 0, totalViewers: 0, totalRevenue: 0, totalFollowers: 0, avgEngagement: 0 }
      }

      const { data: metrics } = await supabase
        .from('session_metrics')
        .select('*')
        .in('session_id', sessionIds)

      const m = metrics || []
      return {
        totalSessions: sessions?.length || 0,
        liveSessions: sessions?.filter(s => s.status === 'live').length || 0,
        totalViewers: m.reduce((sum, r) => sum + (r.peak_viewers || 0), 0),
        totalRevenue: m.reduce((sum, r) => sum + (r.total_revenue || 0), 0),
        totalFollowers: m.reduce((sum, r) => sum + (r.new_followers || 0), 0),
        avgEngagement: m.length ? m.reduce((sum, r) => sum + (r.engagement_rate || 0), 0) / m.length : 0,
      }
    }

    function pctChange(curr: number, prev: number) {
      if (prev === 0) return curr > 0 ? 100 : 0
      return ((curr - prev) / prev) * 100
    }

    async function load() {
      setLoading(true)
      const { from, to, prevFrom, prevTo } = periodToRange(period)

      const [current, previous] = await Promise.all([
        loadRange(from, to),
        loadRange(prevFrom, prevTo),
      ])

      setStats({
        ...current,
        changeViewers: pctChange(current.totalViewers, previous.totalViewers),
        changeRevenue: pctChange(current.totalRevenue, previous.totalRevenue),
        changeFollowers: pctChange(current.totalFollowers, previous.totalFollowers),
        changeSessions: pctChange(current.totalSessions, previous.totalSessions),
        changeEngagement: pctChange(current.avgEngagement, previous.avgEngagement),
      })
      setLoading(false)
    }

    load()
  }, [period])

  return { stats, loading }
}

// ── Viewer trend hook — real per-hour viewer counts per studio, from viewer_timeline ──
export interface ViewerTrendPoint {
  time: string
  [studioName: string]: string | number
}

export function useViewerTrend(date?: Date) {
  const [data, setData] = useState<ViewerTrendPoint[]>([])
  const [studioNames, setStudioNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [hasData, setHasData] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const day = date || new Date()
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000)

      // Sessions scheduled today, joined to their studio name
      const { data: sessions } = await supabase
        .from('live_sessions')
        .select('id, studio_id, studio:studios(name)')
        .gte('scheduled_start', dayStart.toISOString())
        .lt('scheduled_start', dayEnd.toISOString())

      type RawSession = { id: string; studio_id: string | null; studio: { name: string } | { name: string }[] | null }
      const sessionList = ((sessions || []) as unknown as RawSession[]).map(s => ({
        id: s.id,
        studio_id: s.studio_id,
        studio: Array.isArray(s.studio) ? s.studio[0] : s.studio,
      }))

      if (sessionList.length === 0) {
        setData([])
        setStudioNames([])
        setHasData(false)
        setLoading(false)
        return
      }

      const sessionIds = sessionList.map(s => s.id)
      const { data: timeline } = await supabase
        .from('viewer_timeline')
        .select('session_id, timestamp, viewer_count')
        .in('session_id', sessionIds)
        .order('timestamp')

      const points = (timeline || []) as Array<{ session_id: string; timestamp: string; viewer_count: number }>

      if (points.length === 0) {
        setData([])
        setStudioNames(Array.from(new Set(sessionList.map(s => s.studio?.name || 'Studio'))))
        setHasData(false)
        setLoading(false)
        return
      }

      // Map session_id -> studio name
      const sessionToStudio = new Map(sessionList.map(s => [s.id, s.studio?.name || 'Studio']))
      const names = Array.from(new Set(sessionList.map(s => s.studio?.name || 'Studio')))

      // Bucket by hour, per studio
      const buckets = new Map<string, ViewerTrendPoint>()
      for (const p of points) {
        const hour = new Date(p.timestamp)
        const label = `${String(hour.getHours()).padStart(2, '0')}:00`
        const studioName = sessionToStudio.get(p.session_id) || 'Studio'

        if (!buckets.has(label)) {
          const point: ViewerTrendPoint = { time: label }
          names.forEach(n => { point[n] = 0 })
          buckets.set(label, point)
        }
        const bucket = buckets.get(label)!
        bucket[studioName] = Math.max(Number(bucket[studioName] || 0), p.viewer_count)
      }

      const sorted = Array.from(buckets.values()).sort((a, b) => a.time.localeCompare(b.time))
      setData(sorted)
      setStudioNames(names)
      setHasData(true)
      setLoading(false)
    }

    load()
  }, [date])

  return { data, studioNames, loading, hasData }
}

// ── Platform split hook — real distribution of sessions/viewers by platform ──
export interface PlatformSplitItem {
  name: string
  value: number
  color: string
}

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: '#00e5ff',
  shopee: '#ff3d6b',
  instagram: '#a3ff6b',
  youtube: '#ffc93c',
  tokopedia: '#8b5cf6',
  lazada: '#fb923c',
  other: '#5c6b7a',
}

const PLATFORM_LABELS_MAP: Record<string, string> = {
  tiktok: 'TikTok', shopee: 'Shopee', instagram: 'Instagram', youtube: 'YouTube',
  tokopedia: 'Tokopedia', lazada: 'Lazada', other: 'Lainnya',
}

export function usePlatformSplit(period: 'today' | '7d' | '30d') {
  const [data, setData] = useState<PlatformSplitItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { from, to } = periodToRange(period)

      const { data: sessions } = await supabase
        .from('live_sessions')
        .select('id, platform')
        .gte('scheduled_start', from.toISOString())
        .lt('scheduled_start', to.toISOString())

      const list = (sessions || []) as Array<{ id: string; platform: PlatformType }>
      if (list.length === 0) {
        setData([])
        setLoading(false)
        return
      }

      const sessionIds = list.map(s => s.id)
      const { data: metrics } = await supabase
        .from('session_metrics')
        .select('session_id, peak_viewers')
        .in('session_id', sessionIds)

      const viewersBySession = new Map((metrics || []).map(m => [m.session_id, m.peak_viewers || 0]))

      // Weight platform split by viewers when available, fall back to session count
      const totals = new Map<string, number>()
      for (const s of list) {
        const weight = viewersBySession.get(s.id) || 1
        totals.set(s.platform, (totals.get(s.platform) || 0) + weight)
      }

      const sumAll = Array.from(totals.values()).reduce((a, b) => a + b, 0)
      const items: PlatformSplitItem[] = Array.from(totals.entries())
        .map(([platform, val]) => ({
          name: PLATFORM_LABELS_MAP[platform] || platform,
          value: sumAll > 0 ? Math.round((val / sumAll) * 100) : 0,
          color: PLATFORM_COLORS[platform] || '#5c6b7a',
        }))
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value)

      setData(items)
      setLoading(false)
    }

    load()
  }, [period])

  return { data, loading, hasData: data.length > 0 }
}

// ── Weekly revenue hook — real revenue per day for the last 7 days ──
export interface WeeklyRevenuePoint {
  day: string
  sessions: number
  revenue: number
}

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export function useWeeklyRevenue() {
  const [data, setData] = useState<WeeklyRevenuePoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const now = new Date()
      const from = new Date(now.getTime() - 7 * 24 * 3600 * 1000)

      const { data: sessions } = await supabase
        .from('live_sessions')
        .select('id, scheduled_start')
        .gte('scheduled_start', from.toISOString())
        .lte('scheduled_start', now.toISOString())

      const list = (sessions || []) as Array<{ id: string; scheduled_start: string }>

      const buckets: WeeklyRevenuePoint[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 3600 * 1000)
        buckets.push({ day: DAY_LABELS[d.getDay()], sessions: 0, revenue: 0 })
      }

      if (list.length === 0) {
        setData(buckets)
        setLoading(false)
        return
      }

      const sessionIds = list.map(s => s.id)
      const { data: metrics } = await supabase
        .from('session_metrics')
        .select('session_id, total_revenue')
        .in('session_id', sessionIds)

      const revenueBySession = new Map((metrics || []).map(m => [m.session_id, m.total_revenue || 0]))

      for (const s of list) {
        const sDate = new Date(s.scheduled_start)
        const dayIndex = Math.floor((now.getTime() - sDate.getTime()) / (24 * 3600 * 1000))
        const bucketIndex = 6 - dayIndex
        if (bucketIndex >= 0 && bucketIndex < 7) {
          buckets[bucketIndex].sessions += 1
          buckets[bucketIndex].revenue += revenueBySession.get(s.id) || 0
        }
      }

      setData(buckets)
      setLoading(false)
    }

    load()
  }, [])

  return { data, loading, hasData: data.some(d => d.sessions > 0) }
}

// ── Live metrics for a specific studio's currently-live session ──
export function useStudioLiveMetrics(sessionId: string | null) {
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null)

  useEffect(() => {
    if (!sessionId) { setMetrics(null); return }

    let active = true
    supabase
      .from('session_metrics')
      .select('*')
      .eq('session_id', sessionId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { if (active) setMetrics(data as SessionMetrics | null) })

    const channel = supabase
      .channel(`studio-live-metrics:${sessionId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'session_metrics', filter: `session_id=eq.${sessionId}` },
        (payload) => setMetrics(payload.new as SessionMetrics)
      )
      .subscribe()

    return () => { active = false; supabase.removeChannel(channel) }
  }, [sessionId])

  return metrics
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
