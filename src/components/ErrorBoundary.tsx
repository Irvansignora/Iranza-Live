import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Catches render-time errors anywhere below it in the tree and shows a
 * branded fallback instead of letting the whole app unmount.
 *
 * Without this, an uncaught error in ANY component (a bad date format, a
 * null reference from an unexpected API shape, etc.) takes down the
 * entire React tree. Since the page's own CSS sets a near-black
 * background on html/body/#root, the user just sees a blank black
 * screen with no indication anything went wrong — exactly the "blank
 * hitam" symptom this is meant to prevent.
 *
 * Note: this only catches errors during React's render/commit phase. It
 * does NOT catch errors thrown synchronously at module-import time
 * (e.g. a `throw` at the top of a file before React even starts
 * rendering) — that class of bug has to be fixed at the source instead
 * (see src/lib/supabase.ts for an example of avoiding it).
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught a render error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: 24,
            textAlign: 'center',
            background: '#0A0A0A',
            color: '#F2EFE8',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <div style={{ fontSize: 15, letterSpacing: '.04em', opacity: 0.7 }}>
            Halaman gagal dimuat.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              background: '#FF4D00',
              color: 'white',
              padding: '11px 26px',
              borderRadius: 100,
              cursor: 'pointer',
            }}
          >
            Muat Ulang
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
