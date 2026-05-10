import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Check, ChevronDown, ChevronLeft, ChevronRight, Copy, Download, Grid, Image, Link, Maximize2, Plus, Share2, Sparkles, Trash2, X, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { toPng } from 'html-to-image'
import JSZip from 'jszip'
import { usePlan } from '@/hooks/usePlan'
import { useAuth } from '@/hooks/useAuth'
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
  { key: 'impacto',       icon: '⚡', name: 'Impacto',      desc: 'Autoridade e hooks visuais' },
  { key: 'editorial',     icon: '📰', name: 'Editorial',    desc: 'Educação e análises' },
  { key: 'lista',         icon: '📋', name: 'Lista Viral',  desc: 'Dicas e passo a passo' },
  { key: 'citacao',       icon: '💬', name: 'Citação',      desc: 'Frases e reflexões' },
  { key: 'comparacao',    icon: '⚖️', name: 'Comparação',   desc: 'Antes vs Depois' },
  { key: 'storytelling',  icon: '📖', name: 'Narrativa',    desc: 'Jornada e bastidores' },
  { key: 'editorial_foto',icon: '🖼️', name: 'Edit. Foto',   desc: 'Texto sobre foto com gradiente' },
  { key: 'texto_imagem',  icon: '📝', name: 'Texto + Img',  desc: 'Texto acima, imagem abaixo' },
  { key: 'split_visual',  icon: '⬛', name: 'Split Visual', desc: 'Duas imagens divididas' },
  { key: 'citacao_bold',  icon: '❝',  name: 'Citação Bold', desc: 'Frase grande centralizada' },
]

const TEMPLATE_GRADIENTS: Record<string, string> = {
  impacto:       'linear-gradient(135deg,#060d14,#1a2a3a)',
  editorial:     'linear-gradient(135deg,#0a0a0a,#1a1a14)',
  lista:         'linear-gradient(135deg,#060d14,#0f1e0f)',
  citacao:       'linear-gradient(135deg,#0a0814,#1a0f2e)',
  comparacao:    'linear-gradient(135deg,#140808,#0a0a14)',
  storytelling:  'linear-gradient(135deg,#080614,#14060a)',
  editorial_foto:'linear-gradient(135deg,#0a0a0a,#1a1400)',
  texto_imagem:  'linear-gradient(135deg,#060d14,#081420)',
  split_visual:  'linear-gradient(135deg,#080808,#141414)',
  citacao_bold:  'linear-gradient(135deg,#0a0814,#14082a)',
}

// ─── Mock slides ──────────────────────────────────────────────
interface Slide {
  id: string
  titulo: string
  corpo: string
  hack: string
  bgImageUrl?: string
  textPosition?: 'top' | 'center' | 'bottom'
  imageOpacity?: number         // 10–100, default 100
  overlayOpacity?: number       // 0–90, darkening overlay
  paddingX?: number             // margem lateral px, default 24
  titleFontSize?: number        // mockup px, default 80
  bodyFontSize?: number         // mockup px, default 28
  fontWeightTitle?: 'normal' | 'bold'
  fontFamily?: string           // CSS font-family string
  textColor?: string            // default #F5F5F5
  textAlign?: 'left' | 'center' | 'right'
  titlePos?: { x: number; y: number }
  blockSpacing?: number         // gap px between title and body, default 16
  beforeText?: string           // Comparação template — coluna ANTES
  afterText?: string            // Comparação template — coluna DEPOIS
  afterImageUrl?: string        // Split visual template — imagem inferior
  bgZoom?: number               // 50–300, default 100
  bgPositionX?: number          // 0–100, default 50
  bgPositionY?: number          // 0–100, default 50
  bgFilter?: string             // CSS filter string
  bgVisible?: boolean
  borderVignette?: boolean
  vignetteIntensity?: number
  titleItalic?: boolean
  titleUppercase?: boolean
  titleLetterSpacing?: number
  titleLineHeight?: number
  titleBgEnabled?: boolean
  titleBgColor?: string
  titleShadow?: boolean
  titleShadowIntensity?: number
  bodyFontFamily?: string
  bodyFontWeight?: 'normal' | 'bold'
  bodyColor?: string
  bodyItalic?: boolean
  bodyLineHeight?: number
  bodyLetterSpacing?: number
  bodyBgEnabled?: boolean
  bodyBgColor?: string
  ctaText?: string
  profileBadgeEnabled?: boolean
  profileHandle?: string
  profileAvatarUrl?: string
  profileBadgePosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  profileBadgeSize?: number
  profileBadgeBg?: string
  profileBadgeTextColor?: string
  highlightedWords?: string[]
  accentColor?: string
  bgPattern?: string
  bgPatternOpacity?: number
  bgSolidColor?: string
}

