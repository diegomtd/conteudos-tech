import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

function Spinner() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#010816',
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid rgba(0,212,255,0.15)',
        borderTopColor: '#00D4FF',
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
  const location = useLocation()
  const [dbRole, setDbRole] = useState<string | null>(null)
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    if (!user) { setProfileLoading(false); return }

    supabase
      .from('profiles')
      .select('role, onboarding_completed')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setDbRole(data?.role ?? null)
        setOnboardingCompleted(data?.onboarding_completed ?? false)
        setProfileLoading(false)
      })
  }, [user])

  if (loading || profileLoading) return <Spinner />
  if (!user) return <Navigate to="/auth" replace />

  if (onboardingCompleted === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  if (requireAdmin) {
    if (dbRole !== 'admin') return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
