import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── tokens (mesma paleta da landing) ────────────────────────────────────────
const C1 = '#00D4FF'
const C2 = '#6366F1'
const C3 = '#C8FF00'
const FF = '"Bebas Neue", sans-serif'

// ─── roteiro da demo — simula o pipeline real do ConteúdOS ───────────────────
type Take = {
  tema: string
  titulo: string
  corpoPreview: string
  destaque: string
  bg: string
}

const TAKES: Take[] = [
  {
    tema: 'o erro que trava 90% dos criadores',
    titulo: 'VOCÊ NÃO TEM\nUM PROBLEMA DE CONTEÚDO',
    corpoPreview: 'Você tem um problema de **estratégia**. Postar sem tabuleiro é gritar no vazio.',
    destaque: 'estratégia',
    bg: 'linear-gradient(135deg,#1a2f1a 0%,#0d1a0d 60%)',
  },
  {
    tema: 'como crescer no instagram em 2026',
    titulo: 'PARE DE\nIMPROVISAR POSTS',
    corpoPreview: 'Os perfis que escalam têm **sequência**. Cada carrossel puxa o próximo — por design.',
    destaque: 'sequência',
    bg: 'linear-gradient(135deg,#1a1f3a 0%,#0d0e1f 60%)',
  },
  {
    tema: 'rotina de quem vive de conteúdo',
    titulo: 'CONSISTÊNCIA\nNÃO É SORTE',
    corpoPreview: 'É **sistema**. Você decide o tema, a IA monta o resto — copy, imagem, slide.',
    destaque: 'sistema',
    bg: 'linear-gradient(135deg,#3a1a2f 0%,#1f0d18 60%)',
  },
]

// ─── máquina de estados da demo ──────────────────────────────────────────────
// 0 digitando tema → 1 IA escrevendo copy → 2 gerando imagem → 3 slide pronto → 4 carrossel completo
const STEP_DURATIONS = [2200, 2400, 1800, 2000, 2600]

