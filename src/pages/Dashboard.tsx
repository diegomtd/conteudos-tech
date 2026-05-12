import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Zap, Calendar, Settings,
  ChevronLeft, TrendingUp, Sparkles, Users, Shield,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Profile, ScheduledPost, WeeklyTrend } from '@/types'

type CarouselWithCover = {
  id: string
  tema: string
  status: string
  created_at: string
  exported_at?: string | null
  carousel_slides?: { bg_image_url: string | null; position: number }[] | null
}

// ─── Design tokens ────────────────────────────────────────────────
const A   = '#00D4FF'
const BG  = '#010816'
const S   = '#0A1628'
const S2  = '#0F2040'
const T   = '#E8F4FF'
const M   = 'rgba(232,244,255,0.42)'
const B   = 'rgba(255,255,255,0.07)'
const ff  = 'DM Sans, sans-serif'
const ffd = '"Bebas Neue", sans-serif'

const CARD_BG = S

// ─── Plan config ──────────────────────────────────────────────────
const PLAN_LABELS: Record<string, string> = {
  free: 'FREE', criador: 'CRIADOR', profissional: 'PROFISSIONAL', agencia: 'AGÊNCIA',
}
const PLAN_COLOR: Record<string, string> = {
  free: M, criador: '#00B4D8', profissional: A, agencia: '#A855F7',
}
const PLAN_BORDER_SIDEBAR: Record<string, string> = {
  free: 'rgba(255,255,255,0.3)', criador: '#00B4D8',
  profissional: T, agencia: '#F59E0B',
}

