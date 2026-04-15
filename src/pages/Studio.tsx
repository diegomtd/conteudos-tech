import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, Copy, Plus, X, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { usePlan } from '@/hooks/usePlan'

// ─── Tokens ───────────────────────────────────────────────────
const A = '#C8FF00'
const BG = '#080808'
const S = '#0F0F0F'
const S2 = '#1A1A1A'
const T = '#F5F5F5'
const M = 'rgba(255,255,255,0.45)'
const M2 = 'rgba(255,255,255,0.2)'
const B = 'rgba(255,255,255,0.08)'
const ff = 'DM Sans, sans-serif'

type AppState = 'input' | 'generating' | 'preview'

// ─── Mock slides ──────────────────────────────────────────────
interface Slide { id: string; titulo: string; corpo: string; hack: string }

const MOCK_SLIDES: Slide[] = [
  { id: '1', titulo: 'VOCÊ NÃO É PREGUIÇOSO.',                     corpo: 'Você está travado por um motivo que ninguém te ensinou a resolver.',                            hack: 'Pattern Interrupt' },
  { id: '2', titulo: 'PROCRASTINAÇÃO É REGULAÇÃO EMOCIONAL.',       corpo: 'Não é sobre disciplina. É sobre como você lida com o desconforto antes de começar.',             hack: 'Curiosity Gap' },
  { id: '3', titulo: 'O CÉREBRO EVITA O QUE PARECE PERIGOSO.',     corpo: 'Tarefas difíceis ativam a mesma região do medo. Seu instinto é fugir — não o culpe.',            hack: 'Identity Mirror' },
  { id: '4', titulo: 'O TRUQUE DO 2 MINUTOS NÃO FUNCIONA.',        corpo: 'Reduzir a tarefa não resolve a raiz. Você precisa reduzir o medo, não o tempo.',                 hack: 'Zeigarnik Effect' },
  { id: '5', titulo: 'AMBIGUIDADE PARALISA.',                       corpo: 'A tarefa que você evita é provavelmente vaga demais. Clareza elimina 80% da resistência.',       hack: 'Curiosity Gap' },
  { id: '6', titulo: 'PROGRESSO VISÍVEL MUDA O ESTADO.',           corpo: 'Não comece pela tarefa mais importante. Comece pela mais rápida de concluir.',                   hack: 'Zeigarnik Effect' },
  { id: '7', titulo: 'A SOLUÇÃO REAL.',                             corpo: 'Nomeie o que você está evitando. Não a tarefa — o sentimento por trás dela.',                    hack: 'Identity Mirror' },
]

const GENERATE_STEPS = [
  'Analisando estrutura viral',
  'Aplicando hacks psicológicos',
  'Gerando copy na sua voz',
  'Criando imagem de fundo',
  'Montando preview',
]

const MESSAGES = [
  'Aplicando Curiosity Gap...',
  'Calibrando para o seu tom...',
  'Estruturando os slides...',
  'Quase pronto...',
]

const BG_STYLES: Record<string, string> = {
  'Cinemático': 'linear-gradient(160deg,#060d14 0%,#0d1f30 60%,#091829 100%)',
  'Abstrato':   'linear-gradient(160deg,#080c1a 0%,#0f1e4a 60%,#081530 100%)',
  'Gradiente':  'linear-gradient(160deg,#080808 0%,#141414 100%)',
  'Upload':     '#1A1A1A',
}

const CTA_OPTIONS = [
  'Engajamento', 'Salvar', 'Seguir', 'DM', 'Link na bio',
  'Palavra mágica', 'Personalizado', 'Padrão do perfil',
]

// ─── Shared ───────────────────────────────────────────────────
const inputSt: React.CSSProperties = {
  backgroundColor: S, border: `1px solid rgba(200,255,0,0.3)`, borderRadius: 10,
  color: T, fontFamily: ff, outline: 'none', transition: 'border-color 0.2s',
}

function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      height: 36, padding: '0 14px',
      backgroundColor: active ? A : S2,
      color: active ? '#000' : M,
      border: `1px solid ${active ? A : B}`,
      borderRadius: 8, fontSize: 13, fontWeight: active ? 700 : 400,
      fontFamily: ff, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
    }}>
      {label}
    </button>
  )
}

