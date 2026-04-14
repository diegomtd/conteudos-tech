import { useState, KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

// ─── Tokens ──────────────────────────────────────────────────
const ACCENT = '#C8FF00'
const BG = '#080808'
const SURFACE = '#0F0F0F'
const SURFACE2 = '#1A1A1A'
const TEXT = '#F5F5F5'
const MUTED = 'rgba(255,255,255,0.45)'
const BORDER = 'rgba(255,255,255,0.08)'
const TOTAL_STEPS = 5

// ─── Types ────────────────────────────────────────────────────
interface FormData {
  displayName: string
  instagramHandle: string
  niche: string
  tom: string
  palavrasProibidas: string[]
  palavrasChave: string[]
  cor: string
  estilo: string
  fonte: string
  exemploTexto: string
  primeiraTema: string
}

// ─── Tag Input ────────────────────────────────────────────────
function TagInput({
  label, tags, onChange, placeholder,
}: {
  label: string
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  const add = () => {
    const val = input.trim()
    if (val && !tags.includes(val)) onChange([...tags, val])
    setInput('')
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); add() }
    if (e.key === 'Backspace' && !input && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div>
      <label style={{ ...labelSt, marginBottom: 8 }}>{label}</label>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        backgroundColor: SURFACE2,
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        padding: '8px 10px',
        minHeight: 44,
        cursor: 'text',
      }}>
        {tags.map((t) => (
          <span key={t} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            backgroundColor: 'rgba(200,255,0,0.12)',
            border: `1px solid rgba(200,255,0,0.3)`,
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: 12,
            color: ACCENT,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            {t}
            <button
              type="button"
              onClick={() => onChange(tags.filter((x) => x !== t))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: ACCENT, padding: 0, display: 'flex', lineHeight: 1 }}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => { if (input.trim()) add() }}
          placeholder={tags.length === 0 ? placeholder : ''}
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            color: TEXT,
            fontSize: 13,
            fontFamily: 'DM Sans, sans-serif',
            flex: 1,
            minWidth: 100,
          }}
        />
      </div>
      <p style={{ fontSize: 11, color: MUTED, margin: '4px 0 0', fontFamily: 'DM Sans, sans-serif' }}>
        Pressione Enter para adicionar
      </p>
    </div>
  )
}

// ─── Shared styles ────────────────────────────────────────────
const labelSt: React.CSSProperties = {
  display: 'block',
  color: MUTED,
  fontSize: 13,
  fontFamily: 'DM Sans, sans-serif',
  fontWeight: 500,
}

