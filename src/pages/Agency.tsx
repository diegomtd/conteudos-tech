import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Users, ChevronRight, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

// ─── Tokens ───────────────────────────────────────────────────
const A = '#C8FF00'
const BG = '#080808'
const S = '#0F0F0F'
const S2 = '#1A1A1A'
const T = '#F5F5F5'
const M = 'rgba(255,255,255,0.45)'
const B = 'rgba(255,255,255,0.08)'
const ff = 'DM Sans, sans-serif'

// ─── Types ────────────────────────────────────────────────────
interface Client {
  id: string
  name: string
  niche: string
  plan: string
  created_at: string
}

const NICHES = ['empreendedorismo','marketing','saúde','autoconhecimento','espiritualidade','tecnologia','lifestyle','educação','finanças','outro']

const TONES = [
  { slug: 'provocador',    label: 'Provocador e direto',     example: 'Você está sabotando seu crescimento sem perceber' },
  { slug: 'educativo',     label: 'Educativo e estruturado', example: '5 erros que impedem o crescimento no Instagram' },
  { slug: 'bastidor',      label: 'Bastidor e humano',       example: 'Hoje aprendi algo que mudou como vejo conteúdo' },
  { slug: 'inspiracional', label: 'Inspiracional e leve',    example: 'Pequenas ações consistentes criam grandes resultados' },
]

const PALETTE = ['#C8FF00','#FF6B2B','#00B4D8','#A855F7','#F43F5E','#10B981','#F59E0B','#FFFFFF']
const STYLES = [
  { slug: 'dark_cinematic', label: 'Dark Cinematic', bg: 'linear-gradient(135deg,#0a0a0a,#1a2a3a)' },
  { slug: 'light_clean',    label: 'Light Clean',    bg: 'linear-gradient(135deg,#f8f8f8,#e0e0e0)' },
  { slug: 'colorful',       label: 'Colorido',       bg: 'linear-gradient(135deg,#FF6B2B,#A855F7)' },
  { slug: 'minimal_bw',     label: 'Minimalista',    bg: 'linear-gradient(135deg,#222,#555)' },
]

// ─── New client modal ─────────────────────────────────────────
const inputSt: React.CSSProperties = {
  width: '100%', backgroundColor: S2, border: `1px solid ${B}`,
  borderRadius: 8, padding: '11px 14px', color: T, fontSize: 14,
  fontFamily: ff, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
}
const labelSt: React.CSSProperties = { display: 'block', color: M, fontSize: 13, fontFamily: ff, fontWeight: 500, marginBottom: 8 }

interface NewClientData { name: string; niche: string; tom: string; cor: string; estilo: string }

function NewClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Client) => void }) {
  const { user } = useAuth()
  const [modalStep, setModalStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [data, setData] = useState<NewClientData>({ name: '', niche: '', tom: '', cor: '#C8FF00', estilo: 'dark_cinematic' })
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
      // Create organization
      const { data: org, error: orgErr } = await supabase
        .from('organizations').insert({ owner_user_id: user.id, name: data.name, plan: 'client' })
        .select().single()
      if (orgErr) throw orgErr

      // Create client profile linked to org
      const { data: profile, error: profErr } = await supabase
        .from('profiles').insert({
          user_id: user.id, // owner manages it
          organization_id: org.id,
          display_name: data.name,
          niche: data.niche,
          role: 'member',
          voice_profile: { tom: data.tom },
          visual_kit: { cor: data.cor, estilo: data.estilo, fonte: 'Bebas Neue' },
          plan: 'client',
        })
        .select().single()
      if (profErr) throw profErr
      void profile
      onCreated({ id: org.id, name: data.name, niche: data.niche, plan: 'client', created_at: org.created_at as string })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao criar cliente')
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: '16px',
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ backgroundColor: S, border: '1px solid rgba(200,255,0,0.2)', borderRadius: 16, padding: '32px 36px', width: '100%', maxWidth: 440 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h3 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 28, color: A, margin: 0, letterSpacing: 1.5 }}>NOVO CLIENTE</h3>
            <p style={{ color: M, fontSize: 12, fontFamily: ff, margin: '4px 0 0' }}>Passo {modalStep} de 3</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: M, cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {/* Progress */}
        <div style={{ height: 2, backgroundColor: B, borderRadius: 99, marginBottom: 24 }}>
          <div style={{ height: '100%', backgroundColor: A, borderRadius: 99, width: `${(modalStep / 3) * 100}%`, transition: 'width 0.3s' }} />
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1 */}
          {modalStep === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label style={labelSt}>Nome do cliente ou marca</label>
                <input style={inputSt} value={data.name} onChange={(e) => upd({ name: e.target.value })}
                  placeholder="Ex: Studio Clara" autoFocus
                  onFocus={(e) => { e.target.style.borderColor = A }} onBlur={(e) => { e.target.style.borderColor = B }} />
              </div>
              <div><label style={labelSt}>Nicho</label>
                <select value={data.niche} onChange={(e) => upd({ niche: e.target.value })} style={{
                  ...inputSt, appearance: 'none', cursor: 'pointer',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff66' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
                }}>
                  <option value="">Selecione...</option>
                  {NICHES.map((n) => <option key={n} value={n} style={{ backgroundColor: S2 }}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
                </select>
              </div>
            </motion.div>
          )}

          {/* Step 2 */}
          {modalStep === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {TONES.map((t) => {
                const sel = data.tom === t.slug
                return (
                  <button key={t.slug} type="button" onClick={() => upd({ tom: t.slug })} style={{
                    background: sel ? 'rgba(200,255,0,0.08)' : S2, border: `2px solid ${sel ? A : B}`,
                    borderRadius: 10, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: sel ? A : T, fontFamily: ff, margin: '0 0 4px' }}>{t.label}</p>
                    <p style={{ fontSize: 11, color: M, fontFamily: ff, margin: 0, lineHeight: 1.4 }}>"{t.example}"</p>
                  </button>
                )
              })}
            </motion.div>
          )}

          {/* Step 3 */}
          {modalStep === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelSt}>Cor do cliente</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PALETTE.map((c) => (
                    <button key={c} type="button" onClick={() => upd({ cor: c })} style={{
                      width: 32, height: 32, borderRadius: '50%', backgroundColor: c, padding: 0,
                      border: data.cor === c ? '2px solid white' : '2px solid transparent',
                      outline: data.cor === c ? `2px solid ${c}` : 'none', outlineOffset: 2, cursor: 'pointer',
                    }} />
                  ))}
                </div>
              </div>
              <div>
                <label style={labelSt}>Estilo visual</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {STYLES.map((s) => {
                    const sel = data.estilo === s.slug
                    return (
                      <button key={s.slug} type="button" onClick={() => upd({ estilo: s.slug })} style={{
                        background: sel ? 'rgba(200,255,0,0.06)' : S2, border: `2px solid ${sel ? A : B}`,
                        borderRadius: 8, overflow: 'hidden', cursor: 'pointer', padding: 0, textAlign: 'left',
                      }}>
                        <div style={{ height: 36, background: s.bg }} />
                        <p style={{ fontSize: 11, fontWeight: 700, color: sel ? A : T, fontFamily: ff, margin: 0, padding: '6px 10px 8px' }}>{s.label}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {err && <p style={{ color: '#f87171', fontSize: 13, fontFamily: ff, margin: '12px 0 0' }}>{err}</p>}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          {modalStep > 1 && (
            <button onClick={() => setModalStep((p) => p - 1)} style={{
              flex: 1, height: 44, background: 'none', border: `1px solid ${B}`,
              borderRadius: 8, color: M, fontSize: 14, fontFamily: ff, cursor: 'pointer',
            }}>← Voltar</button>
          )}
          {modalStep < 3 ? (
            <button onClick={() => setModalStep((p) => p + 1)} disabled={!canNext()} style={{
              flex: 2, height: 44, backgroundColor: canNext() ? A : S2,
              border: 'none', borderRadius: 8, color: canNext() ? '#000' : M,
              fontSize: 14, fontWeight: 700, fontFamily: ff, cursor: canNext() ? 'pointer' : 'not-allowed',
              opacity: canNext() ? 1 : 0.5, transition: 'all 0.15s',
            }}>Continuar →</button>
          ) : (
            <button onClick={handleSave} disabled={saving} style={{
              flex: 2, height: 44, backgroundColor: A, border: 'none', borderRadius: 8,
              color: '#000', fontSize: 14, fontWeight: 700, fontFamily: ff,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            }}>{saving ? 'Salvando...' : 'Criar cliente →'}</button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────
export default function Agency() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

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

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: BG, overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 260, backgroundColor: S, borderRight: `1px solid ${B}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Header */}
        <div style={{ padding: '24px 20px 16px', borderBottom: `1px solid ${B}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Users size={14} color={A} />
            <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 18, color: A, margin: 0, letterSpacing: 1.5 }}>
              MEUS CLIENTES
            </h2>
          </div>
          <p style={{ fontSize: 11, color: M, fontFamily: ff, margin: 0 }}>{clients.length} cliente{clients.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Client list */}
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
              const active = c.id === activeId
              return (
                <button key={c.id} onClick={() => setActiveId(c.id)} style={{
                  width: '100%', background: active ? 'rgba(200,255,0,0.06)' : 'none',
                  border: 'none', borderLeft: `3px solid ${active ? A : 'transparent'}`,
                  padding: '12px 20px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: active ? A : T, fontFamily: ff, margin: '0 0 3px' }}>{c.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} color={M} />
                      <span style={{ fontSize: 11, color: M, fontFamily: ff }}>{formatDate(c.created_at)}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} color={active ? A : M} />
                </button>
              )
            })
          )}
        </div>

        {/* Add client */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${B}` }}>
          <button onClick={() => setShowModal(true)} style={{
            width: '100%', height: 40, backgroundColor: 'rgba(200,255,0,0.1)',
            border: `1px solid rgba(200,255,0,0.3)`, borderRadius: 8,
            color: A, fontSize: 13, fontFamily: ff, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'background-color 0.15s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(200,255,0,0.18)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(200,255,0,0.1)' }}>
            <Plus size={14} /> Novo cliente
          </button>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ padding: '20px 32px', borderBottom: `1px solid ${B}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 28, color: active ? T : M, margin: 0, letterSpacing: 1 }}>
              {active ? active.name.toUpperCase() : 'SELECIONE UM CLIENTE'}
            </h1>
            {active && <p style={{ fontSize: 12, color: M, fontFamily: ff, margin: '4px 0 0' }}>Conta agência — cliente ativo</p>}
          </div>
          {active && (
            <button onClick={() => navigate(`/studio?cliente=${activeId}`)} style={{
              backgroundColor: A, color: '#000', border: 'none', borderRadius: 8,
              padding: '10px 20px', fontSize: 14, fontWeight: 700, fontFamily: ff,
              cursor: 'pointer',
            }}>
              Criar carrossel →
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          {!active ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, backgroundColor: S2, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Users size={28} color={M} />
              </div>
              <p style={{ color: M, fontSize: 15, fontFamily: ff, margin: '0 0 20px' }}>
                {clients.length === 0 ? 'Crie seu primeiro cliente para começar' : 'Selecione um cliente na sidebar'}
              </p>
              <button onClick={() => setShowModal(true)} style={{
                backgroundColor: A, color: '#000', border: 'none', borderRadius: 8,
                padding: '12px 24px', fontSize: 14, fontWeight: 700, fontFamily: ff, cursor: 'pointer',
              }}>+ Novo cliente</button>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                backgroundColor: S, border: `1px solid rgba(200,255,0,0.15)`, borderRadius: 16,
                padding: '32px 40px', maxWidth: 440,
              }}>
                <h3 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 32, color: A, margin: '0 0 8px', letterSpacing: 1.5 }}>
                  {active.name.toUpperCase()}
                </h3>
                <p style={{ color: M, fontSize: 14, fontFamily: ff, margin: '0 0 24px' }}>
                  Studio do cliente pronto na Fase 5
                </p>
                <button onClick={() => navigate(`/studio?cliente=${activeId}`)} style={{
                  backgroundColor: A, color: '#000', border: 'none', borderRadius: 8,
                  padding: '12px 28px', fontSize: 15, fontWeight: 700, fontFamily: ff, cursor: 'pointer',
                }}>Criar carrossel para {active.name} →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <NewClientModal
          onClose={() => setShowModal(false)}
          onCreated={(c) => { setClients((p) => [...p, c]); setActiveId(c.id); setShowModal(false) }}
        />
      )}
    </div>
  )
}