// ─── Header ───────────────────────────────────────────────────
function Header() {
  const { plan, exportsRemaining, exportLimit } = usePlan()
  const PLAN_COLORS: Record<string, string> = { free: M2, starter: '#00B4D8', pro: A, agency: '#A855F7' }
  const color = PLAN_COLORS[plan] ?? M2

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
      backgroundColor: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${B}`, padding: '0 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56,
    }}>
      <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 22, color: T, letterSpacing: 1.5 }}>
        Conteúd<span style={{ color: A }}>OS</span>
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          fontSize: 11, fontFamily: ff, fontWeight: 700, color,
          border: `1px solid ${color}`, borderRadius: 99, padding: '3px 10px',
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          {plan}
        </span>
        <span style={{ fontSize: 12, color: M, fontFamily: ff }}>
          <span style={{ color: exportsRemaining > 0 ? T : '#f87171', fontWeight: 600 }}>{exportsRemaining}</span>
          {' '}/ {exportLimit} exportações
        </span>
      </div>
    </div>
  )
}

// ─── Estado 1: Input ──────────────────────────────────────────
function StateInput({
  temaInit, onGenerate,
}: {
  temaInit: string
  onGenerate: (config: { tema: string; slides: number; tom: string; cta: string }) => void
}) {
  const [tema, setTema] = useState(temaInit)
  const [slides, setSlides] = useState(7)
  const [tom, setTom] = useState('Provocador')
  const [cta, setCta] = useState('Engajamento')

  const canCreate = tema.trim().length >= 4

  return (
    <motion.div
      key="input"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
      style={{
        width: '100%', maxWidth: 640,
        display: 'flex', flexDirection: 'column', gap: 20,
      }}
    >
      {/* Título */}
      <h1 style={{
        fontFamily: '"Bebas Neue", sans-serif', fontSize: 'clamp(36px,6vw,52px)',
        color: T, margin: 0, lineHeight: 1.05, letterSpacing: 1,
      }}>
        SOBRE O QUE VOCÊ <span style={{ color: A }}>QUER CRIAR?</span>
      </h1>

      {/* Input do tema */}
      <input
        id="tema-input"
        type="text"
        autoFocus
        value={tema}
        onChange={(e) => setTema(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        placeholder="Ex: por que a maioria das pessoas nunca para de procrastinar"
        onKeyDown={(e) => { if (e.key === 'Enter' && canCreate) onGenerate({ tema, slides, tom, cta }) }}
        style={{
          ...inputSt, width: '100%', height: 64, padding: '0 20px',
          fontSize: 16, boxSizing: 'border-box',
        }}
        onFocus={(e) => { e.target.style.borderColor = A }}
        onBlur={(e) => { e.target.style.borderColor = 'rgba(200,255,0,0.3)' }}
      />

      {/* Opções */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Slides */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: M, fontFamily: ff, minWidth: 48 }}>Slides:</span>
          {[5, 7, 10, 12, 15].map((n) => (
            <ToggleChip key={n} label={String(n)} active={slides === n} onClick={() => setSlides(n)} />
          ))}
        </div>

        {/* Tom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: M, fontFamily: ff, minWidth: 48 }}>Tom:</span>
          {['Provocador', 'Educativo', 'Bastidor', 'Humor'].map((t) => (
            <ToggleChip key={t} label={t} active={tom === t} onClick={() => setTom(t)} />
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: M, fontFamily: ff, minWidth: 48 }}>CTA:</span>
          <select
            value={cta}
            onChange={(e) => setCta(e.target.value)}
            style={{
              backgroundColor: S2, border: `1px solid ${B}`, borderRadius: 8,
              color: T, fontSize: 13, fontFamily: ff, padding: '8px 32px 8px 12px',
              outline: 'none', cursor: 'pointer', appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff66' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
            }}
          >
            {CTA_OPTIONS.map((o) => <option key={o} value={o} style={{ backgroundColor: S2 }}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Botão principal */}
      <button
        onClick={() => onGenerate({ tema, slides, tom, cta })}
        disabled={!canCreate}
        style={{
          width: '100%', height: 56,
          backgroundColor: canCreate ? A : S2,
          color: canCreate ? '#000' : M,
          border: 'none', borderRadius: 10,
          fontFamily: '"Bebas Neue", sans-serif', fontSize: 22,
          letterSpacing: 1.5, cursor: canCreate ? 'pointer' : 'not-allowed',
          opacity: canCreate ? 1 : 0.5,
          transition: 'all 0.2s', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 10,
        }}
        onMouseEnter={(e) => { if (canCreate) e.currentTarget.style.backgroundColor = '#ADDF00' }}
        onMouseLeave={(e) => { if (canCreate) e.currentTarget.style.backgroundColor = A }}
      >
        <Zap size={18} />
        ANALISAR E CRIAR CARROSSEL →
      </button>

      {/* Link secundário */}
      <button
        style={{
          background: 'none', border: 'none', color: M, fontSize: 13,
          fontFamily: ff, cursor: 'pointer', textAlign: 'center',
          textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.2)',
        }}
      >
        Tenho um conteúdo viral para analisar primeiro →
      </button>
    </motion.div>
  )
}

// ─── Estado 2: Gerando ────────────────────────────────────────
function StateGenerating({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [msgIdx, setMsgIdx] = useState(0)

  useEffect(() => {
    // Progress bar 0→100 em 5s
    const start = Date.now()
    const duration = 5000
    const frame = () => {
      const elapsed = Date.now() - start
      const pct = Math.min((elapsed / duration) * 100, 100)
      setProgress(pct)
      if (pct < 100) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)

    // Revelar um step por segundo
    const stepTimers = GENERATE_STEPS.map((_, i) =>
      setTimeout(() => setCurrentStep(i + 1), (i + 1) * 900)
    )

    // Rotacionar mensagens a cada 4s
    const msgInterval = setInterval(() => setMsgIdx((p) => (p + 1) % MESSAGES.length), 4000)

    // Avançar para preview após 5s
    const done = setTimeout(onDone, 5200)

    return () => {
      stepTimers.forEach(clearTimeout)
      clearInterval(msgInterval)
      clearTimeout(done)
    }
  }, [onDone])

  return (
    <motion.div
      key="generating"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 32 }}
    >
      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <AnimatePresence mode="wait">
            <motion.span key={msgIdx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              style={{ fontSize: 14, color: T, fontFamily: ff, fontWeight: 500 }}>
              {MESSAGES[msgIdx]}
            </motion.span>
          </AnimatePresence>
          <span style={{ fontSize: 12, color: M, fontFamily: ff }}>~30 segundos</span>
        </div>
        <div style={{ height: 3, backgroundColor: B, borderRadius: 99 }}>
          <div style={{ height: '100%', backgroundColor: A, borderRadius: 99, width: `${progress}%`, transition: 'width 0.1s linear' }} />
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {GENERATE_STEPS.map((step, i) => {
          const done = currentStep > i + 1
          const current = currentStep === i + 1
          const pending = currentStep < i + 1

          return (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: pending ? 0.25 : 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 14 }}
            >
              {/* Icon */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                backgroundColor: done ? 'rgba(200,255,0,0.15)' : current ? 'rgba(200,255,0,0.08)' : S2,
                border: `1px solid ${done ? A : current ? 'rgba(200,255,0,0.4)' : B}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {done ? (
                  <Check size={13} color={A} />
                ) : current ? (
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    border: `2px solid rgba(200,255,0,0.2)`, borderTopColor: A,
                    animation: 'spin 0.7s linear infinite',
                  }} />
                ) : (
                  <span style={{ fontSize: 10, color: M, fontFamily: ff, fontWeight: 700 }}>{i + 1}</span>
                )}
              </div>

              <span style={{
                fontSize: 14, fontFamily: ff,
                color: done ? M : current ? T : M,
                fontWeight: current ? 600 : 400,
              }}>
                {step}
              </span>
            </motion.div>
          )
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <button style={{
        background: 'none', border: 'none', color: M2, fontSize: 12,
        fontFamily: ff, cursor: 'pointer', textAlign: 'center',
      }}>
        Cancelar
      </button>
    </motion.div>
  )
}

