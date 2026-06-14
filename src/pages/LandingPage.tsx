import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

interface LandingSettings {
  whatsapp_number: string
  slot_pagi_times: string
  slot_malam_times: string
  prices: {
    pagi_shopee: string; pagi_tiktok: string; pagi_dual: string
    malam_shopee: string; malam_tiktok: string; malam_dual: string
  }
  testimonials: { icon: string; name: string; role: string; text: string }[]
}

const DEFAULT: LandingSettings = {
  whatsapp_number: '6285776077292',
  slot_pagi_times: '05.00–09.00 · 11.00–14.00 WIB',
  slot_malam_times: '16.00–18.00 · 20.00–02.00 WIB',
  prices: {
    pagi_shopee: '60', pagi_tiktok: '60', pagi_dual: '80',
    malam_shopee: '90', malam_tiktok: '90', malam_dual: '150',
  },
  testimonials: [
    { icon: '🧕', name: 'Sari Dewi', role: 'Fashion Hijab · Shopee Live', text: 'Sejak pakai Iranza Live, sesi Shopee gua selalu tembus 1000+ viewers. Host-nya ngerti banget cara ngomong ke penonton — produk cepet abis sebelum sesi kelar.' },
    { icon: '👨', name: 'Budi Santoso', role: 'Elektronik · Dual Platform', text: 'Gua coba dual platform pertama kali, skeptis awalnya. Tapi dalam 2 jam satu sesi, total order dari Shopee dan TikTok lebih dari yang biasanya gua dapet seminggu.' },
    { icon: '👩', name: 'Rina Marlina', role: 'Skincare · TikTok Shop', text: 'Yang bikin gua loyal bukan cuma hasilnya, tapi mereka kirim laporan lengkap setiap sesi — viewers, engagement, konversi. Gua bisa track perkembangan toko gua.' },
    { icon: '🧑', name: 'Ahmad Fauzi', role: 'Makanan & Minuman · Shopee', text: 'Harganya murah tapi kualitasnya jauh di atas ekspektasi. Sudah 2 bulan langganan, omset naik konsisten tiap minggunya. Rekomen banget buat seller yang baru mau coba live.' },
    { icon: '👩\u200d🦱', name: 'Dewi Lestari', role: 'Pakaian Anak · TikTok Shop', text: 'Slot malamnya mantap, waktu paling ramai pembeli online. Host mereka natural ngobrolnya, ga kaku, dan selalu bisa jawab pertanyaan produk dengan baik dan meyakinkan.' },
  ],
}

const HERO_WORDS = [
  { text: 'Kami', italic: false, orange: false },
  { text: 'Jalankan', italic: true, orange: false, br: true },
  { text: 'Live', italic: false, orange: true },
  { text: 'Streaming', italic: false, orange: false, br: true },
  { text: 'Toko', italic: false, orange: false },
  { text: 'Kamu.', italic: true, orange: false },
]

const MARQUEE_1 = ['Live Shopee', 'TikTok Shop Live', 'Dual Platform', 'Host Profesional', 'Promo Launching', '4 Slot Per Hari', 'Kualitas HD', 'Mulai 60rb / Sesi']
const MARQUEE_2 = ['Live Profesional', 'Hasil Maksimal', 'Slot Pagi & Siang', 'Slot Sore & Malam', 'Promo Launching!', 'Booking Sekarang']

const SERVICES = [
  { num: '01', name: 'Shopee Live', bg: 'rgba(255,77,0,0.05)',
    desc: 'Jangkau jutaan pembeli aktif Shopee. Kami optimalkan voucher, product pin, flash sale, dan interaksi real-time untuk dorong konversi dan pembelian impulsif di setiap sesi.',
    tags: ['Flash Sale', 'Voucher Live', 'Product Pin', 'Real-time Q&A'] },
  { num: '02', name: 'TikTok Shop Live', bg: 'rgba(124,58,237,0.06)',
    desc: 'Algoritma TikTok membawa traffic organik yang tidak bisa dibeli. Kami buat setiap momen live menjadi konten yang engaging — dari hook pembuka sampai closing yang mendorong klik "Beli".',
    tags: ['For You Page', 'Gift Engagement', 'Viral Hook', 'Product Showcase'] },
  { num: '03', name: 'Dual Platform', bg: 'rgba(255,214,0,0.05)',
    desc: 'Satu host, dua platform berjalan bersamaan. Dobel jangkauan, dobel potensi penjualan — dengan efisiensi biaya yang lebih tinggi dibanding booking terpisah.',
    tags: ['Shopee + TikTok', '2 Jam / Sesi', 'Best Value'] },
]

function useReveal() {
  const [visible, setVisible] = useState<Set<string>>(new Set())
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal-id]')
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && e.target instanceof HTMLElement) {
          const id = e.target.dataset.revealId!
          const d = parseFloat(e.target.dataset.revealDelay || '0')
          setTimeout(() => setVisible(prev => new Set([...prev, id])), d * 70)
          obs.unobserve(e.target)
        }
      })
    }, { threshold: 0.07, rootMargin: '0px 0px -30px 0px' })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
  return visible
}

