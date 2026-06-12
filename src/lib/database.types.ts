export type UserRole = 'super_admin' | 'admin' | 'operator' | 'client'
export type StudioStatus = 'live' | 'standby' | 'maintenance' | 'offline'
export type SessionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled'
export type PlatformType = 'tiktok' | 'shopee' | 'instagram' | 'youtube' | 'tokopedia' | 'lazada' | 'other'

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  company_name: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Studio {
  id: string
  name: string
  code: string
  description: string | null
  thumbnail_url: string | null
  status: StudioStatus
  capacity: number
  equipment: string[]
  location: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  profile_id: string | null
  name: string
  brand_name: string | null
  logo_url: string | null
  contact_email: string
  contact_phone: string | null
  business_type: string | null
  notes: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  profile?: Profile
}

export interface LiveSession {
  id: string
  title: string
  client_id: string | null
  studio_id: string | null
  operator_id: string | null
  platform: PlatformType
  platform_account: string | null
  scheduled_start: string
  scheduled_end: string | null
  actual_start: string | null
  actual_end: string | null
  status: SessionStatus
  stream_url: string | null
  thumbnail_url: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  client?: Client
  studio?: Studio
  operator?: Profile
  metrics?: SessionMetrics
}

export interface SessionMetrics {
  id: string
  session_id: string
  recorded_at: string
  current_viewers: number
  peak_viewers: number
  total_unique_viewers: number
  total_comments: number
  total_shares: number
  total_likes: number
  new_followers: number
  engagement_rate: number
  gift_revenue: number
  product_revenue: number
  total_revenue: number
  duration_minutes: number
}

export interface RealtimeEvent {
  id: string
  session_id: string
  event_type: 'join' | 'gift' | 'comment' | 'follow' | 'share' | 'purchase'
  username: string | null
  content: string | null
  value: number
  metadata: Record<string, unknown>
  created_at: string
}

export interface MediaAsset {
  id: string
  session_id: string | null
  client_id: string | null
  uploaded_by: string | null
  cloudinary_public_id: string
  cloudinary_url: string
  thumbnail_url: string | null
  resource_type: 'image' | 'video'
  original_filename: string | null
  file_size: number | null
  duration_seconds: number | null
  width: number | null
  height: number | null
  tags: string[]
  created_at: string
}

export interface Report {
  id: string
  session_id: string | null
  client_id: string | null
  generated_by: string | null
  title: string
  report_data: Record<string, unknown>
  pdf_url: string | null
  sent_at: string | null
  sent_to: string[]
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  action_url: string | null
  created_at: string
}

export interface ViewerTimeline {
  id: string
  session_id: string
  timestamp: string
  viewer_count: number
}

// ── Database type for Supabase client ──
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      studios: { Row: Studio; Insert: Partial<Studio>; Update: Partial<Studio> }
      clients: { Row: Client; Insert: Partial<Client>; Update: Partial<Client> }
      live_sessions: { Row: LiveSession; Insert: Partial<LiveSession>; Update: Partial<LiveSession> }
      session_metrics: { Row: SessionMetrics; Insert: Partial<SessionMetrics>; Update: Partial<SessionMetrics> }
      realtime_events: { Row: RealtimeEvent; Insert: Partial<RealtimeEvent>; Update: Partial<RealtimeEvent> }
      media_assets: { Row: MediaAsset; Insert: Partial<MediaAsset>; Update: Partial<MediaAsset> }
      reports: { Row: Report; Insert: Partial<Report>; Update: Partial<Report> }
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> }
      viewer_timeline: { Row: ViewerTimeline; Insert: Partial<ViewerTimeline>; Update: Partial<ViewerTimeline> }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
