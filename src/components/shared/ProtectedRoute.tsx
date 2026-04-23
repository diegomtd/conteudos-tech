import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

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
  const [dbRole, setDbRole] = useState<string | null>(null)
  const [roleLoading, setRoleLoading] = useState(requireAdmin)

  useEffect(() => {
    if (!requireAdmin || !user) return

    supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setDbRole(data?.role ?? null)
        setRoleLoading(false)
      })
  }, [requireAdmin, user])

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/auth" replace />

  if (requireAdmin) {
    if (roleLoading) return <Spinner />
    if (dbRole !== 'admin') return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
