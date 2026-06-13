import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

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
  testimonials?: { icon: string; name: string; role: string; text: string }[]
}

const DEFAULT: LandingSettings = {
  tagline: 'Jualan Makin Laris Lewat Live Streaming',
  subtagline: 'Jasa live streaming profesional untuk UMKM di Shopee & TikTok Shop. Host berpengalaman, kualitas HD, strategi penjualan yang terbukti naik konversi.',
  whatsapp_number: '6285776077292',
  hero_stats: [
    { value: '50+', label: 'Seller Aktif' },
    { value: '4', label: 'Slot Per Hari' },
    { value: '2H', label: 'Per Sesi' },
    { value: '4.9★', label: 'Rating' },
  ],
  slot_pagi_times: '05.00–09.00 & 11.00–14.00 WIB',
  slot_malam_times: '16.00–18.00 & 20.00–02.00 WIB',
  promo_label: 'PROMO LAUNCHING — TERBATAS 4 SLOT/HARI!',
  prices: {
    pagi_shopee: '60RB', pagi_tiktok: '60RB', pagi_dual: '80RB',
    malam_shopee: '90RB', malam_tiktok: '90RB', malam_dual: '150RB',
  },
  features: [
    { icon: '🎙️', title: 'Host Berpengalaman', desc: 'Terlatih dalam teknik closing, upsell, dan interaksi audience yang meningkatkan konversi.' },
    { icon: '📹', title: 'Kualitas Video HD', desc: 'Audio jernih, lighting profesional. Tampilan live yang membuat produk kamu makin menarik.' },
    { icon: '📊', title: 'Strategi Penjualan', desc: 'Script closing, optimasi produk highlight, dan teknik flash sale yang terbukti efektif.' },
    { icon: '🔒', title: 'Aman & Terpercaya', desc: 'Profesional, tepat waktu, dan hasil memuaskan. Reputasi toko kamu adalah prioritas kami.' },
  ],
  cta_title: 'Siap Bikin Toko Kamu Live & Cuan Optimal?',
  cta_sub: 'Hubungi kami sekarang — konsultasi gratis, tanpa ribet. Slot terbatas, jangan sampai penuh!',
  testimonials: [
    { icon: '🧕', name: 'Sari Dewi', role: 'Toko Fashion Hijab • Shopee', text: 'Sejak pakai Iranza Live, penjualan toko Shopee aku naik 3x lipat! Host-nya aktif banget engage sama penonton, produk cepet abis.' },
    { icon: '👨', name: 'Budi Santoso', role: 'Toko Elektronik • TikTok Shop', text: 'Awalnya ragu karena harga murah, tapi ternyata kualitasnya pro banget. Audio bagus, host ramah, dan yang penting orderan masuk terus!' },
    { icon: '👩', name: 'Rina Marlina', role: 'Toko Skincare • Dual Platform', text: 'Dual platform Shopee + TikTok barengan dengan harga segitu? Worth it banget! Viewers dari TikTok juga banyak yang pindah beli di Shopee.' },
  ],
}

const CHATS = [
  { color: '#FF6B00', avatar: '🧑', user: 'user123', msg: 'beli 2pcs!' },
  { color: '#7C3AED', avatar: '👩', user: 'siti_shop', msg: 'ada size XL?' },
  { color: '#10B981', avatar: '🧕', user: 'ani99', msg: '💝 kirim gift!' },
  { color: '#F59E0B', avatar: '👨', user: 'budi_jkt', msg: 'mau order dong' },
]

const TICKER_ITEMS = [
  { num: '50+', label: 'Seller Aktif' }, { num: '4', label: 'Slot/Hari' },
  { num: '2 Jam', label: 'Per Sesi' }, { icon: '🎯', label: 'Host Profesional' },
  { num: 'HD', label: 'Kualitas Video' }, { icon: '📦', label: 'Shopee + TikTok' },
  { num: '4.9★', label: 'Rating Kepuasan' }, { icon: '⚡', label: 'Promo Launching!' },
]

