import { useEffect, useState, useCallback } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (event === 'SIGNED_OUT') {
        navigate('/auth')
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log('Token renovado com sucesso')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const redirectAfterLogin = useCallback(async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('user_id', userId)
      .single()

    if (profile?.onboarding_completed) {
      navigate('/dashboard')
    } else {
      navigate('/onboarding')
    }
  }, [navigate])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.user) await redirectAfterLogin(data.user.id)
  }, [redirectAfterLogin])

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    if (error) throw error
    // retorna sem redirecionar — aguarda confirmação de email
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }, [navigate])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    })
    if (error) throw error
  }, [])

  return { user, session, loading, signIn, signUp, signOut, resetPassword }
}
