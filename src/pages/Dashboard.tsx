import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Zap, Calendar, Settings,
  ChevronLeft, Layers, TrendingUp,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Profile, Carousel, ScheduledPost, WeeklyTrend } from '@/types'

// ─── Design tokens ────────────────────────────────────────────
const A = '#C8FF00'
const BG = '#080808'
const S = '#0F0F0F'
const S2 = '#1A1A1A'
const T = '#F5F5F5'
const M = 'rgba(255,255,255,0.45)'
const B = 'rgba(255,255,255,0.08)'
const ff = 'DM Sans, sans-serif'
const ffd = 'Bebas Neue, sans-serif'

// ─── Helpers ──────────────────────────────────────────────────
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
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 60)  return `há ${mins} minuto${mins !== 1 ? 's' : ''}`
  if (hours < 24) return `há ${hours} hora${hours !== 1 ? 's' : ''}`
  if (days === 1) return 'ontem'
  return `há ${days} dias`
}


const PLAN_LABELS: Record<string, string> = {
  free: 'FREE', criador: 'CRIADOR', profissional: 'PRO', agencia: 'AGÊNCIA',
}

const PLAN_BORDER: Record<string, string> = {
  free: 'rgba(255,255,255,0.3)',
  criador: A,
  profissional: '#F5F5F5',
  agencia: '#F59E0B',
}

const STATUS_COLOR: Record<string, string> = {
  draft: '#888',
  exported: A,
  scheduled: '#F59E0B',
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'rascunho',
  exported: 'exportado',
  scheduled: 'agendado',
}

// ─── Skeleton ─────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 20, r = 8 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: `linear-gradient(90deg, ${S2} 25%, rgba(255,255,255,0.06) 50%, ${S2} 75%)`,
      backgroundSize: '400% 100%',
      animation: 'pulse 1.4s ease-in-out infinite',
    }} />
  )
}

// ─── Sidebar ──────────────────────────────────────────────────
const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Studio',    icon: Zap,             path: '/studio'    },
  { label: 'Calendário',icon: Calendar,         path: '/calendar'  },
  { label: 'Configurações', icon: Settings,     path: '/settings'  },
]

