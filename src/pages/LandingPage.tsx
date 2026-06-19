/**
 * LandingPage.tsx — Iranza Live Creative Agency Redesign
 * Three.js WebGL 3D + Cloudinary hero photos
 * Clean minimalist + 3D playful elements
 */

import { useEffect, useRef, useState, useCallback, isValidElement, cloneElement, Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getCloudinaryThumbnail } from '@/lib/cloudinary'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ─── Types ─────────────────────────────────────────── */
interface HeroPhoto {
  cloudinary_url: string
  caption?: string
}

interface LandingSettings {
  whatsapp_number: string
  logo_url: string
  slot_pagi_times: string
  slot_malam_times: string
  prices: {
    pagi_shopee: string; pagi_tiktok: string; pagi_dual: string
    malam_shopee: string; malam_tiktok: string; malam_dual: string
  }
  testimonials: { icon: string; name: string; role: string; text: string }[]
  hero_photos: HeroPhoto[]
  hero_headline_1: string
  hero_headline_2: string
  hero_subtext: string
}

const DEFAULT: LandingSettings = {
  whatsapp_number: '6285776077292',
  logo_url: '',
  slot_pagi_times: '05.00–09.00 · 11.00–14.00 WIB',
  slot_malam_times: '16.00–18.00 · 20.00–02.00 WIB',
  hero_headline_1: 'Studio Live',
  hero_headline_2: 'untuk UMKM.',
  hero_subtext: 'Host profesional. Studio siap. Hasil terukur — di Shopee & TikTok Shop.',
  hero_photos: [],
  prices: {
    pagi_shopee: '60', pagi_tiktok: '60', pagi_dual: '80',
    malam_shopee: '90', malam_tiktok: '90', malam_dual: '150',
  },
  testimonials: [
    { icon: '🧕', name: 'Sari Dewi', role: 'Fashion Hijab · Shopee Live', text: 'Sejak pakai Iranza Live, sesi Shopee gua selalu tembus 1000+ viewers. Host-nya ngerti banget cara ngomong ke penonton — produk cepet abis sebelum sesi kelar.' },
    { icon: '👨', name: 'Budi Santoso', role: 'Elektronik · Dual Platform', text: 'Gua coba dual platform pertama kali, skeptis awalnya. Tapi dalam 2 jam satu sesi, total order dari Shopee dan TikTok lebih dari yang biasanya gua dapet seminggu.' },
    { icon: '👩', name: 'Rina Marlina', role: 'Skincare · TikTok Shop', text: 'Yang bikin gua loyal bukan cuma hasilnya, tapi mereka kirim laporan lengkap setiap sesi — viewers, engagement, konversi. Gua bisa track perkembangan toko gua.' },
    { icon: '🧑', name: 'Ahmad Fauzi', role: 'Makanan & Minuman · Shopee', text: 'Harganya murah tapi kualitasnya jauh di atas ekspektasi. Sudah 2 bulan langganan, omset naik konsisten tiap minggunya. Rekomen banget buat seller yang baru mau coba live.' },
    { icon: '👩‍🦱', name: 'Dewi Lestari', role: 'Pakaian Anak · TikTok Shop', text: 'Slot malamnya mantap, waktu paling ramai pembeli online. Host mereka natural ngobrolnya, ga kaku, dan selalu bisa jawab pertanyaan produk dengan baik dan meyakinkan.' },
  ],
}

const MARQUEE_1 = ['Live Shopee', 'TikTok Shop', 'Dual Platform', 'Host Pro', 'Studio HD', '4 Slot/Hari', 'Mulai 60rb']
const MARQUEE_2 = ['Live Profesional', 'Hasil Maksimal', 'Slot Pagi & Malam', 'Promo Launching!', 'Booking Now']

const SERVICES = [
  {
    id: 'shopee',
    num: '01',
    name: 'Shopee Live',
    tagline: 'Jangkau jutaan pembeli aktif.',
    desc: 'Kami optimalkan voucher, product pin, flash sale, dan interaksi real-time untuk dorong konversi dan pembelian impulsif di setiap sesi.',
    color: '#FF4D00',
    tags: ['Flash Sale', 'Voucher Live', 'Product Pin', 'Real-time Q&A'],
  },
  {
    id: 'tiktok',
    num: '02',
    name: 'TikTok Shop Live',
    tagline: 'Algoritma bekerja untuk kamu.',
    desc: 'Kami buat setiap momen live menjadi konten yang engaging — dari hook pembuka sampai closing yang mendorong klik "Beli" — organik tanpa bayar iklan.',
    color: '#7C3AED',
    tags: ['For You Page', 'Gift Engagement', 'Viral Hook', 'Product Showcase'],
  },
  {
    id: 'dual',
    num: '03',
    name: 'Dual Platform',
    tagline: 'Satu sesi, dua platform.',
    desc: 'Dobel jangkauan, dobel potensi penjualan — dengan efisiensi biaya yang lebih tinggi dibanding booking terpisah. Best value yang ada.',
    color: '#FFD600',
    tags: ['Shopee + TikTok', '2 Jam / Sesi', 'Best Value'],
  },
]

/* ─── Hooks ─────────────────────────────────────────── */

/** Attaches a GSAP ScrollTrigger-driven parallax to a section. The
 * decorative background element (passed via bgRef) moves at a different
 * speed than the foreground content as the section scrolls through the
 * viewport — classic layered-parallax depth effect. */
function useGsapParallax(speed = 0.15) {
  const sectionRef = useRef<HTMLElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Skip parallax on mobile — it's a decorative effect and GSAP ScrollTrigger
    // can conflict with React's DOM reconciliation on narrow viewports.
    if (!window.matchMedia('(min-width:769px)').matches) return
    if (!sectionRef.current || !bgRef.current) return
    const tween = gsap.to(bgRef.current, {
      yPercent: speed * 100,
      ease: 'none',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    })
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
      if (bgRef.current) gsap.set(bgRef.current, { clearProps: 'transform' })
    }
  }, [speed])

  return { sectionRef, bgRef }
}

function useReveal() {
  const [visible, setVisible] = useState<Set<string>>(new Set())
  useEffect(() => {
    const observed = new Set<Element>()

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && e.target instanceof HTMLElement) {
          const id = e.target.dataset.rid!
          const delay = parseFloat(e.target.dataset.rdelay || '0')
          setTimeout(() => setVisible(p => new Set([...p, id])), delay)
          io.unobserve(e.target)
          observed.delete(e.target)
        }
      })
    }, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' })

    const observeNew = () => {
      document.querySelectorAll('[data-rid]').forEach(el => {
        if (!observed.has(el)) {
          observed.add(el)
          io.observe(el)
        }
      })
    }

    // Initial scan
    observeNew()

    // Re-scan whenever DOM changes (e.g. after Supabase data loads and
    // conditionally-rendered elements like work-photos appear in the DOM)
    const mo = new MutationObserver(observeNew)
    mo.observe(document.body, { childList: true, subtree: true })

    return () => { io.disconnect(); mo.disconnect() }
  }, [])
  return visible
}