const TEXT_COLORS = ['#F5F5F5', '#000000', '#C8FF00', '#FFD700', '#FF4444', '#4488FF', '#FF8C00', '#FF69B4']


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
  const PLAN_COLORS: Record<string, string> = { free: 'rgba(255,255,255,0.2)', criador: '#00B4D8', profissional: '#C8FF00', agencia: '#A855F7' }
  const color = PLAN_COLORS[plan] ?? 'rgba(255,255,255,0.2)'

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
      backgroundColor: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      height: 44,
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 0,
    }}>
      {/* Logo */}
      <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 18, color: '#F5F5F5', letterSpacing: 1, marginRight: 20, flexShrink: 0 }}>
        Conteúd<span style={{ color: '#C8FF00' }}>OS</span>
      </span>
      {/* Nav */}
      <button onClick={() => navigate('/dashboard')} style={{ height: 44, padding: '0 14px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontFamily: 'DM Sans, sans-serif', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '2px solid transparent', transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = '#F5F5F5'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
      >
        Dashboard
      </button>
      <div style={{ height: 44, padding: '0 14px', display: 'flex', alignItems: 'center', borderBottom: '2px solid #C8FF00' }}>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#F5F5F5', fontWeight: 600 }}>Gerador</span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Plan badge */}
      <span style={{ fontSize: 11, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, color, border: `1px solid ${color}`, borderRadius: 99, padding: '3px 10px', textTransform: 'uppercase', letterSpacing: 0.5, marginRight: 12 }}>
        {plan}
      </span>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: 'DM Sans, sans-serif', marginRight: 8 }}>
        <span style={{ color: exportsRemaining > 0 ? '#F5F5F5' : '#f87171', fontWeight: 600 }}>{exportsRemaining}</span>
        {' '}/ {exportLimit} exportações
      </span>
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
  onGenerate: (config: { tema: string; slides: number; tom: string; cta: string; instructions?: string }) => void
}) {
  const [tema, setTema]         = useState(temaInit)
  const [slides, setSlides]     = useState(7)
  const [tom, setTom]           = useState('Provocador')
  const [cta, setCta]           = useState('Engajamento')
  const [viralOpen, setViralOpen] = useState(false)
  const [viralInput, setViralInput] = useState('')
  const [analyzingViral, setAnalyzingViral] = useState(false)
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [suggestedTopics, setSuggestedTopics] = useState<Array<{titulo: string; hook: string; tipo: string}>>([])
  const [iaInstructions, setIaInstructions] = useState('')
  const [showIaInstructions, setShowIaInstructions] = useState(false)
  const [viralResult, setViralResult] = useState<{
    tema?: string; hacks?: string[]; sugestao?: string
    resumo?: string; manual?: boolean
  } | null>(null)

  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('voice_profile, visual_kit')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) return
        const vp = data.voice_profile as Record<string, string> ?? {}
        if (vp.tom) {
          const tomMap: Record<string, string> = {
            provocador: 'Provocador', educativo: 'Educativo',
            bastidor: 'Bastidor', inspiracional: 'Humor'
          }
          setTom(tomMap[vp.tom] ?? 'Provocador')
        }
      })
  }, [user])

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

  const applyViral = async () => {
    if (!viralInput.trim()) return
    setAnalyzingViral(true)
    setViralResult(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const isUrl = viralInput.startsWith('http')
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify(isUrl ? { url: viralInput } : { texto: viralInput })
        }
      )
      const data = await res.json()
      if (data.sugestao) {
        setViralResult(data)
        setTema(data.sugestao)
      } else if (data.manual) {
        setViralResult(data)
      } else {
        toast.error('Nao foi possivel analisar. Cole o texto diretamente.')
      }
    } catch {
      toast.error('Erro ao analisar conteudo.')
    } finally {
      setAnalyzingViral(false)
    }
  }

  const handleSuggestTopics = async () => {
    setLoadingTopics(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suggest-topics`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
          body: JSON.stringify({})
        }
      )
      const data = await res.json()
      if (data.temas) setSuggestedTopics(data.temas)
    } catch {
      toast.error('Erro ao buscar ideias.')
    } finally {
      setLoadingTopics(false)
    }
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
        onKeyDown={(e) => { if (e.key === 'Enter' && canCreate) onGenerate({ tema, slides, tom, cta, instructions: iaInstructions.trim() || undefined }) }}
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
                <input
                  type="text"
                  value={viralInput}
                  onChange={e => setViralInput(e.target.value)}
                  placeholder="Cole o link do YouTube/Instagram ou o texto do post"
                  style={{
                    ...inputSt, width: '100%', height: 44, padding: '0 14px',
                    fontSize: 14, boxSizing: 'border-box',
                    border: '1px solid rgba(0,180,216,0.4)',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#00B4D8' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(0,180,216,0.4)' }}
                />

                <button
                  onClick={applyViral}
                  disabled={!viralInput.trim() || analyzingViral}
                  style={{
                    background: '#00B4D8', color: '#000', border: 'none',
                    borderRadius: 8, padding: '11px 0', cursor: !viralInput.trim() || analyzingViral ? 'not-allowed' : 'pointer',
                    fontFamily: '"Bebas Neue", sans-serif', fontSize: 16, letterSpacing: 1,
                    opacity: !viralInput.trim() || analyzingViral ? 0.4 : 1,
                    transition: 'opacity 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {analyzingViral ? (
                    <>
                      <div style={{
                        width: 14, height: 14, borderRadius: '50%',
                        border: '2px solid rgba(0,0,0,0.2)',
                        borderTop: '2px solid #000',
                        animation: 'spin 0.7s linear infinite',
                      }} />
                      Analisando...
                    </>
                  ) : 'Analisar →'}
                </button>

                {viralResult && !viralResult.manual && (
                  <div style={{ backgroundColor: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.2)', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {viralResult.resumo && (
                      <p style={{ fontSize: 12, color: M, fontFamily: ff, margin: 0, fontStyle: 'italic' }}>
                        {viralResult.resumo}
                      </p>
                    )}
                    {viralResult.hacks && viralResult.hacks.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {viralResult.hacks.map(h => (
                          <span key={h} style={{ fontSize: 10, color: '#00B4D8', border: '1px solid rgba(0,180,216,0.3)', borderRadius: 99, padding: '2px 8px', fontFamily: ff }}>
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                    <p style={{ fontSize: 11, color: '#C8FF00', fontFamily: ff, margin: 0 }}>
                      Tema sugerido aplicado automaticamente
                    </p>
                  </div>
                )}
                {viralResult?.manual && (
                  <p style={{ fontSize: 12, color: M, fontFamily: ff, margin: 0 }}>
                    Nao conseguimos extrair o link. Cole o texto do post acima.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Instruções para a IA */}
      <div>
        <button
          onClick={() => setShowIaInstructions(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            background: 'none',
            border: `1px solid ${showIaInstructions ? 'rgba(200,255,0,0.3)' : B}`,
            borderRadius: showIaInstructions ? '8px 8px 0 0' : 8,
            color: showIaInstructions ? '#C8FF00' : M,
            fontFamily: ff, fontSize: 13,
            padding: '9px 14px', cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s',
          }}
        >
          ✦ Instruções para a IA (opcional)
          <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: 11 }}>
            {showIaInstructions ? '▲' : '▼'}
          </span>
        </button>
        <AnimatePresence>
          {showIaInstructions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <textarea
                value={iaInstructions}
                onChange={e => setIaInstructions(e.target.value)}
                rows={3}
                placeholder='Ex: "use dados estatísticos", "fale para iniciantes", "tom mais agressivo"'
                style={{
                  width: '100%', boxSizing: 'border-box',
                  backgroundColor: 'rgba(200,255,0,0.03)',
                  border: '1px solid rgba(200,255,0,0.3)', borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  color: 'rgba(255,255,255,0.75)', fontFamily: ff, fontSize: 13,
                  lineHeight: 1.6, padding: '10px 14px',
                  outline: 'none', resize: 'vertical',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(200,255,0,0.5)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(200,255,0,0.3)' }}
              />
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

        {/* Buscar ideias */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleSuggestTopics}
            disabled={loadingTopics}
            style={{
              background: 'none', border: `1px solid rgba(0,180,216,0.3)`,
              borderRadius: 8, color: '#00B4D8', fontSize: 13,
              fontFamily: ff, padding: '8px 16px',
              cursor: loadingTopics ? 'not-allowed' : 'pointer',
              opacity: loadingTopics ? 0.6 : 1,
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'border-color 0.15s',
              alignSelf: 'flex-start',
            }}
            onMouseEnter={e => { if (!loadingTopics) e.currentTarget.style.borderColor = 'rgba(0,180,216,0.7)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,180,216,0.3)' }}
          >
            {loadingTopics ? (
              <>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  border: '2px solid rgba(0,180,216,0.2)',
                  borderTop: '2px solid #00B4D8',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Buscando ideias...
              </>
            ) : 'Buscar ideias para o meu nicho ✦'}
          </button>

          {suggestedTopics.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {suggestedTopics.slice(0, 8).map((t, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: S2, border: `1px solid ${B}`,
                    borderRadius: 8, padding: '10px 14px',
                    cursor: 'pointer', transition: 'border-color 0.15s',
                    display: 'flex', flexDirection: 'column', gap: 4,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,255,0,0.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = B }}
                  onClick={() => { setTema(t.titulo); setSuggestedTopics([]) }}
                >
                  <span style={{ fontSize: 13, color: T, fontFamily: ff, lineHeight: 1.3 }}>{t.titulo}</span>
                  <span style={{ fontSize: 11, color: M, fontFamily: ff, lineHeight: 1.4 }}>{t.hook}</span>
                </div>
              ))}
            </div>
          )}
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
          onClick={() => onGenerate({ tema, slides, tom, cta, instructions: iaInstructions.trim() || undefined })}
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
interface GenerateConfig { tema: string; slides: number; tom: string; cta: string; instructions?: string }
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
  const navigate = useNavigate()
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
            ...(config.instructions ? { instructions: config.instructions } : {}),
          },
        })

        if (fnError) throw fnError
        if (!data) throw new Error('no_data')

        if (data.error === 'export_limit_reached' || data.error === 'carousel_limit_reached') {
          toast.error(`Limite do plano free atingido (${data.limit ?? data.exports_limit ?? 3} carrosseis/mês). Faça upgrade para continuar.`)
          cancelAnimationFrame(rafId)
          onError()
          navigate('/settings?tab=plano')
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

// ─── Helpers for Estado 3 ─────────────────────────────────────

const BG_FILTER_OPTIONS = [
  { label: 'Original',  value: 'none' },
  { label: 'P&B',       value: 'grayscale(1)' },
  { label: 'Sépia',     value: 'sepia(0.8) contrast(1.1)' },
  { label: 'Frio',      value: 'hue-rotate(195deg) saturate(1.3)' },
  { label: 'Quente',    value: 'sepia(0.25) saturate(1.5)' },
  { label: 'Vintage',   value: 'contrast(1.15) brightness(0.9) sepia(0.25)' },
  { label: 'Dramático', value: 'contrast(1.4) brightness(0.85) saturate(1.2)' },
  { label: 'Desbotado', value: 'saturate(0.3) brightness(1.1)' },
]

function CollapsibleSection({
  title, isOpen, onToggle, children, rightSlot,
}: {
  title: React.ReactNode; isOpen: boolean; onToggle: () => void
  children: React.ReactNode; rightSlot?: React.ReactNode
}) {
  return (
    <div style={{ borderBottom: `1px solid ${B}` }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 11, color: A, letterSpacing: 1 }}>
          {title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {rightSlot}
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', color: M }}
          >
            <ChevronDown size={14} />
          </motion.span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SliderRow({
  label, value, min, max, onChange, suffix = '',
}: {
  label: string; value: number; min: number; max: number
  onChange: (v: number) => void; suffix?: string
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: M, fontFamily: ff }}>{label}</span>
        <span style={{ fontSize: 10, color: A, fontFamily: ff, fontWeight: 700 }}>{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: A, cursor: 'pointer' }} />
    </div>
  )
}

// ─── Estado 3: Preview + Editor ───────────────────────────────
function RefinarSlide({ current: _current, onRefinar }: { current: Slide; onRefinar: (instrucao: string) => void }) {
  const [instrucao, setInstrucao] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: 0.5 }}>Refinar slide com IA</span>
      <input
        value={instrucao}
        onChange={e => setInstrucao(e.target.value)}
        placeholder='Ex: "mais agressivo", "adicione dado estatístico"'
        style={{ width: '100%', background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'rgba(255,255,255,0.7)', fontFamily: 'DM Sans, sans-serif', fontSize: 11, padding: '6px 8px', outline: 'none', boxSizing: 'border-box' }}
        onFocus={e => e.target.style.borderColor = 'rgba(200,255,0,0.3)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
        onKeyDown={e => { if (e.key === 'Enter' && instrucao.trim()) { setLoading(true); onRefinar(instrucao); setInstrucao(''); setTimeout(() => setLoading(false), 3000) } }}
      />
      <button
        disabled={!instrucao.trim() || loading}
        onClick={() => { if (instrucao.trim()) { setLoading(true); onRefinar(instrucao); setInstrucao(''); setTimeout(() => setLoading(false), 3000) } }}
        style={{ height: 28, background: instrucao.trim() && !loading ? 'rgba(200,255,0,0.08)' : 'transparent', border: '1px solid rgba(200,255,0,0.2)', borderRadius: 6, color: instrucao.trim() && !loading ? '#C8FF00' : 'rgba(200,255,0,0.3)', fontFamily: 'DM Sans, sans-serif', fontSize: 10, cursor: instrucao.trim() && !loading ? 'pointer' : 'not-allowed' }}>
        {loading ? 'Refinando...' : '✦ Refinar este slide'}
      </button>
    </div>
  )
}

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
  const { user } = useAuth()
  const [profileAvatarDefault, setProfileAvatarDefault] = useState<string | null>(null)
  const [profileColor, setProfileColor] = useState<string | null>(null)
  const [slides, setSlides] = useState<Slide[]>(initialSlides)
  const [activeSlide, setActiveSlide] = useState(0)
  const [_editingField, _setEditingField] = useState<{ id: string; field: 'titulo' | 'corpo' } | null>(null)
  const [imageStyle, setImageStyle] = useState<string>('cinematic')
  const [selectedTemplate, setSelectedTemplate] = useState<CarouselTemplate>('impacto')
  const [slideTheme, setSlideTheme] = useState<'dark' | 'light'>('dark')
  const [legenda, setLegenda] = useState(initialLegenda ?? '')
  // view & section state
  const [viewMode, setViewMode] = useState<'slide' | 'grid'>('grid')
  const [secImagem,  setSecImagem]  = useState(false)
  const [secLegenda, setSecLegenda] = useState(false)
  const [secTextoTab, setSecTextoTab] = useState<'titulo' | 'corpo'>('titulo')
  const [secTemplate, setSecTemplate] = useState(false)
  const [flashKey, setFlashKey] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [exportName, setExportName] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [generatingImages, setGeneratingImages] = useState(false)
  const [imageGenProgress, setImageGenProgress] = useState<string | null>(null)
  const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null)
  const [selectedEl, setSelectedEl] = useState<'titulo' | 'corpo' | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [avatarMode, setAvatarMode] = useState<'url' | 'upload'>('url')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const exportRefs = useRef<(HTMLDivElement | null)[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetSlideId = useRef<string>('')
  const afterImageFileInputRef = useRef<HTMLInputElement>(null)
  const afterImageTargetId = useRef<string>('')
  const avatarFileInputRef = useRef<HTMLInputElement>(null)
  const isDraggingTitle = useRef(false)
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 })
  const currentSlideIdRef = useRef<string | undefined>(undefined)

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Load profile avatar for badge default
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('avatar_url, instagram_handle, visual_kit').eq('user_id', user.id).single().then(({ data }) => {
        if (data?.avatar_url) setProfileAvatarDefault(data.avatar_url as string)
        if (data?.visual_kit) {
          const vk = data.visual_kit as Record<string, string>
          if (vk.cor) setProfileColor(vk.cor)
        }
      })
    })
  }, [])

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

  const handleTemplateChange = (t: CarouselTemplate) => {
    setSelectedTemplate(t)
    setFlashKey(k => k + 1)
    setSecImagem(false)
  }

  const applyProfileKit = async () => {
    const { data } = await supabase.from('profiles')
      .select('visual_kit').eq('user_id', user?.id).single()
    if (!data?.visual_kit) return
    const vk = data.visual_kit as Record<string, string>
    const updates = { text_color: vk.cor ?? '#C8FF00', font_family: vk.fonte ?? '"Bebas Neue", sans-serif' }
    await supabase.from('carousel_slides').update(updates).eq('carousel_id', carouselId)
    setSlides(p => p.map(s => ({ ...s, textColor: vk.cor ?? '#C8FF00', fontFamily: vk.fonte ?? '"Bebas Neue", sans-serif' })))
    toast.success('Kit visual aplicado em todos os slides')
  }

  const updateSlide = (id: string, field: 'titulo' | 'corpo' | 'beforeText' | 'afterText', value: string) =>
    setSlides((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s))

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
    setSaveStatus('saving')
    console.log('[saveFormatToDb] carouselId:', carouselId, 'updates:', Object.keys(dbUpdates))
    if (!carouselId || Object.keys(dbUpdates).length === 0) return
    const capturedSlideId = slideId
    const capturedUpdates = { ...dbUpdates }
    if (saveFormatTimeout.current) clearTimeout(saveFormatTimeout.current)
    saveFormatTimeout.current = setTimeout(async () => {
      if (capturedSlideId.startsWith('slide-')) {
        const position = Number(capturedSlideId.split('-').pop())
        if (isNaN(position)) return
        const { error } = await supabase.from('carousel_slides')
          .update(capturedUpdates).eq('carousel_id', carouselId).eq('position', position)
        if (error) { console.error('[save] position:', error.message); return }
      } else {
        const { error } = await supabase.from('carousel_slides')
          .update(capturedUpdates).eq('id', capturedSlideId)
        if (error) { console.error('[save] uuid:', error.message); return }
      }
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 800)
  }

  // ── Mapeamento completo campo React → coluna DB ──────────────
  const SLIDE_TO_COL: Partial<Record<keyof Slide, string>> = {
    titleFontSize:        'font_size_title',
    bodyFontSize:         'font_size_body',
    fontWeightTitle:      'font_weight_title',
    fontFamily:           'font_family',
    textColor:            'text_color',
    textAlign:            'text_align',
    blockSpacing:         'block_spacing',
    paddingX:             'padding_x',
    textPosition:         'text_position',
    imageOpacity:         'image_opacity',
    overlayOpacity:       'overlay_opacity',
    bgZoom:               'bg_zoom',
    bgPositionX:          'bg_pos_x',
    bgPositionY:          'bg_pos_y',
    bgFilter:             'bg_filter',
    bgVisible:            'bg_visible',
    borderVignette:       'border_vignette',
    vignetteIntensity:    'vignette_intensity',
    titleItalic:          'title_italic',
    titleUppercase:       'title_uppercase',
    titleLetterSpacing:   'title_letter_spacing',
    titleLineHeight:      'title_line_height',
    titleBgEnabled:       'title_bg_enabled',
    titleBgColor:         'title_bg_color',
    titleShadow:          'title_shadow',
    titleShadowIntensity: 'title_shadow_intensity',
    bodyColor:            'body_color',
    bodyFontFamily:       'body_font_family',
    bodyFontWeight:       'body_font_weight',
    bodyItalic:           'body_italic',
    bodyLineHeight:       'body_line_height',
    bodyLetterSpacing:    'body_letter_spacing',
    bodyBgEnabled:        'body_bg_enabled',
    bodyBgColor:          'body_bg_color',
    ctaText:              'cta_text',
    profileBadgeEnabled:   'profile_badge_enabled',
    profileHandle:         'profile_handle',
    profileAvatarUrl:      'profile_avatar_url',
    profileBadgePosition:  'profile_badge_position',
    profileBadgeSize:      'profile_badge_size',
    profileBadgeBg:        'profile_badge_bg',
    profileBadgeTextColor: 'profile_badge_text_color',
    afterImageUrl:        'after_image_url',
    highlightedWords:     'highlighted_words',
    accentColor:          'accent_color',
    bgPattern:            'bg_pattern',
    bgPatternOpacity:     'bg_pattern_opacity',
    bgSolidColor:         'bg_solid_color',
  }

  const buildDbPayload = (updates: Partial<Slide>): Record<string, unknown> => {
    const db: Record<string, unknown> = {}
    if (updates.titlePos !== undefined) {
      db.title_position_x = updates.titlePos.x
      db.title_position_y = updates.titlePos.y
    }
    for (const [key, col] of Object.entries(SLIDE_TO_COL) as [keyof Slide, string][]) {
      const val = (updates as Record<string, unknown>)[key]
      if (val !== undefined) db[col] = val
    }
    return db
  }

  const updateSlideFormat = (id: string, updates: Partial<Slide>) => {
    setSlides((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } : s))
    const db = buildDbPayload(updates)
    if (Object.keys(db).length > 0) saveFormatToDb(id, db)
  }

  const updateImageOpacity = (id: string, val: number) =>
    setSlides((prev) => prev.map((s) => s.id === id ? { ...s, imageOpacity: val } : s))

  const updateBgZoom = (id: string, val: number) =>
    setSlides((prev) => prev.map((s) => s.id === id ? { ...s, bgZoom: val } : s))

  const updateBgPositionX = (id: string, val: number) =>
    setSlides((prev) => prev.map((s) => s.id === id ? { ...s, bgPositionX: val } : s))

  const updateBgPositionY = (id: string, val: number) =>
    setSlides((prev) => prev.map((s) => s.id === id ? { ...s, bgPositionY: val } : s))

  const updateBgFilter = (id: string, val: string) =>
    setSlides((prev) => prev.map((s) => s.id === id ? { ...s, bgFilter: val } : s))

  const updateOverlayOpacity = (id: string, val: number) =>
    setSlides((prev) => prev.map((s) => s.id === id ? { ...s, overlayOpacity: val } : s))

  const updateBgVisible = (id: string, val: boolean) =>
    setSlides(p => p.map(s => s.id === id ? { ...s, bgVisible: val } : s))

  const updateVignette = (id: string, val: boolean) =>
    setSlides(p => p.map(s => s.id === id ? { ...s, borderVignette: val } : s))

  const updateVignetteIntensity = (id: string, val: number) =>
    setSlides(p => p.map(s => s.id === id ? { ...s, vignetteIntensity: val } : s))

  const updateTitleStyle = (id: string, updates: Partial<Slide>) => {
    setSlides(p => p.map(s => s.id === id ? { ...s, ...updates } : s))
    const db = buildDbPayload(updates)
    if (Object.keys(db).length > 0) saveFormatToDb(id, db)
  }

  const resetBgPosition = (id: string) =>
    setSlides(p => p.map(s => s.id === id ? { ...s, bgZoom: 100, bgPositionX: 50, bgPositionY: 50 } : s))

  const applyBadgeToAll = (updates: Partial<Pick<Slide, 'profileBadgeEnabled' | 'profileHandle' | 'profileAvatarUrl' | 'profileBadgePosition'>>) =>
    setSlides(p => p.map(s => ({ ...s, ...updates })))

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const uid = session?.user?.id ?? 'anon'
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `avatars/${uid}_avatar.${ext}`
      const { error } = await supabase.storage.from('carousel-images').upload(path, file, { upsert: true, contentType: file.type })
      if (error) { toast.error('Erro ao enviar avatar'); return }
      const { data: { publicUrl } } = supabase.storage.from('carousel-images').getPublicUrl(path)
      if (current) updateTitleStyle(current.id, { profileAvatarUrl: publicUrl })
    } catch { toast.error('Erro ao enviar avatar') }
    finally { setUploadingAvatar(false) }
  }

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

  const handleUploadAfterImage = async (slideId: string, file: File) => {
    if (!carouselId) return
    setUploadingSlideId(slideId)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${carouselId}/${slideId}_after.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('carousel-images')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) { toast.error('Erro ao fazer upload.'); return }
      const { data: { publicUrl } } = supabase.storage.from('carousel-images').getPublicUrl(path)
      setSlides((prev) => prev.map((s) => s.id === slideId ? { ...s, afterImageUrl: publicUrl } : s))
      toast.success('Imagem inferior atualizada')
    } catch { toast.error('Erro ao fazer upload.') }
    finally { setUploadingSlideId(null) }
  }

  const removeSlide = (id: string) => {
    const next = slides.filter((s) => s.id !== id)
    setSlides(next)
    if (activeSlide >= next.length) setActiveSlide(Math.max(0, next.length - 1))
  }


  const addSlide = () => {
    const newSlide: Slide = {
      id: String(Date.now()), titulo: 'NOVO SLIDE', corpo: 'Edite este texto.', hack: '',
      titleFontSize: 80, bodyFontSize: 28,
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

  // close template section when element is selected
  useEffect(() => {
    if (selectedEl) {
      setSecTemplate(false)
    }
  }, [selectedEl])

  // auto-save slides_json com debounce 2s
  // slideStyle replaced by getSlideContainerStyle in the motion.div below

  const handleManualSave = async () => {
    if (!carouselId) return
    setSaveStatus('saving')
    for (const slide of slides) {
      const db = buildDbPayload(slide)
      if (Object.keys(db).length > 0) {
        if (slide.id.startsWith('slide-')) {
          const position = Number(slide.id.split('-').pop())
          await supabase.from('carousel_slides').update(db).eq('carousel_id', carouselId).eq('position', position)
        } else {
          await supabase.from('carousel_slides').update(db).eq('id', slide.id)
        }
      }
    }
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

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
          width: 1080,
          height: 1350,
          pixelRatio: 2,
          quality: 0.95,
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
      const finalName = exportName.trim() || `carousel_${new Date().toISOString().slice(0, 10)}`
      a.download = `${finalName}.zip`
      a.click()
      URL.revokeObjectURL(url)
      setExportName('')

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

  const handleExportSingle = async (index: number) => {
    if (!canExport) { setShowUpgrade(true); return }
    const el = exportRefs.current[index]
    if (!el) return
    const toastId = toast.loading(`Exportando slide ${index + 1}...`)
    try {
      const dataUrl = await toPng(el, {
        width: 1080,
        height: 1350,
        pixelRatio: 2,
        quality: 0.95,
        cacheBust: true,
        style: { display: 'flex' },
      })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `slide-${String(index + 1).padStart(2, '0')}.png`
      a.click()
      toast.success(`Slide ${index + 1} baixado`, { id: toastId })
    } catch (err) {
      console.error('Export single error:', err)
      toast.error('Erro ao exportar slide', { id: toastId })
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
            ...getSlideContainerStyle(slide, i, slides.length, selectedTemplate, imageStyle, 1),
          }}
        >
          <SlideRenderer
            slide={slide}
            index={i}
            total={slides.length}
            template={selectedTemplate}
            imageStyle={imageStyle}
            scale={1}
            hasWatermark={hasWatermark}
          />
        </div>
      ))}
    </div>
  )

  const isComparacaoMiddle = selectedTemplate === 'comparacao' && activeSlide !== 0 && activeSlide !== slides.length - 1
  const isSplitVisualMiddle = selectedTemplate === 'split_visual' && activeSlide !== 0 && activeSlide !== slides.length - 1

  return (
    <>
      {exportContainer}
      {showUpgrade && <UpgradeModal plan={plan} onClose={() => setShowUpgrade(false)} />}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file && uploadTargetSlideId.current) handleUploadImage(uploadTargetSlideId.current, file)
          e.target.value = ''
        }}
      />
      <input
        ref={afterImageFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file && afterImageTargetId.current) handleUploadAfterImage(afterImageTargetId.current, file)
          e.target.value = ''
        }}
      />

    <motion.div
      key="preview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ width: '100%', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {/* ── Main editor row ── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>

        {/* ── Mobile backdrop ── */}
        {isMobile && drawerOpen && (
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 99,
              backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
            }}
          />
        )}

        {/* ── LEFT SIDEBAR 300px ── */}
        <div style={{
          width: 300, flexShrink: 0, height: '100%',
          display: 'flex', flexDirection: 'column',
          borderRight: `1px solid ${B}`,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: `rgba(200,255,0,0.3) transparent`,
          ...(isMobile ? {
            position: 'fixed', left: 0, top: 56, zIndex: 100,
            height: 'calc(100vh - 56px)',
            transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.25s ease-out',
            backgroundColor: BG,
          } : {}),
        }}>

          {/* ─ Section 1: SLIDES ─ */}
          <div style={{ borderBottom: `1px solid ${B}` }}>
            <div style={{
              padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 11, color: A, letterSpacing: 1 }}>
                SLIDES — {slides.length}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {saveStatus === 'saving' && <span style={{ fontSize: 11, color: M, fontFamily: ff }}>Salvando...</span>}
                {saveStatus === 'saved' && <span style={{ fontSize: 11, color: '#C8FF00', fontFamily: ff }}>✓ Salvo</span>}
                <button
                  onClick={handleManualSave}
                  style={{
                    background: 'none', border: `1px solid ${B}`, borderRadius: 5,
                    color: M, fontFamily: ff, fontSize: 10, cursor: 'pointer', padding: '3px 8px',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = T }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = B; e.currentTarget.style.color = M }}
                >
                  Salvar
                </button>
              </div>
            </div>

            {/* Toggle Escuro/Claro */}
            <div style={{ display: 'flex', gap: 4, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {(['dark', 'light'] as const).map((theme) => {
                const sel = slideTheme === theme
                return (
                  <button key={theme} onClick={() => {
                    setSlideTheme(theme)
                    const newColor = theme === 'dark' ? '#F5F5F5' : '#000000'
                    const newBg = theme === 'dark' ? undefined : '#FFFFFF'
                    slides.forEach(s => updateSlideFormat(s.id, { textColor: newColor, bgSolidColor: newBg }))
                  }} style={{
                    flex: 1, height: 30, borderRadius: 6, fontSize: 12, fontFamily: 'DM Sans, sans-serif',
                    background: sel ? (theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)') : 'transparent',
                    border: `1px solid ${sel ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    color: sel ? (theme === 'dark' ? '#F5F5F5' : '#000') : 'rgba(255,255,255,0.45)',
                    cursor: 'pointer',
                  }}>
                    {theme === 'dark' ? '☾ Escuro' : '☀ Claro'}
                  </button>
                )
              })}
            </div>

            {/* Horizontal thumbnails */}
            <div style={{
              display: 'flex', gap: 8, overflowX: 'auto', padding: '0 12px 12px',
              scrollbarWidth: 'none',
            }}>
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
                      width: 56, height: 70, flexShrink: 0,
                      background: dragOverId === slide.id
                        ? 'rgba(200,255,0,0.08)'
                        : (TEMPLATE_GRADIENTS[selectedTemplate] ?? '#0a0a0a'),
                      border: `1.5px solid ${isActive ? A : dragOverId === slide.id ? 'rgba(200,255,0,0.5)' : B}`,
                      borderRadius: 6, cursor: 'grab', position: 'relative',
                      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                      paddingBottom: 4,
                      opacity: dragId === slide.id ? 0.35 : 1,
                      transition: 'border-color 0.15s, opacity 0.15s',
                      ...(slide.bgImageUrl ? {
                        backgroundImage: `url("${slide.bgImageUrl}")`,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                      } : {}),
                    }}
                  >
                    <span style={{
                      fontFamily: '"Bebas Neue", sans-serif', fontSize: 9, letterSpacing: 0.5,
                      color: isActive ? A : 'rgba(255,255,255,0.5)',
                      background: 'rgba(0,0,0,0.6)', borderRadius: 3, padding: '1px 4px',
                    }}>
                      {idx + 1}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Thumb action buttons */}
            <div style={{ display: 'flex', gap: 6, padding: '0 12px 12px' }}>
              <button onClick={addSlide} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                height: 30, background: 'transparent', border: `1px dashed ${B}`,
                borderRadius: 6, color: M, fontFamily: ff, fontSize: 11, cursor: 'pointer',
                transition: 'border-color 0.15s, color 0.15s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = T }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = B; e.currentTarget.style.color = M }}
              >
                <Plus size={11} /> Adicionar
              </button>
              {current && (
                <button onClick={() => duplicateSlide(current.id)} title="Duplicar" style={{
                  width: 30, height: 30, background: S2, border: `1px solid ${B}`,
                  borderRadius: 6, color: M, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = T }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = B; e.currentTarget.style.color = M }}
                >
                  <Copy size={12} />
                </button>
              )}
              {slides.length > 1 && current && (
                <button onClick={() => removeSlide(current.id)} title="Remover" style={{
                  width: 30, height: 30, background: 'none', border: `1px solid rgba(248,113,113,0.3)`,
                  borderRadius: 6, color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'border-color 0.15s',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f87171'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>

          {/* ─ Section 2: CONTEÚDO ─ */}
          {current && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 10, color: M, fontFamily: ff, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Conteúdo</span>
              {isComparacaoMiddle ? (
                <>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: '#ff7070', fontFamily: ff, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>ANTES</span>
                      <span style={{ fontSize: 10, color: M2, fontFamily: ff }}>{(current.beforeText ?? '').length}</span>
                    </div>
                    <textarea value={current.beforeText ?? ''}
                      onChange={(e) => updateSlide(current.id, 'beforeText', e.target.value)}
                      rows={3}
                      style={{ width: '100%', backgroundColor: S2, border: `1px solid rgba(255,112,112,0.3)`, borderRadius: 6, color: T, fontFamily: ff, fontSize: 12, lineHeight: 1.5, padding: '8px 10px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                      onFocus={(e) => { e.target.style.borderColor = '#ff7070' }}
                      onBlur={(e) => { e.target.style.borderColor = 'rgba(255,112,112,0.3)' }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: A, fontFamily: ff, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>DEPOIS</span>
                      <span style={{ fontSize: 10, color: M2, fontFamily: ff }}>{(current.afterText ?? '').length}</span>
                    </div>
                    <textarea value={current.afterText ?? ''}
                      onChange={(e) => updateSlide(current.id, 'afterText', e.target.value)}
                      rows={3}
                      style={{ width: '100%', backgroundColor: S2, border: `1px solid rgba(200,255,0,0.3)`, borderRadius: 6, color: T, fontFamily: ff, fontSize: 12, lineHeight: 1.5, padding: '8px 10px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                      onFocus={(e) => { e.target.style.borderColor = A }}
                      onBlur={(e) => { e.target.style.borderColor = 'rgba(200,255,0,0.3)' }}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Sub-tab bar: TITULO | CORPO */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
                    {(['titulo', 'corpo'] as const).map((tab) => {
                      const sel = secTextoTab === tab
                      const isTitulo = tab === 'titulo'
                      const activeColor = isTitulo ? '#C8FF00' : '#00B4D8'
                      return (
                        <button key={tab} onClick={() => { setSecTextoTab(tab); setSelectedEl(tab === 'titulo' ? 'titulo' : 'corpo') }} style={{
                          flex: 1, height: 36, borderRadius: 5, fontSize: 13, fontWeight: 700,
                          fontFamily: '"Bebas Neue", sans-serif', letterSpacing: 1,
                          backgroundColor: sel ? (isTitulo ? 'rgba(200,255,0,0.15)' : 'rgba(0,180,216,0.15)') : 'transparent',
                          border: 'none',
                          borderBottom: sel ? `2px solid ${activeColor}` : `2px solid transparent`,
                          color: sel ? activeColor : M,
                          cursor: 'pointer', textTransform: 'uppercase',
                          opacity: selectedEl === null ? 0.5 : 1,
                          transition: 'all 0.15s',
                        }}>
                          {tab === 'titulo' ? 'TÍTULO' : 'CORPO'}
                        </button>
                      )
                    })}
                  </div>

                  {/* TITULO tab */}
                  {secTextoTab === 'titulo' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: M, fontFamily: ff }}>Título</span>
                          <span style={{ fontSize: 10, color: M2, fontFamily: ff }}>{current.titulo.length}</span>
                        </div>
                        <textarea value={current.titulo}
                          onChange={(e) => { const val = e.target.value; updateSlide(current.id, 'titulo', val); saveFormatToDb(current.id, { titulo: val }) }}
                          rows={2}
                          style={{ width: '100%', backgroundColor: S2, border: `1px solid rgba(200,255,0,0.25)`, borderRadius: 6, color: T, fontFamily: '"Bebas Neue", sans-serif', fontSize: 13, letterSpacing: 0.5, lineHeight: 1.3, padding: '8px 10px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                          onFocus={(e) => { e.target.style.borderColor = A }}
                          onBlur={(e) => { e.target.style.borderColor = 'rgba(200,255,0,0.25)' }}
                        />
                      </div>
                      <p style={{ fontSize: 10, color: M, fontFamily: ff, margin: 0, lineHeight: 1.5 }}>
                        Use <span style={{ color: A }}>*palavra*</span> para colorir o acento no template Editorial Foto
                      </p>
                    </div>
                  )}

                  {/* CORPO tab */}
                  {secTextoTab === 'corpo' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: M, fontFamily: ff }}>Corpo</span>
                          <span style={{ fontSize: 10, color: M2, fontFamily: ff }}>{current.corpo.length}</span>
                        </div>
                        <textarea value={current.corpo}
                          onChange={(e) => { const val = e.target.value; updateSlide(current.id, 'corpo', val); saveFormatToDb(current.id, { corpo: val }) }}
                          rows={3}
                          placeholder="Digite o texto. Use Enter para nova linha."
                          style={{ width: '100%', backgroundColor: S2, border: `1px solid ${B}`, borderRadius: 6, color: 'rgba(255,255,255,0.7)', fontFamily: ff, fontSize: 12, lineHeight: 1.6, padding: '8px 10px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', transition: 'border-color 0.2s', whiteSpace: 'pre-wrap' }}
                          onFocus={(e) => { e.target.style.borderColor = 'rgba(200,255,0,0.25)' }}
                          onBlur={(e) => { e.target.style.borderColor = B }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Gerar conteúdo deste slide com IA */}
                  {current && carouselId && (
                    <button
                      onClick={async () => {
                        if (!current) return
                        const toastId = toast.loading('Gerando conteúdo para o slide...')
                        try {
                          const res = await supabase.functions.invoke('generate-carousel', {
                            body: {
                              tema: `Reescreva apenas o slide ${activeSlide + 1} do carrossel sobre: "${slides[0]?.titulo ?? ''}"`,
                              tom: 'Provocador',
                              num_slides: 1,
                              cta_tipo: 'Engajamento',
                            }
                          })
                          if (res.data?.slides?.[0]) {
                            const s = res.data.slides[0]
                            updateSlide(current.id, 'titulo', s.titulo)
                            updateSlide(current.id, 'corpo', s.corpo)
                            saveFormatToDb(current.id, { titulo: s.titulo, corpo: s.corpo })
                            toast.success('Slide atualizado', { id: toastId })
                          }
                        } catch { toast.error('Erro ao gerar', { id: toastId }) }
                      }}
                      style={{
                        height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: 'none', border: '1px solid rgba(200,255,0,0.25)', borderRadius: 7,
                        color: '#C8FF00', fontFamily: ff, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,255,0,0.07)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      ✦ Gerar conteúdo deste slide com IA
                    </button>
                  )}

                  {/* Refinar slide com IA */}
                  {current && carouselId && (
                    <RefinarSlide
                      current={current}
                      onRefinar={async (instrucao) => {
                        const toastId = toast.loading('Refinando...')
                        try {
                          const res = await supabase.functions.invoke('generate-carousel', {
                            body: {
                              tema: `Reescreva o slide com base nessa instrução: "${instrucao}". Contexto atual: Título: "${current.titulo}" | Corpo: "${current.corpo}"`,
                              tom: 'Provocador',
                              num_slides: 1,
                              cta_tipo: 'Engajamento',
                            }
                          })
                          if (res.data?.slides?.[0]) {
                            const s = res.data.slides[0]
                            updateSlide(current.id, 'titulo', s.titulo)
                            updateSlide(current.id, 'corpo', s.corpo)
                            saveFormatToDb(current.id, { titulo: s.titulo, corpo: s.corpo })
                            toast.success('Slide refinado', { id: toastId })
                          }
                        } catch { toast.error('Erro ao refinar', { id: toastId }) }
                      }}
                    />
                  )}

                  {/* CTA text — only on last slide */}
                  {activeSlide === slides.length - 1 && (
                    <div>
                      <span style={{ fontSize: 10, color: A, fontFamily: ff, fontWeight: 700, letterSpacing: 0.5, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Texto do CTA</span>
                      <input type="text"
                        value={current.ctaText ?? ''}
                        onChange={(e) => updateTitleStyle(current.id, { ctaText: e.target.value })}
                        placeholder="Salve para não perder"
                        style={{ width: '100%', backgroundColor: S2, border: `1px solid rgba(200,255,0,0.25)`, borderRadius: 6, color: T, fontFamily: ff, fontSize: 12, padding: '6px 8px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                        onFocus={(e) => { e.target.style.borderColor = A }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(200,255,0,0.25)' }}
                      />
                    </div>
                  )}

                </>
              )}
            </div>
          )}

          {/* ─ Section 3: IMAGEM DE FUNDO ─ */}
          {current && (
            <CollapsibleSection title="IMAGEM DE FUNDO" isOpen={secImagem} onToggle={() => setSecImagem(v => !v)}>
              {/* Toggle Exibir imagem */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: M, fontFamily: ff }}>Exibir imagem</span>
                <button
                  onClick={() => updateBgVisible(current.id, !(current.bgVisible !== false))}
                  style={{
                    width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                    backgroundColor: current.bgVisible !== false ? A : S2,
                    position: 'relative', transition: 'background-color 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 3, left: current.bgVisible !== false ? 18 : 3,
                    width: 14, height: 14, borderRadius: '50%',
                    backgroundColor: current.bgVisible !== false ? '#000' : M2,
                    transition: 'left 0.2s',
                  }} />
                </button>
              </div>

              {/* Zoom + Reset inline */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: M, fontFamily: ff }}>Zoom</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: A, fontFamily: ff, fontWeight: 700 }}>{current.bgZoom ?? 100}%</span>
                    {(current.bgZoom ?? 100) !== 100 && (
                      <button onClick={() => resetBgPosition(current.id)}
                        style={{ fontSize: 9, color: M, fontFamily: ff, background: 'none', border: `1px solid ${B}`, borderRadius: 4, padding: '1px 6px', cursor: 'pointer' }}>
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <input type="range" min={50} max={300} value={current.bgZoom ?? 100}
                  onChange={(e) => updateBgZoom(current.id, Number(e.target.value))}
                  style={{ width: '100%', accentColor: A, cursor: 'pointer' }} />
              </div>

              <SliderRow label="Posição vertical" value={current.bgPositionY ?? 50} min={0} max={100}
                onChange={(v) => updateBgPositionY(current.id, v)} />
              <SliderRow label="Posição horizontal" value={current.bgPositionX ?? 50} min={0} max={100}
                onChange={(v) => updateBgPositionX(current.id, v)} />
              <SliderRow label="Opacidade" value={current.imageOpacity ?? 100} min={10} max={100}
                onChange={(v) => updateImageOpacity(current.id, v)} suffix="%" />
              <SliderRow label="Escurecer" value={current.overlayOpacity ?? 55} min={0} max={90}
                onChange={(v) => updateOverlayOpacity(current.id, v)} suffix="%" />

              {/* Vinheta */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: current.borderVignette ? 8 : 0 }}>
                  <span style={{ fontSize: 10, color: M, fontFamily: ff }}>Vinheta nas bordas</span>
                  <button
                    onClick={() => updateVignette(current.id, !current.borderVignette)}
                    style={{
                      width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                      backgroundColor: current.borderVignette ? A : S2,
                      position: 'relative', transition: 'background-color 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 3, left: current.borderVignette ? 18 : 3,
                      width: 14, height: 14, borderRadius: '50%',
                      backgroundColor: current.borderVignette ? '#000' : M2,
                      transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
                {current.borderVignette && (
                  <SliderRow label="Intensidade" value={current.vignetteIntensity ?? 60} min={10} max={100}
                    onChange={(v) => updateVignetteIntensity(current.id, v)} />
                )}
              </div>

              {/* Padrão de fundo */}
              <div>
                <span style={{ fontSize: 10, color: M, fontFamily: ff, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Padrão de fundo</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {([
                    { key: 'none',           label: 'Nenhum'   },
                    { key: 'grid',           label: 'Grade'    },
                    { key: 'dots',           label: 'Bolinhas' },
                    { key: 'lines',          label: 'Linhas'   },
                    { key: 'diagonal',       label: 'Diagonal' },
                    { key: 'diagonal_cross', label: 'Xadrez'   },
                  ] as const).map(({ key, label }) => {
                    const active = (current.bgPattern ?? 'none') === key
                    return (
                      <button
                        key={key}
                        onClick={() => updateTitleStyle(current.id, { bgPattern: key })}
                        style={{
                          backgroundColor: active ? 'rgba(0,180,216,0.15)' : S2,
                          border: `1px solid ${active ? '#00B4D8' : B}`,
                          borderRadius: 6, color: active ? '#00B4D8' : M,
                          fontFamily: ff, fontSize: 11, padding: '6px 0',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
                {(current.bgPattern ?? 'none') !== 'none' && (
                  <div style={{ marginTop: 8 }}>
                    <SliderRow label="Opacidade" value={current.bgPatternOpacity ?? 20} min={5} max={60}
                      onChange={(v) => updateTitleStyle(current.id, { bgPatternOpacity: v })} />
                  </div>
                )}
                <div style={{ marginTop: 12 }}>
                  <span style={{ fontSize: 9, color: M, fontFamily: ff, display: 'block', marginBottom: 6 }}>COR DE FUNDO SÓLIDA</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="color"
                      value={current.bgSolidColor ?? '#080808'}
                      onChange={(e) => updateSlideFormat(current.id, { bgSolidColor: e.target.value })}
                      style={{ width: 32, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', backgroundColor: 'transparent' }}
                    />
                    <span style={{ fontSize: 11, color: M, fontFamily: ff }}>{current.bgSolidColor ?? 'Nenhuma'}</span>
                    {current.bgSolidColor && (
                      <button onClick={() => updateSlideFormat(current.id, { bgSolidColor: undefined })}
                        style={{ fontSize: 10, color: M, fontFamily: ff, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Efeito visual */}
              <div>
                <span style={{ fontSize: 10, color: M, fontFamily: ff, display: 'block', marginBottom: 6 }}>Efeito visual</span>
                <select
                  value={current.bgFilter ?? 'none'}
                  onChange={(e) => updateBgFilter(current.id, e.target.value)}
                  style={{
                    width: '100%', backgroundColor: S2, border: `1px solid ${B}`,
                    borderRadius: 6, color: T, fontFamily: ff, fontSize: 12,
                    padding: '6px 8px', outline: 'none', cursor: 'pointer',
                  }}
                >
                  {BG_FILTER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} style={{ backgroundColor: S2 }}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  onClick={() => { if (carouselId && current) { uploadTargetSlideId.current = current.id; fileInputRef.current?.click() } }}
                  style={{
                    height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: S2, border: `1px solid ${B}`, borderRadius: 8,
                    color: M, fontFamily: ff, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = T }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = B; e.currentTarget.style.color = M }}
                >
                  <Image size={12} /> Trocar imagem
                </button>
                {carouselId && (
                  <button
                    onClick={handleGenerateImages}
                    disabled={generatingImages}
                    style={{
                      height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: 'rgba(0,180,216,0.1)', border: `1px solid #00B4D8`, borderRadius: 8,
                      color: '#00B4D8', fontFamily: ff, fontSize: 12, fontWeight: 600,
                      cursor: generatingImages ? 'not-allowed' : 'pointer',
                      opacity: generatingImages ? 0.6 : 1, transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { if (!generatingImages) e.currentTarget.style.background = 'rgba(0,180,216,0.2)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,180,216,0.1)' }}
                  >
                    <Sparkles size={12} /> {imageGenProgress ?? 'Gerar com IA'}
                  </button>
                )}
                {current.bgImageUrl && (
                  <button
                    onClick={() => setSlides((prev) => prev.map((s) => s.id === current.id ? { ...s, bgImageUrl: undefined } : s))}
                    style={{
                      height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: 'none', border: `1px solid rgba(248,113,113,0.35)`, borderRadius: 7,
                      color: '#f87171', fontFamily: ff, fontSize: 12, cursor: 'pointer',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f87171'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(248,113,113,0.35)'}
                  >
                    <Trash2 size={12} /> Remover fundo
                  </button>
                )}
              </div>

              {/* afterImageUrl — split_visual middle slides only */}
              {isSplitVisualMiddle && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 10, color: M, fontFamily: ff, letterSpacing: 0.5 }}>Imagem inferior (DEPOIS)</span>
                  <button
                    onClick={() => { if (carouselId && current) { afterImageTargetId.current = current.id; afterImageFileInputRef.current?.click() } }}
                    style={{
                      height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: S2, border: `1px solid ${B}`, borderRadius: 7,
                      color: M, fontFamily: ff, fontSize: 12, cursor: 'pointer',
                      transition: 'border-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = T }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = B; e.currentTarget.style.color = M }}
                  >
                    <Image size={12} /> {current.afterImageUrl ? 'Trocar imagem inferior' : 'Upload imagem inferior'}
                  </button>
                  {current.afterImageUrl && (
                    <button
                      onClick={() => setSlides((prev) => prev.map((s) => s.id === current.id ? { ...s, afterImageUrl: undefined } : s))}
                      style={{
                        height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: 'none', border: `1px solid rgba(248,113,113,0.35)`, borderRadius: 7,
                        color: '#f87171', fontFamily: ff, fontSize: 12, cursor: 'pointer',
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f87171'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(248,113,113,0.35)'}
                    >
                      <Trash2 size={12} /> Remover imagem inferior
                    </button>
                  )}
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* ─ Section 4: ESTILO DO TEXTO ─ */}
          {current && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {selectedEl && (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: selectedEl === 'titulo' ? '#C8FF00' : '#00B4D8', display: 'inline-block', flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: 11, color: selectedEl ? (selectedEl === 'titulo' ? '#C8FF00' : '#00B4D8') : M, fontFamily: ff, fontWeight: 700, letterSpacing: 0.3 }}>
                    {selectedEl ? `✎ ${selectedEl === 'titulo' ? 'TÍTULO' : 'CORPO'}` : 'Selecione um elemento'}
                  </span>
                </div>
                {selectedEl && (
                  <button onClick={() => setSelectedEl(null)} style={{ background: 'none', border: 'none', color: M, cursor: 'pointer', display: 'flex', padding: 2 }}>
                    <X size={12} />
                  </button>
                )}
              </div>
              <div style={{ opacity: selectedEl ? 1 : 0.4, pointerEvents: selectedEl ? 'auto' : 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Pares de fonte — sistema MyPostFlow */}
                <div>
                  <span style={{ fontSize: 9, color: M, fontFamily: ff, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Par de fontes</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {([
                      { title: '"Bebas Neue", sans-serif', body: 'DM Sans, sans-serif', label: 'Bebas', sub: 'DM Sans' },
                      { title: '"Playfair Display", serif', body: 'DM Sans, sans-serif', label: 'Playfair', sub: 'DM Sans' },
                      { title: '"Space Grotesk", sans-serif', body: 'Inter, sans-serif', label: 'Space', sub: 'Inter' },
                      { title: 'Oswald, sans-serif', body: 'Inter, sans-serif', label: 'Oswald', sub: 'Inter' },
                      { title: '"Montserrat", sans-serif', body: 'DM Sans, sans-serif', label: 'Montserrat', sub: 'DM Sans' },
                      { title: 'Inter, sans-serif', body: 'Inter, sans-serif', label: 'Inter', sub: 'Inter' },
                    ] as const).map((pair) => {
                      const sel = current?.fontFamily === pair.title
                      return (
                        <button key={pair.title} onClick={() => {
                          if (!current) return
                          updateSlideFormat(current.id, { fontFamily: pair.title, bodyFontFamily: pair.body })
                        }} style={{
                          background: sel ? 'rgba(200,255,0,0.08)' : S2,
                          border: `1px solid ${sel ? 'rgba(200,255,0,0.4)' : B}`,
                          borderRadius: 6, padding: '7px 10px', cursor: 'pointer', textAlign: 'left',
                          transition: 'all 0.15s',
                        }}>
                          <span style={{ fontFamily: pair.title, fontSize: 13, color: sel ? A : T, display: 'block', lineHeight: 1.2, fontWeight: 700 }}>{pair.label}</span>
                          <span style={{ fontFamily: pair.body, fontSize: 10, color: M, display: 'block', lineHeight: 1.2, fontStyle: 'italic' }}>{pair.sub}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                {/* Row 1: Size */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                  <div style={{ width: 58 }}>
                    <span style={{ fontSize: 9, color: M, fontFamily: ff, display: 'block', marginBottom: 3 }}>Tam.</span>
                    <input type="number" min={10} max={160}
                      value={selectedEl === 'titulo' ? (current.titleFontSize ?? 80) : (current.bodyFontSize ?? 28)}
                      onChange={(e) => updateSlideFormat(current.id, selectedEl === 'titulo' ? { titleFontSize: Number(e.target.value) } : { bodyFontSize: Number(e.target.value) })}
                      style={{ width: '100%', backgroundColor: S2, border: `1px solid ${B}`, borderRadius: 6, color: T, fontFamily: ff, fontSize: 12, padding: '5px 4px', outline: 'none', textAlign: 'center', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                {/* Row 2: Weight + Italic + Align */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['normal', 'bold'] as const).map((w) => {
                    const isActive = (selectedEl === 'corpo' ? (current.bodyFontWeight ?? 'normal') : (current.fontWeightTitle ?? 'normal')) === w
                    return (
                      <button key={w} onClick={() => updateSlideFormat(current.id, selectedEl === 'corpo' ? { bodyFontWeight: w } : { fontWeightTitle: w })} style={{
                        flex: 1, height: 28, borderRadius: 5, fontSize: 11, fontFamily: ff, fontWeight: w === 'bold' ? 700 : 400,
                        backgroundColor: isActive ? 'rgba(200,255,0,0.1)' : 'transparent',
                        border: `1px solid ${isActive ? 'rgba(200,255,0,0.4)' : B}`,
                        color: isActive ? A : M, cursor: 'pointer',
                      }}>{w === 'normal' ? 'Normal' : 'Negrito'}</button>
                    )
                  })}
                  <button
                    onClick={() => updateSlideFormat(current.id, selectedEl === 'corpo' ? { bodyItalic: !current.bodyItalic } : { titleItalic: !current.titleItalic })}
                    style={{
                      width: 28, height: 28, borderRadius: 5, fontSize: 13,
                      backgroundColor: (selectedEl === 'corpo' ? current.bodyItalic : current.titleItalic) ? 'rgba(200,255,0,0.1)' : 'transparent',
                      border: `1px solid ${(selectedEl === 'corpo' ? current.bodyItalic : current.titleItalic) ? 'rgba(200,255,0,0.4)' : B}`,
                      color: (selectedEl === 'corpo' ? current.bodyItalic : current.titleItalic) ? A : M,
                      cursor: 'pointer', fontStyle: 'italic', fontFamily: 'serif',
                    }}>I</button>
                  <div style={{ width: 1, backgroundColor: B, margin: '4px 0', flexShrink: 0 }} />
                  {(['left', 'center', 'right'] as const).map((a) => {
                    const labels = { left: '←', center: '≡', right: '→' }
                    const isActive = (current.textAlign ?? 'left') === a
                    return (
                      <button key={a} onClick={() => updateSlideFormat(current.id, { textAlign: a })} style={{
                        flex: 1, height: 28, borderRadius: 5, fontSize: 13, fontFamily: ff,
                        backgroundColor: isActive ? 'rgba(200,255,0,0.1)' : 'transparent',
                        border: `1px solid ${isActive ? 'rgba(200,255,0,0.4)' : B}`,
                        color: isActive ? A : M, cursor: 'pointer',
                      }}>{labels[a]}</button>
                    )
                  })}
                </div>
                {/* Row 3: Color palette */}
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                  {(() => {
                    const handleColorChange = (c: string) => {
                      if (selectedEl === 'corpo') {
                        updateTitleStyle(current.id, { bodyColor: c })
                      } else {
                        updateSlideFormat(current.id, { textColor: c })
                      }
                    }
                    const activeColor = selectedEl === 'corpo' ? (current.bodyColor ?? 'rgba(255,255,255,0.7)') : (current.textColor ?? '#F5F5F5')
                    return (
                      <>
                        {TEXT_COLORS.map((c) => (
                          <button key={c} onClick={() => handleColorChange(c)}
                            style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: c, border: 'none', cursor: 'pointer', flexShrink: 0, outline: activeColor === c ? `2px solid ${A}` : '2px solid transparent', outlineOffset: 2 }} />
                        ))}
                        <input type="color" value={selectedEl === 'corpo' ? (current.bodyColor ?? '#F5F5F5') : (current.textColor ?? '#F5F5F5')}
                          onChange={(e) => handleColorChange(e.target.value)}
                          style={{ width: 22, height: 22, borderRadius: '50%', border: `1px solid ${B}`, cursor: 'pointer', flexShrink: 0, padding: 0, backgroundColor: 'transparent' }} />
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ─ Section 5: DESTAQUE DE PALAVRAS ─ */}
          {current && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 10, color: M, fontFamily: ff, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Destaque de palavras</span>
              {(() => {
                const allText = (current.titulo ?? '') + ' ' + (current.corpo ?? '')
                const chips = [...new Set(
                  allText.split(/\s+/)
                    .map(w => w.replace(/[.,!?;:"""''«»\-]/g, '').toUpperCase())
                    .filter(w => w.length >= 3)
                )]
                const highlighted: string[] = Array.isArray(current.highlightedWords)
                  ? current.highlightedWords
                  : typeof current.highlightedWords === 'string' && (current.highlightedWords as unknown as string).trim()
                  ? (() => { try { return JSON.parse(current.highlightedWords as unknown as string) } catch { return [] } })()
                  : []
                const accentClr = current.accentColor ?? '#C8FF00'
                if (chips.length === 0) return (
                  <p style={{ fontSize: 11, color: M, fontFamily: ff, margin: 0 }}>Adicione texto para destacar palavras</p>
                )
                return (
                  <>
                    {highlighted.length === 0 && (
                      <p style={{ fontSize: 10, color: M, fontFamily: ff, margin: '0 0 4px', lineHeight: 1.5 }}>
                        ↑ Clique nas palavras do slide para destacar
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {chips.map((w) => {
                        const isActive = highlighted.includes(w)
                        return (
                          <button key={w} onClick={() => {
                            const newH = isActive ? highlighted.filter(h => h !== w) : [...highlighted, w]
                            updateTitleStyle(current.id, { highlightedWords: newH, accentColor: current.accentColor ?? '#C8FF00' })
                          }} style={{
                            padding: '3px 9px', borderRadius: 20, border: 'none', cursor: 'pointer',
                            fontFamily: ff, fontSize: 10, fontWeight: isActive ? 700 : 400,
                            background: isActive ? accentClr : 'rgba(255,255,255,0.07)',
                            color: isActive ? '#000' : 'rgba(255,255,255,0.65)',
                            transition: 'all 0.15s',
                          }}>{w}</button>
                        )
                      })}
                    </div>
                    {highlighted.length > 0 && (
                      <>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
                          {['#C8FF00','#FFD700','#FF4444','#A855F7','#10B981','#FF8C00','#FF69B4','#00B4D8','#F5F5F5','#000000'].map((c) => (
                            <div key={c} onClick={() => updateTitleStyle(current.id, { accentColor: c })} style={{
                              width: 20, height: 20, borderRadius: 5, backgroundColor: c, cursor: 'pointer', flexShrink: 0,
                              border: accentClr === c ? '2px solid #fff' : '2px solid transparent',
                              transition: 'border-color 0.15s',
                            }} />
                          ))}
                          <input type="color" value={accentClr}
                            onChange={(e) => updateTitleStyle(current.id, { accentColor: e.target.value })}
                            style={{ width: 20, height: 20, borderRadius: 5, border: 'none', cursor: 'pointer', padding: 0, backgroundColor: 'transparent', flexShrink: 0 }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                          <button onClick={() => {
                            if (activeSlide < slides.length - 1) {
                              const nextId = slides[activeSlide + 1].id
                              updateTitleStyle(nextId, { accentColor: current.accentColor, highlightedWords: current.highlightedWords })
                            }
                          }} style={{ fontSize: 10, color: A, fontFamily: ff, background: 'none', border: `1px solid rgba(200,255,0,0.25)`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>
                            Aplicar no próximo slide
                          </button>
                          <button onClick={() => updateTitleStyle(current.id, { highlightedWords: [] })}
                            style={{ fontSize: 10, color: '#f87171', fontFamily: ff, background: 'none', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>
                            Limpar
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )
              })()}
            </div>
          )}

          {/* ─ Section 6: BADGE DE PERFIL ─ */}
          {current && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: current.profileBadgeEnabled ? A : M, fontFamily: ff, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>@ Badge de perfil</span>
                <button
                  onClick={() => {
                    const enabling = !current.profileBadgeEnabled
                    const updates: Partial<Slide> = { profileBadgeEnabled: enabling }
                    if (enabling && !current.profileAvatarUrl && profileAvatarDefault) {
                      updates.profileAvatarUrl = profileAvatarDefault
                    }
                    updateTitleStyle(current.id, updates)
                  }}
                  style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', backgroundColor: current.profileBadgeEnabled ? A : S2, position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: 3, left: current.profileBadgeEnabled ? 18 : 3, width: 14, height: 14, borderRadius: '50%', backgroundColor: current.profileBadgeEnabled ? '#000' : M2, transition: 'left 0.2s' }} />
                </button>
              </div>
              {current.profileBadgeEnabled && (
                <>
                  <div>
                    <span style={{ fontSize: 10, color: M, fontFamily: ff, display: 'block', marginBottom: 4 }}>@handle</span>
                    <input type="text" value={current.profileHandle ?? ''}
                      onChange={(e) => updateTitleStyle(current.id, { profileHandle: e.target.value })}
                      placeholder="@seu.perfil"
                      style={{ width: '100%', backgroundColor: S2, border: `1px solid ${B}`, borderRadius: 6, color: T, fontFamily: ff, fontSize: 12, padding: '6px 8px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                      onFocus={(e) => { e.target.style.borderColor = 'rgba(200,255,0,0.4)' }}
                      onBlur={(e) => { e.target.style.borderColor = B }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: M, fontFamily: ff }}>Foto do perfil</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(['url', 'upload'] as const).map(mode => (
                          <button key={mode} onClick={() => setAvatarMode(mode)} style={{
                            height: 20, padding: '0 8px', borderRadius: 4, fontSize: 9, fontFamily: ff, fontWeight: 700,
                            backgroundColor: avatarMode === mode ? 'rgba(200,255,0,0.1)' : 'transparent',
                            border: `1px solid ${avatarMode === mode ? 'rgba(200,255,0,0.4)' : B}`,
                            color: avatarMode === mode ? A : M, cursor: 'pointer',
                          }}>{mode === 'url' ? 'URL' : 'Upload'}</button>
                        ))}
                      </div>
                    </div>
                    {avatarMode === 'url' ? (
                      <input type="text" value={current.profileAvatarUrl ?? ''}
                        onChange={(e) => updateTitleStyle(current.id, { profileAvatarUrl: e.target.value })}
                        placeholder="https://..."
                        style={{ width: '100%', backgroundColor: S2, border: `1px solid ${B}`, borderRadius: 6, color: T, fontFamily: ff, fontSize: 12, padding: '6px 8px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                        onFocus={(e) => { e.target.style.borderColor = 'rgba(200,255,0,0.4)' }}
                        onBlur={(e) => { e.target.style.borderColor = B }}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input ref={avatarFileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = '' }} />
                        {current.profileAvatarUrl ? (
                          <img src={current.profileAvatarUrl} alt="avatar"
                            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `1px solid ${B}` }} />
                        ) : (
                          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: S2, border: `1px dashed ${B}`, flexShrink: 0 }} />
                        )}
                        <button onClick={() => avatarFileInputRef.current?.click()} disabled={uploadingAvatar}
                          style={{ flex: 1, height: 30, backgroundColor: S2, border: `1px solid ${B}`, borderRadius: 6, color: uploadingAvatar ? M2 : M, fontFamily: ff, fontSize: 11, cursor: uploadingAvatar ? 'not-allowed' : 'pointer' }}>
                          {uploadingAvatar ? 'Enviando...' : 'Escolher foto'}
                        </button>
                        {current.profileAvatarUrl && (
                          <button onClick={() => updateTitleStyle(current.id, { profileAvatarUrl: '' })}
                            style={{ width: 28, height: 28, background: 'none', border: `1px solid rgba(248,113,113,0.3)`, borderRadius: 6, color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <X size={11} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: M, fontFamily: ff, display: 'block', marginBottom: 4 }}>Posição</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((pos) => {
                        const labels: Record<string, string> = { 'top-left': '↖ Sup esq', 'top-right': '↗ Sup dir', 'bottom-left': '↙ Inf esq', 'bottom-right': '↘ Inf dir' }
                        const sel = (current.profileBadgePosition ?? 'bottom-left') === pos
                        return (
                          <button key={pos} onClick={() => updateTitleStyle(current.id, { profileBadgePosition: pos })}
                            style={{ height: 26, borderRadius: 5, fontSize: 9, fontFamily: ff, backgroundColor: sel ? 'rgba(200,255,0,0.1)' : 'transparent', border: `1px solid ${sel ? 'rgba(200,255,0,0.4)' : B}`, color: sel ? A : M, cursor: 'pointer' }}>
                            {labels[pos]}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  {/* Tamanho do badge */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: M, fontFamily: ff }}>Tamanho</span>
                      <span style={{ fontSize: 10, color: A, fontFamily: ff, fontWeight: 700 }}>{current.profileBadgeSize ?? 32}px</span>
                    </div>
                    <input type="range" min={16} max={48} value={current.profileBadgeSize ?? 32}
                      onChange={(e) => updateTitleStyle(current.id, { profileBadgeSize: Number(e.target.value) })}
                      style={{ width: '100%', accentColor: A, cursor: 'pointer' }} />
                  </div>
                  {/* Cor do fundo do badge */}
                  <div>
                    <span style={{ fontSize: 10, color: M, fontFamily: ff, display: 'block', marginBottom: 6 }}>Fundo do badge</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {['transparent', '#000000', '#ffffff', '#C8FF00', '#00B4D8', '#FF4444', '#FFD700', '#FF69B4'].map((c) => {
                        const sel = (current.profileBadgeBg ?? 'transparent') === c
                        return (
                          <div key={c} onClick={() => updateTitleStyle(current.id, { profileBadgeBg: c })} style={{
                            width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
                            backgroundColor: c === 'transparent' ? 'transparent' : c,
                            border: sel ? '2px solid #fff' : `2px solid ${c === 'transparent' ? 'rgba(255,255,255,0.3)' : 'transparent'}`,
                            backgroundImage: c === 'transparent' ? 'repeating-conic-gradient(rgba(255,255,255,0.15) 0% 25%, transparent 0% 50%)' : 'none',
                            backgroundSize: c === 'transparent' ? '8px 8px' : 'auto',
                            transition: 'border-color 0.15s',
                          }} />
                        )
                      })}
                    </div>
                  </div>
                  {/* Cor do texto do handle */}
                  <div>
                    <span style={{ fontSize: 10, color: M, fontFamily: ff, display: 'block', marginBottom: 6 }}>Cor do texto</span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {(['#ffffff', '#000000', '#C8FF00', 'rgba(255,255,255,0.5)'] as const).map((c) => {
                        const sel = (current.profileBadgeTextColor ?? '#ffffff') === c
                        return (
                          <div key={c} onClick={() => updateTitleStyle(current.id, { profileBadgeTextColor: c })} style={{
                            width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
                            backgroundColor: c,
                            border: sel ? '2px solid #fff' : '2px solid transparent',
                            outline: sel ? `1px solid rgba(255,255,255,0.4)` : 'none',
                            outlineOffset: 2,
                            transition: 'border-color 0.15s',
                          }} />
                        )
                      })}
                    </div>
                  </div>
                  <button onClick={() => applyBadgeToAll({ profileBadgeEnabled: true, profileHandle: current.profileHandle, profileAvatarUrl: current.profileAvatarUrl, profileBadgePosition: current.profileBadgePosition })}
                    style={{ height: 28, background: 'rgba(200,255,0,0.08)', border: `1px solid rgba(200,255,0,0.25)`, borderRadius: 6, color: A, fontFamily: ff, fontSize: 10, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.3 }}>
                    Aplicar em todos os slides
                  </button>
                </>
              )}
            </div>
          )}

          {/* ─ Section 7: KIT VISUAL ─ */}
          {current && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 10, color: A, fontFamily: ff, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Kit visual do perfil</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {profileColor && (
                  <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: profileColor, border: `1px solid rgba(255,255,255,0.2)`, flexShrink: 0 }} />
                )}
                <button onClick={applyProfileKit} style={{
                  flex: 1, height: 36, background: 'rgba(200,255,0,0.08)', border: `1px solid rgba(200,255,0,0.25)`,
                  borderRadius: 8, color: A, fontFamily: ff, fontSize: 12, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.3,
                }}>
                  Aplicar kit em todos os slides
                </button>
              </div>
            </div>
          )}

          {/* ─ Section 8: TEMPLATE ─ */}
          <CollapsibleSection title="TEMPLATE" isOpen={secTemplate} onToggle={() => setSecTemplate(v => !v)}>
            {(() => {
              const TEMPLATE_SVG: Record<string, React.ReactElement> = {
                impacto: <svg viewBox="0 0 54 67" style={{width:'100%',height:'100%',opacity:0.7}}>
                  <rect width="54" height="67" fill="#060d14"/>
                  <rect x="4" y="42" width="46" height="8" rx="1" fill="rgba(255,255,255,0.7)"/>
                  <rect x="4" y="54" width="30" height="3" rx="1" fill="rgba(255,255,255,0.3)"/>
                  <rect x="4" y="59" width="20" height="3" rx="1" fill="rgba(255,255,255,0.3)"/>
                </svg>,
                editorial: <svg viewBox="0 0 54 67" style={{width:'100%',height:'100%',opacity:0.7}}>
                  <rect width="54" height="67" fill="#0a0a0a"/>
                  <rect x="4" y="8" width="46" height="2" rx="1" fill="#C8FF00"/>
                  <rect x="4" y="16" width="38" height="6" rx="1" fill="rgba(255,255,255,0.7)"/>
                  <rect x="4" y="26" width="46" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
                  <rect x="4" y="32" width="40" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
                  <rect x="4" y="38" width="34" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
                </svg>,
                lista: <svg viewBox="0 0 54 67" style={{width:'100%',height:'100%',opacity:0.7}}>
                  <rect width="54" height="67" fill="#060d14"/>
                  <text x="4" y="28" fontSize="20" fill="#C8FF00" fontFamily="sans-serif" fontWeight="bold">01</text>
                  <rect x="4" y="34" width="36" height="4" rx="1" fill="rgba(255,255,255,0.6)"/>
                  <rect x="4" y="42" width="46" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
                  <rect x="4" y="48" width="40" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>
                </svg>,
                citacao: <svg viewBox="0 0 54 67" style={{width:'100%',height:'100%',opacity:0.7}}>
                  <rect width="54" height="67" fill="#0a0814"/>
                  <text x="4" y="26" fontSize="24" fill="#C8FF00" fontFamily="serif" opacity="0.4">"</text>
                  <rect x="8" y="28" width="38" height="3" rx="1" fill="rgba(255,255,255,0.6)"/>
                  <rect x="10" y="35" width="34" height="3" rx="1" fill="rgba(255,255,255,0.6)"/>
                  <rect x="14" y="42" width="26" height="3" rx="1" fill="rgba(255,255,255,0.6)"/>
                </svg>,
                comparacao: <svg viewBox="0 0 54 67" style={{width:'100%',height:'100%',opacity:0.7}}>
                  <rect width="54" height="67" fill="#0a0a0a"/>
                  <rect x="0" y="0" width="26" height="67" fill="rgba(255,80,80,0.1)"/>
                  <rect x="28" y="0" width="26" height="67" fill="rgba(200,255,0,0.1)"/>
                  <rect x="26" y="0" width="2" height="67" fill="rgba(255,255,255,0.2)"/>
                  <text x="4" y="14" fontSize="7" fill="#ff5050" fontFamily="sans-serif">ANTES</text>
                  <text x="30" y="14" fontSize="7" fill="#C8FF00" fontFamily="sans-serif">DEPOIS</text>
                  <rect x="4" y="20" width="18" height="2" rx="1" fill="rgba(255,255,255,0.3)"/>
                  <rect x="30" y="20" width="18" height="2" rx="1" fill="rgba(255,255,255,0.3)"/>
                </svg>,
                storytelling: <svg viewBox="0 0 54 67" style={{width:'100%',height:'100%',opacity:0.7}}>
                  <rect width="54" height="67" fill="#080614"/>
                  <rect x="4" y="28" width="46" height="2" rx="1" fill="rgba(255,255,255,0.4)"/>
                  <rect x="4" y="34" width="42" height="2" rx="1" fill="rgba(255,255,255,0.4)"/>
                  <rect x="4" y="40" width="38" height="2" rx="1" fill="rgba(255,255,255,0.4)"/>
                  <rect x="4" y="52" width="24" height="4" rx="1" fill="rgba(255,255,255,0.6)"/>
                </svg>,
                editorial_foto: <svg viewBox="0 0 54 67" style={{width:'100%',height:'100%',opacity:0.7}}>
                  <rect width="54" height="67" fill="#060d14"/>
                  <rect x="0" y="0" width="54" height="40" fill="rgba(255,255,255,0.08)"/>
                  <rect x="4" y="44" width="38" height="5" rx="1" fill="rgba(255,255,255,0.7)"/>
                  <rect x="4" y="53" width="28" height="2" rx="1" fill="rgba(255,255,255,0.3)"/>
                </svg>,
                texto_imagem: <svg viewBox="0 0 54 67" style={{width:'100%',height:'100%',opacity:0.7}}>
                  <rect width="54" height="67" fill="#0a0a0a"/>
                  <rect x="4" y="6" width="36" height="5" rx="1" fill="rgba(255,255,255,0.7)"/>
                  <rect x="4" y="15" width="46" height="2" rx="1" fill="rgba(255,255,255,0.3)"/>
                  <rect x="4" y="21" width="40" height="2" rx="1" fill="rgba(255,255,255,0.3)"/>
                  <rect x="2" y="30" width="50" height="32" rx="4" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
                </svg>,
                split_visual: <svg viewBox="0 0 54 67" style={{width:'100%',height:'100%',opacity:0.7}}>
                  <rect width="54" height="67" fill="#0a0a0a"/>
                  <rect x="0" y="0" width="54" height="32" fill="rgba(200,255,0,0.06)"/>
                  <rect x="0" y="35" width="54" height="32" fill="rgba(0,180,216,0.06)"/>
                  <rect x="0" y="32" width="54" height="3" fill="#C8FF00" opacity="0.4"/>
                  <rect x="14" y="12" width="26" height="3" rx="1" fill="rgba(255,255,255,0.5)"/>
                  <rect x="14" y="47" width="26" height="3" rx="1" fill="rgba(255,255,255,0.5)"/>
                </svg>,
                citacao_bold: <svg viewBox="0 0 54 67" style={{width:'100%',height:'100%',opacity:0.7}}>
                  <rect width="54" height="67" fill="#080814"/>
                  <text x="2" y="38" fontSize="42" fill="#C8FF00" fontFamily="serif" opacity="0.12">"</text>
                  <rect x="6" y="24" width="42" height="5" rx="1" fill="rgba(255,255,255,0.7)"/>
                  <rect x="8" y="33" width="38" height="5" rx="1" fill="rgba(255,255,255,0.7)"/>
                  <rect x="20" y="44" width="14" height="2" rx="1" fill="#C8FF00" opacity="0.6"/>
                </svg>,
              }
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {TEMPLATES.map(({ key, name }) => {
                    const sel = selectedTemplate === key
                    return (
                      <button key={key} onClick={() => handleTemplateChange(key)} style={{
                        borderRadius: 8, cursor: 'pointer', padding: '4px 4px 4px',
                        background: TEMPLATE_GRADIENTS[key] ?? TEMPLATE_GRADIENTS.impacto,
                        border: `1.5px solid ${sel ? A : B}`,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: 4, height: 72,
                        transition: 'border-color 0.15s',
                        boxShadow: sel ? `0 0 12px rgba(200,255,0,0.15)` : 'none',
                        overflow: 'hidden',
                      }}>
                        <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                          {TEMPLATE_SVG[key]}
                        </div>
                        <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 9, color: sel ? A : 'rgba(255,255,255,0.6)', letterSpacing: 1, lineHeight: 1, flexShrink: 0 }}>{name}</span>
                      </button>
                    )
                  })}
                </div>
              )
            })()}
          </CollapsibleSection>

          {/* ─ Section 6: LEGENDA ─ */}
          <CollapsibleSection
            title="LEGENDA"
            isOpen={secLegenda}
            onToggle={() => setSecLegenda(v => !v)}
            rightSlot={
              <button onClick={(e) => { e.stopPropagation(); copyLegenda() }}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(200,255,0,0.08)', border: `1px solid rgba(200,255,0,0.2)`, borderRadius: 4, padding: '2px 8px', color: A, fontFamily: ff, fontSize: 10, cursor: 'pointer' }}>
                <Copy size={10} /> Copiar
              </button>
            }
          >
            <textarea value={legenda} onChange={(e) => setLegenda(e.target.value)} rows={6}
              style={{ width: '100%', backgroundColor: S2, border: `1px solid ${B}`, borderRadius: 7, color: T, fontSize: 12, fontFamily: ff, lineHeight: 1.7, padding: '10px 12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(200,255,0,0.3)' }}
              onBlur={(e) => { e.target.style.borderColor = B }}
            />
          </CollapsibleSection>

        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Toggle bar */}
          <div style={{
            height: 48, flexShrink: 0, borderBottom: `1px solid ${B}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 16px', gap: 6,
          }}>
            {/* Hamburger — mobile only */}
            {isMobile && (
              <button
                onClick={() => setDrawerOpen(v => !v)}
                style={{
                  width: 36, height: 36, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 5,
                  background: drawerOpen ? 'rgba(200,255,0,0.08)' : 'none',
                  border: `1px solid ${drawerOpen ? 'rgba(200,255,0,0.3)' : B}`,
                  borderRadius: 8, cursor: 'pointer', flexShrink: 0,
                }}
              >
                <span style={{ width: 16, height: 1.5, backgroundColor: drawerOpen ? A : T, borderRadius: 2, transition: 'background 0.15s' }} />
                <span style={{ width: 16, height: 1.5, backgroundColor: drawerOpen ? A : T, borderRadius: 2, transition: 'background 0.15s' }} />
                <span style={{ width: 16, height: 1.5, backgroundColor: drawerOpen ? A : T, borderRadius: 2, transition: 'background 0.15s' }} />
              </button>
            )}
            <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
              {[
                { mode: 'slide' as const, icon: <Maximize2 size={13} />, label: 'Mockup' },
                { mode: 'grid' as const,  icon: <Grid size={13} />, label: 'Grade' },
              ].map(({ mode, icon, label }) => {
                const sel = viewMode === mode
                return (
                  <button key={mode} onClick={() => setViewMode(mode)} style={{
                    height: 30, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 5,
                    borderRadius: 6, fontSize: 11, fontFamily: ff, cursor: 'pointer',
                    backgroundColor: sel ? 'rgba(200,255,0,0.1)' : 'transparent',
                    border: `1px solid ${sel ? 'rgba(200,255,0,0.4)' : B}`,
                    color: sel ? A : M, transition: 'all 0.15s',
                  }}>
                    {icon} {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Slide-by-slide view ── */}
          {viewMode === 'slide' && (
            <div style={{
              flex: 1, overflowY: 'auto',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'flex-start',
              padding: '24px 24px 32px', gap: 0,
              backgroundColor: '#0a0a0a',
            }}>
              {/* Instagram post mockup */}
              <div style={{
                width: isMobile ? '100%' : 470,
                maxWidth: isMobile ? 470 : undefined,
                flexShrink: 0,
                backgroundColor: '#0a0a0a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4,
                overflow: 'hidden',
              }}>
                {/* Post header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', backgroundColor: '#0a0a0a',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {current?.profileAvatarUrl ? (
                      <img src={current.profileAvatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.15)' }} />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 700 }}>
                        {((current?.profileHandle ?? '').replace('@','').slice(0,1) || 'U').toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: ff, lineHeight: 1.2 }}>
                        {(current?.profileHandle ?? 'seu.perfil').replace('@','')}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: ff }}>Publicidade</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', letterSpacing: 2, lineHeight: 1, cursor: 'default' }}>•••</span>
                </div>

                {/* Slide */}
                <div style={{ position: 'relative', width: '100%' }}>
                  {carouselId && current && (
                    <button
                      onClick={() => { if (uploadingSlideId) return; uploadTargetSlideId.current = current.id; fileInputRef.current?.click() }}
                      disabled={!!uploadingSlideId}
                      style={{
                        position: 'absolute', bottom: 10, right: 10, zIndex: 20,
                        backgroundColor: 'rgba(0,0,0,0.72)', border: '1px solid rgba(255,255,255,0.18)',
                        borderRadius: 8, height: 28, padding: '0 10px',
                        display: 'flex', alignItems: 'center', gap: 5,
                        cursor: uploadingSlideId ? 'default' : 'pointer',
                        color: uploadingSlideId ? 'rgba(255,255,255,0.4)' : T,
                        fontSize: 11, fontFamily: ff, fontWeight: 600, backdropFilter: 'blur(6px)',
                      }}
                    >
                      <Camera size={12} />
                      {uploadingSlideId === current.id ? 'Enviando...' : 'Trocar'}
                    </button>
                  )}
                  <AnimatePresence mode="wait">
                    {current && (
                      <motion.div
                        key={`${current.id}-${flashKey}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                        style={{ width: '500px', height: '625px', flexShrink: 0, ...getSlideContainerStyle(current, activeSlide, slides.length, selectedTemplate, imageStyle, 500/1080) }}
                      >
                        <SlideRenderer
                          slide={current}
                          index={activeSlide}
                          total={slides.length}
                          template={selectedTemplate}
                          imageStyle={imageStyle}
                          scale={500/1080}
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
                          onBodyWordClick={(word) => {
                            if (!current) return
                            const highlighted = current.highlightedWords ?? []
                            const newHighlighted = highlighted.includes(word)
                              ? highlighted.filter(w => w !== word)
                              : [...highlighted, word]
                            updateTitleStyle(current.id, { highlightedWords: newHighlighted })
                          }}
                          onTitleWordClick={(word) => {
                            if (!current) return
                            const highlighted = current.highlightedWords ?? []
                            const newHighlighted = highlighted.includes(word)
                              ? highlighted.filter(w => w !== word)
                              : [...highlighted, word]
                            updateTitleStyle(current.id, { highlightedWords: newHighlighted })
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Post footer */}
                <div style={{ padding: '10px 12px 12px', backgroundColor: '#0a0a0a' }}>
                  {/* Action icons */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: 22, cursor: 'default', lineHeight: 1 }}>♡</span>
                      <span style={{ fontSize: 20, cursor: 'default', lineHeight: 1 }}>💬</span>
                      <span style={{ fontSize: 20, cursor: 'default', lineHeight: 1 }}>✈</span>
                    </div>
                    <span style={{ fontSize: 20, cursor: 'default', lineHeight: 1 }}>🔖</span>
                  </div>
                  {/* Likes */}
                  <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: ff }}>1.234 curtidas</p>
                  {/* Caption */}
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: ff, lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 700 }}>{(current?.profileHandle ?? 'seu.perfil').replace('@','')}</span>
                    {legenda ? ` ${legenda.slice(0, 80)}${legenda.length > 80 ? '...' : ''}` : ' Legenda do post aparece aqui'}
                  </p>
                  {/* Slide indicator */}
                  <div style={{ display: 'flex', gap: 4, marginTop: 10, justifyContent: 'center' }}>
                    {slides.map((_, i) => (
                      <div key={i} style={{
                        width: i === activeSlide ? 16 : 5, height: 5, borderRadius: 99,
                        backgroundColor: i === activeSlide ? '#3797f0' : 'rgba(255,255,255,0.25)',
                        transition: 'all 0.2s',
                      }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20 }}>
                <button onClick={() => setActiveSlide((p) => Math.max(0, p - 1))} disabled={activeSlide === 0}
                  style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: S2, border: `1px solid ${B}`, color: activeSlide === 0 ? M2 : T, cursor: activeSlide === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: 13, color: M, fontFamily: ff, fontWeight: 600 }}>{activeSlide + 1} / {slides.length}</span>
                <button onClick={() => setActiveSlide((p) => Math.min(slides.length - 1, p + 1))} disabled={activeSlide === slides.length - 1}
                  style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: S2, border: `1px solid ${B}`, color: activeSlide === slides.length - 1 ? M2 : T, cursor: activeSlide === slides.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Edit indicator + hack */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 10 }}>
                {selectedEl && (
                  <span style={{ fontFamily: ff, fontSize: 11, color: selectedEl === 'titulo' ? A : '#00B4D8', margin: 0 }}>
                    {selectedEl === 'titulo' ? '✎ editando título' : '✎ editando corpo'}
                  </span>
                )}
                {current?.hack && (
                  <span style={{ fontFamily: ff, fontSize: 11, color: A, background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.25)', borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ⚡ {current.hack}
                  </span>
                )}
              </div>

              {/* AI style selector */}
              {carouselId && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                  {[
                    { key: 'cinematic',    label: 'Cinemático' },
                    { key: 'illustration', label: 'Ilustração' },
                    { key: 'abstract',     label: 'Abstrato' },
                    { key: 'minimal',      label: 'Minimal' },
                    { key: 'gradient',     label: 'Gradiente' },
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
          )}

          {/* ── Grid view ── */}
          {viewMode === 'grid' && (
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: 24 }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, 360px)',
                gap: 16,
                justifyContent: 'center',
              }}>
                {slides.map((slide, idx) => {
                  const gs = 360 / 1080
                  const isActive = activeSlide === idx
                  return (
                    <div key={slide.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div
                        onClick={() => setActiveSlide(idx)}
                        style={{
                          cursor: 'pointer', position: 'relative',
                          width: 360, height: 450,
                          borderRadius: 10, overflow: 'hidden',
                          border: `2px solid ${isActive ? A : B}`,
                          transition: 'border-color 0.15s',
                          flexShrink: 0,
                          ...getSlideContainerStyle(slide, idx, slides.length, selectedTemplate, imageStyle, gs),
                        }}
                      >
                        <SlideRenderer
                          slide={slide}
                          index={idx}
                          total={slides.length}
                          template={selectedTemplate}
                          imageStyle={imageStyle}
                          scale={gs}
                          hasWatermark={hasWatermark}
                          selectedEl={activeSlide === idx ? selectedEl : null}
                          onSelectEl={isActive ? setSelectedEl : undefined}
                          onBodyWordClick={isActive ? (word) => {
                            const highlighted = slide.highlightedWords ?? []
                            const newHighlighted = highlighted.includes(word)
                              ? highlighted.filter(w => w !== word)
                              : [...highlighted, word]
                            updateTitleStyle(slide.id, { highlightedWords: newHighlighted })
                          } : undefined}
                          onTitleWordClick={isActive ? (word) => {
                            const highlighted = slide.highlightedWords ?? []
                            const newHighlighted = highlighted.includes(word)
                              ? highlighted.filter(w => w !== word)
                              : [...highlighted, word]
                            updateTitleStyle(slide.id, { highlightedWords: newHighlighted })
                          } : undefined}
                        />
                        {/* Slide number badge */}
                        <div style={{
                          position: 'absolute', top: 8, left: 8, zIndex: 10,
                          background: isActive ? A : 'rgba(0,0,0,0.7)',
                          color: isActive ? '#000' : T,
                          fontFamily: '"Bebas Neue", sans-serif',
                          fontSize: 12, letterSpacing: 0.5,
                          padding: '2px 8px', borderRadius: 4,
                        }}>
                          {idx + 1}
                        </div>
                      </div>
                      {/* Download individual */}
                      <button
                        onClick={() => handleExportSingle(idx)}
                        style={{
                          width: '100%', height: 32, borderRadius: 6,
                          backgroundColor: 'transparent',
                          border: `1px solid ${B}`,
                          color: M, fontSize: 11, fontFamily: ff,
                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', gap: 5,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = A; e.currentTarget.style.color = A }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = B; e.currentTarget.style.color = M }}
                      >
                        ⬇ Baixar slide
                      </button>
                      <p style={{ fontSize: 10, color: M2, fontFamily: ff, margin: 0, textAlign: 'center' }}>
                        1080 × 1350px
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
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
        <input
          value={exportName}
          onChange={e => setExportName(e.target.value)}
          placeholder="nome do arquivo"
          style={{
            height: 38, padding: '0 12px', backgroundColor: S2,
            border: `1px solid ${B}`, borderRadius: 8, color: T,
            fontSize: 13, fontFamily: ff, outline: 'none', width: 160,
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(200,255,0,0.4)'}
          onBlur={e => e.target.style.borderColor = B}
        />
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
  const [searchParams, setSearchParams] = useSearchParams()
  const temaFromURL       = searchParams.get('tema') ?? ''
  const carouselIdFromURL = searchParams.get('carousel_id') ?? ''
  const { user } = useAuth()

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
      console.log('[loadCarousel] carregando:', carouselIdFromURL)
      setLoadingCarousel(true)
      const [
        { data: carousel, error: carouselError },
        { data: slidesData, error: slidesError }
      ] = await Promise.all([
        supabase
          .from('carousels')
          .select('id, legenda, has_watermark, preview_token')
          .eq('id', carouselIdFromURL)
          .single(),
        supabase
          .from('carousel_slides')
          .select('*')
          .eq('carousel_id', carouselIdFromURL)
          .order('position', { ascending: true }),
      ])

      if (carouselError) {
        console.error('[loadCarousel] carousel error:', carouselError)
        toast.error('Erro ao carregar carrossel: ' + carouselError.message)
        setLoadingCarousel(false)
        return
      }

      if (slidesError) {
        console.error('[loadCarousel] slides error:', slidesError)
        toast.error('Erro ao carregar slides: ' + slidesError.message)
        setLoadingCarousel(false)
        return
      }

      console.log('[loadCarousel] slides carregados:', slidesData?.length ?? 0)

      if (!carousel) {
        console.error('[loadCarousel] carousel não encontrado:', carouselIdFromURL)
        toast.error('Carrossel não encontrado. Redirecionando...')
        setLoadingCarousel(false)
        setAppState('input')
        return
      }

      if (!slidesData || slidesData.length === 0) {
        console.error('[loadCarousel] sem slides para carousel:', carouselIdFromURL)
        toast.error('Carrossel sem slides.')
        setLoadingCarousel(false)
        setAppState('input')
        return
      }

      // Usa o UUID real do banco (não sintético) para que saveFormatToDb salve via UUID
      // slides_json é apenas escrito (triggerAutoSave), nunca lido no reload — fonte é carousel_slides
      const slides: Slide[] = (slidesData as Array<Record<string, unknown>>).map((s) => ({
        id: s.id as string,
        titulo: (s.titulo as string) ?? '',
        corpo: (s.corpo as string) ?? '',
        hack: (s.hack_aplicado as string) ?? '',
        bgImageUrl: (s.bg_image_url as string) ?? undefined,
        titleFontSize: (s.font_size_title as number) ?? 80,
        bodyFontSize: (s.font_size_body as number) ?? 28,
        fontWeightTitle: (s.font_weight_title as 'normal' | 'bold') ?? undefined,
        fontFamily: (s.font_family as string) ?? undefined,
        textColor: (s.text_color as string) ?? undefined,
        textAlign: (s.text_align as 'left' | 'center' | 'right') ?? undefined,
        titlePos: (s.title_position_x != null && s.title_position_y != null)
          ? { x: s.title_position_x as number, y: s.title_position_y as number }
          : undefined,
        // Campos de corpo
        bodyColor:           (s.body_color as string)                         ?? undefined,
        bodyFontFamily:      (s.body_font_family as string)                   ?? undefined,
        bodyFontWeight:      (s.body_font_weight as 'normal' | 'bold')        ?? undefined,
        bodyItalic:          (s.body_italic as boolean)                       ?? undefined,
        bodyLineHeight:      (s.body_line_height as number)                   ?? undefined,
        bodyLetterSpacing:   (s.body_letter_spacing as number)                ?? undefined,
        bodyBgEnabled:       (s.body_bg_enabled as boolean)                   ?? undefined,
        bodyBgColor:         (s.body_bg_color as string)                      ?? undefined,
        // Campos de título
        titleItalic:         (s.title_italic as boolean)                      ?? undefined,
        titleUppercase:      (s.title_uppercase as boolean)                   ?? undefined,
        titleLetterSpacing:  (s.title_letter_spacing as number)               ?? undefined,
        titleLineHeight:     (s.title_line_height as number)                  ?? undefined,
        titleBgEnabled:      (s.title_bg_enabled as boolean)                  ?? undefined,
        titleBgColor:        (s.title_bg_color as string)                     ?? undefined,
        titleShadow:         (s.title_shadow as boolean)                      ?? undefined,
        titleShadowIntensity:(s.title_shadow_intensity as number)             ?? undefined,
        // Campos de imagem
        overlayOpacity:      (s.overlay_opacity as number)                    ?? undefined,
        imageOpacity:        (s.image_opacity as number)                      ?? undefined,
        bgZoom:              (s.bg_zoom as number)                            ?? undefined,
        bgPositionX:         (s.bg_pos_x as number)                          ?? undefined,
        bgPositionY:         (s.bg_pos_y as number)                          ?? undefined,
        bgFilter:            (s.bg_filter as string)                          ?? undefined,
        bgVisible:           (s.bg_visible as boolean)                        ?? undefined,
        borderVignette:      (s.border_vignette as boolean)                   ?? undefined,
        vignetteIntensity:   (s.vignette_intensity as number)                 ?? undefined,
        // Campos de layout
        paddingX:            (s.padding_x as number)                         ?? undefined,
        blockSpacing:        (s.block_spacing as number)                      ?? undefined,
        textPosition:        (s.text_position as 'top' | 'center' | 'bottom') ?? undefined,
        // Campos extras
        afterImageUrl:       (s.after_image_url as string)                   ?? undefined,
        ctaText:             (s.cta_text as string)                          ?? undefined,
        profileBadgeEnabled:   (s.profile_badge_enabled as boolean)            ?? undefined,
        profileHandle:         (s.profile_handle as string)                    ?? undefined,
        profileAvatarUrl:      (s.profile_avatar_url as string)                ?? undefined,
        profileBadgePosition:  (s.profile_badge_position as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') ?? undefined,
        profileBadgeSize:      (s.profile_badge_size as number)                ?? undefined,
        profileBadgeBg:        (s.profile_badge_bg as string)                  ?? undefined,
        profileBadgeTextColor: (s.profile_badge_text_color as string)          ?? undefined,
        highlightedWords: Array.isArray(s.highlighted_words)
          ? (s.highlighted_words as string[])
          : typeof s.highlighted_words === 'string' && (s.highlighted_words as string).trim()
          ? (() => { try { return JSON.parse(s.highlighted_words as string) } catch { return [] } })()
          : [],
        accentColor:           (s.accent_color as string)                       ?? '#C8FF00',
        bgPattern:             (s.bg_pattern as string)                         ?? undefined,
        bgPatternOpacity:      (s.bg_pattern_opacity as number)                 ?? undefined,
        bgSolidColor:          (s.bg_solid_color as string)                     ?? undefined,
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
    setSearchParams({ carousel_id: result.carousel_id }, { replace: true })
    // Aplica identidade visual do perfil nos slides gerados
    supabase.from('profiles')
      .select('visual_kit')
      .eq('user_id', user?.id)
      .single()
      .then(({ data }) => {
        if (!data?.visual_kit) return
        const vk = data.visual_kit as Record<string, string>
        const cor = vk.cor ?? '#C8FF00'
        const fonte = vk.fonte ?? '"Bebas Neue", sans-serif'
        if (result.carousel_id) {
          supabase.from('carousel_slides')
            .update({
              text_color: cor,
              font_family: fonte,
              font_size_title: 80,
              font_size_body: 28,
              accent_color: cor,
            })
            .eq('carousel_id', result.carousel_id)
            .then(() => {
              console.log('[handleDone] identidade visual aplicada')
            })
        }
      })
    setTimeout(() => setAppState('preview'), 50)
    // Recarrega do banco para garantir que edições persistam
    setTimeout(async () => {
      if (!result.carousel_id) return
      const { data: slides } = await supabase
        .from('carousel_slides')
        .select('*')
        .eq('carousel_id', result.carousel_id)
        .order('position')
      if (slides && slides.length > 0) {
        setLoadedCarousel({
          carouselId: result.carousel_id,
          slides: slides.map((s) => ({
            id: s.id as string,
            titulo: (s.titulo as string) ?? '',
            corpo: (s.corpo as string) ?? '',
            hack: (s.hack_aplicado as string) ?? '',
            bgImageUrl: (s.bg_image_url as string) ?? undefined,
            titleFontSize: (s.font_size_title as number) ?? 80,
            bodyFontSize: (s.font_size_body as number) ?? 28,
            fontWeightTitle: (s.font_weight_title as 'normal' | 'bold') ?? undefined,
            fontFamily: (s.font_family as string) ?? undefined,
            textColor: (s.text_color as string) ?? undefined,
            textAlign: (s.text_align as 'left' | 'center' | 'right') ?? undefined,
            // Corpo
            bodyColor:           (s.body_color as string)                          ?? undefined,
            bodyFontFamily:      (s.body_font_family as string)                    ?? undefined,
            bodyFontWeight:      (s.body_font_weight as 'normal' | 'bold')         ?? undefined,
            bodyItalic:          (s.body_italic as boolean)                        ?? undefined,
            bodyLineHeight:      (s.body_line_height as number)                    ?? undefined,
            bodyLetterSpacing:   (s.body_letter_spacing as number)                 ?? undefined,
            bodyBgEnabled:       (s.body_bg_enabled as boolean)                    ?? undefined,
            bodyBgColor:         (s.body_bg_color as string)                       ?? undefined,
            // Título
            titleItalic:         (s.title_italic as boolean)                       ?? undefined,
            titleUppercase:      (s.title_uppercase as boolean)                    ?? undefined,
            titleLetterSpacing:  (s.title_letter_spacing as number)                ?? undefined,
            titleLineHeight:     (s.title_line_height as number)                   ?? undefined,
            titleBgEnabled:      (s.title_bg_enabled as boolean)                   ?? undefined,
            titleBgColor:        (s.title_bg_color as string)                      ?? undefined,
            titleShadow:         (s.title_shadow as boolean)                       ?? undefined,
            titleShadowIntensity:(s.title_shadow_intensity as number)              ?? undefined,
            // Imagem
            overlayOpacity:      (s.overlay_opacity as number)                     ?? undefined,
            imageOpacity:        (s.image_opacity as number)                       ?? undefined,
            bgZoom:              (s.bg_zoom as number)                             ?? undefined,
            bgPositionX:         (s.bg_pos_x as number)                           ?? undefined,
            bgPositionY:         (s.bg_pos_y as number)                           ?? undefined,
            bgFilter:            (s.bg_filter as string)                           ?? undefined,
            bgVisible:           (s.bg_visible as boolean)                         ?? undefined,
            borderVignette:      (s.border_vignette as boolean)                    ?? undefined,
            vignetteIntensity:   (s.vignette_intensity as number)                  ?? undefined,
            // Layout
            paddingX:            (s.padding_x as number)                          ?? undefined,
            blockSpacing:        (s.block_spacing as number)                       ?? undefined,
            textPosition:        (s.text_position as 'top' | 'center' | 'bottom') ?? undefined,
            // Extras
            afterImageUrl:       (s.after_image_url as string)                    ?? undefined,
            ctaText:             (s.cta_text as string)                            ?? undefined,
            profileBadgeEnabled:   (s.profile_badge_enabled as boolean)             ?? undefined,
            profileHandle:         (s.profile_handle as string)                     ?? undefined,
            profileAvatarUrl:      (s.profile_avatar_url as string)                 ?? undefined,
            profileBadgePosition:  (s.profile_badge_position as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') ?? undefined,
            profileBadgeSize:      (s.profile_badge_size as number)                 ?? undefined,
            profileBadgeBg:        (s.profile_badge_bg as string)                   ?? undefined,
            profileBadgeTextColor: (s.profile_badge_text_color as string)           ?? undefined,
            highlightedWords: Array.isArray(s.highlighted_words)
              ? (s.highlighted_words as string[])
              : typeof s.highlighted_words === 'string' && (s.highlighted_words as string).trim()
              ? (() => { try { return JSON.parse(s.highlighted_words as string) } catch { return [] } })()
              : [],
            accentColor:           (s.accent_color as string)                       ?? '#C8FF00',
            bgPattern:             (s.bg_pattern as string)                         ?? undefined,
            bgPatternOpacity:      (s.bg_pattern_opacity as number)                 ?? undefined,
            bgSolidColor:          (s.bg_solid_color as string)                     ?? undefined,
          })),
          legenda: result.legenda,
          hasWatermark: result.has_watermark ?? false,
          previewToken: result.preview_token ?? '',
        })
      }
    }, 600)
  }, [user?.id])

  const handleError = useCallback(() => {
    setAppState('input')
  }, [])

  // Slides para o StatePreview: banco (edição) ou API (novo)
  const previewSlides: Slide[] = loadedCarousel?.slides ?? (generateResult?.slides ?? []).map((s) => ({
    id: `slide-${generateResult!.carousel_id}-${s.position}`,
    titulo: s.titulo,
    corpo: s.corpo.length > 60 ? s.corpo.replace(/\. ([A-Z])/g, '.\n$1') : s.corpo,
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
