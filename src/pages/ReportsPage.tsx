import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { useClients } from '@/hooks/useData'
import { supabase } from '@/lib/supabase'
import { cn, formatDateTime, formatIDR, formatNumber, formatDate } from '@/lib/utils'
import type { Report } from '@/lib/database.types'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const { profile } = useAuthStore()
  const { sessions } = useAppStore()
  const { clients } = useClients()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin'

  const [genForm, setGenForm] = useState({
    client_id: '',
    session_id: '',
    title: '',
    send_email: false,
  })

  useEffect(() => {
    loadReports()
  }, [profile])

  const loadReports = async () => {
    setLoading(true)
    let q = supabase.from('reports').select('*').order('created_at', { ascending: false })
    if (profile?.role === 'client') {
      const { data: clientData } = await supabase.from('clients').select('id').eq('profile_id', profile.id).single()
      if (clientData) q = q.eq('client_id', clientData.id)
    }
    const { data } = await q.limit(50)
    setReports((data as Report[]) || [])
    setLoading(false)
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!genForm.client_id || !genForm.title) return toast.error('Pilih klien dan isi judul laporan!')
    setGenerating(true)

    // Collect metrics for the session or all sessions for client
    let metricsData: Record<string, unknown> = {}
    if (genForm.session_id) {
      const { data: m } = await supabase
        .from('session_metrics')
        .select('*')
        .eq('session_id', genForm.session_id)
        .single()
      const { data: s } = await supabase
        .from('live_sessions')
        .select('*, studio:studios(*), client:clients(*)')
        .eq('id', genForm.session_id)
        .single()
      metricsData = { session: s, metrics: m }
    } else {
      // All sessions for client
      const clientSessions = sessions.filter(s => s.client_id === genForm.client_id)
      const sessionIds = clientSessions.map(s => s.id)
      const { data: allMetrics } = await supabase
        .from('session_metrics')
        .select('*')
        .in('session_id', sessionIds)
      metricsData = {
        sessions: clientSessions,
        metrics: allMetrics || [],
        summary: {
          totalSessions: clientSessions.length,
          totalRevenue: (allMetrics || []).reduce((s, m) => s + (m.total_revenue || 0), 0),
          totalViewers: (allMetrics || []).reduce((s, m) => s + (m.peak_viewers || 0), 0),
          totalFollowers: (allMetrics || []).reduce((s, m) => s + (m.new_followers || 0), 0),
        }
      }
    }

    const { error } = await supabase.from('reports').insert({
      session_id: genForm.session_id || null,
      client_id: genForm.client_id,
      generated_by: profile?.id,
      title: genForm.title,
      report_data: metricsData,
      sent_at: genForm.send_email ? new Date().toISOString() : null,
    })

    setGenerating(false)
    if (error) toast.error(`Gagal generate laporan: ${error.message}`)
    else {
      toast.success('✅ Laporan berhasil dibuat!' + (genForm.send_email ? ' Email terkirim ke klien.' : ''))
      setShowGenerate(false)
      loadReports()
    }
  }

  const clientSessions = sessions.filter(s => s.client_id === genForm.client_id)

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-widest text-text">LAPORAN <span className="text-accent">KLIEN</span></h1>
          <p className="text-muted text-sm font-body mt-1">{reports.length} laporan tersedia</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-2 bg-accent text-bg px-5 py-2.5 rounded-xl font-body font-bold text-sm hover:brightness-110 transition-all"
          >
            + Generate Laporan
          </button>
        )}
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="py-20 text-center text-muted font-body">Memuat laporan...</div>
      ) : reports.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-4xl mb-3 opacity-30">📋</div>
          <div className="text-muted font-body text-sm">Belum ada laporan dibuat</div>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => {
            const data = r.report_data as Record<string, Record<string, number>>
            const summary = data.summary as Record<string, number> | undefined
            return (
              <div key={r.id} className="bg-surface border border-border rounded-2xl p-5 hover:border-accent/20 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-body font-semibold text-text">{r.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted font-body flex-wrap">
                      <span>📅 {formatDateTime(r.created_at)}</span>
                      {r.sent_at && <span className="text-accent3">✅ Terkirim {formatDate(r.sent_at)}</span>}
                      {!r.sent_at && <span className="text-gold">⏳ Belum dikirim</span>}
                    </div>
                    {summary && (
                      <div className="flex gap-4 mt-3 flex-wrap">
                        <MetricBadge label="Total Sesi" value={String(summary.totalSessions || 0)} />
                        <MetricBadge label="Total Revenue" value={formatIDR(summary.totalRevenue || 0)} color="text-gold" />
                        <MetricBadge label="Total Viewers" value={formatNumber(summary.totalViewers || 0)} color="text-accent" />
                        <MetricBadge label="New Followers" value={formatNumber(summary.totalFollowers || 0)} color="text-accent2" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {r.pdf_url && (
                      <a
                        href={r.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-body bg-accent/10 border border-accent/30 text-accent rounded-lg hover:bg-accent/20 transition-all"
                      >
                        📄 Download PDF
                      </a>
                    )}
                    {isAdmin && !r.sent_at && (
                      <button
                        onClick={async () => {
                          await supabase.from('reports').update({ sent_at: new Date().toISOString() }).eq('id', r.id)
                          toast.success('📧 Laporan dikirim ke klien!')
                          loadReports()
                        }}
                        className="px-3 py-1.5 text-xs font-body bg-surface2 border border-border text-muted rounded-lg hover:text-accent hover:border-accent/30 transition-all"
                      >
                        📧 Kirim
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Generate Modal */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-display tracking-widest text-text">GENERATE LAPORAN</h2>
              <button onClick={() => setShowGenerate(false)} className="text-muted hover:text-text">✕</button>
            </div>

            <form onSubmit={handleGenerate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-body text-muted mb-1.5 uppercase tracking-wider">Judul Laporan *</label>
                <input
                  value={genForm.title}
                  onChange={e => setGenForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="cth: Laporan Juni 2025 — Toko Baju Cantik"
                  className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-sm font-body text-text placeholder-muted/50 focus:outline-none focus:border-accent transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-body text-muted mb-1.5 uppercase tracking-wider">Klien *</label>
                <select
                  value={genForm.client_id}
                  onChange={e => setGenForm(p => ({ ...p, client_id: e.target.value, session_id: '' }))}
                  className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-sm font-body text-text focus:outline-none focus:border-accent transition-colors"
                  required
                >
                  <option value="">— Pilih klien —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {genForm.client_id && (
                <div>
                  <label className="block text-xs font-body text-muted mb-1.5 uppercase tracking-wider">
                    Sesi Spesifik (opsional — kosongkan untuk semua sesi)
                  </label>
                  <select
                    value={genForm.session_id}
                    onChange={e => setGenForm(p => ({ ...p, session_id: e.target.value }))}
                    className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-sm font-body text-text focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="">— Semua sesi klien ini —</option>
                    {clientSessions.map(s => (
                      <option key={s.id} value={s.id}>{s.title} ({formatDate(s.scheduled_start)})</option>
                    ))}
                  </select>
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={genForm.send_email}
                  onChange={e => setGenForm(p => ({ ...p, send_email: e.target.checked }))}
                  className="w-4 h-4 accent-[#00e5ff]"
                />
                <div>
                  <div className="text-sm font-body text-text">Kirim email ke klien</div>
                  <div className="text-xs text-muted font-body">Laporan otomatis dikirim via email</div>
                </div>
              </label>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowGenerate(false)}
                  className="flex-1 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-body text-muted hover:text-text transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={generating}
                  className="flex-1 py-2.5 bg-accent text-bg rounded-xl text-sm font-body font-bold hover:brightness-110 transition-all disabled:opacity-50">
                  {generating ? 'Generating...' : '📋 Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricBadge({ label, value, color = 'text-text' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-surface2 border border-border rounded-lg px-3 py-1.5">
      <div className={cn('font-mono text-xs font-bold', color)}>{value}</div>
      <div className="text-muted text-xs font-body">{label}</div>
    </div>
  )
}