function useCountUp(target: number, active: boolean) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    const dur = 1600, step = 16
    const inc = target / (dur / step)
    let cur = 0
    const timer = setInterval(() => {
      cur = Math.min(cur + inc, target)
      setVal(Math.floor(cur))
      if (cur >= target) clearInterval(timer)
    }, step)
    return () => clearInterval(timer)
  }, [active, target])
  return val
}

export default function LandingPage() {
  const [s, setS] = useState<LandingSettings>(DEFAULT)
  const [scrolled, setScrolled] = useState(false)
  const visible = useReveal()
  const trackRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const cursorRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const [cursorMode, setCursorMode] = useState<'default' | 'hover' | 'cta'>('default')
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    supabase.from('landing_settings').select('*').eq('id', 1).maybeSingle()
      .then(({ data }) => { if (data?.settings) setS({ ...DEFAULT, ...data.settings }) })
  }, [])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    setIsDesktop(window.matchMedia('(min-width:769px)').matches)
  }, [])

  // Custom cursor
  useEffect(() => {
    if (!isDesktop) return
    let mx = 0, my = 0, rx = 0, ry = 0, raf: number
    const move = (e: MouseEvent) => { mx = e.clientX; my = e.clientY }
    window.addEventListener('mousemove', move)
    const anim = () => {
      rx += (mx - rx) * 0.12
      ry += (my - ry) * 0.12
      if (cursorRef.current) { cursorRef.current.style.left = mx + 'px'; cursorRef.current.style.top = my + 'px' }
      if (ringRef.current) { ringRef.current.style.left = rx + 'px'; ringRef.current.style.top = ry + 'px' }
      if (labelRef.current) { labelRef.current.style.left = mx + 'px'; labelRef.current.style.top = my + 'px' }
      raf = requestAnimationFrame(anim)
    }
    anim()
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf) }
  }, [isDesktop])

  // Pointer enter/leave for interactive elements
  useEffect(() => {
    if (!isDesktop) return
    const els = document.querySelectorAll('a, button, [data-service-item]')
    const onEnter = (e: Event) => {
      const el = e.currentTarget as HTMLElement
      setCursorMode(el.dataset.cursorCta === 'true' ? 'cta' : 'hover')
    }
    const onLeave = () => setCursorMode('default')
    els.forEach(el => { el.addEventListener('mouseenter', onEnter); el.addEventListener('mouseleave', onLeave) })
    return () => els.forEach(el => { el.removeEventListener('mouseenter', onEnter); el.removeEventListener('mouseleave', onLeave) })
  }, [isDesktop, s])

  const wa = (msg: string) => `https://wa.me/${s.whatsapp_number}?text=${encodeURIComponent(msg)}`
  const phone = s.whatsapp_number.replace('62', '0').replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3')

  const rv = (id: string): React.CSSProperties => ({
    opacity: visible.has(id) ? 1 : 0,
    transform: visible.has(id) ? 'none' : 'translateY(32px)',
    transition: 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)',
  })

  const statsActive = visible.has('about-stats')
  const c50 = useCountUp(50, statsActive)
  const c4 = useCountUp(4, statsActive)
  const c2 = useCountUp(2, statsActive)

  const G = '#FF4D00'

  // testimonial drag
  const onTrackDown = (e: React.MouseEvent) => {
    draggingRef.current = true
    startXRef.current = e.pageX
    scrollLeftRef.current = trackRef.current?.scrollLeft || 0
  }
  const onTrackUp = () => { draggingRef.current = false }
  const onTrackMove = (e: React.MouseEvent) => {
    if (!draggingRef.current || !trackRef.current) return
    e.preventDefault()
    const dx = e.pageX - startXRef.current
    trackRef.current.scrollLeft = scrollLeftRef.current - dx * 1.4
  }
  const scrollTesti = (dir: number) => trackRef.current?.scrollBy({ left: dir * 420, behavior: 'smooth' })

  return (
    <div style={{ background: '#0C0C0C', color: '#F0EDE6', fontFamily: "'DM Sans', sans-serif", fontWeight: 300, overflowX: 'hidden', WebkitFontSmoothing: 'antialiased', cursor: isDesktop ? 'none' : 'auto' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
        :root { --black:#0C0C0C; --black2:#141414; --paper:#F0EDE6; --orange:#FF4D00; --yellow:#FFD600; --muted:rgba(240,237,230,0.38); --border:rgba(240,237,230,0.08); }
        a { text-decoration:none; color:inherit; }
        button { border:none; background:none; font-family:inherit; cursor:${isDesktop ? 'none' : 'pointer'}; }
        .live-dot-l { width:8px;height:8px;border-radius:50%;background:#EF4444;animation:livePulse 1.5s ease-in-out infinite; }
        @keyframes livePulse { 0%{box-shadow:0 0 0 0 rgba(239,68,68,.7);} 70%{box-shadow:0 0 0 10px rgba(239,68,68,0);} 100%{box-shadow:0 0 0 0 rgba(239,68,68,0);} }
        .word-wrap-l { overflow:hidden; display:inline-block; vertical-align:top; }
        .word-l { display:inline-block; transition:transform 1s cubic-bezier(0.16,1,0.3,1); }
        .btn-pri-l { font-family:'Syne',sans-serif;font-size:15px;font-weight:700;letter-spacing:.04em;background:var(--orange);color:white;padding:16px 36px;border-radius:2px;display:inline-flex;align-items:center;gap:12px;transition:background .2s,transform .2s,box-shadow .2s; }
        .btn-pri-l:hover { background:#e64400;transform:translateY(-2px);box-shadow:0 16px 48px rgba(255,77,0,.35); }
        .btn-ghost-l { font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);display:inline-flex;align-items:center;gap:8px;transition:color .2s; }
        .btn-ghost-l:hover { color:var(--paper); }
        .nav-link-l { font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);transition:color .2s;position:relative; }
        .nav-link-l::after { content:'';position:absolute;bottom:-3px;left:0;right:0;height:1px;background:var(--orange);transform:scaleX(0);transform-origin:left;transition:transform .3s cubic-bezier(.23,1,.32,1); }
        .nav-link-l:hover { color:var(--paper); }
        .nav-link-l:hover::after { transform:scaleX(1); }
        .nav-cta-pill-l { font-family:'Space Mono',monospace;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;background:var(--orange);color:white;padding:11px 26px;border-radius:100px;transition:background .25s,transform .2s;display:inline-block; }
        .nav-cta-pill-l:hover { background:#e64400;transform:scale(1.03); }
        .marquee-track-l { display:flex;width:max-content;animation:marqueeScroll 28s linear infinite; }
        .marquee-track-l.rev { animation-direction:reverse;animation-duration:22s; }
        @keyframes marqueeScroll { from{transform:translateX(0);} to{transform:translateX(-50%);} }
        .marquee-item-l { display:flex;align-items:center;gap:20px;padding:0 36px;font-family:'Syne',sans-serif;font-size:14px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);white-space:nowrap;flex-shrink:0; }
        .service-item-l:hover .service-bg-l { opacity:1; }
        .service-item-l:hover .service-arrow-l { transform:rotate(45deg);border-color:var(--orange);background:var(--orange); }
        .service-item-l:hover .service-body-l { max-height:200px;padding-bottom:36px; }
        .service-item-l:hover .service-head-l { padding:36px 0; }
        .service-bg-l { position:absolute;inset:0;opacity:0;transition:opacity .5s cubic-bezier(.23,1,.32,1);pointer-events:none; }
        .service-arrow-l { width:48px;height:48px;border:1px solid var(--border);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;transition:transform .4s cubic-bezier(.23,1,.32,1),border-color .3s,background .3s; }
        .service-head-l { display:grid;grid-template-columns:60px 1fr auto;align-items:center;gap:24px;padding:32px 0;position:relative;z-index:1;transition:padding .3s; }
        .service-body-l { display:grid;grid-template-columns:60px 1fr auto;gap:24px;padding:0;position:relative;z-index:1;max-height:0;overflow:hidden;transition:max-height .5s cubic-bezier(.23,1,.32,1),padding .3s; }
        .stat-cell-l:hover { background:rgba(255,77,0,0.04); }
        .price-row-l:hover::before { opacity:1; }
        .price-row-l.featured::before { opacity:1;background:rgba(255,77,0,0.07); }
        .price-row-bg-l { content:'';position:absolute;left:-48px;right:-48px;top:0;bottom:0;background:rgba(255,77,0,0.04);opacity:0;transition:opacity .25s; }
        .testi-card-l:hover { border-color:rgba(255,77,0,.3); transform:translateY(-4px); }
        .testi-btn-l:hover { border-color:var(--orange);color:var(--paper);background:var(--orange); }
        .footer-link-l:hover { color:var(--orange); }
        .footer-link-l:hover .arr-l { transform:translate(2px,-2px); }
        .wa-fab-l:hover { transform:scale(1.1);box-shadow:0 12px 40px rgba(37,211,102,.6); }
        .testi-track-l::-webkit-scrollbar { display:none; }
        @media(max-width:1024px){
          .hero-bottom-l { grid-template-columns:1fr 1fr!important; }
          .hero-cta-group-l { grid-column:1/-1!important;flex-direction:row!important;align-items:center!important; }
          .s-header-l { grid-template-columns:140px 1fr!important; }
          .about-grid-l { grid-template-columns:1fr!important;gap:48px!important; }
          .cta-inner-l { grid-template-columns:1fr!important; }
          .cta-right-l { text-align:left!important; }
          .footer-top-l { grid-template-columns:1fr 1fr!important; }
          .price-row-l { grid-template-columns:44px 1fr auto!important; }
          .pr-badge-l { display:none!important; }
          .pricing-cta-block-l { flex-direction:column!important;align-items:flex-start!important; }
        }
        @media(max-width:768px){
          .nav-links-l .nav-link-l { display:none!important; }
          .hero-h1-l { font-size:clamp(52px,14vw,100px)!important; }
          .hero-bottom-l { grid-template-columns:1fr!important;gap:24px!important; }
          .s-header-l { grid-template-columns:1fr!important;gap:16px!important;margin-bottom:48px!important; }
          .stats-grid-l { grid-template-columns:1fr!important; }
          .stat-cell-l { border-right:none!important; }
          .service-head-l { grid-template-columns:40px 1fr auto!important; }
          .service-body-l { grid-template-columns:40px 1fr!important; }
          .testi-card-l { min-width:300px!important;max-width:300px!important; }
          .cta-bg-text-l { display:none!important; }
          .footer-top-l { grid-template-columns:1fr!important; }
          .footer-bottom-l { flex-direction:column!important;align-items:flex-start!important; }
        }
      `}</style>

      {/* CURSOR */}
      {isDesktop && (
        <>
          <div ref={cursorRef} style={{
            position: 'fixed', width: cursorMode === 'cta' ? 80 : cursorMode === 'hover' ? 60 : 10,
            height: cursorMode === 'cta' ? 80 : cursorMode === 'hover' ? 60 : 10,
            background: cursorMode !== 'default' ? '#FF4D00' : '#F0EDE6',
            borderRadius: '50%', pointerEvents: 'none', zIndex: 9999, transform: 'translate(-50%,-50%)',
            transition: 'width .3s cubic-bezier(.23,1,.32,1), height .3s cubic-bezier(.23,1,.32,1), background .3s',
            mixBlendMode: 'difference',
          }} />
          <div ref={ringRef} style={{
            position: 'fixed', width: cursorMode === 'hover' ? 72 : 40, height: cursorMode === 'hover' ? 72 : 40,
            border: '1px solid rgba(240,237,230,0.4)', borderRadius: '50%', pointerEvents: 'none', zIndex: 9998,
            transform: 'translate(-50%,-50%)', opacity: cursorMode !== 'default' ? 0 : 1,
            transition: 'width .35s cubic-bezier(.23,1,.32,1), height .35s cubic-bezier(.23,1,.32,1), opacity .3s',
          }} />
          <div ref={labelRef} style={{
            position: 'fixed', pointerEvents: 'none', zIndex: 9997, fontFamily: 'Space Mono, monospace', fontSize: 10,
            letterSpacing: '.14em', textTransform: 'uppercase', color: '#F0EDE6', whiteSpace: 'nowrap',
            opacity: cursorMode === 'hover' ? 1 : 0, transform: 'translate(-50%, 28px)', transition: 'opacity .2s',
          }}>Lihat</div>
        </>
      )}

      {/* WA FAB */}
      <a href={wa('Halo Iranza Live')} className="wa-fab-l" target="_blank" rel="noopener" data-cursor-cta="true" style={{
        position: 'fixed', bottom: 28, right: 28, zIndex: 800, width: 56, height: 56, borderRadius: '50%',
        background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        boxShadow: '0 8px 32px rgba(37,211,102,0.45)', transition: 'transform .2s, box-shadow .2s',
      }}>💬</a>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
        padding: scrolled ? '16px 48px' : '24px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(12,12,12,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(240,237,230,0.08)' : 'none',
        transition: 'padding .4s, background .4s, border-bottom .4s',
      }}>
        <img src="/logo_iranza_live.png" alt="Iranza Live" style={{ height: 36 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        <div className="nav-links-l" style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          {[['#services', 'Services'], ['#about', 'About'], ['#pricing', 'Pricing'], ['#testi', 'Reviews']].map(([href, label]) => (
            <a key={href} href={href} className="nav-link-l">{label}</a>
          ))}
          <a href={wa('Halo Iranza Live, mau booking')} className="nav-cta-pill-l" target="_blank" data-cursor-cta="true">Become a Client</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 48px 48px', position: 'relative', overflow: 'hidden', borderBottom: '1px solid rgba(240,237,230,0.08)' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: 'linear-gradient(rgba(240,237,230,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(240,237,230,0.08) 1px, transparent 1px)', backgroundSize: '80px 80px', WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)', maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)' }} />
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,77,0,.15) 0%, transparent 65%)', top: -120, right: -80, pointerEvents: 'none', animation: 'orbPulse 6s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,214,0,.07) 0%, transparent 70%)', bottom: 100, left: -60, pointerEvents: 'none', animation: 'orbPulse 6s ease-in-out infinite -3s' }} />
        <style>{`@keyframes orbPulse { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(1.08);opacity:.7;} }`}</style>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#FF4D00', marginBottom: 24 }}>
          <span className="live-dot-l" />
          Iranza Live &nbsp;—&nbsp; Jakarta, Indonesia &nbsp;—&nbsp; Est. 2025
        </div>

        <h1 className="hero-h1-l" style={{ position: 'relative', zIndex: 1, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(72px,12vw,160px)', lineHeight: 0.9, letterSpacing: '-0.03em', color: '#F0EDE6', marginBottom: 40 }}>
          {HERO_WORDS.map((w, i) => (
            <span key={i}>
              <span className="word-wrap-l">
                <span className="word-l" style={{
                  transform: visible.has('hero') ? 'translateY(0)' : 'translateY(110%)',
                  transitionDelay: `${0.2 + i * 0.12}s`,
                  color: w.orange ? '#FF4D00' : w.italic ? 'transparent' : '#F0EDE6',
                  fontStyle: w.italic ? 'italic' : 'normal',
                  WebkitTextStroke: w.italic ? '2px #F0EDE6' : 'none',
                }} data-reveal-id="hero" data-reveal-delay="0">{w.text}</span>
              </span>
              {w.br ? <br /> : i < HERO_WORDS.length - 1 && '\u00A0'}
            </span>
          ))}
        </h1>

        <div className="hero-bottom-l" style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32, alignItems: 'end', paddingTop: 40, borderTop: '1px solid rgba(240,237,230,0.08)' }}>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--muted)' }}>
            Jasa live streaming profesional untuk <strong style={{ color: '#F0EDE6', fontWeight: 400 }}>UMKM Indonesia</strong> di <strong style={{ color: '#F0EDE6', fontWeight: 400 }}>Shopee</strong> &amp; <strong style={{ color: '#F0EDE6', fontWeight: 400 }}>TikTok Shop</strong>. Host terlatih, studio siap, strategi terbukti.
          </p>
          <div style={{ display: 'flex', gap: 40 }}>
            {[['50', '+', '#FF4D00', 'Seller Aktif'], ['4.9', '★', '#FFD600', 'Rating'], ['2', 'H', '#FF4D00', 'Per Sesi']].map(([num, sup, color, label], i) => (
              <div key={i}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, color: '#F0EDE6', letterSpacing: '-0.02em' }}>{num}<span style={{ color }}>{sup}</span></div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 6 }}>{label}</div>
              </div>
            ))}
          </div>
          <div className="hero-cta-group-l" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14 }}>
            <a href={wa('Halo Iranza Live, saya mau booking live streaming')} className="btn-pri-l" target="_blank" data-cursor-cta="true">Mulai Sekarang <span>→</span></a>
            <a href="#pricing" className="btn-ghost-l">Lihat Harga <span>↓</span></a>
          </div>
        </div>
      </section>

      {/* MARQUEE 1 */}
      <div style={{ overflow: 'hidden', padding: '16px 0', borderBottom: '1px solid rgba(240,237,230,0.08)' }}>
        <div className="marquee-track-l">
          {[...MARQUEE_1, ...MARQUEE_1].map((m, i) => (
            <div key={i} className="marquee-item-l"><span style={{ color: '#FF4D00', fontSize: 20, lineHeight: 1 }}>●</span> {m}</div>
          ))}
        </div>
      </div>

      {/* SERVICES */}
      <section id="services" style={{ padding: '112px 48px', borderBottom: '1px solid rgba(240,237,230,0.08)', background: '#141414' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div className="s-header-l" data-reveal-id="svc-h" style={{ ...rv('svc-h'), display: 'grid', gridTemplateColumns: '200px 1fr', gap: 40, marginBottom: 80, alignItems: 'start' }}>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', paddingTop: 8 }}>01 — Our Services</span>
            <div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(36px,4.5vw,58px)', lineHeight: 1, letterSpacing: '-0.02em', color: '#F0EDE6' }}>
                Kami kelola <span style={{ fontStyle: 'italic', color: '#FF4D00' }}>semuanya</span> — kamu fokus produk.
              </h2>
              <p style={{ marginTop: 20, fontSize: 16, lineHeight: 1.8, color: 'var(--muted)', maxWidth: 500 }}>Sebagai tim yang berdedikasi, kami ciptakan pengalaman live streaming yang memorable, engaging, dan yang paling penting — menghasilkan penjualan.</p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(240,237,230,0.08)' }}>
            {SERVICES.map((sv, i) => (
              <div key={sv.num} className="service-item-l" data-service-item data-reveal-id={`svc-${i}`} style={{ ...rv(`svc-${i}`), borderBottom: '1px solid rgba(240,237,230,0.08)', overflow: 'hidden', position: 'relative' }}>
                <div className="service-bg-l" style={{ background: `linear-gradient(90deg, ${sv.bg} 0%, transparent 60%)` }} />
                <div className="service-head-l">
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: '.16em', color: 'var(--muted)' }}>{sv.num}</span>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(24px,3vw,38px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#F0EDE6' }}>{sv.name}</span>
                  <div className="service-arrow-l">→</div>
                </div>
                <div className="service-body-l">
                  <div />
                  <div>
                    <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--muted)' }}>{sv.desc}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                      {sv.tags.map(t => <span key={t} style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', border: '1px solid rgba(240,237,230,0.08)', padding: '5px 12px', borderRadius: 100, color: 'var(--muted)' }}>{t}</span>)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARQUEE 2 — orange */}
      <div style={{ overflow: 'hidden', padding: '16px 0', background: '#FF4D00' }}>
        <div className="marquee-track-l rev">
          {[...MARQUEE_2, ...MARQUEE_2].map((m, i) => (
            <div key={i} className="marquee-item-l" style={{ color: 'rgba(255,255,255,0.85)' }}><span style={{ color: 'white', fontSize: 20, lineHeight: 1 }}>★</span> {m}</div>
          ))}
        </div>
      </div>

      {/* ABOUT */}
      <section id="about" style={{ padding: '112px 48px', borderBottom: '1px solid rgba(240,237,230,0.08)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div className="s-header-l" data-reveal-id="about-h" style={{ ...rv('about-h'), display: 'grid', gridTemplateColumns: '200px 1fr', gap: 40, marginBottom: 80, alignItems: 'start' }}>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', paddingTop: 8 }}>02 — About Us</span>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(36px,4.5vw,58px)', lineHeight: 1, letterSpacing: '-0.02em', color: '#F0EDE6' }}>
              Kami ada untuk <span style={{ fontStyle: 'italic', color: '#FF4D00' }}>hasilkan penjualan</span>, bukan sekadar tampil.
            </h2>
          </div>

          <div className="about-grid-l" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
            <div data-reveal-id="about-1" style={rv('about-1')}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 'clamp(26px,3vw,40px)', lineHeight: 1.35, letterSpacing: '-0.02em', color: '#F0EDE6' }}>
                Toko kamu punya produk bagus.<br />
                Masalahnya, <span style={{ fontStyle: 'italic', color: '#FF4D00' }}>tidak ada yang tahu.</span><br /><br />
                Kami ubah itu.
              </p>
            </div>
            <div data-reveal-id="about-2" style={rv('about-2')}>
              <p style={{ fontSize: 16, lineHeight: 1.85, color: 'var(--muted)', marginBottom: 36 }}>
                Iranza Live adalah jasa live streaming profesional yang dirancang khusus untuk <strong style={{ color: 'rgba(240,237,230,0.85)', fontWeight: 400 }}>UMKM Indonesia</strong>. Kami menyediakan host terlatih, studio lengkap, dan strategi penjualan berbasis data yang terbukti meningkatkan konversi — di <strong style={{ color: 'rgba(240,237,230,0.85)', fontWeight: 400 }}>Shopee Live</strong> maupun <strong style={{ color: 'rgba(240,237,230,0.85)', fontWeight: 400 }}>TikTok Shop</strong>.
                <br /><br />
                Kamu fokus di produk dan operasional toko. Kami urus semuanya di depan kamera — dari persiapan, eksekusi live, sampai laporan hasil sesi yang kamu terima setiap selesai.
              </p>
              <a href={wa('Halo Iranza Live, mau konsultasi')} className="btn-pri-l" target="_blank" data-cursor-cta="true" style={{ fontSize: 14, padding: '14px 28px' }}>Konsultasi Gratis →</a>
            </div>
          </div>

          <div className="stats-grid-l" data-reveal-id="about-stats" style={{ ...rv('about-stats'), display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid rgba(240,237,230,0.08)', marginTop: 80 }}>
            {[
              { num: <>{c50}<span style={{ color: '#FF4D00' }}>+</span></>, desc: 'Seller aktif yang sudah percayakan live streaming tokonya ke kami' },
              { num: c4, desc: 'Slot live tersedia setiap hari — pagi, siang, sore, dan malam' },
              { num: <>{c2}<span style={{ color: 'var(--muted)', fontSize: '0.55em', letterSpacing: '-.01em' }}>H</span></>, desc: 'Durasi setiap sesi live — cukup untuk dorong awareness dan konversi' },
              { num: <>4.9<span style={{ color: '#FFD600' }}>★</span></>, desc: 'Rating rata-rata kepuasan seller yang sudah pakai layanan kami' },
            ].map((st, i) => (
              <div key={i} className="stat-cell-l" style={{ padding: '44px 40px', borderRight: i % 2 === 0 ? '1px solid rgba(240,237,230,0.08)' : 'none', borderBottom: i < 2 ? '1px solid rgba(240,237,230,0.08)' : 'none', transition: 'background .3s' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(48px,6vw,80px)', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', color: '#F0EDE6', marginBottom: 12 }}>{st.num}</div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted)' }}>{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '112px 48px', borderBottom: '1px solid rgba(240,237,230,0.08)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div className="s-header-l" data-reveal-id="price-h" style={{ ...rv('price-h'), display: 'grid', gridTemplateColumns: '200px 1fr', gap: 40, marginBottom: 80, alignItems: 'start' }}>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', paddingTop: 8 }}>03 — Pricing</span>
            <div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(36px,4.5vw,58px)', lineHeight: 1, letterSpacing: '-0.02em', color: '#F0EDE6' }}>
                Promo Launching. <span style={{ fontStyle: 'italic', color: '#FF4D00' }}>Terbatas.</span>
              </h2>
              <p style={{ marginTop: 20, fontSize: 16, lineHeight: 1.8, color: 'var(--muted)', maxWidth: 500 }}>Harga ini tidak akan berlaku selamanya. 4 slot per hari, first come first served.</p>
            </div>
          </div>

          {[
            { icon: '☀️', label: 'Slot Pagi & Siang', time: s.slot_pagi_times, rows: [
              { icon: '🛒', name: 'Live Shopee', desc: 'Per sesi · 2 jam · 1 host', badge: 'Pagi', price: s.prices.pagi_shopee },
              { icon: '🎵', name: 'Live TikTok Shop', desc: 'Per sesi · 2 jam · 1 host', badge: 'Pagi', price: s.prices.pagi_tiktok },
              { icon: '🔥', name: 'Dual Platform', desc: 'Shopee + TikTok · 2 jam · cover keduanya', badge: 'Best Value', price: s.prices.pagi_dual, featured: true },
            ]},
            { icon: '🌙', label: 'Slot Sore & Malam', time: s.slot_malam_times, rows: [
              { icon: '🛒', name: 'Live Shopee', desc: 'Per sesi · 2 jam · prime time', badge: 'Malam', price: s.prices.malam_shopee },
              { icon: '🎵', name: 'Live TikTok Shop', desc: 'Per sesi · 2 jam · prime time', badge: 'Malam', price: s.prices.malam_tiktok },
              { icon: '🔥', name: 'Dual Platform', desc: 'Shopee + TikTok · 2 jam · prime time', badge: 'Best Value', price: s.prices.malam_dual, featured: true },
            ]},
          ].map((slot, si) => (
            <div key={si} data-reveal-id={`slot-${si}`} style={{ ...rv(`slot-${si}`), marginBottom: 56 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '22px 0', borderTop: '1px solid rgba(240,237,230,0.08)' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: '#F0EDE6', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 14 }}>
                  {slot.icon}&nbsp; {slot.label}
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: '.12em', color: 'var(--muted)', fontWeight: 400 }}>{slot.time}</span>
                </div>
              </div>
              <div style={{ borderBottom: '1px solid rgba(240,237,230,0.08)' }}>
                {slot.rows.map((row, ri) => (
                  <div key={ri} className={`price-row-l${row.featured ? ' featured' : ''}`} style={{ display: 'grid', gridTemplateColumns: '52px 1fr 120px 100px', alignItems: 'center', gap: 24, padding: '22px 0', borderTop: '1px solid rgba(240,237,230,0.05)', position: 'relative' }}>
                    <div className="price-row-bg-l" />
                    <div style={{ width: 44, height: 44, border: '1px solid rgba(240,237,230,0.08)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, position: 'relative', zIndex: 1 }}>{row.icon}</div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 600, color: '#F0EDE6', letterSpacing: '-0.01em' }}>{row.name}</div>
                      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 3 }}>{row.desc}</div>
                    </div>
                    <span className="pr-badge-l" style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#FF4D00', border: '1px solid rgba(255,77,0,0.35)', padding: '5px 10px', borderRadius: 2, justifySelf: 'start', position: 'relative', zIndex: 1 }}>{row.badge}</span>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#F0EDE6', letterSpacing: '-0.02em', textAlign: 'right', whiteSpace: 'nowrap', position: 'relative', zIndex: 1 }}>
                      {row.price}<span style={{ fontSize: 13, fontWeight: 400, fontFamily: 'Space Mono, monospace', color: 'var(--muted)', marginLeft: 2, letterSpacing: '.06em' }}>rb</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="pricing-cta-block-l" data-reveal-id="price-cta" style={{ ...rv('price-cta'), display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 32, background: '#FF4D00', padding: '32px 44px', borderRadius: 2 }}>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: 'white', letterSpacing: '-0.01em' }}>⚡ Terbatas 4 Slot Per Hari</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Harga promo launching — book sekarang sebelum slot penuh.</div>
            </div>
            <a href={wa('Halo Iranza Live, mau book slot promo!')} target="_blank" data-cursor-cta="true" style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', background: 'white', color: '#FF4D00', padding: '16px 32px', borderRadius: 2, whiteSpace: 'nowrap', display: 'inline-block', transition: 'transform .2s, box-shadow .2s' }}>Book via WhatsApp →</a>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testi" style={{ padding: '112px 48px', borderBottom: '1px solid rgba(240,237,230,0.08)', background: '#141414' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div className="s-header-l" data-reveal-id="testi-h" style={{ ...rv('testi-h'), display: 'grid', gridTemplateColumns: '200px 1fr', gap: 40, marginBottom: 80, alignItems: 'start' }}>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', paddingTop: 8 }}>04 — Reviews</span>
            <div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(36px,4.5vw,58px)', lineHeight: 1, letterSpacing: '-0.02em', color: '#F0EDE6' }}>
                Dari seller yang sudah <span style={{ fontStyle: 'italic', color: '#FF4D00' }}>buktikan sendiri.</span>
              </h2>
              <p style={{ marginTop: 20, fontSize: 16, lineHeight: 1.8, color: 'var(--muted)', maxWidth: 500 }}>Kami supply layanan live streaming ke seller di seluruh Indonesia dengan hasil yang terukur.</p>
            </div>
          </div>

          <div data-reveal-id="testi-track" style={{ ...rv('testi-track'), overflow: 'hidden', position: 'relative', margin: '0 -48px', padding: '0 48px' }}>
            <div ref={trackRef} className="testi-track-l" onMouseDown={onTrackDown} onMouseUp={onTrackUp} onMouseLeave={onTrackUp} onMouseMove={onTrackMove}
              style={{ display: 'flex', gap: 20, overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '4px 48px 20px', margin: '0 -48px', cursor: isDesktop ? (draggingRef.current ? 'grabbing' : 'grab') : 'auto' }}>
              {s.testimonials.map((t, i) => (
                <div key={i} className="testi-card-l" style={{ minWidth: 400, maxWidth: 400, background: '#0C0C0C', border: '1px solid rgba(240,237,230,0.08)', borderRadius: 2, padding: '36px 32px', scrollSnapAlign: 'start', flexShrink: 0, transition: 'border-color .3s, transform .3s' }}>
                  <div style={{ color: '#FFD600', fontSize: 13, letterSpacing: 3, marginBottom: 20 }}>★★★★★</div>
                  <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(240,237,230,0.6)', fontStyle: 'italic', marginBottom: 28 }}>"{t.text}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#0C0C0C', border: '1px solid rgba(240,237,230,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>{t.icon}</div>
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#F0EDE6' }}>{t.name}</div>
                      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 3 }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 32 }}>
              <button className="testi-btn-l" onClick={() => scrollTesti(-1)} aria-label="Previous" style={{ width: 44, height: 44, border: '1px solid rgba(240,237,230,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--muted)', transition: 'border-color .2s, color .2s, background .2s' }}>←</button>
              <button className="testi-btn-l" onClick={() => scrollTesti(1)} aria-label="Next" style={{ width: 44, height: 44, border: '1px solid rgba(240,237,230,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--muted)', transition: 'border-color .2s, color .2s, background .2s' }}>→</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#F0EDE6', padding: '120px 48px', position: 'relative', overflow: 'hidden' }}>
        <div className="cta-bg-text-l" style={{ position: 'absolute', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(100px,16vw,220px)', letterSpacing: '-0.04em', color: 'rgba(0,0,0,0.04)', whiteSpace: 'nowrap', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', userSelect: 'none', lineHeight: 1 }}>LIVE LIVE LIVE</div>
        <div className="cta-inner-l" data-reveal-id="cta" style={{ ...rv('cta'), maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto', gap: 80, alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(38px,5.5vw,72px)', lineHeight: 1, letterSpacing: '-0.03em', color: '#0C0C0C' }}>
              Toko kamu bisa<br />lebih <span style={{ fontStyle: 'italic', color: '#FF4D00' }}>ramai dari ini.</span>
            </h2>
            <p style={{ marginTop: 20, fontSize: 17, lineHeight: 1.75, color: 'rgba(12,12,12,0.45)', maxWidth: 480 }}>Satu sesi live bisa mengubah hari yang sepi jadi hari yang ramai. Slot terbatas — book sekarang dan rasakan sendiri perbedaannya.</p>
          </div>
          <div className="cta-right-l" style={{ textAlign: 'center', flexShrink: 0 }}>
            <a href={`tel:+${s.whatsapp_number}`} style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(18px,2.2vw,26px)', fontWeight: 800, letterSpacing: '-0.01em', color: '#0C0C0C', display: 'block', marginBottom: 18 }}>📞 {phone}</a>
            <a href={wa('Halo Iranza Live, saya mau booking live streaming')} target="_blank" data-cursor-cta="true" style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', background: '#0C0C0C', color: '#F0EDE6', padding: '16px 32px', borderRadius: 2, display: 'inline-flex', alignItems: 'center', gap: 10, transition: 'background .2s, transform .2s' }}>Chat WhatsApp Sekarang →</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0C0C0C', padding: '0 48px', borderTop: '1px solid rgba(240,237,230,0.08)' }}>
        <div className="footer-top-l" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40, padding: '56px 0', borderBottom: '1px solid rgba(240,237,230,0.08)' }}>
          <div>
            <img src="/logo_iranza_live.png" alt="Iranza Live" style={{ height: 34, marginBottom: 20 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted)', maxWidth: 260 }}>Jasa live streaming profesional untuk UMKM Indonesia. Shopee &amp; TikTok Shop.</p>
          </div>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 20 }}>Layanan</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['#services', 'Shopee Live'], ['#services', 'TikTok Shop Live'], ['#services', 'Dual Platform'], ['#pricing', 'Harga']].map(([href, label]) => (
                <a key={label} href={href} className="footer-link-l" style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 600, color: '#F0EDE6', display: 'flex', alignItems: 'center', gap: 6, transition: 'color .2s' }}>{label} <span className="arr-l" style={{ fontSize: 12, transition: 'transform .2s' }}>↗</span></a>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 20 }}>Kontak</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href={wa('Halo Iranza Live')} target="_blank" className="footer-link-l" style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 600, color: '#F0EDE6', display: 'flex', alignItems: 'center', gap: 6, transition: 'color .2s' }}>WhatsApp <span className="arr-l" style={{ fontSize: 12, transition: 'transform .2s' }}>↗</span></a>
              <a href="#testi" className="footer-link-l" style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 600, color: '#F0EDE6', display: 'flex', alignItems: 'center', gap: 6, transition: 'color .2s' }}>Reviews <span className="arr-l" style={{ fontSize: 12, transition: 'transform .2s' }}>↗</span></a>
              <a href="#about" className="footer-link-l" style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 600, color: '#F0EDE6', display: 'flex', alignItems: 'center', gap: 6, transition: 'color .2s' }}>About Us <span className="arr-l" style={{ fontSize: 12, transition: 'transform .2s' }}>↗</span></a>
            </div>
          </div>
        </div>
        <div className="footer-bottom-l" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 0', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>© 2025 Iranza Live. All rights reserved.</span>
          <a href={wa('Halo Iranza Live')} target="_blank" style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: '#25D366', display: 'flex', alignItems: 'center', gap: 8, transition: 'color .2s' }}>💚 {phone}</a>
        </div>
        <Link to="/login" style={{ position: 'fixed', bottom: 8, left: 8, fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(240,237,230,0.15)', textTransform: 'uppercase', letterSpacing: '.1em', zIndex: 50 }}>Admin</Link>
      </footer>
    </div>
  )
}
