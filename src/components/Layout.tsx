import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { useNotificationsRealtime, useStudioRealtime } from '@/hooks/useData'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const navItems = {
  staff: [
    { to: '/dashboard', icon: '⬡', label: 'Dashboard' },
    { to: '/studios', icon: '🎬', label: 'Studios' },
    { to: '/sessions', icon: '▶', label: 'Sesi Live' },
    { to: '/metrics/input', icon: '📊', label: 'Input Metrics' },
    { to: '/clients', icon: '👤', label: 'Klien' },
    { to: '/media', icon: '🖼️', label: 'Media' },
    { to: '/reports', icon: '📋', label: 'Laporan' },
  ],
  client: [
    { to: '/dashboard', icon: '⬡', label: 'Dashboard' },
    { to: '/sessions', icon: '▶', label: 'Sesi Live' },
    { to: '/media', icon: '🖼️', label: 'Media' },
    { to: '/reports', icon: '📋', label: 'Laporan' },
  ],
  admin_extra: [
    { to: '/users', icon: '👥', label: 'Users' },
    { to: '/settings', icon: '⚙️', label: 'Landing Page' },
  ],
}

export default function Layout() {
  const { profile, signOut } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar, notifications, unreadCount, fetchNotifications, markAllRead } = useAppStore()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs] = useState(false)
  const [clock, setClock] = useState('')

  useNotificationsRealtime()
  useStudioRealtime()

  useEffect(() => {
    if (profile?.id) fetchNotifications(profile.id)
  }, [profile?.id, fetchNotifications])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB')
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    toast.success('Berhasil keluar')
    navigate('/login')
  }

  const isClient = profile?.role === 'client'
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin'
  const navList = isClient ? navItems.client : navItems.staff

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* SIDEBAR */}
      <aside className={cn(
        'flex flex-col bg-surface border-r border-border transition-all duration-300 flex-shrink-0',
        sidebarCollapsed ? 'w-16' : 'w-56'
      )}>
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-border gap-3 flex-shrink-0">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-bg font-display text-sm relative flex-shrink-0">
            ▶
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-accent2 rounded-full animate-pulse2" />
          </div>
          {!sidebarCollapsed && (
            <span className="font-display text-xl tracking-widest text-text whitespace-nowrap">
              Iranza <span className="text-accent">Live</span>
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-0.5 px-2">
            {navList.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-body group',
                  isActive
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'text-muted hover:text-text hover:bg-surface2'
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
              </NavLink>
            ))}

            {isAdmin && !isClient && (
              <>
                {!sidebarCollapsed && (
                  <div className="pt-4 pb-1 px-1">
                    <span className="text-xs text-muted uppercase tracking-widest font-body">Admin</span>
                  </div>
                )}
                {navItems.admin_extra.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-body',
                      isActive
                        ? 'bg-accent/10 text-accent border border-accent/20'
                        : 'text-muted hover:text-text hover:bg-surface2'
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                  </NavLink>
                ))}
              </>
            )}
          </div>
        </nav>

        {/* Landing Page Link */}
        <div className="px-3 pb-2">
          <a
            href="/"
            target="_blank"
            rel="noopener"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-body group',
              'text-muted hover:text-accent hover:bg-accent/5 border border-transparent hover:border-accent/20'
            )}
            title={sidebarCollapsed ? 'Landing Page' : undefined}
          >
            <span className="text-base flex-shrink-0">🌐</span>
            {!sidebarCollapsed && <span className="font-medium">Landing Page</span>}
          </a>
        </div>

        {/* User */}
        <div className="p-3 border-t border-border">
          <div className={cn('flex items-center gap-2', sidebarCollapsed && 'justify-center')}>
            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-xs font-display text-accent flex-shrink-0">
              {profile?.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-body font-medium text-text truncate">{profile?.full_name}</div>
                <div className="text-xs text-muted capitalize">{profile?.role?.replace('_', ' ')}</div>
              </div>
            )}
            {!sidebarCollapsed ? (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-body font-medium text-muted hover:text-accent2 hover:bg-accent2/10 border border-transparent hover:border-accent2/20 transition-all"
                title="Keluar"
              >
                <span>⏻</span>
                <span>Keluar</span>
              </button>
            ) : (
              <button
                onClick={handleSignOut}
                className="text-muted hover:text-accent2 transition-colors text-xs"
                title="Keluar"
              >
                ⏻
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOPBAR */}
        <header className="h-14 flex items-center justify-between px-6 bg-surface border-b border-border flex-shrink-0 gap-4">
          <button
            onClick={toggleSidebar}
            className="text-muted hover:text-text transition-colors text-lg"
          >
            ☰
          </button>

          <div className="flex items-center gap-2 bg-surface2 border border-border rounded-lg px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent3 animate-pulse2" />
            <span className="font-mono text-xs text-muted">{clock}</span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface2 border border-border rounded-lg text-muted hover:text-text transition-colors text-sm"
              title={theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 text-muted hover:text-text transition-colors"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-accent2 rounded-full text-xs font-bold flex items-center justify-center text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-10 w-80 bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="font-display text-sm tracking-wider">NOTIFIKASI</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => profile && markAllRead(profile.id)}
                        className="text-xs text-accent hover:underline"
                      >
                        Tandai semua
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-muted text-sm">Tidak ada notifikasi</div>
                    ) : notifications.map(n => (
                      <div
                        key={n.id}
                        className={cn(
                          'px-4 py-3 border-b border-border/50 hover:bg-surface2 transition-colors',
                          !n.is_read && 'bg-accent/5'
                        )}
                      >
                        <div className="text-xs font-medium text-text">{n.title}</div>
                        <div className="text-xs text-muted mt-0.5">{n.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile badge */}
            <div className="flex items-center gap-2 bg-surface2 border border-border rounded-xl px-3 py-1.5">
              <div className="w-5 h-5 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-xs font-display text-accent">
                {profile?.full_name?.[0]?.toUpperCase()}
              </div>
              <span className="text-xs font-body text-text font-medium hidden sm:block">{profile?.full_name}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 capitalize hidden md:block">
                {profile?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
