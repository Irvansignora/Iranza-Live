import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { useDashboardStats, useViewerTrend, usePlatformSplit, useWeeklyRevenue, useStudioLiveMetrics } from '@/hooks/useData'
import { formatIDR, formatNumber, formatTime, cn, PLATFORM_ICONS } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'

const STUDIO_COLORS = ['#00e5ff', '#ff3d6b', '#a3ff6b', '#ffc93c']

function formatChange(pct: number) {
  const rounded = Math.round(pct)
  const sign = rounded > 0 ? '+' : ''
  return { change: `${sign}${rounded}%`, up: rounded >= 0 }
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl opacity-20 mb-2">📊</div>
        <div className="text-muted text-xs font-body">{message}</div>
      </div>
    </div>
  )
}

function StudioLiveCard({ studio, idx, liveSession }: {
  studio: { id: string; name: string; description: string | null; status: string }
  idx: number
  liveSession?: { id: string; title: string; platform: string; platform_account: string | null }
}) {
  const color = STUDIO_COLORS[idx % STUDIO_COLORS.length]
  const isLive = studio.status === 'live'
  const metrics = useStudioLiveMetrics(isLive && liveSession ? liveSession.id : null)

  return (
    <div
      className="bg-surface border border-border rounded-2xl overflow-hidden relative"
      style={{ borderTop: `2px solid ${color}` }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-display text-xl tracking-widest" style={{ color }}>
              {studio.name.toUpperCase()}
            </div>
            <div className="text-muted text-xs font-body mt-0.5">{studio.description}</div>
          </div>
          <span className={cn(
            'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest',
            isLive ? 'bg-accent3/10 border border-accent3/30 text-accent3'
              : studio.status === 'standby' ? 'bg-gold/10 border border-gold/30 text-gold'
              : 'bg-muted/10 border border-muted/30 text-muted'
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full', isLive && 'animate-pulse2')}
              style={{ background: isLive ? '#a3ff6b' : studio.status === 'standby' ? '#ffc93c' : '#5c6b7a' }} />
            {isLive ? 'LIVE' : studio.status === 'standby' ? 'STANDBY' : studio.status}
          </span>
        </div>

        {/* Preview area */}
        <div className="h-16 rounded-xl bg-bg/80 mb-3 flex items-center justify-center overflow-hidden relative">
          {isLive && liveSession ? (
            <div className="flex items-center gap-3 w-full px-4">
              <div className="flex items-end gap-0.5 h-8">
                {[...Array(14)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-sm"
                    style={{
                      background: color,
                      height: `${20 + Math.random() * 80}%`,
                      animation: `wave ${0.5 + Math.random() * 0.5}s ease-in-out infinite alternate`,
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                ))}
              </div>
              <div className="flex-1">
                <div className="text-xs font-body font-medium text-text truncate">
                  {liveSession.title}
                </div>
                <div className="text-xs text-muted flex items-center gap-1 mt-0.5">
                  {PLATFORM_ICONS[liveSession.platform as keyof typeof PLATFORM_ICONS]} {liveSession.platform_account}
                </div>
              </div>
              <div className="font-mono text-xs text-muted">⏱ Live</div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-2xl opacity-20">📷</div>
              <div className="text-xs text-muted font-body mt-1">
                {studio.status === 'standby' ? 'Siap mulai' : 'Offline'}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Viewers', value: isLive ? (metrics ? formatNumber(metrics.current_viewers) : '—') : '—' },
            { label: 'Peak', value: isLive ? (metrics ? formatNumber(metrics.peak_viewers) : '—') : '—' },
            { label: 'Gifts', value: isLive ? (metrics ? formatIDR(metrics.gift_revenue) : '—') : '—' },
            { label: 'Engage', value: isLive ? (metrics ? `${metrics.engagement_rate.toFixed(1)}%` : '—') : '—' },
          ].map(m => (
            <div key={m.label} className="bg-surface2 rounded-lg p-2 text-center">
              <div className="font-mono text-sm font-bold" style={{ color }}>{m.value}</div>
              <div className="text-muted text-xs font-body mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { profile } = useAuthStore()
  const { studios, sessions, activePeriod, setActivePeriod, fetchStudios, fetchSessions } = useAppStore()
  const { stats, loading } = useDashboardStats(activePeriod)
  const { data: viewerData, studioNames, hasData: hasViewerData } = useViewerTrend()
  const { data: platformData, hasData: hasPlatformData } = usePlatformSplit(activePeriod)
  const { data: weeklyData, hasData: hasWeeklyData } = useWeeklyRevenue()

  useEffect(() => {
    fetchStudios()
    fetchSessions()
  }, [fetchStudios, fetchSessions])

  const liveSessions = sessions.filter(s => s.status === 'live')
  const todaySessions = sessions.filter(s => {
    const today = new Date().toDateString()
    return new Date(s.scheduled_start).toDateString() === today
  })

  const isClient = profile?.role === 'client'

  const viewersChange = formatChange(stats.changeViewers)
  const revenueChange = formatChange(stats.changeRevenue)
  const followersChange = formatChange(stats.changeFollowers)
  const sessionsChange = formatChange(stats.changeSessions)
  const engagementChange = formatChange(stats.changeEngagement)

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-widest text-text">
            {isClient ? 'LAPORAN' : 'DASHBOARD'} <span className="text-accent">LIVE</span>
          </h1>
          <p className="text-muted text-sm font-body mt-1">
            {isClient
              ? `Selamat datang, ${profile?.full_name} — Pantau hasil live stream kamu`
              : `Monitoring real-time · ${studios.length} Studio`
            }
          </p>
        </div>

        <div className="flex gap-2">
          {(['today', '7d', '30d'] as const).map(p => (
            <button
              key={p}
              onClick={() => setActivePeriod(p)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-body font-medium transition-all',
                activePeriod === p
                  ? 'bg-accent/10 border border-accent/30 text-accent'
                  : 'bg-surface2 border border-border text-muted hover:text-text'
              )}
            >
              {p === 'today' ? 'Hari Ini' : p === '7d' ? '7 Hari' : '30 Hari'}
            </button>
          ))}
        </div>
      </div>

      {/* Studio Status Cards */}
      {!isClient && (
        <div className="grid grid-cols-2 gap-4">
          {studios.map((studio, idx) => {
            const studioSession = liveSessions.find(s => s.studio_id === studio.id)
            return (
              <StudioLiveCard
                key={studio.id}
                studio={studio}
                idx={idx}
                liveSession={studioSession ? {
                  id: studioSession.id,
                  title: studioSession.title,
                  platform: studioSession.platform,
                  platform_account: studioSession.platform_account,
                } : undefined}
              />
            )
          })}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { icon: '👁️', label: 'Live Viewers', value: formatNumber(stats.totalViewers), color: 'text-accent', ...viewersChange },
          { icon: '🎁', label: 'Total Revenue', value: formatIDR(stats.totalRevenue), color: 'text-gold', ...revenueChange },
          { icon: '⭐', label: 'New Followers', value: formatNumber(stats.totalFollowers), color: 'text-accent2', ...followersChange },
          { icon: '▶', label: 'Total Sesi', value: stats.totalSessions.toString(), color: 'text-accent3', ...sessionsChange },
          { icon: '💹', label: 'Avg Engagement', value: `${stats.avgEngagement.toFixed(1)}%`, color: 'text-text', ...engagementChange },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-surface border border-border rounded-2xl p-4 relative overflow-hidden hover:-translate-y-0.5 transition-transform"
          >
            <span className="text-xl">{kpi.icon}</span>
            <div className={cn('font-display text-2xl mt-2 tracking-wide', kpi.color)}>
              {loading ? <span className="opacity-30">—</span> : kpi.value}
            </div>
            <div className="text-muted text-xs font-body mt-1">{kpi.label}</div>
            {!loading && (
              <div className={cn(
                'absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full',
                kpi.up ? 'bg-accent3/10 text-accent3' : 'bg-accent2/10 text-accent2'
              )}>
                {kpi.change}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Viewer Trend — spans 2 cols */}
        <div className="col-span-2 bg-surface border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-display text-sm tracking-widest text-text">VIEWER TREND</div>
              <div className="text-muted text-xs font-body">Hari ini, per studio</div>
            </div>
            {hasViewerData && (
              <div className="flex gap-3 text-xs font-body">
                {studioNames.map((name, i) => (
                  <span key={name} className="flex items-center gap-1.5" style={{ color: STUDIO_COLORS[i % STUDIO_COLORS.length] }}>
                    <span className="w-3 h-0.5 rounded inline-block" style={{ background: STUDIO_COLORS[i % STUDIO_COLORS.length] }} /> {name}
                  </span>
                ))}
              </div>
            )}
          </div>
          {hasViewerData ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={viewerData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <defs>
                  {studioNames.map((name, i) => (
                    <linearGradient key={name} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={STUDIO_COLORS[i % STUDIO_COLORS.length]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={STUDIO_COLORS[i % STUDIO_COLORS.length]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fill: '#5c6b7a', fontSize: 10, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5c6b7a', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip
                  contentStyle={{ background: '#131920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#e8edf2' }}
                  formatter={(v: number) => [formatNumber(v), '']}
                />
                {studioNames.map((name, i) => (
                  <Area
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={STUDIO_COLORS[i % STUDIO_COLORS.length]}
                    strokeWidth={2}
                    fill={`url(#grad-${i})`}
                    name={name}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200 }}>
              <EmptyChartState message="Belum ada data viewer hari ini" />
            </div>
          )}
        </div>

        {/* Platform Split */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="font-display text-sm tracking-widest text-text mb-1">PLATFORM SPLIT</div>
          <div className="text-muted text-xs font-body mb-3">Distribusi views</div>
          {hasPlatformData ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={platformData} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                    dataKey="value" stroke="none">
                    {platformData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#131920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v: number) => [`${v}%`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {platformData.map(p => (
                  <div key={p.name} className="flex items-center justify-between text-xs font-body">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                      <span className="text-muted">{p.name}</span>
                    </div>
                    <span className="font-mono font-bold" style={{ color: p.color }}>{p.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 140 }}>
              <EmptyChartState message="Belum ada sesi pada periode ini" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Weekly Revenue */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="font-display text-sm tracking-widest text-text mb-1">REVENUE MINGGUAN</div>
          <div className="text-muted text-xs font-body mb-3">7 hari terakhir</div>
          {hasWeeklyData ? (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <XAxis dataKey="day" tick={{ fill: '#5c6b7a', fontSize: 10, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#131920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(v: number) => [formatIDR(v), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#00e5ff" opacity={0.8} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 140 }}>
              <EmptyChartState message="Belum ada revenue 7 hari terakhir" />
            </div>
          )}
        </div>

        {/* Today's Schedule */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-display text-sm tracking-widest text-text">JADWAL HARI INI</div>
              <div className="text-muted text-xs font-body">{todaySessions.length} sesi</div>
            </div>
            <Link to="/sessions" className="text-xs text-accent hover:underline font-body">Lihat semua →</Link>
          </div>
          <div className="space-y-2">
            {todaySessions.length === 0 ? (
              <div className="py-6 text-center text-muted text-sm font-body">Tidak ada jadwal hari ini</div>
            ) : todaySessions.slice(0, 4).map(s => (
              <div
                key={s.id}
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-xl border-l-2 bg-surface2',
                  s.status === 'live' ? 'border-accent3' : s.status === 'scheduled' ? 'border-gold' : 'border-muted opacity-50'
                )}
              >
                <div className="font-mono text-xs text-muted w-12 flex-shrink-0">
                  {formatTime(s.scheduled_start)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium font-body text-text truncate">{s.title}</div>
                  <div className="text-xs text-muted font-body">{s.client?.name}</div>
                </div>
                <span className={cn(
                  'text-xs font-bold px-1.5 py-0.5 rounded',
                  s.status === 'live' ? 'bg-accent3/10 text-accent3'
                    : s.status === 'scheduled' ? 'bg-gold/10 text-gold'
                    : 'bg-muted/10 text-muted'
                )}>
                  {s.status === 'live' ? 'LIVE' : s.status === 'scheduled' ? 'Soon' : 'Done'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="font-display text-sm tracking-widest text-text mb-3">AKSI CEPAT</div>
          <div className="space-y-2">
            {!isClient && (
              <>
                <Link to="/sessions/new" className="flex items-center gap-3 p-3 bg-accent/10 border border-accent/20 rounded-xl hover:bg-accent/15 transition-colors group">
                  <span className="text-lg">▶</span>
                  <div>
                    <div className="text-xs font-bold text-accent font-body">Buat Sesi Baru</div>
                    <div className="text-xs text-muted font-body">Jadwalkan live stream</div>
                  </div>
                </Link>
                <Link to="/clients/new" className="flex items-center gap-3 p-3 bg-surface2 border border-border rounded-xl hover:border-accent/30 transition-colors">
                  <span className="text-lg">👤</span>
                  <div>
                    <div className="text-xs font-bold text-text font-body">Tambah Klien</div>
                    <div className="text-xs text-muted font-body">Daftarkan klien baru</div>
                  </div>
                </Link>
              </>
            )}
            <Link to="/metrics/input" className="flex items-center gap-3 p-3 bg-surface2 border border-border rounded-xl hover:border-accent/30 transition-colors">
              <span className="text-lg">📊</span>
              <div>
                <div className="text-xs font-bold text-text font-body">Input Metrics</div>
                <div className="text-xs text-muted font-body">OCR screenshot / manual</div>
              </div>
            </Link>
            <Link to="/reports" className="flex items-center gap-3 p-3 bg-surface2 border border-border rounded-xl hover:border-accent/30 transition-colors">
              <span className="text-lg">📋</span>
              <div>
                <div className="text-xs font-bold text-text font-body">Generate Laporan</div>
                <div className="text-xs text-muted font-body">Buat & kirim ke klien</div>
              </div>
            </Link>
            <Link to="/media" className="flex items-center gap-3 p-3 bg-surface2 border border-border rounded-xl hover:border-accent/30 transition-colors">
              <span className="text-lg">🖼️</span>
              <div>
                <div className="text-xs font-bold text-text font-body">Upload Media</div>
                <div className="text-xs text-muted font-body">Foto & video ke Cloudinary</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
