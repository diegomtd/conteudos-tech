import { type Variants, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { CSSProperties, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { CinematicHero } from '@/components/CinematicHero'
import { GlowButton } from '@/components/ui/GlowButton'
import { Badge } from '@/components/ui/Badge'

// ─── tokens ──────────────────────────────────────────────────────────────────
const T = {
  accent: '#C8FF00',
  text: '#F5F5F5',
  muted: 'rgba(255,255,255,0.45)',
  border: 'rgba(255,255,255,0.08)',
  bg: '#050D14',
} as const

// ─── helpers ─────────────────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: [0.0, 0.0, 0.2, 1.0], delay: i * 0.15 },
  }),
}

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

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '64px',
      zIndex: 50,
      background: 'rgba(5,5,5,0.88)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', boxSizing: 'border-box',
    }}>
      <div style={{
        maxWidth: '1200px', width: '100%', margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            fontFamily: '"Bebas Neue", sans-serif', fontSize: '24px',
            letterSpacing: '2px', color: T.text, cursor: 'pointer', userSelect: 'none',
          }}
        >
          Conteúd<span style={{ color: T.accent }}>OS</span>
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {[
            { label: 'Como funciona', id: 'como-funciona' },
            { label: 'Preços', id: 'planos' },
          ].map(({ label, id }) => (
            <motion.button
              key={id}
              onClick={() => scrollTo(id)}
              style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
                color: T.muted, cursor: 'pointer',
                background: 'none', border: 'none', padding: 0,
                transition: 'color 150ms',
              }}
              whileHover={{ color: T.text }}
            >
              {label}
            </motion.button>
          ))}
          <motion.button
            onClick={() => navigate('/auth')}
            style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
              color: T.muted, cursor: 'pointer',
              background: 'none', border: 'none', padding: 0,
            }}
            whileHover={{ color: T.text }}
          >
            Entrar
          </motion.button>
          <button
            onClick={() => navigate('/auth')}
            style={{
              background: T.accent, color: '#000',
              border: 'none', borderRadius: '7px',
              padding: '8px 18px',
              fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer', letterSpacing: '0.2px',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(200,255,0,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = ''
              e.currentTarget.style.boxShadow = ''
            }}
          >
            Começar grátis
          </button>
        </div>
      </div>
    </nav>
  )
}

// ─── Como funciona ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Digite o tema',
      description: 'Cole um link viral ou escreva o tema. A IA analisa e cria narrativa.',
    },
    {
      number: '02',
      title: 'IA gera tudo',
      description: 'Copy viral, imagem cinematográfica, template premium. 30 segundos.',
    },
    {
      number: '03',
      title: 'Exporte e poste',
      description: 'Slides 1080×1350px prontos para o Instagram.',
    },
  ]

  return (
    <section id="como-funciona" style={{ background: '#050505', padding: '96px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <FadeUp>
          <h2 style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 'clamp(32px, 4vw, 48px)',
            color: T.text, letterSpacing: '2px',
            textAlign: 'center', margin: '0 0 64px',
          }}>
            De uma ideia a um carrossel viral
          </h2>
        </FadeUp>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
        }}>
          {steps.map((step, i) => (
            <FadeUp key={step.number} i={i}>
              <div style={{
                background: '#0A0A0A',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px',
                padding: '36px 28px',
                position: 'relative',
                overflow: 'hidden',
                height: '100%',
                boxSizing: 'border-box',
              }}>
                {/* big number watermark */}
                <div style={{
                  position: 'absolute', top: '-8px', right: '16px',
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: '96px', lineHeight: 1,
                  color: `rgba(200,255,0,0.08)`,
                  userSelect: 'none', pointerEvents: 'none',
                  letterSpacing: '2px',
                }}>
                  {step.number}
                </div>

                <div style={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: '13px', letterSpacing: '2px',
                  color: T.accent, marginBottom: '12px',
                }}>
                  {step.number}
                </div>
                <p style={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: '22px', letterSpacing: '1px',
                  color: T.text, margin: '0 0 12px',
                }}>
                  {step.title}
                </p>
                <p style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '14px', color: T.muted,
                  lineHeight: 1.65, margin: 0,
                }}>
                  {step.description}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Prova social ─────────────────────────────────────────────────────────────
