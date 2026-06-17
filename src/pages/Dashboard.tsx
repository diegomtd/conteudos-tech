import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Zap, Calendar, Settings,
  ChevronLeft, Users, Shield,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Profile, ScheduledPost, WeeklyTrend } from '@/types'

type SuggestedTema = { titulo: string; hook: string; contexto?: string; tipo: string }

type CarouselWithCover = {
  id: string
  tema: string
  status: string
  created_at: string
  exported_at?: string | null
  collection_id?: string | null
  carousel_slides?: { bg_image_url: string | null; position: number }[] | null
}

type Collection = {
  id: string
  name: string
  color: string
  created_at: string
}

// ─── Design tokens — Apple Dark ───────────────────────────────────
const A   = '#00D4FF'
const BG  = '#080808'
const T   = '#F2F2F7'
const M   = 'rgba(242,242,247,0.4)'
const B   = 'rgba(255,255,255,0.07)'
const ff  = 'DM Sans, sans-serif'
const ffd = '"Bebas Neue", sans-serif'

const GLASS = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.08)',
} as const


// ─── Plan config ──────────────────────────────────────────────────
const PLAN_LABELS: Record<string, string> = {
  free: 'FREE', construtor: 'CONSTRUTOR', escala: 'ESCALA', agencia: 'AGÊNCIA',
}
const PLAN_COLOR: Record<string, string> = {
  free: M, construtor: '#00B4D8', escala: A, agencia: '#A855F7',
}
const PLAN_BORDER_SIDEBAR: Record<string, string> = {
  free: 'rgba(255,255,255,0.3)', construtor: '#00B4D8',
  escala: T, agencia: '#F59E0B',
}

const STATUS_COLOR: Record<string, string> = {
  draft: '#555', ready: '#22C55E', exported: A, scheduled: '#F59E0B',
}

// ─── Fallback ideas ───────────────────────────────────────────────
const NICHE_IDEAS: Record<string, string[]> = {
  marketing:       ['Como triplicar engajamento sem pagar tráfego', 'O erro que 90% dos criadores cometem no CTA', '3 formatos que viralizam toda semana'],
  fitness:         ['O que ninguém te conta sobre perda de gordura', 'Por que você treina e não avança', '4 hábitos que destroem seu resultado'],
  empreendedorismo:['Como vender sem parecer desesperado', 'O funil que gerou R$100k em 90 dias', '5 erros de novato que custam caro'],
  financas:        ['Por que seu dinheiro some todo mês', 'Investimento com R$100 que poucos conhecem', '3 gastos invisíveis que te impedem de juntar'],
  saude:           ['O que o médico não tem tempo de te contar', 'Rotina anti-inflamatória em 15 minutos', '5 sinais de que seu corpo pede socorro'],
}
const GENERIC_IDEAS = [
  'O erro que 90% das pessoas cometem nessa área',
  'Como fazer mais com menos em 30 dias',
  '5 verdades que ninguém fala por aí',
]

// ─── Helpers ──────────────────────────────────────────────────────
function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'BOM DIA'
  if (h < 18) return 'BOA TARDE'
  return 'BOA NOITE'
}

function formatDate(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function relativeTime(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 60)  return `há ${mins}min`
  if (hours < 24) return `há ${hours}h`
  if (days === 1) return 'ontem'
  return `há ${days}d`
}

// ─── Count-up hook ────────────────────────────────────────────────
function useCountUp(target: number, active: boolean, duration = 900) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    if (target === 0) { setCount(0); return }
    const start = Date.now()
    let raf: number
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setCount(Math.round(eased * target))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, active, duration])
  return count
}

// ─── Skeleton ─────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 20, r = 8 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
      backgroundSize: '400% 100%',
      animation: 'shimmer 1.4s ease-in-out infinite',
    }} />
  )
}

// ─── Phone SVG illustration ───────────────────────────────────────
function PhoneIllustration() {
  return (
    <svg width="120" height="196" viewBox="0 0 120 196" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="104" height="180" rx="18" fill="#111" stroke="rgba(200,255,0,0.25)" strokeWidth="1.5"/>
      <circle cx="60" cy="24" r="5" fill="#1A1A1A"/>
      <rect x="20" y="42" width="80" height="106" rx="10" fill="#161616"/>
      <rect x="30" y="58" width="60" height="7" rx="3.5" fill={A} fillOpacity="0.7"/>
      <rect x="30" y="72" width="44" height="4" rx="2" fill="rgba(255,255,255,0.25)"/>
      <rect x="30" y="83" width="52" height="4" rx="2" fill="rgba(255,255,255,0.15)"/>
      <rect x="30" y="94" width="36" height="4" rx="2" fill="rgba(255,255,255,0.15)"/>
      <rect x="30" y="108" width="60" height="28" rx="6" fill="rgba(200,255,0,0.08)" stroke="rgba(200,255,0,0.2)" strokeWidth="1"/>
      <rect x="38" y="116" width="44" height="12" rx="4" fill={A} fillOpacity="0.9"/>
      <circle cx="52" cy="160" r="3.5" fill={A}/>
      <circle cx="62" cy="160" r="3.5" fill="rgba(255,255,255,0.15)"/>
      <circle cx="72" cy="160" r="3.5" fill="rgba(255,255,255,0.15)"/>
      <rect x="44" y="174" width="32" height="4" rx="2" fill="#1A1A1A"/>
    </svg>
  )
}


// ─── Glow progress bar ────────────────────────────────────────────
function GlowBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 6, borderRadius: 3, background: B, overflow: 'hidden', position: 'relative' }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: color,
        borderRadius: 3,
        boxShadow: `0 0 10px ${color}80`,
        transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        animation: 'bar-pulse 2s ease-in-out infinite',
      }} />
    </div>
  )
}