function useTypewriter(text: string, active: boolean, speed = 38) {
  const [out, setOut] = useState('')
  useEffect(() => {
    if (!active) { setOut(''); return }
    let i = 0
    setOut('')
    const id = setInterval(() => {
      i++
      setOut(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text, active, speed])
  return out
}

function renderCorpo(corpo: string, _destaque: string) {
  // troca **palavra** pelo span destacado, igual ao Studio
  const parts = corpo.split(/\*\*(.+?)\*\*/g)
  return parts.map((p, i) =>
    i % 2 === 1
      ? <span key={i} style={{ color: C3, fontWeight: 700 }}>{p}</span>
      : <span key={i}>{p}</span>
  )
}

export function LiveCarouselDemo() {
  const [takeIdx, setTakeIdx]   = useState(0)
  const [step, setStep]         = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const take = TAKES[takeIdx]
  const temaTyped  = useTypewriter(take.tema, step === 0, 42)
  const tituloTyped = useTypewriter(take.titulo, step === 1, 34)

  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    const advance = (s: number) => {
      const t = setTimeout(() => {
        if (s < 4) setStep(s + 1)
        else { setStep(0); setTakeIdx(i => (i + 1) % TAKES.length) }
      }, STEP_DURATIONS[s])
      timers.current.push(t)
    }
    advance(step)
    return () => timers.current.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, takeIdx])

  const STAGE_LABELS = [
    'Você descreve o tema',
    'A IA escreve a copy',
    'A IA gera a imagem',
    'O slide fica pronto',
    'Carrossel completo',
  ]

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 480, margin: '0 auto' }}>
      {/* card do app */}
      <div style={{
        position: 'relative',
        background: 'rgba(6,14,31,0.92)',
        border: '1px solid rgba(0,212,255,0.22)',
        borderRadius: 18,
        backdropFilter: 'blur(14px)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
        overflow: 'hidden',
      }}>
        {/* barra do app */}
        <div style={{
          height: 38, background: 'rgba(0,212,255,0.06)', borderBottom: '1px solid rgba(0,212,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px',
        }}>
          <div style={{ display: 'flex', gap: 5 }}>
            <span style={dotStyle} /><span style={dotStyle} /><span style={dotStyle} />
          </div>
          <span style={{ fontSize: 10, color: 'rgba(0,212,255,0.65)', fontFamily: FF, letterSpacing: '.12em' }}>
            CONTEÚDOS · STUDIO · AO VIVO
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C3, boxShadow: `0 0 8px ${C3}`, animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,.5)' }}>gerando</span>
          </div>
        </div>

        {/* palco da demo */}
        <div style={{ padding: 18, minHeight: 360, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <AnimatePresence mode="wait">

            {/* 0 — digitando tema */}
            {step === 0 && (
              <motion.div key="step0" {...fade}>
                <Label>1 · TEMA DO CARROSSEL</Label>
                <div style={inputBox}>
                  <span style={{ color: 'rgba(255,255,255,.92)', fontSize: 14 }}>{temaTyped}</span>
                  <span style={cursor} />
                </div>
                <p style={hintTxt}>A IA entende contexto e tom — sem prompt técnico.</p>
              </motion.div>
            )}

            {/* 1 — IA escrevendo copy */}
            {step === 1 && (
              <motion.div key="step1" {...fade}>
                <Label>2 · COPY GERADA PELA IA</Label>
                <div style={{ ...slideCard, background: take.bg }}>
                  <div style={slideOverlay} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <span style={slideTag}>SLIDE 01</span>
                    <h4 style={{ ...slideTitle, whiteSpace: 'pre-line' }}>{tituloTyped}<span style={cursor} /></h4>
                  </div>
                </div>
                <p style={hintTxt}>Título, corpo e legenda — calibrados pra prender o scroll.</p>
              </motion.div>
            )}

            {/* 2 — gerando imagem */}
            {step === 2 && (
              <motion.div key="step2" {...fade}>
                <Label>3 · IMAGEM CINEMATOGRÁFICA</Label>
                <div style={{ ...slideCard, background: '#0B1528', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={shimmerBg} />
                  <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    <div style={spinnerRing} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', marginTop: 10, display: 'block' }}>fal.ai Flux 2 Pro renderizando…</span>
                  </div>
                </div>
                <p style={hintTxt}>Composição pensada pra deixar espaço limpo pro texto.</p>
              </motion.div>
            )}

            {/* 3 — slide pronto */}
            {step === 3 && (
              <motion.div key="step3" {...fade}>
                <Label>4 · SLIDE MONTADO</Label>
                <div style={{ ...slideCard, background: take.bg }}>
                  <div style={slideOverlay} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <span style={slideTag}>SLIDE 01</span>
                    <h4 style={{ ...slideTitle, whiteSpace: 'pre-line' }}>{take.titulo}</h4>
                    <p style={slideBody}>{renderCorpo(take.corpoPreview, take.destaque)}</p>
                    <span style={{ display: 'inline-block', marginTop: 10, width: 34, height: 2, background: C1, borderRadius: 1 }} />
                  </div>
                </div>
                <p style={hintTxt}>Pronto pro Studio — ajuste fonte, cor e posição se quiser.</p>
              </motion.div>
            )}

            {/* 4 — carrossel completo */}
            {step === 4 && (
              <motion.div key="step4" {...fade}>
                <Label>5 · CARROSSEL PRONTO PRA POSTAR</Label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 14, scale: .92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: i * 0.16, duration: .45, ease: 'easeOut' }}
                      style={{ ...miniSlide, background: take.bg }}
                    >
                      <div style={slideOverlay} />
                      <span style={{ position: 'relative', zIndex: 1, fontSize: 7, color: 'rgba(255,255,255,.4)' }}>SLIDE 0{i + 1}</span>
                      <span style={{ position: 'relative', zIndex: 1, width: '60%', height: 1.5, background: i === 1 ? C3 : C1, borderRadius: 1, marginTop: 'auto' }} />
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                  style={downloadBar}
                >
                  ✦ 10 SLIDES · ZIP PRONTO PRA BAIXAR
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* trilho de progresso das 5 etapas */}
        <div style={{ display: 'flex', gap: 4, padding: '0 18px 16px' }}>
          {STAGE_LABELS.map((_, i) => (
            <span key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= step ? `linear-gradient(90deg, ${C1}, ${C2})` : 'rgba(255,255,255,.07)',
              transition: 'background .4s ease',
            }} />
          ))}
        </div>
      </div>

      {/* legenda da etapa atual — flutuante */}
      <div style={{
        position: 'absolute', top: -16, left: -14,
        background: 'rgba(6,14,31,0.92)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 10,
        padding: '7px 12px', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: 7,
        boxShadow: '0 10px 30px rgba(0,0,0,.4)',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: C1, boxShadow: `0 0 8px ${C1}`, animation: 'pulse 2s infinite' }} />
        <AnimatePresence mode="wait">
          <motion.span
            key={step}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            style={{ fontSize: 11, color: 'rgba(255,255,255,.85)', fontWeight: 500 }}
          >
            {STAGE_LABELS[step]}
          </motion.span>
        </AnimatePresence>
      </div>

      <div style={{
        position: 'absolute', bottom: -14, right: -12,
        background: 'rgba(6,14,31,0.92)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10,
        padding: '7px 12px', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: 6,
        boxShadow: '0 10px 30px rgba(0,0,0,.4)',
      }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.85)', fontWeight: 500 }}>⏱ tudo isso em ~3 min</span>
      </div>
    </div>
  )
}

