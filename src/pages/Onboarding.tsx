import { useState, useEffect, useRef, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

// ─── Design tokens — Apple Dark ───────────────────────────────
const A  = '#00D4FF'
const AH = '#00BFEF'
const BG = '#080808'
const S  = 'rgba(255,255,255,0.04)'
const S2 = 'rgba(255,255,255,0.07)'
const T  = '#F2F2F7'
const M  = 'rgba(242,242,247,0.4)'
const B  = 'rgba(255,255,255,0.07)'

const TOTAL = 5
const ff = 'DM Sans, sans-serif'

// ─── FormData ─────────────────────────────────────────────────
interface VoiceAnalysis {
  tom: string
  ritmo: string
  expressoes_marcantes: string[]
  o_que_evitar: string[]
  personalidade: string
}

interface FormData {
  displayName: string
  instagramHandle: string
  niche: string
  // step 2
  tom: string
  palavrasProibidas: string[]
  palavrasChave: string[]
  // step 3
  cor: string
  estilo: string
  fonte: string
  tamanhoTitulo: 'pequeno' | 'medio' | 'grande'
  posicaoTexto: 'topo' | 'centro' | 'base'
  intensidadeFundo: number
  // step 2
  irritacao: string
  // step 4
  exemploTexto: string
  voiceAnalysis: VoiceAnalysis | null
  // step 5
  primeiraTema: string
}

// ─── Shared style helpers ─────────────────────────────────────
const inputSt: React.CSSProperties = {
  width: '100%', backgroundColor: S2, border: `1px solid ${B}`,
  borderRadius: 8, padding: '11px 14px', color: T, fontSize: 14,
  fontFamily: ff, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
}
const labelSt: React.CSSProperties = {
  display: 'block', color: M, fontSize: 13, fontFamily: ff,
  fontWeight: 500, marginBottom: 8,
}
const sectionSt: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 10 }

const FocusInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => (
    <input
      {...props}
      ref={ref}
      style={{ ...inputSt, ...props.style }}
      onFocus={(e) => { e.target.style.borderColor = A; props.onFocus?.(e) }}
      onBlur={(e) => { e.target.style.borderColor = B; props.onBlur?.(e) }}
    />
  )
)

function PrimaryBtn({ busy, disabled, onClick, children, style }: {
  busy?: boolean; disabled?: boolean; onClick?: () => void
  children: React.ReactNode; style?: React.CSSProperties
}) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onClick} disabled={disabled ?? busy}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        backgroundColor: h && !(disabled ?? busy) ? AH : A,
        color: '#000', border: 'none', borderRadius: 8, height: 48,
        fontSize: 15, fontWeight: 700, fontFamily: ff,
        cursor: (disabled ?? busy) ? 'not-allowed' : 'pointer',
        opacity: (disabled ?? busy) ? 0.5 : 1,
        transition: 'background-color 0.2s', letterSpacing: 0.3, ...style,
      }}>
      {children}
    </button>
  )
}

// ─── Chip group (predefined + custom) ─────────────────────────
// ─── Data constants ───────────────────────────────────────────
const NICHES = [
  { value: 'empreendedorismo', label: 'Empreendedorismo', emoji: '💼' },
  { value: 'marketing',        label: 'Marketing',        emoji: '📱' },
  { value: 'saúde',            label: 'Saúde',            emoji: '💪' },
  { value: 'autoconhecimento', label: 'Autoconhecimento', emoji: '🧠' },
  { value: 'espiritualidade',  label: 'Espiritualidade',  emoji: '✨' },
  { value: 'tecnologia',       label: 'Tecnologia',       emoji: '💻' },
  { value: 'lifestyle',        label: 'Lifestyle',        emoji: '🌅' },
  { value: 'educação',         label: 'Educação',         emoji: '📚' },
  { value: 'finanças',         label: 'Finanças',         emoji: '💰' },
  { value: 'outro',            label: 'Outro nicho',      emoji: '🌐' },
]

