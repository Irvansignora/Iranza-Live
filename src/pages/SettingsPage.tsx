/**
 * SettingsPage.tsx — Extended with Hero Photos (Cloudinary)
 * Tab baru: "Hero & Foto" — upload foto langsung ke Cloudinary,
 * simpan URL ke landing_settings.hero_photos di Supabase
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { uploadToCloudinary, getCloudinaryThumbnail } from '@/lib/cloudinary'
import toast from 'react-hot-toast'

interface HeroPhoto {
  cloudinary_url: string
  caption?: string
}

interface LandingSettings {
  tagline: string
  subtagline: string
  whatsapp_number: string
  logo_url: string
  hero_headline_1: string
  hero_headline_2: string
  hero_subtext: string
  hero_stats: { label: string; value: string }[]
  hero_photos: HeroPhoto[]
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
  subtagline: 'Jasa live streaming profesional untuk UMKM di Shopee & TikTok Shop.',
  whatsapp_number: '6285776077292',
  logo_url: '',
  hero_headline_1: 'Studio Live',
  hero_headline_2: 'untuk UMKM.',
  hero_subtext: 'Host profesional. Studio siap. Hasil terukur — di Shopee & TikTok Shop.',
  hero_photos: [],
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
    pagi_shopee: '60', pagi_tiktok: '60', pagi_dual: '80',
    malam_shopee: '90', malam_tiktok: '90', malam_dual: '150',
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

type TabKey = 'branding' | 'photos' | 'hero' | 'pricing' | 'features' | 'cta'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'branding', label: 'Logo & Favicon', icon: '🔵' },
  { key: 'photos', label: 'Foto Landing Page', icon: '🖼️' },
  { key: 'hero', label: 'Hero & Kontak', icon: '🏠' },
  { key: 'pricing', label: 'Harga & Slot', icon: '💰' },
  { key: 'features', label: 'Keunggulan', icon: '⭐' },
  { key: 'cta', label: 'CTA', icon: '📣' },
]

/* ─── Reusable input ─── */
function Input({ label, value, onChange, multiline = false, placeholder = '', hint = '' }: {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  placeholder?: string
  hint?: string
}) {
  return (
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
      {hint && <p className="text-xs text-muted font-body mt-1.5">{hint}</p>}
    </div>
  )
}

