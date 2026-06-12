import { useState, useCallback, useRef } from 'react'

// ── Types ──────────────────────────────────────────────────
export interface OCRResult {
  rawText: string
  confidence: number
  parsed: ParsedMetrics
  platform: 'tiktok' | 'shopee' | 'instagram' | 'unknown'
  warnings: string[]
}

export interface ParsedMetrics {
  current_viewers:      number | null
  peak_viewers:         number | null
  total_unique_viewers: number | null
  new_followers:        number | null
  total_likes:          number | null
  total_comments:       number | null
  total_shares:         number | null
  gift_revenue:         number | null
  product_revenue:      number | null
  total_revenue:        number | null
  engagement_rate:      number | null
  duration_minutes:     number | null
  // Shopee-specific
  total_orders:         number | null
  total_gmv:            number | null
  // TikTok-specific
  diamonds:             number | null
}

export type OCRStatus = 'idle' | 'loading-engine' | 'processing' | 'done' | 'error'

// ── Number parser helpers ──────────────────────────────────
function parseIDRAmount(str: string): number | null {
  // Handles: "Rp 1.200.000", "1,2jt", "1.2jt", "Rp1200000", "120rb", "1200K"
  const s = str.replace(/\s/g, '').toLowerCase()

  const juta = s.match(/([\d.,]+)\s*j(t|uta)?/)
  if (juta) return Math.round(parseFloat(juta[1].replace(',', '.')) * 1_000_000)

  const ribu = s.match(/([\d.,]+)\s*(rb|ribu|k)/)
  if (ribu) return Math.round(parseFloat(ribu[1].replace(',', '.')) * 1_000)

  // Plain IDR with dots as thousands separator
  const plain = s.match(/rp\s*([\d.]+)/)
  if (plain) return parseInt(plain[1].replace(/\./g, ''), 10)

  return null
}

function parseViewerCount(str: string): number | null {
  // Handles: "12.4K", "12,400", "1.2M", "9800", "9.8K"
  const s = str.trim().replace(/\s/g, '')

  const m = s.match(/([\d.,]+)\s*[Mm]/)
  if (m) return Math.round(parseFloat(m[1].replace(',', '.')) * 1_000_000)

  const k = s.match(/([\d.,]+)\s*[Kk]/)
  if (k) return Math.round(parseFloat(k[1].replace(',', '.')) * 1_000)

  const plain = s.match(/^[\d.,]+$/)
  if (plain) return parseInt(s.replace(/[.,]/g, ''), 10) || null

  return null
}

function parseDuration(str: string): number | null {
  // "2:14:32" → 134 min | "1j 30m" | "90m" | "1 jam 30 menit"
  const hms = str.match(/(\d+):(\d+):(\d+)/)
  if (hms) return parseInt(hms[1]) * 60 + parseInt(hms[2])

  const hm = str.match(/(\d+):(\d+)/)
  if (hm) return parseInt(hm[1]) * 60 + parseInt(hm[2])

  const jam = str.match(/(\d+)\s*j(am)?/)
  const mnt = str.match(/(\d+)\s*m(enit|en|in)?/)
  if (jam || mnt) {
    return (jam ? parseInt(jam[1]) * 60 : 0) + (mnt ? parseInt(mnt[1]) : 0)
  }
  return null
}

function parseEngagementRate(str: string): number | null {
  const m = str.match(/([\d.]+)\s*%/)
  if (m) return parseFloat(m[1])
  return null
}

// ── Platform detector ─────────────────────────────────────
function detectPlatform(text: string): OCRResult['platform'] {
  const lower = text.toLowerCase()
  if (lower.includes('tiktok') || lower.includes('diamond') ||
      lower.includes('live studio') || lower.includes('tik tok')) return 'tiktok'
  if (lower.includes('shopee') || lower.includes('gmv') ||
      lower.includes('seller center') || lower.includes('pesanan')) return 'shopee'
  if (lower.includes('instagram') || lower.includes('reels')) return 'instagram'
  return 'unknown'
}

