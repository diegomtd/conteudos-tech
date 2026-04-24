import { AnimatePresence, type Variants, motion } from 'framer-motion'
import {
  Calendar,
  Check,
  Download,
  Layout,
  Sliders,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { CSSProperties, ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Accordion } from '@/components/ui/Accordion'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { Badge } from '@/components/ui/Badge'
import { FeatureCard } from '@/components/ui/FeatureCard'
import { GlowButton } from '@/components/ui/GlowButton'
import { SectionWrapper } from '@/components/ui/SectionWrapper'

// ─── tokens ──────────────────────────────────────────────────────────────────
const T = {
  accent: '#C8FF00',
  cyan: '#00B4D8',
  text: '#F5F5F5',
  muted: 'rgba(255,255,255,0.45)',
  border: 'rgba(255,255,255,0.08)',
  bg: '#050D14',
} as const

// ─── animation variants ───────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.0, 0.0, 0.2, 1.0], delay: i * 0.15 },
  }),
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function FadeUp({ children, i = 0 }: { children: ReactNode; i?: number }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      custom={i}
    >
      {children}
    </motion.div>
  )
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const navigate = useNavigate()

  const navStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '64px',
    zIndex: 50,
    background: 'rgba(8,8,8,0.9)',
    backdropFilter: 'blur(12px)',
    borderBottom: `1px solid rgba(255,255,255,0.06)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    boxSizing: 'border-box',
  }

  const innerStyle: CSSProperties = {
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }

  const logoStyle: CSSProperties = {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '24px',
    letterSpacing: '2px',
    color: T.text,
    cursor: 'pointer',
    userSelect: 'none',
  }

  const linksStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
  }

  const linkStyle: CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '14px',
    color: T.muted,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    transition: 'color 150ms ease-out',
    textDecoration: 'none',
  }

  return (
    <nav style={navStyle}>
      <div style={innerStyle}>
        <span style={logoStyle} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Conteúd<span style={{ color: T.accent }}>OS</span>
        </span>

        <div style={linksStyle}>
          <motion.button
            style={linkStyle}
            whileHover={{ color: T.text }}
            onClick={() => scrollTo('como-funciona')}
          >
            Como funciona
          </motion.button>
          <motion.button
            style={linkStyle}
            whileHover={{ color: T.text }}
            onClick={() => scrollTo('planos')}
          >
            Preços
          </motion.button>
          <motion.button
            style={linkStyle}
            whileHover={{ color: T.text }}
            onClick={() => navigate('/auth')}
          >
            Login
          </motion.button>
          <GlowButton variant="primary" size="sm" onClick={() => navigate('/auth')}>
            Começar grátis
          </GlowButton>
        </div>
      </div>
    </nav>
  )
}

// ─── Carousel Mockup ─────────────────────────────────────────────────────────
const SLIDES = [
  {
    bg: 'linear-gradient(160deg, #060d14, #0d1f30)',
    title: 'VOCÊ NÃO É PREGUIÇOSO.',
    titleSize: '28px',
    body: 'Você está travado por um motivo que ninguém te ensinou.',
  },
  {
    bg: 'linear-gradient(160deg, #080c1a, #0f1e4a)',
    title: 'O ALGORITMO NÃO FAVORECE QUEM POSTA MAIS.',
    titleSize: '24px',
    body: 'Favorece quem para o scroll.',
  },
  {
    bg: 'linear-gradient(160deg, #0a0814, #1a0f2e)',
    title: '3 TIPOS DE POST QUE GERAM SALVAMENTO.',
    titleSize: '24px',
    body: 'E o primeiro é o que 90% das pessoas ignoram.',
  },
]

function PhoneMockup() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length)
    }, 2500)
    return () => clearInterval(timer)
  }, [])

  const phoneStyle: CSSProperties = {
    width: '300px',
    border: '8px solid #1A1A1A',
    borderRadius: '44px',
    overflow: 'hidden',
    boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
    position: 'relative',
    background: '#0a0a0a',
    flexShrink: 0,
  }

  const slideStyle = (bg: string): CSSProperties => ({
    width: '100%',
    height: '460px',
    background: bg,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    padding: '32px 24px',
    boxSizing: 'border-box',
    position: 'relative',
  })

  const dotRowStyle: CSSProperties = {
    display: 'flex',
    gap: '6px',
    justifyContent: 'center',
    padding: '12px 0 8px',
    background: '#0a0a0a',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>
      <div style={phoneStyle}>
        {/* notch */}
        <div style={{
          position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
          width: '80px', height: '6px', borderRadius: '3px',
          background: 'rgba(255,255,255,0.08)', zIndex: 10,
        }} />

        <div style={{ position: 'relative', height: '460px', overflow: 'hidden' }}>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={current}
              style={slideStyle(SLIDES[current].bg)}
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* decorative line */}
              <div style={{
                position: 'absolute', top: '32px', left: '24px', right: '24px',
                height: '2px', background: `linear-gradient(90deg, ${T.accent}, transparent)`,
                borderRadius: '1px',
              }} />

              <p style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: SLIDES[current].titleSize,
                lineHeight: 1.1,
                letterSpacing: '1px',
                color: '#F5F5F5',
                margin: '0 0 12px',
              }}>
                {SLIDES[current].title}
              </p>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.6,
                margin: 0,
              }}>
                {SLIDES[current].body}
              </p>

              {/* branding chip */}
              <div style={{
                position: 'absolute', top: '16px', right: '16px',
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: '11px', letterSpacing: '1px',
                color: T.accent, opacity: 0.7,
              }}>
                ConteúdOS
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* dot indicators inside phone */}
        <div style={dotRowStyle}>
          {SLIDES.map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: i === current ? '18px' : '6px', opacity: i === current ? 1 : 0.3 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              style={{
                height: '6px',
                borderRadius: '3px',
                background: T.accent,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const navigate = useNavigate()

  const sectionStyle: CSSProperties = {
    width: '100%',
    background: '#080808',
    paddingTop: '128px',
    paddingBottom: '96px',
  }

  const innerStyle: CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    paddingLeft: '24px',
    paddingRight: '24px',
    boxSizing: 'border-box',
    display: 'grid',
    gridTemplateColumns: '55fr 45fr',
    gap: '64px',
    alignItems: 'center',
  }

  const leftStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  }

  const headlineStyle: CSSProperties = {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: 'clamp(56px, 7vw, 88px)',
    lineHeight: 1.0,
    letterSpacing: '2px',
    margin: 0,
  }

  const gradientStyle: CSSProperties = {
    background: `linear-gradient(90deg, ${T.accent}, ${T.cyan})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  }

  const subtitleStyle: CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '18px',
    color: T.muted,
    lineHeight: 1.7,
    maxWidth: '480px',
    margin: 0,
  }

  const checkItemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '13px',
    color: T.muted,
  }

  const dotStyle: CSSProperties = {
    color: 'rgba(255,255,255,0.2)',
    fontSize: '14px',
  }

  const rightStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  }

  const glowStyle: CSSProperties = {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(200,255,0,0.08) 0%, transparent 70%)',
    filter: 'blur(40px)',
    pointerEvents: 'none',
  }

  const easeOut = [0.0, 0.0, 0.2, 1.0] as const

  return (
    <section style={sectionStyle}>
      <div style={innerStyle}>
        {/* left column */}
        <div style={leftStyle}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOut, delay: 0 }}
          >
            <Badge variant="accent">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={12} />
                Laboratório de viralidade com IA
              </span>
            </Badge>
          </motion.div>

          <motion.h1
            style={headlineStyle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOut, delay: 0.15 }}
          >
            <span style={{ color: T.text, display: 'block' }}>PARE DE PERDER TEMPO</span>
            <span style={gradientStyle}>NO CANVA.</span>
          </motion.h1>

          <motion.p
            style={subtitleStyle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOut, delay: 0.3 }}
          >
            Cole um tema ou link viral. A IA decodifica os hacks psicológicos usados e recria na sua voz em menos de 30 segundos.
          </motion.p>

          <motion.div
            style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOut, delay: 0.45 }}
          >
            <GlowButton variant="primary" size="lg" onClick={() => navigate('/auth')}>
              Criar meu primeiro carrossel →
            </GlowButton>
            <GlowButton variant="secondary" size="lg" onClick={() => scrollTo('como-funciona')}>
              Ver demo
            </GlowButton>
          </motion.div>

          <motion.div
            style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOut, delay: 0.6 }}
          >
            {['Sem cartão de crédito', 'Primeiro carrossel grátis', 'Cancele quando quiser'].map(
              (label, i) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={checkItemStyle}>
                    <Check size={12} color={T.accent} strokeWidth={2.5} />
                    {label}
                  </span>
                  {i < 2 && <span style={dotStyle}>·</span>}
                </span>
              )
            )}
          </motion.div>
        </div>

        {/* right column */}
        <motion.div
          style={rightStyle}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: easeOut, delay: 0.3 }}
        >
          <div style={glowStyle} />
          <PhoneMockup />
        </motion.div>
      </div>
    </section>
  )
}

