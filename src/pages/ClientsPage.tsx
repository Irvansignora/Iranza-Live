import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useClients } from '@/hooks/useData'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { cn, formatDate } from '@/lib/utils'
import type { Client } from '@/lib/database.types'
import toast from 'react-hot-toast'

export default function ClientsPage() {
  const { profile } = useAuthStore()
  const { clients, loading, refetch } = useClients()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin'

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.brand_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.contact_email.toLowerCase().includes(search.toLowerCase())
  )

  const handleDeactivate = async (id: string) => {
    if (!confirm('Nonaktifkan klien ini?')) return
    const { error } = await supabase.from('clients').update({ is_active: false }).eq('id', id)
    if (error) toast.error('Gagal menonaktifkan klien')
    else { toast.success('Klien dinonaktifkan'); refetch() }
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-widest text-text">MANAJEMEN <span className="text-accent">KLIEN</span></h1>
          <p className="text-muted text-sm font-body mt-1">{clients.length} klien aktif terdaftar</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditing(null); setShowForm(true) }}
            className="flex items-center gap-2 bg-accent text-bg px-5 py-2.5 rounded-xl font-body font-bold text-sm hover:brightness-110 transition-all"
          >
            + Tambah Klien
          </button>
        )}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Cari nama, brand, atau email..."
        className="w-full max-w-md bg-surface2 border border-border rounded-xl px-4 py-2 text-sm font-body text-text placeholder-muted/50 focus:outline-none focus:border-accent transition-colors"
      />

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center text-muted font-body">Memuat klien...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-surface border border-border rounded-2xl p-5 hover:border-accent/20 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center font-display text-lg text-accent flex-shrink-0">
                    {c.logo_url
                      ? <img src={c.logo_url} alt={c.name} className="w-full h-full object-cover rounded-xl" />
                      : c.name[0].toUpperCase()
                    }
                  </div>
                  <div>
                    <div className="font-body font-semibold text-sm text-text">{c.name}</div>
                    {c.brand_name && <div className="text-xs text-accent font-body">@{c.brand_name}</div>}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditing(c); setShowForm(true) }}
                      className="p-1.5 text-muted hover:text-accent transition-colors text-xs"
                    >✏️</button>
                    <button
                      onClick={() => handleDeactivate(c.id)}
                      className="p-1.5 text-muted hover:text-accent2 transition-colors text-xs"
                    >🗑️</button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-xs font-body">
                <div className="flex items-center gap-2 text-muted">
                  <span>📧</span>
                  <span className="truncate">{c.contact_email}</span>
                </div>
                {c.contact_phone && (
                  <div className="flex items-center gap-2 text-muted">
                    <span>📞</span><span>{c.contact_phone}</span>
                  </div>
                )}
                {c.business_type && (
                  <div className="flex items-center gap-2 text-muted">
                    <span>🏷️</span><span>{c.business_type}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted">
                  <span>📅</span><span>Bergabung {formatDate(c.created_at)}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex gap-2">
                <Link
                  to={`/sessions?client=${c.id}`}
                  className="flex-1 text-center py-1.5 text-xs font-body border border-border rounded-lg text-muted hover:text-accent hover:border-accent/30 transition-all"
                >
                  Lihat Sesi
                </Link>
                <Link
                  to={`/reports?client=${c.id}`}
                  className="flex-1 text-center py-1.5 text-xs font-body border border-border rounded-lg text-muted hover:text-accent hover:border-accent/30 transition-all"
                >
                  Laporan
                </Link>
              </div>
            </div>
          ))}

          {filtered.length === 0 && !loading && (
            <div className="col-span-3 py-20 text-center">
              <div className="text-4xl mb-3 opacity-30">👤</div>
              <div className="text-muted font-body text-sm">Belum ada klien ditemukan</div>
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <ClientFormModal
          client={editing}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSaved={() => { setShowForm(false); setEditing(null); refetch() }}
        />
      )}
    </div>
  )
}

function ClientFormModal({ client, onClose, onSaved }: {
  client: Client | null
  onClose: () => void
  onSaved: () => void
}) {
  const { profile } = useAuthStore()
  const [form, setForm] = useState({
    name: client?.name || '',
    brand_name: client?.brand_name || '',
    contact_email: client?.contact_email || '',
    contact_phone: client?.contact_phone || '',
    business_type: client?.business_type || '',
    notes: client?.notes || '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.contact_email) return toast.error('Nama dan email wajib diisi!')
    setSaving(true)

    const payload = { ...form, created_by: profile?.id }

    let error
    if (client) {
      const res = await supabase.from('clients').update(payload).eq('id', client.id)
      error = res.error
    } else {
      const res = await supabase.from('clients').insert(payload)
      error = res.error
    }

    setSaving(false)
    if (error) toast.error(`Gagal: ${error.message}`)
    else { toast.success(client ? '✅ Klien diperbarui' : '✅ Klien ditambahkan'); onSaved() }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display tracking-widest text-text">{client ? 'EDIT KLIEN' : 'TAMBAH KLIEN'}</h2>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {[
            { key: 'name', label: 'Nama Klien *', placeholder: 'PT Toko Bagus', type: 'text' },
            { key: 'brand_name', label: 'Nama Brand / Akun', placeholder: 'tokobagus_official', type: 'text' },
            { key: 'contact_email', label: 'Email *', placeholder: 'contact@tokobagus.com', type: 'email' },
            { key: 'contact_phone', label: 'No. HP', placeholder: '0812-xxxx-xxxx', type: 'text' },
            { key: 'business_type', label: 'Jenis Bisnis', placeholder: 'Fashion, Skincare, Elektronik...', type: 'text' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-body text-muted mb-1 uppercase tracking-wider">{f.label}</label>
              <input
                type={f.type}
                value={form[f.key as keyof typeof form]}
                onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-sm font-body text-text placeholder-muted/50 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-body text-muted mb-1 uppercase tracking-wider">Catatan</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-sm font-body text-text placeholder-muted/50 focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-body text-muted hover:text-text transition-colors">
              Batal
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-accent text-bg rounded-xl text-sm font-body font-bold hover:brightness-110 transition-all disabled:opacity-50">
              {saving ? 'Menyimpan...' : client ? 'Perbarui' : 'Tambah Klien'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