// ── Main parser ───────────────────────────────────────────
function parseMetricsFromText(text: string): { parsed: ParsedMetrics; warnings: string[] } {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const full = text.toLowerCase()
  const warnings: string[] = []

  const m: ParsedMetrics = {
    current_viewers: null, peak_viewers: null, total_unique_viewers: null,
    new_followers: null, total_likes: null, total_comments: null,
    total_shares: null, gift_revenue: null, product_revenue: null,
    total_revenue: null, engagement_rate: null, duration_minutes: null,
    total_orders: null, total_gmv: null, diamonds: null,
  }

  // ── Pattern matchers (line-by-line context) ──
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase()
    const nextLine = lines[i + 1] || ''
    const combined = line + ' ' + nextLine

    // Viewers / Penonton
    if (/peak|penonton.*tertinggi|max.*view|viewer.*peak|puncak/.test(line)) {
      m.peak_viewers = parseViewerCount(nextLine) ?? parseViewerCount(line)
    }
    if (/live.*view|penonton.*sekarang|current.*view|viewers?\s*:/.test(line)) {
      m.current_viewers = parseViewerCount(nextLine) ?? parseViewerCount(line)
    }
    if (/unique.*view|total.*penonton|jumlah.*penonton/.test(line)) {
      m.total_unique_viewers = parseViewerCount(nextLine) ?? parseViewerCount(line)
    }

    // Followers
    if (/follow|pengikut baru|new.*follower/.test(line)) {
      const val = parseViewerCount(nextLine) ?? parseViewerCount(line)
      if (val !== null) m.new_followers = val
    }

    // Likes / Suka
    if (/like|suka|hati/.test(line) && !/dislike/.test(line)) {
      const val = parseViewerCount(nextLine) ?? parseViewerCount(line)
      if (val !== null) m.total_likes = val
    }

    // Comments / Komentar
    if (/comment|komentar/.test(line)) {
      const val = parseViewerCount(nextLine) ?? parseViewerCount(line)
      if (val !== null) m.total_comments = val
    }

    // Shares / Bagikan
    if (/share|bagikan/.test(line)) {
      const val = parseViewerCount(nextLine) ?? parseViewerCount(line)
      if (val !== null) m.total_shares = val
    }

    // Revenue / Gift / Hadiah
    if (/gift|hadiah|koin|diamond/.test(line)) {
      const idr = parseIDRAmount(combined)
      if (idr) m.gift_revenue = idr

      const dia = combined.match(/(\d[\d.,]*)\s*(diamond|berlian)/i)
      if (dia) m.diamonds = parseViewerCount(dia[1])
    }

    // GMV / Penjualan (Shopee)
    if (/gmv|total.*penjualan|pendapatan|omzet/.test(line)) {
      const idr = parseIDRAmount(combined)
      if (idr) m.total_gmv = idr
    }

    // Orders / Pesanan (Shopee)
    if (/pesanan|order|terjual/.test(line)) {
      const val = parseViewerCount(nextLine) ?? parseViewerCount(line)
      if (val !== null) m.total_orders = val
    }

    // Product revenue
    if (/produk.*terjual|product.*revenue|pendapatan.*produk/.test(line)) {
      const idr = parseIDRAmount(combined)
      if (idr) m.product_revenue = idr
    }

    // Total revenue
    if (/total.*revenue|total.*pendapatan|total.*penghasilan/.test(line)) {
      const idr = parseIDRAmount(combined)
      if (idr) m.total_revenue = idr
    }

    // Engagement rate
    if (/engage|interaksi.*rate|tingkat.*interaksi/.test(line)) {
      const rate = parseEngagementRate(combined)
      if (rate !== null) m.engagement_rate = rate
    }

    // Duration / Durasi
    if (/durasi|duration|lama.*live|waktu.*live/.test(line)) {
      const dur = parseDuration(nextLine) ?? parseDuration(line)
      if (dur !== null) m.duration_minutes = dur
    }
  }

  // ── Fallback: regex scan entire text ──
  // Peak viewers fallback
  if (!m.peak_viewers) {
    const match = full.match(/peak[^\d]*([\d.,]+\s*[km]?)/i)
    if (match) m.peak_viewers = parseViewerCount(match[1])
  }

  // Time pattern fallback (HH:MM:SS in text)
  if (!m.duration_minutes) {
    const timeMatch = text.match(/\b(\d{1,2}):(\d{2}):(\d{2})\b/)
    if (timeMatch) {
      m.duration_minutes = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2])
    }
  }

  // Engagement rate fallback
  if (!m.engagement_rate) {
    const rateMatch = text.match(/([\d.]+)\s*%/)
    if (rateMatch) m.engagement_rate = parseFloat(rateMatch[1])
  }

  // Auto-compute total_revenue if missing but components available
  if (!m.total_revenue && (m.gift_revenue || m.product_revenue)) {
    m.total_revenue = (m.gift_revenue || 0) + (m.product_revenue || 0)
  }

  // Warnings for fields not detected
  const important: (keyof ParsedMetrics)[] = ['peak_viewers', 'gift_revenue', 'new_followers']
  important.forEach(key => {
    if (m[key] === null) warnings.push(`"${key}" tidak terdeteksi — silakan isi manual`)
  })

  return { parsed: m, warnings }
}

// ── Main hook ─────────────────────────────────────────────
export function useOCR() {
  const [status, setStatus] = useState<OCRStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<OCRResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const workerRef = useRef<unknown>(null)

  const processImage = useCallback(async (file: File) => {
    setStatus('loading-engine')
    setProgress(0)
    setResult(null)
    setError(null)

    try {
      // Dynamic import — only loads Tesseract when needed
      const { createWorker } = await import('tesseract.js')

      setStatus('loading-engine')

      const worker = await createWorker('ind+eng', 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
          } else if (m.status.includes('loading')) {
            setStatus('loading-engine')
          }
        },
      })

      workerRef.current = worker
      setStatus('processing')

      const { data } = await worker.recognize(file)
      await worker.terminate()
      workerRef.current = null

      const rawText = data.text
      const confidence = Math.round(data.confidence)
      const platform = detectPlatform(rawText)
      const { parsed, warnings } = parseMetricsFromText(rawText)

      setResult({ rawText, confidence, parsed, platform, warnings })
      setStatus('done')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'OCR gagal'
      setError(msg)
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setProgress(0)
    setResult(null)
    setError(null)
  }, [])

  return { status, progress, result, error, processImage, reset }
}
