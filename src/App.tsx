import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'

import Landing    from '@/pages/Landing'
import Auth       from '@/pages/Auth'
import PreviewPublic from '@/pages/PreviewPublic'
import Onboarding from '@/pages/Onboarding'
import Dashboard  from '@/pages/Dashboard'
import Studio     from '@/pages/Studio'
import Calendar   from '@/pages/Calendar'
import Settings   from '@/pages/Settings'
import Admin      from '@/pages/Admin'
import Agency     from '@/pages/Agency'

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ background: '#010816', minHeight: '100vh' }} />
  if (user) return <Navigate to="/dashboard" replace />
  return <Landing />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/"               element={<RootRedirect />} />
        <Route path="/auth"           element={<Auth />} />
        <Route path="/preview/:token" element={<PreviewPublic />} />

        {/* Protegidas */}
        <Route path="/onboarding" element={
          <ProtectedRoute><Onboarding /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/studio" element={
          <ProtectedRoute><Studio /></ProtectedRoute>
        } />
        <Route path="/calendar" element={
          <ProtectedRoute><Calendar /></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute><Settings /></ProtectedRoute>
        } />

        {/* Agency */}
        <Route path="/agency" element={
          <ProtectedRoute><Agency /></ProtectedRoute>
        } />

        {/* Admin */}
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin><Admin /></ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