// ─── Sidebar (unchanged logic) ────────────────────────────────────
function Sidebar({
  open, onToggle, profile,
}: {
  open: boolean
  onToggle: () => void
  profile: Profile | null
}) {
  const navigate   = useNavigate()
  const { pathname } = useLocation()
  const W = open ? 240 : 64

  const pct      = profile ? Math.min(100, (profile.exports_used_this_month / Math.max(1, profile.exports_limit)) * 100) : 0
  const barColor = pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : A
  const plan     = profile?.plan ?? 'free'

  const NAV = [
    { label: 'Dashboard',     icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Studio',        icon: Zap,             path: '/studio'    },
    { label: 'Calendário',    icon: Calendar,        path: '/calendar'  },
    { label: 'Configurações', icon: Settings,        path: '/settings'  },
    ...(plan === 'agencia' ? [{ label: 'Agência', icon: Users, path: '/agency' }] : []),
    ...(profile?.role === 'admin' ? [{ label: 'Admin', icon: Shield, path: '/admin' }] : []),
  ]

  const aiLimit    = profile?.ai_images_limit ?? 0
  const aiUsed     = profile?.ai_images_used_this_month ?? 0
  const aiPct      = aiLimit > 0 ? Math.min(100, (aiUsed / aiLimit) * 100) : 100
  const aiBarColor = aiPct >= 90 ? '#EF4444' : aiPct >= 70 ? '#F59E0B' : '#00B4D8'

  return (
    <aside style={{
      width: W, minHeight: '100vh',
      background: 'rgba(10,10,10,0.85)',
      backdropFilter: 'blur(24px) saturate(160%)',
      WebkitBackdropFilter: 'blur(24px) saturate(160%)',
      borderRight: `1px solid rgba(255,255,255,0.06)`,
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.22s ease',
      flexShrink: 0, position: 'relative', overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        height: 64, display: 'flex', alignItems: 'center',
        justifyContent: open ? 'space-between' : 'center',
        padding: open ? '0 16px 0 20px' : '0',
        borderBottom: `1px solid ${B}`, flexShrink: 0,
      }}>
        {open ? (
          <>
            <img src="/logo.png" alt="ConteúdOS" style={{ height: 28, borderRadius: 6 }} />
            <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: M, padding: 4, display: 'flex', alignItems: 'center' }}>
              <ChevronLeft size={18} />
            </button>
          </>
        ) : (
          <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: ffd, fontSize: 20, color: A, letterSpacing: 1, display: 'flex', alignItems: 'center' }}>
            CO
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {NAV.map(({ label, icon: Icon, path }) => {
          const active = pathname === path
          return (
            <button key={path} onClick={() => navigate(path)} style={{
              width: '100%', background: active ? 'rgba(200,255,0,0.06)' : 'none',
              border: 'none', borderLeft: active ? `3px solid ${A}` : '3px solid transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              gap: 12, padding: open ? '11px 20px 11px 17px' : '11px 0',
              justifyContent: open ? 'flex-start' : 'center',
              color: active ? T : M,
              transition: 'background 0.15s, color 0.15s',
            }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
            >
              <Icon size={18} />
              {open && <span style={{ fontFamily: ff, fontSize: 14, whiteSpace: 'nowrap' }}>{label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: open ? '16px 16px 24px' : '16px 8px 24px', borderTop: `1px solid ${B}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          border: `1px solid ${PLAN_BORDER_SIDEBAR[plan]}`,
          borderRadius: 6, padding: open ? '6px 10px' : '6px',
          display: 'flex', alignItems: 'center', justifyContent: open ? 'flex-start' : 'center', gap: 6,
        }}>
          <span style={{ fontFamily: ffd, fontSize: 13, letterSpacing: 1, color: plan === 'free' ? M : plan === 'agencia' ? '#F59E0B' : T }}>
            {open ? PLAN_LABELS[plan] : PLAN_LABELS[plan][0]}
          </span>
        </div>

        {open && profile && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: ff, fontSize: 11, color: M, letterSpacing: 0.5 }}>Exportações</span>
              <div style={{ height: 4, borderRadius: 2, background: B, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 2, transition: 'width 0.4s ease' }} />
              </div>
              <span style={{ fontFamily: ff, fontSize: 11, color: M }}>
                {plan === 'escala' || plan === 'agencia' ? 'Ilimitadas' : `${profile.exports_used_this_month} / ${profile.exports_limit}`}
              </span>
            </div>

            {aiLimit > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontFamily: ff, fontSize: 11, color: M, letterSpacing: 0.5 }}>Imagens IA</span>
                <div style={{ height: 4, borderRadius: 2, background: B, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${aiPct}%`, background: aiBarColor, borderRadius: 2, transition: 'width 0.4s ease' }} />
                </div>
                <span style={{ fontFamily: ff, fontSize: 11, color: M }}>{aiUsed} / {aiLimit}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontFamily: ff, fontSize: 11, color: M }}>Imagens IA</span>
                <span style={{ fontFamily: ff, fontSize: 11, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
                  {plan === 'free' ? 'Upgrade para imagens IA' : 'Não incluso'}
                </span>
              </div>
            )}

            {plan === 'free' && (
              <button
                onClick={() => navigate('/settings')}
                style={{
                  background: A, color: '#000', border: 'none',
                  borderRadius: 6, padding: '8px 0', cursor: 'pointer',
                  fontFamily: ffd, fontSize: 14, letterSpacing: 1, width: '100%',
                }}
              >
                FAZER UPGRADE
              </button>
            )}
          </>
        )}
      </div>
    </aside>
  )
}

