import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface LandingSettings {
  tagline: string
  subtagline: string
  whatsapp_number: string
  hero_stats: { label: string; value: string }[]
  slot_pagi_times: string
  slot_malam_times: string
  promo_label: string
  prices: {
    pagi_shopee: string
    pagi_tiktok: string
    pagi_dual: string
    malam_shopee: string
    malam_tiktok: string
    malam_dual: string
  }
  features: { icon: string; title: string; desc: string }[]
  cta_title: string
  cta_sub: string
}

const DEFAULT: LandingSettings = {
  tagline: 'TINGKATKAN PENJUALAN LEWAT LIVE STREAMING',
  subtagline: 'Jasa live streaming profesional untuk UMKM di Shopee & TikTok Shop. Host berpengalaman, kualitas terbaik, dan strategi penjualan yang terbukti meningkatkan konversi.',
  whatsapp_number: '6285776077292',
  hero_stats: [
    { value: '4+', label: 'Platform Live' },
    { value: '2H', label: 'Per Sesi' },
    { value: '4', label: 'Slot Per Hari' },
    { value: 'HD', label: 'Kualitas Video' },
  ],
  slot_pagi_times: '05.00–09.00 & 11.00–14.00 WIB',
  slot_malam_times: '16.00–18.00 & 20.00–02.00 WIB',
  promo_label: 'PROMO LAUNCHING — TERBATAS 4 SLOT/HARI!',
  prices: {
    pagi_shopee: '60RB',
    pagi_tiktok: '60RB',
    pagi_dual: '80RB',
    malam_shopee: '90RB',
    malam_tiktok: '90RB',
    malam_dual: '150RB',
  },
  features: [
    { icon: '🎙️', title: 'Host Berpengalaman', desc: 'Host profesional terlatih dalam teknik penjualan, interaksi penonton, dan engagement audience secara konsisten.' },
    { icon: '📹', title: 'Kualitas Video HD', desc: 'Audio jernih dan visual berkualitas tinggi. Setup studio lengkap untuk tampilan live yang profesional.' },
    { icon: '📈', title: 'Strategi Penjualan', desc: 'Optimasi produk, script closing, dan teknik upsell yang terbukti meningkatkan rata-rata nilai transaksi.' },
    { icon: '🔒', title: 'Aman & Terpercaya', desc: 'Pelayanan profesional dan hasil yang memuaskan. Kami menjaga reputasi toko kamu seperti toko kami sendiri.' },
  ],
  cta_title: 'SIAP TINGKATKAN PENJUALAN KAMU?',
  cta_sub: 'Hubungi kami sekarang dan dapatkan konsultasi gratis untuk strategi live streaming terbaik buat bisnis kamu.',
}

