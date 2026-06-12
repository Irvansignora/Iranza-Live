import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { cn, formatDateTime } from '@/lib/utils'
import type { Studio, StudioStatus } from '@/lib/database.types'
import toast from 'react-hot-toast'

const STATUS_CONFIG: Record<StudioStatus, { label: string; color: string; bg: string; border: string }> = {
  live:        { label: 'LIVE',        color: 'text-accent3', bg: 'bg-accent3/10', border: 'border-accent3/30' },
  standby:     { label: 'STANDBY',     color: 'text-gold',    bg: 'bg-gold/10',    border: 'border-gold/30' },
  maintenance: { label: 'MAINTENANCE', color: 'text-accent2', bg: 'bg-accent2/10', border: 'border-accent2/30' },
  offline:     { label: 'OFFLINE',     color: 'text-muted',   bg: 'bg-muted/10',   border: 'border-muted/30' },
}

export default function StudiosPage() {
  const { profile } = useAuthStore()
  const { studios, fetchStudios, updateStudioStatus } = useAppStore()
  const [sessions, setSessions] = useState<Record<string, number>>({})

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin'

  useEffect(() => {
    fetchStudios()
    // Load session count per studio
    supabase.from('live_sessions').select('studio_id, status')
      .in('status', ['live', 'scheduled'])
      .then(({ data }) => {
        const counts: Record<string, number> = {}
        data?.forEach(s => { if (s.studio_id) counts[s.studio_id] = (counts[s.studio_id] || 0) + 1 })
        setSessions(counts)
      })
  }, [fetchStudios])

  const handleStatusChange = async (studio: Studio, status: StudioStatus) => {
    const { error } = await updateStudioStatus(studio.id, status)
    if (!error) toast.success(`${studio.name} → ${STATUS_CONFIG[status].label}`)
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-widest text-text">MANAJEMEN <span className="text-accent">STUDIO</span></h1>
        <p className="text-muted text-sm font-body mt-1">{studios.length} studio tersedia</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {studios.map((studio, idx) => {
          const cfg = STATUS_CONFIG[studio.status]
          const studioColor = idx === 0 ? '#00e5ff' : '#ff3d6b'
          const isLive = studio.status === 'live'

          return (
            <div
              key={studio.id}
              className="bg-surface border border-border rounded-2xl overflow-hidden"
              style={{ borderTop: `2px solid ${studioColor}` }}
            >
              {/* Studio preview */}
              <div className="h-40 bg-bg relative overflow-hidden flex items-center justify-center">
                {studio.thumbnail_url ? (
                  <img src={studio.thumbnail_url} alt={studio.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center opacity-20">
                    <div className="text-5xl">🎬</div>
                    <div className="text-xs font-body mt-2">{studio.name}</div>
                  </div>
                )}

                {isLive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-end gap-1 h-12">
                      {[...Array(16)].map((_, i) => (
                        <div key={i} className="w-1.5 rounded-sm"
                          style={{
                            background: studioColor,
                            height: `${20 + Math.random() * 80}%`,
                            animation: `wave ${0.4 + Math.random() * 0.5}s ease-in-out infinite alternate`,
                            animationDelay: `${i * 0.04}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="absolute top-3 left-3">
                  <span className={cn('text-xs font-bold px-3 py-1 rounded-full border', cfg.color, cfg.bg, cfg.border)}>
                    {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent3 animate-pulse2 mr-1" />}
                    {cfg.label}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="font-display text-xl tracking-widest" style={{ color: studioColor }}>{studio.name.toUpperCase()}</h2>
                    <p className="text-muted text-xs font-body mt-0.5">{studio.description}</p>
                  </div>
                  <div className="text-xs font-body text-muted text-right">
                    <div>{sessions[studio.id] || 0} sesi aktif</div>
                    <div>Kapasitas: {studio.capacity} org</div>
                  </div>
                </div>

                {studio.location && (
                  <div className="text-xs text-muted font-body mb-3">📍 {studio.location}</div>
                )}

                {/* Equipment tags */}
                {Array.isArray(studio.equipment) && studio.equipment.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(studio.equipment as string[]).map((eq) => (
                      <span key={eq} className="text-xs font-body bg-surface2 border border-border px-2 py-0.5 rounded-lg text-muted">
                        {eq}
                      </span>
                    ))}
                  </div>
                )}

                {/* Status controls */}
                {isAdmin && (
                  <div>
                    <div className="text-xs font-body text-muted mb-2 uppercase tracking-wider">Ubah Status</div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(Object.keys(STATUS_CONFIG) as StudioStatus[]).map(s => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(studio, s)}
                          disabled={studio.status === s}
                          className={cn(
                            'py-1.5 text-xs font-body font-bold rounded-lg border transition-all',
                            studio.status === s
                              ? `${STATUS_CONFIG[s].color} ${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].border}`
                              : 'border-border text-muted hover:text-text hover:border-accent/30'
                          )}
                        >
                          {STATUS_CONFIG[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes wave {
          from { transform: scaleY(0.3); }
          to { transform: scaleY(1); }
        }
      `}</style>
    </div>
  )
}
