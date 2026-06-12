import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { useClients } from '@/hooks/useData'
import { supabase } from '@/lib/supabase'
import type { LiveSession, PlatformType } from '@/lib/database.types'
import { PLATFORM_LABELS, PLATFORM_ICONS } from '@/lib/utils'
import toast from 'react-hot-toast'

const PLATFORMS: PlatformType[] = ['tiktok', 'shopee', 'instagram', 'youtube', 'tokopedia', 'lazada', 'other']

export default function SessionFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { studios, sessions, createSession, updateSession, fetchStudios } = useAppStore()
  const { clients } = useClients()

  const [form, setForm] = useState({
    title: '',
    client_id: '',
    studio_id: '',
    operator_id: '',
    platform: 'tiktok' as PlatformType,
    platform_account: '',
    scheduled_start: '',
    scheduled_end: '',
    stream_url: '',
    notes: '',
  })
  const [operators, setOperators] = useState<{ id: string; full_name: string }[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchStudios() }, [fetchStudios])

  useEffect(() => {
    supabase.from('profiles').select('id, full_name').in('role', ['admin', 'operator', 'super_admin'])
      .then(({ data }) => setOperators(data || []))
  }, [])

  useEffect(() => {
    if (!isEdit || !id) return
    const s = sessions.find(x => x.id === id)
    if (s) {
      setForm({
        title: s.title,
        client_id: s.client_id || '',
        studio_id: s.studio_id || '',
        operator_id: s.operator_id || '',
        platform: s.platform,
        platform_account: s.platform_account || '',
        scheduled_start: s.scheduled_start ? s.scheduled_start.slice(0, 16) : '',
        scheduled_end: s.scheduled_end ? s.scheduled_end.slice(0, 16) : '',
        stream_url: s.stream_url || '',
        notes: s.notes || '',
      })
    }
  }, [isEdit, id, sessions])

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.client_id || !form.studio_id || !form.platform || !form.scheduled_start) {
      toast.error('Lengkapi field yang wajib diisi!')
      return
    }

    setSaving(true)
    const payload: Partial<LiveSession> = {
      ...form,
      client_id: form.client_id || null,
      studio_id: form.studio_id || null,
      operator_id: form.operator_id || profile?.id || null,
      scheduled_start: new Date(form.scheduled_start).toISOString(),
      scheduled_end: form.scheduled_end ? new Date(form.scheduled_end).toISOString() : null,
      created_by: profile?.id,
    }

    let error: string | undefined
    if (isEdit && id) {
      const res = await updateSession(id, payload)
      error = res.error
    } else {
      const res = await createSession({ ...payload, status: 'scheduled' })
      error = res.error
    }

    setSaving(false)
    if (error) {
      toast.error(`Gagal menyimpan: ${error}`)
    } else {
      toast.success(isEdit ? '✅ Sesi diperbarui' : '✅ Sesi berhasil dibuat')
      navigate('/sessions')
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl tracking-widest text-text">
          {isEdit ? 'EDIT' : 'BUAT'} <span className="text-accent">SESI</span>
        </h1>
        <p className="text-muted text-sm font-body mt-1">
          {isEdit ? 'Perbarui detail sesi live' : 'Jadwalkan sesi live baru untuk klien'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <div className="font-display text-xs tracking-widest text-muted">INFO DASAR</div>

          {/* Title */}
          <Field label="Judul Sesi *">
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="cth: Flash Sale Hari Raya — Toko Baju Cantik"
              className={inputCls}
              required
            />
          </Field>

          {/* Client */}
          <Field label="Klien *">
            <select value={form.client_id} onChange={e => set('client_id', e.target.value)} className={inputCls} required>
              <option value="">— Pilih klien —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.brand_name ? `(${c.brand_name})` : ''}</option>)}
            </select>
          </Field>

          {/* Studio */}
          <Field label="Studio *">
            <div className="grid grid-cols-2 gap-2">
              {studios.map((s, i) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => set('studio_id', s.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.studio_id === s.id
                      ? i === 0 ? 'border-accent bg-accent/10' : 'border-accent2 bg-accent2/10'
                      : 'border-border bg-surface2 hover:border-border/80'
                  }`}
                >
                  <div className="text-xs font-bold font-body" style={{ color: i === 0 ? '#00e5ff' : '#ff3d6b' }}>
                    {s.name}
                  </div>
                  <div className="text-xs text-muted font-body mt-0.5 truncate">{s.description}</div>
                  <div className={`text-xs mt-1 font-bold ${
                    s.status === 'live' ? 'text-accent3'
                    : s.status === 'standby' ? 'text-gold'
                    : 'text-muted'
                  }`}>● {s.status.toUpperCase()}</div>
                </button>
              ))}
            </div>
          </Field>

          {/* Operator */}
          <Field label="Operator">
            <select value={form.operator_id} onChange={e => set('operator_id', e.target.value)} className={inputCls}>
              <option value="">— Assign ke saya —</option>
              {operators.map(o => <option key={o.id} value={o.id}>{o.full_name}</option>)}
            </select>
          </Field>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <div className="font-display text-xs tracking-widest text-muted">PLATFORM & STREAMING</div>

          {/* Platform */}
          <Field label="Platform *">
            <div className="grid grid-cols-3 gap-2">
              {PLATFORMS.map(p => (
                <button
                  type="button"
                  key={p}
                  onClick={() => set('platform', p)}
                  className={`p-2 rounded-xl border text-center text-xs font-body transition-all ${
                    form.platform === p
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-surface2 text-muted hover:text-text'
                  }`}
                >
                  {PLATFORM_ICONS[p]} {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Akun Platform (@username)">
            <input
              value={form.platform_account}
              onChange={e => set('platform_account', e.target.value)}
              placeholder="@tokoaku_official"
              className={inputCls}
            />
          </Field>

          <Field label="URL Stream (opsional)">
            <input
              value={form.stream_url}
              onChange={e => set('stream_url', e.target.value)}
              placeholder="https://tiktok.com/@..."
              className={inputCls}
            />
          </Field>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <div className="font-display text-xs tracking-widest text-muted">JADWAL</div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Mulai *">
              <input
                type="datetime-local"
                value={form.scheduled_start}
                onChange={e => set('scheduled_start', e.target.value)}
                className={inputCls}
                required
              />
            </Field>
            <Field label="Selesai (estimasi)">
              <input
                type="datetime-local"
                value={form.scheduled_end}
                onChange={e => set('scheduled_end', e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Catatan">
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Catatan khusus untuk sesi ini..."
              rows={3}
              className={inputCls + ' resize-none'}
            />
          </Field>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/sessions')}
            className="flex-1 py-3 bg-surface2 border border-border rounded-xl text-sm font-body text-muted hover:text-text transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 bg-accent text-bg rounded-xl text-sm font-body font-bold hover:brightness-110 transition-all disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : isEdit ? '✏️ Perbarui Sesi' : '✅ Buat Sesi'}
          </button>
        </div>
      </form>
    </div>
  )
}

const inputCls = 'w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-sm font-body text-text placeholder-muted/50 focus:outline-none focus:border-accent transition-colors'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-body font-medium text-muted uppercase tracking-wider mb-2">{label}</label>
      {children}
    </div>
  )
}