// ─── Empty state ──────────────────────────────────────────────────
function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 20, padding: '64px 0 48px',
      }}
    >
      <PhoneIllustration />
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: ffd, fontSize: 26, color: T, letterSpacing: 1, margin: '0 0 6px' }}>
          SEU PRIMEIRO VIRAL COMEÇA AQUI
        </p>
        <p style={{ fontFamily: ff, fontSize: 14, color: M, margin: 0 }}>
          Crie um carrossel em minutos com a IA que escreve na sua voz.
        </p>
      </div>
      <button
        onClick={onNew}
        style={{
          background: A, color: '#000', border: 'none',
          borderRadius: 10, padding: '14px 32px', cursor: 'pointer',
          fontFamily: ffd, fontSize: 18, letterSpacing: 1,
          animation: 'btn-pulse 2.4s ease-in-out infinite',
        }}
      >
        CRIAR AGORA →
      </button>
    </motion.div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebar_open')
    return saved !== null ? saved === 'true' : true
  })

  const [profile, setProfile]               = useState<Profile | null>(null)
  const [carouselsCount, setCarouselsCount] = useState<number>(0)
  const [recentCarousels, setRecentCarousels] = useState<CarouselWithCover[]>([])
  const [, setNextPost]                     = useState<ScheduledPost | null>(null)
  const [trends, setTrends]                 = useState<WeeklyTrend | null>(null)
  const [loading, setLoading]               = useState(true)
  const [aiTopics, setAiTopics]             = useState<SuggestedTema[]>([])
  const [loadingTopics, setLoadingTopics]   = useState(false)
  const [hasLiveNews, setHasLiveNews]       = useState(false)
  const [viewMode, setViewMode]             = useState<'lista' | 'grade'>('lista')
  const [searchQuery, setSearchQuery]       = useState('')
  const [filterMonth, setFilterMonth]       = useState<string>('')
  const [deleteTarget, setDeleteTarget]     = useState<string | null>(null)
  const [deletingId, setDeletingId]         = useState<string | null>(null)
  const [collections, setCollections]           = useState<Collection[]>([])
  const [activeCollection, setActiveCollection] = useState<string | null>(null)
  const [showNewCollection, setShowNewCollection] = useState(false)
  const [newCollName, setNewCollName]           = useState('')
  const [newCollColor, setNewCollColor]         = useState('#C8FF00')
  const [moveMenuId, setMoveMenuId]             = useState<string | null>(null)
  const [carouselPage, setCarouselPage]         = useState(0)

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      localStorage.setItem('sidebar_open', String(!prev))
      return !prev
    })
  }

  useEffect(() => {
    if (!user) return
    async function load() {
      setLoading(true)
      const [
        { data: prof },
        { count },
        { data: recent },
        { data: next },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user!.id).single(),
        supabase.from('carousels').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('carousels')
          .select('id, tema, status, created_at, exported_at, collection_id, carousel_slides(bg_image_url, position)')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase.from('scheduled_posts')
          .select('*')
          .eq('user_id', user!.id)
          .gt('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(1),
      ])

      const profileData = prof as Profile | null
      setProfile(profileData)
      setCarouselsCount(count ?? 0)
      setRecentCarousels((recent as CarouselWithCover[]) ?? [])
      setNextPost(next?.[0] as ScheduledPost ?? null)

      if (profileData?.niche) {
        const { data: trendData } = await supabase
          .from('weekly_trends')
          .select('*')
          .eq('nicho', profileData.niche)
          .order('week_start', { ascending: false })
          .limit(1)
          .single()
        setTrends(trendData as WeeklyTrend | null)
      }

      const { data: collData } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true })
      setCollections((collData as Collection[]) ?? [])

      setLoading(false)
    }
    load()
  }, [user])

  // ── Suggest-topics: cache 24h em localStorage para evitar chamadas desnecessárias ──
  const TOPICS_CACHE_KEY = 'conteudos_topics_cache'
  const TOPICS_CACHE_TTL = 24 * 60 * 60 * 1000

  const fetchTopics = (force = false) => {
    if (!user) return
    if (!force) {
      try {
        const raw = localStorage.getItem(TOPICS_CACHE_KEY)
        if (raw) {
          const { temas, ts, uid, news } = JSON.parse(raw)
          if (uid === user.id && Date.now() - ts < TOPICS_CACHE_TTL && Array.isArray(temas) && temas.length > 0) {
            setAiTopics(temas as SuggestedTema[])
            setHasLiveNews(!!news)
            return
          }
        }
      } catch { /* cache inválido */ }
    }
    setLoadingTopics(true)
    supabase.functions.invoke('suggest-topics').then(({ data }) => {
      if (data?.temas && Array.isArray(data.temas) && data.temas.length > 0) {
        setAiTopics(data.temas as SuggestedTema[])
        setHasLiveNews(!!data._news)
        try {
          localStorage.setItem(TOPICS_CACHE_KEY, JSON.stringify({
            temas: data.temas, ts: Date.now(), uid: user.id, news: !!data._news,
          }))
        } catch { /* localStorage cheio */ }
      }
    }).finally(() => setLoadingTopics(false))
  }

  useEffect(() => { fetchTopics() }, [user])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const { error } = await supabase.from('carousels').delete().eq('id', id)
    if (!error) {
      setRecentCarousels(prev => prev.filter(c => c.id !== id))
      setCarouselsCount(prev => Math.max(0, prev - 1))
    }
    setDeletingId(null)
    setDeleteTarget(null)
  }

  const handleCreateCollection = async () => {
    const name = newCollName.trim()
    if (!name || !user) return
    const { data, error } = await supabase
      .from('collections')
      .insert({ user_id: user.id, name, color: newCollColor })
      .select()
      .single()
    if (!error && data) {
      setCollections(prev => [...prev, data as Collection])
      setNewCollName('')
      setNewCollColor('#C8FF00')
      setShowNewCollection(false)
    }
  }

  const handleDeleteCollection = async (id: string) => {
    const { error } = await supabase.from('collections').delete().eq('id', id)
    if (!error) {
      setCollections(prev => prev.filter(c => c.id !== id))
      setRecentCarousels(prev => prev.map(c =>
        c.collection_id === id ? { ...c, collection_id: null } : c
      ))
      if (activeCollection === id) setActiveCollection(null)
    }
  }

  const handleMoveToCollection = async (carouselId: string, collectionId: string | null) => {
    const { error } = await supabase
      .from('carousels')
      .update({ collection_id: collectionId })
      .eq('id', carouselId)
    if (!error) {
      setRecentCarousels(prev => prev.map(c =>
        c.id === carouselId ? { ...c, collection_id: collectionId } : c
      ))
    }
    setMoveMenuId(null)
  }

  // ── Derived values ─────────────────────────────────────────────
  const months = [...new Set(recentCarousels.map(c => c.created_at.slice(0, 7)))].sort().reverse()

  const filteredCarousels = recentCarousels.filter(c => {
    const matchSearch     = searchQuery === '' || c.tema.toLowerCase().includes(searchQuery.toLowerCase())
    const matchMonth      = filterMonth === '' || c.created_at.startsWith(filterMonth)
    const matchCollection = activeCollection === null || c.collection_id === activeCollection
    return matchSearch && matchMonth && matchCollection
  })

  const CAROUSEL_PAGE_SIZE = 12
  const totalCarouselPages = Math.ceil(filteredCarousels.length / CAROUSEL_PAGE_SIZE)
  const paginatedCarousels = filteredCarousels.slice(carouselPage * CAROUSEL_PAGE_SIZE, (carouselPage + 1) * CAROUSEL_PAGE_SIZE)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setCarouselPage(0) }, [searchQuery, filterMonth, activeCollection])

  const plan         = profile?.plan ?? 'free'
  const exportsUsed  = profile?.exports_used_this_month ?? 0
  const exportsLimit = profile?.exports_limit ?? 1
  const exportPct    = Math.min(100, (exportsUsed / Math.max(1, exportsLimit)) * 100)
  const barColor     = exportPct >= 90 ? '#EF4444' : exportPct >= 70 ? '#F59E0B' : A

  const renewLabel = plan === 'free' ? 'gratuito' : 'renova em 30 dias'

  // ── Count-up ───────────────────────────────────────────────────
  const countExports   = useCountUp(exportsUsed, !loading)
  const countCarousels = useCountUp(carouselsCount, !loading)

  // ── Idea topics ────────────────────────────────────────────────
  // Sugestões ricas da IA (hook + titulo + tipo). Se ainda carregando, usa fallback.
  const richTopics: SuggestedTema[] = aiTopics.length > 0
    ? aiTopics.slice(0, 5)
    : (() => {
        const fallback: string[] = (() => {
          if (trends && Array.isArray(trends.temas) && trends.temas.length >= 3) return trends.temas.slice(0, 3)
          const niche = profile?.niche?.toLowerCase() ?? ''
          const byNiche = Object.entries(NICHE_IDEAS).find(([k]) => niche.includes(k))
          return byNiche ? byNiche[1] : GENERIC_IDEAS
        })()
        return fallback.map(t => ({ titulo: t, hook: t, tipo: '' }))
      })()
  const topicsLoading = loading || loadingTopics

  // ── Streak de criação (dias consecutivos com pelo menos 1 carrossel) ──
  const streak = (() => {
    if (recentCarousels.length === 0) return 0
    const todayMs = new Date().setHours(0, 0, 0, 0)
    const dates = [...new Set(recentCarousels.map(c =>
      new Date(c.created_at).setHours(0, 0, 0, 0)
    ))].sort((a, b) => b - a)
    // streak só conta se o dia mais recente for hoje ou ontem
    const mostRecent = dates[0]
    const diffFromToday = (todayMs - mostRecent) / 86400000
    if (diffFromToday > 1) return 0
    let s = 0
    let expected = mostRecent
    for (const d of dates) {
      if ((expected - d) / 86400000 <= 1) { s++; expected = d } else break
    }
    return s
  })()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BG, fontFamily: ff }}>
      <style>{`
        @keyframes shimmer {
          0%, 100% { background-position: 200% 0; }
          50%       { background-position: -200% 0; }
        }
        @keyframes btn-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(200,255,0,0.5); }
          60%  { box-shadow: 0 0 0 14px rgba(200,255,0,0); }
          100% { box-shadow: 0 0 0 0 rgba(200,255,0,0); }
        }
        @keyframes bar-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.7; }
        }
        @keyframes badge-shine {
          0%   { transform: translateX(-120%); }
          40%  { transform: translateX(120%); }
          100% { transform: translateX(120%); }
        }
        @keyframes gradient-x {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <Sidebar open={sidebarOpen} onToggle={toggleSidebar} profile={profile} />

      <main style={{ flex: 1, minWidth: 0, padding: '40px 48px 64px', overflowY: 'auto' }}>

        {/* ── Header Apple-style ──────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
          <div>
            {loading ? (
              <>
                <Skeleton w={260} h={36} r={6} />
                <div style={{ marginTop: 8 }}><Skeleton w={180} h={14} r={4} /></div>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <h1 style={{
                  fontFamily: ffd, fontSize: 36, letterSpacing: 1.5, margin: 0, lineHeight: 1.1,
                  color: T,
                }}>
                  {greeting()}, {profile?.display_name ?? 'criador'}
                </h1>
                <p style={{ fontFamily: ff, fontSize: 13, color: M, margin: '6px 0 0', textTransform: 'capitalize' }}>
                  {formatDate()}
                </p>
              </motion.div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Streak badge */}
            {!loading && streak > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  borderRadius: 99, padding: '7px 14px',
                }}
              >
                <span style={{ fontSize: 14 }}>🔥</span>
                <span style={{ fontFamily: ffd, fontSize: 15, color: '#F59E0B', letterSpacing: 0.5 }}>
                  {streak} dia{streak > 1 ? 's' : ''}
                </span>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/studio')}
              style={{
                background: A, color: '#000', border: 'none',
                borderRadius: 12, padding: '11px 22px', cursor: 'pointer',
                fontFamily: ffd, fontSize: 16, letterSpacing: 0.8,
                whiteSpace: 'nowrap',
                boxShadow: `0 0 24px ${A}33`,
              }}
            >
              + Criar
            </motion.button>
          </div>
        </div>

        {/* ── LAYOUT APPLE ───────────────────────────────────── */}
        {/* ── Stats — 3 números Apple widget ─────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            {
              label: 'Carrosseis',
              value: loading ? null : String(countCarousels),
              sub: 'criados no total',
              color: T,
            },
            {
              label: 'Exportações',
              value: loading ? null : (plan === 'escala' || plan === 'agencia' ? '∞' : `${countExports} / ${exportsLimit}`),
              sub: 'este mês',
              color: barColor,
              bar: !loading && plan !== 'escala' && plan !== 'agencia',
              pct: exportPct,
            },
            {
              label: 'Plano',
              value: loading ? null : PLAN_LABELS[plan],
              sub: renewLabel,
              color: PLAN_COLOR[plan],
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{
                ...GLASS, borderRadius: 18, padding: '22px 24px',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}
            >
              <span style={{ fontFamily: ff, fontSize: 11, color: M, textTransform: 'uppercase', letterSpacing: 1 }}>
                {stat.label}
              </span>
              {stat.value === null
                ? <Skeleton w={80} h={38} r={4} />
                : <span style={{ fontFamily: ffd, fontSize: 38, color: stat.color, lineHeight: 1, letterSpacing: 0.5 }}>{stat.value}</span>
              }
              <span style={{ fontFamily: ff, fontSize: 12, color: M }}>{stat.sub}</span>
              {stat.bar && <GlowBar pct={stat.pct!} color={barColor} />}
            </motion.div>
          ))}
        </div>

        {/* ── Hero: O que criar hoje ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          style={{
            ...GLASS,
            border: '1px solid rgba(0,212,255,0.15)',
            borderRadius: 22, padding: '28px 32px', marginBottom: 28,
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Ambient glow top-right */}
          <div style={{
            position: 'absolute', top: -80, right: -80, width: 220, height: 220,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${A}14 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, position: 'relative' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%', background: A,
                  boxShadow: `0 0 10px ${A}`,
                  animation: 'pulse-dot 2.2s ease-in-out infinite',
                }} />
                <span style={{ fontFamily: ff, fontSize: 11, color: A, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 600 }}>
                  {aiTopics.length > 0 ? 'IA personalizada para você' : 'sugestão de hoje'}
                </span>
                {hasLiveNews && (
                  <span style={{
                    fontSize: 9, fontFamily: ff, letterSpacing: 1, textTransform: 'uppercase',
                    color: '#FF6B35', background: 'rgba(255,107,53,0.12)',
                    border: '1px solid rgba(255,107,53,0.3)',
                    padding: '2px 6px', borderRadius: 4,
                  }}>
                    🔴 AO VIVO
                  </span>
                )}
                {!topicsLoading && (
                  <button
                    onClick={() => fetchTopics(true)}
                    title="Gerar novas sugestões"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'rgba(242,242,247,0.25)', fontSize: 13, lineHeight: 1,
                      padding: '2px 4px', borderRadius: 4, transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = A}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(242,242,247,0.25)'}
                  >↺</button>
                )}
              </div>
              {topicsLoading
                ? <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><Skeleton w="75%" h={26} r={4} /><Skeleton w="45%" h={14} r={4} /></div>
                : <>
                    <p style={{ fontFamily: ffd, fontSize: 22, color: T, margin: '0 0 6px', lineHeight: 1.25, letterSpacing: 0.4 }}>
                      {richTopics[0]?.hook || richTopics[0]?.titulo || '—'}
                    </p>
                    {richTopics[0]?.contexto && (
                      <p style={{ fontFamily: ff, fontSize: 13, color: M, margin: '0 0 4px', lineHeight: 1.4 }}>
                        {richTopics[0].contexto}
                      </p>
                    )}
                  </>
              }
            </div>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/studio?tema=${encodeURIComponent(richTopics[0]?.titulo ?? richTopics[0]?.hook ?? '')}`)}
              disabled={topicsLoading}
              style={{
                background: A, color: '#000', border: 'none', borderRadius: 12,
                padding: '12px 22px', cursor: 'pointer',
                fontFamily: ffd, fontSize: 16, letterSpacing: 0.8,
                flexShrink: 0, whiteSpace: 'nowrap',
                opacity: topicsLoading ? 0 : 1, transition: 'opacity 0.2s',
                boxShadow: `0 0 20px ${A}33`,
              }}
            >
              Criar →
            </motion.button>
          </div>

          {/* Outras sugestões como pills */}
          {!topicsLoading && richTopics.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
              {richTopics.slice(1).map((t, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`/studio?tema=${encodeURIComponent(t.titulo)}`)}
                  style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 99, padding: '7px 16px', cursor: 'pointer',
                    fontFamily: ff, fontSize: 12, color: M, transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${A}44`; e.currentTarget.style.color = T }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = M }}
                >
                  {(t.hook || t.titulo).slice(0, 58)}{(t.hook || t.titulo).length > 58 ? '…' : ''}
                </button>
              ))}
              <button
                onClick={() => navigate('/studio')}
                style={{
                  background: 'none', border: '1px dashed rgba(255,255,255,0.1)',
                  borderRadius: 99, padding: '7px 16px', cursor: 'pointer',
                  fontFamily: ff, fontSize: 12, color: M, transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = T}
                onMouseLeave={e => e.currentTarget.style.color = M}
              >
                Ver mais ideias →
              </button>
            </div>
          )}
        </motion.div>

        {/* ── Recentes ─────────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {/* Linha 1: título + botão novo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: ffd, fontSize: 13, color: T, letterSpacing: 1, textTransform: 'uppercase' as const }}>
                Conteúdos
                {filteredCarousels.length > 0 && (
                  <span style={{ fontFamily: ff, fontSize: 11, color: M, fontWeight: 400, letterSpacing: 0, textTransform: 'none' as const, marginLeft: 6 }}>
                    {filteredCarousels.length}
                  </span>
                )}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Toggle lista/grade */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 7, padding: 2, border: `1px solid rgba(255,255,255,0.07)` }}>
                  {(['lista', 'grade'] as const).map(m => (
                    <button key={m} onClick={() => setViewMode(m)} style={{
                      width: 28, height: 22, border: 'none', borderRadius: 5, cursor: 'pointer',
                      background: viewMode === m ? 'rgba(255,255,255,0.1)' : 'transparent',
                      color: viewMode === m ? T : M, fontSize: 11, transition: 'all 0.15s',
                    }}>
                      {m === 'lista' ? '☰' : '⊞'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/studio')}
                  style={{
                    height: 28, padding: '0 12px', borderRadius: 7, border: `1px solid ${A}33`,
                    background: `${A}10`, color: A, fontFamily: ff, fontSize: 12, cursor: 'pointer',
                  }}
                >
                  + novo
                </button>
              </div>
            </div>
            {/* Linha 2: busca + filtro mês */}
            {!loading && recentCarousels.length > 0 && (
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  placeholder="Buscar por tema..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1, height: 32, padding: '0 10px', borderRadius: 7,
                    background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.07)`,
                    color: T, fontFamily: ff, fontSize: 12, outline: 'none',
                  }}
                />
                {months.length > 1 && (
                  <select
                    value={filterMonth}
                    onChange={e => setFilterMonth(e.target.value)}
                    style={{
                      height: 32, padding: '0 8px', borderRadius: 7,
                      background: '#0F0F0F', border: `1px solid rgba(255,255,255,0.07)`,
                      color: filterMonth ? T : M, fontFamily: ff, fontSize: 11, cursor: 'pointer', outline: 'none',
                    }}
                  >
                    <option value="">Todos</option>
                    {months.map(m => {
                      const [year, month] = m.split('-')
                      const label = new Date(Number(year), Number(month) - 1).toLocaleString('pt-BR', { month: 'short', year: '2-digit' })
                      return <option key={m} value={m}>{label}</option>
                    })}
                  </select>
                )}
              </div>
            )}

            {/* Linha 3: pastas/coleções */}
            {!loading && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                {/* Pill "Todos" */}
                <button
                  onClick={() => setActiveCollection(null)}
                  style={{
                    height: 26, padding: '0 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    background: activeCollection === null ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                    color: activeCollection === null ? T : M,
                    fontFamily: ff, fontSize: 11, transition: 'all 0.15s',
                  }}
                >
                  Todos
                </button>

                {/* Pill por coleção */}
                {collections.map(col => (
                  <div key={col.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <button
                      onClick={() => setActiveCollection(activeCollection === col.id ? null : col.id)}
                      style={{
                        height: 26, padding: '0 10px 0 8px', borderRadius: 20, border: 'none', cursor: 'pointer',
                        background: activeCollection === col.id ? `${col.color}22` : 'rgba(255,255,255,0.04)',
                        color: activeCollection === col.id ? col.color : M,
                        fontFamily: ff, fontSize: 11, display: 'flex', alignItems: 'center', gap: 5,
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                      {col.name}
                      <span
                        onClick={e => { e.stopPropagation(); handleDeleteCollection(col.id) }}
                        style={{ marginLeft: 2, opacity: 0.4, fontSize: 10, cursor: 'pointer', lineHeight: 1 }}
                        title="Excluir pasta"
                      >✕</span>
                    </button>
                  </div>
                ))}

                {/* Botão nova pasta */}
                {!showNewCollection ? (
                  <button
                    onClick={() => setShowNewCollection(true)}
                    style={{
                      height: 26, padding: '0 10px', borderRadius: 20,
                      border: '1px dashed rgba(255,255,255,0.15)', background: 'transparent',
                      color: M, fontFamily: ff, fontSize: 11, cursor: 'pointer',
                    }}
                  >
                    + pasta
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <input
                      autoFocus
                      placeholder="Nome da pasta"
                      value={newCollName}
                      onChange={e => setNewCollName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleCreateCollection(); if (e.key === 'Escape') setShowNewCollection(false) }}
                      style={{
                        height: 26, padding: '0 8px', borderRadius: 7, width: 130,
                        background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.12)`,
                        color: T, fontFamily: ff, fontSize: 11, outline: 'none',
                      }}
                    />
                    {(['#C8FF00','#00D4FF','#F59E0B','#A855F7','#EF4444','#22C55E'] as const).map(c => (
                      <span
                        key={c}
                        onClick={() => setNewCollColor(c)}
                        style={{
                          width: 14, height: 14, borderRadius: '50%', background: c, cursor: 'pointer',
                          outline: newCollColor === c ? `2px solid ${c}` : 'none', outlineOffset: 2,
                        }}
                      />
                    ))}
                    <button
                      onClick={handleCreateCollection}
                      style={{
                        height: 26, padding: '0 10px', borderRadius: 7, border: 'none',
                        background: newCollColor, color: '#000', fontFamily: ff, fontSize: 11, cursor: 'pointer',
                      }}
                    >
                      Criar
                    </button>
                    <button
                      onClick={() => { setShowNewCollection(false); setNewCollName('') }}
                      style={{
                        height: 26, padding: '0 8px', borderRadius: 7, border: 'none',
                        background: 'rgba(255,255,255,0.06)', color: M, fontFamily: ff, fontSize: 11, cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ ...GLASS, borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Skeleton w={40} h={40} r={8} />
                  <Skeleton w="50%" h={14} r={4} />
                  <div style={{ marginLeft: 'auto' }}><Skeleton w={60} h={12} r={4} /></div>
                </div>
              ))}
            </div>
          ) : filteredCarousels.length === 0 ? (
            searchQuery || filterMonth ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: M, fontFamily: ff, fontSize: 13 }}>
                Nenhum resultado
              </div>
            ) : (
              <EmptyState onNew={() => navigate('/studio')} />
            )
          ) : viewMode === 'lista' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {paginatedCarousels.map((c, i) => {
                const tema = c.tema.length > 65 ? c.tema.slice(0, 65) + '…' : c.tema
                const statusColor = STATUS_COLOR[c.status] ?? '#555'
                const coverUrl = c.carousel_slides?.find(s => s.position === 1)?.bg_image_url
                const isDeleting = deletingId === c.id
                const isConfirming = deleteTarget === c.id
                return (
                  <motion.div key={c.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.025, duration: 0.25 }}
                    style={{ position: 'relative' }}
                  >
                    <div
                      onClick={() => !isConfirming && navigate(`/studio?carousel_id=${c.id}`)}
                      style={{
                        ...GLASS, borderRadius: 12, padding: '11px 14px',
                        display: 'flex', alignItems: 'center', gap: 12,
                        cursor: isConfirming ? 'default' : 'pointer',
                        transition: 'background 0.15s, border-color 0.15s',
                        opacity: isDeleting ? 0.4 : 1,
                        border: isConfirming ? `1px solid rgba(255,69,58,0.4)` : '1px solid rgba(255,255,255,0.07)',
                      }}
                      onMouseEnter={e => {
                        if (!isConfirming) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                          e.currentTarget.querySelectorAll<HTMLElement>('.action-btn').forEach(b => b.style.opacity = '1')
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isConfirming) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                          e.currentTarget.querySelectorAll<HTMLElement>('.action-btn').forEach(b => b.style.opacity = '0')
                        }
                      }}
                    >
                      {/* Thumbnail */}
                      <div style={{
                        width: 42, height: 42, borderRadius: 8, flexShrink: 0,
                        backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        background: coverUrl ? undefined : 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {!coverUrl && <span style={{ fontFamily: ffd, fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>{i + 1}</span>}
                      </div>

                      {/* Tema + badge de pasta */}
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                        {c.collection_id && (() => {
                          const col = collections.find(x => x.id === c.collection_id)
                          return col ? (
                            <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 3, height: 18, padding: '0 6px', borderRadius: 10, background: `${col.color}18`, border: `1px solid ${col.color}33`, fontFamily: ff, fontSize: 10, color: col.color, whiteSpace: 'nowrap' }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: col.color }} />
                              {col.name}
                            </span>
                          ) : null
                        })()}
                        <span style={{ fontFamily: ff, fontSize: 13, color: T, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tema}
                        </span>
                      </div>

                      {isConfirming ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                          <span style={{ fontFamily: ff, fontSize: 11, color: 'rgba(255,69,58,0.8)' }}>Excluir?</span>
                          <button onClick={() => handleDelete(c.id)} style={{
                            height: 24, padding: '0 10px', borderRadius: 5, border: 'none',
                            background: '#FF453A', color: '#fff', fontFamily: ff, fontSize: 11, cursor: 'pointer', fontWeight: 600,
                          }}>Sim</button>
                          <button onClick={() => setDeleteTarget(null)} style={{
                            height: 24, padding: '0 10px', borderRadius: 5,
                            background: 'rgba(255,255,255,0.08)', border: 'none',
                            color: M, fontFamily: ff, fontSize: 11, cursor: 'pointer',
                          }}>Não</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span style={{ fontFamily: ff, fontSize: 11, color: M }}>{relativeTime(c.created_at)}</span>
                          <button className="action-btn" onClick={e => { e.stopPropagation(); navigate(`/studio?tema=${encodeURIComponent(c.tema)}`) }}
                            title="Refazer com novo conteúdo"
                            style={{ opacity: 0, transition: 'opacity 0.15s', background: 'none', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 5, width: 26, height: 26, cursor: 'pointer', color: M, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            ↺
                          </button>
                          {collections.length > 0 && (
                            <div style={{ position: 'relative' }}>
                              <button className="action-btn" onClick={e => { e.stopPropagation(); setMoveMenuId(moveMenuId === c.id ? null : c.id) }}
                                title="Mover para pasta"
                                style={{ opacity: 0, transition: 'opacity 0.15s', background: 'none', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 5, width: 26, height: 26, cursor: 'pointer', color: M, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                📁
                              </button>
                              {moveMenuId === c.id && (
                                <div onClick={e => e.stopPropagation()} style={{
                                  position: 'absolute', right: 0, top: 30, zIndex: 100,
                                  background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)',
                                  borderRadius: 10, padding: 6, minWidth: 160,
                                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                                }}>
                                  <div
                                    onClick={() => handleMoveToCollection(c.id, null)}
                                    style={{ padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: ff, fontSize: 12, color: c.collection_id ? M : T, background: c.collection_id ? 'transparent' : 'rgba(255,255,255,0.06)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                    onMouseLeave={e => e.currentTarget.style.background = c.collection_id ? 'transparent' : 'rgba(255,255,255,0.06)'}
                                  >
                                    Sem pasta
                                  </div>
                                  {collections.map(col => (
                                    <div key={col.id}
                                      onClick={() => handleMoveToCollection(c.id, col.id)}
                                      style={{ padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: ff, fontSize: 12, color: c.collection_id === col.id ? col.color : T, display: 'flex', alignItems: 'center', gap: 8, background: c.collection_id === col.id ? `${col.color}15` : 'transparent' }}
                                      onMouseEnter={e => e.currentTarget.style.background = `${col.color}15`}
                                      onMouseLeave={e => e.currentTarget.style.background = c.collection_id === col.id ? `${col.color}15` : 'transparent'}
                                    >
                                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                                      {col.name}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          <button className="action-btn" onClick={e => { e.stopPropagation(); setDeleteTarget(c.id) }}
                            title="Excluir"
                            style={{ opacity: 0, transition: 'opacity 0.15s', background: 'none', border: `1px solid rgba(255,69,58,0.2)`, borderRadius: 5, width: 26, height: 26, cursor: 'pointer', color: '#FF453A', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            ✕
                          </button>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}88` }} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            /* MODO GRADE */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {paginatedCarousels.map((c, i) => {
                const tema = c.tema.length > 55 ? c.tema.slice(0, 55) + '…' : c.tema
                const coverUrl = c.carousel_slides?.find(s => s.position === 1)?.bg_image_url
                const isConfirming = deleteTarget === c.id
                const isDeleting = deletingId === c.id
                return (
                  <motion.div key={c.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.25 }}
                    style={{ position: 'relative', opacity: isDeleting ? 0.4 : 1 }}
                  >
                    <div
                      onClick={() => !isConfirming && navigate(`/studio?carousel_id=${c.id}`)}
                      style={{
                        ...GLASS, borderRadius: 12, overflow: 'hidden',
                        cursor: isConfirming ? 'default' : 'pointer',
                        border: isConfirming ? '1px solid rgba(255,69,58,0.4)' : '1px solid rgba(255,255,255,0.07)',
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={e => {
                        if (!isConfirming) {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'
                          e.currentTarget.querySelectorAll<HTMLElement>('.action-btn-g').forEach(b => b.style.opacity = '1')
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isConfirming) {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                          e.currentTarget.querySelectorAll<HTMLElement>('.action-btn-g').forEach(b => b.style.opacity = '0')
                        }
                      }}
                    >
                      {/* Thumbnail grande */}
                      <div style={{
                        width: '100%', aspectRatio: '4/5',
                        backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        background: coverUrl ? undefined : 'rgba(255,255,255,0.03)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative',
                      }}>
                        {!coverUrl && <span style={{ fontFamily: ffd, fontSize: 24, color: 'rgba(255,255,255,0.1)' }}>{i + 1}</span>}
                        {!isConfirming && (
                          <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4 }}>
                            <button className="action-btn-g" onClick={e => { e.stopPropagation(); navigate(`/studio?tema=${encodeURIComponent(c.tema)}`) }}
                              title="Refazer"
                              style={{ opacity: 0, transition: 'opacity 0.15s', width: 26, height: 26, borderRadius: 5, border: 'none', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              ↺
                            </button>
                            <button className="action-btn-g" onClick={e => { e.stopPropagation(); setDeleteTarget(c.id) }}
                              title="Excluir"
                              style={{ opacity: 0, transition: 'opacity 0.15s', width: 26, height: 26, borderRadius: 5, border: 'none', background: 'rgba(255,69,58,0.7)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                      {/* Info + ações */}
                      <div style={{ padding: '10px 12px' }}>
                        {isConfirming ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                            <span style={{ fontFamily: ff, fontSize: 11, color: 'rgba(255,69,58,0.8)', flex: 1 }}>Excluir?</span>
                            <button onClick={() => handleDelete(c.id)} style={{ height: 22, padding: '0 8px', borderRadius: 4, border: 'none', background: '#FF453A', color: '#fff', fontFamily: ff, fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>Sim</button>
                            <button onClick={() => setDeleteTarget(null)} style={{ height: 22, padding: '0 8px', borderRadius: 4, background: 'rgba(255,255,255,0.08)', border: 'none', color: M, fontFamily: ff, fontSize: 10, cursor: 'pointer' }}>Não</button>
                          </div>
                        ) : (
                          <span style={{ fontFamily: ff, fontSize: 12, color: M, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tema}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Paginação */}
          {totalCarouselPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 8 }}>
              <button
                onClick={() => setCarouselPage(p => Math.max(0, p - 1))}
                disabled={carouselPage === 0}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                  background: carouselPage === 0 ? 'transparent' : 'rgba(255,255,255,0.04)',
                  color: carouselPage === 0 ? 'rgba(255,255,255,0.2)' : '#F5F5F5',
                  cursor: carouselPage === 0 ? 'default' : 'pointer', fontSize: 14,
                }}
              >‹</button>
              <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                {carouselPage + 1} / {totalCarouselPages}
              </span>
              <button
                onClick={() => setCarouselPage(p => Math.min(totalCarouselPages - 1, p + 1))}
                disabled={carouselPage >= totalCarouselPages - 1}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                  background: carouselPage >= totalCarouselPages - 1 ? 'transparent' : 'rgba(255,255,255,0.04)',
                  color: carouselPage >= totalCarouselPages - 1 ? 'rgba(255,255,255,0.2)' : '#F5F5F5',
                  cursor: carouselPage >= totalCarouselPages - 1 ? 'default' : 'pointer', fontSize: 14,
                }}
              >›</button>
            </div>
          )}
        </section>


      </main>
    </div>
  )
}
