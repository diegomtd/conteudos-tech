import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Zap, Calendar, Settings as SettingsIcon,
  ChevronLeft, Check, Loader2, Send,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Profile, Plan } from '@/types'

// ─── Tokens ───────────────────────────────────────────────────
const A   = '#C8FF00'
const BG  = '#080808'
const S   = '#0F0F0F'
const S2  = '#1A1A1A'
const T   = '#F5F5F5'
const M   = 'rgba(255,255,255,0.45)'
const B   = 'rgba(255,255,255,0.08)'
const ff  = 'DM Sans, sans-serif'
const ffd = '"Bebas Neue", sans-serif'

const PLAN_LABELS: Record<Plan, string> = {
  free:         'FREE',
  criador:      'CRIADOR',
  profissional: 'PROFISSIONAL',
  agencia:      'AGÊNCIA',
}

const PLAN_BORDER: Record<Plan, string> = {
  free:         'rgba(255,255,255,0.3)',
  criador:      A,
  profissional: '#F5F5F5',
  agencia:      '#F59E0B',
}

const PLAN_UPGRADES = [
  {
    plan: 'criador' as Plan,
    label: 'Criador',
    price: 'R$47/mês',
    features: ['20 exportações/mês', '20 imagens IA'],
    // Substituir pela URL real do produto na Cakto
    url: 'https://pay.cakto.com.br/criador',
  },
  {
    plan: 'profissional' as Plan,
    label: 'Profissional',
    price: 'R$97/mês',
    features: ['Exportações ilimitadas', '60 imagens IA', 'Calendário', 'Telegram'],
    url: 'https://pay.cakto.com.br/profissional',
  },
  {
    plan: 'agencia' as Plan,
    label: 'Agência',
    price: 'R$197/mês',
    features: ['Exportações ilimitadas', '200 imagens IA', '5 subcontas'],
    url: 'https://pay.cakto.com.br/agencia',
  },
]

