import { useState, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { supabase } from '@/lib/supabase'
import { useOCR } from '@/hooks/useOCR'
import type { ParsedMetrics } from '@/hooks/useOCR'
import { cn, formatIDR, formatNumber, PLATFORM_ICONS } from '@/lib/utils'
import toast from 'react-hot-toast'

// ── Field definitions ─────────────────────────────────────
const METRIC_FIELDS: {
  key: keyof ParsedMetrics
  label: string
  hint: string
  type: 'viewers' | 'idr' | 'percent' | 'minutes' | 'count'
  icon: string
  platforms?: string[]
}[] = [
  { key: 'peak_viewers',         label: 'Peak Viewers',          hint: 'Jumlah penonton tertinggi saat live', type: 'viewers', icon: '📈' },
  { key: 'current_viewers',      label: 'Avg / Live Viewers',    hint: 'Rata-rata penonton selama live',      type: 'viewers', icon: '👁️' },
  { key: 'total_unique_viewers', label: 'Total Unique Viewers',  hint: 'Total penonton unik (tidak duplikat)', type: 'viewers', icon: '👥' },
  { key: 'new_followers',        label: 'Followers Baru',        hint: 'Jumlah followers/pengikut baru',      type: 'count',   icon: '⭐' },
  { key: 'total_likes',          label: 'Total Likes / Suka',    hint: 'Total like selama live',              type: 'count',   icon: '❤️' },
  { key: 'total_comments',       label: 'Total Komentar',        hint: 'Total komentar selama live',          type: 'count',   icon: '💬' },
  { key: 'total_shares',         label: 'Total Share / Bagikan', hint: 'Total share konten live',             type: 'count',   icon: '🔁' },
  { key: 'engagement_rate',      label: 'Engagement Rate (%)',   hint: 'Persentase interaksi (dari platform)', type: 'percent', icon: '💹' },
  { key: 'duration_minutes',     label: 'Durasi Live (menit)',   hint: 'Total durasi live dalam menit',       type: 'minutes', icon: '⏱️' },
  { key: 'gift_revenue',         label: 'Revenue Gift / Koin',   hint: 'Pendapatan dari hadiah/diamond',      type: 'idr',     icon: '🎁' },
  { key: 'product_revenue',      label: 'Revenue Produk',        hint: 'Pendapatan dari penjualan produk',    type: 'idr',     icon: '🛍️' },
  { key: 'total_revenue',        label: 'Total Revenue',         hint: 'Total semua pendapatan',              type: 'idr',     icon: '💰' },
  { key: 'total_orders',         label: 'Total Pesanan',         hint: 'Jumlah order yang masuk (Shopee)',    type: 'count',   icon: '📦', platforms: ['shopee', 'tokopedia', 'lazada'] },
  { key: 'total_gmv',            label: 'Total GMV',             hint: 'Gross Merchandise Value (Shopee)',    type: 'idr',     icon: '🏷️', platforms: ['shopee', 'tokopedia', 'lazada'] },
  { key: 'diamonds',             label: 'Total Diamonds',        hint: 'Jumlah diamond diterima (TikTok)',    type: 'count',   icon: '💎', platforms: ['tiktok'] },
]

// ── Display helpers ───────────────────────────────────────
function displayValue(val: number | null, type: string): string {
  if (val === null || val === undefined) return '—'
  if (type === 'idr') return formatIDR(val)
  if (type === 'viewers' || type === 'count') return formatNumber(val)
  if (type === 'percent') return `${val.toFixed(1)}%`
  if (type === 'minutes') {
    const h = Math.floor(val / 60), m = val % 60
    return h > 0 ? `${h}j ${m}m` : `${m}m`
  }
  return String(val)
}

function inputPlaceholder(type: string): string {
  if (type === 'idr') return '1200000'
  if (type === 'viewers') return '12400'
  if (type === 'percent') return '8.4'
  if (type === 'minutes') return '134'
  return '0'
}

// ── OCR Result Card ───────────────────────────────────────
function OCRResultCard({
  result,
  onApply,
}: {
  result: NonNullable<ReturnType<typeof useOCR>['result']>
  onApply: (parsed: ParsedMetrics) => void
}) {
  const [showRaw, setShowRaw] = useState(false)
  const hasAny = Object.values(result.parsed).some(v => v !== null)

  return (
    <div className="bg-surface border border-accent/20 rounded-2xl overflow-hidden animate-fadeUp">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-accent/5">
        <div className="flex items-center gap-3">
          <span className="text-lg">🤖</span>
          <div>
            <div className="font-display text-sm tracking-widest text-accent">HASIL OCR</div>
            <div className="text-xs text-muted font-body">
              Akurasi: {result.confidence}% ·{' '}
              <span className="capitalize">{result.platform === 'unknown' ? 'Platform tidak dikenali' : result.platform}</span>
              {result.platform !== 'unknown' && ` ${PLATFORM_ICONS[result.platform]}`}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="text-xs text-muted hover:text-text transition-colors font-body border border-border px-2 py-1 rounded-lg"
        >
          {showRaw ? 'Sembunyikan' : 'Lihat teks mentah'}
        </button>
      </div>

      {/* Raw text preview */}
      {showRaw && (
        <div className="px-5 py-3 border-b border-border bg-bg/50">
          <pre className="text-xs font-mono text-muted whitespace-pre-wrap max-h-32 overflow-y-auto">
            {result.rawText || '(tidak ada teks)'}
          </pre>
        </div>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="px-5 py-3 border-b border-border bg-gold/5">
          <div className="flex items-start gap-2">
            <span className="text-gold text-sm flex-shrink-0">⚠️</span>
            <div className="space-y-0.5">
              {result.warnings.map((w, i) => (
                <div key={i} className="text-xs text-gold/80 font-body">{w}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Parsed values */}
      {hasAny ? (
        <div className="p-5">
          <div className="text-xs text-muted font-body mb-3 uppercase tracking-wider">
            Nilai yang berhasil dibaca:
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
            {METRIC_FIELDS.filter(f => result.parsed[f.key] !== null).map(f => (
              <div key={f.key} className="bg-surface2 border border-border rounded-xl p-3">
                <div className="text-base mb-1">{f.icon}</div>
                <div className="font-mono text-sm font-bold text-accent">
                  {displayValue(result.parsed[f.key], f.type)}
                </div>
                <div className="text-xs text-muted font-body mt-0.5">{f.label}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => onApply(result.parsed)}
            className="w-full py-3 bg-accent text-bg rounded-xl font-body font-bold text-sm hover:brightness-110 transition-all"
          >
            ✅ Terapkan ke Form
          </button>
        </div>
      ) : (
        <div className="p-5 text-center">
          <div className="text-3xl mb-2 opacity-30">🔍</div>
          <div className="text-muted font-body text-sm">
            Tidak ada nilai yang berhasil terbaca. Coba screenshot yang lebih jelas atau isi manual.
          </div>
        </div>
      )}
    </div>
  )
}

// ── OCR Upload Zone ───────────────────────────────────────
function OCRUploadZone({
  onFile,
  status,
  progress,
}: {
  onFile: (f: File) => void
  status: ReturnType<typeof useOCR>['status']
  progress: number
}) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) onFile(file)
    else toast.error('Hanya file gambar yang diterima (PNG/JPG/WEBP)')
  }

  const isProcessing = status === 'loading-engine' || status === 'processing'

  const statusLabel: Record<typeof status, string> = {
    idle: '',
    'loading-engine': 'Memuat engine OCR...',
    processing: `Membaca teks... ${progress}%`,
    done: 'Selesai!',
    error: 'Terjadi error',
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onClick={() => !isProcessing && inputRef.current?.click()}
      className={cn(
        'border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all relative overflow-hidden',
        dragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/40',
        isProcessing && 'cursor-not-allowed'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => e.target.files?.[0] && onFile(e.target.files[0])}
      />

      {isProcessing ? (
        <div className="space-y-3">
          <div className="text-2xl animate-pulse2">🔍</div>
          <div className="font-body text-sm text-text">{statusLabel[status]}</div>
          {status === 'processing' && (
            <div className="w-48 mx-auto h-1.5 bg-surface2 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <div className="text-xs text-muted font-body">Mohon tunggu, jangan tutup halaman ini</div>
        </div>
      ) : (
        <>
          <div className="text-3xl mb-2 opacity-60">📸</div>
          <div className="font-body text-sm font-medium text-text mb-1">
            Drop screenshot di sini, atau klik untuk pilih
          </div>
          <div className="text-xs text-muted font-body">
            Screenshot dari TikTok Studio, Shopee Seller Center, atau platform lain
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {['TikTok Live Studio', 'Shopee Seller Center', 'IG Live Insights'].map(p => (
              <span key={p} className="text-xs bg-surface2 border border-border px-2 py-0.5 rounded-full text-muted font-body">
                {p}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function MetricsInputPage() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session')
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { sessions, upsertMetrics } = useAppStore()
  const ocr = useOCR()

  const session = sessions.find(s => s.id === sessionId)

  // Form state: string values for inputs
  const [form, setForm] = useState<Partial<Record<keyof ParsedMetrics, string>>>({})
  const [saving, setSaving] = useState(false)
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'ocr' | 'manual'>('ocr')
  const [selectedSession, setSelectedSession] = useState(sessionId || '')

  const activeSessions = sessions.filter(s => s.status === 'live' || s.status === 'completed')

  const setField = (key: keyof ParsedMetrics, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }))

  // Apply OCR result to form
  const handleApplyOCR = (parsed: ParsedMetrics) => {
    const next: Partial<Record<keyof ParsedMetrics, string>> = { ...form }
    ;(Object.keys(parsed) as (keyof ParsedMetrics)[]).forEach(key => {
      if (parsed[key] !== null) next[key] = String(parsed[key])
    })
    setForm(next)
    setActiveTab('manual')
    toast.success('✅ Data OCR diterapkan ke form! Cek & sesuaikan jika perlu.')
  }

  // Handle file drop / select
  const handleFile = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file)
    setPreviewImg(url)
    await ocr.processImage(file)
  }, [ocr])

  // Save to Supabase
  const handleSave = async () => {
    if (!selectedSession) {
      toast.error('Pilih sesi terlebih dahulu!')
      return
    }

    setSaving(true)
    const toNum = (v: string | undefined) => v ? parseFloat(v) || undefined : undefined
    const toInt = (v: string | undefined) => v ? parseInt(v) || undefined : undefined

    const payload = {
      session_id: selectedSession,
      peak_viewers:         toInt(form.peak_viewers),
      current_viewers:      toInt(form.current_viewers),
      total_unique_viewers: toInt(form.total_unique_viewers),
      new_followers:        toInt(form.new_followers),
      total_likes:          toInt(form.total_likes),
      total_comments:       toInt(form.total_comments),
      total_shares:         toInt(form.total_shares),
      engagement_rate:      toNum(form.engagement_rate),
      duration_minutes:     toInt(form.duration_minutes),
      gift_revenue:         toInt(form.gift_revenue),
      product_revenue:      toInt(form.product_revenue),
      total_revenue:        toInt(form.total_revenue) || ((toInt(form.gift_revenue) || 0) + (toInt(form.product_revenue) || 0)) || undefined,
    }

    // Save extended fields to metadata
    const meta: Record<string, number | undefined> = {
      total_orders: toInt(form.total_orders),
      total_gmv:    toInt(form.total_gmv),
      diamonds:     toInt(form.diamonds),
    }

    await upsertMetrics(selectedSession, payload)

    // Also save raw extended data
    await supabase.from('session_metrics').upsert({
      ...payload,
      recorded_at: new Date().toISOString(),
    })

    setSaving(false)
    toast.success('✅ Metrics berhasil disimpan!')
    navigate(`/sessions/${selectedSession}`)
  }

  // Auto-calc total_revenue when components change
  const giftVal = parseInt(form.gift_revenue || '0') || 0
  const prodVal = parseInt(form.product_revenue || '0') || 0
  const autoTotal = giftVal + prodVal

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl tracking-widest text-text">
          INPUT <span className="text-accent">METRICS</span>
        </h1>
        <p className="text-muted text-sm font-body mt-1">
          Input data analytics dari TikTok / Shopee — via screenshot OCR atau manual
        </p>
      </div>

      {/* Session selector */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <label className="block text-xs font-body text-muted uppercase tracking-wider mb-2">
          Sesi Live *
        </label>
        <select
          value={selectedSession}
          onChange={e => setSelectedSession(e.target.value)}
          className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-sm font-body text-text focus:outline-none focus:border-accent transition-colors"
        >
          <option value="">— Pilih sesi —</option>
          {activeSessions.map(s => (
            <option key={s.id} value={s.id}>
              {s.title} · {s.client?.name} · {s.status === 'live' ? '🔴 LIVE' : '✅ Selesai'}
            </option>
          ))}
        </select>
        {session && (
          <div className="mt-2 text-xs text-muted font-body flex gap-3">
            <span>🎬 {session.studio?.name}</span>
            <span>📡 {session.platform}</span>
            <span>👤 {session.client?.name}</span>
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-surface2 border border-border rounded-xl p-1">
        <button
          onClick={() => setActiveTab('ocr')}
          className={cn(
            'flex-1 py-2.5 rounded-lg text-sm font-body font-medium transition-all flex items-center justify-center gap-2',
            activeTab === 'ocr'
              ? 'bg-surface border border-border text-text'
              : 'text-muted hover:text-text'
          )}
        >
          📸 OCR Screenshot
          <span className="text-xs bg-accent/10 text-accent border border-accent/20 px-1.5 py-0.5 rounded font-body">Auto</span>
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={cn(
            'flex-1 py-2.5 rounded-lg text-sm font-body font-medium transition-all',
            activeTab === 'manual'
              ? 'bg-surface border border-border text-text'
              : 'text-muted hover:text-text'
          )}
        >
          ✏️ Input Manual
        </button>
      </div>

      {/* OCR TAB */}
      {activeTab === 'ocr' && (
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="font-display text-sm tracking-widest text-text mb-1">UPLOAD SCREENSHOT</div>
            <p className="text-muted text-xs font-body mb-4">
              Upload screenshot dari dashboard TikTok Live Studio atau Shopee Seller Center.
              OCR akan membaca angka-angkanya otomatis.
            </p>

            {/* Tips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {[
                { icon: '🖥️', title: 'TikTok Live Studio', tip: 'Buka Creator Center → Live → Analytics. Screenshot halaman summary setelah live selesai.' },
                { icon: '🛒', title: 'Shopee Seller Center', tip: 'Buka Live → Riwayat Live → pilih sesi → screenshot halaman detail.' },
                { icon: '📊', title: 'Tips Screenshot', tip: 'Pastikan semua angka terlihat jelas. Resolusi tinggi = akurasi OCR lebih baik.' },
              ].map(t => (
                <div key={t.title} className="bg-surface2 border border-border rounded-xl p-3">
                  <div className="text-lg mb-1">{t.icon}</div>
                  <div className="text-xs font-body font-bold text-text mb-1">{t.title}</div>
                  <div className="text-xs text-muted font-body">{t.tip}</div>
                </div>
              ))}
            </div>

            <OCRUploadZone
              onFile={handleFile}
              status={ocr.status}
              progress={ocr.progress}
            />

            {/* Image preview */}
            {previewImg && (
              <div className="mt-4">
                <div className="text-xs text-muted font-body mb-2 uppercase tracking-wider">Preview Screenshot:</div>
                <div className="relative rounded-xl overflow-hidden border border-border max-h-64">
                  <img src={previewImg} alt="Screenshot preview" className="w-full object-contain max-h-64" />
                </div>
              </div>
            )}
          </div>

          {/* OCR Error */}
          {ocr.status === 'error' && (
            <div className="bg-accent2/10 border border-accent2/30 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-accent2 text-lg">❌</span>
              <div>
                <div className="font-body text-sm font-bold text-accent2">OCR Gagal</div>
                <div className="text-xs text-muted font-body mt-0.5">{ocr.error}</div>
                <button onClick={ocr.reset} className="mt-2 text-xs text-accent hover:underline font-body">
                  Coba lagi
                </button>
              </div>
            </div>
          )}

          {/* OCR Result */}
          {ocr.status === 'done' && ocr.result && (
            <OCRResultCard result={ocr.result} onApply={handleApplyOCR} />
          )}

          {ocr.status !== 'idle' && ocr.status !== 'error' && ocr.status !== 'done' && (
            <div className="bg-surface border border-border rounded-2xl p-6 text-center">
              <div className="text-2xl mb-2 animate-pulse2">🔍</div>
              <div className="font-body text-sm text-text">Sedang memproses...</div>
              <div className="text-xs text-muted font-body mt-1">
                Engine OCR multi-bahasa (ID+EN) sedang membaca teks
              </div>
            </div>
          )}
        </div>
      )}

      {/* MANUAL INPUT TAB */}
      {activeTab === 'manual' && (
        <div className="space-y-4">
          {/* Audience section */}
          <Section title="👁️ Penonton & Reach">
            {METRIC_FIELDS.filter(f => ['peak_viewers','current_viewers','total_unique_viewers'].includes(f.key)).map(f => (
              <InputField
                key={f.key}
                field={f}
                value={form[f.key] || ''}
                onChange={v => setField(f.key, v)}
              />
            ))}
          </Section>

          {/* Engagement */}
          <Section title="💬 Engagement">
            {METRIC_FIELDS.filter(f => ['new_followers','total_likes','total_comments','total_shares','engagement_rate','duration_minutes'].includes(f.key)).map(f => (
              <InputField
                key={f.key}
                field={f}
                value={form[f.key] || ''}
                onChange={v => setField(f.key, v)}
              />
            ))}
          </Section>

          {/* Revenue */}
          <Section title="💰 Revenue">
            {METRIC_FIELDS.filter(f => ['gift_revenue','product_revenue','total_revenue'].includes(f.key)).map(f => (
              <div key={f.key}>
                <InputField
                  field={f}
                  value={form[f.key] || ''}
                  onChange={v => setField(f.key, v)}
                />
                {f.key === 'total_revenue' && autoTotal > 0 && !form.total_revenue && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-muted font-body">Auto-kalkulasi:</span>
                    <button
                      onClick={() => setField('total_revenue', String(autoTotal))}
                      className="text-xs text-accent hover:underline font-body"
                    >
                      Pakai {formatIDR(autoTotal)} (gift + produk)
                    </button>
                  </div>
                )}
              </div>
            ))}
          </Section>

          {/* Platform-specific */}
          <Section title="🏪 Shopee / TikTok Spesifik">
            <div className="text-xs text-muted font-body mb-3">
              Field khusus platform — isi sesuai platform yang digunakan
            </div>
            {METRIC_FIELDS.filter(f => f.platforms).map(f => (
              <InputField
                key={f.key}
                field={f}
                value={form[f.key] || ''}
                onChange={v => setField(f.key, v)}
              />
            ))}
          </Section>

          {/* Preview */}
          {Object.values(form).some(v => v !== '' && v !== undefined) && (
            <div className="bg-surface border border-border rounded-2xl p-5">
              <div className="font-display text-sm tracking-widest text-text mb-3">PREVIEW DATA</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {METRIC_FIELDS.filter(f => form[f.key]).map(f => (
                  <div key={f.key} className="bg-surface2 rounded-xl p-3">
                    <div className="text-base mb-0.5">{f.icon}</div>
                    <div className="font-mono text-sm font-bold text-accent">
                      {displayValue(parseFloat(form[f.key] || '0') || null, f.type)}
                    </div>
                    <div className="text-xs text-muted font-body">{f.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save button */}
      <div className="flex gap-3 sticky bottom-6">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-surface border border-border rounded-xl font-body text-sm text-muted hover:text-text transition-colors"
        >
          Batal
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !selectedSession}
          className="flex-1 py-3 bg-accent text-bg rounded-xl font-body font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Menyimpan...' : '💾 Simpan Metrics ke Database'}
        </button>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
      <div className="font-display text-sm tracking-widest text-muted">{title}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {children}
      </div>
    </div>
  )
}

function InputField({
  field,
  value,
  onChange,
}: {
  field: typeof METRIC_FIELDS[0]
  value: string
  onChange: (v: string) => void
}) {
  const isFilled = value !== ''
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-body text-muted mb-1.5 uppercase tracking-wider">
        <span>{field.icon}</span>
        {field.label}
        {field.platforms && (
          <span className="text-xs font-body normal-case tracking-normal text-accent/60 ml-1">
            ({field.platforms.join('/')})
          </span>
        )}
      </label>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={inputPlaceholder(field.type)}
          className={cn(
            'w-full bg-surface2 border rounded-xl px-3 py-2.5 text-sm font-mono text-text placeholder-muted/40 focus:outline-none transition-colors',
            isFilled ? 'border-accent/40 bg-accent/5' : 'border-border focus:border-accent'
          )}
        />
        {isFilled && field.type === 'idr' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gold font-mono pointer-events-none">
            {formatIDR(parseFloat(value) || 0)}
          </div>
        )}
        {isFilled && (field.type === 'viewers' || field.type === 'count') && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-accent font-mono pointer-events-none">
            {formatNumber(parseInt(value) || 0)}
          </div>
        )}
      </div>
      <div className="text-xs text-muted/60 font-body mt-0.5">{field.hint}</div>
    </div>
  )
}
