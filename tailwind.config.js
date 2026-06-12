/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Bebas Neue', 'cursive'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: '#080b10',
        surface: '#0e1318',
        surface2: '#131920',
        border: 'rgba(255,255,255,0.07)',
        accent: '#00e5ff',
        accent2: '#ff3d6b',
        accent3: '#a3ff6b',
        gold: '#ffc93c',
        studio1: '#00e5ff',
        studio2: '#ff3d6b',
        muted: '#5c6b7a',
      },
      animation: {
        pulse2: 'pulse2 1.5s ease-in-out infinite',
        slideIn: 'slideIn 0.3s ease forwards',
        fadeUp: 'fadeUp 0.4s ease forwards',
      },
      keyframes: {
        pulse2: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.4 },
        },
        slideIn: {
          from: { opacity: 0, transform: 'translateX(-10px)' },
          to: { opacity: 1, transform: 'translateX(0)' },
        },
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
