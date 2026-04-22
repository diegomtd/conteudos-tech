import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Plan, Profile } from '@/types'

const EXPORT_LIMITS: Record<Plan, number> = {
  free:         3,
  criador:      20,
  profissional: 999999,
  agencia:      999999,
}

const AI_IMAGE_LIMITS: Record<Plan, number> = {
  free:         0,
  criador:      20,
  profissional: 60,
  agencia:      200,
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

  const plan = (profile?.plan ?? 'free') as Plan

  // Exportações
  const exportLimit      = profile?.exports_limit ?? EXPORT_LIMITS[plan]
  const exportsUsed      = profile?.exports_used_this_month ?? 0
  const exportsRemaining = plan === 'profissional' || plan === 'agencia'
    ? 999999
    : Math.max(0, exportLimit - exportsUsed)
  const canExport = exportsRemaining > 0

  // Imagens IA
  const aiImageLimit      = profile?.ai_images_limit ?? AI_IMAGE_LIMITS[plan]
  const aiImagesUsed      = profile?.ai_images_used_this_month ?? 0
  const aiImagesRemaining = Math.max(0, aiImageLimit - aiImagesUsed)

  return {
    profile,
    loading,
    plan,
    canExport,
    exportsRemaining,
    exportLimit,
    aiImageLimit,
    aiImagesUsed,
    aiImagesRemaining,
  }
}