const STATUS_COLOR: Record<string, string> = {
  draft: '#555', exported: A, scheduled: '#F59E0B',
}
const STATUS_LABEL: Record<string, string> = {
  draft: 'rascunho', exported: 'exportado', scheduled: 'agendado',
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
      background: `linear-gradient(90deg, ${S2} 25%, rgba(255,255,255,0.06) 50%, ${S2} 75%)`,
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

// ─── Gradient border card ─────────────────────────────────────────
function GradCard({
  children, accentColor = A, style = {},
}: {
  children: React.ReactNode
  accentColor?: string
  style?: React.CSSProperties
}) {
  return (
    <div style={{
      background: `linear-gradient(${CARD_BG}, ${CARD_BG}) padding-box,
                   linear-gradient(135deg, ${accentColor}44, ${accentColor}08 60%, transparent) border-box`,
      border: '1px solid transparent',
      borderRadius: 16,
      padding: '22px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      ...style,
    }}>
      {children}
    </div>
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
      width: W, minHeight: '100vh', background: BG,
      borderRight: `1px solid ${B}`,
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
            <span style={{ fontFamily: ffd, fontSize: 22, color: T, letterSpacing: 1 }}>
              Conteúd <span style={{ color: A }}>OS</span>
            </span>
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
                {plan === 'profissional' || plan === 'agencia' ? 'Ilimitadas' : `${profile.exports_used_this_month} / ${profile.exports_limit}`}
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
  const [nextPost, setNextPost]             = useState<ScheduledPost | null>(null)
  const [trends, setTrends]                 = useState<WeeklyTrend | null>(null)
  const [loading, setLoading]               = useState(true)
  const [viewMode, setViewMode]             = useState<'list' | 'grid'>('list')

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
          .select('id, tema, status, created_at, exported_at, carousel_slides(bg_image_url, position)')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(5),
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

      setLoading(false)
    }
    load()
  }, [user])

  // ── Derived values ─────────────────────────────────────────────
  const plan         = profile?.plan ?? 'free'
  const exportsUsed  = profile?.exports_used_this_month ?? 0
  const exportsLimit = profile?.exports_limit ?? 1
  const exportPct    = Math.min(100, (exportsUsed / Math.max(1, exportsLimit)) * 100)
  const barColor     = exportPct >= 90 ? '#EF4444' : exportPct >= 70 ? '#F59E0B' : A

  const aiImgLimit = profile?.ai_images_limit ?? 0
  const aiImgUsed  = profile?.ai_images_used_this_month ?? 0
  const aiImgPct   = aiImgLimit > 0 ? Math.min(100, (aiImgUsed / aiImgLimit) * 100) : 0
  const aiImgColor = aiImgPct >= 90 ? '#EF4444' : aiImgPct >= 70 ? '#F59E0B' : '#00B4D8'

  const nextPostLabel = nextPost
    ? new Date(nextPost.scheduled_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : 'Nenhum'
  const renewLabel = plan === 'free' ? 'gratuito' : 'renova em 30 dias'

  // ── Count-up ───────────────────────────────────────────────────
  const countExports  = useCountUp(exportsUsed, !loading)
  const countCarousels = useCountUp(carouselsCount, !loading)
  const countAI       = useCountUp(aiImgUsed, !loading)

  // ── Idea topics ────────────────────────────────────────────────
  const ideaTopics: string[] = (() => {
    if (trends && Array.isArray(trends.temas) && trends.temas.length >= 3) return trends.temas.slice(0, 3)
    const niche = profile?.niche?.toLowerCase() ?? ''
    const byNiche = Object.entries(NICHE_IDEAS).find(([k]) => niche.includes(k))
    return byNiche ? byNiche[1] : GENERIC_IDEAS
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

      <main style={{ flex: 1, minWidth: 0, padding: '36px 44px', overflowY: 'auto' }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36, gap: 24 }}>
          <div>
            {loading ? (
              <>
                <Skeleton w={340} h={52} r={6} />
                <div style={{ marginTop: 10 }}><Skeleton w={220} h={16} r={4} /></div>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                <h1 style={{
                  fontFamily: ffd, fontSize: 48, letterSpacing: 2, margin: 0, lineHeight: 1,
                  background: `linear-gradient(90deg, ${T} 30%, ${A} 80%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  {greeting()}, {profile?.display_name?.toUpperCase() ?? 'USUÁRIO'}
                </h1>
                <p style={{ fontFamily: ff, fontSize: 13, color: M, margin: '8px 0 0', textTransform: 'capitalize' }}>
                  {formatDate()}
                </p>
              </motion.div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/studio')}
            style={{
              background: A, color: '#000', border: 'none',
              borderRadius: 10, padding: '14px 28px', cursor: 'pointer',
              fontFamily: ffd, fontSize: 18, letterSpacing: 1,
              whiteSpace: 'nowrap', flexShrink: 0,
              animation: 'btn-pulse 2.4s ease-in-out infinite',
            }}
          >
            + NOVA CRIAÇÃO
          </motion.button>
        </div>

        {/* ── Metric cards ───────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: 14, marginBottom: 36,
        }}>

          {/* Card: Exportações */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <GradCard accentColor={barColor}>
              <span style={{ fontFamily: ff, fontSize: 11, color: M, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                Exportações
              </span>
              {loading ? <Skeleton w={80} h={52} r={4} /> : (
                <span style={{ fontFamily: ffd, fontSize: 56, color: barColor, lineHeight: 1, letterSpacing: 1 }}>
                  {plan === 'profissional' || plan === 'agencia' ? '∞' : countExports}
                </span>
              )}
              <span style={{ fontFamily: ff, fontSize: 12, color: M }}>
                {plan === 'profissional' || plan === 'agencia'
                  ? 'ilimitadas'
                  : `de ${exportsLimit} este mês`}
              </span>
              {!loading && plan !== 'profissional' && plan !== 'agencia' && (
                <GlowBar pct={exportPct} color={barColor} />
              )}
            </GradCard>
          </motion.div>

          {/* Card: Imagens IA */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}>
            <GradCard accentColor="#00B4D8">
              <span style={{ fontFamily: ff, fontSize: 11, color: M, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                Imagens IA
              </span>
              {loading ? <Skeleton w={80} h={52} r={4} /> : aiImgLimit > 0 ? (
                <>
                  <span style={{ fontFamily: ffd, fontSize: 56, color: '#00B4D8', lineHeight: 1, letterSpacing: 1 }}>
                    {countAI}
                  </span>
                  <span style={{ fontFamily: ff, fontSize: 12, color: M }}>de {aiImgLimit} este mês</span>
                  <GlowBar pct={aiImgPct} color={aiImgColor} />
                </>
              ) : (
                <>
                  <span style={{ fontFamily: ffd, fontSize: 32, color: 'rgba(255,255,255,0.2)', lineHeight: 1 }}>—</span>
                  <span style={{ fontFamily: ff, fontSize: 12, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
                    {plan === 'free' ? 'Upgrade para gerar' : 'Não incluso'}
                  </span>
                </>
              )}
            </GradCard>
          </motion.div>

          {/* Card: Carrosseis */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <GradCard accentColor="rgba(255,255,255,0.3)">
              <span style={{ fontFamily: ff, fontSize: 11, color: M, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                Carrosseis
              </span>
              {loading ? <Skeleton w={80} h={52} r={4} /> : (
                <span style={{ fontFamily: ffd, fontSize: 56, color: T, lineHeight: 1, letterSpacing: 1 }}>
                  {countCarousels}
                </span>
              )}
              <span style={{ fontFamily: ff, fontSize: 12, color: M }}>criados no total</span>
            </GradCard>
          </motion.div>

          {/* Card: Plano */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}>
            <GradCard accentColor={PLAN_COLOR[plan]}>
              <span style={{ fontFamily: ff, fontSize: 11, color: M, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                Plano atual
              </span>
              {loading ? (
                <>
                  <Skeleton w={120} h={52} r={4} />
                  <Skeleton w={100} h={14} r={4} />
                </>
              ) : (
                <>
                  {/* Badge with shine */}
                  <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-flex', alignItems: 'center' }}>
                    <span style={{
                      fontFamily: ffd, fontSize: 52, color: PLAN_COLOR[plan],
                      lineHeight: 1, letterSpacing: 1, position: 'relative',
                    }}>
                      {PLAN_LABELS[plan]}
                    </span>
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.2) 50%, transparent 75%)',
                      animation: 'badge-shine 3s ease-in-out infinite',
                      pointerEvents: 'none',
                    }} />
                  </div>
                  <span style={{ fontFamily: ff, fontSize: 12, color: M }}>{renewLabel}</span>
                  {nextPost && (
                    <span style={{ fontFamily: ff, fontSize: 11, color: '#F59E0B' }}>
                      próximo: {nextPostLabel}
                    </span>
                  )}
                </>
              )}
            </GradCard>
          </motion.div>
        </div>

        {/* ── Recentes ───────────────────────────────────────── */}
        <section style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: ffd, fontSize: 22, color: T, margin: 0, letterSpacing: 1.5 }}>
              RECENTES
            </h2>
            {recentCarousels.length > 0 && (
              <div style={{ display: 'flex', gap: 4 }}>
                {(['list', 'grid'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    style={{
                      width: 32, height: 32, borderRadius: 6, border: `1px solid ${viewMode === mode ? 'rgba(200,255,0,0.4)' : B}`,
                      background: viewMode === mode ? 'rgba(200,255,0,0.08)' : 'none',
                      cursor: 'pointer', color: viewMode === mode ? A : M,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                    title={mode === 'list' ? 'Lista' : 'Grade'}
                  >
                    {mode === 'list' ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                        <rect x="0" y="1" width="14" height="2.5" rx="1"/>
                        <rect x="0" y="5.75" width="14" height="2.5" rx="1"/>
                        <rect x="0" y="10.5" width="14" height="2.5" rx="1"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                        <rect x="0" y="0" width="6" height="6" rx="1.5"/>
                        <rect x="8" y="0" width="6" height="6" rx="1.5"/>
                        <rect x="0" y="8" width="6" height="6" rx="1.5"/>
                        <rect x="8" y="8" width="6" height="6" rx="1.5"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── 3 Cards de ação ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 40 }}>
            {[
              {
                icon: <Sparkles size={20} />,
                title: 'Criar com IA',
                desc: 'Dê um tópico e deixe a IA montar o carrossel completo — texto, layout e imagens.',
                cta: 'Começar →',
                onClick: () => navigate('/studio'),
                accent: true,
              },
              {
                icon: <TrendingUp size={20} />,
                title: 'Buscar Ideias',
                desc: 'A IA sugere 8 temas virais baseados no seu nicho. Escolha e já vá criando.',
                cta: 'Ver ideias →',
                onClick: () => navigate('/studio?buscar=1'),
                accent: false,
              },
              {
                icon: <Zap size={20} />,
                title: 'Criar do Zero',
                desc: 'Abra o editor e construa seu carrossel manualmente, slide por slide.',
                cta: 'Abrir editor →',
                onClick: () => navigate('/studio?blank=1'),
                accent: false,
              },
            ].map((card) => (
              <motion.div
                key={card.title}
                whileHover={{ y: -3 }}
                onClick={card.onClick}
                style={{
                  background: card.accent ? 'rgba(200,255,0,0.06)' : '#0A0A0A',
                  border: `1px solid ${card.accent ? 'rgba(200,255,0,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 14, padding: '22px 20px',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12,
                  transition: 'box-shadow 0.2s',
                }}
              >
                <div style={{ color: card.accent ? '#C8FF00' : 'rgba(255,255,255,0.45)' }}>{card.icon}</div>
                <div>
                  <p style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 18, color: '#F5F5F5', margin: '0 0 6px', letterSpacing: 0.5 }}>{card.title}</p>
                  <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.55 }}>{card.desc}</p>
                </div>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: card.accent ? '#C8FF00' : 'rgba(255,255,255,0.45)', fontWeight: 600, marginTop: 'auto' }}>{card.cta}</span>
              </motion.div>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ background: S, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Skeleton w={44} h={44} r={6} />
                  <Skeleton w="55%" h={16} r={4} />
                  <div style={{ marginLeft: 'auto' }}><Skeleton w={70} h={14} r={4} /></div>
                </div>
              ))}
            </div>
          ) : recentCarousels.length === 0 ? (
            <EmptyState onNew={() => navigate('/studio')} />
          ) : viewMode === 'list' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentCarousels.map((c, i) => {
                const tema        = c.tema.length > 60 ? c.tema.slice(0, 60) + '…' : c.tema
                const statusColor = STATUS_COLOR[c.status] ?? '#555'
                const coverUrl    = c.carousel_slides?.find(s => s.position === 1)?.bg_image_url
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.35 }}
                    whileHover={{ y: -2 }}
                    onClick={() => navigate(`/studio?carousel_id=${c.id}`)}
                    style={{
                      background: S, border: `1px solid ${B}`, borderRadius: 12,
                      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14,
                      cursor: 'pointer', transition: 'box-shadow 0.2s, border-color 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.5)`
                      e.currentTarget.style.borderColor = `${statusColor}40`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.borderColor = B
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 6, flexShrink: 0,
                      backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      backgroundColor: coverUrl ? undefined : 'rgba(200,255,0,0.06)',
                      border: `1px solid ${B}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {!coverUrl && (
                        <span style={{ fontFamily: ffd, fontSize: 16, color: 'rgba(200,255,0,0.3)' }}>{i + 1}</span>
                      )}
                    </div>

                    {/* Tema */}
                    <span style={{
                      fontFamily: ff, fontSize: 14, color: T,
                      flex: 1, minWidth: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {tema}
                    </span>

                    {/* Time */}
                    <span style={{ fontFamily: ff, fontSize: 12, color: M, flexShrink: 0 }}>
                      {relativeTime(c.created_at)}
                    </span>

                    {/* Status badge */}
                    <span style={{
                      fontFamily: ff, fontSize: 11, color: statusColor,
                      border: `1px solid ${statusColor}60`,
                      borderRadius: 20, padding: '3px 10px', flexShrink: 0,
                    }}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {recentCarousels.map((c, i) => {
                const tema        = c.tema.length > 40 ? c.tema.slice(0, 40) + '…' : c.tema
                const statusColor = STATUS_COLOR[c.status] ?? '#555'
                const coverUrl    = c.carousel_slides?.find(s => s.position === 1)?.bg_image_url
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    whileHover={{ y: -3 }}
                    onClick={() => navigate(`/studio?carousel_id=${c.id}`)}
                    style={{
                      height: 200, borderRadius: 12, overflow: 'hidden',
                      position: 'relative', cursor: 'pointer',
                      backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      backgroundColor: coverUrl ? undefined : S2,
                      border: `1px solid ${B}`,
                      transition: 'box-shadow 0.2s, border-color 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.6)`
                      e.currentTarget.style.borderColor = `${statusColor}50`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.borderColor = B
                    }}
                  >
                    {/* Gradient overlay */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)',
                      pointerEvents: 'none',
                    }} />

                    {/* No-image background number */}
                    {!coverUrl && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontFamily: ffd, fontSize: 64, color: 'rgba(200,255,0,0.06)' }}>{i + 1}</span>
                      </div>
                    )}

                    {/* Status badge */}
                    <span style={{
                      position: 'absolute', top: 10, right: 10,
                      fontFamily: ff, fontSize: 10, color: statusColor,
                      border: `1px solid ${statusColor}60`,
                      borderRadius: 20, padding: '2px 8px',
                      backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    }}>
                      {STATUS_LABEL[c.status]}
                    </span>

                    {/* Footer */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      padding: '10px 12px',
                    }}>
                      <p style={{ fontFamily: ff, fontSize: 11, color: T, margin: 0, lineHeight: 1.4 }}>
                        {tema}
                      </p>
                      <p style={{ fontFamily: ff, fontSize: 10, color: M, margin: '3px 0 0' }}>
                        {relativeTime(c.created_at)}
                      </p>
                    </div>

                    {/* Prompt usado */}
                    {c.carousel_slides && c.carousel_slides.length > 0 && (
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        paddingTop: 8, marginTop: 4,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                        padding: '8px 12px',
                      }}>
                        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.tema}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(c.tema); toast.success('Tema copiado') }}
                          style={{ flexShrink: 0, background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '2px 8px', color: 'rgba(255,255,255,0.35)', fontSize: 10, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}>
                          Copiar
                        </button>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Inspiração ─────────────────────────────────────── */}
        {!loading && (
          <section>
            <h2 style={{
              fontFamily: ffd, fontSize: 22, color: T, margin: '0 0 16px', letterSpacing: 1.5,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <TrendingUp size={20} color={A} />
              {trends ? 'TEMAS EM ALTA' : 'IDEIAS PARA HOJE'}
            </h2>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {ideaTopics.map((tema, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/studio?tema=${encodeURIComponent(tema)}`)}
                  style={{
                    flex: '1 1 220px', minWidth: 0,
                    background: `linear-gradient(135deg, ${S2} 0%, ${S} 100%)`,
                    border: `1px solid rgba(200,255,0,0.12)`,
                    borderRadius: 14, padding: '18px 20px',
                    cursor: 'pointer', textAlign: 'left',
                    display: 'flex', flexDirection: 'column', gap: 10,
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(200,255,0,0.35)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(200,255,0,0.12)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={14} color={A} />
                    <span style={{ fontFamily: ff, fontSize: 11, color: A, textTransform: 'uppercase', letterSpacing: 1 }}>
                      ideia #{i + 1}
                    </span>
                  </div>
                  <span style={{ fontFamily: ff, fontSize: 13, color: T, lineHeight: 1.5 }}>
                    {tema}
                  </span>
                  <span style={{
                    fontFamily: ff, fontSize: 12, color: A,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    Criar agora →
                  </span>
                </motion.button>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