/* ─── Three.js 3D Canvas ─────────────────────────────── */
function ThreeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Feature-detect WebGL before even bothering to fetch three.js. Some
    // mobile browsers (older devices, low-power mode, certain in-app
    // webviews) don't support it — in that case we just leave the
    // canvas empty and let the rest of the hero (headline, CTA, etc.)
    // render normally instead of silently failing later.
    const supportsWebGL = (() => {
      try {
        const test = document.createElement('canvas')
        return !!(test.getContext('webgl') || test.getContext('experimental-webgl'))
      } catch {
        return false
      }
    })()
    if (!supportsWebGL) return

    // Reuse an already-loaded three.js (e.g. from a previous mount)
    // instead of injecting a duplicate <script> tag every time.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).THREE) {
      initThree(canvas)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
    script.onload = () => initThree(canvas)
    script.onerror = () => {
      // CDN unreachable / blocked / slow network on mobile data — fail
      // quietly. The hero still works fine without the 3D decoration.
      console.warn('[ThreeCanvas] Failed to load three.js from CDN — hero will render without 3D.')
    }
    document.head.appendChild(script)

    return () => {
      // Guard removeChild: in React 18 StrictMode (dev only) effects can
      // run twice, and the script may have already been removed/loaded
      // by the time cleanup runs.
      if (script.parentNode) document.head.removeChild(script)
    }
  }, [])

  function initThree(canvas: HTMLCanvasElement) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const THREE = (window as any).THREE
      if (!THREE) return

      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      // If the section hasn't been laid out yet (0 size), bail instead
      // of dividing by zero in the camera aspect ratio below — retry
      // on the next animation frame.
      if (!W || !H) {
        requestAnimationFrame(() => initThree(canvas))
        return
      }

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100)
      camera.position.set(0, 0, 6)

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
      scene.add(ambientLight)

      const pointLight1 = new THREE.PointLight(0xFF4D00, 2.5, 20)
      pointLight1.position.set(3, 3, 3)
      scene.add(pointLight1)

      const pointLight2 = new THREE.PointLight(0x7C3AED, 1.5, 20)
      pointLight2.position.set(-3, -2, 2)
      scene.add(pointLight2)

      const pointLight3 = new THREE.PointLight(0xFFD600, 1, 15)
      pointLight3.position.set(0, -3, 1)
      scene.add(pointLight3)

      // Materials
      const matOrange = new THREE.MeshStandardMaterial({
        color: 0xFF4D00,
        metalness: 0.7,
        roughness: 0.2,
        emissive: 0xFF4D00,
        emissiveIntensity: 0.1,
      })
      const matPurple = new THREE.MeshStandardMaterial({
        color: 0x7C3AED,
        metalness: 0.8,
        roughness: 0.15,
        emissive: 0x7C3AED,
        emissiveIntensity: 0.1,
      })
      const matGold = new THREE.MeshStandardMaterial({
        color: 0xFFD600,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0xFFD600,
        emissiveIntensity: 0.08,
      })
      const matWire = new THREE.MeshBasicMaterial({
        color: 0xFF4D00,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
      })

      // Objects
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const objects: Array<{
        mesh: any
        rx: number; ry: number; rz: number
        ox: number; oy: number
        floatSpeed: number; floatAmp: number; floatOffset: number
      }> = []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addObj = (geo: any, mat: any, x: number, y: number, z: number) => {
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.set(x, y, z)
        scene.add(mesh)
        objects.push({
          mesh,
          rx: (Math.random() - 0.5) * 0.01,
          ry: (Math.random() - 0.5) * 0.015,
          rz: (Math.random() - 0.5) * 0.008,
          ox: x, oy: y,
          floatSpeed: 0.4 + Math.random() * 0.6,
          floatAmp: 0.08 + Math.random() * 0.12,
          floatOffset: Math.random() * Math.PI * 2,
        })
        return mesh
      }

      // Main torus knot — centerpiece
      addObj(new THREE.TorusKnotGeometry(0.9, 0.28, 120, 16, 2, 3), matOrange, 0, 0.3, 0)

      // Floating icosahedron
      addObj(new THREE.IcosahedronGeometry(0.5, 1), matPurple, -2.8, 1.2, -1)

      // Floating octahedron
      addObj(new THREE.OctahedronGeometry(0.4, 0), matGold, 2.6, -0.8, -0.5)

      // Wireframe sphere — background
      addObj(new THREE.SphereGeometry(1.8, 16, 16), matWire, 0, 0, -2)

      // Small dodecahedrons
      addObj(new THREE.DodecahedronGeometry(0.22, 0), matOrange, 1.8, 1.8, 0.5)
      addObj(new THREE.DodecahedronGeometry(0.18, 0), matPurple, -1.6, -1.8, 0.2)
      addObj(new THREE.DodecahedronGeometry(0.15, 0), matGold, -2.4, 0.3, 0.8)

      // Particle system
      const particleCount = 120
      const positions = new Float32Array(particleCount * 3)
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 12
        positions[i * 3 + 1] = (Math.random() - 0.5) * 8
        positions[i * 3 + 2] = (Math.random() - 0.5) * 6
      }
      const particleGeo = new THREE.BufferGeometry()
      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const particleMat = new THREE.PointsMaterial({
        color: 0xFF4D00, size: 0.03, transparent: true, opacity: 0.6,
      })
      scene.add(new THREE.Points(particleGeo, particleMat))

      // Mouse tracking
      let mouseX = 0, mouseY = 0
      const onMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2
        mouseY = -(e.clientY / window.innerHeight - 0.5) * 2
      }
      window.addEventListener('mousemove', onMouseMove)

      let animId: number
      const clock = new THREE.Clock()

      const animate = () => {
        animId = requestAnimationFrame(animate)
        const t = clock.getElapsedTime()

        // Camera subtle parallax
        camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.03
        camera.position.y += (mouseY * 0.3 - camera.position.y) * 0.03
        camera.lookAt(0, 0, 0)

        // Animate objects
        objects.forEach(o => {
          o.mesh.rotation.x += o.rx
          o.mesh.rotation.y += o.ry
          o.mesh.rotation.z += o.rz
          o.mesh.position.y = o.oy + Math.sin(t * o.floatSpeed + o.floatOffset) * o.floatAmp
        })

        // Pulse light
        pointLight1.intensity = 2 + Math.sin(t * 1.5) * 0.5

        renderer.render(scene, camera)
      }
      animate()

      // Resize handler
      const onResize = () => {
        const W2 = canvas.offsetWidth
        const H2 = canvas.offsetHeight
        camera.aspect = W2 / H2
        camera.updateProjectionMatrix()
        renderer.setSize(W2, H2)
      }
      window.addEventListener('resize', onResize)

      // Cleanup stored on canvas element
      ;(canvas as HTMLCanvasElement & { _threeCleanup?: () => void })._threeCleanup = () => {
        cancelAnimationFrame(animId)
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('resize', onResize)
        renderer.dispose()
      }
    } catch (err) {
      console.warn('[ThreeCanvas] Failed to initialize 3D scene — hero will render without it.', err)
    }
  }

  useEffect(() => {
    return () => {
      const canvas = canvasRef.current as HTMLCanvasElement & { _threeCleanup?: () => void }
      canvas?._threeCleanup?.()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}

/* ─── Floating 3D Shape — lightweight decorative background ───
   Reuses the same three.js r128 CDN instance as the hero canvas.
   Desktop-only (decorative, skipped on mobile for perf) and only
   initializes once its section actually scrolls into view. */
function FloatingShape3D({ shape = 'icosahedron', color = 0xFF4D00, size = 1.4 }: {
  shape?: 'icosahedron' | 'torus' | 'octahedron'; color?: number; size?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(min-width:769px)').matches) return
    const canvas = canvasRef.current
    if (!canvas) return

    const supportsWebGL = (() => {
      try {
        const test = document.createElement('canvas')
        return !!(test.getContext('webgl') || test.getContext('experimental-webgl'))
      } catch {
        return false
      }
    })()
    if (!supportsWebGL) return

    // Only spin up the GPU work once the section is actually visible.
    const io = new IntersectionObserver(entries => {
      if (!entries[0]?.isIntersecting) return
      io.disconnect()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).THREE) {
        initShape(canvas)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
      script.onload = () => initShape(canvas)
      script.onerror = () => console.warn('[FloatingShape3D] Failed to load three.js from CDN.')
      document.head.appendChild(script)
    }, { threshold: 0.1 })
    io.observe(canvas)

    return () => io.disconnect()
  }, [])

  function initShape(canvas: HTMLCanvasElement) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const THREE = (window as any).THREE
      if (!THREE) return

      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      if (!W || !H) {
        requestAnimationFrame(() => initShape(canvas))
        return
      }

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100)
      camera.position.set(0, 0, 5)

      scene.add(new THREE.AmbientLight(0xffffff, 0.4))
      const light = new THREE.PointLight(color, 2.2, 20)
      light.position.set(2, 2, 3)
      scene.add(light)

      const geo = shape === 'torus'
        ? new THREE.TorusGeometry(size * 0.6, size * 0.22, 24, 80)
        : shape === 'octahedron'
        ? new THREE.OctahedronGeometry(size * 0.7, 0)
        : new THREE.IcosahedronGeometry(size * 0.7, 0)

      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color, metalness: 0.7, roughness: 0.25, emissive: color, emissiveIntensity: 0.12,
      }))
      scene.add(mesh)

      const wireMesh = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({
        color, wireframe: true, transparent: true, opacity: 0.12,
      }))
      wireMesh.scale.setScalar(1.35)
      scene.add(wireMesh)

      let mouseX = 0, mouseY = 0
      const onMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2
        mouseY = -(e.clientY / window.innerHeight - 0.5) * 2
      }
      window.addEventListener('mousemove', onMouseMove)

      let animId: number
      const clock = new THREE.Clock()
      const animate = () => {
        animId = requestAnimationFrame(animate)
        const t = clock.getElapsedTime()
        mesh.rotation.x = t * 0.18
        mesh.rotation.y = t * 0.26
        wireMesh.rotation.x = -t * 0.1
        wireMesh.rotation.y = t * 0.14
        camera.position.x += (mouseX * 0.4 - camera.position.x) * 0.04
        camera.position.y += (mouseY * 0.25 - camera.position.y) * 0.04
        camera.lookAt(0, 0, 0)
        renderer.render(scene, camera)
      }
      animate()

      const onResize = () => {
        const W2 = canvas.offsetWidth
        const H2 = canvas.offsetHeight
        if (!W2 || !H2) return
        camera.aspect = W2 / H2
        camera.updateProjectionMatrix()
        renderer.setSize(W2, H2)
      }
      window.addEventListener('resize', onResize)

      ;(canvas as HTMLCanvasElement & { _shapeCleanup?: () => void })._shapeCleanup = () => {
        cancelAnimationFrame(animId)
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('resize', onResize)
        renderer.dispose()
      }
    } catch (err) {
      console.warn('[FloatingShape3D] Failed to initialize 3D scene.', err)
    }
  }

  useEffect(() => {
    return () => {
      const canvas = canvasRef.current as HTMLCanvasElement & { _shapeCleanup?: () => void }
      canvas?._shapeCleanup?.()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  )
}

/* ─── Distorted Image — WebGL ripple/chromatic-aberration on hover ───
   Renders a single full-bleed image plane with a custom shader. On
   mouse move, the point under the cursor "ripples" the UVs and splits
   RGB channels slightly — classic liquid-distortion hover effect.
   Falls back to a plain <img> on mobile / no-WebGL (no hover there anyway). */
function DistortedImage({ src, alt = '', className, style }: {
  src: string; alt?: string; className?: string; style?: React.CSSProperties
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [webglReady, setWebglReady] = useState(false)

  useEffect(() => {
    if (!window.matchMedia('(min-width:769px)').matches) return // desktop only — effect needs hover
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const supportsWebGL = (() => {
      try {
        const test = document.createElement('canvas')
        return !!(test.getContext('webgl') || test.getContext('experimental-webgl'))
      } catch {
        return false
      }
    })()
    if (!supportsWebGL) return

    const start = () => initDistort(canvas, wrap, src)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).THREE) {
      start()
    } else {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
      script.onload = start
      script.onerror = () => console.warn('[DistortedImage] Failed to load three.js from CDN.')
      document.head.appendChild(script)
    }

    return () => {
      const c = canvasRef.current as HTMLCanvasElement & { _distortCleanup?: () => void }
      c?._distortCleanup?.()
    }
  }, [src])

  function initDistort(canvas: HTMLCanvasElement, wrap: HTMLDivElement, imgSrc: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const THREE = (window as any).THREE
      if (!THREE) return

      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      if (!W || !H) {
        requestAnimationFrame(() => initDistort(canvas, wrap, imgSrc))
        return
      }

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

      const scene = new THREE.Scene()
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

      const uniforms = {
        uTexture: { value: null },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uHover: { value: 0 },
        uTime: { value: 0 },
      }

      const material = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D uTexture;
          uniform vec2 uMouse;
          uniform float uHover;
          uniform float uTime;
          varying vec2 vUv;
          void main() {
            vec2 m = vec2(uMouse.x, 1.0 - uMouse.y);
            float dist = distance(vUv, m);
            float falloff = smoothstep(0.45, 0.0, dist);
            float ripple = sin(dist * 36.0 - uTime * 3.5) * 0.018 * uHover * falloff;
            vec2 dir = normalize(vUv - m + 0.0001);
            vec2 uv = vUv + dir * ripple;
            float aberration = 0.0035 * uHover * falloff;
            float r = texture2D(uTexture, uv + dir * aberration).r;
            float g = texture2D(uTexture, uv).g;
            float b = texture2D(uTexture, uv - dir * aberration).b;
            gl_FragColor = vec4(r, g, b, 1.0);
          }
        `,
      })
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
      scene.add(mesh)

      const loader = new THREE.TextureLoader()
      loader.crossOrigin = 'anonymous'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      loader.load(imgSrc, (tex: any) => {
        tex.minFilter = THREE.LinearFilter
        uniforms.uTexture.value = tex
        canvas.style.opacity = '1'
      })

      let targetHover = 0
      const onEnter = () => { targetHover = 1 }
      const onLeave = () => { targetHover = 0 }
      const onMove = (e: MouseEvent) => {
        const rect = wrap.getBoundingClientRect()
        uniforms.uMouse.value.set(
          (e.clientX - rect.left) / rect.width,
          (e.clientY - rect.top) / rect.height,
        )
      }
      wrap.addEventListener('mouseenter', onEnter)
      wrap.addEventListener('mouseleave', onLeave)
      wrap.addEventListener('mousemove', onMove)

      let animId: number
      const clock = new THREE.Clock()
      const animate = () => {
        animId = requestAnimationFrame(animate)
        uniforms.uTime.value = clock.getElapsedTime()
        uniforms.uHover.value += (targetHover - uniforms.uHover.value) * 0.08
        if (uniforms.uTexture.value) renderer.render(scene, camera)
      }
      animate()

      const onResize = () => {
        const W2 = canvas.offsetWidth
        const H2 = canvas.offsetHeight
        if (!W2 || !H2) return
        renderer.setSize(W2, H2)
      }
      window.addEventListener('resize', onResize)

      setWebglReady(true)

      ;(canvas as HTMLCanvasElement & { _distortCleanup?: () => void })._distortCleanup = () => {
        cancelAnimationFrame(animId)
        wrap.removeEventListener('mouseenter', onEnter)
        wrap.removeEventListener('mouseleave', onLeave)
        wrap.removeEventListener('mousemove', onMove)
        window.removeEventListener('resize', onResize)
        renderer.dispose()
      }
    } catch (err) {
      console.warn('[DistortedImage] Failed to initialize.', err)
    }
  }

  return (
    <div ref={wrapRef} className={className} style={{ position: 'relative', overflow: 'hidden', ...style }}>
      <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          opacity: 0, transition: 'opacity .4s ease', display: webglReady ? 'block' : 'none',
        }}
      />
    </div>
  )
}

/* ─── Floating Photo Strip ────────────────────────────── */
function PhotoStrip({ photos, inline = false }: { photos: HeroPhoto[], inline?: boolean }) {
  if (!photos.length) return null

  const items = [...photos, ...photos, ...photos] // triple for seamless loop

  return (
    <div style={{
      ...(inline ? {
        position: 'relative',
        width: '100%',
        height: 220,
      } : {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 200,
        zIndex: 2,
      }),
      overflow: 'hidden',
      maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
      WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
    }}>
      <div className="il-photo-scroll" style={{
        display: 'flex',
        gap: 16,
        width: 'max-content',
        height: '100%',
        alignItems: 'center',
      }}>
        {items.map((photo, i) => (
          <div key={i} style={{
            width: 160,
            height: 160,
            borderRadius: 12,
            overflow: 'hidden',
            flexShrink: 0,
            border: '1px solid rgba(255,77,0,0.2)',
            transform: i % 2 === 0 ? 'rotate(-2deg)' : 'rotate(1.5deg)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <img
              src={getCloudinaryThumbnail(photo.cloudinary_url, 320, 320)}
              alt={photo.caption || ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Brand Logo (image from Cloudinary, falls back to text) ──── */
function BrandLogo({ logoUrl, size = 32 }: { logoUrl: string; size?: number }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Iranza Live"
        style={{ height: size, width: 'auto', objectFit: 'contain', display: 'block' }}
      />
    )
  }
  return (
    <div style={{
      fontFamily: "'Cabinet Grotesk', sans-serif",
      fontWeight: 900, fontSize: Math.round(size * 0.55), letterSpacing: '-0.01em',
      color: '#F2EFE8',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span className="il-live-dot" />
      Iranza<span style={{ color: '#FF4D00' }}>Live</span>
    </div>
  )
}

function NavIcon({ d, size = 14 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

/**
 * Recursively walks JSX children, splitting plain-text nodes into per-word
 * <span> masks that slide/fade in on scroll — while leaving element nodes
 * (like <em> or <br/>) intact so existing styling keeps working.
 * `counter` is a shared mutable ref so stagger delay continues across
 * nested elements (e.g. the <em> word picks up where the previous left off).
 */
function splitTextAnimated(
  node: ReactNode,
  counter: { i: number },
  shown: boolean,
  step: number,
): ReactNode {
  if (typeof node === 'string') {
    const words = node.split(' ')
    return words.map((w, idx) => {
      if (w === '') return idx < words.length - 1 ? ' ' : null
      const delay = counter.i * step
      counter.i++
      return (
        <span key={`${counter.i}-${w}`} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top' }}>
          <span style={{
            display: 'inline-block',
            transform: shown ? 'translateY(0)' : 'translateY(112%)',
            opacity: shown ? 1 : 0,
            transition: `transform .7s cubic-bezier(.16,1,.3,1) ${delay}ms, opacity .55s ease ${delay}ms`,
          }}>{w}</span>
          {idx < words.length - 1 ? '\u00A0' : ''}
        </span>
      )
    })
  }
  if (Array.isArray(node)) {
    return node.map((n, i) => <Fragment key={i}>{splitTextAnimated(n, counter, shown, step)}</Fragment>)
  }
  if (isValidElement(node)) {
    if (node.type === 'br') return node
    const children = splitTextAnimated((node.props as { children?: ReactNode }).children, counter, shown, step)
    return cloneElement(node, undefined, children)
  }
  return node
}

/** Word-by-word scroll reveal for headings — handles nested <em>/<br/> safely. */
function SplitHeading({ children, as: Tag = 'h2', style, step = 28 }: {
  children: ReactNode; as?: keyof JSX.IntrinsicElements; style?: React.CSSProperties; step?: number
}) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); io.disconnect() }
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const counter = { i: 0 }
  return (
    // @ts-expect-error — dynamic tag + ref typing is intentionally loose here
    <Tag ref={ref} style={style}>{splitTextAnimated(children, counter, shown, step)}</Tag>
  )
}

/** Same reveal, lighter-weight, for plain-string labels/paragraphs (no nested elements). */
function SplitWords({ children, as: Tag = 'span', className, style, step = 22 }: {
  children: string; as?: keyof JSX.IntrinsicElements; className?: string; style?: React.CSSProperties; step?: number
}) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); io.disconnect() }
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const counter = { i: 0 }
  return (
    // @ts-expect-error — dynamic tag + ref typing is intentionally loose here
    <Tag ref={ref} className={className} style={style}>{splitTextAnimated(children, counter, shown, step)}</Tag>
  )
}

/* ─── Apa yang Kamu Dapat — pinned GSAP scroll-story ──── */
const PROSES_STEPS = [
  { step: '01', icon: '📞', title: 'Konsultasi', desc: 'Cerita soal produk & target kamu lewat WhatsApp. Kami bantu tentukan platform dan slot yang paling cocok.' },
  { step: '02', icon: '📅', title: 'Booking Slot', desc: 'Pilih slot pagi/siang atau sore/malam. Kami konfirmasi jadwal host dan studio untuk sesi kamu.' },
  { step: '03', icon: '🎙️', title: 'Live Berjalan', desc: 'Host kami yang bawakan sesi — kamu kirim produk, kami urus persiapan, kamera, dan interaksi penonton.' },
  { step: '04', icon: '📊', title: 'Laporan Hasil', desc: 'Setelah sesi selesai, kamu terima data viewers, engagement, dan catatan apa yang bisa diperbaiki sesi depan.' },
]

function ProsesScrollStory({ sectionNum }: { sectionNum: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])
  const progressRef = useRef<HTMLDivElement>(null)
  // null = not yet detected. Avoids rendering desktop GSAP layout on mobile
  // before matchMedia runs (caused removeChild crashes when GSAP pinned
  // elements that React then tried to unmount).
  const [isDesktopStory, setIsDesktopStory] = useState<boolean | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(min-width:769px)')
    setIsDesktopStory(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setIsDesktopStory(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!isDesktopStory) return
    if (!wrapRef.current || !pinRef.current) return

    const steps = stepRefs.current.filter(Boolean) as HTMLDivElement[]
    if (steps.length === 0) return

    let destroyed = false
    const n = steps.length
    let activeIndex = 0

    steps.forEach((el, i) => gsap.set(el, { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 40, scale: i === 0 ? 1 : 0.96 }))

    function goToStep(index: number) {
      if (index === activeIndex || destroyed) return
      const prevIndex = activeIndex
      activeIndex = index
      gsap.to(steps[prevIndex], { opacity: 0, y: -30, scale: 0.96, duration: 0.3, ease: 'power2.in', overwrite: true })
      gsap.fromTo(steps[index], { opacity: 0, y: 40, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power2.out', overwrite: true })
    }

    const trigger = ScrollTrigger.create({
      trigger: wrapRef.current,
      start: 'top top',
      end: `+=${n * 100}%`,
      scrub: 0.3,
      pin: pinRef.current,
      pinSpacing: true,
      onUpdate: (self) => {
        if (destroyed) return
        if (progressRef.current) progressRef.current.style.width = `${self.progress * 100}%`
        const stepIndex = Math.min(n - 1, Math.floor(self.progress * n))
        goToStep(stepIndex)
      },
    })

    return () => {
      destroyed = true
      trigger.kill()
      // Reset inline styles GSAP applied so React can safely take back DOM control
      steps.forEach(el => gsap.set(el, { clearProps: 'all' }))
    }
  }, [isDesktopStory])

  if (isDesktopStory !== true) {
    // Mobile fallback (also covers null = not yet detected): simple stacked cards, no pin
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        {PROSES_STEPS.map((p) => (
          <div key={p.step} style={{ background: '#0D0D0D', border: '1px solid var(--border)', borderRadius: 8, padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{ fontSize: 24 }}>{p.icon}</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: '.1em' }}>{p.step}</span>
            </div>
            <div style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontSize: 18, fontWeight: 800, color: '#F2EFE8', marginBottom: 8 }}>{p.title}</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.75, color: 'var(--muted)' }}>{p.desc}</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div ref={pinRef} style={{ minHeight: '70vh', display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '100%' }}>
          <div style={{ position: 'relative', height: 320 }}>
            {PROSES_STEPS.map((p, i) => (
              <div
                key={p.step}
                ref={el => { stepRefs.current[i] = el }}
                style={{
                  position: 'absolute', inset: 0,
                  display: 'grid', gridTemplateColumns: '120px 1fr', gap: 40, alignItems: 'center',
                }}
              >
                <div style={{
                  width: 100, height: 100, borderRadius: '50%',
                  border: '1px solid var(--border)', background: '#0D0D0D',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 38, flexShrink: 0,
                }}>{p.icon}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14 }}>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: '#FF4D00', letterSpacing: '.1em' }}>{sectionNum}.{p.step}</span>
                    <div style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 900, color: '#F2EFE8', letterSpacing: '-0.02em' }}>{p.title}</div>
                  </div>
                  <p style={{ fontSize: 16, lineHeight: 1.85, color: 'var(--muted)', maxWidth: 560 }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Progress bar + step indicators */}
          <div style={{ marginTop: 48, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1, height: 2, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              <div ref={progressRef} style={{ height: '100%', width: '0%', background: '#FF4D00', borderRadius: 2 }} />
            </div>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: '.1em', whiteSpace: 'nowrap' }}>
              {String(PROSES_STEPS.length).padStart(2, '0')} Langkah
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Services — pinned GSAP scroll-story ──────────────── */
function ServicesScrollStory({ sectionNum }: { sectionNum: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])
  const numRefs = useRef<(HTMLDivElement | null)[]>([])
  const progressRef = useRef<HTMLDivElement>(null)
  const dotRefs = useRef<(HTMLDivElement | null)[]>([])
  // null = not yet detected. Avoids running GSAP pin on mobile before matchMedia runs.
  const [isDesktopStory, setIsDesktopStory] = useState<boolean | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(min-width:769px)')
    setIsDesktopStory(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setIsDesktopStory(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!isDesktopStory) return
    if (!wrapRef.current || !pinRef.current) return

    const steps = stepRefs.current.filter(Boolean) as HTMLDivElement[]
    const nums = numRefs.current.filter(Boolean) as HTMLDivElement[]
    const dots = dotRefs.current.filter(Boolean) as HTMLDivElement[]
    if (steps.length === 0) return

    let destroyed = false
    const n = steps.length
    let activeIndex = 0

    steps.forEach((el, i) => gsap.set(el, { opacity: i === 0 ? 1 : 0, x: i === 0 ? 0 : 60 }))
    nums.forEach((el, i) => gsap.set(el, { opacity: i === 0 ? 1 : 0, scale: i === 0 ? 1 : 0.85 }))
    dots.forEach((el, i) => gsap.set(el, { background: i === 0 ? SERVICES[0].color : 'var(--border)', scale: i === 0 ? 1.3 : 1 }))

    function goToStep(index: number) {
      if (index === activeIndex || destroyed) return
      const prevIndex = activeIndex
      activeIndex = index

      gsap.to(steps[prevIndex], { opacity: 0, x: index > prevIndex ? -60 : 60, duration: 0.3, ease: 'power2.in', overwrite: true })
      gsap.to(nums[prevIndex], { opacity: 0, scale: 0.85, duration: 0.3, ease: 'power2.in', overwrite: true })
      gsap.to(dots[prevIndex], { background: 'var(--border)', scale: 1, duration: 0.25, overwrite: true })

      gsap.fromTo(steps[index], { opacity: 0, x: index > prevIndex ? 60 : -60 }, { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out', overwrite: true })
      gsap.fromTo(nums[index], { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)', overwrite: true })
      gsap.to(dots[index], { background: SERVICES[index].color, scale: 1.3, duration: 0.25, overwrite: true })
    }

    const trigger = ScrollTrigger.create({
      trigger: wrapRef.current,
      start: 'top top',
      end: `+=${n * 100}%`,
      scrub: 0.3,
      pin: pinRef.current,
      pinSpacing: true,
      onUpdate: (self) => {
        if (destroyed) return
        if (progressRef.current) progressRef.current.style.width = `${self.progress * 100}%`
        const stepIndex = Math.min(n - 1, Math.floor(self.progress * n))
        goToStep(stepIndex)
      },
    })

    return () => {
      destroyed = true
      trigger.kill()
      // Clear GSAP inline styles so React can safely reclaim these DOM nodes
      steps.forEach(el => gsap.set(el, { clearProps: 'all' }))
      nums.forEach(el => gsap.set(el, { clearProps: 'all' }))
    }
  }, [isDesktopStory])

  if (isDesktopStory !== true) {
    // Mobile fallback (also covers null = not yet detected): simple stacked cards, no pin
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        {SERVICES.map((sv) => (
          <div key={sv.id} style={{ background: '#0D0D0D', border: '1px solid var(--border)', borderRadius: 8, padding: '28px 24px', borderLeft: `2px solid ${sv.color}` }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: sv.color, letterSpacing: '.1em', marginBottom: 10 }}>{sv.num}</div>
            <div style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontSize: 22, fontWeight: 900, color: '#F2EFE8', marginBottom: 6 }}>{sv.name}</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: sv.color, marginBottom: 14, opacity: 0.9 }}>{sv.tagline}</div>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--muted)', marginBottom: 16 }}>{sv.desc}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {sv.tags.map(t => (
                <span key={t} style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', border: `1px solid ${sv.color}30`, padding: '5px 12px', borderRadius: 100, color: sv.color }}>{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div ref={pinRef} style={{ minHeight: '70vh', display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '100%' }}>
          <div style={{ position: 'relative', height: 380 }}>
            {/* Giant background number for the active service */}
            <div style={{ position: 'absolute', top: -40, left: -10, height: 460, width: 280, overflow: 'hidden', pointerEvents: 'none' }}>
              {SERVICES.map((sv, i) => (
                <div
                  key={sv.id}
                  ref={el => { numRefs.current[i] = el }}
                  style={{
                    position: 'absolute', inset: 0,
                    fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 900,
                    fontSize: 280, lineHeight: 1, color: `${sv.color}14`,
                    display: 'flex', alignItems: 'center',
                  }}
                >{sv.num}</div>
              ))}
            </div>

            {SERVICES.map((sv, i) => (
              <div
                key={sv.id}
                ref={el => { stepRefs.current[i] = el }}
                style={{
                  position: 'absolute', inset: 0,
                  display: 'grid', gridTemplateColumns: '280px 1fr', gap: 8, alignItems: 'center',
                }}
              >
                <div />
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 8 }}>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: sv.color, letterSpacing: '.1em' }}>{sectionNum}.{sv.num}</span>
                    <div style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontSize: 'clamp(28px,3.5vw,46px)', fontWeight: 900, color: '#F2EFE8', letterSpacing: '-0.02em' }}>{sv.name}</div>
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, letterSpacing: '.06em', color: sv.color, marginBottom: 20, opacity: 0.9 }}>{sv.tagline}</div>
                  <p style={{ fontSize: 16, lineHeight: 1.85, color: 'var(--muted)', maxWidth: 540, marginBottom: 20 }}>{sv.desc}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {sv.tags.map(t => (
                      <span key={t} style={{
                        fontFamily: "'Space Mono', monospace", fontSize: 11,
                        letterSpacing: '.1em', textTransform: 'uppercase',
                        border: `1px solid ${sv.color}30`, padding: '6px 14px',
                        borderRadius: 100, color: sv.color,
                      }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress bar + step dots */}
          <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1, height: 2, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              <div ref={progressRef} style={{ height: '100%', width: '0%', background: '#FF4D00', borderRadius: 2 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {SERVICES.map((sv, i) => (
                <div
                  key={sv.id}
                  ref={el => { dotRefs.current[i] = el }}
                  style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? sv.color : 'var(--border)' }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────── */
export default function LandingPage() {
  const [s, setS] = useState<LandingSettings>(DEFAULT)
  const [scrolled, setScrolled] = useState(false)
  const visible = useReveal()
  const servicesParallax = useGsapParallax(0.18)
  const workParallax = useGsapParallax(0.22)
  const prosesParallax = useGsapParallax(0.18)
  const cursorRef = useRef<HTMLDivElement>(null)
  const cursorRingRef = useRef<HTMLDivElement>(null)
  const [cursorType, setCursorType] = useState<'default' | 'hover' | 'drag'>('default')
  const [isDesktop, setIsDesktop] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const navLinks: { href: string; label: string; icon: string }[] = [
    { href: '#services', label: 'Services', icon: 'M13 2 3 14h7l-1 8 11-13h-7l1-7z' },
    { href: '#work', label: 'Work', icon: 'M20 7h-3V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1ZM9 5h6v2H9Z' },
    { href: '#pricing', label: 'Pricing', icon: 'M20.59 13.41 11 23l-9-9V4a2 2 0 0 1 2-2h9.41a2 2 0 0 1 1.41.59l7 7a2 2 0 0 1 0 2.82ZM7 7h.01' },
    { href: '#proses', label: 'Proses', icon: 'M3 6h.01M3 12h.01M3 18h.01M8 6h13M8 12h13M8 18h13' },
  ]
  const navCapsuleRef = useRef<HTMLDivElement>(null)
  const navLinkRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const [activeSection, setActiveSection] = useState('')
  const [highlight, setHighlight] = useState({ left: 0, width: 0, opacity: 0 })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobilePanelRef = useRef<HTMLDivElement>(null)
  const mobileBtnRef = useRef<HTMLButtonElement>(null)

  // Inject page-level styles into <head> instead of rendering a <style> tag inside
  // the React tree. Inline <style> nodes are a known cause of React DOM reconciliation
  // errors on mobile (Google Translate, browser extensions, and StrictMode double-mounts
  // all risk modifying or removing them, triggering removeChild NotFoundError crashes).
  useEffect(() => {
    const id = 'iranza-live-styles'
    if (document.getElementById(id)) return // already injected

    const style = document.createElement('style')
    style.id = id
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@300;400;500;700;800;900&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

      :root {
        --ink: #0A0A0A; --ink2: #111111; --paper: #F2EFE8;
        --orange: #FF4D00; --purple: #7C3AED; --gold: #FFD600;
        --muted: rgba(242,239,232,0.35); --border: rgba(242,239,232,0.07);
      }
      * { box-sizing: border-box; }
      a { text-decoration: none; color: inherit; }
      button { border: none; background: none; font-family: inherit; cursor: pointer; }
      .cabinet { font-family: 'Cabinet Grotesk', sans-serif; }
      .mono { font-family: 'Space Mono', monospace; }
      .il-btn-pri { font-family: 'Cabinet Grotesk', sans-serif; font-size: 15px; font-weight: 800; letter-spacing: .02em; background: var(--orange); color: white; padding: 16px 36px; border-radius: 3px; display: inline-flex; align-items: center; gap: 10px; transition: transform .2s cubic-bezier(.23,1,.32,1), box-shadow .2s; }
      .il-btn-pri:hover { transform: translateY(-3px) scale(1.01); box-shadow: 0 20px 56px rgba(255,77,0,.4); }
      .il-btn-ghost { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); display: inline-flex; align-items: center; gap: 8px; transition: color .2s; }
      .il-btn-ghost:hover { color: var(--paper); }
      .il-nav-link { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); position: relative; transition: color .2s; }
      .il-nav-link::after { content: ''; position: absolute; bottom: -3px; left: 0; right: 0; height: 1px; background: var(--orange); transform: scaleX(0); transform-origin: left; transition: transform .3s cubic-bezier(.23,1,.32,1); }
      .il-nav-link:hover { color: var(--paper); }
      .il-nav-link:hover::after { transform: scaleX(1); }
      .il-pill { font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; background: var(--orange); color: white; padding: 11px 26px; border-radius: 100px; transition: background .25s, transform .2s, box-shadow .4s; display: inline-block; }
      .il-magnetic { transition: transform .22s cubic-bezier(.2,.8,.2,1); }
      .il-pill:hover { background: #e64400; transform: scale(1.03); }
      .il-pill.scrolled { box-shadow: 0 0 0 1px rgba(255,77,0,.4), 0 4px 24px rgba(255,77,0,.25); animation: il-pill-glow 3s ease-in-out infinite; }
      @keyframes il-pill-glow { 0%,100% { box-shadow: 0 0 0 1px rgba(255,77,0,.4), 0 4px 24px rgba(255,77,0,.25); } 50% { box-shadow: 0 0 0 1px rgba(255,77,0,.6), 0 4px 32px rgba(255,77,0,.5); } }
      .il-header-bar { transition: background .4s, backdrop-filter .4s, border-color .4s, padding .45s cubic-bezier(.23,1,.32,1); border-bottom: 1px solid transparent; }
      .il-header-bar.scrolled { background: rgba(10,10,10,.82); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom-color: var(--border); }
      .il-nav-capsule { display: flex; align-items: center; gap: 2px; position: relative; }
      .il-nav-highlight { position: absolute; top: 0; bottom: 0; left: 0; width: 0; border-radius: 100px; background: linear-gradient(135deg, rgba(255,77,0,.2), rgba(255,77,0,.06)); border: 1px solid rgba(255,77,0,.32); box-shadow: 0 0 16px rgba(255,77,0,.28); opacity: 0; pointer-events: none; transition: left .5s cubic-bezier(.23,1,.32,1), width .5s cubic-bezier(.23,1,.32,1), opacity .35s; }
      .il-nav-link-pill { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); padding: 9px 16px; border-radius: 100px; position: relative; z-index: 1; white-space: nowrap; display: flex; align-items: center; gap: 7px; transition: color .25s, background .25s; }
      .il-nav-link-pill:hover { color: var(--paper); background: rgba(242,239,232,.05); }
      .il-nav-link-pill.active { color: var(--paper); }
      .il-mobile-menu-btn { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 100px; border: 1px solid var(--border); background: rgba(242,239,232,.04); color: var(--paper); transition: background .25s, border-color .25s; }
      .il-mobile-menu-btn:active { background: rgba(255,77,0,.12); border-color: rgba(255,77,0,.3); }
      .il-mobile-panel { position: fixed; left: 12px; right: 12px; z-index: 499; border-radius: 18px; background: rgba(14,14,14,.92); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid var(--border); box-shadow: 0 20px 60px rgba(0,0,0,.5); overflow: hidden; animation: il-panel-in .3s cubic-bezier(.23,1,.32,1); }
      @keyframes il-panel-in { from { opacity: 0; transform: translateY(-10px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      .il-mobile-link { display: flex; align-items: center; gap: 12px; padding: 16px 20px; font-family: 'Space Mono', monospace; font-size: 13px; letter-spacing: .1em; text-transform: uppercase; color: var(--paper); border-bottom: 1px solid var(--border); transition: background .2s, padding-left .2s; }
      .il-mobile-link:last-child { border-bottom: none; }
      .il-mobile-link:active { background: rgba(255,77,0,.08); padding-left: 26px; }
      .il-mobile-link svg { color: var(--orange); flex-shrink: 0; }
      .il-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #EF4444; animation: il-pulse 1.5s ease-in-out infinite; }
      @keyframes il-pulse { 0% { box-shadow: 0 0 0 0 rgba(239,68,68,.7); } 70% { box-shadow: 0 0 0 10px rgba(239,68,68,0); } 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); } }
      .il-marquee { display: flex; width: max-content; animation: il-scroll 28s linear infinite; }
      .il-marquee.rev { animation-direction: reverse; animation-duration: 22s; }
      @keyframes il-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      .il-marquee-item { display: flex; align-items: center; gap: 18px; padding: 0 32px; font-family: 'Cabinet Grotesk', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--muted); white-space: nowrap; flex-shrink: 0; }
      .il-stat { transition: background .3s; }
      .il-stat:hover { background: rgba(255,77,0,0.03); }
      .il-price-row { display: grid; grid-template-columns: 52px 1fr 100px 110px; align-items: center; gap: 20px; padding: 20px 0; border-top: 1px solid rgba(242,239,232,0.04); position: relative; transition: background .2s; }
      .il-price-row:hover { background: rgba(255,77,0,0.03); }
      .il-price-row.feat::after { content: ''; position: absolute; left: -48px; right: -48px; top: 0; bottom: 0; background: rgba(255,77,0,0.05); pointer-events: none; }
      .il-wa-fab { position: fixed; bottom: 28px; right: 28px; z-index: 800; width: 56px; height: 56px; border-radius: 50%; background: #25D366; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 8px 32px rgba(37,211,102,0.45); transition: transform .2s, box-shadow .2s; }
      .il-wa-fab:hover { transform: scale(1.1); box-shadow: 0 12px 40px rgba(37,211,102,.6); }
      .il-footer-link { transition: color .2s; }
      .il-footer-link:hover { color: var(--orange); }
      .il-footer-link:hover .il-arr { transform: translate(2px,-2px); }
      .il-arr { transition: transform .2s; }
      .il-photo-card { border-radius: 8px; overflow: hidden; border: 1px solid var(--border); transition: border-color .3s, transform .4s cubic-bezier(.23,1,.32,1); cursor: pointer; }
      .il-photo-card:hover { border-color: rgba(255,77,0,.35); transform: scale(1.02) translateY(-4px); }
      .il-photo-card img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform .6s cubic-bezier(.23,1,.32,1); }
      .il-photo-card:hover img { transform: scale(1.05); }
      @media (max-width: 1024px) {
        .il-hero-bottom { grid-template-columns: 1fr 1fr !important; }
        .il-hero-cta { grid-column: 1/-1 !important; flex-direction: row !important; align-items: center !important; }
        .il-about-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        .il-cta-grid { grid-template-columns: 1fr !important; }
        .il-footer-grid { grid-template-columns: 1fr 1fr !important; }
      }
      @media (max-width: 768px) {
        .il-hero-h1 { font-size: clamp(44px,13vw,80px) !important; }
        .il-nav-links .il-nav-link { display: none !important; }
        .il-hero-bottom { grid-template-columns: 1fr !important; gap: 20px !important; }
        .il-stats-grid { grid-template-columns: 1fr !important; }
        .il-stat { border-right: none !important; border-bottom: 1px solid var(--border) !important; }
        .il-price-row { grid-template-columns: 40px 1fr auto !important; gap: 10px !important; }
        .il-pr-badge { display: none !important; }
        .il-footer-grid { grid-template-columns: 1fr !important; }
        .il-footer-bottom { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
        .il-photo-grid { grid-template-columns: 1fr 1fr !important; }
        .il-btn-pri { padding: 14px 24px !important; font-size: 14px !important; width: 100%; justify-content: center; }
        .il-wa-fab { bottom: 20px !important; right: 16px !important; width: 48px !important; height: 48px !important; font-size: 20px !important; }
        .il-price-row .il-price-name { font-size: 15px !important; }
      }
    `
    document.head.appendChild(style)
    return () => {
      // Clean up when component unmounts (e.g. navigating away from landing page)
      const el = document.getElementById(id)
      if (el) el.remove()
    }
  }, [])
  useEffect(() => {
    supabase.from('landing_settings').select('*').eq('id', 1).maybeSingle()
      .then(({ data }) => { if (data?.settings) setS({ ...DEFAULT, ...data.settings }) })
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(min-width:769px)')
    setIsDesktop(mq.matches)
    setIsMobile(!mq.matches)
  }, [])

  // Scroll handler — tracks header shrink state + which section is active
  useEffect(() => {
    const sectionIds = navLinks.map((n) => n.href.slice(1))
    const onScroll = () => {
      setScrolled(window.scrollY > 60)
      setMobileMenuOpen(false)
      let current = ''
      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 140 && rect.bottom > 140) { current = id; break }
        }
      }
      setActiveSection(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on outside tap
  useEffect(() => {
    if (!mobileMenuOpen) return
    const onTap = (e: MouseEvent) => {
      if (mobilePanelRef.current?.contains(e.target as Node)) return
      if (mobileBtnRef.current?.contains(e.target as Node)) return
      setMobileMenuOpen(false)
    }
    document.addEventListener('mousedown', onTap)
    return () => document.removeEventListener('mousedown', onTap)
  }, [mobileMenuOpen])

  // Slide the highlight pill under whichever nav link is currently active
  useEffect(() => {
    if (isMobile) return
    const key = activeSection ? `#${activeSection}` : ''
    const el = key ? navLinkRefs.current[key] : null
    const container = navCapsuleRef.current
    if (el && container) {
      const elRect = el.getBoundingClientRect()
      const contRect = container.getBoundingClientRect()
      setHighlight({ left: elRect.left - contRect.left, width: elRect.width, opacity: 1 })
    } else {
      setHighlight(h => ({ ...h, opacity: 0 }))
    }
  }, [activeSection, isMobile])

  // Custom cursor
  useEffect(() => {
    if (!isDesktop) return
    let mx = 0, my = 0, rx = 0, ry = 0, raf: number
    const move = (e: MouseEvent) => { mx = e.clientX; my = e.clientY }
    window.addEventListener('mousemove', move)
    const anim = () => {
      rx += (mx - rx) * 0.11
      ry += (my - ry) * 0.11
      if (cursorRef.current) {
        cursorRef.current.style.left = mx + 'px'
        cursorRef.current.style.top = my + 'px'
      }
      if (cursorRingRef.current) {
        cursorRingRef.current.style.left = rx + 'px'
        cursorRingRef.current.style.top = ry + 'px'
      }
      raf = requestAnimationFrame(anim)
    }
    anim()
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf) }
  }, [isDesktop])

  const wa = useCallback((msg: string) =>
    `https://wa.me/${s.whatsapp_number}?text=${encodeURIComponent(msg)}`, [s.whatsapp_number])
  const phone = s.whatsapp_number.replace('62', '0').replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3')

  const rv = (id: string, delay = 0): React.CSSProperties => ({
    opacity: visible.has(id) ? 1 : 0,
    transform: visible.has(id) ? 'none' : 'translateY(40px)',
    transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
  })

  const addCursorTarget = (type: 'hover' | 'drag', opts?: { magnetic?: boolean; strength?: number }) => {
    const magnetic = !!opts?.magnetic && isDesktop
    const strength = opts?.strength ?? 0.3
    return {
      onMouseEnter: () => setCursorType(type),
      onMouseMove: magnetic ? (e: React.MouseEvent<HTMLElement>) => {
        const el = e.currentTarget
        const rect = el.getBoundingClientRect()
        const relX = e.clientX - rect.left - rect.width / 2
        const relY = e.clientY - rect.top - rect.height / 2
        el.style.transform = `translate(${relX * strength}px, ${relY * strength}px)`
      } : undefined,
      onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
        setCursorType('default')
        if (magnetic) (e.currentTarget as HTMLElement).style.transform = ''
      },
    }
  }

  const hasPhotos = s.hero_photos && s.hero_photos.length > 0

  return (
    <div
      translate="no"
      style={{
        background: '#0A0A0A',
        color: '#F2EFE8',
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 300,
        overflowX: 'hidden',
        WebkitFontSmoothing: 'antialiased',
        cursor: isDesktop ? 'none' : 'auto',
      }}
    >
      {/* ── CUSTOM CURSOR ── */}
      {isDesktop && (
        <>
          <div ref={cursorRef} style={{
            position: 'fixed', zIndex: 9999, pointerEvents: 'none',
            width: cursorType === 'drag' ? 48 : cursorType === 'hover' ? 12 : 8,
            height: cursorType === 'drag' ? 48 : cursorType === 'hover' ? 12 : 8,
            background: cursorType === 'drag' ? 'transparent' : '#F2EFE8',
            border: cursorType === 'drag' ? '2px solid rgba(242,239,232,0.5)' : 'none',
            borderRadius: '50%',
            transform: 'translate(-50%,-50%)',
            transition: 'width .3s cubic-bezier(.23,1,.32,1), height .3s, background .3s',
            mixBlendMode: cursorType === 'drag' ? 'normal' : 'difference',
          }} />
          <div ref={cursorRingRef} style={{
            position: 'fixed', zIndex: 9998, pointerEvents: 'none',
            width: cursorType === 'hover' ? 48 : 36,
            height: cursorType === 'hover' ? 48 : 36,
            border: '1px solid rgba(242,239,232,0.25)',
            borderRadius: '50%',
            transform: 'translate(-50%,-50%)',
            opacity: cursorType === 'drag' ? 0 : 1,
            transition: 'width .35s cubic-bezier(.23,1,.32,1), height .35s, opacity .25s',
          }} />
        </>
      )}

      {/* ── WA FAB ── */}
      <a href={wa('Halo Iranza Live')} className="il-wa-fab il-magnetic" target="_blank" rel="noopener" {...addCursorTarget('hover', { magnetic: true, strength: 0.4 })}>💬</a>

      {/* ── NAVBAR ── */}
      <nav className={`il-header-bar${scrolled ? ' scrolled' : ''}`} style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
        padding: isMobile ? '12px 16px' : scrolled ? '12px 32px' : '20px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? undefined : 'linear-gradient(to bottom, rgba(10,10,10,0.7) 0%, rgba(10,10,10,0.3) 60%, transparent 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <BrandLogo logoUrl={s.logo_url} size={isMobile ? 34 : scrolled ? 38 : 52} />
        </div>

        {!isMobile && (
          <div ref={navCapsuleRef} className="il-nav-capsule">
            <div className="il-nav-highlight" style={{ left: highlight.left, width: highlight.width, opacity: highlight.opacity }} />
            {navLinks.map(({ href, label, icon }) => (
              <a
                key={href}
                href={href}
                ref={(el) => { navLinkRefs.current[href] = el }}
                className={`il-nav-link-pill${activeSection === href.slice(1) ? ' active' : ''}`}
                {...addCursorTarget('hover')}
              >
                <NavIcon d={icon} />
                {label}
              </a>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a
            href={wa('Halo Iranza Live, mau booking')}
            className={`il-pill il-magnetic${scrolled ? ' scrolled' : ''}`}
            target="_blank"
            {...addCursorTarget('hover', { magnetic: true })}
          >
            Book Now
          </a>
          {isMobile && (
            <button
              ref={mobileBtnRef}
              type="button"
              aria-label="Menu"
              aria-expanded={mobileMenuOpen}
              className="il-mobile-menu-btn"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              {mobileMenuOpen
                ? <NavIcon d="M18 6 6 18M6 6l12 12" size={18} />
                : <NavIcon d="M3 6h18M3 12h18M3 18h18" size={18} />}
            </button>
          )}
        </div>
      </nav>

      {/* ── MOBILE MENU PANEL ── */}
      {isMobile && mobileMenuOpen && (
        <div ref={mobilePanelRef} className="il-mobile-panel" style={{ top: 64 }}>
          {navLinks.map(({ href, label, icon }) => (
            <a key={href} href={href} className="il-mobile-link" onClick={() => setMobileMenuOpen(false)}>
              <NavIcon d={icon} size={16} />
              {label}
            </a>
          ))}
        </div>
      )}



      {/* Explicit spacer reserving room for the fixed navbar above — this
          is a real block-level element in normal document flow, so it
          reliably pushes the hero section down regardless of viewport
          height, flexbox alignment, or Three.js canvas behavior inside
          the hero. More robust than relying on padding/vh tricks alone. */}
      <div style={{ height: 110 }} />

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section style={{
        minHeight: 'calc(100vh - 110px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: isMobile ? '24px 20px 48px' : '40px 48px 80px',
        position: 'relative', overflow: 'hidden',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Three.js canvas */}
        <ThreeCanvas />

        {/* Subtle grid */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'linear-gradient(rgba(242,239,232,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(242,239,232,0.04) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, black 20%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, black 20%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Glow blobs */}
        <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,77,0,.1) 0%, transparent 65%)', top: -200, right: -100, pointerEvents: 'none', zIndex: 1 }} />
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,.08) 0%, transparent 70%)', bottom: 100, left: -80, pointerEvents: 'none', zIndex: 1 }} />

        {/* Headline */}
        <h1 className="il-hero-h1" style={{
          position: 'relative', zIndex: 3,
          fontFamily: "'Cabinet Grotesk', sans-serif",
          fontWeight: 900,
          fontSize: 'clamp(64px,11vw,150px)',
          lineHeight: 0.92, letterSpacing: '-0.03em',
          color: '#F2EFE8', marginBottom: isMobile ? 28 : 48,
        }}>
          {s.hero_headline_1}<br />
          <em style={{ fontStyle: 'italic', color: '#FF4D00', WebkitTextStroke: '0px', fontWeight: 900 }}>{s.hero_headline_2}</em>
        </h1>

        {/* Bottom bar */}
        <div className="il-hero-bottom" style={{
          position: 'relative', zIndex: 3,
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
          gap: isMobile ? 20 : 32, alignItems: 'end',
          paddingTop: isMobile ? 20 : 32, borderTop: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--muted)', maxWidth: 320 }}>{s.hero_subtext}</p>

          <div style={{ display: 'flex', gap: 40 }}>
            {[['4', '×', '#FF4D00', 'Slot / Hari'], ['2', 'J', '#FFD600', 'Per Sesi'], ['2', '', '#FF4D00', 'Platform']].map(([n, sup, c, label]) => (
              <div key={label}>
                <div style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontSize: 38, fontWeight: 900, color: '#F2EFE8', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {n}<span style={{ color: c }}>{sup}</span>
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 8 }}>{label}</div>
              </div>
            ))}
          </div>

          <div className="il-hero-cta" style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: 14 }}>
            <a href={wa('Halo Iranza Live, saya mau booking live streaming')} className="il-btn-pri il-magnetic" target="_blank" {...addCursorTarget('hover', { magnetic: true })}>
              Mulai Sekarang <span>→</span>
            </a>
            <a href="#pricing" className="il-btn-ghost" {...addCursorTarget('hover')}>
              Lihat Harga <span>↓</span>
            </a>
          </div>
        </div>

        {/* Photo strip dihapus — foto tampil di section #Work */}
      </section>

      {/* ── MARQUEE 1 ── */}
      <div style={{ overflow: 'hidden', padding: '14px 0', borderBottom: '1px solid var(--border)', background: '#0A0A0A' }}>
        <div className="il-marquee">
          {[...MARQUEE_1, ...MARQUEE_1].map((m, i) => (
            <div key={i} className="il-marquee-item"><span style={{ color: '#FF4D00', fontSize: 18 }}>●</span> {m}</div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          SERVICES
      ══════════════════════════════════════════════ */}
      <section id="services" ref={servicesParallax.sectionRef} style={{ padding: isMobile ? '60px 20px' : '100px 48px', borderBottom: '1px solid var(--border)', background: '#0D0D0D', position: 'relative', overflow: 'hidden' }}>
        {/* Parallax decorative number — moves at a different speed than content via GSAP ScrollTrigger.
            Outer div handles static vertical centering; inner div (bgRef) is fully owned by GSAP. */}
        <div style={{ position: 'absolute', top: '50%', right: '4%', transform: 'translateY(-50%)', zIndex: 0 }}>
          <div ref={servicesParallax.bgRef} style={{
            fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 900,
            fontSize: 'clamp(180px,26vw,420px)', lineHeight: 1,
            color: 'rgba(255,77,0,0.035)', userSelect: 'none', pointerEvents: 'none',
            willChange: 'transform',
          }}>01</div>
        </div>

        {!isMobile && (
          <div style={{ position: 'absolute', top: '8%', right: '6%', width: 340, height: 340, zIndex: 0, opacity: 0.5 }}>
            <FloatingShape3D shape="icosahedron" color={0xFF4D00} size={1.5} />
          </div>
        )}

        <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Section header */}
          <div data-rid="svc-h" style={{ ...rv('svc-h'), display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '200px 1fr', gap: isMobile ? 8 : 40, marginBottom: isMobile ? 36 : 72, alignItems: 'start' }}>
            <SplitWords as="span" style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', paddingTop: 8, display: 'inline-block' }}>01 — Services</SplitWords>
            <div>
              <SplitHeading style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 900, fontSize: 'clamp(34px,4vw,56px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: '#F2EFE8' }}>
                Kami kelola <em style={{ color: '#FF4D00' }}>semuanya</em><br />— kamu fokus produk.
              </SplitHeading>
              <p style={{ marginTop: 20, fontSize: 15, lineHeight: 1.85, color: 'var(--muted)', maxWidth: 480 }}>
                Tim dedicated yang berdedikasi — setiap sesi dirancang untuk menciptakan momen live yang engaging, memorable, dan yang paling penting: menghasilkan penjualan.
              </p>
            </div>
          </div>

          {/* Service rows — pinned GSAP scroll-story */}
          <div data-rid="svc-grid" style={rv('svc-grid', 100)}>
            <ServicesScrollStory sectionNum="01" />
          </div>
        </div>
      </section>

      {/* ── MARQUEE 2 — orange ── */}
      <div style={{ overflow: 'hidden', padding: '14px 0', background: '#FF4D00' }}>
        <div className="il-marquee rev">
          {[...MARQUEE_2, ...MARQUEE_2].map((m, i) => (
            <div key={i} className="il-marquee-item" style={{ color: 'rgba(255,255,255,0.85)' }}>
              <span style={{ color: 'white', fontSize: 18 }}>★</span> {m}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          WORK / PHOTO GALLERY (dari Cloudinary admin)
          Selalu render — kalau belum ada foto, tampilkan fallback jujur
          alih-alih section kosong (supaya anchor #work selalu punya isi).
      ══════════════════════════════════════════════ */}
      <section id="work" ref={workParallax.sectionRef} style={{ padding: isMobile ? '60px 20px' : '100px 48px', borderBottom: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
        {/* Parallax decorative number */}
        <div style={{ position: 'absolute', top: '50%', left: '4%', transform: 'translateY(-50%)', zIndex: 0 }}>
          <div ref={workParallax.bgRef} style={{
            fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 900,
            fontSize: 'clamp(180px,26vw,420px)', lineHeight: 1,
            color: 'rgba(124,58,237,0.04)', userSelect: 'none', pointerEvents: 'none',
            willChange: 'transform',
          }}>02</div>
        </div>

        <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          <div data-rid="work-h" style={{ ...rv('work-h'), display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '200px 1fr', gap: isMobile ? 8 : 40, marginBottom: isMobile ? 36 : 64, alignItems: 'start' }}>
            <SplitWords as="span" style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', paddingTop: 8, display: 'inline-block' }}>02 — Work</SplitWords>
            <div>
              <SplitHeading style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 900, fontSize: 'clamp(34px,4vw,56px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: '#F2EFE8' }}>
                Di balik layar <em style={{ color: '#FF4D00' }}>studio kami.</em>
              </SplitHeading>
              <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.8, color: 'var(--muted)', maxWidth: 440 }}>
                {hasPhotos
                  ? 'Setup profesional, host terlatih, atmosfer yang mendorong penjualan — lihat sendiri.'
                  : 'Kami sedang menyiapkan dokumentasi studio. Sementara ini, ini yang bisa kami pastikan soal setup kami.'}
              </p>
            </div>
          </div>

          {hasPhotos ? (
            <>
              {!isMobile && (
                <div
                  data-rid="work-feature"
                  style={{ ...rv('work-feature', 60), marginBottom: 28, position: 'relative' }}
                >
                  <DistortedImage
                    src={getCloudinaryThumbnail(s.hero_photos[0].cloudinary_url, 1400, 560)}
                    alt={s.hero_photos[0].caption || 'Studio Iranza Live'}
                    style={{ width: '100%', height: 420, borderRadius: 12, border: '1px solid var(--border)' }}
                  />
                  <span style={{
                    position: 'absolute', bottom: 16, left: 16,
                    fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase',
                    color: 'rgba(242,239,232,0.65)', background: 'rgba(10,10,10,0.55)', backdropFilter: 'blur(8px)',
                    padding: '6px 12px', borderRadius: 100, pointerEvents: 'none',
                  }}>
                    ↝ Gerakkan kursor di atas foto
                  </span>
                </div>
              )}
              <div
                data-rid="work-photos"
                style={{
                  ...rv('work-photos', 100),
                  // Desktop: bleed out of the container to full viewport width
                  // Mobile: reset margin to 0, negative bleed breaks layout on narrow screens
                  marginLeft: isMobile ? 0 : 'calc(-1 * ((100vw - 1240px) / 2))',
                  marginRight: isMobile ? 0 : 'calc(-1 * ((100vw - 1240px) / 2))',
                  overflow: 'hidden',
                }}
              >
                <PhotoStrip photos={s.hero_photos} inline />
              </div>
            </>
          ) : (
            /* Honest fallback — no fake photos, just what we can verify in text */
            <div
              data-rid="work-fallback"
              style={{
                ...rv('work-fallback', 100),
                display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 12,
              }}
            >
              {[
                { icon: '🎥', title: 'Kamera & Lighting', desc: 'Setup video HD dengan pencahayaan yang konsisten untuk tampilan produk yang jelas.' },
                { icon: '🎙️', title: 'Audio Bersih', desc: 'Mic dedicated untuk host, minim noise — penonton dengar penjelasan produk dengan jelas.' },
                { icon: '💻', title: 'Studio Indoor', desc: 'Ruang tertutup dengan koneksi internet stabil, didesain khusus untuk sesi live jualan.' },
              ].map((item, i) => (
                <div key={i} style={{
                  border: '1px solid var(--border)', borderRadius: 8,
                  padding: '32px 24px', background: '#0D0D0D',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 16 }}>{item.icon}</div>
                  <div style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontSize: 16, fontWeight: 800, color: '#F2EFE8', marginBottom: 8 }}>{item.title}</div>
                  <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          ABOUT / STATS
      ══════════════════════════════════════════════ */}
      <section id="about" style={{ padding: isMobile ? '60px 20px' : '100px 48px', borderBottom: '1px solid var(--border)', background: '#0D0D0D' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>

          <div data-rid="about-h" style={{ ...rv('about-h'), display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '200px 1fr', gap: isMobile ? 8 : 40, marginBottom: isMobile ? 36 : 72, alignItems: 'start' }}>
            <SplitWords as="span" style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', paddingTop: 8, display: 'inline-block' }}>03 — About</SplitWords>
            <SplitHeading style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 900, fontSize: 'clamp(34px,4vw,56px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: '#F2EFE8' }}>
              Kami ada untuk <em style={{ color: '#FF4D00' }}>hasilkan penjualan</em>,<br />bukan sekadar tampil.
            </SplitHeading>
          </div>

          <div className="il-about-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80, alignItems: 'start', marginBottom: isMobile ? 36 : 80 }}>
            <div data-rid="about-1" style={rv('about-1')}>
              <SplitHeading as="p" step={20} style={{
                fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 700,
                fontSize: 'clamp(24px,2.8vw,40px)', lineHeight: 1.35, letterSpacing: '-0.02em',
                color: '#F2EFE8',
              }}>
                Toko kamu punya produk bagus.<br />
                Masalahnya, <em style={{ color: '#FF4D00' }}>tidak ada yang tahu.</em><br /><br />
                Kami ubah itu.
              </SplitHeading>
            </div>
            <div data-rid="about-2" style={rv('about-2')}>
              <p style={{ fontSize: 15, lineHeight: 1.9, color: 'var(--muted)', marginBottom: 36 }}>
                Iranza Live adalah jasa live streaming profesional yang dirancang khusus untuk{' '}
                <strong style={{ color: 'rgba(242,239,232,0.8)', fontWeight: 500 }}>UMKM Indonesia</strong>.
                Kami menyediakan host terlatih, studio lengkap, dan strategi penjualan berbasis data yang terbukti
                meningkatkan konversi — di{' '}
                <strong style={{ color: 'rgba(242,239,232,0.8)', fontWeight: 500 }}>Shopee Live</strong> maupun{' '}
                <strong style={{ color: 'rgba(242,239,232,0.8)', fontWeight: 500 }}>TikTok Shop</strong>.
                <br /><br />
                Kamu fokus di produk dan operasional toko. Kami urus semuanya di depan kamera — dari persiapan,
                eksekusi live, sampai laporan hasil sesi yang kamu terima setiap selesai.
              </p>
              <a href={wa('Halo Iranza Live, mau konsultasi gratis')} className="il-btn-pri il-magnetic" target="_blank" style={{ fontSize: 14, padding: '14px 28px' }} {...addCursorTarget('hover', { magnetic: true })}>
                Konsultasi Gratis →
              </a>
            </div>
          </div>

          {/* What we actually provide — concrete, not inflated numbers */}
          <div
            className="il-stats-grid"
            data-rid="stats-wrap"
            style={{
              ...rv('stats-wrap'),
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              border: '1px solid var(--border)',
            }}
          >
            {[
              { icon: '🎙️', label: 'Host Terlatih', sub: 'Fokus teknik penjualan live, bukan sekadar baca script produk' },
              { icon: '📹', label: 'Studio Siap Pakai', sub: 'Lighting, kamera, audio — tinggal datang bawa produk' },
              { icon: '📊', label: 'Laporan Tiap Sesi', sub: 'Viewers, engagement, dan hasil — kamu lihat sendiri datanya' },
            ].map((st, i) => (
              <div key={i} className="il-stat" style={{
                padding: isMobile ? '28px 20px' : '44px 40px',
                borderRight: i < 2 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ fontSize: 32, marginBottom: 18 }}>{st.icon}</div>
                <SplitWords as="div" step={18} style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: '#F2EFE8', marginBottom: 6 }}>{st.label}</SplitWords>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>{st.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════ */}
      <section id="pricing" style={{ padding: isMobile ? '60px 20px' : '100px 48px', borderBottom: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
        {!isMobile && (
          <div style={{ position: 'absolute', top: '4%', left: '2%', width: 300, height: 300, zIndex: 0, opacity: 0.4 }}>
            <FloatingShape3D shape="torus" color={0x7C3AED} size={1.3} />
          </div>
        )}
        <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          <div data-rid="price-h" style={{ ...rv('price-h'), display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '200px 1fr', gap: isMobile ? 8 : 40, marginBottom: isMobile ? 36 : 72, alignItems: 'start' }}>
            <SplitWords as="span" style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', paddingTop: 8, display: 'inline-block' }}>04 — Pricing</SplitWords>
            <div>
              <SplitHeading style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 900, fontSize: 'clamp(34px,4vw,56px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: '#F2EFE8' }}>
                Promo Launching. <em style={{ color: '#FF4D00' }}>Terbatas.</em>
              </SplitHeading>
              <p style={{ marginTop: 18, fontSize: 15, lineHeight: 1.8, color: 'var(--muted)', maxWidth: 480 }}>
                Harga ini tidak akan berlaku selamanya. 4 slot per hari, first come first served.
              </p>
            </div>
          </div>

          {[
            {
              icon: '☀️', label: 'Slot Pagi & Siang', time: s.slot_pagi_times,
              rows: [
                { icon: '🛒', name: 'Live Shopee', desc: '2 jam · 1 host · Pagi', badge: 'Pagi', price: s.prices.pagi_shopee },
                { icon: '🎵', name: 'Live TikTok Shop', desc: '2 jam · 1 host · Pagi', badge: 'Pagi', price: s.prices.pagi_tiktok },
                { icon: '🔥', name: 'Dual Platform', desc: 'Shopee + TikTok · 2 jam', badge: 'Best Value', price: s.prices.pagi_dual, feat: true },
              ],
            },
            {
              icon: '🌙', label: 'Slot Sore & Malam', time: s.slot_malam_times,
              rows: [
                { icon: '🛒', name: 'Live Shopee', desc: '2 jam · 1 host · Prime time', badge: 'Malam', price: s.prices.malam_shopee },
                { icon: '🎵', name: 'Live TikTok Shop', desc: '2 jam · 1 host · Prime time', badge: 'Malam', price: s.prices.malam_tiktok },
                { icon: '🔥', name: 'Dual Platform', desc: 'Shopee + TikTok · Prime time', badge: 'Best Value', price: s.prices.malam_dual, feat: true },
              ],
            },
          ].map((slot, si) => (
            <div key={si} data-rid={`slot-${si}`} style={{ ...rv(`slot-${si}`, si * 100), marginBottom: 52 }}>
              <div style={{
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                padding: '20px 0', borderTop: '1px solid var(--border)',
              }}>
                <div style={{
                  fontFamily: "'Cabinet Grotesk', sans-serif", fontSize: isMobile ? 17 : 20, fontWeight: 800,
                  color: '#F2EFE8', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 4 : 12,
                }}>
                  <span>{slot.icon} {slot.label}</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '.1em', color: 'var(--muted)', fontWeight: 400 }}>
                    {slot.time}
                  </span>
                </div>
              </div>

              <div style={{ borderBottom: '1px solid var(--border)' }}>
                {slot.rows.map((row, ri) => (
                  <div key={ri} className={`il-price-row${row.feat ? ' feat' : ''}`}>
                    <div style={{
                      width: 44, height: 44,
                      border: '1px solid var(--border)', borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, flexShrink: 0, position: 'relative', zIndex: 1,
                    }}>{row.icon}</div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: '#F2EFE8' }}>{row.name}</div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 3 }}>{row.desc}</div>
                    </div>

                    <span className="il-pr-badge" style={{
                      fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase',
                      color: '#FF4D00', border: '1px solid rgba(255,77,0,.3)', padding: '5px 10px', borderRadius: 3,
                      position: 'relative', zIndex: 1,
                    }}>{row.badge}</span>

                    <div style={{
                      fontFamily: "'Cabinet Grotesk', sans-serif", fontSize: isMobile ? 24 : 30, fontWeight: 900,
                      color: '#F2EFE8', letterSpacing: '-0.02em', textAlign: 'right',
                      whiteSpace: 'nowrap', position: 'relative', zIndex: 1,
                    }}>
                      {row.price}
                      <span style={{ fontSize: 13, fontFamily: "'Space Mono', monospace", color: 'var(--muted)', marginLeft: 3, fontWeight: 400 }}>rb</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* CTA bar */}
          <div data-rid="price-cta" style={{
            ...rv('price-cta', 200),
            display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
            alignItems: 'center', gap: isMobile ? 20 : 32,
            background: '#FF4D00', padding: isMobile ? '28px 24px' : '30px 44px', borderRadius: 4,
          }}>
            <div>
              <div style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontSize: isMobile ? 20 : 26, fontWeight: 900, color: 'white' }}>⚡ Terbatas 4 Slot Per Hari</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Harga promo launching — book sekarang sebelum slot penuh.</div>
            </div>
            <a
              href={wa('Halo Iranza Live, mau book slot promo!')}
              target="_blank"
              className="il-magnetic"
              style={{
                fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, letterSpacing: '.12em',
                textTransform: 'uppercase', background: 'white', color: '#FF4D00',
                padding: '14px 24px', borderRadius: 3, whiteSpace: 'nowrap',
                display: 'block', textAlign: 'center',
              }}
              {...addCursorTarget('hover', { magnetic: true })}
            >
              Book via WhatsApp →
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          APA YANG KAMU DAPAT (proses kerja — jujur, tanpa testimoni fiktif)
      ══════════════════════════════════════════════ */}
      <section id="proses" ref={prosesParallax.sectionRef} style={{ padding: isMobile ? '60px 20px 0' : '100px 48px 0', borderBottom: '1px solid var(--border)', background: '#0D0D0D', position: 'relative', overflow: 'hidden' }}>
        {/* Parallax decorative number */}
        <div style={{ position: 'absolute', top: '30%', right: '4%', transform: 'translateY(-50%)', zIndex: 0 }}>
          <div ref={prosesParallax.bgRef} style={{
            fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 900,
            fontSize: 'clamp(180px,26vw,420px)', lineHeight: 1,
            color: 'rgba(255,214,0,0.035)', userSelect: 'none', pointerEvents: 'none',
            willChange: 'transform',
          }}>05</div>
        </div>

        <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 1, paddingBottom: isMobile ? 60 : 100 }}>

          <div data-rid="proses-h" style={{ ...rv('proses-h'), display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '200px 1fr', gap: isMobile ? 8 : 40, marginBottom: isMobile ? 36 : 64, alignItems: 'start' }}>
            <SplitWords as="span" style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', paddingTop: 8, display: 'inline-block' }}>
              05 — Proses
            </SplitWords>
            <div>
              <SplitHeading style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 900, fontSize: 'clamp(34px,4vw,56px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: '#F2EFE8' }}>
                Apa yang kamu <em style={{ color: '#FF4D00' }}>dapat</em> dari kami.
              </SplitHeading>
              <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.8, color: 'var(--muted)', maxWidth: 460 }}>
                Kami masih tahap awal membangun Iranza Live — jujur soal itu. Yang bisa kami pastikan: prosesnya jelas, dan kamu lihat sendiri hasilnya tiap sesi.
              </p>
            </div>
          </div>

          <div data-rid="proses-grid" style={rv('proses-grid', 100)}>
            <ProsesScrollStory sectionNum="05" />
          </div>

          {/* Honest note */}
          <div data-rid="proses-note" style={{
            ...rv('proses-note', 200),
            marginTop: 32, padding: '20px 28px',
            border: '1px solid rgba(255,77,0,.2)', borderRadius: 4,
            background: 'rgba(255,77,0,.04)',
            display: 'flex', gap: 16, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>💬</span>
            <p style={{ fontSize: 13.5, lineHeight: 1.8, color: 'var(--muted)' }}>
              Kami baru mulai melayani klien live streaming dan masih membangun jam terbang.
              Yang kami tawarkan bukan jaminan viral, tapi proses kerja yang serius dan transparan —
              host yang fokus, studio yang siap, dan laporan yang bisa kamu cek sendiri tiap sesi selesai.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════ */}
      <section style={{ background: '#F2EFE8', padding: isMobile ? '64px 20px' : '110px 48px', position: 'relative', overflow: 'hidden' }}>
        {/* Big bg text */}
        <div style={{
          position: 'absolute',
          fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 900,
          fontSize: 'clamp(80px,14vw,200px)', letterSpacing: '-0.04em',
          color: 'rgba(0,0,0,0.045)', whiteSpace: 'nowrap',
          top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          pointerEvents: 'none', userSelect: 'none', lineHeight: 1,
        }}>LIVE LIVE LIVE</div>

        <div className="il-cta-grid" data-rid="cta-inner" style={{
          ...rv('cta-inner'),
          maxWidth: 1240, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr auto',
          gap: isMobile ? 36 : 80, alignItems: 'center', position: 'relative', zIndex: 1,
        }}>
          <div>
            <SplitHeading style={{
              fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 900,
              fontSize: 'clamp(36px,5vw,70px)', lineHeight: 1, letterSpacing: '-0.03em',
              color: '#0A0A0A',
            }}>
              Toko kamu bisa<br />lebih <em style={{ color: '#FF4D00' }}>ramai dari ini.</em>
            </SplitHeading>
            <p style={{ marginTop: 20, fontSize: 16, lineHeight: 1.75, color: 'rgba(10,10,10,0.45)', maxWidth: 460 }}>
              Satu sesi live bisa mengubah hari yang sepi jadi hari yang ramai. Slot terbatas — book sekarang.
            </p>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <a href={`tel:+${s.whatsapp_number}`} style={{
              fontFamily: "'Cabinet Grotesk', sans-serif", fontSize: isMobile ? '16px' : 'clamp(16px,2vw,24px)',
              fontWeight: 800, color: '#0A0A0A', display: 'block', marginBottom: 20,
            }}>📞 {phone}</a>
            <a
              href={wa('Halo Iranza Live, saya mau booking live streaming')}
              target="_blank"
              style={{
                fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700,
                letterSpacing: '.12em', textTransform: 'uppercase',
                background: '#0A0A0A', color: '#F2EFE8',
                padding: '16px 32px', borderRadius: 3,
                display: 'inline-flex', alignItems: 'center', gap: 10,
                transition: 'background .2s, transform .2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-3px)'; setCursorType('hover') }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'none'; setCursorType('default') }}
            >
              Chat WhatsApp Sekarang →
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0A0A0A', padding: isMobile ? '0 20px' : '0 48px', borderTop: '1px solid var(--border)' }}>
        <div className="il-footer-grid" style={{
          display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr',
          gap: isMobile ? 32 : 40, padding: isMobile ? '40px 0' : '56px 0', borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <div style={{ marginBottom: 20 }}>
              <BrandLogo logoUrl={s.logo_url} size={48} />
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--muted)', maxWidth: 260 }}>
              Creative Agency untuk live streaming UMKM Indonesia. Shopee & TikTok Shop.
            </p>
          </div>
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 20 }}>Layanan</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['#services', 'Shopee Live'], ['#services', 'TikTok Shop Live'], ['#services', 'Dual Platform'], ['#pricing', 'Harga']].map(([href, label]) => (
                <a key={label} href={href} className="il-footer-link" style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: '#F2EFE8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {label} <span className="il-arr" style={{ fontSize: 12 }}>↗</span>
                </a>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 20 }}>Kontak</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                [wa('Halo Iranza Live'), 'WhatsApp', true],
                ['#proses', 'Proses Kerja', false],
                ['#about', 'About Us', false],
              ].map(([href, label, ext]) => (
                <a key={label as string} href={href as string} target={ext ? '_blank' : undefined} rel={ext ? 'noopener' : undefined} className="il-footer-link" style={{ fontFamily: "'Cabinet Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: '#F2EFE8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {label} <span className="il-arr" style={{ fontSize: 12 }}>↗</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="il-footer-bottom" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 0', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            © 2026 Iranza Live. Creative Agency. All rights reserved.
          </span>
          <a href={wa('Halo Iranza Live')} target="_blank" style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: '#25D366', display: 'flex', alignItems: 'center', gap: 8 }}>
            💚 {phone}
          </a>
        </div>

        <Link to="/login" style={{ position: 'fixed', bottom: 8, left: 8, fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'rgba(242,239,232,0.1)', textTransform: 'uppercase', letterSpacing: '.1em', zIndex: 50 }}>
          Admin
        </Link>
      </footer>
    </div>
  )
}
