import { useEffect, useRef } from 'react'

const FAKE_SLIDES = [
  { num: '01', title: 'O ERRO QUE TRAVA 90% DOS PERFIS', accent: '#00D4FF' },
  { num: '02', title: 'VOCÊ POSTA PRA FANTASMA', accent: '#6366F1' },
  { num: '03', title: 'META ADS NÃO ESTÁ MORRENDO', accent: '#00D4FF' },
  { num: '04', title: 'A DECISÃO QUE QUEBROU 3 NEGÓCIOS', accent: '#C8FF00' },
  { num: '05', title: 'ALGORITMO NÃO É SEU INIMIGO', accent: '#6366F1' },
  { num: '06', title: 'CONTEÚDO SEM ESTRATÉGIA É RUÍDO', accent: '#00D4FF' },
  { num: '07', title: 'QUEM DOMINA O JOGO NÃO POSTA', accent: '#C8FF00' },
  { num: '08', title: 'A CONTA DE QUEM NÃO ENTENDE', accent: '#6366F1' },
  { num: '09', title: 'VIRALIZAR NÃO É SORTE', accent: '#00D4FF' },
  { num: '10', title: 'SEU FEED É SUA REPUTAÇÃO', accent: '#C8FF00' },
  { num: '11', title: 'IA NÃO SUBSTITUI ESTRATÉGIA', accent: '#6366F1' },
  { num: '12', title: 'O TABULEIRO QUE POUCOS VEEM', accent: '#00D4FF' },
]

export function TabuleiroBg() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      const cards = containerRef.current.querySelectorAll<HTMLElement>('.tcard')
      cards.forEach((card, i) => {
        const depth = 0.3 + (i % 3) * 0.25
        const tx = x * 30 * depth
        const ty = y * 20 * depth
        card.style.transform = `translate(${tx}px, ${ty}px)`
      })
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        zIndex: 0, pointerEvents: 'none',
      }}
    >
      {/* Grid lines */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
      }} />

      {/* Slide cards */}
      {FAKE_SLIDES.map((s, i) => {
        const col = i % 4
        const row = Math.floor(i / 4)
        return (
          <div
            key={i}
            className="tcard"
            style={{
              position: 'absolute',
              left: `${8 + col * 24}%`,
              top: `${5 + row * 32}%`,
              width: 140,
              background: 'rgba(6,14,31,0.85)',
              border: `1px solid ${s.accent}22`,
              borderRadius: 10,
              padding: '10px 12px',
              backdropFilter: 'blur(4px)',
              transition: 'transform 0.4s cubic-bezier(.25,.46,.45,.94)',
              opacity: 0.55 + (i % 3) * 0.15,
            }}
          >
            <div style={{ fontSize: 10, color: s.accent, fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.12em', marginBottom: 4 }}>
              SLIDE {s.num}
            </div>
            <div style={{ fontSize: 11, color: '#fff', fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1.2, letterSpacing: '0.04em' }}>
              {s.title}
            </div>
            <div style={{ marginTop: 8, height: 2, background: s.accent, borderRadius: 1, opacity: 0.6, width: '60%' }} />
          </div>
        )
      })}

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(1,8,22,0.85) 80%)',
      }} />
    </div>
  )
}
