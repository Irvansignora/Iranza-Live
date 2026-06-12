-- ============================================================
-- StreamHive Agency — Full Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'operator', 'client');
CREATE TYPE studio_status AS ENUM ('live', 'standby', 'maintenance', 'offline');
CREATE TYPE session_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');
CREATE TYPE platform_type AS ENUM ('tiktok', 'shopee', 'instagram', 'youtube', 'tokopedia', 'lazada', 'other');

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'client',
  company_name TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STUDIOS
-- ============================================================
CREATE TABLE studios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE, -- e.g. 'STUDIO_A', 'STUDIO_B'
  description TEXT,
  thumbnail_url TEXT,
  status studio_status DEFAULT 'offline',
  capacity INTEGER DEFAULT 5,
  equipment JSONB DEFAULT '[]',
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default studios
INSERT INTO studios (name, code, description, status) VALUES
  ('Studio A', 'STUDIO_A', 'Main Production Room — Full lighting & greenscreen setup', 'standby'),
  ('Studio B', 'STUDIO_B', 'Content Creator Suite — Compact & versatile setup', 'standby');

-- ============================================================
-- CLIENTS (linked to profiles with role=client)
-- ============================================================
CREATE TABLE clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  brand_name TEXT,
  logo_url TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  business_type TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LIVE SESSIONS
-- ============================================================
CREATE TABLE live_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  studio_id UUID REFERENCES studios(id) ON DELETE SET NULL,
  operator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  platform platform_type NOT NULL,
  platform_account TEXT, -- e.g. @tokoaku_official
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  status session_status DEFAULT 'scheduled',
  stream_url TEXT,
  thumbnail_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SESSION METRICS (snapshots per session)
-- ============================================================
CREATE TABLE session_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  -- Viewers
  current_viewers INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  total_unique_viewers INTEGER DEFAULT 0,
  -- Engagement
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  new_followers INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  -- Revenue
  gift_revenue BIGINT DEFAULT 0, -- in IDR (cents)
  product_revenue BIGINT DEFAULT 0,
  total_revenue BIGINT DEFAULT 0,
  -- Duration
  duration_minutes INTEGER DEFAULT 0
);

