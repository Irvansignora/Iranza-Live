import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { useDashboardStats } from '@/hooks/useData'
import { formatIDR, formatNumber, formatTime, cn, PLATFORM_ICONS } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts'

const COLORS = ['#00e5ff', '#ff3d6b', '#a3ff6b', '#ffc93c', '#8b5cf6']

// Mock viewer trend data — in production, this comes from viewer_timeline table
const viewerData = [
  { time: '08:00', studioA: 0, studioB: 0 },
  { time: '09:00', studioA: 5200, studioB: 0 },
  { time: '10:00', studioA: 8400, studioB: 7100 },
  { time: '11:00', studioA: 12500, studioB: 9800 },
  { time: '12:00', studioA: 18200, studioB: 11400 },
  { time: '13:00', studioA: 14600, studioB: 8200 },
  { time: '14:00', studioA: 12400, studioB: 0 },
  { time: '15:00', studioA: 13800, studioB: 0 },
  { time: '16:00', studioA: 11200, studioB: 0 },
  { time: '17:00', studioA: 9800, studioB: 0 },
]

const platformData = [
  { name: 'TikTok', value: 59, color: '#00e5ff' },
  { name: 'Shopee', value: 28, color: '#ff3d6b' },
  { name: 'Instagram', value: 8, color: '#a3ff6b' },
  { name: 'YouTube', value: 5, color: '#ffc93c' },
]

const weeklyData = [
  { day: 'Sen', sessions: 2, revenue: 3200000 },
  { day: 'Sel', sessions: 3, revenue: 4800000 },
  { day: 'Rab', sessions: 2, revenue: 2900000 },
  { day: 'Kam', sessions: 4, revenue: 7100000 },
  { day: 'Jum', sessions: 3, revenue: 5400000 },
  { day: 'Sab', sessions: 5, revenue: 9800000 },
  { day: 'Min', sessions: 2, revenue: 3600000 },
]

export default function DashboardPage() {
  const { profile } = useAuthStore()
  const { studios, sessions, activePeriod, setActivePeriod, fetchStudios, fetchSessions } = useAppStore()
  const { stats, loading } = useDashboardStats(activePeriod)

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
              : 'Monitoring real-time · 2 Studio · Auto-refresh setiap 5 detik'
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
            const isLive = studio.status === 'live'
            const color = idx === 0 ? '#00e5ff' : '#ff3d6b'

            return (
              <div
                key={studio.id}
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
                    {isLive && studioSession ? (
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
                            {studioSession.title}
                          </div>
                          <div className="text-xs text-muted flex items-center gap-1 mt-0.5">
                            {PLATFORM_ICONS[studioSession.platform]} {studioSession.platform_account}
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
                      { label: 'Viewers', value: isLive ? formatNumber(Math.floor(Math.random() * 15000 + 5000)) : '—' },
                      { label: 'Peak', value: '18.2K' },
                      { label: 'Gifts', value: isLive ? 'Rp 1.2jt' : '—' },
                      { label: 'Engage', value: isLive ? '8.4%' : '—' },
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
          })}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { icon: '👁️', label: 'Live Viewers', value: formatNumber(stats.totalViewers), color: 'text-accent', change: '+23%', up: true },
          { icon: '🎁', label: 'Total Revenue', value: formatIDR(stats.totalRevenue), color: 'text-gold', change: '+15%', up: true },
          { icon: '⭐', label: 'New Followers', value: formatNumber(stats.totalFollowers), color: 'text-accent2', change: '+31%', up: true },
          { icon: '▶', label: 'Total Sesi', value: stats.totalSessions.toString(), color: 'text-accent3', change: '+8%', up: true },
          { icon: '💹', label: 'Avg Engagement', value: `${stats.avgEngagement.toFixed(1)}%`, color: 'text-text', change: '-2%', up: false },
        ].map((kpi, i) => (
          <div
            key={kpi.label}
            className="bg-surface border border-border rounded-2xl p-4 relative overflow-hidden hover:-translate-y-0.5 transition-transform"
          >
            <span className="text-xl">{kpi.icon}</span>
            <div className={cn('font-display text-2xl mt-2 tracking-wide', kpi.color)}>
              {loading ? <span className="opacity-30">—</span> : kpi.value}
            </div>
            <div className="text-muted text-xs font-body mt-1">{kpi.label}</div>
            <div className={cn(
              'absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full',
              kpi.up ? 'bg-accent3/10 text-accent3' : 'bg-accent2/10 text-accent2'
            )}>
              {kpi.change}
            </div>
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
              <div className="text-muted text-xs font-body">Studio A vs Studio B</div>
            </div>
            <div className="flex gap-3 text-xs font-body">
              <span className="flex items-center gap-1.5 text-accent">
                <span className="w-3 h-0.5 bg-accent rounded inline-block" /> Studio A
              </span>
              <span className="flex items-center gap-1.5 text-accent2">
                <span className="w-3 h-0.5 bg-accent2 rounded inline-block" /> Studio B
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={viewerData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff3d6b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff3d6b" stopOpacity={0} />
                </linearGradient>
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
              <Area type="monotone" dataKey="studioA" stroke="#00e5ff" strokeWidth={2} fill="url(#gradA)" name="Studio A" />
              <Area type="monotone" dataKey="studioB" stroke="#ff3d6b" strokeWidth={2} fill="url(#gradB)" name="Studio B" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Split */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="font-display text-sm tracking-widest text-text mb-1">PLATFORM SPLIT</div>
          <div className="text-muted text-xs font-body mb-3">Distribusi views</div>
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
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Weekly Revenue */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="font-display text-sm tracking-widest text-text mb-1">REVENUE MINGGUAN</div>
          <div className="text-muted text-xs font-body mb-3">7 hari terakhir</div>
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