/* ─── Branding Tab (Logo + Favicon) ─── */
function BrandingTab({
  logoUrl,
  onChange,
}: {
  logoUrl: string
  onChange: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]

    if (!file.type.startsWith('image/')) {
      toast.error('Logo harus berupa gambar (PNG/SVG/JPG)')
      return
    }

    setUploading(true)
    try {
      toast.loading('Mengupload logo...', { id: 'logo-upload' })
      const result = await uploadToCloudinary(file, {
        folder: 'iranza-live/branding',
        tags: ['logo', 'branding'],
      })
      onChange(result.secure_url)
      toast.success('✅ Logo berhasil diupload — jangan lupa Simpan Perubahan', { id: 'logo-upload' })
    } catch (err) {
      toast.error('Gagal upload logo', { id: 'logo-upload' })
      console.error(err)
    }
    setUploading(false)
  }, [onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleUpload(e.dataTransfer.files)
  }, [handleUpload])

  return (
    <div className="space-y-6">
      <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 flex gap-3 items-start">
        <span className="text-xl">🔵</span>
        <div>
          <div className="font-body font-semibold text-text text-sm">Logo dipakai di dua tempat otomatis</div>
          <div className="text-muted text-xs font-body mt-1">
            (1) Pojok kiri atas <strong className="text-text">landing page</strong> (navbar & footer),
            (2) <strong className="text-text">favicon</strong> tab browser di seluruh aplikasi. Rekomendasi: PNG transparan atau SVG, persegi (1:1), minimal 256×256px.
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <h3 className="font-display text-lg tracking-widest text-text">LOGO IRANZA LIVE</h3>

        <div className="flex items-center gap-6">
          {/* Current logo preview */}
          <div className="w-24 h-24 bg-surface2 border border-border rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain p-2" />
            ) : (
              <span className="text-3xl opacity-30">🔵</span>
            )}
          </div>

          {/* Upload zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            className={`flex-1 border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
              dragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
            }`}
          >
            {uploading ? (
              <div className="text-sm font-body text-text">⬆️ Mengupload...</div>
            ) : (
              <>
                <div className="font-body text-sm text-text mb-1">Drag & drop logo di sini</div>
                <label className="inline-flex items-center gap-2 bg-accent text-bg px-4 py-1.5 rounded-lg font-bold text-xs cursor-pointer hover:brightness-110 transition-all mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleUpload(e.target.files)}
                    className="hidden"
                  />
                  Pilih Logo
                </label>
              </>
            )}
          </div>
        </div>

        {logoUrl && (
          <button
            onClick={() => onChange('')}
            className="text-xs text-muted hover:text-accent2 font-body transition-colors"
          >
            ✕ Hapus logo (kembali ke teks "IranzaLive")
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Photo Upload Tab ─── */
function PhotosTab({
  photos,
  onChange,
}: {
  photos: HeroPhoto[]
  onChange: (photos: HeroPhoto[]) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [editingCaption, setEditingCaption] = useState<number | null>(null)

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)

    const newPhotos: HeroPhoto[] = []

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} bukan gambar — skip`)
        continue
      }

      try {
        toast.loading(`Mengupload ${file.name}...`, { id: file.name })

        const result = await uploadToCloudinary(file, {
          folder: 'iranza-live/landing',
          tags: ['landing-page', 'hero'],
          onProgress: setProgress,
        })

        newPhotos.push({ cloudinary_url: result.secure_url, caption: '' })
        toast.success(`✅ ${file.name} berhasil`, { id: file.name })
      } catch (err) {
        toast.error(`Gagal upload ${file.name}`, { id: file.name })
        console.error(err)
      }
    }

    onChange([...photos, ...newPhotos])
    setUploading(false)
    setProgress(0)
  }, [photos, onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleUpload(e.dataTransfer.files)
  }, [handleUpload])

  const removePhoto = (i: number) => {
    const next = [...photos]
    next.splice(i, 1)
    onChange(next)
  }

  const movePhoto = (i: number, dir: -1 | 1) => {
    const next = [...photos]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  const updateCaption = (i: number, caption: string) => {
    const next = [...photos]
    next[i] = { ...next[i], caption }
    onChange(next)
  }

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 flex gap-3 items-start">
        <span className="text-xl">☁️</span>
        <div>
          <div className="font-body font-semibold text-text text-sm">Foto tersimpan di Cloudinary — zero storage lokal</div>
          <div className="text-muted text-xs font-body mt-1">
            Upload foto studio/behind-the-scenes di sini. Foto akan tampil di:
            (1) <strong className="text-text">strip scrolling</strong> bawah hero section,
            (2) <strong className="text-text">Work gallery</strong> section — max 6 foto ditampilkan pertama.
          </div>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          dragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
        }`}
      >
        {uploading ? (
          <div className="space-y-3">
            <div className="text-2xl animate-bounce">⬆️</div>
            <div className="font-body text-sm text-text">Mengupload ke Cloudinary... {progress}%</div>
            <div className="w-48 mx-auto h-1.5 bg-surface2 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="text-3xl mb-3">📸</div>
            <div className="font-body text-sm text-text mb-1">Drag & drop foto studio di sini</div>
            <div className="text-muted text-xs font-body mb-4">atau klik pilih file — JPG, PNG, WebP</div>
            <label className="inline-flex items-center gap-2 bg-accent text-bg px-5 py-2 rounded-xl font-bold text-sm cursor-pointer hover:brightness-110 transition-all">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={e => handleUpload(e.target.files)}
                className="hidden"
              />
              Pilih Foto
            </label>
          </>
        )}
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg tracking-widest text-text">{photos.length} FOTO TERSIMPAN</h3>
            <span className="text-xs text-muted font-body">Drag urutan → tampilan di landing page</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, i) => (
              <div key={`${photo.cloudinary_url}-${i}`} className="bg-surface border border-border rounded-xl overflow-hidden group">
                {/* Thumbnail */}
                <div className="aspect-video bg-surface2 relative overflow-hidden">
                  <img
                    src={getCloudinaryThumbnail(photo.cloudinary_url, 400, 250)}
                    alt={photo.caption || `Foto ${i + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Order badge */}
                  <div className="absolute top-2 left-2 w-6 h-6 bg-accent text-bg rounded-full flex items-center justify-center text-xs font-bold font-body">
                    {i + 1}
                  </div>

                  {/* Controls overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => movePhoto(i, -1)}
                      disabled={i === 0}
                      className="w-8 h-8 bg-white/20 hover:bg-white/40 rounded-lg text-white text-sm disabled:opacity-30 transition-all"
                      title="Geser ke kiri"
                    >←</button>
                    <button
                      onClick={() => removePhoto(i)}
                      className="w-8 h-8 bg-red-500/80 hover:bg-red-500 rounded-lg text-white text-sm transition-all"
                      title="Hapus"
                    >✕</button>
                    <button
                      onClick={() => movePhoto(i, 1)}
                      disabled={i === photos.length - 1}
                      className="w-8 h-8 bg-white/20 hover:bg-white/40 rounded-lg text-white text-sm disabled:opacity-30 transition-all"
                      title="Geser ke kanan"
                    >→</button>
                  </div>
                </div>

                {/* Caption input */}
                <div className="p-2.5">
                  {editingCaption === i ? (
                    <input
                      type="text"
                      value={photo.caption || ''}
                      onChange={e => updateCaption(i, e.target.value)}
                      onBlur={() => setEditingCaption(null)}
                      autoFocus
                      placeholder="Caption (opsional)"
                      className="w-full bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-xs font-body text-text focus:outline-none focus:border-accent"
                    />
                  ) : (
                    <button
                      onClick={() => setEditingCaption(i)}
                      className="w-full text-left text-xs font-body text-muted hover:text-text transition-colors truncate"
                    >
                      {photo.caption || '+ Tambah caption...'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted font-body mt-3">
            💡 6 foto pertama ditampilkan di Work gallery. Semua foto tampil di strip scrolling hero. Gunakan ← → untuk atur urutan.
          </p>
        </div>
      )}

      {photos.length === 0 && !uploading && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3 opacity-30">📸</div>
          <div className="text-muted font-body text-sm">Belum ada foto diupload</div>
          <div className="text-muted font-body text-xs mt-1">Upload foto studio atau behind-the-scenes untuk mempercantik landing page</div>
        </div>
      )}
    </div>
  )
}

/* ─── Main ─── */
export default function SettingsPage() {
  const [settings, setSettings] = useState<LandingSettings>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('branding')

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let cur: any = next
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]]
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
      toast.success('✅ Pengaturan landing page tersimpan!')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="font-display text-2xl tracking-widest text-muted">MEMUAT...</div>
    </div>
  )

  const SaveBtn = ({ full = false }: { full?: boolean }) => (
    <button
      onClick={handleSave}
      disabled={saving}
      className={`flex items-center gap-2 ${full ? 'w-full justify-center' : ''} px-5 py-2.5 rounded-xl text-sm font-body font-semibold transition-all`}
      style={{
        background: saving ? 'rgba(255,107,0,0.3)' : 'linear-gradient(135deg,#FFB800,#FF6B00,#FF2D7A)',
        color: 'white', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
        minWidth: full ? undefined : 180,
      }}
    >
      {saving ? '⏳ Menyimpan...' : '💾 Simpan Perubahan'}
    </button>
  )

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl tracking-widest text-text">
            PENGATURAN <span className="text-accent">LANDING PAGE</span>
          </h1>
          <p className="text-muted text-sm font-body mt-1">Edit konten & foto landing page Iranza Live secara real-time.</p>
        </div>
        <div className="flex gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 px-4 py-2 bg-surface2 border border-border rounded-xl text-sm font-body text-muted hover:text-text hover:border-accent/40 transition-all"
          >
            🌐 Preview
          </a>
          <SaveBtn />
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
            {tab.key === 'branding' && settings.logo_url && (
              <span className="text-accent3">✓</span>
            )}
            {tab.key === 'photos' && settings.hero_photos.length > 0 && (
              <span className="bg-accent/20 text-accent text-xs px-1.5 py-0.5 rounded-full font-mono">
                {settings.hero_photos.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-6">

        {/* ── LOGO & FAVICON ── */}
        {activeTab === 'branding' && (
          <BrandingTab
            logoUrl={settings.logo_url}
            onChange={url => set('logo_url', url)}
          />
        )}

        {/* ── FOTO LANDING PAGE ── */}
        {activeTab === 'photos' && (
          <PhotosTab
            photos={settings.hero_photos}
            onChange={photos => set('hero_photos', photos)}
          />
        )}

        {/* ── HERO & KONTAK ── */}
        {activeTab === 'hero' && (
          <>
            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
              <h3 className="font-display text-lg tracking-widest text-text">HEADLINE HERO</h3>
              <p className="text-xs text-muted font-body">Dua baris besar di hero section. Baris kedua tampil berwarna orange italic.</p>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Baris 1" value={settings.hero_headline_1} onChange={v => set('hero_headline_1', v)} placeholder="Studio Live" />
                <Input label="Baris 2 (Orange Italic)" value={settings.hero_headline_2} onChange={v => set('hero_headline_2', v)} placeholder="untuk UMKM." />
              </div>
              <Input label="Sub-teks Hero" value={settings.hero_subtext} onChange={v => set('hero_subtext', v)} multiline placeholder="Host profesional. Studio siap. Hasil terukur..." />
            </div>

            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
              <h3 className="font-display text-lg tracking-widest text-text">NOMOR WHATSAPP</h3>
              <Input
                label="Nomor WA (format: 62xxx)"
                value={settings.whatsapp_number}
                onChange={v => set('whatsapp_number', v)}
                placeholder="6285776077292"
                hint="Digunakan untuk semua tombol CTA dan floating WA button."
              />
            </div>
          </>
        )}

        {/* ── PRICING ── */}
        {activeTab === 'pricing' && (
          <>
            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
              <h3 className="font-display text-lg tracking-widest text-text">WAKTU SLOT</h3>
              <Input label="Waktu Slot Pagi & Siang" value={settings.slot_pagi_times} onChange={v => set('slot_pagi_times', v)} placeholder="05.00–09.00 & 11.00–14.00 WIB" />
              <Input label="Waktu Slot Sore & Malam" value={settings.slot_malam_times} onChange={v => set('slot_malam_times', v)} placeholder="16.00–18.00 & 20.00–02.00 WIB" />
            </div>

            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
              <h3 className="font-display text-lg tracking-widest text-text">HARGA SLOT PAGI & SIANG</h3>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Live Shopee (rb)" value={settings.prices.pagi_shopee} onChange={v => set('prices.pagi_shopee', v)} placeholder="60" />
                <Input label="Live TikTok (rb)" value={settings.prices.pagi_tiktok} onChange={v => set('prices.pagi_tiktok', v)} placeholder="60" />
                <Input label="Dual Platform (rb)" value={settings.prices.pagi_dual} onChange={v => set('prices.pagi_dual', v)} placeholder="80" />
              </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
              <h3 className="font-display text-lg tracking-widest text-text">HARGA SLOT SORE & MALAM</h3>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Live Shopee (rb)" value={settings.prices.malam_shopee} onChange={v => set('prices.malam_shopee', v)} placeholder="90" />
                <Input label="Live TikTok (rb)" value={settings.prices.malam_tiktok} onChange={v => set('prices.malam_tiktok', v)} placeholder="90" />
                <Input label="Dual Platform (rb)" value={settings.prices.malam_dual} onChange={v => set('prices.malam_dual', v)} placeholder="150" />
              </div>
            </div>
          </>
        )}

        {/* ── FEATURES ── */}
        {activeTab === 'features' && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-display text-lg tracking-widest text-text">4 KEUNGGULAN LAYANAN</h3>
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

        {/* Save bottom */}
        <div className="flex justify-end pt-2">
          <SaveBtn />
        </div>
      </div>
    </div>
  )
}
