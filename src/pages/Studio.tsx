import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Check, ChevronLeft, ChevronRight, Copy, Download, Image, Link, Plus, Share2, Sparkles, Trash2, X, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { toPng } from 'html-to-image'
import JSZip from 'jszip'
import { usePlan } from '@/hooks/usePlan'
import { supabase } from '@/lib/supabase'
import { SlideRenderer, getSlideContainerStyle, CarouselTemplate as _CarouselTemplate } from '@/components/SlideRenderer'

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

type CarouselTemplate = _CarouselTemplate

const TEMPLATES: { key: CarouselTemplate; icon: string; name: string; desc: string }[] = [
  { key: 'impacto',      icon: '⚡', name: 'Impacto',     desc: 'Autoridade e hooks visuais' },
  { key: 'editorial',    icon: '📰', name: 'Editorial',   desc: 'Educação e análises' },
  { key: 'lista',        icon: '📋', name: 'Lista Viral', desc: 'Dicas e passo a passo' },
  { key: 'citacao',      icon: '💬', name: 'Citação',     desc: 'Frases e reflexões' },
  { key: 'comparacao',   icon: '⚖️', name: 'Comparação',  desc: 'Antes vs Depois' },
  { key: 'storytelling', icon: '📖', name: 'Narrativa',   desc: 'Jornada e bastidores' },
]

// ─── Mock slides ──────────────────────────────────────────────
interface Slide {
  id: string
  titulo: string
  corpo: string
  hack: string
  bgImageUrl?: string
  textPosition?: 'top' | 'center' | 'bottom'
  imageOpacity?: number         // 10–100, default 100
  paddingX?: number             // margem lateral px, default 24
  titleFontSize?: number        // mockup px, default 28
  bodyFontSize?: number         // mockup px, default 12
  fontWeightTitle?: 'normal' | 'bold'
  fontFamily?: string           // CSS font-family string
  textColor?: string            // default #F5F5F5
  textAlign?: 'left' | 'center' | 'right'
  titlePos?: { x: number; y: number }
  blockSpacing?: number         // gap px between title and body, default 16
  beforeText?: string           // Comparação template — coluna ANTES
  afterText?: string            // Comparação template — coluna DEPOIS
}

const EXPORT_SCALE = 4  // mockup → export resolution multiplier
const TEXT_COLORS = ['#F5F5F5', '#000000', '#C8FF00', '#FFD700', '#FF4444', '#4488FF', '#FF8C00', '#FF69B4']

const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Bebas Neue',       value: '"Bebas Neue", sans-serif' },
  { label: 'DM Sans',          value: 'DM Sans, sans-serif' },
  { label: 'Inter',            value: 'Inter, sans-serif' },
  { label: 'Playfair Display', value: '"Playfair Display", serif' },
  { label: 'Oswald',           value: 'Oswald, sans-serif' },
  { label: 'Montserrat',       value: 'Montserrat, sans-serif' },
]

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


const CTA_OPTIONS = [
  'Engajamento', 'Salvar', 'Seguir', 'DM', 'Link na bio',
  'Palavra mágica', 'Personalizado', 'Padrão do perfil',
]

// ─── Shared ───────────────────────────────────────────────────
const inputSt: React.CSSProperties = {
  backgroundColor: S, border: `1px solid rgba(200,255,0,0.3)`, borderRadius: 10,
  color: T, fontFamily: ff, outline: 'none', transition: 'border-color 0.2s',
}


