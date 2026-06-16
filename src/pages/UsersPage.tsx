import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { cn, formatDate } from '@/lib/utils'
import type { Profile, UserRole } from '@/lib/database.types'
import toast from 'react-hot-toast'

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; border: string }> = {
  super_admin: { label: 'Super Admin', color: 'text-accent2', bg: 'bg-accent2/10', border: 'border-accent2/30' },
  admin:       { label: 'Admin',       color: 'text-accent',  bg: 'bg-accent/10',  border: 'border-accent/30' },
  operator:    { label: 'Operator',    color: 'text-accent3', bg: 'bg-accent3/10', border: 'border-accent3/30' },
  client:      { label: 'Client',      color: 'text-gold',    bg: 'bg-gold/10',    border: 'border-gold/30' },
}

// Calls the `manage-user` Edge Function, forwarding the caller's session JWT
// so the function can verify they're an admin before doing anything.
async function callManageUser(payload: Record<string, unknown>) {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) throw new Error('Sesi tidak valid — silakan login ulang')

  const { data, error } = await supabase.functions.invoke('manage-user', {
    body: payload,
    headers: { Authorization: `Bearer ${token}` },
  })

  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let pw = ''
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)]
  return pw
}

export default function UsersPage() {
  const { profile: me } = useAuthStore()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [resetTarget, setResetTarget] = useState<Profile | null>(null)
  const [search, setSearch] = useState('')

  const isSuperAdmin = me?.role === 'super_admin'

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers((data as Profile[]) || [])
    setLoading(false)
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!isSuperAdmin) return
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    if (error) toast.error('Gagal mengubah role')
    else {
      toast.success('✅ Role diperbarui')
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    }
  }

  const handleToggleActive = async (user: Profile) => {
    const { error } = await supabase.from('profiles').update({ is_active: !user.is_active }).eq('id', user.id)
    if (error) toast.error('Gagal')
    else {
      toast.success(user.is_active ? 'User dinonaktifkan' : 'User diaktifkan')
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
    }
  }

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  // Stats
  const roleStats = (['super_admin', 'admin', 'operator', 'client'] as UserRole[]).map(r => ({
    role: r,
    count: users.filter(u => u.role === r).length,
    ...ROLE_CONFIG[r]
  }))

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-widest text-text">MANAJEMEN <span className="text-accent">USERS</span></h1>
          <p className="text-muted text-sm font-body mt-1">{users.length} user terdaftar</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 bg-accent text-bg px-5 py-2.5 rounded-xl font-body font-bold text-sm hover:brightness-110 transition-all"
          >
            + Undang User
          </button>
        )}
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-4 gap-3">
        {roleStats.map(r => (
          <div key={r.role} className={cn('bg-surface border rounded-xl p-4', r.border)}>
            <div className={cn('font-display text-2xl tracking-wide', r.color)}>{r.count}</div>
            <div className="text-muted text-xs font-body mt-1">{r.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Cari nama atau email..."
        className="w-full max-w-md bg-surface2 border border-border rounded-xl px-4 py-2 text-sm font-body text-text placeholder-muted/50 focus:outline-none focus:border-accent transition-colors"
      />

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center text-muted font-body">Memuat users...</div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['User', 'Email', 'Role', 'Status', 'Bergabung', 'Aksi'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-muted font-body uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const cfg = ROLE_CONFIG[u.role]
                const isMe = u.id === me?.id
                return (
                  <tr key={u.id} className={cn('border-b border-border/50 hover:bg-surface2/50 transition-colors', !u.is_active && 'opacity-40')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-xs font-display text-accent flex-shrink-0">
                          {u.full_name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-body font-medium text-text flex items-center gap-1.5">
                            {u.full_name}
                            {isMe && <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded font-body">Kamu</span>}
                          </div>
                          {u.company_name && <div className="text-xs text-muted font-body">{u.company_name}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-body text-muted">{u.email}</td>
                    <td className="px-4 py-3">
                      {isSuperAdmin && !isMe ? (
                        <select
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value as UserRole)}
                          className={cn('text-xs font-body font-bold px-2 py-1 rounded-lg border bg-transparent cursor-pointer', cfg.color, cfg.bg, cfg.border)}
                        >
                          {(Object.keys(ROLE_CONFIG) as UserRole[]).map(r => (
                            <option key={r} value={r} className="bg-surface text-text">{ROLE_CONFIG[r].label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={cn('text-xs font-bold px-2 py-1 rounded-lg border', cfg.color, cfg.bg, cfg.border)}>
                          {cfg.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'text-xs font-bold px-2 py-0.5 rounded-full border',
                        u.is_active
                          ? 'text-accent3 bg-accent3/10 border-accent3/30'
                          : 'text-muted bg-muted/10 border-muted/30'
                      )}>
                        {u.is_active ? '● Aktif' : '○ Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted font-body">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isSuperAdmin && !isMe && (
                          <button
                            onClick={() => setResetTarget(u)}
                            className="text-xs font-body text-muted hover:text-accent transition-colors px-2 py-1 border border-border rounded-lg hover:border-accent/30"
                          >
                            🔑 Set Password
                          </button>
                        )}
                        {isSuperAdmin && !isMe && (
                          <button
                            onClick={() => handleToggleActive(u)}
                            className="text-xs font-body text-muted hover:text-accent transition-colors px-2 py-1 border border-border rounded-lg hover:border-accent/30"
                          >
                            {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onInvited={loadUsers} />}

      {/* Reset Password Modal */}
      {resetTarget && <ResetPasswordModal user={resetTarget} onClose={() => setResetTarget(null)} />}
    </div>
  )
}

function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const [form, setForm] = useState({ email: '', full_name: '', role: 'client' as UserRole, company_name: '', password: generatePassword() })
  const [showPassword, setShowPassword] = useState(true)
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.full_name || !form.password) {
      toast.error('Nama, email, dan password wajib diisi')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    setSending(true)
    try {
      await callManageUser({
        action: 'create',
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: form.role,
        company_name: form.company_name || undefined,
      })
      toast.success(`✅ Akun ${form.email} dibuat — kirim email & password ini ke user`)
      onInvited()
      onClose()
    } catch (err) {
      toast.error(`Gagal: ${err instanceof Error ? err.message : 'unknown error'}`)
    }
    setSending(false)
  }

  const copyCredentials = () => {
    navigator.clipboard.writeText(`Email: ${form.email}\nPassword: ${form.password}\nLogin di: ${window.location.origin}/login`)
    toast.success('📋 Kredensial disalin ke clipboard')
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display tracking-widest text-text">UNDANG USER</h2>
          <button onClick={onClose} className="text-muted hover:text-text">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {[
            { key: 'full_name', label: 'Nama Lengkap *', type: 'text', placeholder: 'Budi Santoso' },
            { key: 'email', label: 'Email *', type: 'email', placeholder: 'budi@email.com' },
            { key: 'company_name', label: 'Nama Perusahaan', type: 'text', placeholder: 'PT Maju Jaya' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-body text-muted mb-1 uppercase tracking-wider">{f.label}</label>
              <input type={f.type} value={form[f.key as keyof typeof form]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-sm font-body text-text placeholder-muted/50 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          ))}

          {/* Password — admin sets this, not random/invisible anymore */}
          <div>
            <label className="block text-xs font-body text-muted mb-1 uppercase tracking-wider">Password *</label>
            <div className="flex gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Minimal 6 karakter"
                className="flex-1 bg-surface2 border border-border rounded-xl px-3 py-2 text-sm font-mono text-text placeholder-muted/50 focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="px-3 bg-surface2 border border-border rounded-xl text-xs text-muted hover:text-text"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, password: generatePassword() }))}
                className="px-3 bg-surface2 border border-border rounded-xl text-xs text-muted hover:text-text"
                title="Generate password baru"
              >
                🎲
              </button>
            </div>
            <p className="text-xs text-muted font-body mt-1.5">
              Password ini langsung aktif. Catat / salin sebelum submit untuk dikirim ke user.
            </p>
          </div>

          <button
            type="button"
            onClick={copyCredentials}
            className="w-full text-xs font-body text-accent hover:underline text-left"
          >
            📋 Salin email + password ke clipboard
          </button>

          <div>
            <label className="block text-xs font-body text-muted mb-1 uppercase tracking-wider">Role *</label>
            <div className="grid grid-cols-2 gap-2">
              {(['admin', 'operator', 'client'] as UserRole[]).map(r => (
                <button type="button" key={r}
                  onClick={() => setForm(p => ({ ...p, role: r }))}
                  className={cn(
                    'p-2 rounded-xl border text-xs font-body font-bold transition-all',
                    form.role === r
                      ? `${ROLE_CONFIG[r].color} ${ROLE_CONFIG[r].bg} ${ROLE_CONFIG[r].border}`
                      : 'border-border text-muted hover:text-text'
                  )}
                >
                  {ROLE_CONFIG[r].label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-body text-muted">Batal</button>
            <button type="submit" disabled={sending}
              className="flex-1 py-2.5 bg-accent text-bg rounded-xl text-sm font-body font-bold hover:brightness-110 disabled:opacity-50">
              {sending ? 'Membuat...' : '✅ Buat Akun'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ResetPasswordModal({ user, onClose }: { user: Profile; onClose: () => void }) {
  const [password, setPassword] = useState(generatePassword())
  const [showPassword, setShowPassword] = useState(true)
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }
    setSending(true)
    try {
      await callManageUser({ action: 'reset_password', user_id: user.id, password })
      toast.success(`✅ Password ${user.email} berhasil diubah`)
      onClose()
    } catch (err) {
      toast.error(`Gagal: ${err instanceof Error ? err.message : 'unknown error'}`)
    }
    setSending(false)
  }

  const copyCredentials = () => {
    navigator.clipboard.writeText(`Email: ${user.email}\nPassword baru: ${password}\nLogin di: ${window.location.origin}/login`)
    toast.success('📋 Kredensial disalin ke clipboard')
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display tracking-widest text-text">SET PASSWORD</h2>
          <button onClick={onClose} className="text-muted hover:text-text">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="bg-surface2 border border-border rounded-xl p-3">
            <div className="text-sm font-body font-medium text-text">{user.full_name}</div>
            <div className="text-xs text-muted font-body">{user.email}</div>
          </div>

          <div>
            <label className="block text-xs font-body text-muted mb-1 uppercase tracking-wider">Password Baru *</label>
            <div className="flex gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="flex-1 bg-surface2 border border-border rounded-xl px-3 py-2 text-sm font-mono text-text placeholder-muted/50 focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="px-3 bg-surface2 border border-border rounded-xl text-xs text-muted hover:text-text"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
              <button
                type="button"
                onClick={() => setPassword(generatePassword())}
                className="px-3 bg-surface2 border border-border rounded-xl text-xs text-muted hover:text-text"
                title="Generate password baru"
              >
                🎲
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={copyCredentials}
            className="w-full text-xs font-body text-accent hover:underline text-left"
          >
            📋 Salin email + password ke clipboard
          </button>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 bg-surface2 border border-border rounded-xl text-sm font-body text-muted">Batal</button>
            <button type="submit" disabled={sending}
              className="flex-1 py-2.5 bg-accent text-bg rounded-xl text-sm font-body font-bold hover:brightness-110 disabled:opacity-50">
              {sending ? 'Menyimpan...' : '🔑 Ubah Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