type TabKey = 'hero' | 'pricing' | 'features' | 'cta'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'hero', label: 'Hero & Kontak', icon: '🏠' },
  { key: 'pricing', label: 'Harga & Slot', icon: '💰' },
  { key: 'features', label: 'Keunggulan', icon: '⭐' },
  { key: 'cta', label: 'CTA & Footer', icon: '📣' },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<LandingSettings>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('hero')

  useEffect(() => {
    supabase
      .from('landing_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.settings) setSettings({ ...DEFAULT, ...data.settings })
        setLoading(false)
      })
  }, [])

  const set = (path: string, value: unknown) => {
    setSettings(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      const keys = path.split('.')
      let cur: Record<string, unknown> = next
      for (let i = 0; i < keys.length - 1; i++) {
        cur = cur[keys[i]] as Record<string, unknown>
      }
      cur[keys[keys.length - 1]] = value
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('landing_settings')
      .upsert({ id: 1, settings, updated_at: new Date().toISOString() })
    setSaving(false)
    if (error) {
      toast.error('Gagal menyimpan: ' + error.message)
    } else {
      toast.success('Pengaturan landing page tersimpan!')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="font-display text-2xl tracking-widest text-muted">MEMUAT...</div>
    </div>
  )

  const Input = ({ label, value, onChange, multiline = false, placeholder = '' }: {
    label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string
  }) => (
    <div>
      <label className="block text-xs font-body font-medium text-muted uppercase tracking-wider mb-2">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm font-body text-text placeholder-muted/40 focus:outline-none focus:border-accent transition-colors resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm font-body text-text placeholder-muted/40 focus:outline-none focus:border-accent transition-colors"
        />
      )}
    </div>
  )

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl tracking-widest text-text">
            PENGATURAN <span className="text-accent">LANDING PAGE</span>
          </h1>
          <p className="text-muted text-sm font-body mt-1">Edit konten landing page Iranza Live secara real-time.</p>
        </div>
        <div className="flex gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 px-4 py-2 bg-surface2 border border-border rounded-xl text-sm font-body text-muted hover:text-text hover:border-accent/40 transition-all"
          >
            🌐 Preview Landing Page
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-body font-semibold transition-all"
            style={{ background: saving ? 'rgba(255,107,0,0.3)' : 'linear-gradient(135deg,#FFB800,#FF6B00,#FF2D7A)', color: 'white', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {saving ? '⏳ Menyimpan...' : '💾 Simpan Perubahan'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-body font-medium transition-all border ${
              activeTab === tab.key
                ? 'bg-accent/10 text-accent border-accent/30'
                : 'bg-surface2 text-muted border-border hover:text-text'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">

        {/* ── HERO & KONTAK ── */}
        {activeTab === 'hero' && (
          <>
            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
              <h3 className="font-display text-lg tracking-widest text-text">HERO SECTION</h3>
              <Input label="Tagline Utama" value={settings.tagline} onChange={v => set('tagline', v)} placeholder="TINGKATKAN PENJUALAN..." />
              <Input label="Sub-tagline / Deskripsi" value={settings.subtagline} onChange={v => set('subtagline', v)} multiline placeholder="Jasa live streaming profesional..." />
            </div>

            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
              <h3 className="font-display text-lg tracking-widest text-text">NOMOR WHATSAPP</h3>
              <Input label="Nomor WA (format: 62xxx)" value={settings.whatsapp_number} onChange={v => set('whatsapp_number', v)} placeholder="6285776077292" />
              <p className="text-xs text-muted font-body">Nomor ini digunakan untuk semua tombol CTA dan floating button WA di landing page.</p>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
              <h3 className="font-display text-lg tracking-widest text-text">HERO STATS</h3>
              <p className="text-xs text-muted font-body">4 angka yang tampil di bagian bawah hero.</p>
              <div className="grid grid-cols-2 gap-4">
                {settings.hero_stats.map((stat, i) => (
                  <div key={i} className="bg-surface2 border border-border rounded-xl p-4 space-y-3">
                    <div className="text-xs text-muted font-body font-medium">Stat #{i + 1}</div>
                    <Input label="Nilai (misal: 4+, 2H, HD)" value={stat.value} onChange={v => set(`hero_stats.${i}.value`, v)} />
                    <Input label="Label" value={stat.label} onChange={v => set(`hero_stats.${i}.label`, v)} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── PRICING & SLOT ── */}
        {activeTab === 'pricing' && (
          <>
            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
              <h3 className="font-display text-lg tracking-widest text-text">PROMO LABEL</h3>
              <Input label="Teks Banner Promo" value={settings.promo_label} onChange={v => set('promo_label', v)} placeholder="PROMO LAUNCHING — TERBATAS 4 SLOT/HARI!" />
            </div>

            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
              <h3 className="font-display text-lg tracking-widest text-text">WAKTU SLOT</h3>
              <Input label="Waktu Slot Pagi & Siang" value={settings.slot_pagi_times} onChange={v => set('slot_pagi_times', v)} placeholder="05.00–09.00 & 11.00–14.00 WIB" />
              <Input label="Waktu Slot Sore & Malam" value={settings.slot_malam_times} onChange={v => set('slot_malam_times', v)} placeholder="16.00–18.00 & 20.00–02.00 WIB" />
            </div>

            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
              <h3 className="font-display text-lg tracking-widest text-text">HARGA SLOT PAGI & SIANG</h3>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Live Shopee" value={settings.prices.pagi_shopee} onChange={v => set('prices.pagi_shopee', v)} placeholder="60RB" />
                <Input label="Live TikTok" value={settings.prices.pagi_tiktok} onChange={v => set('prices.pagi_tiktok', v)} placeholder="60RB" />
                <Input label="Dual Platform" value={settings.prices.pagi_dual} onChange={v => set('prices.pagi_dual', v)} placeholder="80RB" />
              </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
              <h3 className="font-display text-lg tracking-widest text-text">HARGA SLOT SORE & MALAM</h3>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Live Shopee" value={settings.prices.malam_shopee} onChange={v => set('prices.malam_shopee', v)} placeholder="90RB" />
                <Input label="Live TikTok" value={settings.prices.malam_tiktok} onChange={v => set('prices.malam_tiktok', v)} placeholder="90RB" />
                <Input label="Dual Platform" value={settings.prices.malam_dual} onChange={v => set('prices.malam_dual', v)} placeholder="150RB" />
              </div>
            </div>
          </>
        )}

        {/* ── FEATURES ── */}
        {activeTab === 'features' && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-display text-lg tracking-widest text-text">4 KEUNGGULAN LAYANAN</h3>
            <p className="text-xs text-muted font-body">Ditampilkan di section "Kenapa Pilih Iranza Live?"</p>
            <div className="space-y-4">
              {settings.features.map((f, i) => (
                <div key={i} className="bg-surface2 border border-border rounded-xl p-4 space-y-3">
                  <div className="text-xs text-muted font-body font-medium">Fitur #{i + 1}</div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input label="Icon (emoji)" value={f.icon} onChange={v => set(`features.${i}.icon`, v)} placeholder="🎙️" />
                    <div className="col-span-2">
                      <Input label="Judul" value={f.title} onChange={v => set(`features.${i}.title`, v)} placeholder="Host Berpengalaman" />
                    </div>
                  </div>
                  <Input label="Deskripsi" value={f.desc} onChange={v => set(`features.${i}.desc`, v)} multiline />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CTA ── */}
        {activeTab === 'cta' && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-display text-lg tracking-widest text-text">CALL TO ACTION SECTION</h3>
            <Input label="Judul CTA" value={settings.cta_title} onChange={v => set('cta_title', v)} placeholder="SIAP TINGKATKAN PENJUALAN KAMU?" />
            <Input label="Sub-teks CTA" value={settings.cta_sub} onChange={v => set('cta_sub', v)} multiline placeholder="Hubungi kami sekarang..." />
          </div>
        )}

        {/* Save Button Bottom */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-body font-semibold transition-all"
            style={{ background: saving ? 'rgba(255,107,0,0.3)' : 'linear-gradient(135deg,#FFB800,#FF6B00,#FF2D7A)', color: 'white', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', minWidth: 180 }}
          >
            {saving ? '⏳ Menyimpan...' : '💾 Simpan Semua Perubahan'}
          </button>
        </div>
      </div>
    </div>
  )
}
