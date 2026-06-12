import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { useSessionMetrics } from '@/hooks/useData'
import { supabase } from '@/lib/supabase'
import {
  cn, formatIDR, formatNumber, formatDateTime, formatTime,
  getElapsed, PLATFORM_ICONS, PLATFORM_LABELS
} from '@/lib/utils'
import type { LiveSession, RealtimeEvent } from '@/lib/database.types'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import toast from 'react-hot-toast'

const EVENT_CONFIG = {
  join:     { icon: '👋', color: 'border-accent3', label: 'bergabung' },
  gift:     { icon: '🎁', color: 'border-gold', label: 'kirim hadiah' },
  comment:  { icon: '💬', color: 'border-accent', label: 'komentar' },
  follow:   { icon: '⭐', color: 'border-accent2', label: 'follow' },
  share:    { icon: '🔁', color: 'border-muted', label: 'share' },
  purchase: { icon: '🛍️', color: 'border-accent3', label: 'beli' },
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuthStore()
  const { sessions, startSession, endSession, subscribeToSession, upsertMetrics } = useAppStore()
  const navigate = useNavigate()

  const [session, setSession] = useState<LiveSession | null>(null)
  const [events, setEvents] = useState<RealtimeEvent[]>([])
  const [elapsed, setElapsed] = useState('00:00:00')
  const feedRef = useRef<HTMLDivElement>(null)

  const { metrics, timeline } = useSessionMetrics(id || null)

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin'
  const isOperator = profile?.role === 'operator'
  const canControl = isAdmin || isOperator

  // Load session
  useEffect(() => {
    if (!id) return
    const s = sessions.find(x => x.id === id)
    if (s) { setSession(s); return }

    supabase
      .from('live_sessions')
      .select('*, client:clients(*), studio:studios(*), operator:profiles!live_sessions_operator_id_fkey(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => { if (data) setSession(data as LiveSession) })
  }, [id, sessions])

  // Load recent events
  useEffect(() => {
    if (!id) return
    supabase
      .from('realtime_events')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => setEvents((data as RealtimeEvent[]) || []))

    const unsub = subscribeToSession(id)
    return unsub
  }, [id, subscribeToSession])

  // Realtime new events
  useEffect(() => {
    if (!id) return
    const channel = supabase
      .channel(`events_ui:${id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'realtime_events', filter: `session_id=eq.${id}` },
        (payload) => {
          setEvents(prev => [payload.new as RealtimeEvent, ...prev].slice(0, 50))
          if (feedRef.current) feedRef.current.scrollTop = 0
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  // Elapsed timer
  useEffect(() => {
    if (!session?.actual_start || session.status !== 'live') return
    const tick = () => setElapsed(getElapsed(session.actual_start!))
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [session?.actual_start, session?.status])

  // Mock: simulate metric updates every 5s for live sessions
  useEffect(() => {
    if (!id || session?.status !== 'live') return
    const interval = setInterval(async () => {
      await upsertMetrics(id, {
        session_id: id,
        current_viewers: Math.floor(Math.random() * 8000 + 5000),
        peak_viewers: metrics ? Math.max(metrics.peak_viewers, Math.floor(Math.random() * 8000 + 10000)) : 12000,
        total_comments: (metrics?.total_comments || 0) + Math.floor(Math.random() * 10),
        new_followers: (metrics?.new_followers || 0) + Math.floor(Math.random() * 5),
        engagement_rate: 6 + Math.random() * 4,
        gift_revenue: (metrics?.gift_revenue || 0) + Math.floor(Math.random() * 50000),
        total_revenue: (metrics?.total_revenue || 0) + Math.floor(Math.random() * 60000),
        duration_minutes: session?.actual_start
          ? Math.floor((Date.now() - new Date(session.actual_start).getTime()) / 60000)
          : 0,
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [id, session?.status, session?.actual_start, metrics, upsertMetrics])

  const handleStart = async () => {
    if (!id) return
    const { error } = await startSession(id)
    if (error) toast.error('Gagal memulai sesi')
    else {
      toast.success('🔴 Sesi LIVE dimulai!')
      setSession(prev => prev ? { ...prev, status: 'live', actual_start: new Date().toISOString() } : prev)
    }
  }

  const handleEnd = async () => {
    if (!id || !confirm('Yakin mau mengakhiri sesi ini?')) return
    const { error } = await endSession(id)
    if (error) toast.error('Gagal mengakhiri sesi')
    else {
      toast.success('✅ Sesi selesai')
      navigate('/sessions')
    }
  }

  // Build viewer chart from timeline or mock
  const chartData = timeline.length > 0
    ? timeline.slice(-20).map(t => ({
        time: formatTime(t.timestamp),
        viewers: t.viewer_count,
      }))
    : Array.from({ length: 12 }, (_, i) => ({
        time: `${String(i + 8).padStart(2,'0')}:00`,
        viewers: Math.floor(Math.random() * 10000 + 2000),
      }))

  if (!session) return (
    <div className="flex items-center justify-center h-64 text-muted font-body">Memuat sesi...</div>
  )

  const isLive = session.status === 'live'
  const isScheduled = session.status === 'scheduled'
  const studioColor = session.studio?.code === 'STUDIO_A' ? '#00e5ff' : '#ff3d6b'

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted font-body">
        <Link to="/sessions" className="hover:text-accent transition-colors">Sesi Live</Link>
        <span>/</span>
        <span className="text-text">{session.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl tracking-widest text-text">{session.title.toUpperCase()}</h1>
            <span className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border',
              isLive ? 'bg-accent3/10 border-accent3/30 text-accent3'
                : isScheduled ? 'bg-gold/10 border-gold/30 text-gold'
                : 'bg-muted/10 border-muted/30 text-muted'
            )}>
              {isLive && <span className="w-1.5 h-1.5 rounded-full bg-accent3 animate-pulse2" />}
              {isLive ? 'LIVE' : isScheduled ? 'TERJADWAL' : session.status}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted font-body flex-wrap">
            <span>👤 {session.client?.name}</span>
            <span>🎬 {session.studio?.name}</span>
            <span>{PLATFORM_ICONS[session.platform]} {PLATFORM_LABELS[session.platform]}</span>
            {session.platform_account && <span className="text-accent">@{session.platform_account.replace('@', '')}</span>}
            <span>📅 {formatDateTime(session.scheduled_start)}</span>
          </div>
        </div>

        {canControl && (
          <div className="flex gap-2">
            {isScheduled && (
              <button onClick={handleStart}
                className="flex items-center gap-2 bg-accent3/10 border border-accent3/30 text-accent3 px-5 py-2 rounded-xl font-bold text-sm hover:bg-accent3/20 transition-all">
                ▶ Mulai Live
              </button>
            )}
            {isLive && (
              <button onClick={handleEnd}
                className="flex items-center gap-2 bg-accent2/10 border border-accent2/30 text-accent2 px-5 py-2 rounded-xl font-bold text-sm hover:bg-accent2/20 transition-all">
                ⏹ Akhiri Sesi
              </button>
            )}
            <Link to={`/metrics/input?session=${session.id}`} className="flex items-center gap-2 bg-accent/10 border border-accent/30 text-accent px-4 py-2 rounded-xl text-sm hover:bg-accent/20 transition-all">
              📊 Input Metrics
            </Link>
            <Link to="/reports" className="flex items-center gap-2 bg-surface2 border border-border text-muted px-4 py-2 rounded-xl text-sm hover:text-text hover:border-accent/30 transition-all">
              📋 Laporan
            </Link>
          </div>
        )}
      </div>

      {/* Live timer banner */}
      {isLive && (
        <div className="bg-accent3/5 border border-accent3/20 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-3 h-3 bg-accent2 rounded-full animate-pulse2 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-accent3 font-bold text-sm">Sesi sedang berlangsung</div>
            <div className="text-muted text-xs font-body mt-0.5">Studio: {session.studio?.name}</div>
          </div>
          <div className="font-mono text-2xl font-bold text-text">{elapsed}</div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Viewers Sekarang', value: isLive ? formatNumber(metrics?.current_viewers || 0) : '—', color: 'text-accent', icon: '👁️' },
          { label: 'Peak Viewers', value: formatNumber(metrics?.peak_viewers || 0), color: 'text-accent', icon: '📈' },
          { label: 'Gift Revenue', value: isLive || session.status === 'completed' ? formatIDR(metrics?.gift_revenue || 0) : '—', color: 'text-gold', icon: '🎁' },
          { label: 'New Followers', value: formatNumber(metrics?.new_followers || 0), color: 'text-accent2', icon: '⭐' },
          { label: 'Komentar', value: formatNumber(metrics?.total_comments || 0), color: 'text-accent3', icon: '💬' },
          { label: 'Engagement', value: metrics ? `${metrics.engagement_rate.toFixed(1)}%` : '—', color: 'text-text', icon: '💹' },
        ].map(m => (
          <div key={m.label} className="bg-surface border border-border rounded-xl p-3">
            <div className="text-base">{m.icon}</div>
            <div className={cn('font-display text-xl tracking-wide mt-1', m.color)}>{m.value}</div>
            <div className="text-muted text-xs font-body mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-4">
        {/* Viewer Chart */}
        <div className="col-span-2 bg-surface border border-border rounded-2xl p-4">
          <div className="font-display text-sm tracking-widest text-text mb-1">VIEWER TIMELINE</div>
          <div className="text-muted text-xs font-body mb-4">Grafik jumlah penonton</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradViewer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={studioColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={studioColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fill: '#5c6b7a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5c6b7a', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
              <Tooltip
                contentStyle={{ background: '#131920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', fontSize: '12px' }}
                formatter={(v: number) => [formatNumber(v), 'Viewers']}
              />
              <Area type="monotone" dataKey="viewers" stroke={studioColor} strokeWidth={2} fill="url(#gradViewer)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Feed */}
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-display text-sm tracking-widest text-text">AKTIVITAS</div>
              <div className="text-muted text-xs font-body">Real-time feed</div>
            </div>
            {isLive && <span className="w-2 h-2 bg-accent3 rounded-full animate-pulse2" />}
          </div>

          <div ref={feedRef} className="flex-1 space-y-2 overflow-y-auto max-h-64">
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted text-xs font-body">
                {isLive ? 'Menunggu aktivitas...' : 'Belum ada aktivitas'}
              </div>
            ) : events.map(ev => {
              const cfg = EVENT_CONFIG[ev.event_type] || EVENT_CONFIG.comment
              return (
                <div key={ev.id} className={cn('flex gap-2 p-2 bg-surface2 rounded-lg border-l-2 text-xs animate-slideIn', cfg.color)}>
                  <span className="flex-shrink-0">{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-text">{ev.username || 'user'}</span>
                    <span className="text-muted ml-1">{cfg.label}</span>
                    {ev.content && <div className="text-muted truncate mt-0.5">"{ev.content}"</div>}
                    {ev.value > 0 && <div className="text-gold font-mono text-xs mt-0.5">{formatIDR(ev.value)}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Session Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="font-display text-sm tracking-widest text-text mb-4">INFO SESI</div>
          <dl className="space-y-3">
            {[
              { label: 'Klien', value: session.client?.name || '—' },
              { label: 'Studio', value: session.studio?.name || '—' },
              { label: 'Platform', value: `${PLATFORM_ICONS[session.platform]} ${PLATFORM_LABELS[session.platform]}` },
              { label: 'Akun', value: session.platform_account ? `@${session.platform_account.replace('@','')}` : '—' },
              { label: 'Operator', value: session.operator?.full_name || '—' },
              { label: 'Jadwal Mulai', value: formatDateTime(session.scheduled_start) },
              { label: 'Jadwal Selesai', value: session.scheduled_end ? formatDateTime(session.scheduled_end) : '—' },
              { label: 'Aktual Mulai', value: session.actual_start ? formatDateTime(session.actual_start) : '—' },
              { label: 'Aktual Selesai', value: session.actual_end ? formatDateTime(session.actual_end) : '—' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-start gap-4">
                <dt className="text-xs text-muted font-body flex-shrink-0">{row.label}</dt>
                <dd className="text-xs text-text font-body text-right">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="font-display text-sm tracking-widest text-text mb-4">RINGKASAN PERFORMA</div>
          <div className="space-y-3">
            {[
              { label: 'Total Unique Viewers', value: formatNumber(metrics?.total_unique_viewers || 0), color: 'text-accent' },
              { label: 'Total Likes', value: formatNumber(metrics?.total_likes || 0), color: 'text-accent2' },
              { label: 'Total Shares', value: formatNumber(metrics?.total_shares || 0), color: 'text-accent3' },
              { label: 'Product Revenue', value: formatIDR(metrics?.product_revenue || 0), color: 'text-gold' },
              { label: 'Total Revenue', value: formatIDR(metrics?.total_revenue || 0), color: 'text-gold' },
              { label: 'Durasi', value: metrics?.duration_minutes ? `${Math.floor(metrics.duration_minutes / 60)}j ${metrics.duration_minutes % 60}m` : '—', color: 'text-text' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-xs text-muted font-body">{row.label}</span>
                <span className={cn('text-xs font-mono font-bold', row.color)}>{row.value}</span>
              </div>
            ))}
          </div>

          {session.notes && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs text-muted font-body mb-1">Catatan</div>
              <p className="text-xs text-text font-body">{session.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