function Sidebar({
  open, onToggle, profile,
}: {
  open: boolean
  onToggle: () => void
  profile: Profile | null
}) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const W = open ? 240 : 64

  const pct = profile
    ? Math.min(100, (profile.exports_used_this_month / Math.max(1, profile.exports_limit)) * 100)
    : 0
  const barColor = pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : A
  const plan = profile?.plan ?? 'free'

  const aiLimit = profile?.ai_images_limit ?? 0
  const aiUsed  = profile?.ai_images_used_this_month ?? 0
  const aiPct   = aiLimit > 0 ? Math.min(100, (aiUsed / aiLimit) * 100) : 100
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
        borderBottom: `1px solid ${B}`,
        flexShrink: 0,
      }}>
        {open ? (
          <>
            <span style={{ fontFamily: ffd, fontSize: 22, color: T, letterSpacing: 1 }}>
              Conteúd <span style={{ color: A }}>OS</span>
            </span>
            <button onClick={onToggle} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: M, padding: 4, display: 'flex', alignItems: 'center',
            }}>
              <ChevronLeft size={18} />
            </button>
          </>
        ) : (
          <button onClick={onToggle} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: ffd, fontSize: 20, color: A, letterSpacing: 1,
            display: 'flex', alignItems: 'center',
          }}>
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
              {open && (
                <span style={{ fontFamily: ff, fontSize: 14, whiteSpace: 'nowrap' }}>{label}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: open ? '16px 16px 24px' : '16px 8px 24px',
        borderTop: `1px solid ${B}`,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {/* Plan badge */}
        <div style={{
          border: `1px solid ${PLAN_BORDER[plan]}`,
          borderRadius: 6, padding: open ? '6px 10px' : '6px',
          display: 'flex', alignItems: 'center', justifyContent: open ? 'flex-start' : 'center',
          gap: 6,
        }}>
          <span style={{
            fontFamily: ffd, fontSize: 13, letterSpacing: 1,
            color: plan === 'free' ? M : plan === 'agencia' ? '#F59E0B' : T,
          }}>
            {open ? PLAN_LABELS[plan] : PLAN_LABELS[plan][0]}
          </span>
        </div>

        {/* Progress bar (expanded only) */}
        {open && profile && (
          <>
            {/* Exportações */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: ff, fontSize: 11, color: M, letterSpacing: 0.5 }}>Exportações</span>
              <div style={{ height: 4, borderRadius: 2, background: B, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pct}%`,
                  background: barColor, borderRadius: 2,
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <span style={{ fontFamily: ff, fontSize: 11, color: M }}>
                {plan === 'profissional' || plan === 'agencia'
                  ? 'Ilimitadas'
                  : `${profile.exports_used_this_month} / ${profile.exports_limit}`}
              </span>
            </div>

            {/* Imagens IA */}
            {aiLimit > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontFamily: ff, fontSize: 11, color: M, letterSpacing: 0.5 }}>Imagens IA</span>
                <div style={{ height: 4, borderRadius: 2, background: B, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${aiPct}%`,
                    background: aiBarColor, borderRadius: 2,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                <span style={{ fontFamily: ff, fontSize: 11, color: M }}>
                  {aiUsed} / {aiLimit}
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontFamily: ff, fontSize: 11, color: M }}>Imagens IA</span>
                <span style={{ fontFamily: ff, fontSize: 11, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
                  {plan === 'free' ? 'Upgrade para gerar imagens IA' : 'Não incluso'}
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

// ─── Metric card ──────────────────────────────────────────────
function MetricCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: S, border: `1px solid ${B}`,
      borderRadius: 12, padding: 20,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <span style={{ fontFamily: ff, fontSize: 12, color: M, textTransform: 'lowercase', letterSpacing: 0.3 }}>
        {label}
      </span>
      {children}
    </div>
  )
}

// ─── Main dashboard ───────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebar_open')
    return saved !== null ? saved === 'true' : true
  })

  const [profile, setProfile] = useState<Profile | null>(null)
  const [carouselsCount, setCarouselsCount] = useState<number>(0)
  const [recentCarousels, setRecentCarousels] = useState<Carousel[]>([])
  const [nextPost, setNextPost] = useState<ScheduledPost | null>(null)
  const [trends, setTrends] = useState<WeeklyTrend | null>(null)
  const [loading, setLoading] = useState(true)

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
          .select('id, tema, status, created_at')
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
      setRecentCarousels((recent as Carousel[]) ?? [])
      setNextPost(next?.[0] as ScheduledPost ?? null)

      // weekly trends (depends on niche from profile)
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

  const plan = profile?.plan ?? 'free'

  const exportsUsed = profile?.exports_used_this_month ?? 0
  const exportsLimit = profile?.exports_limit ?? 1
  const exportPct = Math.min(100, (exportsUsed / Math.max(1, exportsLimit)) * 100)
  const barColor = exportPct >= 90 ? '#EF4444' : exportPct >= 70 ? '#F59E0B' : A

  const aiImgLimit = profile?.ai_images_limit ?? 0
  const aiImgUsed  = profile?.ai_images_used_this_month ?? 0
  const aiImgPct   = aiImgLimit > 0 ? Math.min(100, (aiImgUsed / aiImgLimit) * 100) : 0
  const aiImgColor = aiImgPct >= 90 ? '#EF4444' : aiImgPct >= 70 ? '#F59E0B' : '#00B4D8'

  const nextPostLabel = nextPost
    ? new Date(nextPost.scheduled_at).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
      })
    : 'Nenhum'

  const renewLabel = plan === 'free' ? 'gratuito' : 'renova em 30 dias'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BG, fontFamily: ff }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { background-position: 200% 0; }
          50%       { background-position: -200% 0; }
        }
      `}</style>

      <Sidebar open={sidebarOpen} onToggle={toggleSidebar} profile={profile} />

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, padding: '32px 40px', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            {loading ? (
              <>
                <Skeleton w={280} h={38} r={6} />
                <div style={{ marginTop: 8 }}><Skeleton w={200} h={16} r={4} /></div>
              </>
            ) : (
              <>
                <h1 style={{
                  fontFamily: ffd, fontSize: 32, letterSpacing: 1,
                  color: T, margin: 0,
                }}>
                  {greeting()}, {profile?.display_name?.toUpperCase() ?? 'USUÁRIO'}
                </h1>
                <p style={{ fontFamily: ff, fontSize: 14, color: M, margin: '4px 0 0', textTransform: 'capitalize' }}>
                  {formatDate()}
                </p>
              </>
            )}
          </div>
          <button
            onClick={() => navigate('/studio')}
            style={{
              background: A, color: '#000', border: 'none',
              borderRadius: 8, padding: '12px 24px', cursor: 'pointer',
              fontFamily: ffd, fontSize: 16, letterSpacing: 1,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            NOVA CRIAÇÃO
          </button>
        </div>

        {/* Metrics grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 32,
        }}>
          {/* Card 1 – Exportações + Imagens IA */}
          <MetricCard label="uso este mês">
            {loading ? (
              <Skeleton w={120} h={40} r={4} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                {/* Exportações */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: ff, fontSize: 11, color: M }}>Exportações</span>
                    <span style={{ fontFamily: ff, fontSize: 11, color: plan === 'profissional' || plan === 'agencia' ? A : T, fontWeight: 600 }}>
                      {plan === 'profissional' || plan === 'agencia' ? 'Ilimitadas' : `${exportsUsed} / ${exportsLimit}`}
                    </span>
                  </div>
                  {plan !== 'profissional' && plan !== 'agencia' && (
                    <div style={{ height: 4, borderRadius: 2, background: B, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${exportPct}%`, background: barColor, borderRadius: 2, transition: 'width 0.4s ease' }} />
                    </div>
                  )}
                </div>
                {/* Imagens IA */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: ff, fontSize: 11, color: M }}>Imagens IA</span>
                    <span style={{ fontFamily: ff, fontSize: 11, color: aiImgLimit > 0 ? T : 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
                      {aiImgLimit > 0 ? `${aiImgUsed} / ${aiImgLimit}` : 'Upgrade'}
                    </span>
                  </div>
                  {aiImgLimit > 0 && (
                    <div style={{ height: 4, borderRadius: 2, background: B, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${aiImgPct}%`, background: aiImgColor, borderRadius: 2, transition: 'width 0.4s ease' }} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </MetricCard>

          {/* Card 2 – Carrosseis */}
          <MetricCard label="carrosseis criados">
            {loading ? (
              <Skeleton w={80} h={40} r={4} />
            ) : (
              <span style={{ fontFamily: ffd, fontSize: 36, color: T, lineHeight: 1 }}>
                {carouselsCount}
              </span>
            )}
          </MetricCard>

          {/* Card 3 – Próximo post */}
          <MetricCard label="próximo agendado">
            {loading ? (
              <Skeleton w={160} h={28} r={4} />
            ) : (
              <span style={{
                fontFamily: ffd, fontSize: nextPost ? 28 : 22, color: nextPost ? T : M, lineHeight: 1.1,
              }}>
                {nextPostLabel}
              </span>
            )}
          </MetricCard>

          {/* Card 4 – Plano */}
          <MetricCard label="plano atual">
            {loading ? (
              <>
                <Skeleton w={100} h={28} r={4} />
                <Skeleton w={120} h={14} r={4} />
              </>
            ) : (
              <>
                <span style={{ fontFamily: ffd, fontSize: 28, color: T, lineHeight: 1 }}>
                  {PLAN_LABELS[plan]}
                </span>
                <span style={{ fontFamily: ff, fontSize: 12, color: M }}>{renewLabel}</span>
              </>
            )}
          </MetricCard>
        </div>

        {/* Recentes */}
        <section>
          <h2 style={{ fontFamily: ffd, fontSize: 20, color: T, margin: '0 0 16px', letterSpacing: 1 }}>
            RECENTES
          </h2>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  background: S, borderRadius: 8, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <Skeleton w={8} h={8} r={50} />
                  <Skeleton w="60%" h={16} r={4} />
                  <div style={{ marginLeft: 'auto' }}><Skeleton w={80} h={16} r={4} /></div>
                </div>
              ))}
            </div>
          ) : recentCarousels.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 12, padding: '48px 0',
            }}>
              <Layers size={32} color={M} />
              <span style={{ fontFamily: ff, fontSize: 14, color: M }}>
                Nenhum carrossel criado ainda
              </span>
              <button
                onClick={() => navigate('/studio')}
                style={{
                  background: 'none', border: `1px solid ${B}`, borderRadius: 8,
                  padding: '10px 20px', cursor: 'pointer', color: T,
                  fontFamily: ff, fontSize: 14,
                }}
              >
                Criar primeiro carrossel →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentCarousels.map(c => {
                const tema = c.tema.length > 55 ? c.tema.slice(0, 55) + '…' : c.tema
                const statusColor = STATUS_COLOR[c.status] ?? '#888'
                return (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/studio?carousel_id=${c.id}`)}
                    style={{
                      background: S, borderRadius: 8, padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = S)}
                  >
                    {/* Status dot */}
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: statusColor, flexShrink: 0,
                    }} />

                    {/* Tema */}
                    <span style={{
                      fontFamily: ff, fontSize: 14, color: T, flex: 1, minWidth: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {tema}
                    </span>

                    {/* Date */}
                    <span style={{ fontFamily: ff, fontSize: 12, color: M, flexShrink: 0 }}>
                      {relativeTime(c.created_at)}
                    </span>

                    {/* Badge */}
                    <span style={{
                      fontFamily: ff, fontSize: 11, color: statusColor,
                      border: `1px solid ${statusColor}`,
                      borderRadius: 99, padding: '2px 8px', flexShrink: 0,
                      opacity: 0.85,
                    }}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Weekly trends (conditional) */}
        {!loading && trends && Array.isArray(trends.temas) && trends.temas.length > 0 && (
          <section style={{ marginTop: 40 }}>
            <h2 style={{
              fontFamily: ffd, fontSize: 20, color: T, margin: '0 0 16px', letterSpacing: 1,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <TrendingUp size={18} color={A} />
              TEMAS EM ALTA
            </h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {trends.temas.slice(0, 3).map((tema, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`/studio?tema=${encodeURIComponent(tema)}`)}
                  style={{
                    background: S, border: `1px solid ${B}`,
                    borderRadius: 10, padding: '14px 18px',
                    cursor: 'pointer', textAlign: 'left',
                    flex: '1 1 200px', minWidth: 0,
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(200,255,0,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = B)}
                >
                  <span style={{ fontFamily: ff, fontSize: 13, color: T, display: 'block', lineHeight: 1.4 }}>
                    {tema}
                  </span>
                  <span style={{ fontFamily: ff, fontSize: 11, color: A, marginTop: 6, display: 'block' }}>
                    Criar carrossel →
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