// ─── Estado 3: Preview + Editor ───────────────────────────────
function StatePreview({
  initialSlides,
}: {
  onBack?: () => void
  initialSlides: Slide[]
}) {
  const [slides, setSlides] = useState<Slide[]>(initialSlides)
  const [activeSlide, setActiveSlide] = useState(0)
  const [editingField, setEditingField] = useState<{ id: string; field: 'titulo' | 'corpo' } | null>(null)
  const [bgStyle, setBgStyle] = useState('Cinemático')
  const [legenda, setLegenda] = useState(`Você não é preguiçoso. Você está travado por um motivo que ninguém te ensinou a resolver.\n\nProcrastinação não é falta de força de vontade. É regulação emocional — e agora você vai entender por quê.\n\n↓ Salva esse post. Vai fazer sentido depois.`)

  const updateSlide = (id: string, field: 'titulo' | 'corpo', value: string) =>
    setSlides((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s))

  const removeSlide = (id: string) => {
    const next = slides.filter((s) => s.id !== id)
    setSlides(next)
    if (activeSlide >= next.length) setActiveSlide(Math.max(0, next.length - 1))
  }

  const addSlide = () => {
    const newSlide: Slide = {
      id: String(Date.now()), titulo: 'NOVO SLIDE', corpo: 'Edite este texto.', hack: '',
    }
    setSlides((prev) => [...prev, newSlide])
    setActiveSlide(slides.length)
  }

  const current = slides[activeSlide]

  const copyLegenda = () => {
    navigator.clipboard.writeText(legenda).then(() => toast.success('Legenda copiada'))
  }

  return (
    <motion.div
      key="preview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        width: '100%', height: '100%', display: 'flex',
        flexDirection: 'row', overflow: 'hidden',
      }}
    >
      {/* ── Editor (esq 40%) ── */}
      <div style={{
        width: '40%', minWidth: 300, height: '100%',
        overflowY: 'auto', borderRight: `1px solid ${B}`,
        padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <h3 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 20, color: A, margin: 0, letterSpacing: 1.5 }}>
          SEUS SLIDES
        </h3>

        {/* Slide cards */}
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            onClick={() => setActiveSlide(idx)}
            style={{
              backgroundColor: activeSlide === idx ? 'rgba(200,255,0,0.06)' : S2,
              border: `1px solid ${activeSlide === idx ? 'rgba(200,255,0,0.4)' : B}`,
              borderRadius: 10, padding: '12px 14px',
              cursor: 'pointer', position: 'relative', transition: 'all 0.15s',
            }}
          >
            {/* Slide number + remove */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: A, fontFamily: ff, fontWeight: 700, letterSpacing: 1 }}>
                SLIDE {idx + 1}
              </span>
              {slides.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeSlide(slide.id) }}
                  style={{
                    background: 'none', border: 'none', color: M, cursor: 'pointer',
                    padding: 2, display: 'flex', opacity: 0.6, transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#f87171' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = M }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Título */}
            {editingField?.id === slide.id && editingField.field === 'titulo' ? (
              <input
                autoFocus
                value={slide.titulo}
                onChange={(e) => updateSlide(slide.id, 'titulo', e.target.value)}
                onBlur={() => setEditingField(null)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.3)', border: `1px solid rgba(200,255,0,0.4)`,
                  borderRadius: 6, color: T, fontFamily: '"Bebas Neue", sans-serif', fontSize: 14,
                  letterSpacing: 0.5, padding: '4px 8px', width: '100%', outline: 'none',
                  boxSizing: 'border-box', marginBottom: 6,
                }}
              />
            ) : (
              <p
                onClick={(e) => { e.stopPropagation(); setActiveSlide(idx); setEditingField({ id: slide.id, field: 'titulo' }) }}
                style={{
                  fontFamily: '"Bebas Neue", sans-serif', fontSize: 14, color: T,
                  margin: '0 0 6px', letterSpacing: 0.5, cursor: 'text',
                  padding: '2px 4px', borderRadius: 4,
                  transition: 'background 0.15s',
                }}
                title="Clique para editar"
              >
                {slide.titulo}
              </p>
            )}

            {/* Corpo */}
            {editingField?.id === slide.id && editingField.field === 'corpo' ? (
              <textarea
                autoFocus
                value={slide.corpo}
                onChange={(e) => updateSlide(slide.id, 'corpo', e.target.value)}
                onBlur={() => setEditingField(null)}
                onClick={(e) => e.stopPropagation()}
                rows={3}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.3)', border: `1px solid rgba(200,255,0,0.4)`,
                  borderRadius: 6, color: M, fontFamily: ff, fontSize: 11, lineHeight: 1.5,
                  padding: '4px 8px', width: '100%', outline: 'none', resize: 'none',
                  boxSizing: 'border-box',
                }}
              />
            ) : (
              <p
                onClick={(e) => { e.stopPropagation(); setActiveSlide(idx); setEditingField({ id: slide.id, field: 'corpo' }) }}
                style={{
                  fontSize: 11, color: M, fontFamily: ff, margin: 0, lineHeight: 1.5,
                  cursor: 'text', padding: '2px 4px', borderRadius: 4,
                }}
                title="Clique para editar"
              >
                {slide.corpo}
              </p>
            )}

            {slide.hack && (
              <span style={{
                display: 'inline-block', marginTop: 8, fontSize: 9, color: A,
                fontFamily: ff, fontWeight: 700, letterSpacing: 0.8,
                backgroundColor: 'rgba(200,255,0,0.1)', padding: '2px 6px', borderRadius: 99,
              }}>
                {slide.hack}
              </span>
            )}
          </div>
        ))}

        {/* Add slide */}
        <button onClick={addSlide} style={{
          backgroundColor: 'transparent', border: `1px dashed ${B}`, borderRadius: 10,
          padding: '10px 14px', color: M, fontSize: 13, fontFamily: ff,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'border-color 0.15s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = B }}>
          <Plus size={14} /> Adicionar slide vazio
        </button>

        {/* Legenda */}
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 18, color: A, margin: 0, letterSpacing: 1.5 }}>
              LEGENDA
            </h3>
            <button onClick={copyLegenda} style={{
              backgroundColor: 'rgba(200,255,0,0.08)', border: `1px solid rgba(200,255,0,0.2)`,
              borderRadius: 6, padding: '5px 10px', color: A, fontSize: 11,
              fontFamily: ff, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Copy size={11} /> Copiar
            </button>
          </div>
          <textarea
            value={legenda}
            onChange={(e) => setLegenda(e.target.value)}
            rows={6}
            style={{
              width: '100%', backgroundColor: S2, border: `1px solid ${B}`,
              borderRadius: 8, color: T, fontSize: 12, fontFamily: ff, lineHeight: 1.7,
              padding: '10px 12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(200,255,0,0.3)' }}
            onBlur={(e) => { e.target.style.borderColor = B }}
          />
        </div>
      </div>

      {/* ── Preview (dir 60%) ── */}
      <div style={{
        flex: 1, height: '100%', overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        padding: '32px 24px 32px', gap: 20,
      }}>
        {/* Phone mockup */}
        <div style={{
          width: 280, flexShrink: 0,
          backgroundColor: '#111',
          border: '8px solid #1A1A1A',
          borderRadius: 44,
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.06)',
          position: 'relative',
        }}>
          {/* Câmera */}
          <div style={{
            height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#111',
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#222', border: '1px solid #333' }} />
          </div>

          {/* Slide display */}
          <AnimatePresence mode="wait">
            {current && (
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                style={{
                  height: 440, background: BG_STYLES[bgStyle],
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'flex-end', padding: '28px 22px',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {/* Watermark slide number */}
                <span style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%,-50%)',
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: 120, color: 'rgba(255,255,255,0.03)',
                  letterSpacing: 4, userSelect: 'none', lineHeight: 1,
                }}>
                  {activeSlide + 1}
                </span>

                {/* Hack badge */}
                {current.hack && (
                  <span style={{
                    position: 'absolute', top: 14, left: 14,
                    fontSize: 8, color: A, fontFamily: ff, fontWeight: 700,
                    letterSpacing: 1, backgroundColor: 'rgba(200,255,0,0.12)',
                    padding: '3px 7px', borderRadius: 99,
                  }}>
                    {current.hack.toUpperCase()}
                  </span>
                )}

                <p style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 22, color: T, margin: '0 0 10px', lineHeight: 1.15, letterSpacing: 0.5, zIndex: 1 }}>
                  {current.titulo}
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontFamily: ff, margin: 0, lineHeight: 1.55, zIndex: 1 }}>
                  {current.corpo}
                </p>

                {/* Logo watermark */}
                <span style={{
                  position: 'absolute', bottom: 10, right: 14, fontSize: 9,
                  fontFamily: '"Bebas Neue", sans-serif', color: 'rgba(255,255,255,0.2)',
                  letterSpacing: 1,
                }}>
                  ConteudOS
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom chrome */}
          <div style={{ height: 20, backgroundColor: '#111' }} />
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => setActiveSlide((p) => Math.max(0, p - 1))}
            disabled={activeSlide === 0}
            style={{
              width: 36, height: 36, borderRadius: '50%', backgroundColor: S2,
              border: `1px solid ${B}`, color: activeSlide === 0 ? M2 : T,
              cursor: activeSlide === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          ><ChevronLeft size={16} /></button>

          {/* Dots */}
          <div style={{ display: 'flex', gap: 6 }}>
            {slides.map((_, i) => (
              <button key={i} onClick={() => setActiveSlide(i)} style={{
                width: i === activeSlide ? 18 : 6,
                height: 6, borderRadius: 99,
                backgroundColor: i === activeSlide ? A : B,
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'all 0.2s',
              }} />
            ))}
          </div>

          <button
            onClick={() => setActiveSlide((p) => Math.min(slides.length - 1, p + 1))}
            disabled={activeSlide === slides.length - 1}
            style={{
              width: 36, height: 36, borderRadius: '50%', backgroundColor: S2,
              border: `1px solid ${B}`, color: activeSlide === slides.length - 1 ? M2 : T,
              cursor: activeSlide === slides.length - 1 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          ><ChevronRight size={16} /></button>
        </div>

        {/* Slide counter */}
        <p style={{ fontSize: 12, color: M, fontFamily: ff, margin: 0 }}>
          {activeSlide + 1} / {slides.length}
        </p>

        {/* Background style selector */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {Object.keys(BG_STYLES).map((s) => {
            const sel = bgStyle === s
            return (
              <button key={s} onClick={() => setBgStyle(s)} style={{
                padding: '7px 14px', borderRadius: 8,
                backgroundColor: sel ? 'rgba(200,255,0,0.1)' : S2,
                border: `1px solid ${sel ? A : B}`,
                color: sel ? A : M, fontSize: 12, fontFamily: ff,
                fontWeight: sel ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {s}
              </button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main ─────────────────────────────────────────────────────
export default function Studio() {
  const [searchParams] = useSearchParams()
  const temaFromURL = searchParams.get('tema') ?? ''
  const [appState, setAppState] = useState<AppState>('input')

  const handleGenerate = useCallback(() => {
    setAppState('generating')
  }, [])

  const handleDone = useCallback(() => {
    setAppState('preview')
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: BG, overflow: 'hidden' }}>
      <Header />

      <div style={{
        flex: 1, paddingTop: 56,
        display: 'flex', alignItems: appState !== 'preview' ? 'center' : 'stretch',
        justifyContent: appState !== 'preview' ? 'center' : 'stretch',
        overflow: 'hidden',
      }}>
        <AnimatePresence mode="wait">
          {appState === 'input' && (
            <div style={{ width: '100%', maxWidth: 640, padding: '40px 24px' }}>
              <StateInput temaInit={temaFromURL} onGenerate={handleGenerate} />
            </div>
          )}
          {appState === 'generating' && (
            <div style={{ width: '100%', maxWidth: 480, padding: '40px 24px' }}>
              <StateGenerating onDone={handleDone} />
            </div>
          )}
          {appState === 'preview' && (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <StatePreview onBack={() => setAppState('input')} initialSlides={MOCK_SLIDES} />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom bar — só no preview */}
      {appState === 'preview' && (
        <div style={{
          height: 60, borderTop: `1px solid ${B}`,
          backgroundColor: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', flexShrink: 0,
        }}>
          <button
            onClick={() => setAppState('input')}
            style={{
              background: 'none', border: 'none', color: M, fontSize: 13,
              fontFamily: ff, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <ChevronLeft size={14} /> Novo tema
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{
              height: 38, padding: '0 18px', backgroundColor: S2,
              border: `1px solid ${B}`, borderRadius: 8, color: T,
              fontSize: 13, fontFamily: ff, fontWeight: 600, cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = B }}>
              Agendar
            </button>
            <button
              onClick={() => toast.info('Download em breve — exportação via Playwright chega na Fase 6')}
              style={{
                height: 38, padding: '0 22px', backgroundColor: A,
                border: 'none', borderRadius: 8, color: '#000',
                fontSize: 13, fontFamily: ff, fontWeight: 700, cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ADDF00' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = A }}
            >
              BAIXAR ZIP
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
