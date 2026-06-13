import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { user, signIn, loading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Isi email dan password dulu ya!')
    setSubmitting(true)
    const { error } = await signIn(email, password)
    if (error) {
      toast.error('Login gagal. Cek email & password kamu.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent2/5 rounded-full blur-3xl" />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,229,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="w-full max-w-md relative animate-fadeUp">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-bg font-display text-lg relative">
              ▶
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent2 rounded-full animate-pulse2" />
            </div>
            <span className="font-display text-3xl tracking-widest text-text">
              Iranza <span className="text-accent">Live</span>
            </span>
          </div>
          <p className="text-muted text-sm font-body">Jasa Live Streaming Profesional</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-8">
          <h2 className="font-display text-2xl tracking-widest mb-1 text-text">MASUK</h2>
          <p className="text-muted text-xs font-body mb-6">Masukkan kredensial akun kamu</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-body font-medium text-muted uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="kamu@agency.com"
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm font-body text-text placeholder-muted/50 focus:outline-none focus:border-accent transition-colors"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-body font-medium text-muted uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 pr-12 text-sm font-body text-text placeholder-muted/50 focus:outline-none focus:border-accent transition-colors"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors text-xs"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full bg-accent text-bg font-body font-bold py-3 rounded-xl text-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {submitting ? 'Memproses...' : 'Masuk →'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted font-body text-center">
              Belum punya akun? Hubungi admin agency untuk mendapatkan akses.
            </p>
          </div>
        </div>

        {/* Role hints */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { role: 'Admin', color: 'text-accent', desc: 'Full access' },
            { role: 'Operator', color: 'text-accent3', desc: 'Manage sessions' },
            { role: 'Client', color: 'text-gold', desc: 'View reports' },
          ].map(r => (
            <div key={r.role} className="bg-surface border border-border rounded-xl p-3 text-center">
              <div className={`font-display text-sm tracking-wider ${r.color}`}>{r.role}</div>
              <div className="text-muted text-xs font-body mt-0.5">{r.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
