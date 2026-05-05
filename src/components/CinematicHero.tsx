import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useNavigate } from 'react-router-dom'

gsap.registerPlugin(ScrollTrigger)

// ─── tokens ──────────────────────────────────────────────────────────────────
const A = '#C8FF00'  // accent
const BG_CARD = 'linear-gradient(145deg, #0A101D 0%, #0d1a2e 100%)'

// ─── animated counter ────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1.8) {
  const elRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = elRef.current
    if (!el) return
    const obj = { val: 0 }
    gsap.to(obj, {
      val: target,
      duration,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      onUpdate: () => { el.textContent = Math.round(obj.val).toLocaleString('pt-BR') },
    })
  }, [target, duration])
  return elRef
}

// ─── progress ring ───────────────────────────────────────────────────────────
function ProgressRing({ size = 64, stroke = 4, progress = 0.78 }: { size?: number; stroke?: number; progress?: number }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const ringRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    if (!ringRef.current) return
    gsap.fromTo(ringRef.current,
      { strokeDashoffset: circ },
      {
        strokeDashoffset: circ * (1 - progress),
        duration: 1.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: ringRef.current, start: 'top 85%', once: true },
      }
    )
  }, [circ, progress])

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(200,255,0,0.12)" strokeWidth={stroke} />
      <circle
        ref={ringRef}
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={A}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ}
        style={{ filter: 'drop-shadow(0 0 6px rgba(200,255,0,0.6))' }}
      />
    </svg>
  )
}

