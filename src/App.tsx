import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import SessionsPage from '@/pages/SessionsPage'
import SessionDetailPage from '@/pages/SessionDetailPage'
import SessionFormPage from '@/pages/SessionFormPage'
import ClientsPage from '@/pages/ClientsPage'
import MediaPage from '@/pages/MediaPage'
import ReportsPage from '@/pages/ReportsPage'
import StudiosPage from '@/pages/StudiosPage'
import UsersPage from '@/pages/UsersPage'
import MetricsInputPage from '@/pages/MetricsInputPage'
import SettingsPage from '@/pages/SettingsPage'

export default function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0e1318',
            color: '#e8edf2',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#a3ff6b', secondary: '#080b10' } },
          error: { iconTheme: { primary: '#ff3d6b', secondary: '#080b10' } },
        }}
      />

      <Routes>
        {/* ── LANDING PAGE (public, root) ── */}
        <Route path="/" element={<LandingPage />} />

        {/* ── LOGIN (public only) ── */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* ── DASHBOARD (protected) ── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Sessions */}
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/sessions/:id" element={<SessionDetailPage />} />

            {/* Staff only */}
            <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'operator']} />}>
              <Route path="/sessions/new" element={<SessionFormPage />} />
              <Route path="/sessions/:id/edit" element={<SessionFormPage />} />
              <Route path="/studios" element={<StudiosPage />} />
              <Route path="/clients" element={<ClientsPage />} />
            </Route>

            {/* All authenticated */}
            <Route path="/media" element={<MediaPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/metrics/input" element={<MetricsInputPage />} />

            {/* Admin only */}
            <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} />}>
              <Route path="/users" element={<UsersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