function SocialProof() {
  const nichos = ['Marketing', 'Empreendedorismo', 'Espiritualidade', 'Finanças', 'Lifestyle', 'Saúde']

  return (
    <section style={{ background: '#030303', padding: '72px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <FadeUp>
          <p style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 'clamp(28px, 4vw, 40px)',
            color: T.text, letterSpacing: '2px',
            margin: '0 0 8px',
          }}>
            2.400+ criadores de conteúdo já usam
          </p>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '15px', color: T.muted,
            margin: '0 0 36px',
          }}>
            Em todos os nichos do Instagram
          </p>
        </FadeUp>

        <FadeUp i={1}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {nichos.map((n) => (
              <span key={n} style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px', fontWeight: 600,
                color: 'rgba(255,255,255,0.6)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '24px',
                padding: '6px 16px',
                letterSpacing: '0.3px',
              }}>
                {n}
              </span>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  )
}

// ─── Planos ──────────────────────────────────────────────────────────────────
function Pricing() {
  const navigate = useNavigate()

  const plans = [
    {
      name: 'Free',
      price: 'R$0',
      period: '',
      description: 'Para experimentar',
      features: [
        { label: '3 exportações/mês', ok: true },
        { label: 'Marca d\'água ConteudOS', ok: true },
        { label: '6 templates virais', ok: true },
        { label: 'Imagem IA de fundo', ok: false },
        { label: 'Sem marca d\'água', ok: false },
      ],
      cta: 'Começar grátis',
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
        { label: '20 exportações/mês', ok: true },
        { label: 'Sem marca d\'água', ok: true },
        { label: '6 templates virais', ok: true },
        { label: '20 imagens IA/mês', ok: true },
        { label: 'Análise viral', ok: true },
      ],
      cta: 'Assinar Criador',
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
        { label: 'Exportações ilimitadas', ok: true },
        { label: 'Sem marca d\'água', ok: true },
        { label: '60 imagens IA/mês', ok: true },
        { label: 'Calendário de posts', ok: true },
        { label: 'Notificação Telegram', ok: true },
      ],
      cta: 'Assinar Profissional',
      href: 'https://pay.cakto.com.br/v5utxm4_859534',
      onClick: undefined as (() => void) | undefined,
      popular: true,
    },
  ]

  return (
    <section id="planos" style={{ background: '#050505', padding: '96px 24px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <FadeUp>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <Badge variant="accent">PLANOS</Badge>
          </div>
          <h2 style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 'clamp(32px, 4vw, 48px)',
            color: T.text, letterSpacing: '2px',
            textAlign: 'center', margin: '16px 0 64px',
          }}>
            Escolha seu plano
          </h2>
        </FadeUp>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'start' }}>
          {plans.map((plan, i) => (
            <FadeUp key={plan.name} i={i}>
              <div style={{
                background: '#0A0A0A',
                border: plan.popular ? `1px solid ${T.accent}` : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                padding: '28px',
                display: 'flex', flexDirection: 'column', gap: '24px',
                position: 'relative',
                transform: plan.popular ? 'scale(1.03)' : undefined,
                boxShadow: plan.popular ? '0 0 40px rgba(200,255,0,0.12)' : undefined,
              }}>
                {plan.popular && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)' }}>
                    <Badge variant="accent" size="sm">MAIS POPULAR</Badge>
                  </div>
                )}

                <div>
                  <p style={{
                    fontFamily: '"Bebas Neue", sans-serif',
                    fontSize: '20px', letterSpacing: '1px',
                    color: T.text, margin: 0,
                  }}>
                    {plan.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '8px' }}>
                    <span style={{
                      fontFamily: '"Bebas Neue", sans-serif',
                      fontSize: '44px', lineHeight: 1,
                      color: T.text,
                    }}>
                      {plan.price}
                    </span>
                    <span style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px', color: T.muted,
                    }}>
                      {plan.period}
                    </span>
                  </div>
                  <p style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '13px', color: T.muted,
                    margin: '6px 0 0',
                  }}>
                    {plan.description}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
                  {plan.features.map((f) => (
                    <span key={f.label} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '13px',
                      color: f.ok ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.22)',
                    }}>
                      {f.ok
                        ? <Check size={13} color="#4ADE80" strokeWidth={2.5} />
                        : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px', lineHeight: 1 }}>✗</span>
                      }
                      {f.label}
                    </span>
                  ))}
                </div>

                <GlowButton
                  variant={plan.popular ? 'primary' : 'secondary'}
                  fullWidth
                  href={plan.href}
                  onClick={plan.onClick}
                >
                  {plan.cta}
                </GlowButton>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA Final ────────────────────────────────────────────────────────────────
