import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Users, ChevronRight, Clock, BarChart2, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

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

type AgencyTab = 'clientes' | 'relatorios' | 'configuracoes'

// ─── Types ────────────────────────────────────────────────────
interface Client {
  id: string
  name: string
  niche: string
  plan: string
  created_at: string
}

interface CarouselRow {
  id: string
  tema: string
  status: string
  created_at: string
  exported_at: string | null
}

const NICHES      = ['empreendedorismo','marketing','saúde','autoconhecimento','espiritualidade','tecnologia','lifestyle','educação','finanças','outro']
const TONES       = [
  { slug: 'provocador',    label: 'Provocador e direto',     example: 'Você está sabotando seu crescimento sem perceber' },
  { slug: 'educativo',     label: 'Educativo e estruturado', example: '5 erros que impedem o crescimento no Instagram' },
  { slug: 'bastidor',      label: 'Bastidor e humano',       example: 'Hoje aprendi algo que mudou como vejo conteúdo' },
  { slug: 'inspiracional', label: 'Inspiracional e leve',    example: 'Pequenas ações consistentes criam grandes resultados' },
]
const PALETTE     = ['#C8FF00','#FF6B2B','#00B4D8','#A855F7','#F43F5E','#10B981','#F59E0B','#FFFFFF']
const KIT_PALETTE = ['#C8FF00','#FF6B2B','#00B4D8','#A855F7','#F43F5E','#FFFFFF']
const STYLES      = [
  { slug: 'dark_cinematic', label: 'Dark Cinematic', bg: 'linear-gradient(135deg,#0a0a0a,#1a2a3a)' },
  { slug: 'light_clean',    label: 'Light Clean',    bg: 'linear-gradient(135deg,#f8f8f8,#e0e0e0)' },
  { slug: 'colorful',       label: 'Colorido',       bg: 'linear-gradient(135deg,#FF6B2B,#A855F7)' },
  { slug: 'minimal_bw',     label: 'Minimalista',    bg: 'linear-gradient(135deg,#222,#555)' },
]

const inputSt: React.CSSProperties = {
  width: '100%', backgroundColor: S2, border: `1px solid ${B}`,
  borderRadius: 8, padding: '11px 14px', color: T, fontSize: 14,
  fontFamily: ff, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
}
const labelSt: React.CSSProperties = { display: 'block', color: M, fontSize: 13, fontFamily: ff, fontWeight: 500, marginBottom: 8 }

interface NewClientData { name: string; niche: string; tom: string; cor: string; estilo: string }