const TONES = [
  {
    slug: 'direto',
    label: 'Direto e sem rodeios',
    example: 'A maioria não cresce porque quer parecer profissional antes de ser real. Simples assim.',
  },
  {
    slug: 'educativo',
    label: 'Didático e estruturado',
    example: 'Testei 3 formatos de post essa semana. O resultado foi diferente do que eu esperava. Aqui está o que aprendi.',
  },
  {
    slug: 'bastidor',
    label: 'Bastidor e humano',
    example: 'Na semana passada meu post mais trabalhado foi o que menos performou. E o mais simples bombou.',
  },
  {
    slug: 'humor',
    label: 'Leve com ironia',
    example: 'Minha rotina matinal tem 3 passos: café, abrir o Instagram e fingir que entendo o algoritmo.',
  },
]

const PALETTE = ['#C8FF00','#FF6B2B','#00B4D8','#A855F7','#F43F5E','#10B981','#F59E0B','#FFFFFF']

const STYLES = [
  { slug: 'dark_cinematic', label: 'Dark Cinematic', desc: 'Foto dramática, escuro', bg: 'linear-gradient(135deg,#0a0a0a,#1a2a3a)' },
  { slug: 'light_clean',    label: 'Light Clean',    desc: 'Claro, minimalista',     bg: 'linear-gradient(135deg,#f8f8f8,#e0e0e0)' },
  { slug: 'colorful',       label: 'Colorido',       desc: 'Cores vibrantes',        bg: 'linear-gradient(135deg,#FF6B2B,#A855F7)' },
  { slug: 'minimal_bw',     label: 'Minimalista',    desc: 'Preto e branco',         bg: 'linear-gradient(135deg,#222,#555)' },
]

const FONTS = [
  { name: 'Bebas Neue',       preview: { fontFamily: '"Bebas Neue", sans-serif', letterSpacing: 2 } },
  { name: 'DM Sans',          preview: { fontFamily: '"DM Sans", sans-serif', fontWeight: 700 } },
  { name: 'Playfair Display', preview: { fontFamily: '"Playfair Display", serif', fontWeight: 700 } },
  { name: 'Space Grotesk',    preview: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 } },
  { name: 'Inter',            preview: { fontFamily: '"Inter", sans-serif', fontWeight: 600 } },
]

const SUGESTOES: Record<string, string[]> = {
  empreendedorismo: ['por que a maioria dos negócios falha no primeiro ano sem avisar','o erro que todo empreendedor comete antes de ter o primeiro cliente','como eu validei meu produto sem gastar nada'],
  marketing:        ['por que seu conteúdo não cresce mesmo postando todo dia','o algoritmo não favorece quem posta mais. favorece quem para o scroll','3 tipos de post que geram salvamento no Instagram em 2026'],
  saude:            ['por que você não consegue manter uma rotina saudável de verdade','o que ninguém te conta sobre consistência na academia','a diferença entre emagrecer e mudar o corpo'],
  autoconhecimento: ['por que você se sabota toda vez que está perto de crescer','o padrão que se repete na sua vida e você ainda não nomeou','a versão de você que existe antes do medo falar mais alto'],
  espiritualidade:  ['o que significa realmente viver no presente (sem ser coach)','por que práticas espirituais não funcionam sem autoconhecimento','ciclos lunares e como uso isso na minha rotina sem dogma'],
  tecnologia:       ['por que a maioria das pessoas usa IA de forma completamente errada','as 3 ferramentas de IA que eliminaram 4 horas do meu dia','o que muda quando você para de usar IA como Google e começa a pensar com ela'],
  lifestyle:        ['o que mudou na minha vida quando parei de otimizar tudo','como moro e trabalho de qualquer lugar sem romantizar isso','a rotina que realmente funciona não parece com a que você vê no Instagram'],
  educacao:         ['por que você aprende mas não aplica nada do que aprende','o método que usei para aprender em 30 dias o que levaria um ano','a diferença entre estudar e aprender de verdade'],
  financas:         ['o erro financeiro que a maioria comete e chama de investimento','como saí do vermelho sem cortar o café','por que educação financeira não resolve o problema de quem ganha pouco'],
  outro:            ['a coisa que todos fingem não saber no seu nicho','o que eu aprendi errando que ninguém ensina nos cursos','por que consistência é mais importante que qualidade no começo'],
}