const NAV = [
  { label: 'Dashboard',     icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Studio',        icon: Zap,             path: '/studio'    },
  { label: 'Calendário',    icon: Calendar,        path: '/calendar'  },
  { label: 'Configurações', icon: SettingsIcon,    path: '/settings'  },
]

// ─── Input compartilhado ──────────────────────────────────────
function Field({
  label, value, onChange, placeholder, prefix,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  prefix?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: ff, fontSize: 12, color: M }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {prefix && (
          <span style={{
            fontFamily: ff, fontSize: 13, color: M,
            background: S2, border: `1px solid ${B}`,
            borderRight: 'none', borderRadius: '6px 0 0 6px',
            padding: '8px 10px', userSelect: 'none',
          }}>
            {prefix}
          </span>
        )}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, background: S2, border: `1px solid ${B}`,
            borderRadius: prefix ? '0 6px 6px 0' : 6,
            color: T, fontFamily: ff, fontSize: 13,
            padding: '8px 12px', outline: 'none',
            transition: 'border-color 0.15s',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(200,255,0,0.4)' }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = B }}
        />
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────
function Sidebar({ open, onToggle, profile }: { open: boolean; onToggle: () => void; profile: Profile | null }) {
  const navigate   = useNavigate()
  const { pathname } = useLocation()
  const W          = open ? 240 : 64
  const plan       = (profile?.plan ?? 'free') as Plan

  return (
    <aside style={{
      width: W, minHeight: '100vh', background: BG,
      borderRight: `1px solid ${B}`,
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.22s ease',
      flexShrink: 0, overflow: 'hidden',
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
              Conteúd<span style={{ color: A }}>OS</span>
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
              color: active ? T : M, transition: 'background 0.15s, color 0.15s',
            }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'none' }}
            >
              <Icon size={18} />
              {open && <span style={{ fontFamily: ff, fontSize: 14, whiteSpace: 'nowrap' }}>{label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Plan badge */}
      <div style={{ padding: open ? '16px 16px 24px' : '16px 8px 24px', borderTop: `1px solid ${B}` }}>
        <div style={{
          border: `1px solid ${PLAN_BORDER[plan]}`,
          borderRadius: 6, padding: open ? '6px 10px' : '6px',
          display: 'flex', alignItems: 'center', justifyContent: open ? 'flex-start' : 'center',
        }}>
          <span style={{ fontFamily: ffd, fontSize: 13, letterSpacing: 1, color: plan === 'free' ? M : T }}>
            {open ? PLAN_LABELS[plan] : PLAN_LABELS[plan][0]}
          </span>
        </div>
      </div>
    </aside>
  )
}

// ─── Section wrapper ──────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: S, border: `1px solid ${B}`, borderRadius: 16,
      padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      <h2 style={{ fontFamily: ffd, fontSize: 22, color: T, margin: 0, letterSpacing: 1 }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────
export default function Settings() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen]   = useState(true)
  const [profile, setProfile]           = useState<Profile | null>(null)
  const [loading, setLoading]           = useState(true)

  // Perfil
  const [displayName, setDisplayName]   = useState('')
  const [instagram, setInstagram]       = useState('')
  const [niche, setNiche]               = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Telegram
  const [chatId, setChatId]             = useState('')
  const [savingTg, setSavingTg]         = useState(false)
  const [testingTg, setTestingTg]       = useState(false)

  // ── Carrega profile ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) return
        const p = data as Profile
        setProfile(p)
        setDisplayName(p.display_name ?? '')
        setInstagram(p.instagram_handle ?? '')
        setNiche(p.niche ?? '')
        setChatId(p.telegram_chat_id ?? '')
        setLoading(false)
      })
  }, [user])

  // ── Salva perfil ─────────────────────────────────────────────
  const saveProfile = async () => {
    if (!user) return
    setSavingProfile(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name:     displayName.trim() || null,
        instagram_handle: instagram.replace('@', '').trim() || null,
        niche:            niche.trim() || null,
      })
      .eq('user_id', user.id)

    if (error) {
      toast.error('Erro ao salvar. Tente novamente.')
    } else {
      setProfile((prev) => prev ? {
        ...prev,
        display_name:     displayName.trim() || null,
        instagram_handle: instagram.replace('@', '').trim() || null,
        niche:            niche.trim() || null,
      } : prev)
      toast.success('Perfil atualizado')
    }
    setSavingProfile(false)
  }

  // ── Salva Telegram chat_id ────────────────────────────────────
  const saveTelegram = async () => {
    if (!user) return
    setSavingTg(true)
    const { error } = await supabase
      .from('profiles')
      .update({ telegram_chat_id: chatId.trim() || null })
      .eq('user_id', user.id)

    if (error) {
      toast.error('Erro ao salvar chat_id.')
    } else {
      setProfile((prev) => prev ? { ...prev, telegram_chat_id: chatId.trim() || null } : prev)
      toast.success('Chat ID salvo')
    }
    setSavingTg(false)
  }

  // ── Testa notificação Telegram ────────────────────────────────
  const testTelegram = async () => {
    if (!user || !chatId.trim()) return
    setTestingTg(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { toast.error('Sessão expirada.'); return }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-telegram`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify({
            user_id:      user.id,
            message_type: 'limit_warning',
          }),
        }
      )
      const data = await res.json()

      if (data.error === 'telegram_not_configured') {
        toast.error('Salve o chat_id antes de testar.')
      } else if (data.error === 'telegram_send_failed') {
        toast.error('Falha ao enviar. Verifique se o chat_id está correto.')
      } else if (data.success) {
        toast.success('Mensagem de teste enviada no Telegram')
      } else {
        toast.error('Erro desconhecido. Veja o console.')
        console.error('[testTelegram]', data)
      }
    } catch (e) {
      toast.error('Erro de rede.')
      console.error(e)
    }
    setTestingTg(false)
  }

  const plan           = (profile?.plan ?? 'free') as Plan
  const exportsUsed    = profile?.exports_used_this_month ?? 0
  const exportsLimit   = profile?.exports_limit ?? 3
  const exportPct      = Math.min(100, (exportsUsed / Math.max(1, exportsLimit)) * 100)
  const exportBarColor = exportPct >= 90 ? '#EF4444' : exportPct >= 70 ? '#F59E0B' : A
  const aiUsed         = profile?.ai_images_used_this_month ?? 0
  const aiLimit        = profile?.ai_images_limit ?? 0
  const aiPct          = aiLimit > 0 ? Math.min(100, (aiUsed / aiLimit) * 100) : 0
  const aiBarColor     = aiPct >= 90 ? '#EF4444' : aiPct >= 70 ? '#F59E0B' : '#00B4D8'
  const isUnlimited    = plan === 'profissional' || plan === 'agencia'

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: BG,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Loader2 size={28} color={A} style={{ animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BG, fontFamily: ff }}>
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        profile={profile}
      />

      <main style={{ flex: 1, minWidth: 0, padding: '40px 48px', overflowY: 'auto' }}>
        <h1 style={{ fontFamily: ffd, fontSize: 32, color: T, margin: '0 0 32px', letterSpacing: 1 }}>
          Configurações
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600 }}>

          {/* ── 1. Perfil ──────────────────────────────────────── */}
          <Section title="Perfil">
            <Field
              label="Nome"
              value={displayName}
              onChange={setDisplayName}
              placeholder="Seu nome"
            />
            <Field
              label="Instagram"
              value={instagram}
              onChange={setInstagram}
              placeholder="seuperfil"
              prefix="@"
            />
            <Field
              label="Nicho"
              value={niche}
              onChange={setNiche}
              placeholder="Ex: marketing digital, finanças, saúde..."
            />
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              style={{
                alignSelf: 'flex-start',
                display: 'flex', alignItems: 'center', gap: 8,
                background: A, color: '#000', border: 'none',
                borderRadius: 8, padding: '10px 22px',
                fontFamily: ffd, fontSize: 15, letterSpacing: 1,
                cursor: savingProfile ? 'wait' : 'pointer',
                opacity: savingProfile ? 0.7 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {savingProfile
                ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Salvando...</>
                : <><Check size={14} /> Salvar perfil</>
              }
            </button>
          </Section>

          {/* ── 2. Plano ───────────────────────────────────────── */}
          <Section title="Plano atual">
            {/* Badge do plano */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                border: `1px solid ${PLAN_BORDER[plan]}`,
                borderRadius: 6, padding: '5px 12px',
                display: 'inline-flex',
              }}>
                <span style={{ fontFamily: ffd, fontSize: 16, letterSpacing: 1, color: plan === 'free' ? M : T }}>
                  {PLAN_LABELS[plan]}
                </span>
              </div>
              <span style={{ fontFamily: ff, fontSize: 12, color: M }}>
                {plan === 'free' ? 'Gratuito' : 'renova em 30 dias'}
              </span>
            </div>

            {/* Barra exportações */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: ff, fontSize: 12, color: M }}>Exportações este mês</span>
                <span style={{ fontFamily: ff, fontSize: 12, color: T, fontWeight: 600 }}>
                  {isUnlimited ? 'Ilimitadas' : `${exportsUsed} / ${exportsLimit}`}
                </span>
              </div>
              {!isUnlimited && (
                <div style={{ height: 5, borderRadius: 3, background: B, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${exportPct}%`,
                    background: exportBarColor, borderRadius: 3,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              )}
            </div>

            {/* Barra imagens IA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: ff, fontSize: 12, color: M }}>Imagens IA este mês</span>
                <span style={{ fontFamily: ff, fontSize: 12, color: aiLimit > 0 ? T : 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
                  {aiLimit > 0 ? `${aiUsed} / ${aiLimit}` : 'Não incluso'}
                </span>
              </div>
              {aiLimit > 0 && (
                <div style={{ height: 5, borderRadius: 3, background: B, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${aiPct}%`,
                    background: aiBarColor, borderRadius: 3,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              )}
            </div>

            {/* Cards de upgrade (só para quem não é agencia) */}
            {plan !== 'agencia' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                <span style={{ fontFamily: ff, fontSize: 12, color: M }}>Fazer upgrade</span>
                {PLAN_UPGRADES.filter((p) => {
                  if (plan === 'free')         return true
                  if (plan === 'criador')      return p.plan === 'profissional' || p.plan === 'agencia'
                  if (plan === 'profissional') return p.plan === 'agencia'
                  return false
                }).map((p) => (
                  <a
                    key={p.plan}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{
                      background: S2, border: `1px solid ${B}`, borderRadius: 10,
                      padding: '14px 18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer', transition: 'border-color 0.15s',
                    }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(200,255,0,0.3)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = B }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontFamily: ffd, fontSize: 15, color: T, letterSpacing: 1 }}>
                          {p.label}
                        </span>
                        <span style={{ fontFamily: ff, fontSize: 11, color: M }}>
                          {p.features.join(' · ')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <span style={{ fontFamily: ffd, fontSize: 16, color: A, letterSpacing: 1 }}>{p.price}</span>
                        <span style={{
                          fontFamily: ff, fontSize: 10, color: '#000',
                          background: A, borderRadius: 4, padding: '2px 7px', fontWeight: 700,
                        }}>
                          ASSINAR
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {plan === 'agencia' && (
              <p style={{ fontFamily: ff, fontSize: 13, color: M, margin: 0 }}>
                Você está no plano máximo. Precisa de mais?{' '}
                <a href="mailto:contato@conteudos.tech" style={{ color: A, textDecoration: 'none' }}>
                  Fale com a gente.
                </a>
              </p>
            )}
          </Section>

          {/* ── 3. Telegram ────────────────────────────────────── */}
          <Section title="Telegram">
            <p style={{ fontFamily: ff, fontSize: 13, color: M, margin: 0, lineHeight: 1.6 }}>
              Receba notificações direto no Telegram quando um carrossel estiver pronto ou um post estiver agendado.
              Para encontrar seu chat ID, envie uma mensagem para{' '}
              <a
                href="https://t.me/userinfobot"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: A, textDecoration: 'none' }}
              >
                @userinfobot
              </a>{' '}
              e copie o número que aparecer.
            </p>

            <Field
              label="Chat ID"
              value={chatId}
              onChange={setChatId}
              placeholder="Ex: 123456789"
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={saveTelegram}
                disabled={savingTg}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: A, color: '#000', border: 'none',
                  borderRadius: 8, padding: '10px 20px',
                  fontFamily: ffd, fontSize: 14, letterSpacing: 1,
                  cursor: savingTg ? 'wait' : 'pointer',
                  opacity: savingTg ? 0.7 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {savingTg
                  ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Salvando...</>
                  : <><Check size={14} /> Salvar</>
                }
              </button>

              <button
                onClick={testTelegram}
                disabled={testingTg || !chatId.trim()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'transparent',
                  border: `1px solid ${!chatId.trim() ? B : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: 8, padding: '10px 20px',
                  fontFamily: ff, fontSize: 13,
                  color: !chatId.trim() ? M : T,
                  cursor: (testingTg || !chatId.trim()) ? 'default' : 'pointer',
                  opacity: testingTg ? 0.7 : 1,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (chatId.trim() && !testingTg) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = !chatId.trim() ? B : 'rgba(255,255,255,0.2)'
                }}
              >
                {testingTg
                  ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Enviando...</>
                  : <><Send size={14} /> Testar notificação</>
                }
              </button>
            </div>

            {profile?.telegram_chat_id && (
              <p style={{ fontFamily: ff, fontSize: 11, color: 'rgba(200,255,0,0.6)', margin: 0 }}>
                Telegram conectado — chat_id: {profile.telegram_chat_id}
              </p>
            )}
          </Section>

        </div>
      </main>
    </div>
  )
}
