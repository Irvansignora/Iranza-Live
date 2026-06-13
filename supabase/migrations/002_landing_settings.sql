-- ============================================================
-- Migration 002: Landing Page Settings
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS landing_settings (
  id        INTEGER PRIMARY KEY DEFAULT 1,
  settings  JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Only allow one row (singleton config)
  CONSTRAINT single_row CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE landing_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can READ landing settings (public landing page needs this)
CREATE POLICY "Public can read landing settings"
  ON landing_settings FOR SELECT
  USING (true);

-- Only admins can UPDATE landing settings
CREATE POLICY "Admins can update landing settings"
  ON landing_settings FOR ALL
  USING (
    get_user_role(auth.uid()) IN ('super_admin', 'admin')
  );

-- Seed default row so upsert always works
INSERT INTO landing_settings (id, settings)
VALUES (1, '{
  "tagline": "TINGKATKAN PENJUALAN LEWAT LIVE STREAMING",
  "subtagline": "Jasa live streaming profesional untuk UMKM di Shopee & TikTok Shop. Host berpengalaman, kualitas terbaik, dan strategi penjualan yang terbukti meningkatkan konversi.",
  "whatsapp_number": "6285776077292",
  "hero_stats": [
    {"value": "4+", "label": "Platform Live"},
    {"value": "2H", "label": "Per Sesi"},
    {"value": "4", "label": "Slot Per Hari"},
    {"value": "HD", "label": "Kualitas Video"}
  ],
  "slot_pagi_times": "05.00–09.00 & 11.00–14.00 WIB",
  "slot_malam_times": "16.00–18.00 & 20.00–02.00 WIB",
  "promo_label": "PROMO LAUNCHING — TERBATAS 4 SLOT/HARI!",
  "prices": {
    "pagi_shopee": "60RB",
    "pagi_tiktok": "60RB",
    "pagi_dual": "80RB",
    "malam_shopee": "90RB",
    "malam_tiktok": "90RB",
    "malam_dual": "150RB"
  },
  "features": [
    {"icon": "🎙️", "title": "Host Berpengalaman", "desc": "Host profesional terlatih dalam teknik penjualan, interaksi penonton, dan engagement audience secara konsisten."},
    {"icon": "📹", "title": "Kualitas Video HD", "desc": "Audio jernih dan visual berkualitas tinggi. Setup studio lengkap untuk tampilan live yang profesional."},
    {"icon": "📈", "title": "Strategi Penjualan", "desc": "Optimasi produk, script closing, dan teknik upsell yang terbukti meningkatkan rata-rata nilai transaksi."},
    {"icon": "🔒", "title": "Aman & Terpercaya", "desc": "Pelayanan profesional dan hasil yang memuaskan. Kami menjaga reputasi toko kamu seperti toko kami sendiri."}
  ],
  "cta_title": "SIAP TINGKATKAN PENJUALAN KAMU?",
  "cta_sub": "Hubungi kami sekarang dan dapatkan konsultasi gratis untuk strategi live streaming terbaik buat bisnis kamu."
}')
ON CONFLICT (id) DO NOTHING;