export default function LandingPage() {
  const [s, setS] = useState<LandingSettings>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [visibleChats, setVisibleChats] = useState<number[]>([])
  const chatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    supabase.from('landing_settings').select('*').eq('id', 1).maybeSingle()
      .then(({ data }) => {
        if (data?.settings) setS({ ...DEFAULT, ...data.settings })
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Animate chats sequentially
  useEffect(() => {
    let idx = 0
    const runCycle = () => {
      setVisibleChats([])
      const showNext = () => {
        if (idx < CHATS.length) {
          setVisibleChats(prev => [...prev, idx])
          idx++
          chatTimerRef.current = setTimeout(showNext, 800)
        } else {
          chatTimerRef.current = setTimeout(() => { idx = 0; runCycle() }, 3000)
        }
      }
      chatTimerRef.current = setTimeout(showNext, 600)
    }
    const start = setTimeout(runCycle, 1200)
    return () => {
      clearTimeout(start)
      if (chatTimerRef.current) clearTimeout(chatTimerRef.current)
    }
  }, [])

  const wa = (msg: string) => `https://wa.me/${s.whatsapp_number}?text=${encodeURIComponent(msg)}`
  const phone = s.whatsapp_number.replace('62', '0').replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3')

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFBF5' }}>
      <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 28, color: '#FF6B00' }}>Iranza Live</div>
    </div>
  )

  const G = 'linear-gradient(135deg,#FFB800 0%,#FF6B00 55%,#FF3D7A 100%)'
  const GText: React.CSSProperties = { background: G, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#fff', color: '#111827', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600&display=swap');
        html { scroll-behavior: smooth; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .lp-btn-primary { display:inline-flex;align-items:center;gap:8px;padding:14px 32px;border-radius:50px;font-family:'Poppins',sans-serif;font-weight:700;font-size:15px;text-decoration:none;cursor:pointer;border:none;background:${G};color:white;box-shadow:0 4px 20px rgba(255,107,0,0.3);transition:transform .2s,box-shadow .2s; }
        .lp-btn-primary:hover { transform:translateY(-2px);box-shadow:0 8px 32px rgba(255,107,0,0.45); }
        .lp-btn-ghost { display:inline-flex;align-items:center;gap:8px;padding:13px 28px;border-radius:50px;font-family:'Poppins',sans-serif;font-weight:700;font-size:15px;text-decoration:none;background:transparent;color:#FF6B00;border:2px solid #FF6B00;transition:background .2s; }
        .lp-btn-ghost:hover { background:#FFF3E6; }
        .lp-btn-white { display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:50px;font-family:'Poppins',sans-serif;font-weight:700;font-size:15px;text-decoration:none;background:white;color:#FF6B00;box-shadow:0 2px 16px rgba(0,0,0,.1);transition:box-shadow .2s,transform .2s; }
        .lp-btn-white:hover { transform:translateY(-2px);box-shadow:0 6px 28px rgba(0,0,0,.15); }
        .lp-card-hover { transition:transform .3s,box-shadow .3s; }
        .lp-card-hover:hover { transform:translateY(-6px); }
        .lp-feat-card { display:flex;gap:18px;align-items:flex-start;background:#F9FAFB;border-radius:20px;padding:26px 22px;border:1.5px solid transparent;transition:border-color .3s,box-shadow .3s,transform .3s; }
        .lp-feat-card:hover { border-color:#FED7AA;box-shadow:0 8px 32px rgba(255,107,0,.08);transform:translateY(-3px); }
        .lp-price-row { display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-radius:16px;background:#F9FAFB;border:1.5px solid #F3F4F6;transition:border-color .2s; }
        .lp-price-row:hover { border-color:#FDBA74; }
        .lp-price-row.featured { background:linear-gradient(135deg,#FFF3E6,#FFE8D0);border-color:#FED7AA; }
        .lp-testi-card { background:#F9FAFB;border-radius:24px;padding:28px;border:1.5px solid #F3F4F6;transition:transform .3s,box-shadow .3s; }
        .lp-testi-card:hover { transform:translateY(-4px);box-shadow:0 8px 32px rgba(0,0,0,.08); }
        .wa-fab { position:fixed;bottom:28px;right:28px;z-index:500;width:62px;height:62px;border-radius:50%;background:#25D366;text-decoration:none;display:flex;align-items:center;justify-content:center;font-size:28px;box-shadow:0 8px 32px rgba(37,211,102,.5);transition:transform .2s; }
        .wa-fab:hover { transform:scale(1.1); }
        .phone-float { animation:phoneFloat 4s ease-in-out infinite; }
        @keyframes phoneFloat { 0%,100% { transform:translateY(0) rotate(-2deg); } 50% { transform:translateY(-12px) rotate(-2deg); } }
        .badge-float { animation:badgeFloat 3s ease-in-out infinite; }
        @keyframes badgeFloat { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
        .fc1 { animation:fc1 3.5s ease-in-out infinite; }
        .fc2 { animation:fc2 4s ease-in-out infinite .5s; }
        .fc3 { animation:fc1 3s ease-in-out infinite 1s; }
        @keyframes fc1 { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
        @keyframes fc2 { 0%,100% { transform:translateY(0); } 50% { transform:translateY(8px); } }
        .live-dot { width:8px;height:8px;border-radius:50%;background:#EF4444;animation:livePulse 1.2s ease-in-out infinite; }
        @keyframes livePulse { 0%,100% { box-shadow:0 0 0 0 rgba(239,68,68,.6); } 50% { box-shadow:0 0 0 6px rgba(239,68,68,0); } }
        .ticker-track { display:flex;animation:ticker 22s linear infinite;white-space:nowrap; }
        @keyframes ticker { from { transform:translateX(0); } to { transform:translateX(-50%); } }
        .step-card { background:white;border-radius:20px;padding:28px 22px;text-align:center;box-shadow:0 2px 16px rgba(0,0,0,.06);transition:transform .3s,box-shadow .3s; }
        .step-card:hover { transform:translateY(-4px);box-shadow:0 8px 32px rgba(0,0,0,.1); }
        .chat-in { animation:chatIn .4s ease forwards; }
        @keyframes chatIn { from { opacity:0;transform:translateY(8px); } to { opacity:1;transform:translateY(0); } }
        @media(max-width:768px){
          .lp-hero-grid { grid-template-columns:1fr!important; }
          .lp-hero-right { order:-1; }
          .lp-float-cards { display:none!important; }
          .lp-plat-grid,.lp-price-grid,.lp-feat-split { grid-template-columns:1fr!important; }
          .lp-testi-grid { grid-template-columns:1fr!important; }
          .lp-steps { grid-template-columns:repeat(2,1fr)!important; }
          .lp-steps::before { display:none!important; }
          .lp-section { padding:60px 20px!important; }
          .lp-nav { padding:12px 20px!important; }
          .lp-nav-links a:not(.lp-btn-primary) { display:none!important; }
          .lp-hero { padding:90px 20px 60px!important; }
          .lp-cta-section { padding:72px 20px!important; }
          .lp-promo-callout { flex-direction:column!important;text-align:center!important; }
          footer { flex-direction:column!important;align-items:center!important;text-align:center!important;padding:28px 20px!important; }
        }
        @media(max-width:480px){
          .lp-steps { grid-template-columns:1fr!important; }
          .lp-feat-grid { grid-template-columns:1fr!important; }
        }
      `}</style>

      {/* WA FAB */}
      <a href={wa('Halo Iranza Live, saya ingin info lebih lanjut')} className="wa-fab" target="_blank" rel="noopener">💬</a>

      {/* NAV */}
      <nav className="lp-nav" style={{ position:'fixed',top:0,left:0,right:0,zIndex:200,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 48px',background:'rgba(255,255,255,0.92)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(0,0,0,.06)',transition:'box-shadow .3s',boxShadow:scrolled?'0 2px 20px rgba(0,0,0,.08)':'none' }}>
        <img src="/logo_iranza_live.png" alt="Iranza Live" style={{ height:40 }} onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
        <div className="lp-nav-links" style={{ display:'flex',alignItems:'center',gap:8 }}>
          {[['#platform','Platform'],['#cara-kerja','Cara Kerja'],['#harga','Harga']].map(([href,label]) => (
            <a key={href} href={href} style={{ color:'#6B7280',fontSize:14,fontWeight:500,textDecoration:'none',padding:'8px 14px',borderRadius:8,transition:'color .2s' }}
              onMouseEnter={e => (e.currentTarget.style.color='#FF6B00')}
              onMouseLeave={e => (e.currentTarget.style.color='#6B7280')}
            >{label}</a>
          ))}
          <a href={wa('Halo Iranza Live, mau tanya dulu')} className="lp-btn-ghost" target="_blank" style={{ padding:'8px 18px',fontSize:13 }}>Tanya Dulu</a>
          <a href={wa('Halo Iranza Live, mau booking sekarang')} className="lp-btn-primary" target="_blank" style={{ padding:'10px 22px',fontSize:13 }}>⚡ Book Sekarang</a>
          <Link to="/login" style={{ color:'rgba(0,0,0,.25)',fontSize:12,textDecoration:'none',marginLeft:4 }}>Admin →</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero" style={{ minHeight:'100vh',background:'#FFFBF5',position:'relative',overflow:'hidden',display:'flex',alignItems:'center',padding:'110px 48px 80px' }}>
        {/* Blobs */}
        <div style={{ position:'absolute',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,184,0,.18) 0%,transparent 70%)',top:-100,right:-80,pointerEvents:'none' }} />
        <div style={{ position:'absolute',width:350,height:350,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,61,122,.1) 0%,transparent 70%)',bottom:0,left:'20%',pointerEvents:'none' }} />

        <div className="lp-hero-grid" style={{ maxWidth:1200,margin:'0 auto',width:'100%',display:'grid',gridTemplateColumns:'1fr 1fr',gap:60,alignItems:'center',position:'relative',zIndex:1 }}>
          {/* LEFT */}
          <div>
            <div className="badge-float" style={{ display:'inline-flex',alignItems:'center',gap:8,background:'white',borderRadius:50,padding:'8px 18px',fontSize:13,fontWeight:700,color:'#FF6B00',boxShadow:'0 2px 12px rgba(255,107,0,.15)',marginBottom:24 }}>
              <span className="live-dot" /><span>🔴 LIVE PROFESIONAL · HASIL MAKSIMAL</span>
            </div>
            <h1 style={{ fontFamily:'Poppins,sans-serif',fontWeight:900,fontSize:'clamp(34px,4.5vw,56px)',lineHeight:1.1,color:'#111827',marginBottom:20 }}>
              {s.tagline.includes('Streaming') ? (
                <>Jualan Makin Laris<br /><span style={GText}>Lewat Live Streaming</span></>
              ) : (
                <span style={GText}>{s.tagline}</span>
              )}
            </h1>
            <p style={{ fontSize:17,lineHeight:1.7,color:'#6B7280',marginBottom:36,maxWidth:480 }}>{s.subtagline}</p>
            <div style={{ display:'flex',gap:12,flexWrap:'wrap',marginBottom:40 }}>
              <a href={wa('Halo Iranza Live, mau booking live streaming')} className="lp-btn-primary" target="_blank">⚡ Booking Sekarang</a>
              <a href="#harga" className="lp-btn-ghost">Lihat Harga</a>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:12,fontSize:13,color:'#6B7280',fontWeight:500 }}>
              <div style={{ display:'flex' }}>
                {['🧕','👩','👨','🧑','👩'].map((em,i) => (
                  <span key={i} style={{ width:32,height:32,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,border:'2px solid white',marginLeft:i===0?0:-8,background:'linear-gradient(135deg,#FFF3D6,#FFE4CC)',flexShrink:0 }}>{em}</span>
                ))}
              </div>
              <span><strong style={{ color:'#111827' }}>50+ seller</strong> sudah dipercayakan ke kami</span>
            </div>
          </div>

          {/* RIGHT — Phone Mockup */}
          <div className="lp-hero-right" style={{ display:'flex',justifyContent:'center',alignItems:'center',position:'relative' }}>
            <div className="phone-float" style={{ width:256,background:'#111',borderRadius:40,padding:12,boxShadow:'0 30px 80px rgba(0,0,0,.25),0 0 0 1px rgba(255,255,255,.05)',position:'relative',zIndex:2 }}>
              <div style={{ background:'linear-gradient(160deg,#1a1a2e,#16213e)',borderRadius:32,overflow:'hidden',aspectRatio:'9/16',display:'flex',flexDirection:'column' }}>
                {/* Screen Top */}
                <div style={{ background:G,padding:16,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <span style={{ background:'#EF4444',color:'white',fontSize:10,fontWeight:800,letterSpacing:1,padding:'3px 8px',borderRadius:50,display:'inline-flex',alignItems:'center',gap:4 }}>
                      <span style={{ width:5,height:5,background:'white',borderRadius:'50%',display:'inline-block' }} /> LIVE
                    </span>
                    <span style={{ color:'rgba(255,255,255,.9)',fontSize:11,fontWeight:700 }}>@tokoku_official</span>
                  </div>
                  <span style={{ color:'rgba(255,255,255,.9)',fontSize:11,fontWeight:600 }}>👁️ 1.2K</span>
                </div>
                {/* Feed */}
                <div style={{ flex:1,padding:'12px',display:'flex',flexDirection:'column',gap:6,overflow:'hidden' }}>
                  {/* Product card */}
                  <div style={{ background:'rgba(255,255,255,.06)',borderRadius:10,padding:10,display:'flex',alignItems:'center',gap:8 }}>
                    <div style={{ width:40,height:40,borderRadius:8,background:G,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>👕</div>
                    <div>
                      <div style={{ color:'white',fontSize:11,fontWeight:700 }}>Kaos Premium Polos</div>
                      <div style={{ color:'#FFB800',fontSize:12,fontWeight:800 }}>Rp 89.000</div>
                    </div>
                  </div>
                  {/* Chats */}
                  <div style={{ display:'flex',flexDirection:'column',gap:5,marginTop:4 }}>
                    {CHATS.map((c, i) => (
                      <div key={i} className={visibleChats.includes(i) ? 'chat-in' : ''} style={{ display:'flex',alignItems:'center',gap:6,opacity:visibleChats.includes(i)?1:0 }}>
                        <div style={{ width:22,height:22,borderRadius:'50%',background:c.color,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12 }}>{c.avatar}</div>
                        <span style={{ fontSize:10,color:'rgba(255,255,255,.7)' }}><strong style={{ color:'white' }}>{c.user}</strong> {c.msg}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Bottom */}
                <div style={{ padding:'10px 12px',background:'rgba(0,0,0,.3)',display:'flex',gap:6,alignItems:'center' }}>
                  <div style={{ flex:1,background:'rgba(255,255,255,.1)',borderRadius:50,padding:'6px 12px',fontSize:10,color:'rgba(255,255,255,.5)' }}>Tulis komentar...</div>
                  <div style={{ width:28,height:28,borderRadius:'50%',background:G,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12 }}>➤</div>
                </div>
              </div>
            </div>

            {/* Float Cards */}
            <div className="lp-float-cards">
              {[
                { cls:'fc1', style:{ top:'15%',left:-65 }, icon:'🛒', label:'Penjualan Hari Ini', value:'+Rp 2.4jt', valueColor:'#10B981' },
                { cls:'fc2', style:{ bottom:'20%',right:-60 }, icon:'👁️', label:'Peak Viewers', value:'1.847', valueColor:'#FF6B00' },
                { cls:'fc3', style:{ top:'55%',left:-55 }, icon:'⭐', label:'Rating Kepuasan', value:'4.9 / 5', valueColor:'#111827' },
              ].map((fc, i) => (
                <div key={i} className={fc.cls} style={{ position:'absolute',background:'white',borderRadius:16,padding:'12px 16px',boxShadow:'0 8px 32px rgba(0,0,0,.12)',zIndex:3, ...fc.style }}>
                  <div style={{ fontSize:20,marginBottom:4 }}>{fc.icon}</div>
                  <div style={{ fontSize:10,color:'#6B7280',fontWeight:600,marginBottom:2 }}>{fc.label}</div>
                  <div style={{ fontFamily:'Poppins,sans-serif',fontWeight:900,fontSize:18,color:fc.valueColor }}>{fc.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div style={{ position:'absolute',bottom:-2,left:0,right:0,lineHeight:0 }}>
          <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ width:'100%' }}>
            <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="#FF6B00" opacity="0.07"/>
            <path d="M0,55 C360,15 720,80 1080,45 C1260,28 1380,60 1440,55 L1440,80 L0,80 Z" fill="#FFB800" opacity="0.05"/>
          </svg>
        </div>
      </section>

      {/* STATS TICKER */}
      <div style={{ background:G,padding:'18px 0',overflow:'hidden' }}>
        <div className="ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <div key={i} style={{ display:'inline-flex',alignItems:'center',gap:10,padding:'0 36px',color:'white',fontFamily:'Poppins,sans-serif',fontWeight:700,fontSize:15,borderRight:'1px solid rgba(255,255,255,.25)',flexShrink:0 }}>
              {item.num ? <span style={{ fontSize:22 }}>{item.num}</span> : <span>{item.icon}</span>}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* PLATFORMS */}
      <section id="platform" className="lp-section" style={{ padding:'96px 48px',background:'white' }}>
        <div style={{ maxWidth:1200,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:52 }}>
            <span style={{ display:'inline-flex',alignItems:'center',gap:8,fontSize:12,fontWeight:700,letterSpacing:2.5,textTransform:'uppercase',color:'#FF6B00',marginBottom:12 }}>
              <span style={{ width:24,height:3,background:G,borderRadius:2,display:'inline-block' }} />Platform
            </span>
            <h2 style={{ fontFamily:'Poppins,sans-serif',fontWeight:800,fontSize:'clamp(26px,3.5vw,42px)',lineHeight:1.15,color:'#111827' }}>Tersedia di Dua Platform<br/>Terbesar Indonesia</h2>
          </div>
          <div className="lp-plat-grid" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:24 }}>
            {[
              { cls:'shopee', icon:'🛒', bg:'linear-gradient(135deg,#FFF7ED,#FFEDD5)', border:'#FED7AA', iconBg:'linear-gradient(135deg,#FF6B00,#FF9A00)', title:'Shopee Live', desc:'Jangkau jutaan pembeli aktif Shopee. Kami optimalkan voucher, flash sale, dan interaksi real-time untuk dorong konversi produk kamu.', tags:['Flash Sale','Voucher Live','Product Pin','Q&A Session'], tagColor:'rgba(255,107,0,.12)', tagText:'#FF6B00' },
              { cls:'tiktok', icon:'🎵', bg:'linear-gradient(135deg,#F5F3FF,#EDE9FE)', border:'#C4B5FD', iconBg:'linear-gradient(135deg,#7C3AED,#EC4899)', title:'TikTok Shop Live', desc:'Manfaatkan algoritma viral TikTok untuk traffic organik. Konten live yang engaging + strategi closing yang terbukti naik penjualan.', tags:['For You Page','Gift Storm','Product Showcase','Duet Live'], tagColor:'rgba(124,58,237,.12)', tagText:'#7C3AED' },
            ].map((p, i) => (
              <div key={i} className="lp-card-hover" style={{ borderRadius:24,padding:'40px 36px',background:p.bg,border:`1.5px solid ${p.border}`,position:'relative',overflow:'hidden' }}>
                <div style={{ width:64,height:64,borderRadius:20,background:p.iconBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,marginBottom:20 }}>{p.icon}</div>
                <h3 style={{ fontFamily:'Poppins,sans-serif',fontWeight:800,fontSize:24,marginBottom:12,color:'#111827' }}>{p.title}</h3>
                <p style={{ color:'#6B7280',fontSize:15,lineHeight:1.7,marginBottom:20 }}>{p.desc}</p>
                <div>{p.tags.map(t => <span key={t} style={{ display:'inline-block',fontSize:12,fontWeight:700,padding:'5px 12px',borderRadius:50,marginRight:6,marginBottom:6,background:p.tagColor,color:p.tagText }}>{t}</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="cara-kerja" className="lp-section" style={{ padding:'96px 48px',background:'#F9FAFB' }}>
        <div style={{ maxWidth:1200,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:52 }}>
            <span style={{ display:'inline-flex',alignItems:'center',gap:8,fontSize:12,fontWeight:700,letterSpacing:2.5,textTransform:'uppercase',color:'#FF6B00',marginBottom:12 }}>
              <span style={{ width:24,height:3,background:G,borderRadius:2,display:'inline-block' }} />Cara Kerja
            </span>
            <h2 style={{ fontFamily:'Poppins,sans-serif',fontWeight:800,fontSize:'clamp(26px,3.5vw,42px)',lineHeight:1.15,color:'#111827' }}>Mulai Live Streaming<br/>Cuma 4 Langkah</h2>
          </div>
          <div className="lp-steps" style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:24,position:'relative' }}>
            <div style={{ position:'absolute',top:32,left:'12.5%',right:'12.5%',height:2,background:G,zIndex:0,borderRadius:2 }} />
            {[
              { num:'1', icon:'📱', title:'Hubungi Kami', desc:'Chat via WhatsApp, ceritakan produk & jadwal yang diinginkan.' },
              { num:'2', icon:'📅', title:'Pilih Slot & Paket', desc:'Pilih slot pagi atau malam, platform Shopee, TikTok, atau keduanya.' },
              { num:'3', icon:'🎬', title:'Kita Live Bareng!', desc:'Host profesional kami mulai live, showcase produk, dan engage audience.' },
              { num:'4', icon:'📈', title:'Cuan Masuk!', desc:'Order berdatangan, penjualan naik. Kami kirimkan laporan hasil sesi.' },
            ].map((step, i) => (
              <div key={i} className="step-card" style={{ position:'relative',zIndex:1 }}>
                <div style={{ width:52,height:52,borderRadius:'50%',background:G,color:'white',fontFamily:'Poppins,sans-serif',fontWeight:900,fontSize:20,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 4px 16px rgba(255,107,0,.3)' }}>{step.num}</div>
                <div style={{ fontSize:28,marginBottom:12 }}>{step.icon}</div>
                <h4 style={{ fontFamily:'Poppins,sans-serif',fontWeight:700,fontSize:16,marginBottom:8,color:'#111827' }}>{step.title}</h4>
                <p style={{ fontSize:13,color:'#6B7280',lineHeight:1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-section" style={{ padding:'96px 48px',background:'white' }}>
        <div style={{ maxWidth:1200,margin:'0 auto' }}>
          <div className="lp-feat-split" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:64,alignItems:'center' }}>
            <div>
              <span style={{ display:'inline-flex',alignItems:'center',gap:8,fontSize:12,fontWeight:700,letterSpacing:2.5,textTransform:'uppercase',color:'#FF6B00',marginBottom:12 }}>
                <span style={{ width:24,height:3,background:G,borderRadius:2,display:'inline-block' }} />Keunggulan
              </span>
              <h2 style={{ fontFamily:'Poppins,sans-serif',fontWeight:800,fontSize:'clamp(26px,3.5vw,42px)',lineHeight:1.15,color:'#111827',marginBottom:16 }}>Kenapa Pilih<br/>Iranza Live?</h2>
              <p style={{ fontSize:17,color:'#6B7280',lineHeight:1.7,marginBottom:36,maxWidth:400 }}>Bukan sekadar host — kami adalah partner penjualan live streaming yang ikut memikirkan strategi terbaik untuk toko kamu.</p>
              <a href={wa('Halo Iranza Live, mau konsultasi dulu')} className="lp-btn-primary" target="_blank">💬 Konsultasi Gratis</a>
            </div>
            <div className="lp-feat-grid" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
              {s.features.map((f, i) => (
                <div key={i} className="lp-feat-card">
                  <div style={{ width:52,height:52,borderRadius:16,background:'linear-gradient(135deg,#FFF3D6,#FFE4CC)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0 }}>{f.icon}</div>
                  <div>
                    <h4 style={{ fontFamily:'Poppins,sans-serif',fontWeight:700,fontSize:15,marginBottom:6,color:'#111827' }}>{f.title}</h4>
                    <p style={{ fontSize:13,color:'#6B7280',lineHeight:1.6 }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="harga" className="lp-section" style={{ padding:'96px 48px',background:'linear-gradient(180deg,#FFFBF5 0%,#FFF3E0 100%)' }}>
        <div style={{ maxWidth:1200,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:52 }}>
            <span style={{ display:'inline-flex',alignItems:'center',gap:8,fontSize:12,fontWeight:700,letterSpacing:2.5,textTransform:'uppercase',color:'#FF6B00',marginBottom:12 }}>
              <span style={{ width:24,height:3,background:G,borderRadius:2,display:'inline-block' }} />Harga
            </span>
            <h2 style={{ fontFamily:'Poppins,sans-serif',fontWeight:800,fontSize:'clamp(26px,3.5vw,42px)',lineHeight:1.15,color:'#111827' }}>Harga Promo Launching 🔥</h2>
            <p style={{ fontSize:17,color:'#6B7280',marginTop:12 }}>Terbatas hanya <strong style={{ color:'#FF6B00' }}>4 slot per hari</strong>. Book sekarang sebelum penuh!</p>
          </div>

          <div className="lp-price-grid" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:28 }}>
            {[
              { timeKey:'pagi', icon:'☀️', label:'Slot Pagi & Siang', headerBg:'linear-gradient(135deg,#FFF9E6,#FFF0C4)', badgeBg:'rgba(255,184,0,.2)', badgeColor:'#D97706', tagline:'PRODUKTIF PAGI, CUAN DATANG LAGI!', taglineColor:'#FF6B00', time:s.slot_pagi_times,
                rows:[{ plat:'🛒', platBg:'linear-gradient(135deg,#FF6B00,#FF9A00)', name:'Live Shopee', price:s.prices.pagi_shopee },{ plat:'🎵', platBg:'#000', name:'Live TikTok', price:s.prices.pagi_tiktok },{ plat:'🔥', platBg:G, name:'Dual Platform', price:s.prices.pagi_dual, featured:true }] },
              { timeKey:'malam', icon:'🌙', label:'Slot Sore & Malam', headerBg:'linear-gradient(135deg,#F3EEFF,#E9DCFF)', badgeBg:'rgba(124,58,237,.15)', badgeColor:'#7C3AED', tagline:'MALAM RAMAI, PENJUALAN MENINGKAT!', taglineColor:'#7C3AED', time:s.slot_malam_times,
                rows:[{ plat:'🛒', platBg:'linear-gradient(135deg,#FF6B00,#FF9A00)', name:'Live Shopee', price:s.prices.malam_shopee },{ plat:'🎵', platBg:'#000', name:'Live TikTok', price:s.prices.malam_tiktok },{ plat:'🔥', platBg:G, name:'Dual Platform', price:s.prices.malam_dual, featured:true }] },
            ].map((card, ci) => (
              <div key={ci} className="lp-card-hover" style={{ background:'white',borderRadius:28,overflow:'hidden',boxShadow:'0 4px 24px rgba(0,0,0,.07)' }}>
                <div style={{ padding:'28px 28px 22px',display:'flex',gap:16,alignItems:'center',background:card.headerBg }}>
                  <span style={{ fontSize:42 }}>{card.icon}</span>
                  <div>
                    <span style={{ display:'inline-block',fontSize:11,fontWeight:800,padding:'4px 12px',borderRadius:50,letterSpacing:.5,textTransform:'uppercase',marginBottom:5,background:card.badgeBg,color:card.badgeColor }}>{card.label}</span>
                    <div style={{ fontSize:13,color:'#6B7280',fontWeight:500 }}>{card.time}</div>
                    <div style={{ fontSize:11,fontWeight:700,marginTop:2,color:card.taglineColor }}>{card.tagline}</div>
                  </div>
                </div>
                <div style={{ padding:'20px 24px 28px',display:'flex',flexDirection:'column',gap:12 }}>
                  {card.rows.map((row, ri) => (
                    <div key={ri} className={`lp-price-row${row.featured ? ' featured' : ''}`}>
                      <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                        <div style={{ width:38,height:38,borderRadius:12,background:row.platBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>{row.plat}</div>
                        <div>
                          <div style={{ fontFamily:'Poppins,sans-serif',fontWeight:700,fontSize:14,color:'#111827' }}>{row.name}</div>
                          <div style={{ fontSize:12,color:row.featured?'#FF6B00':'#6B7280',fontWeight:row.featured?600:400 }}>Per sesi 2 jam{row.featured?' • Shopee + TikTok':''}</div>
                        </div>
                      </div>
                      <div style={{ fontFamily:'Poppins,sans-serif',fontWeight:900,fontSize:22,...GText }}>{row.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Promo callout */}
          <div className="lp-promo-callout" style={{ background:G,borderRadius:24,padding:'28px 36px',marginTop:28,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16,boxShadow:'0 8px 32px rgba(255,107,0,.3)' }}>
            <div style={{ color:'white' }}>
              <div style={{ fontFamily:'Poppins,sans-serif',fontWeight:900,fontSize:22,marginBottom:4 }}>⚡ {s.promo_label}</div>
              <div style={{ fontSize:14,opacity:.85 }}>Harga spesial ini hanya untuk periode launching. Jangan sampai kehabisan slot!</div>
            </div>
            <a href={wa('Halo Iranza Live, mau book slot promo launching')} className="lp-btn-white" target="_blank">Book via WhatsApp →</a>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {s.testimonials && s.testimonials.length > 0 && (
        <section className="lp-section" style={{ padding:'96px 48px',background:'white' }}>
          <div style={{ maxWidth:1200,margin:'0 auto' }}>
            <div style={{ textAlign:'center',marginBottom:52 }}>
              <span style={{ display:'inline-flex',alignItems:'center',gap:8,fontSize:12,fontWeight:700,letterSpacing:2.5,textTransform:'uppercase',color:'#FF6B00',marginBottom:12 }}>
                <span style={{ width:24,height:3,background:G,borderRadius:2,display:'inline-block' }} />Testimoni
              </span>
              <h2 style={{ fontFamily:'Poppins,sans-serif',fontWeight:800,fontSize:'clamp(26px,3.5vw,42px)',lineHeight:1.15,color:'#111827' }}>Kata Mereka yang<br/>Sudah Live Bareng Kami</h2>
            </div>
            <div className="lp-testi-grid" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24 }}>
              {s.testimonials.map((t, i) => (
                <div key={i} className="lp-testi-card">
                  <div style={{ color:'#FFB800',fontSize:18,marginBottom:16,letterSpacing:2 }}>★★★★★</div>
                  <p style={{ fontSize:15,lineHeight:1.7,color:'#374151',marginBottom:20,fontStyle:'italic' }}>"{t.text}"</p>
                  <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                    <div style={{ width:44,height:44,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,background:'linear-gradient(135deg,#FFF3D6,#FFE4CC)',flexShrink:0 }}>{t.icon}</div>
                    <div>
                      <div style={{ fontFamily:'Poppins,sans-serif',fontWeight:700,fontSize:14,color:'#111827' }}>{t.name}</div>
                      <div style={{ fontSize:12,color:'#6B7280' }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="lp-cta-section" style={{ background:'#111827',padding:'100px 48px',textAlign:'center',position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',inset:0,backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='4' fill='%23FF6B00' fill-opacity='0.04'/%3E%3C/svg%3E\")" }} />
        <div style={{ position:'relative',zIndex:1,maxWidth:700,margin:'0 auto' }}>
          <h2 style={{ fontFamily:'Poppins,sans-serif',fontWeight:900,fontSize:'clamp(30px,4vw,50px)',lineHeight:1.15,color:'white',marginBottom:20 }}>
            Siap Bikin Toko Kamu<br/><span style={GText}>{s.cta_title.replace('Siap Bikin Toko Kamu','').replace('Siap ','') || 'Live & Cuan Optimal?'}</span>
          </h2>
          <p style={{ fontSize:18,color:'rgba(255,255,255,.6)',marginBottom:44,lineHeight:1.7 }}>{s.cta_sub}</p>
          <div style={{ marginBottom:32 }}>
            <a href={wa('Halo Iranza Live, saya mau booking live streaming')} className="lp-btn-primary" target="_blank" style={{ fontSize:17,padding:'16px 40px' }}>💬 Chat WhatsApp Sekarang</a>
          </div>
          <a href={`tel:+${s.whatsapp_number}`} style={{ display:'inline-flex',alignItems:'center',gap:12,padding:'16px 32px',borderRadius:16,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',fontFamily:'Poppins,sans-serif',fontSize:20,fontWeight:800,color:'white',textDecoration:'none',transition:'background .2s' }}>
            📞 {phone}
          </a>
          <p style={{ marginTop:20,fontSize:13,color:'rgba(255,255,255,.25)' }}>YUK, LIVE BARENG IRANZA LIVE! • LIVE MAKSIMAL CUAN OPTIMAL!</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background:'#0D0D0D',padding:'36px 48px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:20 }}>
        <img src="/logo_iranza_live.png" alt="Iranza Live" style={{ height:34 }} onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
        <p style={{ color:'rgba(255,255,255,.3)',fontSize:13 }}>© 2025 Iranza Live. Jasa Live Streaming Profesional — Shopee & TikTok Shop.</p>
        <a href={wa('Halo Iranza Live')} target="_blank" style={{ display:'flex',alignItems:'center',gap:8,color:'#25D366',fontSize:14,fontWeight:600,textDecoration:'none' }}>
          <span style={{ fontSize:20 }}>💚</span> {phone}
        </a>
      </footer>
    </div>
  )
}
