import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Plan, Profile } from '@/types'

const CAROUSEL_LIMITS: Record<Plan, number> = {
  free:       3,
  construtor: 30,
  escala:     100,
  agencia:    999999,
}

const EXPORT_LIMITS: Record<Plan, number> = {
  free:       0,
  construtor: 999999,
  escala:     999999,
  agencia:    999999,
}

const AI_IMAGE_LIMITS: Record<Plan, number> = {
  free:       3,
  construtor: 20,
  escala:     60,
  agencia:    200,
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
  const exportsRemaining = plan === 'construtor' || plan === 'escala' || plan === 'agencia'
    ? 999999
    : Math.max(0, exportLimit - exportsUsed)
  const canExport = exportsRemaining > 0

  // Imagens IA
  const aiImageLimit      = profile?.ai_images_limit ?? AI_IMAGE_LIMITS[plan]
  const aiImagesUsed      = profile?.ai_images_used_this_month ?? 0
  const aiImagesRemaining = Math.max(0, aiImageLimit - aiImagesUsed)

  // Carrosseis
  const carouselsLimit     = profile?.carousels_limit ?? CAROUSEL_LIMITS[plan]
  const carouselsUsed      = profile?.carousels_used_this_month ?? 0
  const carouselsRemaining = plan === 'escala' || plan === 'agencia'
    ? 999999
    : Math.max(0, carouselsLimit - carouselsUsed)

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
    carouselsLimit,
    carouselsUsed,
    carouselsRemaining,
  }
}