// ─── New client modal ─────────────────────────────────────────
function NewClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Client) => void }) {
  const { user } = useAuth()
  const [modalStep, setModalStep] = useState(1)
  const [saving, setSaving]       = useState(false)
  const [err, setErr]             = useState('')
  const [data, setData]           = useState<NewClientData>({ name: '', niche: '', tom: '', cor: '#C8FF00', estilo: 'dark_cinematic' })
  const upd = (d: Partial<NewClientData>) => setData((p) => ({ ...p, ...d }))

  const canNext = () => {
    if (modalStep === 1) return data.name.trim().length > 0 && data.niche.length > 0
    if (modalStep === 2) return data.tom.length > 0
    return true
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true); setErr('')
    try {
      const { data: org, error: orgErr } = await supabase.from('organizations')
        .insert({ owner_user_id: user.id, name: data.name, plan: 'client' }).select().single()
      if (orgErr) throw orgErr
      const { data: profile, error: profErr } = await supabase.from('profiles').insert({
        user_id: user.id,
        organization_id: org.id,
        display_name: data.name,
        niche: data.niche,
        role: 'member',
        voice_profile: { tom: data.tom },
        visual_kit: { cor: data.cor, estilo: data.estilo, fonte: 'Bebas Neue' },
        plan: 'client',
      }).select().single()
      if (profErr) throw profErr
      void profile
      onCreated({ id: org.id, name: data.name, niche: data.niche, plan: 'client', created_at: org.created_at as string })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao criar cliente')
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ backgroundColor: S, border: '1px solid rgba(200,255,0,0.2)', borderRadius: 16, padding: '32px 36px', width: '100%', maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h3 style={{ fontFamily: ffd, fontSize: 28, color: A, margin: 0, letterSpacing: 1.5 }}>NOVO CLIENTE</h3>
            <p style={{ color: M, fontSize: 12, fontFamily: ff, margin: '4px 0 0' }}>Passo {modalStep} de 3</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: M, cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>

        <div style={{ height: 2, backgroundColor: B, borderRadius: 99, marginBottom: 24 }}>
          <div style={{ height: '100%', backgroundColor: A, borderRadius: 99, width: `${(modalStep / 3) * 100}%`, transition: 'width 0.3s' }} />
        </div>

        <AnimatePresence mode="wait">
          {modalStep === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelSt}>Nome do cliente ou marca</label>
                <input style={inputSt} value={data.name} onChange={(e) => upd({ name: e.target.value })} placeholder="Ex: Studio Clara" autoFocus
                  onFocus={(e) => { e.target.style.borderColor = A }} onBlur={(e) => { e.target.style.borderColor = B }} />
              </div>
              <div>
                <label style={labelSt}>Nicho</label>
                <select value={data.niche} onChange={(e) => upd({ niche: e.target.value })} style={{ ...inputSt, appearance: 'none', cursor: 'pointer', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff66' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}>
                  <option value="">Selecione...</option>
                  {NICHES.map((n) => <option key={n} value={n} style={{ backgroundColor: S2 }}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
                </select>
              </div>
            </motion.div>
          )}

          {modalStep === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {TONES.map((t) => {
                const sel = data.tom === t.slug
                return (
                  <button key={t.slug} type="button" onClick={() => upd({ tom: t.slug })}
                    style={{ background: sel ? 'rgba(200,255,0,0.08)' : S2, border: `2px solid ${sel ? A : B}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: sel ? A : T, fontFamily: ff, margin: '0 0 4px' }}>{t.label}</p>
                    <p style={{ fontSize: 11, color: M, fontFamily: ff, margin: 0, lineHeight: 1.4 }}>"{t.example}"</p>
                  </button>
                )
              })}
            </motion.div>
          )}

          {modalStep === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelSt}>Cor do cliente</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PALETTE.map((c) => (
                    <button key={c} type="button" onClick={() => upd({ cor: c })}
                      style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: c, padding: 0, border: data.cor === c ? '2px solid white' : '2px solid transparent', outline: data.cor === c ? `2px solid ${c}` : 'none', outlineOffset: 2, cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
              <div>
                <label style={labelSt}>Estilo visual</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {STYLES.map((st) => {
                    const sel = data.estilo === st.slug
                    return (
                      <button key={st.slug} type="button" onClick={() => upd({ estilo: st.slug })}
                        style={{ background: sel ? 'rgba(200,255,0,0.06)' : S2, border: `2px solid ${sel ? A : B}`, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                        <div style={{ height: 36, background: st.bg }} />
                        <p style={{ fontSize: 11, fontWeight: 700, color: sel ? A : T, fontFamily: ff, margin: 0, padding: '6px 10px 8px' }}>{st.label}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {err && <p style={{ color: '#f87171', fontSize: 13, fontFamily: ff, margin: '12px 0 0' }}>{err}</p>}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          {modalStep > 1 && (
            <button onClick={() => setModalStep((p) => p - 1)}
              style={{ flex: 1, height: 44, background: 'none', border: `1px solid ${B}`, borderRadius: 8, color: M, fontSize: 14, fontFamily: ff, cursor: 'pointer' }}>
              ← Voltar
            </button>
          )}
          {modalStep < 3 ? (
            <button onClick={() => setModalStep((p) => p + 1)} disabled={!canNext()}
              style={{ flex: 2, height: 44, backgroundColor: canNext() ? A : S2, border: 'none', borderRadius: 8, color: canNext() ? '#000' : M, fontSize: 14, fontWeight: 700, fontFamily: ff, cursor: canNext() ? 'pointer' : 'not-allowed', opacity: canNext() ? 1 : 0.5, transition: 'all 0.15s' }}>
              Continuar →
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              style={{ flex: 2, height: 44, backgroundColor: A, border: 'none', borderRadius: 8, color: '#000', fontSize: 14, fontWeight: 700, fontFamily: ff, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Salvando...' : 'Criar cliente →'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Tab: Relatórios ──────────────────────────────────────────
function TabRelatorios({ client }: { client: Client | undefined }) {
  const { user } = useAuth()
  const [rows, setRows]       = useState<CarouselRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user || !client) return
    setLoading(true)
    supabase.from('carousels').select('id, tema, status, created_at, exported_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setRows(data as CarouselRow[])
        setLoading(false)
      })
  }, [user, client])

  if (!client) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <p style={{ fontFamily: ff, fontSize: 14, color: M }}>Selecione um cliente para ver os relatórios</p>
    </div>
  )

  const total     = rows.length
  const exported  = rows.filter((r) => r.status === 'exported').length
  const lastDate  = rows[0]?.created_at
    ? new Date(rows[0].created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  const STATUS_COLORS: Record<string, string> = {
    draft:    M,
    exported: A,
    scheduled: '#00B4D8',
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 16 }}>
        {[
          { label: 'Total criados',    value: total },
          { label: 'Exportados',       value: exported },
          { label: 'Último criado em', value: lastDate },
        ].map(({ label, value }) => (
          <div key={label} style={{ flex: 1, background: S2, border: `1px solid ${B}`, borderRadius: 10, padding: '16px 18px' }}>
            <p style={{ fontFamily: ff, fontSize: 11, color: M, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
            <p style={{ fontFamily: ffd, fontSize: 22, color: T, margin: 0, letterSpacing: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: S2, border: `1px solid ${B}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 140px', padding: '10px 18px', borderBottom: `1px solid ${B}` }}>
          {['Tema', 'Status', 'Criado em'].map((h) => (
            <span key={h} style={{ fontFamily: ff, fontSize: 11, color: M, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</span>
          ))}
        </div>
        {loading ? (
          <p style={{ fontFamily: ff, fontSize: 13, color: M, padding: '20px 18px', margin: 0 }}>Carregando...</p>
        ) : rows.length === 0 ? (
          <p style={{ fontFamily: ff, fontSize: 13, color: M, padding: '20px 18px', margin: 0 }}>Nenhum carrossel encontrado</p>
        ) : (
          rows.map((row, i) => (
            <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 140px', padding: '12px 18px', borderBottom: i < rows.length - 1 ? `1px solid ${B}` : 'none' }}>
              <span style={{ fontFamily: ff, fontSize: 13, color: T, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.tema}</span>
              <span style={{ fontFamily: ff, fontSize: 12, color: STATUS_COLORS[row.status] ?? M, fontWeight: 600, textTransform: 'capitalize' }}>{row.status}</span>
              <span style={{ fontFamily: ff, fontSize: 12, color: M }}>
                {new Date(row.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Tab: Configurações da agência ────────────────────────────
function TabConfiguracoes() {
  const { user } = useAuth()
  const [orgName, setOrgName]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [orgId, setOrgId]       = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('organizations').select('id, name').eq('owner_user_id', user.id).limit(1).single()
      .then(({ data }) => {
        if (data) { setOrgId(data.id as string); setOrgName(data.name as string) }
      })
  }, [user])

  const saveOrgName = async () => {
    if (!orgId || !orgName.trim()) return
    setSaving(true)
    const { error } = await supabase.from('organizations').update({ name: orgName.trim() }).eq('id', orgId)
    setSaving(false)
    if (error) { toast.error('Erro ao salvar'); return }
    toast.success('Nome atualizado')
  }

  // 5 subconta slots — busca membros da org
  const [members, setMembers] = useState<string[]>([])
  useEffect(() => {
    if (!orgId) return
    supabase.from('profiles').select('user_id').eq('organization_id', orgId).eq('role', 'member').limit(5)
      .then(({ data }) => { if (data) setMembers(data.map((m) => m.user_id as string)) })
  }, [orgId])

  const slots = Array.from({ length: 5 }, (_, i) => members[i] ?? null)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Nome da agência */}
      <div style={{ background: S2, border: `1px solid ${B}`, borderRadius: 12, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontFamily: ffd, fontSize: 18, color: T, margin: 0, letterSpacing: 1 }}>NOME DA AGÊNCIA</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={orgName} onChange={(e) => setOrgName(e.target.value)}
            style={{ flex: 1, background: S, border: `1px solid ${B}`, borderRadius: 8, color: T, fontFamily: ff, fontSize: 14, padding: '10px 14px', outline: 'none' }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(200,255,0,0.4)' }}
            onBlur={(e)  => { e.target.style.borderColor = B }} />
          <button onClick={saveOrgName} disabled={saving || !orgName.trim()}
            style={{ height: 42, padding: '0 20px', background: A, border: 'none', borderRadius: 8, color: '#000', fontFamily: ff, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Subcontas */}
      <div style={{ background: S2, border: `1px solid ${B}`, borderRadius: 12, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <h3 style={{ fontFamily: ffd, fontSize: 18, color: T, margin: '0 0 4px', letterSpacing: 1 }}>SUBCONTAS</h3>
          <p style={{ fontFamily: ff, fontSize: 12, color: M, margin: 0 }}>5 slots inclusos no plano Agência</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {slots.map((memberId, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: S, border: `1px solid ${B}`, borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: memberId ? 'rgba(200,255,0,0.1)' : S2, border: `1px solid ${memberId ? 'rgba(200,255,0,0.3)' : B}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: ffd, fontSize: 14, color: memberId ? A : M }}>{i + 1}</span>
                </div>
                <span style={{ fontFamily: ff, fontSize: 13, color: memberId ? T : M }}>
                  {memberId ? `Membro ${i + 1}` : 'Slot vazio'}
                </span>
              </div>
              {!memberId && (
                <button
                  onClick={() => toast.success('Em breve — disponível em 30 dias')}
                  style={{ height: 30, padding: '0 14px', background: 'rgba(200,255,0,0.08)', border: `1px solid rgba(200,255,0,0.2)`, borderRadius: 6, color: A, fontFamily: ff, fontSize: 12, cursor: 'pointer' }}>
                  Convidar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────
export default function Agency() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [clients,   setClients]   = useState<Client[]>([])
  const [activeId,  setActiveId]  = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [agTab,     setAgTab]     = useState<AgencyTab>('clientes')

  useEffect(() => {
    if (!user) return
    supabase.from('organizations').select('id, name, plan, created_at').eq('owner_user_id', user.id)
      .then(({ data }) => {
        if (data) {
          setClients(data.map((o) => ({ id: o.id as string, name: o.name as string, niche: '', plan: o.plan as string, created_at: o.created_at as string })))
          if (data.length > 0) setActiveId(data[0].id as string)
        }
        setLoading(false)
      })
  }, [user])

  const active = clients.find((c) => c.id === activeId)

  const [clientProfile, setClientProfile] = useState<{
    instagram_handle: string | null
    niche: string | null
    voice_profile: Record<string, unknown>
    visual_kit: Record<string, unknown>
  } | null>(null)
  const [kitOpen,    setKitOpen]    = useState(true)
  const [instHandle, setInstHandle] = useState('')
  const [kitNiche,   setKitNiche]   = useState('')
  const [kitTom,     setKitTom]     = useState('')
  const [kitCor,     setKitCor]     = useState('#C8FF00')
  const [savingKit,  setSavingKit]  = useState(false)

  useEffect(() => {
    if (!activeId) return
    supabase.from('profiles')
      .select('instagram_handle, niche, voice_profile, visual_kit')
      .eq('organization_id', activeId)
      .single()
      .then(({ data }) => setClientProfile(data))
  }, [activeId])

  useEffect(() => {
    if (!clientProfile) return
    setInstHandle(clientProfile.instagram_handle ?? '')
    setKitNiche(clientProfile.niche ?? '')
    setKitTom((clientProfile.voice_profile?.tom as string) ?? '')
    setKitCor((clientProfile.visual_kit?.cor as string) ?? '#C8FF00')
  }, [clientProfile])

  const saveKit = async () => {
    if (!activeId) return
    setSavingKit(true)
    const { error } = await supabase.from('profiles')
      .update({
        instagram_handle: instHandle || null,
        niche: kitNiche || null,
        voice_profile: { ...(clientProfile?.voice_profile ?? {}), tom: kitTom },
        visual_kit: { ...(clientProfile?.visual_kit ?? {}), cor: kitCor },
      })
      .eq('organization_id', activeId)
    setSavingKit(false)
    if (error) { toast.error('Erro ao salvar kit'); return }
    toast.success('Kit salvo')
    setClientProfile((p) => p ? {
      ...p,
      instagram_handle: instHandle || null,
      niche: kitNiche || null,
      voice_profile: { ...(p.voice_profile ?? {}), tom: kitTom },
      visual_kit: { ...(p.visual_kit ?? {}), cor: kitCor },
    } : p)
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

  const MAIN_TABS: { key: AgencyTab; label: string; icon: React.ReactNode }[] = [
    { key: 'clientes',       label: 'Clientes',       icon: <Users size={15} /> },
    { key: 'relatorios',     label: 'Relatórios',     icon: <BarChart2 size={15} /> },
    { key: 'configuracoes',  label: 'Configurações',  icon: <Settings size={15} /> },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: BG, overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <div style={{ width: 260, backgroundColor: S, borderRight: `1px solid ${B}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px 16px', borderBottom: `1px solid ${B}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Users size={14} color={A} />
            <h2 style={{ fontFamily: ffd, fontSize: 18, color: A, margin: 0, letterSpacing: 1.5 }}>MEUS CLIENTES</h2>
          </div>
          <p style={{ fontSize: 11, color: M, fontFamily: ff, margin: 0 }}>
            {clients.length} cliente{clients.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <p style={{ color: M, fontSize: 13, fontFamily: ff, padding: '16px 20px' }}>Carregando...</p>
          ) : clients.length === 0 ? (
            <div style={{ padding: '24px 20px', textAlign: 'center' }}>
              <p style={{ color: M, fontSize: 13, fontFamily: ff, margin: 0, lineHeight: 1.6 }}>
                Nenhum cliente ainda.<br />Crie o primeiro abaixo.
              </p>
            </div>
          ) : (
            clients.map((c) => {
              const isActive = c.id === activeId
              return (
                <button key={c.id} onClick={() => setActiveId(c.id)}
                  style={{ width: '100%', background: isActive ? 'rgba(200,255,0,0.06)' : 'none', border: 'none', borderLeft: `3px solid ${isActive ? A : 'transparent'}`, padding: '12px 20px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: isActive ? A : T, fontFamily: ff, margin: '0 0 3px' }}>{c.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} color={M} />
                      <span style={{ fontSize: 11, color: M, fontFamily: ff }}>{formatDate(c.created_at)}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} color={isActive ? A : M} />
                </button>
              )
            })
          )}
        </div>

        <div style={{ padding: '16px 20px', borderTop: `1px solid ${B}` }}>
          <button onClick={() => setShowModal(true)}
            style={{ width: '100%', height: 40, backgroundColor: 'rgba(200,255,0,0.1)', border: `1px solid rgba(200,255,0,0.3)`, borderRadius: 8, color: A, fontSize: 13, fontFamily: ff, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background-color 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(200,255,0,0.18)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(200,255,0,0.1)' }}>
            <Plus size={14} /> Novo cliente
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar with tabs */}
        <div style={{ padding: '0 32px', borderBottom: `1px solid ${B}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, flexShrink: 0 }}>
          {/* Tab nav */}
          <div style={{ display: 'flex', gap: 4 }}>
            {MAIN_TABS.map(({ key, label, icon }) => {
              const sel = agTab === key
              return (
                <button key={key} onClick={() => setAgTab(key)}
                  style={{ height: 36, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, background: sel ? 'rgba(200,255,0,0.1)' : 'none', border: `1px solid ${sel ? 'rgba(200,255,0,0.3)' : 'transparent'}`, color: sel ? A : M, fontFamily: ff, fontSize: 13, fontWeight: sel ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {icon} {label}
                </button>
              )
            })}
          </div>

          {/* Client name + action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {active && (
              <>
                <span style={{ fontFamily: ffd, fontSize: 16, color: M, letterSpacing: 1 }}>{active.name.toUpperCase()}</span>
                <button onClick={() => navigate(`/studio?cliente=${activeId}`)}
                  style={{ backgroundColor: A, color: '#000', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, fontFamily: ff, cursor: 'pointer' }}>
                  Criar carrossel →
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab content */}
        {agTab === 'clientes' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            {!active ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, backgroundColor: S2, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Users size={28} color={M} />
                </div>
                <p style={{ color: M, fontSize: 15, fontFamily: ff, margin: '0 0 20px' }}>
                  {clients.length === 0 ? 'Crie seu primeiro cliente para começar' : 'Selecione um cliente na sidebar'}
                </p>
                <button onClick={() => setShowModal(true)}
                  style={{ backgroundColor: A, color: '#000', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 700, fontFamily: ff, cursor: 'pointer' }}>
                  + Novo cliente
                </button>
              </div>
            ) : (
              <div style={{ width: '100%', maxWidth: 520 }}>

                {/* ── Seção 1: KIT DO CLIENTE ── */}
                <div style={{ backgroundColor: S, border: `1px solid ${B}`, borderRadius: 12, marginBottom: 16, overflow: 'hidden' }}>
                  <button onClick={() => setKitOpen((p) => !p)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <span style={{ fontFamily: ffd, fontSize: 15, color: A, letterSpacing: 1 }}>KIT DO CLIENTE</span>
                    <span style={{ color: M, fontSize: 12 }}>{kitOpen ? '▲' : '▼'}</span>
                  </button>

                  {kitOpen && (
                    <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                      {/* @instagram */}
                      <div>
                        <label style={labelSt}>Instagram</label>
                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: S2, border: `1px solid ${B}`, borderRadius: 8, overflow: 'hidden' }}>
                          <span style={{ padding: '0 8px 0 14px', color: M, fontFamily: ff, fontSize: 14, userSelect: 'none' }}>@</span>
                          <input value={instHandle} onChange={(e) => setInstHandle(e.target.value)}
                            style={{ flex: 1, background: 'transparent', border: 'none', padding: '11px 14px 11px 0', color: '#F5F5F5', fontSize: 14, fontFamily: ff, outline: 'none' }}
                            placeholder="handle" />
                        </div>
                      </div>

                      {/* Nicho */}
                      <div>
                        <label style={labelSt}>Nicho</label>
                        <select value={kitNiche} onChange={(e) => setKitNiche(e.target.value)}
                          style={{ ...inputSt, appearance: 'none', cursor: 'pointer', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff66' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}>
                          <option value="">Selecione...</option>
                          {NICHES.map((n) => <option key={n} value={n} style={{ backgroundColor: S2 }}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
                        </select>
                      </div>

                      {/* Tom */}
                      <div>
                        <label style={labelSt}>Tom</label>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {TONES.map((t) => {
                            const sel = kitTom === t.slug
                            return (
                              <button key={t.slug} type="button" onClick={() => setKitTom(t.slug)}
                                style={{ padding: '7px 14px', background: sel ? 'rgba(200,255,0,0.1)' : S2, border: `1px solid ${sel ? A : B}`, borderRadius: 6, color: sel ? A : '#F5F5F5', fontFamily: ff, fontSize: 12, fontWeight: sel ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
                                {t.slug.charAt(0).toUpperCase() + t.slug.slice(1)}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Cor */}
                      <div>
                        <label style={labelSt}>Cor</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {KIT_PALETTE.map((c) => (
                            <button key={c} type="button" onClick={() => setKitCor(c)}
                              style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: c, padding: 0, border: kitCor === c ? '2px solid white' : '2px solid transparent', outline: kitCor === c ? `2px solid ${c}` : 'none', outlineOffset: 2, cursor: 'pointer' }} />
                          ))}
                        </div>
                      </div>

                      <button onClick={saveKit} disabled={savingKit}
                        style={{ alignSelf: 'flex-start', height: 38, padding: '0 20px', backgroundColor: A, border: 'none', borderRadius: 8, color: '#000', fontFamily: ff, fontSize: 13, fontWeight: 700, cursor: savingKit ? 'not-allowed' : 'pointer', opacity: savingKit ? 0.7 : 1 }}>
                        {savingKit ? 'Salvando...' : 'Salvar kit'}
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Seção 2: AÇÕES ── */}
                <div style={{ backgroundColor: S, border: `1px solid ${B}`, borderRadius: 12, padding: '20px' }}>
                  <h4 style={{ fontFamily: ffd, fontSize: 13, color: M, margin: '0 0 14px', letterSpacing: 1 }}>AÇÕES</h4>
                  <button onClick={() => navigate(`/studio?org=${activeId}`)}
                    style={{ width: '100%', backgroundColor: A, color: '#000', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 700, fontFamily: ff, cursor: 'pointer', textAlign: 'left' }}>
                    Criar carrossel para este cliente →
                  </button>
                  <p style={{ fontFamily: ff, fontSize: 11, color: M, margin: '10px 0 0' }}>
                    A IA usará o perfil deste cliente ao gerar o carrossel
                  </p>
                </div>

              </div>
            )}
          </div>
        )}

        {agTab === 'relatorios'    && <TabRelatorios    client={active} />}
        {agTab === 'configuracoes' && <TabConfiguracoes />}
      </div>

      {showModal && (
        <NewClientModal
          onClose={() => setShowModal(false)}
          onCreated={(c) => { setClients((p) => [...p, c]); setActiveId(c.id); setShowModal(false) }}
        />
      )}
    </div>
  )
}
