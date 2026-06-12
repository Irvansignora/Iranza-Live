import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { useClients } from '@/hooks/useData'
import { cn, formatDateTime, formatTime, formatDuration, PLATFORM_ICONS, PLATFORM_LABELS } from '@/lib/utils'
import type { LiveSession, SessionStatus } from '@/lib/database.types'
import toast from 'react-hot-toast'

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; bg: string; border: string }> = {
  scheduled: { label: 'Terjadwal', color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/30' },
  live:       { label: 'LIVE',      color: 'text-accent3', bg: 'bg-accent3/10', border: 'border-accent3/30' },
  completed:  { label: 'Selesai',   color: 'text-muted', bg: 'bg-muted/10', border: 'border-muted/30' },
  cancelled:  { label: 'Dibatal',   color: 'text-accent2', bg: 'bg-accent2/10', border: 'border-accent2/30' },
}

export default function SessionsPage() {
  const { profile } = useAuthStore()
  const { sessions, sessionsLoading, fetchSessions, startSession, endSession, updateSession } = useAppStore()
  const { clients } = useClients()
  const navigate = useNavigate()

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterClient, setFilterClient] = useState<string>('all')
  const [search, setSearch] = useState('')

  const isClient = profile?.role === 'client'
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin'
  const isOperator = profile?.role === 'operator'

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const filtered = sessions.filter(s => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false
    if (filterClient !== 'all' && s.client_id !== filterClient) return false
    if (search && !s.title.toLowerCase().includes(search.toLowerCase()) &&
        !s.client?.name?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleStart = async (s: LiveSession) => {
    const { error } = await startSession(s.id)
    if (error) toast.error('Gagal memulai sesi')
    else toast.success(`🔴 ${s.title} sekarang LIVE!`)
  }

  const handleEnd = async (s: LiveSession) => {
    if (!confirm('Yakin mau mengakhiri sesi ini?')) return
    const { error } = await endSession(s.id)
    if (error) toast.error('Gagal mengakhiri sesi')
    else toast.success(`✅ Sesi ${s.title} selesai`)
  }

  const handleCancel = async (s: LiveSession) => {
    if (!confirm('Yakin mau membatalkan sesi ini?')) return
    const { error } = await updateSession(s.id, { status: 'cancelled' })
    if (error) toast.error('Gagal membatalkan sesi')
    else toast.success('Sesi dibatalkan')
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-widest text-text">SESI <span className="text-accent">LIVE</span></h1>
          <p className="text-muted text-sm font-body mt-1">{sessions.length} total sesi terdaftar</p>
        </div>
        {(isAdmin || isOperator) && (
          <Link
            to="/sessions/new"
            className="flex items-center gap-2 bg-accent text-bg px-5 py-2.5 rounded-xl font-body font-bold text-sm hover:brightness-110 transition-all"
          >
            + Buat Sesi
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari sesi atau klien..."
          className="bg-surface2 border border-border rounded-xl px-4 py-2 text-sm font-body text-text placeholder-muted/50 focus:outline-none focus:border-accent transition-colors w-64"
        />

        <div className="flex bg-surface2 border border-border rounded-xl overflow-hidden">
          {['all', 'live', 'scheduled', 'completed', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                'px-3 py-2 text-xs font-body font-medium transition-all',
                filterStatus === s ? 'bg-accent/10 text-accent' : 'text-muted hover:text-text'
              )}
            >
              {s === 'all' ? 'Semua' : STATUS_CONFIG[s as SessionStatus]?.label || s}
            </button>
          ))}
        </div>

        {!isClient && (
          <select
            value={filterClient}
            onChange={e => setFilterClient(e.target.value)}
            className="bg-surface2 border border-border rounded-xl px-3 py-2 text-xs font-body text-text focus:outline-none focus:border-accent transition-colors"
          >
            <option value="all">Semua Klien</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}

        <span className="text-muted text-xs font-body ml-auto">{filtered.length} sesi</span>
      </div>

      {/* Session Cards */}
      {sessionsLoading ? (
        <div className="py-20 text-center text-muted font-body">Memuat sesi...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-4xl mb-3 opacity-30">📭</div>
          <div className="text-muted font-body text-sm">Tidak ada sesi ditemukan</div>
          {(isAdmin || isOperator) && (
            <Link to="/sessions/new" className="mt-4 inline-block text-accent text-sm hover:underline font-body">
              + Buat sesi pertama
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => {
            const cfg = STATUS_CONFIG[s.status]
            const isLive = s.status === 'live'
            const isScheduled = s.status === 'scheduled'

            return (
              <div
                key={s.id}
                className={cn(
                  'bg-surface border border-border rounded-2xl p-4 hover:border-accent/20 transition-all group',
                  isLive && 'border-accent3/20 bg-accent3/5'
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Platform icon */}
                  <div className="w-10 h-10 bg-surface2 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {PLATFORM_ICONS[s.platform]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-body font-semibold text-sm text-text">{s.title}</h3>
                      <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border', cfg.color, cfg.bg, cfg.border)}>
                        {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent3 animate-pulse2 mr-1" />}
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted font-body flex-wrap">
                      <span>👤 {s.client?.name || '—'}</span>
                      <span>🎬 {s.studio?.name || '—'}</span>
                      <span>{PLATFORM_ICONS[s.platform]} {PLATFORM_LABELS[s.platform]}</span>
                      <span>🕐 {formatDateTime(s.scheduled_start)}</span>
                      {s.platform_account && <span className="text-accent">@{s.platform_account.replace('@', '')}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      to={`/sessions/${s.id}`}
                      className="px-3 py-1.5 text-xs font-body border border-border rounded-lg text-muted hover:text-text hover:border-accent/30 transition-all"
                    >
                      Detail
                    </Link>

                    {(isAdmin || isOperator) && isScheduled && (
                      <button
                        onClick={() => handleStart(s)}
                        className="px-3 py-1.5 text-xs font-body font-bold bg-accent3/10 border border-accent3/30 text-accent3 rounded-lg hover:bg-accent3/20 transition-all"
                      >
                        ▶ Mulai
                      </button>
                    )}

                    {(isAdmin || isOperator) && isLive && (
                      <button
                        onClick={() => handleEnd(s)}
                        className="px-3 py-1.5 text-xs font-body font-bold bg-accent2/10 border border-accent2/30 text-accent2 rounded-lg hover:bg-accent2/20 transition-all"
                      >
                        ⏹ Stop
                      </button>
                    )}

                    {isAdmin && isScheduled && (
                      <button
                        onClick={() => handleCancel(s)}
                        className="px-3 py-1.5 text-xs font-body text-muted hover:text-accent2 transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