function CTAFinal() {
  const navigate = useNavigate()

  return (
    <section style={{ background: '#030303', padding: '120px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{
        maxWidth: '700px', margin: '0 auto',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center', gap: '28px',
      }}>
        <FadeUp>
          <h2 style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 'clamp(40px, 6vw, 64px)',
            lineHeight: 1.0, letterSpacing: '2px',
            color: T.text, margin: 0,
          }}>
            SEU PRÓXIMO VIRAL{' '}
            <span style={{ color: T.accent }}>COMEÇA AQUI.</span>
          </h2>
        </FadeUp>

        <FadeUp i={1}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '17px', color: T.muted,
            lineHeight: 1.7, margin: 0, maxWidth: '480px',
          }}>
            Sem horas no Canva. Sem copy genérica. Só você, a IA e o próximo carrossel.
          </p>
        </FadeUp>

        <FadeUp i={2}>
          <GlowButton variant="primary" size="lg" onClick={() => navigate('/auth')}>
            Criar meu primeiro carrossel grátis
          </GlowButton>
        </FadeUp>

        <FadeUp i={3}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px', color: 'rgba(255,255,255,0.28)',
            margin: 0,
          }}>
            Sem cartão. Sem compromisso. Primeiro carrossel em 30 segundos.
          </p>
        </FadeUp>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const linkStyle: CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '13px', color: T.muted,
    textDecoration: 'none', cursor: 'pointer',
    transition: 'color 150ms',
  }

  return (
    <footer style={{
      background: T.bg,
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '40px 24px',
    }}>
      <div style={{
        maxWidth: '1200px', margin: '0 auto',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <div style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: '20px', letterSpacing: '2px', color: T.text,
          }}>
            Conteúd<span style={{ color: T.accent }}>OS</span>
          </div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px', color: T.muted, marginTop: '4px',
          }}>
            © 2026 ConteudOS
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          {['Termos', 'Privacidade', 'Contato'].map((label) => (
            <motion.a key={label} href="#" style={linkStyle} whileHover={{ color: T.text }}>
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
    <div style={{ background: '#050505', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ paddingTop: '64px' }}>
        <CinematicHero
          tagline1="Carrosseis virais"
          tagline2="prontos em 30 segundos."
          cardHeading="A IA cria. Você posta."
          cardDescription="Cole o tema, escolha o estilo. A IA escreve o texto, gera as imagens e monta os slides prontos para o Instagram."
          metricValue={2400}
          metricLabel="Criadores ativos"
          ctaHeading="Crie seu primeiro carrossel"
          ctaDescription="3 carrosseis grátis. Sem cartão de crédito. Resultados em 30 segundos."
        />
        <HowItWorks />
        <SocialProof />
        <Pricing />
        <CTAFinal />
      </main>
      <Footer />
    </div>
  )
}