// ─── Header ───────────────────────────────────────────────────
function Header() {
  const { plan, exportsRemaining, exportLimit } = usePlan()
  const navigate = useNavigate()
  const PLAN_COLORS: Record<string, string> = { free: M2, criador: '#00B4D8', profissional: A, agencia: '#A855F7' }
  const color = PLAN_COLORS[plan] ?? M2

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
      backgroundColor: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${B}`, padding: '0 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56,
    }}>
      {/* Left: back button + logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            color: M, fontFamily: ff, fontSize: 13,
            padding: '6px 10px 6px 6px', borderRadius: 8,
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = T; e.currentTarget.style.background = B }}
          onMouseLeave={e => { e.currentTarget.style.color = M; e.currentTarget.style.background = 'none' }}
        >
          <ChevronLeft size={16} />
          Dashboard
        </button>
        <div style={{ width: 1, height: 20, background: B }} />
        <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 22, color: T, letterSpacing: 1.5 }}>
          Conteúd<span style={{ color: A }}>OS</span>
        </span>
      </div>

      {/* Right: plan badge + exports */}
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

// ─── Tooltip chip wrapper ──────────────────────────────────────
function TooltipChip({
  label, active, onClick, tooltip,
}: { label: string; active: boolean; onClick: () => void; tooltip: string }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{
          height: 36, padding: '0 14px',
          backgroundColor: active ? A : S2,
          color: active ? '#000' : M,
          border: `1px solid ${active ? A : B}`,
          borderRadius: 8, fontSize: 13, fontWeight: active ? 700 : 400,
          fontFamily: ff, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
        }}
      >
        {label}
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
              transform: 'translateX(-50%)',
              background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, padding: '8px 12px',
              fontFamily: ff, fontSize: 12, color: T,
              whiteSpace: 'nowrap', zIndex: 50,
              boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
              maxWidth: 220, whiteSpaceCollapse: 'collapse',
              textAlign: 'center', lineHeight: 1.4,
            } as React.CSSProperties}
          >
            {tooltip}
            {/* Arrow */}
            <div style={{
              position: 'absolute', top: '100%', left: '50%',
              transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #1A1A1A',
            }} />
          </motion.div>
        )}
      </AnimatePresence>
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
  const [tema, setTema]         = useState(temaInit)
  const [slides, setSlides]     = useState(7)
  const [tom, setTom]           = useState('Provocador')
  const [cta, setCta]           = useState('Engajamento')
  const [viralOpen, setViralOpen] = useState(false)
  const [viralMode, setViralMode] = useState<'link' | 'texto'>('link')
  const [viralLink, setViralLink] = useState('')
  const [viralText, setViralText] = useState('')

  const canCreate = tema.trim().length >= 4

  const SLIDE_TOOLTIPS: Record<number, string> = {
    5:  '5 slides — formato direto: capa, 3 pontos e CTA',
    7:  '7 slides — fluxo completo com capa, desenvolvimento e CTA',
    10: '10 slides — aprofundamento com contexto e exemplos',
    12: '12 slides — storytelling longo com arco narrativo',
    15: '15 slides — conteúdo denso, ideal para tutoriais',
  }
  const TOM_TOOLTIPS: Record<string, string> = {
    Provocador: 'Questiona crenças e provoca reflexão — alto engajamento',
    Educativo:  'Ensina de forma clara e didática — ideal para autoridade',
    Bastidor:   'Mostra o processo por trás — humaniza e cria conexão',
    Humor:      'Usa leveza e ironia para comunicar — viraliza rápido',
  }

  function applyViral() {
    const content = viralMode === 'link' ? viralLink.trim() : viralText.trim()
    if (!content) return
    setTema(content.length > 120 ? content.slice(0, 120) : content)
    setViralOpen(false)
    setViralLink('')
    setViralText('')
  }

  return (
    <motion.div
      key="input"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
      style={{ width: '100%', maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 20 }}
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
        placeholder="Ex: por que 97% das pessoas nunca atingem a meta que definem"
        onKeyDown={(e) => { if (e.key === 'Enter' && canCreate) onGenerate({ tema, slides, tom, cta }) }}
        style={{
          ...inputSt, width: '100%', height: 72, padding: '0 20px',
          fontSize: 18, boxSizing: 'border-box',
        }}
        onFocus={(e) => { e.target.style.borderColor = A }}
        onBlur={(e) => { e.target.style.borderColor = 'rgba(200,255,0,0.3)' }}
      />

      {/* Botão "Analisar conteúdo viral" */}
      <div>
        <button
          onClick={() => setViralOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: viralOpen ? 'rgba(0,180,216,0.15)' : 'rgba(0,180,216,0.08)',
            border: '1px solid #00B4D8',
            borderRadius: viralOpen ? '10px 10px 0 0' : 10,
            color: '#00B4D8', fontFamily: ff, fontSize: 13,
            padding: '10px 16px', cursor: 'pointer',
            transition: 'background 0.15s',
            width: '100%',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,180,216,0.18)' }}
          onMouseLeave={e => { e.currentTarget.style.background = viralOpen ? 'rgba(0,180,216,0.15)' : 'rgba(0,180,216,0.08)' }}
        >
          <Link size={15} />
          Analisar conteúdo do YouTube ou Instagram
          <span style={{ marginLeft: 'auto', opacity: 0.7, fontSize: 12 }}>
            {viralOpen ? '▲' : '▼'}
          </span>
        </button>

        <AnimatePresence>
          {viralOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                background: 'rgba(0,180,216,0.05)',
                border: '1px solid #00B4D8', borderTop: 'none',
                borderRadius: '0 0 10px 10px',
                padding: '20px 18px',
                display: 'flex', flexDirection: 'column', gap: 14,
              }}>
                <p style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 16, color: T, margin: 0, letterSpacing: 1 }}>
                  COLE O LINK OU O TEXTO DO CONTEÚDO VIRAL
                </p>

                {/* Toggle Link / Texto */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['link', 'texto'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViralMode(mode)}
                      style={{
                        padding: '6px 16px', borderRadius: 8,
                        background: viralMode === mode ? '#00B4D8' : 'transparent',
                        border: `1px solid ${viralMode === mode ? '#00B4D8' : 'rgba(0,180,216,0.3)'}`,
                        color: viralMode === mode ? '#000' : '#00B4D8',
                        fontFamily: ff, fontSize: 13, cursor: 'pointer',
                        textTransform: 'capitalize', transition: 'all 0.15s',
                      }}
                    >
                      {mode === 'link' ? 'Link' : 'Texto'}
                    </button>
                  ))}
                </div>

                {viralMode === 'link' ? (
                  <input
                    type="url"
                    value={viralLink}
                    onChange={e => setViralLink(e.target.value)}
                    placeholder="youtube.com/watch?v=... ou link do post do Instagram"
                    style={{
                      ...inputSt, width: '100%', height: 44, padding: '0 14px',
                      fontSize: 14, boxSizing: 'border-box',
                      border: '1px solid rgba(0,180,216,0.4)',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#00B4D8' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(0,180,216,0.4)' }}
                  />
                ) : (
                  <textarea
                    value={viralText}
                    onChange={e => setViralText(e.target.value)}
                    placeholder="Cole aqui a transcrição, legenda ou texto do conteúdo viral..."
                    rows={5}
                    style={{
                      ...inputSt, width: '100%', padding: '12px 14px',
                      fontSize: 14, boxSizing: 'border-box', resize: 'vertical',
                      border: '1px solid rgba(0,180,216,0.4)',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#00B4D8' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(0,180,216,0.4)' }}
                  />
                )}

                <p style={{ fontFamily: ff, fontSize: 12, color: 'rgba(0,180,216,0.7)', margin: 0, lineHeight: 1.5 }}>
                  A IA vai identificar os hacks psicológicos usados e recriar na sua voz
                </p>

                <button
                  onClick={applyViral}
                  disabled={!(viralMode === 'link' ? viralLink.trim() : viralText.trim())}
                  style={{
                    background: '#00B4D8', color: '#000', border: 'none',
                    borderRadius: 8, padding: '11px 0', cursor: 'pointer',
                    fontFamily: '"Bebas Neue", sans-serif', fontSize: 16, letterSpacing: 1,
                    opacity: !(viralMode === 'link' ? viralLink.trim() : viralText.trim()) ? 0.4 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  EXTRAIR E ANALISAR →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Opções */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Slides */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: M, fontFamily: ff, minWidth: 48 }}>Slides:</span>
          {[5, 7, 10, 12, 15].map((n) => (
            <TooltipChip
              key={n}
              label={String(n)}
              active={slides === n}
              onClick={() => setSlides(n)}
              tooltip={SLIDE_TOOLTIPS[n]}
            />
          ))}
        </div>

        {/* Tom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: M, fontFamily: ff, minWidth: 48 }}>Tom:</span>
          {(['Provocador', 'Educativo', 'Bastidor', 'Humor'] as const).map((t) => (
            <TooltipChip
              key={t}
              label={t}
              active={tom === t}
              onClick={() => setTom(t)}
              tooltip={TOM_TOOLTIPS[t]}
            />
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
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
        <span style={{ fontFamily: ff, fontSize: 12, color: M, textAlign: 'center' }}>
          Gera copy, aplica hacks virais e monta o carrossel em ~30 segundos
        </span>
      </div>
    </motion.div>
  )
}

// ─── Estado 2: Gerando ────────────────────────────────────────
interface GenerateConfig { tema: string; slides: number; tom: string; cta: string }
interface GenerateResult {
  carousel_id: string
  preview_token: string
  slides: Array<{ position: number; titulo: string; corpo: string; bg_image_url?: string }>
  legenda: string
  has_watermark: boolean
}

function StateGenerating({
  config,
  onDone,
  onError,
}: {
  config: GenerateConfig
  onDone: (result: GenerateResult) => void
  onError: () => void
}) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [msgIdx, setMsgIdx] = useState(0)
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    // Progress bar animada enquanto aguarda a API (estimativa 25s)
    const ANIM_DURATION = 25_000
    const start = Date.now()
    let rafId: number
    const frame = () => {
      const elapsed = Date.now() - start
      const pct = Math.min((elapsed / ANIM_DURATION) * 95, 95) // para em 95% até API responder
      setProgress(pct)
      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)

    // Revelar steps progressivamente
    const stepTimers = GENERATE_STEPS.map((_, i) =>
      setTimeout(() => setCurrentStep(i + 1), (i + 1) * 4_000)
    )

    // Rotacionar mensagens
    const msgInterval = setInterval(() => setMsgIdx((p) => (p + 1) % MESSAGES.length), 4000)

    // Chamada real à Edge Function
    const run = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('generate-carousel', {
          body: {
            tema: config.tema,
            tom: config.tom,
            num_slides: config.slides,
            cta_tipo: config.cta,
          },
        })

        if (fnError) throw fnError
        if (!data) throw new Error('no_data')

        if (data.error === 'export_limit_reached') {
          toast.error('Você atingiu o limite de carrosseis do seu plano. Faça upgrade para continuar.')
          cancelAnimationFrame(rafId)
          onError()
          return
        }

        cancelAnimationFrame(rafId)
        setProgress(100)
        setCurrentStep(GENERATE_STEPS.length + 1)
        setTimeout(() => onDone(data as GenerateResult), 400)
      } catch (err) {
        console.error('generate-carousel error:', err)
        toast.error('Erro ao gerar carrossel. Tente novamente.')
        cancelAnimationFrame(rafId)
        onError()
      }
    }

    run()

    return () => {
      cancelAnimationFrame(rafId)
      stepTimers.forEach(clearTimeout)
      clearInterval(msgInterval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

// ─── Modal de Upgrade ─────────────────────────────────────────
function UpgradeModal({ onClose, plan }: { onClose: () => void; plan: string }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: S, border: `1px solid ${B}`,
          borderRadius: 16, padding: '36px 32px', maxWidth: 400, width: '90%',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}
      >
        <div>
          <p style={{ fontSize: 10, color: A, fontFamily: ff, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px', textTransform: 'uppercase' }}>
            Limite atingido
          </p>
          <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 28, color: T, margin: 0, letterSpacing: 1 }}>
            Você esgotou suas exportações
          </h2>
        </div>

        <p style={{ fontSize: 13, color: M, fontFamily: ff, lineHeight: 1.6, margin: 0 }}>
          {plan === 'free'
            ? 'O plano gratuito inclui 1 exportação por mês. Faça upgrade para continuar criando sem limite.'
            : 'Você atingiu o limite do seu plano este mês. Faça upgrade ou aguarde o próximo ciclo.'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { name: 'Criador', price: 'R$47/mês', limit: '20 exportações + 20 imagens IA' },
            { name: 'Profissional', price: 'R$97/mês', limit: 'Exportações ilimitadas + Calendário + Telegram' },
            { name: 'Agência', price: 'R$197/mês', limit: 'Ilimitado + 5 subcontas + 200 imagens IA' },
          ].map((p) => (
            <div key={p.name} style={{
              backgroundColor: S2, border: `1px solid ${B}`, borderRadius: 10,
              padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <p style={{ fontFamily: ff, fontWeight: 700, fontSize: 13, color: T, margin: '0 0 2px' }}>{p.name}</p>
                <p style={{ fontFamily: ff, fontSize: 11, color: M, margin: 0 }}>{p.limit}</p>
              </div>
              <span style={{ fontFamily: ff, fontWeight: 700, fontSize: 13, color: A }}>{p.price}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, height: 42, backgroundColor: 'transparent', border: `1px solid ${B}`,
              borderRadius: 8, color: M, fontSize: 13, fontFamily: ff, cursor: 'pointer',
            }}
          >
            Agora não
          </button>
          <button
            onClick={() => window.open('https://conteudos.tech/#planos', '_blank')}
            style={{
              flex: 2, height: 42, backgroundColor: A, border: 'none',
              borderRadius: 8, color: '#000', fontSize: 13, fontFamily: ff,
              fontWeight: 700, cursor: 'pointer',
            }}
          >
            Ver planos
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Estado 3: Preview + Editor ───────────────────────────────
function StatePreview({
  onBack,
  initialSlides,
  initialLegenda,
  carouselId,
  hasWatermark,
  previewToken,
}: {
  onBack: () => void
  initialSlides: Slide[]
  initialLegenda?: string
  carouselId?: string
  hasWatermark?: boolean
  previewToken?: string
}) {
  const { canExport, plan, exportsRemaining } = usePlan()
  const [slides, setSlides] = useState<Slide[]>(initialSlides)
  const [activeSlide, setActiveSlide] = useState(0)
  const [editingField, setEditingField] = useState<{ id: string; field: 'titulo' | 'corpo' } | null>(null)
  const [imageStyle, setImageStyle] = useState<string>('cinematic')
  const [selectedTemplate, setSelectedTemplate] = useState<CarouselTemplate>('impacto')
  const [legenda, setLegenda] = useState(initialLegenda ?? '')
  const [exporting, setExporting] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [generatingImages, setGeneratingImages] = useState(false)
  const [imageGenProgress, setImageGenProgress] = useState<string | null>(null)
  const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null)
  const [selectedEl, setSelectedEl] = useState<'titulo' | 'corpo' | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const exportRefs = useRef<(HTMLDivElement | null)[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetSlideId = useRef<string>('')
  const isDraggingTitle = useRef(false)
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 })
  const currentSlideIdRef = useRef<string | undefined>(undefined)

  // Load template from DB on mount
  useEffect(() => {
    if (!carouselId) return
    supabase.from('carousels').select('template_style').eq('id', carouselId).single().then(({ data }) => {
      if (data?.template_style) setSelectedTemplate(data.template_style as CarouselTemplate)
    })
  }, [carouselId])

  // Save template to DB on change
  useEffect(() => {
    if (!carouselId) return
    supabase.from('carousels').update({ template_style: selectedTemplate }).eq('id', carouselId)
  }, [selectedTemplate, carouselId])

  const updateSlide = (id: string, field: 'titulo' | 'corpo' | 'beforeText' | 'afterText', value: string) =>
    setSlides((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s))

  const updateTextPosition = (id: string, pos: 'top' | 'center' | 'bottom') =>
    setSlides((prev) => prev.map((s) => s.id === id ? { ...s, textPosition: pos } : s))

  // Global mouse events for title drag
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDraggingTitle.current || !currentSlideIdRef.current) return
      const dx = e.clientX - dragStart.current.mx
      const dy = e.clientY - dragStart.current.my
      setSlides((prev) => prev.map((s) =>
        s.id === currentSlideIdRef.current
          ? { ...s, titlePos: { x: dragStart.current.ox + dx, y: dragStart.current.oy + dy } }
          : s
      ))
    }
    const onUp = () => { isDraggingTitle.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const saveFormatTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveFormatToDb = (slideId: string, dbUpdates: Record<string, unknown>) => {
    if (!carouselId || !slideId.startsWith('slide-')) return
    if (saveFormatTimeout.current) clearTimeout(saveFormatTimeout.current)
    saveFormatTimeout.current = setTimeout(async () => {
      const parts = slideId.split('-')
      const position = Number(parts[parts.length - 1])
      if (isNaN(position)) return
      await supabase.from('carousel_slides').update(dbUpdates)
        .eq('carousel_id', carouselId).eq('position', position)
    }, 800)
  }

  const updateSlideFormat = (id: string, updates: Partial<Pick<Slide,
    'titleFontSize' | 'bodyFontSize' | 'fontWeightTitle' | 'textColor' | 'textAlign' | 'titlePos' | 'fontFamily' | 'blockSpacing'
  >>) => {
    setSlides((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } : s))
    const db: Record<string, unknown> = {}
    if (updates.titleFontSize !== undefined) db.font_size_title = updates.titleFontSize
    if (updates.bodyFontSize !== undefined) db.font_size_body = updates.bodyFontSize
    if (updates.fontWeightTitle !== undefined) db.font_weight_title = updates.fontWeightTitle
    if (updates.textColor !== undefined) db.text_color = updates.textColor
    if (updates.textAlign !== undefined) db.text_align = updates.textAlign
    if (updates.titlePos !== undefined) {
      db.title_position_x = updates.titlePos.x
      db.title_position_y = updates.titlePos.y
    }
    if (Object.keys(db).length > 0) saveFormatToDb(id, db)
  }

  const updateImageOpacity = (id: string, val: number) =>
    setSlides((prev) => prev.map((s) => s.id === id ? { ...s, imageOpacity: val } : s))

  const updatePaddingX = (id: string, val: number) =>
    setSlides((prev) => prev.map((s) => s.id === id ? { ...s, paddingX: val } : s))

  const handleUploadImage = async (slideId: string, file: File) => {
    if (!carouselId) return
    setUploadingSlideId(slideId)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${carouselId}/${slideId}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('carousel-images')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) {
        console.error('[upload] storage error:', uploadError)
        toast.error('Erro ao fazer upload da imagem.')
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('carousel-images')
        .getPublicUrl(path)

      // Extrai position do id (formato: slide-{carouselId}-{position})
      const parts = slideId.split('-')
      const position = slideId.startsWith('slide-') ? Number(parts[parts.length - 1]) : null
      if (position !== null && !isNaN(position)) {
        await supabase
          .from('carousel_slides')
          .update({ bg_image_url: publicUrl })
          .eq('carousel_id', carouselId)
          .eq('position', position)
      }

      setSlides((prev) => prev.map((s) => s.id === slideId ? { ...s, bgImageUrl: publicUrl } : s))
      toast.success('Imagem atualizada')
    } catch (e) {
      console.error('[upload] exception:', e)
      toast.error('Erro ao fazer upload.')
    } finally {
      setUploadingSlideId(null)
    }
  }


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

  const duplicateSlide = (id: string) => {
    setSlides((prev) => {
      const idx = prev.findIndex((s) => s.id === id)
      if (idx === -1) return prev
      const copy: Slide = { ...prev[idx], id: String(Date.now()) }
      const next = [...prev]
      next.splice(idx + 1, 0, copy)
      setActiveSlide(idx + 1)
      return next
    })
  }

  const reorderSlide = (fromId: string, toId: string) => {
    setSlides((prev) => {
      const from = prev.findIndex((s) => s.id === fromId)
      const to   = prev.findIndex((s) => s.id === toId)
      if (from === -1 || to === -1 || from === to) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      setActiveSlide(to)
      return next
    })
  }

  const schedulePost = async () => {
    if (!carouselId || !scheduleDate) return
    const { error } = await supabase.from('scheduled_posts').insert({
      carousel_id: carouselId,
      scheduled_at: new Date(scheduleDate).toISOString(),
      notify_minutes_before: 10,
      status: 'pending',
    })
    if (error) { toast.error('Erro ao agendar'); return }
    toast.success('Post agendado')
    setShowSchedule(false)
    setScheduleDate('')
  }

  const current = slides[activeSlide]

  // keep currentSlideIdRef in sync for title drag closure
  useEffect(() => { currentSlideIdRef.current = current?.id }, [current])

  // slideStyle replaced by getSlideContainerStyle in the motion.div below

  const handleGenerateImages = async () => {
    if (!carouselId || generatingImages) return
    setGeneratingImages(true)
    setImageGenProgress('Gerando fundo com IA...')

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) { setGeneratingImages(false); return }

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ carousel_id: carouselId, style: imageStyle }),
      })
      const data = await res.json()

      if (data.error === 'ai_images_limit_reached') {
        toast.error('Limite de imagens IA atingido. Faça upgrade para gerar mais fundos.')
      } else if (data.bg_image_url) {
        setSlides((prev) => prev.map((s) => ({ ...s, bgImageUrl: data.bg_image_url })))
        toast.success('Fundo aplicado em todos os slides')
      } else {
        console.error('[generateImages] erro:', data)
        toast.error('Erro ao gerar imagem. Tente novamente.')
      }
    } catch (e) {
      console.error('[generateImages] exception:', e)
      toast.error('Erro ao gerar imagem.')
    }

    setImageGenProgress(null)
    setGeneratingImages(false)
  }

  const copyLegenda = () => {
    navigator.clipboard.writeText(legenda).then(() => toast.success('Legenda copiada'))
  }

  const handleExport = async () => {
    console.log('Export check — plan:', plan, 'exportsRemaining:', exportsRemaining, 'canExport:', canExport)
    if (!canExport) { setShowUpgrade(true); return }

    setExporting(true)
    const toastId = toast.loading(`Gerando ${slides.length} imagens...`)

    try {
      const zip = new JSZip()

      for (let i = 0; i < slides.length; i++) {
        const el = exportRefs.current[i]
        if (!el) continue

        const dataUrl = await toPng(el, {
          pixelRatio: 1,
          cacheBust: true,
          style: { display: 'flex' },
        })

        const base64 = dataUrl.split(',')[1]
        const num = String(i + 1).padStart(2, '0')
        zip.file(`slide-${num}.png`, base64, { base64: true })

        toast.loading(`Processando ${i + 1}/${slides.length}...`, { id: toastId })
      }

      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'carrossel.zip'
      a.click()
      URL.revokeObjectURL(url)

      // Atualiza status no banco se tiver carousel_id
      if (carouselId) {
        await supabase
          .from('carousels')
          .update({ status: 'exported', exported_at: new Date().toISOString() })
          .eq('id', carouselId)
      }

      toast.success('Download iniciado', { id: toastId })
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Erro ao exportar. Tente novamente.', { id: toastId })
    } finally {
      setExporting(false)
    }
  }

  // Container oculto com todos os slides em resolução real para captura
  const exportContainer = (
    <div style={{ position: 'absolute', left: -9999, top: -9999, pointerEvents: 'none' }}>
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          ref={(el) => { exportRefs.current[i] = el }}
          style={{
            width: 1080, height: 1350, flexShrink: 0,
            ...getSlideContainerStyle(slide, i, slides.length, selectedTemplate, imageStyle, EXPORT_SCALE),
          }}
        >
          <SlideRenderer
            slide={slide}
            index={i}
            total={slides.length}
            template={selectedTemplate}
            imageStyle={imageStyle}
            scale={EXPORT_SCALE}
            hasWatermark={hasWatermark}
          />
        </div>
      ))}
    </div>
  )

  return (
    <>
      {exportContainer}
      {showUpgrade && <UpgradeModal plan={plan} onClose={() => setShowUpgrade(false)} />}
    <motion.div
      key="preview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        width: '100%', flex: 1, minHeight: 0, display: 'flex',
        flexDirection: 'row', overflow: 'hidden',
      }}
    >
      {/* ── Editor (esq 40%) ── */}
      <div style={{
        width: '40%', minWidth: 300, height: '100%',
        display: 'flex', flexDirection: 'column',
        borderRight: `1px solid ${B}`, overflow: 'hidden',
      }}>
        {/* Panel header */}
        <div style={{
          padding: '12px 16px', borderBottom: `1px solid ${B}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, background: BG,
        }}>
          <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 14, color: A, letterSpacing: 1 }}>
            {slides.length} SLIDES
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => toast.success('Rascunho salvo')}
              style={{
                background: 'none', border: `1px solid ${B}`, borderRadius: 6,
                color: M, fontFamily: ff, fontSize: 11, cursor: 'pointer', padding: '5px 10px',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = T }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = B; e.currentTarget.style.color = M }}
            >
              Salvar rascunho
            </button>
            <button
              onClick={onBack}
              style={{
                background: 'none', border: 'none', color: M, fontFamily: ff, fontSize: 12,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = T)}
              onMouseLeave={(e) => (e.currentTarget.style.color = M)}
            >
              <ChevronLeft size={14} /> Voltar
            </button>
          </div>
        </div>

        {/* Scrollable list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {slides.map((slide, idx) => {
            const isActive = activeSlide === idx
            return (
              <div
                key={slide.id}
                draggable
                onDragStart={() => setDragId(slide.id)}
                onDragOver={(e) => { e.preventDefault(); setDragOverId(slide.id) }}
                onDrop={() => {
                  if (dragId && dragId !== slide.id) reorderSlide(dragId, slide.id)
                  setDragId(null); setDragOverId(null)
                }}
                onDragEnd={() => { setDragId(null); setDragOverId(null) }}
                onClick={() => setActiveSlide(idx)}
                style={{
                  backgroundColor: isActive ? 'rgba(200,255,0,0.06)' : S2,
                  border: `1px solid ${dragOverId === slide.id ? A : isActive ? 'rgba(200,255,0,0.4)' : B}`,
                  borderRadius: 10, padding: isActive ? '12px 14px' : '9px 14px',
                  cursor: 'grab', position: 'relative', transition: 'all 0.15s',
                  opacity: dragId === slide.id ? 0.4 : 1,
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isActive ? 8 : 0 }}>
                  <span style={{ fontSize: 10, color: isActive ? A : M, fontFamily: ff, fontWeight: 700, letterSpacing: 1 }}>
                    SLIDE {idx + 1}
                  </span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); duplicateSlide(slide.id) }}
                      title="Duplicar"
                      style={{ background: 'none', border: 'none', color: M, cursor: 'pointer', padding: 2, display: 'flex', opacity: 0.6, transition: 'opacity 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = T }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = M }}
                    >
                      <Copy size={12} />
                    </button>
                    {slides.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSlide(slide.id) }}
                        title="Remover"
                        style={{ background: 'none', border: 'none', color: M, cursor: 'pointer', padding: 2, display: 'flex', opacity: 0.6, transition: 'opacity 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#f87171' }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = M }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Compact: truncated title */}
                {!isActive && (
                  <p style={{
                    fontFamily: '"Bebas Neue", sans-serif', fontSize: 13, color: T,
                    margin: '4px 0 0', letterSpacing: 0.5,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {slide.titulo}
                  </p>
                )}

                {/* Expanded: full edit fields */}
                {isActive && (
                  <>
                    {editingField?.id === slide.id && editingField.field === 'titulo' ? (
                      <input autoFocus value={slide.titulo}
                        onChange={(e) => updateSlide(slide.id, 'titulo', e.target.value)}
                        onBlur={() => setEditingField(null)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: `1px solid rgba(200,255,0,0.4)`, borderRadius: 6, color: T, fontFamily: '"Bebas Neue", sans-serif', fontSize: 14, letterSpacing: 0.5, padding: '4px 8px', width: '100%', outline: 'none', boxSizing: 'border-box', marginBottom: 6 }}
                      />
                    ) : (
                      <p onClick={(e) => { e.stopPropagation(); setActiveSlide(idx); setEditingField({ id: slide.id, field: 'titulo' }) }}
                        style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 14, color: T, margin: '0 0 6px', letterSpacing: 0.5, cursor: 'text', padding: '2px 4px', borderRadius: 4, transition: 'background 0.15s' }}
                      >
                        {slide.titulo}
                      </p>
                    )}

                    {selectedTemplate === 'comparacao' && idx !== 0 && idx !== slides.length - 1 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                        <div>
                          <span style={{ fontSize: 9, color: '#ff7070', fontFamily: ff, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>Antes</span>
                          <textarea value={slide.beforeText ?? ''} onChange={(e) => updateSlide(slide.id, 'beforeText', e.target.value)} rows={2}
                            style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: `1px solid rgba(255,112,112,0.35)`, borderRadius: 6, color: M, fontFamily: ff, fontSize: 11, lineHeight: 1.5, padding: '4px 8px', width: '100%', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <span style={{ fontSize: 9, color: A, fontFamily: ff, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>Depois</span>
                          <textarea value={slide.afterText ?? ''} onChange={(e) => updateSlide(slide.id, 'afterText', e.target.value)} rows={2}
                            style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: `1px solid rgba(200,255,0,0.35)`, borderRadius: 6, color: M, fontFamily: ff, fontSize: 11, lineHeight: 1.5, padding: '4px 8px', width: '100%', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                    ) : (
                      editingField?.id === slide.id && editingField.field === 'corpo' ? (
                        <textarea autoFocus value={slide.corpo}
                          onChange={(e) => updateSlide(slide.id, 'corpo', e.target.value)}
                          onBlur={() => setEditingField(null)}
                          onClick={(e) => e.stopPropagation()}
                          rows={3}
                          style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: `1px solid rgba(200,255,0,0.4)`, borderRadius: 6, color: M, fontFamily: ff, fontSize: 11, lineHeight: 1.5, padding: '4px 8px', width: '100%', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                        />
                      ) : (
                        <p onClick={(e) => { e.stopPropagation(); setActiveSlide(idx); setEditingField({ id: slide.id, field: 'corpo' }) }}
                          style={{ fontSize: 11, color: M, fontFamily: ff, margin: 0, lineHeight: 1.5, cursor: 'text', padding: '2px 4px', borderRadius: 4, whiteSpace: 'pre-wrap' }}
                        >
                          {slide.corpo || <span style={{ opacity: 0.4, fontStyle: 'italic' }}>vazio</span>}
                        </p>
                      )
                    )}

                    {slide.bgImageUrl && (
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 10, color: M, fontFamily: ff }}>Opacidade da imagem</span>
                            <span style={{ fontSize: 10, color: A, fontFamily: ff, fontWeight: 700 }}>{slide.imageOpacity ?? 100}%</span>
                          </div>
                          <input type="range" min={10} max={100} value={slide.imageOpacity ?? 100}
                            onChange={(e) => updateImageOpacity(slide.id, Number(e.target.value))}
                            style={{ width: '100%', accentColor: A, cursor: 'pointer' }} />
                        </div>
                        {idx !== 0 && (
                          <div>
                            <span style={{ fontSize: 10, color: M, fontFamily: ff, display: 'block', marginBottom: 4 }}>Posição do texto</span>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {(['top', 'center', 'bottom'] as const).map((pos) => {
                                const labels = { top: 'Topo', center: 'Centro', bottom: 'Base' }
                                const sel = (slide.textPosition ?? 'bottom') === pos
                                return (
                                  <button key={pos} onClick={() => updateTextPosition(slide.id, pos)} style={{
                                    flex: 1, padding: '3px 0', borderRadius: 5, fontSize: 10, fontFamily: ff,
                                    backgroundColor: sel ? 'rgba(200,255,0,0.1)' : 'transparent',
                                    border: `1px solid ${sel ? 'rgba(200,255,0,0.4)' : B}`,
                                    color: sel ? A : M, cursor: 'pointer', transition: 'all 0.15s',
                                  }}>{labels[pos]}</button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}

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
              <h3 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 18, color: A, margin: 0, letterSpacing: 1.5 }}>LEGENDA</h3>
              <button onClick={copyLegenda} style={{ backgroundColor: 'rgba(200,255,0,0.08)', border: `1px solid rgba(200,255,0,0.2)`, borderRadius: 6, padding: '5px 10px', color: A, fontSize: 11, fontFamily: ff, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Copy size={11} /> Copiar
              </button>
            </div>
            <textarea value={legenda} onChange={(e) => setLegenda(e.target.value)} rows={6}
              style={{ width: '100%', backgroundColor: S2, border: `1px solid ${B}`, borderRadius: 8, color: T, fontSize: 12, fontFamily: ff, lineHeight: 1.7, padding: '10px 12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(200,255,0,0.3)' }}
              onBlur={(e) => { e.target.style.borderColor = B }}
            />
          </div>
        </div>

        {/* Formatting panel — sticky bottom */}
        {selectedEl && current && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'sticky', bottom: 0,
              backgroundColor: BG, borderTop: `1px solid rgba(200,255,0,0.25)`,
              padding: '14px', display: 'flex', flexDirection: 'column', gap: 12,
              maxHeight: '52vh', overflowY: 'auto', flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: A, fontFamily: ff, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
                Formatação — {selectedEl === 'titulo' ? 'Título' : 'Corpo'}
              </span>
              <button onClick={() => setSelectedEl(null)} style={{ background: 'none', border: 'none', color: M, cursor: 'pointer', padding: 2, display: 'flex' }}>
                <X size={14} />
              </button>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: M, fontFamily: ff }}>Tamanho</span>
                <span style={{ fontSize: 10, color: A, fontFamily: ff, fontWeight: 700 }}>
                  {selectedEl === 'titulo' ? (current.titleFontSize ?? 28) : (current.bodyFontSize ?? 12)}px
                </span>
              </div>
              <input type="range" min={12} max={72}
                value={selectedEl === 'titulo' ? (current.titleFontSize ?? 28) : (current.bodyFontSize ?? 12)}
                onChange={(e) => updateSlideFormat(current.id, selectedEl === 'titulo' ? { titleFontSize: Number(e.target.value) } : { bodyFontSize: Number(e.target.value) })}
                style={{ width: '100%', accentColor: A, cursor: 'pointer' }} />
            </div>

            {selectedEl === 'titulo' && (
              <>
                <div>
                  <span style={{ fontSize: 10, color: M, fontFamily: ff, display: 'block', marginBottom: 6 }}>Fonte</span>
                  <select value={current.fontFamily ?? '"Bebas Neue", sans-serif'}
                    onChange={(e) => updateSlideFormat(current.id, { fontFamily: e.target.value })}
                    style={{ width: '100%', backgroundColor: S2, border: `1px solid ${B}`, borderRadius: 6, color: T, fontFamily: ff, fontSize: 12, padding: '6px 8px', outline: 'none', cursor: 'pointer' }}
                  >
                    {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['normal', 'bold'] as const).map((w) => {
                    const sel = (current.fontWeightTitle ?? 'normal') === w
                    return (
                      <button key={w} onClick={() => updateSlideFormat(current.id, { fontWeightTitle: w })} style={{
                        flex: 1, padding: '4px 0', borderRadius: 6, fontSize: 11, fontFamily: ff, fontWeight: w === 'bold' ? 700 : 400,
                        backgroundColor: sel ? 'rgba(200,255,0,0.1)' : 'transparent',
                        border: `1px solid ${sel ? 'rgba(200,255,0,0.4)' : B}`,
                        color: sel ? A : M, cursor: 'pointer',
                      }}>{w === 'normal' ? 'Normal' : 'Negrito'}</button>
                    )
                  })}
                </div>
              </>
            )}

            <div>
              <span style={{ fontSize: 10, color: M, fontFamily: ff, display: 'block', marginBottom: 6 }}>Cor</span>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                {TEXT_COLORS.map((c) => (
                  <button key={c} onClick={() => updateSlideFormat(current.id, { textColor: c })}
                    style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: c, border: 'none', cursor: 'pointer', flexShrink: 0, outline: (current.textColor ?? '#F5F5F5') === c ? `2px solid ${A}` : '2px solid transparent', outlineOffset: 2 }} />
                ))}
                <input type="color" value={current.textColor ?? '#F5F5F5'}
                  onChange={(e) => updateSlideFormat(current.id, { textColor: e.target.value })}
                  style={{ width: 22, height: 22, borderRadius: '50%', border: `1px solid ${B}`, cursor: 'pointer', flexShrink: 0, padding: 0, backgroundColor: 'transparent' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {(['left', 'center', 'right'] as const).map((a) => {
                const labels = { left: '←', center: '≡', right: '→' }
                const sel = (current.textAlign ?? 'left') === a
                return (
                  <button key={a} onClick={() => updateSlideFormat(current.id, { textAlign: a })} style={{
                    flex: 1, padding: '4px 0', borderRadius: 6, fontSize: 14, fontFamily: ff,
                    backgroundColor: sel ? 'rgba(200,255,0,0.1)' : 'transparent',
                    border: `1px solid ${sel ? 'rgba(200,255,0,0.4)' : B}`,
                    color: sel ? A : M, cursor: 'pointer',
                  }}>{labels[a]}</button>
                )
              })}
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: M, fontFamily: ff }}>Espaço entre blocos</span>
                <span style={{ fontSize: 10, color: A, fontFamily: ff, fontWeight: 700 }}>{current.blockSpacing ?? 16}px</span>
              </div>
              <input type="range" min={0} max={48} value={current.blockSpacing ?? 16}
                onChange={(e) => updateSlideFormat(current.id, { blockSpacing: Number(e.target.value) })}
                style={{ width: '100%', accentColor: A, cursor: 'pointer' }} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: M, fontFamily: ff }}>Margem lateral</span>
                <span style={{ fontSize: 10, color: A, fontFamily: ff, fontWeight: 700 }}>{current.paddingX ?? 24}px</span>
              </div>
              <input type="range" min={0} max={60} value={current.paddingX ?? 24}
                onChange={(e) => updatePaddingX(current.id, Number(e.target.value))}
                style={{ width: '100%', accentColor: A, cursor: 'pointer' }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Preview (dir 60%) ── */}
      <div style={{
        flex: 1, height: '100%', overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        padding: '32px 24px 32px', gap: 20,
      }}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file && uploadTargetSlideId.current) {
              handleUploadImage(uploadTargetSlideId.current, file)
            }
            e.target.value = ''
          }}
        />

        {/* Quick actions above mockup */}
        <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'center' }}>
          <button
            onClick={() => { if (current && carouselId) { uploadTargetSlideId.current = current.id; fileInputRef.current?.click() } }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: S2, border: `1px solid ${B}`, borderRadius: 8,
              color: M, fontFamily: ff, fontSize: 12, cursor: 'pointer', padding: '7px 14px',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = T }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = B; e.currentTarget.style.color = M }}
          >
            <Image size={13} /> Trocar fundo
          </button>
          {carouselId && (
            <button
              onClick={handleGenerateImages}
              disabled={generatingImages}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(0,180,216,0.08)', border: `1px solid #00B4D8`, borderRadius: 8,
                color: '#00B4D8', fontFamily: ff, fontSize: 12, cursor: generatingImages ? 'not-allowed' : 'pointer',
                padding: '7px 14px', opacity: generatingImages ? 0.6 : 1, transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (!generatingImages) e.currentTarget.style.background = 'rgba(0,180,216,0.18)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,180,216,0.08)' }}
            >
              <Sparkles size={13} /> {imageGenProgress ?? 'Gerar com IA'}
            </button>
          )}
          {current?.bgImageUrl && (
            <button
              onClick={() => setSlides((prev) => prev.map((s) => s.id === current.id ? { ...s, bgImageUrl: undefined } : s))}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'none', border: `1px solid rgba(248,113,113,0.4)`, borderRadius: 8,
                color: '#f87171', fontFamily: ff, fontSize: 12, cursor: 'pointer', padding: '7px 14px',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f87171'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)'}
            >
              <Trash2 size={13} /> Remover fundo
            </button>
          )}
        </div>

        {/* Phone mockup */}
        <div
          style={{
            width: 320, flexShrink: 0,
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

          {/* Botão trocar imagem — fixo no canto inferior direito do mockup */}
          {carouselId && current && (
            <button
              onClick={() => {
                if (uploadingSlideId) return
                uploadTargetSlideId.current = current.id
                fileInputRef.current?.click()
              }}
              disabled={!!uploadingSlideId}
              style={{
                position: 'absolute', bottom: 28, right: 10,
                zIndex: 20,
                backgroundColor: 'rgba(0,0,0,0.72)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 8, height: 28,
                padding: '0 10px',
                display: 'flex', alignItems: 'center', gap: 5,
                cursor: uploadingSlideId ? 'default' : 'pointer',
                color: uploadingSlideId ? 'rgba(255,255,255,0.4)' : T,
                fontSize: 11, fontFamily: ff, fontWeight: 600,
                backdropFilter: 'blur(6px)',
                transition: 'background 0.15s',
              }}
            >
              <Camera size={12} />
              {uploadingSlideId === current.id ? 'Enviando...' : 'Trocar'}
            </button>
          )}

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
                  height: 440,
                  ...getSlideContainerStyle(current, activeSlide, slides.length, selectedTemplate, imageStyle, 1),
                }}
              >
                <SlideRenderer
                  slide={current}
                  index={activeSlide}
                  total={slides.length}
                  template={selectedTemplate}
                  imageStyle={imageStyle}
                  scale={1}
                  selectedEl={selectedEl}
                  onSelectEl={setSelectedEl}
                  onTitleMouseDown={(e) => {
                    if (selectedEl !== 'titulo') return
                    e.preventDefault()
                    isDraggingTitle.current = true
                    const pos = current?.titlePos ?? { x: 0, y: 0 }
                    dragStart.current = { mx: e.clientX, my: e.clientY, ox: pos.x, oy: pos.y }
                  }}
                  hasWatermark={hasWatermark}
                />
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

        {/* Slide counter + hack badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <p style={{ fontSize: 12, color: M, fontFamily: ff, margin: 0 }}>{activeSlide + 1} / {slides.length}</p>
          {current?.hack && (
            <span style={{
              fontFamily: ff, fontSize: 11, color: A,
              background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.25)',
              borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4,
            }}>⚡ {current.hack}</span>
          )}
        </div>

        {/* Template carousel — scroll-snap, 2 per view */}
        <div style={{ width: '100%' }}>
          <p style={{ fontSize: 11, color: M, fontFamily: ff, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', margin: '0 0 10px' }}>
            Estrutura do Carrossel
          </p>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 6, scrollbarWidth: 'none' }}>
            {TEMPLATES.map(({ key, icon, name, desc }) => {
              const sel = selectedTemplate === key
              return (
                <button key={key} onClick={() => setSelectedTemplate(key)} style={{
                  scrollSnapAlign: 'start', flexShrink: 0, width: 'calc(50% - 4px)',
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                  padding: '10px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                  backgroundColor: sel ? 'rgba(200,255,0,0.07)' : S2,
                  border: `1px solid ${sel ? A : B}`, transition: 'all 0.15s',
                }}>
                  <div style={{
                    width: '100%', height: 38, borderRadius: 6, marginBottom: 8,
                    background: key === 'impacto' ? 'linear-gradient(135deg,#111,#1a1a1a)' :
                                key === 'editorial' ? 'linear-gradient(135deg,#0a0a14,#141428)' :
                                key === 'lista' ? 'linear-gradient(135deg,#0a1a0a,#0f2010)' :
                                key === 'citacao' ? 'linear-gradient(135deg,#1a0a1a,#200f20)' :
                                key === 'comparacao' ? 'linear-gradient(90deg,#1a0a0a 50%,#0a1a0a 50%)' :
                                'linear-gradient(135deg,#1a1000,#2a1800)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                  }}>
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    {sel && <div style={{ position: 'absolute', inset: 0, border: `1.5px solid ${A}`, borderRadius: 6 }} />}
                  </div>
                  <span style={{ fontSize: 11, fontFamily: ff, fontWeight: 700, color: sel ? A : T, lineHeight: 1.2 }}>{name}</span>
                  <span style={{ fontSize: 9, fontFamily: ff, color: M, lineHeight: 1.3, marginTop: 2 }}>{desc}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Seletor de estilo IA */}
        {carouselId && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
            {[
              { key: 'cinematic', label: 'Cinemático' },
              { key: 'illustration', label: 'Ilustração' },
              { key: 'abstract', label: 'Abstrato' },
              { key: 'minimal', label: 'Minimal' },
              { key: 'gradient', label: 'Gradiente' },
            ].map(({ key, label }) => {
              const sel = imageStyle === key
              return (
                <button key={key} onClick={() => setImageStyle(key)} style={{
                  padding: '5px 12px', borderRadius: 6,
                  backgroundColor: sel ? 'rgba(0,180,216,0.15)' : S2,
                  border: `1px solid ${sel ? '#00B4D8' : B}`,
                  color: sel ? '#00B4D8' : M, fontSize: 11, fontFamily: ff,
                  fontWeight: sel ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s',
                }}>{label}</button>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>

    {/* Schedule modal */}
    <AnimatePresence>
      {showSchedule && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowSchedule(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: S, border: `1px solid ${B}`, borderRadius: 16, padding: '28px 28px', width: 340, display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <h3 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 22, color: T, margin: 0, letterSpacing: 1 }}>AGENDAR POST</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: ff, fontSize: 12, color: M }}>Data e hora</label>
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                style={{
                  backgroundColor: S2, border: `1px solid ${B}`, borderRadius: 8,
                  color: T, fontFamily: ff, fontSize: 13, padding: '10px 12px', outline: 'none',
                  colorScheme: 'dark',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(200,255,0,0.4)' }}
                onBlur={(e) => { e.target.style.borderColor = B }}
              />
            </div>
            <p style={{ fontFamily: ff, fontSize: 12, color: M, margin: 0, lineHeight: 1.5 }}>
              Você receberá uma notificação {'{'}10 minutos{'}'} antes via Telegram se configurado.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowSchedule(false)} style={{ flex: 1, height: 40, background: 'none', border: `1px solid ${B}`, borderRadius: 8, color: M, fontFamily: ff, fontSize: 13, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button
                onClick={schedulePost}
                disabled={!scheduleDate || !carouselId}
                style={{ flex: 2, height: 40, backgroundColor: !scheduleDate || !carouselId ? S2 : A, border: 'none', borderRadius: 8, color: !scheduleDate || !carouselId ? M : '#000', fontFamily: ff, fontSize: 13, fontWeight: 700, cursor: !scheduleDate || !carouselId ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}
              >
                Confirmar agendamento
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Bottom bar */}
    <div style={{
      height: 60, borderTop: `1px solid ${B}`,
      backgroundColor: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', flexShrink: 0,
    }}>
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: M, fontSize: 13, fontFamily: ff, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <ChevronLeft size={14} /> Novo tema
      </button>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setShowSchedule(true)}
          style={{
            height: 38, padding: '0 16px', backgroundColor: S2,
            border: `1px solid ${B}`, borderRadius: 8, color: T,
            fontSize: 13, fontFamily: ff, fontWeight: 600, cursor: 'pointer', transition: 'border-color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = B }}
        >
          Agendar
        </button>
        {previewToken && (
          <button
            onClick={() => {
              const url = `https://conteudos.tech/preview/${previewToken}`
              navigator.clipboard.writeText(url).then(() => toast.success('Link copiado'))
            }}
            style={{
              height: 38, padding: '0 16px', backgroundColor: 'none',
              background: 'rgba(200,255,0,0.06)', border: `1px solid rgba(200,255,0,0.3)`,
              borderRadius: 8, color: A,
              fontSize: 13, fontFamily: ff, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(200,255,0,0.12)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(200,255,0,0.06)' }}
          >
            <Share2 size={13} /> Compartilhar
          </button>
        )}
        <button
          onClick={handleExport}
          disabled={exporting}
          style={{
            height: 38, padding: '0 22px',
            backgroundColor: exporting ? S2 : A,
            border: exporting ? `1px solid ${B}` : 'none',
            borderRadius: 8, color: exporting ? M : '#000',
            fontSize: 13, fontFamily: ff, fontWeight: 700,
            cursor: exporting ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 7, opacity: exporting ? 0.7 : 1,
          }}
          onMouseEnter={(e) => { if (!exporting) e.currentTarget.style.backgroundColor = '#ADDF00' }}
          onMouseLeave={(e) => { if (!exporting) e.currentTarget.style.backgroundColor = A }}
        >
          {exporting
            ? <><div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: T, animation: 'spin 0.7s linear infinite' }} /> Exportando...</>
            : <><Download size={14} /> BAIXAR ZIP</>
          }
        </button>
      </div>
    </div>
    </>
  )
}

// ─── Main ─────────────────────────────────────────────────────
export default function Studio() {
  const [searchParams] = useSearchParams()
  const temaFromURL       = searchParams.get('tema') ?? ''
  const carouselIdFromURL = searchParams.get('carousel_id') ?? ''

  const [appState, setAppState] = useState<AppState>('input')
  const [generateConfig, setGenerateConfig] = useState<GenerateConfig | null>(null)
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null)

  // Carrossel carregado do banco (quando abre pelo dashboard)
  const [loadedCarousel, setLoadedCarousel] = useState<{
    carouselId: string
    slides: Slide[]
    legenda: string
    hasWatermark: boolean
    previewToken: string
  } | null>(null)
  const [loadingCarousel, setLoadingCarousel] = useState(!!carouselIdFromURL)

  useEffect(() => {
    if (!carouselIdFromURL) return

    async function loadCarousel() {
      setLoadingCarousel(true)
      const [{ data: carousel }, { data: slidesData }] = await Promise.all([
        supabase
          .from('carousels')
          .select('id, legenda, has_watermark, preview_token')
          .eq('id', carouselIdFromURL)
          .single(),
        supabase
          .from('carousel_slides')
          .select('position, titulo, corpo, hack_aplicado, bg_image_url, font_size_title, font_size_body, font_weight_title, text_color, text_align, title_position_x, title_position_y')
          .eq('carousel_id', carouselIdFromURL)
          .order('position', { ascending: true }),
      ])

      if (!carousel || !slidesData) {
        setLoadingCarousel(false)
        return
      }

      const slides: Slide[] = (slidesData as Array<Record<string, unknown>>).map((s) => ({
        id: `slide-${carouselIdFromURL}-${s.position}`,
        titulo: (s.titulo as string) ?? '',
        corpo: (s.corpo as string) ?? '',
        hack: (s.hack_aplicado as string) ?? '',
        bgImageUrl: (s.bg_image_url as string) ?? undefined,
        titleFontSize: (s.font_size_title as number) ?? undefined,
        bodyFontSize: (s.font_size_body as number) ?? undefined,
        fontWeightTitle: (s.font_weight_title as 'normal' | 'bold') ?? undefined,
        textColor: (s.text_color as string) ?? undefined,
        textAlign: (s.text_align as 'left' | 'center' | 'right') ?? undefined,
        titlePos: (s.title_position_x != null && s.title_position_y != null)
          ? { x: s.title_position_x as number, y: s.title_position_y as number }
          : undefined,
      }))

      setLoadedCarousel({
        carouselId: carouselIdFromURL,
        slides,
        legenda: (carousel as Record<string, unknown>).legenda as string ?? '',
        hasWatermark: (carousel as Record<string, unknown>).has_watermark as boolean ?? true,
        previewToken: (carousel as Record<string, unknown>).preview_token as string ?? '',
      })
      setAppState('preview')
      setLoadingCarousel(false)
    }

    loadCarousel()
  }, [carouselIdFromURL])

  const handleGenerate = useCallback((config: GenerateConfig) => {
    setGenerateConfig(config)
    setAppState('generating')
  }, [])

  const handleDone = useCallback((result: GenerateResult) => {
    setGenerateResult(result)
    setAppState('preview')
  }, [])

  const handleError = useCallback(() => {
    setAppState('input')
  }, [])

  // Slides para o StatePreview: banco (edição) ou API (novo)
  const previewSlides: Slide[] = loadedCarousel?.slides ?? (generateResult?.slides ?? []).map((s) => ({
    id: `slide-${generateResult!.carousel_id}-${s.position}`,
    titulo: s.titulo,
    corpo: s.corpo,
    hack: '',
    bgImageUrl: s.bg_image_url ?? undefined,
  }))
  const previewLegenda    = loadedCarousel?.legenda ?? generateResult?.legenda ?? ''
  const previewCarouselId = loadedCarousel?.carouselId ?? generateResult?.carousel_id
  const previewWatermark  = loadedCarousel?.hasWatermark ?? generateResult?.has_watermark ?? true
  const previewTokenVal   = loadedCarousel?.previewToken ?? generateResult?.preview_token ?? ''

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
          {/* Loading spinner ao abrir carrossel do banco */}
          {loadingCarousel && (
            <div key="loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: `3px solid rgba(200,255,0,0.15)`,
                borderTopColor: A,
                animation: 'spin 0.8s linear infinite',
              }} />
              <span style={{ fontFamily: ff, fontSize: 14, color: M }}>Carregando carrossel...</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
          {!loadingCarousel && appState === 'input' && (
            <div style={{ width: '100%', maxWidth: 640, padding: '40px 24px' }}>
              <StateInput temaInit={temaFromURL} onGenerate={handleGenerate} />
            </div>
          )}
          {!loadingCarousel && appState === 'generating' && generateConfig && (
            <div style={{ width: '100%', maxWidth: 480, padding: '40px 24px' }}>
              <StateGenerating config={generateConfig} onDone={handleDone} onError={handleError} />
            </div>
          )}
          {!loadingCarousel && appState === 'preview' && (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <StatePreview
                onBack={() => setAppState('input')}
                initialSlides={previewSlides.length > 0 ? previewSlides : MOCK_SLIDES}
                initialLegenda={previewLegenda || undefined}
                carouselId={previewCarouselId}
                hasWatermark={previewWatermark}
                previewToken={previewTokenVal || undefined}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}
