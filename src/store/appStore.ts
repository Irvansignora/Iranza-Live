import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { LiveSession, Studio, RealtimeEvent, Notification, SessionMetrics } from '@/lib/database.types'

interface AppState {
  // Studios
  studios: Studio[]
  studiosLoading: boolean
  fetchStudios: () => Promise<void>
  updateStudioStatus: (id: string, status: Studio['status']) => Promise<void>

  // Sessions
  sessions: LiveSession[]
  sessionsLoading: boolean
  fetchSessions: (filters?: { status?: string; clientId?: string; studioId?: string }) => Promise<void>
  createSession: (data: Partial<LiveSession>) => Promise<{ data?: LiveSession; error?: string }>
  updateSession: (id: string, data: Partial<LiveSession>) => Promise<{ error?: string }>
  startSession: (id: string) => Promise<{ error?: string }>
  endSession: (id: string) => Promise<{ error?: string }>

  // Metrics
  sessionMetrics: Record<string, SessionMetrics>
  upsertMetrics: (sessionId: string, data: Partial<SessionMetrics>) => Promise<void>

  // Realtime events
  realtimeEvents: RealtimeEvent[]
  addRealtimeEvent: (event: RealtimeEvent) => void
  subscribeToSession: (sessionId: string) => () => void

  // Notifications
  notifications: Notification[]
  unreadCount: number
  fetchNotifications: (userId: string) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllRead: (userId: string) => Promise<void>

  // UI state
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  activePeriod: 'today' | '7d' | '30d'
  setActivePeriod: (p: AppState['activePeriod']) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // ── Studios ──
  studios: [],
  studiosLoading: false,

  fetchStudios: async () => {
    set({ studiosLoading: true })
    const { data } = await supabase
      .from('studios')
      .select('*')
      .eq('is_active', true)
      .order('code')
    set({ studios: data || [], studiosLoading: false })
  },

  updateStudioStatus: async (id, status) => {
    await supabase.from('studios').update({ status }).eq('id', id)
    set(state => ({
      studios: state.studios.map(s => s.id === id ? { ...s, status } : s)
    }))
  },

  // ── Sessions ──
  sessions: [],
  sessionsLoading: false,

  fetchSessions: async (filters) => {
    set({ sessionsLoading: true })
    let query = supabase
      .from('live_sessions')
      .select(`
        *,
        client:clients(id, name, brand_name, logo_url, contact_email),
        studio:studios(id, name, code, status),
        operator:profiles!live_sessions_operator_id_fkey(id, full_name, avatar_url)
      `)
      .order('scheduled_start', { ascending: false })

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.clientId) query = query.eq('client_id', filters.clientId)
    if (filters?.studioId) query = query.eq('studio_id', filters.studioId)

    const { data } = await query
    set({ sessions: (data as LiveSession[]) || [], sessionsLoading: false })
  },

  createSession: async (data) => {
    const { data: session, error } = await supabase
      .from('live_sessions')
      .insert(data)
      .select(`*, client:clients(*), studio:studios(*)`)
      .single()

    if (error) return { error: error.message }

    set(state => ({ sessions: [session as LiveSession, ...state.sessions] }))
    return { data: session as LiveSession }
  },

  updateSession: async (id, data) => {
    const { error } = await supabase.from('live_sessions').update(data).eq('id', id)
    if (error) return { error: error.message }

    set(state => ({
      sessions: state.sessions.map(s => s.id === id ? { ...s, ...data } : s)
    }))
    return {}
  },

  startSession: async (id) => {
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('live_sessions')
      .update({ status: 'live', actual_start: now })
      .eq('id', id)

    if (error) return { error: error.message }

    // Update studio status to live
    const session = get().sessions.find(s => s.id === id)
    if (session?.studio_id) {
      await get().updateStudioStatus(session.studio_id, 'live')
    }

    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === id ? { ...s, status: 'live', actual_start: now } : s
      )
    }))
    return {}
  },

  endSession: async (id) => {
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('live_sessions')
      .update({ status: 'completed', actual_end: now })
      .eq('id', id)

    if (error) return { error: error.message }

    // Revert studio to standby
    const session = get().sessions.find(s => s.id === id)
    if (session?.studio_id) {
      await get().updateStudioStatus(session.studio_id, 'standby')
    }

    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === id ? { ...s, status: 'completed', actual_end: now } : s
      )
    }))
    return {}
  },

  // ── Metrics ──
  sessionMetrics: {},

  upsertMetrics: async (sessionId, data) => {
    const { data: metric } = await supabase
      .from('session_metrics')
      .upsert({ session_id: sessionId, ...data })
      .select()
      .single()

    if (metric) {
      set(state => ({
        sessionMetrics: { ...state.sessionMetrics, [sessionId]: metric }
      }))
    }
  },

  // ── Realtime ──
  realtimeEvents: [],

  addRealtimeEvent: (event) => {
    set(state => ({
      realtimeEvents: [event, ...state.realtimeEvents].slice(0, 50)
    }))
  },

  subscribeToSession: (sessionId) => {
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'realtime_events', filter: `session_id=eq.${sessionId}` },
        (payload) => get().addRealtimeEvent(payload.new as RealtimeEvent)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'session_metrics', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const m = payload.new as SessionMetrics
          set(state => ({ sessionMetrics: { ...state.sessionMetrics, [sessionId]: m } }))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  },

  // ── Notifications ──
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async (userId) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)

    const notifs = data || []
    set({
      notifications: notifs,
      unreadCount: notifs.filter(n => !n.is_read).length
    })
  },

  markAsRead: async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }))
  },

  markAllRead: async (userId) => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId)
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, is_read: true })),
      unreadCount: 0
    }))
  },

  // ── UI ──
  sidebarCollapsed: false,
  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  activePeriod: 'today',
  setActivePeriod: (p) => set({ activePeriod: p }),
}))