const inputSt: React.CSSProperties = {
  width: '100%',
  backgroundColor: SURFACE2,
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  padding: '11px 14px',
  color: TEXT,
  fontSize: 14,
  fontFamily: 'DM Sans, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}

const selectSt: React.CSSProperties = {
  ...inputSt,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff66' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
  cursor: 'pointer',
}

function PrimaryBtn({ onClick, disabled, children, style }: {
  onClick?: () => void
  disabled?: boolean
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        backgroundColor: h && !disabled ? '#ADDF00' : ACCENT,
        color: '#000',
        border: 'none',
        borderRadius: 8,
        height: 48,
        fontSize: 15,
        fontWeight: 700,
        fontFamily: 'DM Sans, sans-serif',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background-color 0.2s',
        letterSpacing: 0.3,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

// ─── Step 1 ───────────────────────────────────────────────────
const NICHES = [
  'empreendedorismo', 'marketing', 'saúde', 'autoconhecimento',
  'espiritualidade', 'tecnologia', 'lifestyle', 'educação', 'finanças', 'outro',
]

function Step1({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <label style={{ ...labelSt, marginBottom: 8 }}>Nome de exibição</label>
        <input
          style={inputSt}
          value={data.displayName}
          onChange={(e) => onChange({ displayName: e.target.value })}
          placeholder="Como você quer ser chamado"
          onFocus={(e) => { e.target.style.borderColor = ACCENT }}
          onBlur={(e) => { e.target.style.borderColor = BORDER }}
        />
      </div>
      <div>
        <label style={{ ...labelSt, marginBottom: 8 }}>Instagram <span style={{ color: MUTED }}>(opcional)</span></label>
        <input
          style={inputSt}
          value={data.instagramHandle}
          onChange={(e) => onChange({ instagramHandle: e.target.value })}
          placeholder="@seuperfil"
          onFocus={(e) => { e.target.style.borderColor = ACCENT }}
          onBlur={(e) => { e.target.style.borderColor = BORDER }}
        />
      </div>
      <div>
        <label style={{ ...labelSt, marginBottom: 8 }}>Qual é o seu nicho?</label>
        <select
          style={selectSt}
          value={data.niche}
          onChange={(e) => onChange({ niche: e.target.value })}
        >
          <option value="">Selecione...</option>
          {NICHES.map((n) => (
            <option key={n} value={n} style={{ backgroundColor: SURFACE2 }}>
              {n.charAt(0).toUpperCase() + n.slice(1)}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

// ─── Step 2 ───────────────────────────────────────────────────
const TONES = [
  { slug: 'provocador',    label: 'Provocador e direto',        example: 'Você está sabotando seu crescimento sem perceber' },
  { slug: 'educativo',     label: 'Educativo e estruturado',    example: '5 erros que impedem o crescimento no Instagram' },
  { slug: 'bastidor',      label: 'Bastidor e humano',          example: 'Hoje aprendi algo que mudou como vejo conteúdo' },
  { slug: 'inspiracional', label: 'Inspiracional e leve',       example: 'Pequenas ações consistentes criam grandes resultados' },
]

function Step2({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Tom cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {TONES.map((t) => {
          const sel = data.tom === t.slug
          return (
            <button
              key={t.slug}
              type="button"
              onClick={() => onChange({ tom: t.slug })}
              style={{
                background: sel ? 'rgba(200,255,0,0.08)' : SURFACE2,
                border: `2px solid ${sel ? ACCENT : BORDER}`,
                borderRadius: 10,
                padding: '14px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.2s, background 0.2s',
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 700, color: sel ? ACCENT : TEXT, fontFamily: 'DM Sans, sans-serif', margin: '0 0 6px' }}>
                {t.label}
              </p>
              <p style={{ fontSize: 12, color: MUTED, fontFamily: 'DM Sans, sans-serif', margin: 0, lineHeight: 1.5 }}>
                "{t.example}"
              </p>
            </button>
          )
        })}
      </div>

      {/* Tag inputs */}
      <TagInput
        label='Palavras que você NUNCA usa'
        tags={data.palavrasProibidas}
        onChange={(tags) => onChange({ palavrasProibidas: tags })}
        placeholder='sinergia, networking, disruptivo...'
      />
      <TagInput
        label='Palavras que te definem'
        tags={data.palavrasChave}
        onChange={(tags) => onChange({ palavrasChave: tags })}
        placeholder='direto, real, sem frescura...'
      />
    </div>
  )
}

// ─── Step 3 ───────────────────────────────────────────────────
const PALETTE = ['#C8FF00', '#FF6B2B', '#00B4D8', '#A855F7', '#F43F5E', '#10B981', '#F59E0B', '#FFFFFF']

const STYLES = [
  { slug: 'dark_cinematic', label: 'Dark Cinematic', desc: 'Foto dramática, escuro' },
  { slug: 'light_clean',    label: 'Light Clean',    desc: 'Claro, minimalista' },
  { slug: 'colorful',       label: 'Colorido',       desc: 'Cores vibrantes' },
  { slug: 'minimal_bw',     label: 'Minimalista',    desc: 'Preto e branco' },
]

const STYLE_PREVIEW: Record<string, React.CSSProperties> = {
  dark_cinematic: { background: 'linear-gradient(135deg,#0a0a0a 0%,#1a2a3a 100%)' },
  light_clean:    { background: 'linear-gradient(135deg,#f8f8f8 0%,#e8e8e8 100%)' },
  colorful:       { background: 'linear-gradient(135deg,#FF6B2B 0%,#A855F7 100%)' },
  minimal_bw:     { background: 'linear-gradient(135deg,#222 0%,#555 100%)' },
}

const FONTS = [
  { name: 'Bebas Neue',       style: { fontFamily: '"Bebas Neue", sans-serif', letterSpacing: 2 } },
  { name: 'DM Sans',          style: { fontFamily: '"DM Sans", sans-serif', fontWeight: 700 } },
  { name: 'Playfair Display', style: { fontFamily: '"Playfair Display", serif', fontWeight: 700 } },
  { name: 'Space Grotesk',    style: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 } },
  { name: 'Inter',            style: { fontFamily: '"Inter", sans-serif', fontWeight: 600 } },
]

function Step3({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Cor */}
      <div>
        <label style={{ ...labelSt, marginBottom: 12 }}>Cor do seu perfil</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ cor: c })}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: c,
                border: data.cor === c ? `3px solid white` : '3px solid transparent',
                cursor: 'pointer',
                outline: data.cor === c ? `2px solid ${c}` : 'none',
                outlineOffset: 2,
                transition: 'outline 0.15s',
                padding: 0,
              }}
            />
          ))}
          {/* Color picker customizado */}
          <label style={{ position: 'relative', cursor: 'pointer' }} title="Cor customizada">
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'conic-gradient(red,yellow,lime,aqua,blue,magenta,red)',
              border: !PALETTE.includes(data.cor) ? '3px solid white' : `3px solid transparent`,
              outline: !PALETTE.includes(data.cor) ? `2px solid ${data.cor}` : 'none',
              outlineOffset: 2,
            }} />
            <input
              type="color"
              value={data.cor}
              onChange={(e) => onChange({ cor: e.target.value })}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
            />
          </label>
        </div>
      </div>

      {/* Estilo visual */}
      <div>
        <label style={{ ...labelSt, marginBottom: 12 }}>Estilo dos seus slides</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {STYLES.map((s) => {
            const sel = data.estilo === s.slug
            return (
              <button
                key={s.slug}
                type="button"
                onClick={() => onChange({ estilo: s.slug })}
                style={{
                  background: sel ? 'rgba(200,255,0,0.06)' : SURFACE2,
                  border: `2px solid ${sel ? ACCENT : BORDER}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                  padding: 0,
                  textAlign: 'left',
                }}
              >
                <div style={{ height: 52, ...STYLE_PREVIEW[s.slug] }} />
                <div style={{ padding: '8px 12px 10px' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: sel ? ACCENT : TEXT, fontFamily: 'DM Sans, sans-serif', margin: '0 0 2px' }}>
                    {s.label}
                  </p>
                  <p style={{ fontSize: 11, color: MUTED, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                    {s.desc}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Fonte */}
      <div>
        <label style={{ ...labelSt, marginBottom: 12 }}>Fonte dos títulos</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FONTS.map((f) => {
            const sel = data.fonte === f.name
            return (
              <button
                key={f.name}
                type="button"
                onClick={() => onChange({ fonte: f.name })}
                style={{
                  background: sel ? 'rgba(200,255,0,0.06)' : SURFACE2,
                  border: `2px solid ${sel ? ACCENT : BORDER}`,
                  borderRadius: 8,
                  padding: '10px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
              >
                <span style={{ ...f.style, fontSize: 20, color: sel ? ACCENT : TEXT, letterSpacing: f.style.letterSpacing }}>
                  CONTEÚDO
                </span>
                <span style={{ fontSize: 11, color: MUTED, fontFamily: 'DM Sans, sans-serif' }}>
                  {f.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Step 4 ───────────────────────────────────────────────────
function Step4({ data, onChange, onSkip }: {
  data: FormData
  onChange: (d: Partial<FormData>) => void
  onSkip: () => void
}) {
  const count = data.exemploTexto.length
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ position: 'relative' }}>
        <textarea
          value={data.exemploTexto}
          onChange={(e) => onChange({ exemploTexto: e.target.value })}
          placeholder="Ex: Hoje percebi que a maioria das pessoas confunde consistência com frequência..."
          rows={7}
          style={{
            ...inputSt,
            resize: 'vertical',
            minHeight: 160,
            lineHeight: 1.6,
            paddingBottom: 28,
          }}
          onFocus={(e) => { e.target.style.borderColor = ACCENT }}
          onBlur={(e) => { e.target.style.borderColor = BORDER }}
        />
        <span style={{
          position: 'absolute',
          bottom: 10,
          right: 14,
          fontSize: 11,
          color: MUTED,
          fontFamily: 'DM Sans, sans-serif',
          pointerEvents: 'none',
        }}>
          {count} caracteres
        </span>
      </div>
      <button
        type="button"
        onClick={onSkip}
        style={{
          background: 'none',
          border: 'none',
          color: MUTED,
          fontSize: 13,
          fontFamily: 'DM Sans, sans-serif',
          cursor: 'pointer',
          textAlign: 'center',
          padding: '4px 0',
        }}
      >
        Pular por agora →
      </button>
    </div>
  )
}

// ─── Step 5 ───────────────────────────────────────────────────
function Step5({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <label style={{ ...labelSt, marginBottom: 8 }}>Sobre o que você quer criar hoje?</label>
        <input
          style={inputSt}
          value={data.primeiraTema}
          onChange={(e) => onChange({ primeiraTema: e.target.value })}
          placeholder="Ex: por que a maioria das pessoas nunca para de procrastinar"
          onFocus={(e) => { e.target.style.borderColor = ACCENT }}
          onBlur={(e) => { e.target.style.borderColor = BORDER }}
          autoFocus
        />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────
const STEP_META = [
  { title: 'Primeiro, me conta quem você é', subtitle: null },
  { title: 'Qual desses textos mais parece você?', subtitle: 'A IA vai escrever assim.' },
  { title: 'Como é a sua cara?', subtitle: null },
  { title: 'Quanto mais você me der, mais preciso eu fico', subtitle: 'Cole um texto que você já escreveu — post, legenda, qualquer coisa.' },
  { title: 'TUDO PRONTO.', subtitle: 'Vamos criar seu primeiro carrossel?' },
]

const variants = {
  enter:  (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
}

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [dir, setDir] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<FormData>({
    displayName: (user?.user_metadata?.full_name as string) ?? '',
    instagramHandle: '',
    niche: '',
    tom: '',
    palavrasProibidas: [],
    palavrasChave: [],
    cor: '#C8FF00',
    estilo: 'dark_cinematic',
    fonte: 'Bebas Neue',
    exemploTexto: '',
    primeiraTema: '',
  })

  const update = (d: Partial<FormData>) => setForm((prev) => ({ ...prev, ...d }))

  const go = (next: number) => {
    setDir(next > step ? 1 : -1)
    setStep(next)
  }

  const canContinue = () => {
    if (step === 1) return form.displayName.trim().length > 0 && form.niche.length > 0
    if (step === 2) return form.tom.length > 0
    if (step === 3) return true
    if (step === 4) return true
    if (step === 5) return form.primeiraTema.trim().length > 0
    return true
  }

  const handleFinish = async () => {
    if (!user) return
    setSaving(true)
    setError('')
    try {
      const voiceProfile = {
        tom: form.tom,
        palavras_proibidas: form.palavrasProibidas,
        palavras_chave: form.palavrasChave,
        exemplo_texto: form.exemploTexto,
      }
      const visualKit = {
        cor: form.cor,
        estilo: form.estilo,
        fonte: form.fonte,
      }
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({
          display_name: form.displayName,
          instagram_handle: form.instagramHandle || null,
          niche: form.niche,
          voice_profile: voiceProfile,
          visual_kit: visualKit,
          onboarding_completed: true,
        })
        .eq('user_id', user.id)

      if (dbErr) throw dbErr
      navigate(`/studio?tema=${encodeURIComponent(form.primeiraTema.trim())}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.')
      setSaving(false)
    }
  }

  const meta = STEP_META[step - 1]
  const progress = (step / TOTAL_STEPS) * 100

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: BG,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '0 16px 48px',
    }}>
      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 520, paddingTop: 32, marginBottom: 40 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <span style={{ fontSize: 12, color: MUTED, fontFamily: 'DM Sans, sans-serif' }}>
            Passo {step} de {TOTAL_STEPS}
          </span>
          <span style={{ fontSize: 12, color: ACCENT, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            style={{ height: '100%', backgroundColor: ACCENT, borderRadius: 99 }}
          />
        </div>
      </div>

      {/* Card */}
      <div style={{
        backgroundColor: SURFACE,
        border: `1px solid rgba(200,255,0,0.15)`,
        borderRadius: 20,
        padding: '36px 40px',
        width: '100%',
        maxWidth: 520,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          {step === 5 ? (
            <h1 style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 48,
              color: ACCENT,
              margin: '0 0 8px',
              letterSpacing: 2,
              lineHeight: 1,
            }}>
              {meta.title}
            </h1>
          ) : (
            <h2 style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 20,
              fontWeight: 700,
              color: TEXT,
              margin: '0 0 6px',
              lineHeight: 1.3,
            }}>
              {meta.title}
            </h2>
          )}
          {meta.subtitle && (
            <p style={{ fontSize: 14, color: MUTED, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
              {meta.subtitle}
            </p>
          )}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {step === 1 && <Step1 data={form} onChange={update} />}
            {step === 2 && <Step2 data={form} onChange={update} />}
            {step === 3 && <Step3 data={form} onChange={update} />}
            {step === 4 && <Step4 data={form} onChange={update} onSkip={() => go(5)} />}
            {step === 5 && <Step5 data={form} onChange={update} />}
          </motion.div>
        </AnimatePresence>

        {/* Error */}
        {error && (
          <p style={{ color: '#f87171', fontSize: 13, fontFamily: 'DM Sans, sans-serif', margin: '16px 0 0' }}>
            {error}
          </p>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          {step > 1 && (
            <button
              onClick={() => go(step - 1)}
              style={{
                flex: 1,
                height: 48,
                background: 'none',
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                color: MUTED,
                fontSize: 14,
                fontFamily: 'DM Sans, sans-serif',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER }}
            >
              ← Voltar
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <PrimaryBtn
              onClick={() => go(step + 1)}
              disabled={!canContinue()}
              style={{ flex: 2 }}
            >
              Continuar →
            </PrimaryBtn>
          ) : (
            <PrimaryBtn
              onClick={handleFinish}
              disabled={!canContinue() || saving}
              style={{ flex: 2 }}
            >
              {saving ? 'Salvando...' : 'Criar meu primeiro carrossel →'}
            </PrimaryBtn>
          )}
        </div>
      </div>
    </div>
  )
}