function normalizeNicho(n: string) {
  return n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// ─── Step 1 ───────────────────────────────────────────────────
function Step1({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={sectionSt}>
        <label style={labelSt}>Como você quer ser chamado?</label>
        <FocusInput value={data.displayName} onChange={(e) => onChange({ displayName: e.target.value })} placeholder="Seu nome ou apelido" />
      </div>
      <div style={sectionSt}>
        <label style={labelSt}>Sobre o que você faz conteúdo?</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {NICHES.map((n) => {
            const sel = data.niche === n.value
            return (
              <button key={n.value} type="button" onClick={() => onChange({ niche: n.value })} style={{
                background: sel ? 'rgba(0,212,255,0.08)' : S2,
                border: `2px solid ${sel ? A : B}`,
                borderRadius: 10, padding: '12px 14px',
                cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 10,
                transition: 'border-color 0.15s, background 0.15s',
              }}>
                <span style={{ fontSize: 22 }}>{n.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: sel ? A : T, fontFamily: ff }}>{n.label}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div style={sectionSt}>
        <label style={labelSt}>Instagram <span style={{ color: M, fontWeight: 400 }}>(opcional)</span></label>
        <FocusInput value={data.instagramHandle} onChange={(e) => onChange({ instagramHandle: e.target.value })} placeholder="@seuperfil" />
      </div>
    </div>
  )
}

// ─── Step 2 ───────────────────────────────────────────────────
function Step2({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Seleção de tom via exemplos concretos */}
      <div style={sectionSt}>
        <label style={labelSt}>Qual dessas frases mais parece você?</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TONES.map((t) => {
            const sel = data.tom === t.slug
            return (
              <button key={t.slug} type="button" onClick={() => onChange({ tom: t.slug })} style={{
                background: sel ? 'rgba(0,212,255,0.08)' : S2,
                border: `2px solid ${sel ? A : B}`,
                borderRadius: 12, padding: '14px 18px',
                cursor: 'pointer', textAlign: 'left',
                transition: 'border-color 0.15s, background 0.15s',
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                  border: `2px solid ${sel ? A : 'rgba(255,255,255,0.2)'}`,
                  background: sel ? A : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {sel && <div style={{ width: 6, height: 6, borderRadius: '50%', background: BG }} />}
                </div>
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: sel ? A : M, fontFamily: ff, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t.label}</p>
                  <p style={{ margin: 0, fontSize: 14, color: sel ? T : 'rgba(232,244,255,0.65)', fontFamily: ff, lineHeight: 1.5, fontStyle: 'italic' }}>"{t.example}"</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Pergunta de irritação — captura a voz real */}
      <div style={sectionSt}>
        <label style={labelSt}>
          O que mais te irrita no seu nicho que ninguém tem coragem de falar?
          <span style={{ color: M, fontWeight: 400, marginLeft: 6 }}>(opcional)</span>
        </label>
        <textarea
          value={data.irritacao}
          onChange={(e) => onChange({ irritacao: e.target.value })}
          placeholder="Pode ser curto. Só joga aqui o que você pensa mas não fala."
          rows={3}
          style={{
            ...inputSt, resize: 'none', lineHeight: 1.6,
            padding: '12px 14px',
          }}
          onFocus={(e) => { e.target.style.borderColor = A }}
          onBlur={(e) => { e.target.style.borderColor = B }}
        />
      </div>
    </div>
  )
}

// ─── Step 3 ───────────────────────────────────────────────────
function ToggleGroup({ label, options, value, onChange }: {
  label: string; options: { value: string; label: string }[]
  value: string; onChange: (v: string) => void
}) {
  return (
    <div style={sectionSt}>
      <label style={labelSt}>{label}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        {options.map((o) => {
          const sel = value === o.value
          return (
            <button key={o.value} type="button" onClick={() => onChange(o.value)} style={{
              flex: 1, height: 40, backgroundColor: sel ? 'rgba(200,255,0,0.1)' : S2,
              border: `2px solid ${sel ? A : B}`, borderRadius: 8,
              color: sel ? A : M, fontSize: 13, fontFamily: ff, fontWeight: sel ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Step3({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Cor */}
      <div style={sectionSt}>
        <label style={labelSt}>Cor do seu perfil</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {PALETTE.map((c) => (
            <button key={c} type="button" onClick={() => onChange({ cor: c })} style={{
              width: 36, height: 36, borderRadius: '50%', backgroundColor: c, padding: 0,
              border: data.cor === c ? '3px solid white' : '3px solid transparent',
              outline: data.cor === c ? `2px solid ${c}` : 'none', outlineOffset: 2,
              cursor: 'pointer', transition: 'outline 0.15s',
            }} />
          ))}
          <label title="Cor customizada" style={{ position: 'relative', cursor: 'pointer' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'conic-gradient(red,yellow,lime,aqua,blue,magenta,red)',
              border: !PALETTE.includes(data.cor) ? '3px solid white' : '3px solid transparent',
              outline: !PALETTE.includes(data.cor) ? `2px solid ${data.cor}` : 'none', outlineOffset: 2,
            }} />
            <input type="color" value={data.cor} onChange={(e) => onChange({ cor: e.target.value })}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
          </label>
        </div>
      </div>

      {/* Estilo */}
      <div style={sectionSt}>
        <label style={labelSt}>Estilo dos seus slides</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {STYLES.map((s) => {
            const sel = data.estilo === s.slug
            return (
              <button key={s.slug} type="button" onClick={() => onChange({ estilo: s.slug })} style={{
                background: sel ? 'rgba(200,255,0,0.06)' : S2, border: `2px solid ${sel ? A : B}`,
                borderRadius: 10, cursor: 'pointer', overflow: 'hidden', transition: 'border-color 0.2s', padding: 0, textAlign: 'left',
              }}>
                <div style={{ height: 48, background: s.bg }} />
                <div style={{ padding: '8px 12px 10px' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: sel ? A : T, fontFamily: ff, margin: '0 0 2px' }}>{s.label}</p>
                  <p style={{ fontSize: 11, color: M, fontFamily: ff, margin: 0 }}>{s.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Fonte */}
      <div style={sectionSt}>
        <label style={labelSt}>Fonte dos títulos</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FONTS.map((f) => {
            const sel = data.fonte === f.name
            return (
              <button key={f.name} type="button" onClick={() => onChange({ fonte: f.name })} style={{
                background: sel ? 'rgba(200,255,0,0.06)' : S2, border: `2px solid ${sel ? A : B}`,
                borderRadius: 8, padding: '10px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'border-color 0.2s, background 0.2s',
              }}>
                <span style={{ ...f.preview, fontSize: 20, color: sel ? A : T }}> CONTEÚDO </span>
                <span style={{ fontSize: 11, color: M, fontFamily: ff }}>{f.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tamanho do título */}
      <ToggleGroup
        label="Tamanho do título"
        value={data.tamanhoTitulo}
        onChange={(v) => onChange({ tamanhoTitulo: v as FormData['tamanhoTitulo'] })}
        options={[{ value: 'pequeno', label: 'Pequeno' }, { value: 'medio', label: 'Médio' }, { value: 'grande', label: 'Grande' }]}
      />

      {/* Posição do texto */}
      <ToggleGroup
        label="Posição do texto no slide"
        value={data.posicaoTexto}
        onChange={(v) => onChange({ posicaoTexto: v as FormData['posicaoTexto'] })}
        options={[{ value: 'topo', label: '⬆ Topo' }, { value: 'centro', label: '⬛ Centro' }, { value: 'base', label: '⬇ Base' }]}
      />

      {/* Intensidade do fundo */}
      <div style={sectionSt}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ ...labelSt, marginBottom: 0 }}>Transparência do fundo</label>
          <span style={{ fontSize: 13, color: A, fontFamily: ff, fontWeight: 600 }}>{data.intensidadeFundo}%</span>
        </div>
        <input
          type="range" min={0} max={100} value={data.intensidadeFundo}
          onChange={(e) => onChange({ intensidadeFundo: Number(e.target.value) })}
          style={{ width: '100%', accentColor: A, cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: M, fontFamily: ff }}>Fundo suave</span>
          <span style={{ fontSize: 11, color: M, fontFamily: ff }}>Fundo forte</span>
        </div>
      </div>
    </div>
  )
}

// ─── Step 4 ───────────────────────────────────────────────────
function Step4({ data, onChange, onSkip, session }: {
  data: FormData
  onChange: (d: Partial<FormData>) => void
  onSkip: () => void
  session: string
}) {
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError]         = useState('')
  const analysis = data.voiceAnalysis
  const canAnalyze = data.exemploTexto.trim().length >= 60

  const analyze = async () => {
    setAnalyzing(true); setError('')
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
      const res = await fetch(`${supabaseUrl}/functions/v1/analyze-voice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session}`,
        },
        body: JSON.stringify({ texto: data.exemploTexto, niche: data.niche }),
      })
      if (!res.ok) throw new Error('Erro na análise')
      const result: VoiceAnalysis = await res.json()
      onChange({
        voiceAnalysis: result,
        palavrasChave: [...new Set([...data.palavrasChave, ...result.expressoes_marcantes.slice(0, 3)])],
        palavrasProibidas: [...new Set([...data.palavrasProibidas, ...result.o_que_evitar.slice(0, 3)])],
      })
    } catch {
      setError('Não consegui analisar. Tenta de novo.')
    } finally {
      setAnalyzing(false)
    }
  }

  const resetAnalysis = () => onChange({ voiceAnalysis: null })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Textarea — esconde quando análise está pronta */}
      <AnimatePresence>
        {!analysis && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ position: 'relative' }}>
              <textarea
                value={data.exemploTexto}
                onChange={(e) => onChange({ exemploTexto: e.target.value, voiceAnalysis: null })}
                placeholder="Cole qualquer texto seu — legenda de post, e-mail, mensagem de WhatsApp, rascunho. Quanto mais natural, melhor."
                rows={6}
                style={{ ...inputSt, resize: 'none', minHeight: 140, lineHeight: 1.65, paddingBottom: 30 }}
                onFocus={(e) => { e.target.style.borderColor = A }}
                onBlur={(e) => { e.target.style.borderColor = B }}
              />
              <span style={{ position: 'absolute', bottom: 10, right: 14, fontSize: 11, color: M, fontFamily: ff, pointerEvents: 'none' }}>
                {data.exemploTexto.length} chars {canAnalyze ? '✓' : `— mín. 60`}
              </span>
            </div>

            {/* Botão analisar */}
            <motion.button
              type="button"
              onClick={analyze}
              disabled={!canAnalyze || analyzing}
              animate={{ opacity: canAnalyze ? 1 : 0.4 }}
              style={{
                marginTop: 10, width: '100%', height: 44,
                background: canAnalyze ? `linear-gradient(135deg, ${A}, #6366F1)` : S2,
                border: 'none', borderRadius: 8, color: canAnalyze ? '#000' : M,
                fontSize: 14, fontWeight: 700, fontFamily: ff,
                cursor: canAnalyze && !analyzing ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {analyzing
                ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>◌</span> Lendo sua voz...</>
                : '✦ Analisar meu jeito de escrever'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resultado da análise */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {/* Card de confirmação */}
            <div style={{
              background: 'rgba(0,212,255,0.05)', border: `1px solid rgba(0,212,255,0.2)`,
              borderRadius: 12, padding: '16px 18px',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>✦</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: A, fontFamily: ff }}>Aprendi isso sobre como você escreve</span>
              </div>

              <div>
                <p style={{ fontSize: 11, color: M, fontFamily: ff, margin: '0 0 4px', letterSpacing: '.08em', textTransform: 'uppercase' }}>Tom</p>
                <p style={{ fontSize: 13, color: T, fontFamily: ff, margin: 0, lineHeight: 1.55 }}>{analysis.tom}</p>
              </div>

              <div>
                <p style={{ fontSize: 11, color: M, fontFamily: ff, margin: '0 0 4px', letterSpacing: '.08em', textTransform: 'uppercase' }}>Ritmo</p>
                <p style={{ fontSize: 13, color: T, fontFamily: ff, margin: 0, lineHeight: 1.55 }}>{analysis.ritmo}</p>
              </div>

              <div>
                <p style={{ fontSize: 11, color: M, fontFamily: ff, margin: '0 0 6px', letterSpacing: '.08em', textTransform: 'uppercase' }}>Expressões do seu estilo</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {analysis.expressoes_marcantes.map((e) => (
                    <span key={e} style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: 12,
                      background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: A, fontFamily: ff,
                    }}>{e}</span>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ fontSize: 11, color: M, fontFamily: ff, margin: '0 0 6px', letterSpacing: '.08em', textTransform: 'uppercase' }}>O que nunca combinaria com você</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {analysis.o_que_evitar.map((e) => (
                    <span key={e} style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: 12,
                      background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.2)', color: '#FF9999', fontFamily: ff,
                    }}>{e}</span>
                  ))}
                </div>
              </div>

              <p style={{
                fontSize: 12, color: M, fontFamily: ff, margin: 0,
                borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10,
                fontStyle: 'italic',
              }}>
                "{analysis.personalidade}"
              </p>
            </div>

            <button type="button" onClick={resetAnalysis} style={{
              background: 'none', border: 'none', color: M, fontSize: 12, fontFamily: ff,
              cursor: 'pointer', textAlign: 'center', padding: '2px 0',
            }}>
              ← Usar outro texto
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p style={{ fontSize: 13, color: '#f87171', fontFamily: ff, margin: 0 }}>{error}</p>}

      {!analysis && (
        <button type="button" onClick={onSkip} style={{
          background: 'none', border: 'none', color: 'rgba(232,244,255,0.25)', fontSize: 13, fontFamily: ff,
          cursor: 'pointer', textAlign: 'center', padding: '2px 0',
        }}>
          Pular por agora →
        </button>
      )}
    </div>
  )
}

// ─── Step 5 ───────────────────────────────────────────────────
function Step5({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
  const key = normalizeNicho(data.niche)
  const sugestoes = SUGESTOES[key] ?? SUGESTOES['outro']
  const [selectedSugestao, setSelectedSugestao] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const pickSugestao = (s: string) => {
    setSelectedSugestao(s)
    onChange({ primeiraTema: s })
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Sugestões */}
      <div style={sectionSt}>
        <label style={{ ...labelSt, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Ideias para começar</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sugestoes.map((s) => {
            const sel = selectedSugestao === s
            return (
              <button key={s} type="button" onClick={() => pickSugestao(s)} style={{
                backgroundColor: S2, border: `1px solid ${sel ? A : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 10, padding: '12px 16px', cursor: 'pointer',
                textAlign: 'left', transition: 'border-color 0.15s',
              }}>
                <p style={{ fontSize: 13, color: sel ? A : T, fontFamily: ff, margin: 0, lineHeight: 1.5 }}>
                  {s}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Input principal */}
      <div style={sectionSt}>
        <label style={labelSt}>Ou escreva seu próprio tema</label>
        <FocusInput
          ref={inputRef}
          value={data.primeiraTema}
          onChange={(e) => { onChange({ primeiraTema: e.target.value }); setSelectedSugestao(null) }}
          placeholder="Ex: por que a maioria das pessoas nunca para de procrastinar"
        />
      </div>
    </div>
  )
}

// ─── Agency prompt ────────────────────────────────────────────
function AgencyPrompt({ tema, onSelf, onClient }: {
  tema: string; onSelf: () => void; onClient: () => void
}) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'center' }}>
      <div>
        <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 40, color: A, margin: '0 0 8px', letterSpacing: 2 }}>
          VOCÊ ESTÁ NA CONTA AGÊNCIA
        </h1>
        <p style={{ color: M, fontSize: 14, fontFamily: ff, margin: 0 }}>
          Quer criar conteúdo para um cliente agora?
        </p>
        <p style={{ color: 'rgba(200,255,0,0.6)', fontSize: 12, fontFamily: ff, margin: '8px 0 0' }}>
          Tema: "{tema}"
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <PrimaryBtn onClick={onSelf} style={{ width: '100%' }}>
          Criar para mim mesmo →
        </PrimaryBtn>
        <button onClick={onClient} style={{
          width: '100%', height: 48, backgroundColor: S2, border: `1px solid ${B}`,
          borderRadius: 8, color: T, fontSize: 15, fontFamily: ff, fontWeight: 600,
          cursor: 'pointer', transition: 'border-color 0.2s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = B }}>
          Criar para um cliente →
        </button>
      </div>
    </motion.div>
  )
}

// ─── Main ─────────────────────────────────────────────────────
const STEP_META = [
  { title: 'Primeiro, me conta quem você é',    subtitle: null },
  { title: 'Como você fala?',                   subtitle: 'Escolha o jeito que mais parece você.' },
  { title: 'Como é a sua cara?',                subtitle: null },
  { title: 'Me dá uma amostra da sua escrita',  subtitle: 'Cole qualquer coisa que você escreveu — post, legenda, mensagem.' },
  { title: 'Tudo pronto.',                      subtitle: 'Sobre o que vamos criar seu primeiro carrossel?' },
]

const variants = {
  enter:  (d: number) => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (d: number) => ({ x: d > 0 ? -48 : 48, opacity: 0 }),
}

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [dir, setDir] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [plan, setPlan] = useState<string>('free')
  const [agencyPrompt, setAgencyPrompt] = useState(false)
  const [sessionToken, setSessionToken] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionToken(data.session?.access_token ?? '')
    })
  }, [])

  const [form, setForm] = useState<FormData>({
    displayName: (user?.user_metadata?.full_name as string) ?? '',
    instagramHandle: '', niche: '',
    tom: '', palavrasProibidas: [], palavrasChave: [],
    cor: '#C8FF00', estilo: 'dark_cinematic', fonte: 'Bebas Neue',
    tamanhoTitulo: 'medio', posicaoTexto: 'base', intensidadeFundo: 60,
    irritacao: '', exemploTexto: '', voiceAnalysis: null, primeiraTema: '',
  })

  const update = (d: Partial<FormData>) => setForm((p) => ({ ...p, ...d }))

  // Fetch plan
  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('plan').eq('user_id', user.id).single()
      .then(({ data }) => { if (data) setPlan(data.plan as string) })
  }, [user])

  const go = (next: number) => { setDir(next > step ? 1 : -1); setStep(next) }

  const canContinue = () => {
    if (step === 1) return form.displayName.trim().length > 0 && form.niche.length > 0
    if (step === 2) return form.tom.length > 0
    if (step === 4) return form.voiceAnalysis !== null  // só avança após análise (ou skip)
    if (step === 5) return form.primeiraTema.trim().length > 0
    return true
  }

  const handleFinish = async () => {
    if (!user) return
    setSaving(true); setError('')
    try {
      const { error: dbErr } = await supabase.from('profiles').update({
        display_name: form.displayName,
        instagram_handle: form.instagramHandle || null,
        niche: form.niche,
        voice_profile: {
          tom: form.tom,
          palavras_proibidas: form.palavrasProibidas,
          palavras_chave: form.palavrasChave,
          exemplo_texto: form.exemploTexto,
          o_que_irrita: form.irritacao || null,
          ...(form.voiceAnalysis ? {
            tom_extraido: form.voiceAnalysis.tom,
            ritmo: form.voiceAnalysis.ritmo,
            personalidade: form.voiceAnalysis.personalidade,
            palavras_definidoras: form.palavrasChave,
          } : {}),
        },
        visual_kit: {
          cor: form.cor,
          estilo: form.estilo,
          fonte: form.fonte,
          tamanho_titulo: form.tamanhoTitulo,
          posicao_texto: form.posicaoTexto,
          intensidade_fundo: form.intensidadeFundo,
        },
        onboarding_completed: true,
      }).eq('user_id', user.id)

      if (dbErr) throw dbErr

      if (plan === 'agencia') {
        setAgencyPrompt(true)
      } else {
        navigate(`/studio?tema=${encodeURIComponent(form.primeiraTema.trim())}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.')
      setSaving(false)
    }
  }

  const meta = STEP_META[step - 1]
  const progress = (step / TOTAL) * 100

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px 48px' }}>
      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 520, paddingTop: 32, marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          {!agencyPrompt && (
            <span style={{ fontSize: 12, color: M, fontFamily: ff }}>Passo {step} de {TOTAL}</span>
          )}
          <span style={{ fontSize: 12, color: A, fontFamily: ff, fontWeight: 600, marginLeft: 'auto' }}>
            {agencyPrompt ? '100%' : `${Math.round(progress)}%`}
          </span>
        </div>
        <div style={{ height: 3, backgroundColor: B, borderRadius: 99 }}>
          <motion.div animate={{ width: agencyPrompt ? '100%' : `${progress}%` }} transition={{ duration: 0.4, ease: 'easeInOut' }}
            style={{ height: '100%', backgroundColor: A, borderRadius: 99 }} />
        </div>
      </div>

      {/* Card */}
      <div style={{
        backgroundColor: S, border: '1px solid rgba(200,255,0,0.15)', borderRadius: 20,
        padding: '36px 40px', width: '100%', maxWidth: 520, overflow: 'hidden',
      }}>
        {agencyPrompt ? (
          <AgencyPrompt
            tema={form.primeiraTema}
            onSelf={() => navigate(`/studio?tema=${encodeURIComponent(form.primeiraTema.trim())}`)}
            onClient={() => navigate('/agency')}
          />
        ) : (
          <>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
              {step === 5 ? (
                <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 48, color: A, margin: '0 0 8px', letterSpacing: 2, lineHeight: 1 }}>
                  {meta.title}
                </h1>
              ) : (
                <h2 style={{ fontFamily: ff, fontSize: 20, fontWeight: 700, color: T, margin: '0 0 6px', lineHeight: 1.3 }}>
                  {meta.title}
                </h2>
              )}
              {meta.subtitle && <p style={{ fontSize: 14, color: M, fontFamily: ff, margin: 0 }}>{meta.subtitle}</p>}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div key={step} custom={dir} variants={variants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22, ease: 'easeInOut' }}>
                {step === 1 && <Step1 data={form} onChange={update} />}
                {step === 2 && <Step2 data={form} onChange={update} />}
                {step === 3 && <Step3 data={form} onChange={update} />}
                {step === 4 && <Step4 data={form} onChange={update} onSkip={() => go(5)} session={sessionToken} />}
                {step === 5 && <Step5 data={form} onChange={update} />}
              </motion.div>
            </AnimatePresence>

            {error && <p style={{ color: '#f87171', fontSize: 13, fontFamily: ff, margin: '16px 0 0' }}>{error}</p>}

            {/* Navigation */}
            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              {step > 1 && (
                <button onClick={() => go(step - 1)} style={{
                  flex: 1, height: 48, background: 'none', border: `1px solid ${B}`,
                  borderRadius: 8, color: M, fontSize: 14, fontFamily: ff, cursor: 'pointer', transition: 'border-color 0.2s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = B }}>
                  ← Voltar
                </button>
              )}
              {step < TOTAL ? (
                <PrimaryBtn onClick={() => go(step + 1)} disabled={!canContinue()} style={{ flex: 2 }}>
                  Continuar →
                </PrimaryBtn>
              ) : (
                <PrimaryBtn onClick={handleFinish} disabled={!canContinue() || saving} style={{ flex: 2 }}>
                  {saving ? 'Salvando...' : 'Criar meu primeiro carrossel →'}
                </PrimaryBtn>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
