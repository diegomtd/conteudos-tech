import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

import Landing   from '@/pages/Landing'
import Auth      from '@/pages/Auth'
import Preview   from '@/pages/Preview'
import Dashboard from '@/pages/Dashboard'
import Studio    from '@/pages/Studio'
import Calendar  from '@/pages/Calendar'
import Settings  from '@/pages/Settings'
import Admin     from '@/pages/Admin'

// Rota protegida — redireciona para /auth se não autenticado
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}

// Rota de admin — requer role=admin no metadata
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/auth" replace />
  const role = user.user_metadata?.role as string | undefined
  if (role !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/"               element={<Landing />} />
        <Route path="/auth"           element={<Auth />} />
        <Route path="/preview/:token" element={<Preview />} />

        {/* Protegidas */}
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

        {/* Admin */}
        <Route path="/admin" element={
          <AdminRoute><Admin /></AdminRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
