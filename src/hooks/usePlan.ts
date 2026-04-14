import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Plan, Profile } from '@/types'

const EXPORT_LIMITS: Record<Plan, number> = {
  free:    1,
  starter: 20,
  pro:     50,
  agency:  150,
}

export function usePlan() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setProfile(data as Profile)
        setLoading(false)
      })
  }, [user])

  const canExport = profile
    ? profile.exports_used_this_month < profile.exports_limit
    : false

  const exportsRemaining = profile
    ? Math.max(0, profile.exports_limit - profile.exports_used_this_month)
    : 0

  return {
    profile,
    loading,
    plan: profile?.plan ?? 'free',
    canExport,
    exportsRemaining,
    exportLimit: profile?.plan ? EXPORT_LIMITS[profile.plan] : 1,
  }
}