// ─── Stats strip ─────────────────────────────────────────────────────────────
function StatsStrip() {
  const stripStyle: CSSProperties = {
    background: '#0A0A0A',
    borderTop: `1px solid ${T.border}`,
    borderBottom: `1px solid ${T.border}`,
    padding: '40px 24px',
  }

  const innerStyle: CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
    alignItems: 'center',
    gap: '0',
  }

  const statStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '0 32px',
  }

  const numberStyle: CSSProperties = {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '48px',
    lineHeight: 1.0,
    letterSpacing: '2px',
    color: T.accent,
  }

  const labelStyle: CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '13px',
    color: T.muted,
    textAlign: 'center',
  }

  const dividerStyle: CSSProperties = {
    width: '1px',
    height: '48px',
    background: T.border,
    alignSelf: 'center',
  }

  return (
    <div style={stripStyle}>
      <div style={innerStyle}>
        <div style={statStyle}>
          <span style={numberStyle}>
            <AnimatedCounter value={49} suffix="+" />
          </span>
          <span style={labelStyle}>carrosseis criados</span>
        </div>
        <div style={dividerStyle} />
        <div style={statStyle}>
          <span style={numberStyle}>
            <AnimatedCounter value={30} suffix="s" />
          </span>
          <span style={labelStyle}>para gerar</span>
        </div>
        <div style={dividerStyle} />
        <div style={statStyle}>
          <span style={numberStyle}>
            <AnimatedCounter value={6} />
          </span>
          <span style={labelStyle}>templates virais</span>
        </div>
      </div>
    </div>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: <Zap size={20} />,
      title: 'Cole o tema ou link',
      description:
        'Digite o tema ou cole um link do YouTube, Instagram ou TikTok. O sistema extrai o que está gerando engajamento.',
    },
    {
      number: '02',
      icon: <Sparkles size={20} />,
      title: 'A IA decodifica e cria',
      description:
        'Analisa os hacks psicológicos do conteúdo e gera copy calibrada na sua voz, sem conectivos de IA nem clichês.',
    },
    {
      number: '03',
      icon: <Download size={20} />,
      title: 'Edite e exporte em HD',
      description:
        'Ajuste fontes, cores e imagens no editor. Exporte em 1080px pronto para postar, sem marca d\'água no plano pago.',
    },
  ]

  const titleStyle: CSSProperties = {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: 'clamp(32px, 4vw, 48px)',
    color: T.text,
    letterSpacing: '2px',
    textAlign: 'center',
    margin: '0 0 64px',
  }

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  }

  return (
    <SectionWrapper id="como-funciona" background="surface" paddingY={96}>
      <FadeUp>
        <h2 style={titleStyle}>De uma ideia a um carrossel viral</h2>
      </FadeUp>

      <div style={gridStyle}>
        {steps.map((step, i) => (
          <FadeUp key={step.number} i={i}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: '64px',
                  lineHeight: 1,
                  color: T.accent,
                  opacity: 0.25,
                  position: 'absolute',
                  top: '-8px',
                  left: '16px',
                  letterSpacing: '2px',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                {step.number}
              </div>
              <FeatureCard
                icon={step.icon}
                title={step.title}
                description={step.description}
                accentColor={T.accent}
              />
            </div>
          </FadeUp>
        ))}
      </div>
    </SectionWrapper>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    { icon: <Layout size={20} />, title: '6 templates virais', description: 'Layouts testados em nichos como marketing, saúde e negócios. Cada template segue padrões comprovados de retenção.' },
    { icon: <Sparkles size={20} />, title: 'Imagem IA de fundo', description: 'Gere imagens de fundo personalizadas com IA sem sair do editor. Cada slide com visual único e coerente.' },
    { icon: <Sliders size={20} />, title: 'Editor completo', description: 'Controle total sobre fontes, cores, espaçamentos e camadas. Sem limitações de template rígido.' },
    { icon: <Download size={20} />, title: 'Export HD 1080px', description: 'Baixe cada slide em 1080×1080px ou como ZIP pronto para agendar. Resolução máxima sem custo extra.' },
    { icon: <TrendingUp size={20} />, title: 'Análise viral', description: 'Receba um score de viralidade antes de publicar. O sistema identifica o gatilho psicológico de cada slide.' },
    { icon: <Calendar size={20} />, title: 'Calendário de posts', description: 'Visualize e organize todos os seus carrosseis por semana. Planejamento visual integrado ao Studio.' },
  ]

  const titleStyle: CSSProperties = {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: 'clamp(28px, 4vw, 40px)',
    color: T.text,
    letterSpacing: '2px',
    margin: '0 0 8px',
  }

  const subtitleStyle: CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '16px',
    color: T.muted,
    lineHeight: 1.6,
    margin: '0 0 64px',
    maxWidth: '480px',
  }

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  }

  return (
    <SectionWrapper background="dark" paddingY={96}>
      <FadeUp>
        <h2 style={titleStyle}>Tudo que você precisa para viralizar</h2>
        <p style={subtitleStyle}>Sem plugins externos, sem Canva, sem perder horas em design.</p>
      </FadeUp>

      <div style={gridStyle}>
        {features.map((f, i) => (
          <FadeUp key={f.title} i={i % 3}>
            <FeatureCard
              icon={f.icon}
              title={f.title}
              description={f.description}
              accentColor={i % 2 === 0 ? T.accent : T.cyan}
            />
          </FadeUp>
        ))}
      </div>
    </SectionWrapper>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  const testimonials = [
    {
      text: 'Levava 2 horas pra fazer um carrossel no Canva. Agora faço em 3 minutos e o engajamento dobrou. A IA captura meu jeito de escrever de um jeito que nenhuma outra ferramenta conseguiu.',
      name: 'Marina Caldas',
      niche: 'Marketing digital',
      initials: 'MC',
      color: T.accent,
    },
    {
      text: 'Uso no nicho de saúde e funciona demais. O copy sai direto, sem aquelas frases de robô. Já tive 3 carrosseis passando de 10 mil compartilhamentos nos últimos 30 dias.',
      name: 'Dr. Rafael Souza',
      niche: 'Nutricionista',
      initials: 'RS',
      color: T.cyan,
    },
    {
      text: 'Tinha medo de ferramenta de IA porque sempre saía texto genérico. O ConteudOS é diferente — ele pega o hook do concorrente e reescreve no meu tom. Virou parte da minha rotina.',
      name: 'Juliana Ferraz',
      niche: 'Empreendedorismo',
      initials: 'JF',
      color: '#FF6B2B',
    },
  ]

  const titleStyle: CSSProperties = {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: 'clamp(28px, 4vw, 40px)',
    color: T.text,
    letterSpacing: '2px',
    textAlign: 'center',
    margin: '0 0 64px',
  }

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  }

  const cardStyle: CSSProperties = {
    background: '#0F0F0F',
    border: `1px solid ${T.border}`,
    borderRadius: '12px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  }

  const quoteStyle: CSSProperties = {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '64px',
    lineHeight: 1,
    letterSpacing: '2px',
    color: T.accent,
    opacity: 0.25,
    marginBottom: '-16px',
    userSelect: 'none',
  }

  const textStyle: CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 1.7,
    fontStyle: 'italic',
    margin: 0,
    flexGrow: 1,
  }

  const avatarRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  }

  const nameStyle: CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontWeight: 700,
    fontSize: '14px',
    color: T.text,
  }

  const nicheStyle: CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '12px',
    color: T.muted,
  }

  return (
    <SectionWrapper background="surface" paddingY={96}>
      <FadeUp>
        <h2 style={titleStyle}>Criadores que já saíram do Canva</h2>
      </FadeUp>

      <div style={gridStyle}>
        {testimonials.map((t, i) => (
          <FadeUp key={t.name} i={i}>
            <div style={cardStyle}>
              <div style={quoteStyle}>"</div>
              <p style={textStyle}>{t.text}</p>
              <div style={avatarRowStyle}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: `${t.color}22`,
                    border: `1px solid ${t.color}44`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 700,
                    fontSize: '13px',
                    color: t.color,
                    flexShrink: 0,
                  }}
                >
                  {t.initials}
                </div>
                <div>
                  <div style={nameStyle}>{t.name}</div>
                  <div style={nicheStyle}>{t.niche}</div>
                </div>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </SectionWrapper>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function Pricing() {
  const navigate = useNavigate()

  const plans = [
    {
      name: 'Free',
      price: 'R$0',
      period: '',
      description: 'Para experimentar',
      features: [
        { label: '3 exportações/mês', included: true },
        { label: 'Marca d\'água ConteudOS', included: true },
        { label: '6 templates virais', included: true },
        { label: 'Análise viral', included: false },
        { label: 'Calendário de posts', included: false },
        { label: 'Imagem IA de fundo', included: false },
      ],
      cta: 'Começar grátis',
      ctaVariant: 'secondary' as const,
      href: undefined as string | undefined,
      onClick: () => navigate('/auth'),
      popular: false,
    },
    {
      name: 'Criador',
      price: 'R$47',
      period: '/mês',
      description: 'Para criadores ativos',
      features: [
        { label: '20 exportações/mês', included: true },
        { label: 'Sem marca d\'água', included: true },
        { label: '6 templates virais', included: true },
        { label: 'Análise viral', included: true },
        { label: '20 imagens IA/mês', included: true },
        { label: 'Calendário de posts', included: false },
      ],
      cta: 'Assinar Criador',
      ctaVariant: 'secondary' as const,
      href: 'https://pay.cakto.com.br/vzjyawh_859532',
      onClick: undefined as (() => void) | undefined,
      popular: false,
    },
    {
      name: 'Profissional',
      price: 'R$97',
      period: '/mês',
      description: 'Para quem vive de conteúdo',
      features: [
        { label: 'Exportações ilimitadas', included: true },
        { label: 'Sem marca d\'água', included: true },
        { label: '60 imagens IA/mês', included: true },
        { label: 'Análise viral', included: true },
        { label: 'Calendário de posts', included: true },
        { label: 'Notificação Telegram', included: true },
      ],
      cta: 'Assinar Profissional',
      ctaVariant: 'primary' as const,
      href: 'https://pay.cakto.com.br/v5utxm4_859534',
      onClick: undefined as (() => void) | undefined,
      popular: true,
    },
    {
      name: 'Agência',
      price: 'R$197',
      period: '/mês',
      description: 'Para times e agências',
      features: [
        { label: 'Exportações ilimitadas', included: true },
        { label: 'Sem marca d\'água', included: true },
        { label: '200 imagens IA/mês', included: true },
        { label: 'Análise viral', included: true },
        { label: 'Calendário + Telegram', included: true },
        { label: '5 subcontas', included: true },
      ],
      cta: 'Assinar Agência',
      ctaVariant: 'secondary' as const,
      href: 'https://pay.cakto.com.br/3fyfktb_859537',
      onClick: undefined as (() => void) | undefined,
      popular: false,
    },
  ]

  const sectionTitleStyle: CSSProperties = {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: 'clamp(32px, 4vw, 48px)',
    color: T.text,
    letterSpacing: '2px',
    textAlign: 'center',
    margin: '16px 0 64px',
  }

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    alignItems: 'start',
  }

  const planNameStyle: CSSProperties = {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '20px',
    letterSpacing: '1px',
    color: T.text,
    margin: 0,
  }

  const priceStyle: CSSProperties = {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '48px',
    lineHeight: 1,
    letterSpacing: '1px',
    color: T.text,
    margin: '8px 0 0',
  }

  const periodStyle: CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '14px',
    color: T.muted,
  }

  const featureStyle = (included: boolean): CSSProperties => ({
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '13px',
    color: included ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    lineHeight: 1.4,
  })

  return (
    <SectionWrapper id="planos" background="dark" paddingY={96}>
      <FadeUp>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <Badge variant="accent">PLANOS</Badge>
        </div>
        <h2 style={sectionTitleStyle}>Escolha seu plano</h2>
      </FadeUp>

      <div style={gridStyle}>
        {plans.map((plan, i) => {
          const cardStyle: CSSProperties = {
            background: '#0F0F0F',
            border: plan.popular ? `1px solid ${T.accent}` : `1px solid ${T.border}`,
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            transform: plan.popular ? 'scale(1.03)' : undefined,
            boxShadow: plan.popular ? '0 0 40px rgba(200,255,0,0.15)' : undefined,
            position: 'relative',
          }

          return (
            <FadeUp key={plan.name} i={i}>
              <div style={cardStyle}>
                {plan.popular && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)' }}>
                    <Badge variant="accent" size="sm">MAIS POPULAR</Badge>
                  </div>
                )}

                <div>
                  <p style={planNameStyle}>{plan.name}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '8px' }}>
                    <span style={priceStyle}>{plan.price}</span>
                    <span style={periodStyle}>{plan.period}</span>
                  </div>
                  <p style={{ ...periodStyle, marginTop: '8px' }}>{plan.description}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                  {plan.features.map((f) => (
                    <span key={f.label} style={featureStyle(f.included)}>
                      <span style={{ flexShrink: 0, color: f.included ? '#4ADE80' : 'rgba(255,255,255,0.2)' }}>
                        {f.included ? '✓' : '✗'}
                      </span>
                      {f.label}
                    </span>
                  ))}
                </div>

                <GlowButton
                  variant={plan.ctaVariant}
                  fullWidth
                  href={plan.href}
                  onClick={plan.onClick}
                >
                  {plan.cta}
                </GlowButton>
              </div>
            </FadeUp>
          )
        })}
      </div>
    </SectionWrapper>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQ() {
  const items = [
    {
      id: 'o-que-e',
      question: 'O que é o ConteudOS?',
      answer:
        'ConteudOS é uma plataforma que usa IA para transformar qualquer tema ou link em um carrossel de Instagram pronto para publicar. Você entra com a ideia, a IA gera copy, layout e sugestão de imagem — tudo em menos de 30 segundos.',
    },
    {
      id: 'preciso-design',
      question: 'Preciso saber design ou programar?',
      answer:
        'Não. O editor é visual e funciona como um apresentador de slides simplificado. Se você sabe usar o Instagram, sabe usar o ConteudOS. Nenhum conhecimento técnico necessário.',
    },
    {
      id: 'plano-gratis',
      question: 'Quantos carrosseis posso criar no plano grátis?',
      answer:
        'No plano Free você pode criar carrosseis ilimitados para visualizar e editar, mas tem direito a 3 exportações por mês. As exportações no plano Free incluem a marca d\'água ConteudOS. Para remover e exportar mais, basta assinar um plano pago.',
    },
    {
      id: 'analise-viral',
      question: 'Como funciona a análise de conteúdo viral?',
      answer:
        'Ao colar um link ou tema, a IA identifica o gatilho psicológico principal do conteúdo — curiosidade, prova social, medo de perder, entre outros. Esse gatilho orienta a estrutura do carrossel e o hook do primeiro slide.',
    },
    {
      id: 'marca-dagua',
      question: 'As imagens geradas por IA têm marca d\'água?',
      answer:
        'Não. As imagens geradas por IA são livres de marca d\'água. A marca d\'água ConteudOS aparece apenas na exportação final do plano Free, e é removida em qualquer plano pago.',
    },
    {
      id: 'cancelamento',
      question: 'Posso cancelar a qualquer momento?',
      answer:
        'Sim. Não existe fidelidade ou multa de cancelamento. Você cancela pelo painel de configurações e não é cobrado no próximo ciclo. O acesso permanece até o fim do período já pago.',
    },
  ]

  const titleStyle: CSSProperties = {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: 'clamp(28px, 4vw, 40px)',
    color: T.text,
    letterSpacing: '2px',
    textAlign: 'center',
    margin: '0 0 48px',
  }

  const wrapperStyle: CSSProperties = {
    maxWidth: '720px',
    margin: '0 auto',
  }

  return (
    <SectionWrapper background="surface" paddingY={96}>
      <FadeUp>
        <h2 style={titleStyle}>Perguntas frequentes</h2>
      </FadeUp>
      <FadeUp i={1}>
        <div style={wrapperStyle}>
          <Accordion items={items} />
        </div>
      </FadeUp>
    </SectionWrapper>
  )
}