// ─── sub-bits ─────────────────────────────────────────────────────────────────
function Label({ children }: { children: string }) {
  return <div style={{ fontSize: 10, color: C1, letterSpacing: '.14em', marginBottom: 10, fontWeight: 700 }}>{children}</div>
}

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
  transition: { duration: 0.35, ease: 'easeOut' as const },
}

const dotStyle: React.CSSProperties = { width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'inline-block' }

const inputBox: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, minHeight: 44,
  background: 'rgba(255,255,255,.04)', border: '1px solid rgba(0,212,255,.2)', borderRadius: 10,
  padding: '12px 14px',
}

const cursor: React.CSSProperties = {
  display: 'inline-block', width: 2, height: 14, background: C1, marginLeft: 2, verticalAlign: 'middle',
  animation: 'blink 1s step-end infinite',
}

const hintTxt: React.CSSProperties = { fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 12, lineHeight: 1.5 }

const slideCard: React.CSSProperties = {
  position: 'relative', borderRadius: 12, padding: 16, minHeight: 220,
  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden',
  border: '1px solid rgba(255,255,255,.08)',
}

const slideOverlay: React.CSSProperties = {
  position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,.55), transparent 60%)',
}

const slideTag: React.CSSProperties = { fontSize: 9, color: 'rgba(255,255,255,.4)', letterSpacing: '.1em', display: 'block', marginBottom: 6 }
const slideTitle: React.CSSProperties = { fontFamily: FF, fontSize: 22, lineHeight: 1.05, color: '#fff', letterSpacing: '.02em', margin: 0 }
const slideBody: React.CSSProperties = { fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,.8)', marginTop: 8, maxWidth: 280 }

const miniSlide: React.CSSProperties = {
  position: 'relative', aspectRatio: '4/5', borderRadius: 8, overflow: 'hidden',
  border: '1px solid rgba(255,255,255,.08)', display: 'flex', flexDirection: 'column', padding: 8,
}

const downloadBar: React.CSSProperties = {
  marginTop: 12, background: `linear-gradient(135deg, ${C1}, ${C2})`, borderRadius: 8, padding: '10px',
  textAlign: 'center', fontSize: 11, fontFamily: FF, letterSpacing: '.08em', color: '#000', fontWeight: 700,
}

const shimmerBg: React.CSSProperties = {
  position: 'absolute', inset: 0,
  background: 'linear-gradient(120deg, rgba(0,212,255,.08) 25%, rgba(99,102,241,.16) 50%, rgba(0,212,255,.08) 75%)',
  backgroundSize: '200% 100%', animation: 'shimmerMove 1.6s linear infinite',
}

const spinnerRing: React.CSSProperties = {
  width: 30, height: 30, borderRadius: '50%', margin: '0 auto',
  border: '2px solid rgba(0,212,255,.18)', borderTopColor: C1, animation: 'spin 1s linear infinite',
}