-- ============================================================
-- REALTIME EVENTS (activity feed)
-- ============================================================
CREATE TABLE realtime_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'join', 'gift', 'comment', 'follow', 'share', 'purchase'
  username TEXT,
  content TEXT,
  value BIGINT DEFAULT 0, -- gift value in IDR
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MEDIA ASSETS (Cloudinary)
-- ============================================================
CREATE TABLE media_assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES live_sessions(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES profiles(id),
  cloudinary_public_id TEXT NOT NULL,
  cloudinary_url TEXT NOT NULL,
  thumbnail_url TEXT,
  resource_type TEXT NOT NULL, -- 'image', 'video'
  original_filename TEXT,
  file_size INTEGER,
  duration_seconds INTEGER, -- for videos
  width INTEGER,
  height INTEGER,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REPORTS (generated PDF reports)
-- ============================================================
CREATE TABLE reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES live_sessions(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  generated_by UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  report_data JSONB NOT NULL, -- snapshot of all metrics
  pdf_url TEXT, -- Cloudinary URL of generated PDF
  sent_at TIMESTAMPTZ,
  sent_to TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VIEWER TIMELINE (for charts)
-- ============================================================
CREATE TABLE viewer_timeline (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  viewer_count INTEGER DEFAULT 0
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewer_timeline ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION get_user_role(uid UUID)
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = uid;
$$ LANGUAGE sql SECURITY DEFINER;

-- ── Profiles ──
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT USING (
    get_user_role(auth.uid()) IN ('super_admin', 'admin')
  );

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL USING (
    get_user_role(auth.uid()) = 'super_admin'
  );

-- ── Studios: all authenticated users can read ──
CREATE POLICY "Authenticated users can view studios"
  ON studios FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage studios"
  ON studios FOR ALL USING (
    get_user_role(auth.uid()) IN ('super_admin', 'admin')
  );

-- ── Clients ──
CREATE POLICY "Client can view own client record"
  ON clients FOR SELECT USING (
    profile_id = auth.uid() OR
    get_user_role(auth.uid()) IN ('super_admin', 'admin', 'operator')
  );

CREATE POLICY "Admins can manage clients"
  ON clients FOR ALL USING (
    get_user_role(auth.uid()) IN ('super_admin', 'admin')
  );

-- ── Live Sessions ──
CREATE POLICY "Staff can view all sessions"
  ON live_sessions FOR SELECT USING (
    get_user_role(auth.uid()) IN ('super_admin', 'admin', 'operator')
  );

CREATE POLICY "Clients can view their own sessions"
  ON live_sessions FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
  );

CREATE POLICY "Staff can manage sessions"
  ON live_sessions FOR ALL USING (
    get_user_role(auth.uid()) IN ('super_admin', 'admin', 'operator')
  );

-- ── Metrics: same as sessions ──
CREATE POLICY "Staff can view all metrics"
  ON session_metrics FOR SELECT USING (
    get_user_role(auth.uid()) IN ('super_admin', 'admin', 'operator')
  );

CREATE POLICY "Clients can view metrics for their sessions"
  ON session_metrics FOR SELECT USING (
    session_id IN (
      SELECT ls.id FROM live_sessions ls
      JOIN clients c ON ls.client_id = c.id
      WHERE c.profile_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert metrics"
  ON session_metrics FOR INSERT WITH CHECK (
    get_user_role(auth.uid()) IN ('super_admin', 'admin', 'operator')
  );

-- ── Realtime Events ──
CREATE POLICY "Authenticated can view events"
  ON realtime_events FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can insert events"
  ON realtime_events FOR INSERT WITH CHECK (
    get_user_role(auth.uid()) IN ('super_admin', 'admin', 'operator')
  );

-- ── Media Assets ──
CREATE POLICY "Authenticated can view media"
  ON media_assets FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can upload media"
  ON media_assets FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Owners and admins can delete media"
  ON media_assets FOR DELETE USING (
    uploaded_by = auth.uid() OR
    get_user_role(auth.uid()) IN ('super_admin', 'admin')
  );

-- ── Reports ──
CREATE POLICY "Staff can view all reports"
  ON reports FOR SELECT USING (
    get_user_role(auth.uid()) IN ('super_admin', 'admin', 'operator')
  );

CREATE POLICY "Clients can view their own reports"
  ON reports FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
  );

CREATE POLICY "Staff can manage reports"
  ON reports FOR ALL USING (
    get_user_role(auth.uid()) IN ('super_admin', 'admin')
  );

-- ── Notifications ──
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can insert notifications"
  ON notifications FOR INSERT WITH CHECK (
    get_user_role(auth.uid()) IN ('super_admin', 'admin')
  );

-- ── Viewer Timeline ──
CREATE POLICY "Authenticated can view timeline"
  ON viewer_timeline FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can insert timeline"
  ON viewer_timeline FOR INSERT WITH CHECK (
    get_user_role(auth.uid()) IN ('super_admin', 'admin', 'operator')
  );

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_studios_updated_at BEFORE UPDATE ON studios FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON live_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- REALTIME SUBSCRIPTIONS (enable for tables)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE realtime_events;
ALTER PUBLICATION supabase_realtime ADD TABLE live_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE studios;
ALTER PUBLICATION supabase_realtime ADD TABLE session_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE viewer_timeline;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_live_sessions_client ON live_sessions(client_id);
CREATE INDEX idx_live_sessions_studio ON live_sessions(studio_id);
CREATE INDEX idx_live_sessions_status ON live_sessions(status);
CREATE INDEX idx_live_sessions_scheduled ON live_sessions(scheduled_start);
CREATE INDEX idx_session_metrics_session ON session_metrics(session_id);
CREATE INDEX idx_realtime_events_session ON realtime_events(session_id);
CREATE INDEX idx_realtime_events_created ON realtime_events(created_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_viewer_timeline_session ON viewer_timeline(session_id);
CREATE INDEX idx_media_assets_session ON media_assets(session_id);
CREATE INDEX idx_media_assets_client ON media_assets(client_id);