// ─── CTA Final ────────────────────────────────────────────────────────────────
function CTAFinal() {
  const navigate = useNavigate()

  const innerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '32px',
  }

  const headlineStyle: CSSProperties = {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: 'clamp(40px, 6vw, 64px)',
    lineHeight: 1.0,
    letterSpacing: '2px',
    color: T.text,
    margin: 0,
  }

  const subtitleStyle: CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '18px',
    color: T.muted,
    lineHeight: 1.6,
    maxWidth: '480px',
    margin: 0,
  }

  const fineStyle: CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.3)',
    margin: 0,
  }

  return (
    <SectionWrapper background="darker" paddingY={128}>
      <div style={innerStyle}>
        <FadeUp>
          <h2 style={headlineStyle}>
            SEU PRÓXIMO VIRAL{' '}
            <span style={{ color: T.accent }}>
              COMEÇA AQUI.
            </span>
          </h2>
        </FadeUp>

        <FadeUp i={1}>
          <p style={subtitleStyle}>
            Sem horas no Canva. Sem copy genérica. Só você, a IA e o próximo carrossel que vai viralizar.
          </p>
        </FadeUp>

        <FadeUp i={2}>
          <GlowButton variant="primary" size="lg" onClick={() => navigate('/auth')}>
            Criar conta grátis →
          </GlowButton>
        </FadeUp>

        <FadeUp i={3}>
          <p style={fineStyle}>
            Sem cartão. Sem compromisso. Primeiro carrossel em 3 minutos.
          </p>
        </FadeUp>
      </div>
    </SectionWrapper>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const footerStyle: CSSProperties = {
    background: T.bg,
    borderTop: `1px solid rgba(255,255,255,0.06)`,
    padding: '40px 24px',
  }

  const innerStyle: CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
  }

  const logoStyle: CSSProperties = {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '20px',
    letterSpacing: '2px',
    color: T.text,
  }

  const copyrightStyle: CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '13px',
    color: T.muted,
    marginTop: '4px',
  }

  const linksStyle: CSSProperties = {
    display: 'flex',
    gap: '24px',
  }

  const linkStyle: CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '13px',
    color: T.muted,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'color 150ms ease-out',
  }

  return (
    <footer style={footerStyle}>
      <div style={innerStyle}>
        <div>
          <div style={logoStyle}>
            Conteúd<span style={{ color: T.accent }}>OS</span>
          </div>
          <div style={copyrightStyle}>© 2026 ConteudOS</div>
        </div>

        <div style={linksStyle}>
          {['Termos', 'Privacidade', 'Contato'].map((label) => (
            <motion.a
              key={label}
              href="#"
              style={linkStyle}
              whileHover={{ color: T.text }}
            >
              {label}
            </motion.a>
          ))}
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div style={{ background: '#080808', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ paddingTop: '64px' }}>
        <Hero />
        <StatsStrip />
        <HowItWorks />
        <Features />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTAFinal />
      </main>
      <Footer />
    </div>
  )
}
