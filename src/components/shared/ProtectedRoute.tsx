import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

function Spinner() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#080808',
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid rgba(200,255,0,0.15)',
        borderTopColor: '#C8FF00',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

interface Props {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: Props) {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/auth" replace />

  if (requireAdmin) {
    const role = user.user_metadata?.role as string | undefined
    if (role !== 'admin') return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