// ─── phone mockup ─────────────────────────────────────────────────────────────
function EditorPhone() {
  return (
    <div style={{
      width: '220px',
      background: '#0a0a0a',
      border: '6px solid #1c1c1c',
      borderRadius: '36px',
      overflow: 'hidden',
      boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* notch */}
      <div style={{
        position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
        width: '60px', height: '5px', borderRadius: '3px',
        background: 'rgba(255,255,255,0.08)', zIndex: 10,
      }} />

      {/* slide area */}
      <div style={{
        width: '100%',
        aspectRatio: '4/5',
        background: 'linear-gradient(160deg, #060d14 0%, #0d1f30 100%)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '20px 16px',
        boxSizing: 'border-box',
      }}>
        {/* decorative accent line */}
        <div style={{
          position: 'absolute', top: '20px', left: '16px', right: '16px',
          height: '2px',
          background: `linear-gradient(90deg, ${A}, transparent)`,
          borderRadius: '1px',
        }} />

        {/* title text */}
        <p style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: '20px',
          lineHeight: 1.1,
          letterSpacing: '1px',
          color: '#F5F5F5',
          margin: '0 0 8px',
        }}>
          SEU CONTEÚDO VIRAL
        </p>
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '9px',
          color: 'rgba(255,255,255,0.5)',
          lineHeight: 1.5,
          margin: 0,
        }}>
          Gerado pela IA em 30 segundos.
        </p>

        {/* @perfil badge */}
        <div style={{
          position: 'absolute', bottom: '20px', right: '12px',
          display: 'flex', alignItems: 'center', gap: '5px',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
          borderRadius: '20px',
          padding: '4px 8px',
          border: '1px solid rgba(255,255,255,0.12)',
        }}>
          <div style={{
            width: '16px', height: '16px', borderRadius: '50%',
            background: A, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#000',
          }}>@</div>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '9px', color: '#fff', fontWeight: 600 }}>
            perfil
          </span>
        </div>

        {/* branding */}
        <div style={{
          position: 'absolute', top: '12px', right: '12px',
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: '9px', letterSpacing: '1px',
          color: A, opacity: 0.6,
        }}>
          ConteúdOS
        </div>
      </div>

      {/* bottom bar */}
      <div style={{
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: '8px',
        background: '#0e0e0e',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <ProgressRing size={32} stroke={3} progress={0.82} />
        <div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '9px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
            Score viral
          </div>
          <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '14px', color: A, lineHeight: 1 }}>
            82%
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── floating badge ───────────────────────────────────────────────────────────
function FloatingBadge({ label, top, left, right, delay = 0 }: {
  label: string; top?: string; left?: string; right?: string; delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(ref.current,
      { opacity: 0, y: 12 },
      {
        opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: ref.current, start: 'top 90%', once: true },
        delay,
      }
    )
    // gentle float loop
    gsap.to(ref.current, {
      y: -6, repeat: -1, yoyo: true, duration: 2.5 + delay,
      ease: 'sine.inOut', delay: 0.6 + delay,
    })
  }, [delay])

  return (
    <div ref={ref} style={{
      position: 'absolute',
      top, left, right,
      background: 'rgba(10,16,29,0.9)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(200,255,0,0.2)',
      borderRadius: '24px',
      padding: '6px 14px',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '11px',
      fontWeight: 600,
      color: A,
      whiteSpace: 'nowrap',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      opacity: 0,
    }}>
      {label}
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────
interface CinematicHeroProps {
  tagline1: string
  tagline2: string
  cardHeading: string
  cardDescription: string
  metricValue: number
  metricLabel: string
  ctaHeading: string
  ctaDescription: string
}

export function CinematicHero({
  tagline1,
  tagline2,
  cardHeading,
  cardDescription,
  metricValue,
  metricLabel,
  ctaHeading,
  ctaDescription,
}: CinematicHeroProps) {
  const navigate = useNavigate()
  const sectionRef = useRef<HTMLElement>(null)
  const tag1Ref = useRef<HTMLDivElement>(null)
  const tag2Ref = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)
  const countRef = useCountUp(metricValue)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // taglines enter
      gsap.fromTo([tag1Ref.current, tag2Ref.current],
        { opacity: 0, x: -40 },
        { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out', stagger: 0.15 }
      )
      // card slides up
      gsap.fromTo(cardRef.current,
        { opacity: 0, y: 32 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.3 }
      )
      // phone parallax on scroll
      if (phoneRef.current && sectionRef.current) {
        gsap.to(phoneRef.current, {
          y: -40,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      style={{
        width: '100%',
        minHeight: '100vh',
        background: '#050505',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* radial glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 70% 50%, rgba(200,255,0,0.04) 0%, transparent 70%)',
      }} />

      <div style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '120px 24px 80px',
        boxSizing: 'border-box',
        display: 'grid',
        gridTemplateColumns: '55fr 45fr',
        gap: '64px',
        alignItems: 'center',
      }}>

        {/* ── LEFT ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* taglines */}
          <div>
            <div ref={tag1Ref} style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 'clamp(56px, 7vw, 96px)',
              lineHeight: 1.0,
              letterSpacing: '2px',
              color: '#F5F5F5',
              opacity: 0,
            }}>
              {tagline1}
            </div>
            <div ref={tag2Ref} style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 'clamp(56px, 7vw, 96px)',
              lineHeight: 1.0,
              letterSpacing: '2px',
              color: A,
              opacity: 0,
            }}>
              {tagline2}
            </div>
          </div>

          {/* info card */}
          <div ref={cardRef} style={{
            background: BG_CARD,
            border: '1px solid rgba(200,255,0,0.12)',
            borderRadius: '16px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            opacity: 0,
          }}>
            <div>
              <p style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: '22px',
                letterSpacing: '1px',
                color: '#F5F5F5',
                margin: '0 0 8px',
              }}>
                {cardHeading}
              </p>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '15px',
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.65,
                margin: 0,
              }}>
                {cardDescription}
              </p>
            </div>

            {/* metric */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ProgressRing size={44} stroke={3} progress={0.78} />
              <div>
                <div style={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: '28px',
                  color: A,
                  lineHeight: 1,
                }}>
                  <span ref={countRef}>0</span>
                  <span>+</span>
                </div>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                }}>
                  {metricLabel}
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: '20px',
              letterSpacing: '1px',
              color: '#F5F5F5',
              margin: 0,
            }}>
              {ctaHeading}
            </p>
            <p style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.4)',
              margin: 0,
              lineHeight: 1.5,
            }}>
              {ctaDescription}
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
              <button
                onClick={() => navigate('/auth')}
                style={{
                  background: A,
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  letterSpacing: '0.3px',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = `0 8px 24px rgba(200,255,0,0.35)`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              >
                Começar grátis →
              </button>
              <button
                onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
                }}
              >
                Ver planos
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div ref={phoneRef} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          minHeight: '480px',
        }}>
          {/* glow behind phone */}
          <div style={{
            position: 'absolute',
            width: '300px', height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,255,0,0.07) 0%, transparent 70%)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }} />

          <EditorPhone />

          {/* floating badges */}
          <FloatingBadge label="✦ Copy gerada por IA" top="10%" left="-8%" delay={0.2} />
          <FloatingBadge label="↓ 1.2k salvamentos" top="72%" right="-6%" delay={0.5} />
        </div>
      </div>
    </section>
  )
}
