import { useNavigate } from 'react-router-dom'
import { TabuleiroBg } from '@/components/TabuleiroBg'
import { Accordion } from '@/components/ui/Accordion'

// ─── DADOS ───────────────────────────────────────────────────────────────────

const CREATORS = [
  { handle: '@marina.mkt', initials: 'MM', color: '#00D4FF' },
  { handle: '@joao.criador', initials: 'JC', color: '#6366F1' },
  { handle: '@bia.social', initials: 'BS', color: '#C8FF00' },
  { handle: '@pedro.ads', initials: 'PA', color: '#00D4FF' },
  { handle: '@carol.brand', initials: 'CB', color: '#6366F1' },
  { handle: '@rafa.content', initials: 'RC', color: '#C8FF00' },
  { handle: '@lucas.mkt', initials: 'LM', color: '#00D4FF' },
  { handle: '@ana.viral', initials: 'AV', color: '#6366F1' },
  { handle: '@diego.ia', initials: 'DI', color: '#C8FF00' },
  { handle: '@julia.posts', initials: 'JP', color: '#00D4FF' },
]

const FAKE_CAROUSEL_SLIDES = [
  { title: 'O ERRO QUE TRAVA 90% DOS PERFIS', body: 'Você posta conteúdo técnico. Aprofundado. Cheio de valor.', accent: '#00D4FF' },
  { title: 'META ADS NÃO ESTÁ MORRENDO', body: 'O custo por mil impressões subiu 47% desde 2022.', accent: '#6366F1' },
  { title: 'VOCÊ POSTA PRA FANTASMA', body: 'A maioria do seu alcance orgânico caiu para 2%.', accent: '#C8FF00' },
  { title: 'ALGORITMO NÃO É SEU INIMIGO', body: 'O problema não é o algoritmo. É a consistência.', accent: '#00D4FF' },
  { title: 'CONTEÚDO SEM ESTRATÉGIA É RUÍDO', body: 'Sem posicionamento claro, você só ocupa espaço.', accent: '#6366F1' },
  { title: 'VIRALIZAR NÃO É SORTE', body: 'Existe engenharia por trás de todo post que explode.', accent: '#C8FF00' },
  { title: 'SEU FEED É SUA REPUTAÇÃO', body: 'O que você posta hoje define quem te segue amanhã.', accent: '#00D4FF' },
  { title: 'O TABULEIRO QUE POUCOS VEEM', body: 'Quem domina o Instagram não posta — joga.', accent: '#6366F1' },
]

const TESTIMONIALS = [
  { name: 'Marina Silva', handle: '@marina.mkt', text: 'Gerei 10 carrosseis em uma tarde. Nunca fui tão consistente.', initials: 'MS' },
  { name: 'João Costa', handle: '@joao.criador', text: 'A copy que a IA gera é melhor do que a minha maioria das vezes.', initials: 'JC' },
  { name: 'Beatriz Alves', handle: '@bia.social', text: 'Finalmente consigo postar todo dia sem surtar.', initials: 'BA' },
  { name: 'Pedro Mendes', handle: '@pedro.ads', text: 'Meu engajamento dobrou em 3 semanas usando o ConteúdOS.', initials: 'PM' },
  { name: 'Carolina Brand', handle: '@carol.brand', text: 'A melhor ferramenta que já usei para criar carrosseis.', initials: 'CB' },
]

const PLANS = [
  {
    name: 'Free', price: 'R$0', period: '',
    desc: 'Para experimentar o tabuleiro.',
    features: ['3 carrosseis/mês', '3 imagens IA/mês', '7 slides máx.', 'Copy com IA', "Exportação c/ marca d'água"],
    cta: 'Começar grátis', pop: false, badge: '',
  },
  {
    name: 'Construtor', price: 'R$47', period: '/mês',
    desc: 'Para criadores que querem consistência.',
    features: ['30 carrosseis/mês', '20 imagens IA/mês', '10 slides máx.', 'Exportação ilimitada', "Sem marca d'água", '6 templates visuais'],
    cta: 'Assinar Construtor', pop: false, badge: '',
  },
  {
    name: 'Escala', price: 'R$97', period: '/mês',
    desc: 'Para quem quer volume e qualidade.',
    features: ['100 carrosseis/mês', '60 imagens IA/mês', '15 slides máx.', 'Exportação ilimitada', 'Voice profile da marca', 'Todos os templates', 'Calendário de conteúdo'],
    cta: 'Assinar Escala', pop: true, badge: 'Mais escolhido',
  },
  {
    name: 'Agência', price: 'R$197', period: '/mês',
    desc: 'Para agências e times com múltiplos clientes.',
    features: ['Carrosseis ilimitados', '200 imagens IA/mês', '15 slides máx.', '3 workspaces de cliente', 'Tudo do Escala', 'Suporte prioritário'],
    cta: 'Assinar Agência', pop: false, badge: '',
  },
]

const FAQ_ITEMS = [
  { id: 'f1', question: 'Quanto tempo leva para gerar um carrossel?', answer: 'Em média 2 a 3 minutos. Você descreve o tema, a IA gera copy, design e imagem em sequência. Depois, é só exportar e publicar.' },
  { id: 'f2', question: 'Posso personalizar o visual dos slides?', answer: 'Sim. Você escolhe template, cor de fundo, fonte, cor do texto, imagem de fundo e overlay. Tudo pelo Studio, slide a slide.' },
  { id: 'f3', question: 'As imagens de IA são geradas por qual modelo?', answer: 'Usamos o fal.ai Flux-2-Pro, um dos melhores modelos de geração de imagem do mercado. Cada imagem é única e gerada para o seu nicho.' },
  { id: 'f4', question: 'Posso cancelar a qualquer momento?', answer: 'Sim. Não há fidelidade. Você cancela pelo painel e a assinatura não renova no próximo ciclo.' },
  { id: 'f5', question: "Os carrosseis têm marca d'água no plano free?", answer: "Sim. No plano Free, os exports incluem uma marca d'água discreta do ConteúdOS. Nos planos pagos, zero marca d'água." },
  { id: 'f6', question: 'O que é o Voice Profile?', answer: 'É um perfil de voz da sua marca: nicho, tom, estilo de escrita. A IA usa esse perfil para gerar copy que soa como você — não como um robô genérico.' },
  { id: 'f7', question: 'Tem suporte em português?', answer: 'Sim. Todo o produto é em PT-BR. A copy gerada, os templates, o suporte — tudo pensado para o criador brasileiro.' },
]

// ─── COMPONENTES INTERNOS ─────────────────────────────────────────────────────

function CreatorAvatar({ c }: { c: typeof CREATORS[0] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 80, flexShrink: 0 }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', padding: 2.5, background: 'conic-gradient(from 0deg, #00D4FF, #6366F1, #00D4FF)' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#060E1F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, color: c.color }}>
          {c.initials}
        </div>
      </div>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80 }}>{c.handle}</span>
    </div>
  )
}

function SlideCard({ s }: { s: typeof FAKE_CAROUSEL_SLIDES[0] }) {
  return (
    <div style={{ width: 200, height: 250, flexShrink: 0, borderRadius: 12, background: '#060E1F', border: `1px solid ${s.accent}22`, padding: '16px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `linear-gradient(135deg, ${s.accent}08, transparent 60%)` }} />
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 10, color: s.accent, fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.1em', marginBottom: 8 }}>CONTEÚDOS</div>
        <div style={{ fontSize: 16, color: '#fff', fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1.15, letterSpacing: '0.03em' }}>{s.title}</div>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 10 }}>{s.body}</div>
        <div style={{ height: 2, background: s.accent, borderRadius: 1, width: '50%' }} />
      </div>
    </div>
  )
}

function TestimonialCard({ t }: { t: typeof TESTIMONIALS[0] }) {
  return (
    <div style={{ width: 260, flexShrink: 0, borderRadius: 16, background: '#0B1528', border: '1px solid rgba(0,212,255,0.1)', padding: '20px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#00D4FF,#6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: 14, color: '#000', flexShrink: 0 }}>{t.initials}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{t.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{t.handle}</div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>"{t.text}"</p>
    </div>
  )
}

function AppMockupSVG() {
  return (
    <svg width="480" height="320" viewBox="0 0 480 320" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 12, maxWidth: '100%' }}>
      <rect width="480" height="320" fill="#060E1F" rx="12"/>
      <rect width="480" height="320" fill="url(#appGrad)" rx="12"/>
      <rect x="0" y="0" width="140" height="320" fill="#080F20" rx="12"/>
      <rect x="140" y="0" width="1" height="320" fill="rgba(255,255,255,0.06)"/>
      <rect x="12" y="20" width="60" height="8" fill="#0F1E3A" rx="2"/>
      <rect x="12" y="36" width="116" height="22" fill="#0A1626" rx="4" stroke="#00D4FF22" strokeWidth="1"/>
      <rect x="12" y="68" width="60" height="8" fill="#0F1E3A" rx="2"/>
      <rect x="12" y="84" width="116" height="22" fill="#0A1626" rx="4" stroke="#0F2840" strokeWidth="1"/>
      <rect x="12" y="116" width="60" height="8" fill="#0F1E3A" rx="2"/>
      <rect x="12" y="132" width="116" height="22" fill="#0A1626" rx="4" stroke="#0F2840" strokeWidth="1"/>
      <rect x="12" y="164" width="60" height="8" fill="#0F1E3A" rx="2"/>
      <rect x="12" y="180" width="116" height="40" fill="#0A1626" rx="4" stroke="#0F2840" strokeWidth="1"/>
      <rect x="12" y="238" width="116" height="28" fill="#00D4FF" rx="6"/>
      <text x="70" y="257" textAnchor="middle" fontFamily="Bebas Neue" fontSize="12" fill="#010816">GERAR CARROSSEL</text>
      <rect x="156" y="16" width="140" height="188" fill="#060E1F" rx="8" stroke="#00D4FF22" strokeWidth="1"/>
      <rect x="156" y="16" width="140" height="188" rx="8" fill="url(#s1Grad)"/>
      <text x="226" y="48" textAnchor="middle" fontFamily="Bebas Neue" fontSize="9" fill="#00D4FF" letterSpacing="2">SLIDE 01</text>
      <rect x="168" y="56" width="116" height="8" fill="#fff" rx="2" opacity="0.9"/>
      <rect x="168" y="70" width="90" height="8" fill="#fff" rx="2" opacity="0.9"/>
      <rect x="168" y="84" width="100" height="6" fill="#ffffff55" rx="2"/>
      <rect x="168" y="96" width="80" height="6" fill="#ffffff55" rx="2"/>
      <rect x="168" y="108" width="116" height="6" fill="#ffffff55" rx="2"/>
      <rect x="168" y="186" width="50" height="2" fill="#00D4FF" rx="1" opacity="0.8"/>
      <rect x="304" y="16" width="140" height="188" fill="#060E1F" rx="8" stroke="#6366F122" strokeWidth="1"/>
      <rect x="304" y="16" width="140" height="188" rx="8" fill="url(#s2Grad)"/>
      <text x="374" y="48" textAnchor="middle" fontFamily="Bebas Neue" fontSize="9" fill="#6366F1" letterSpacing="2">SLIDE 02</text>
      <rect x="316" y="56" width="116" height="8" fill="#fff" rx="2" opacity="0.9"/>
      <rect x="316" y="70" width="80" height="8" fill="#fff" rx="2" opacity="0.9"/>
      <rect x="316" y="84" width="100" height="6" fill="#ffffff55" rx="2"/>
      <rect x="316" y="96" width="70" height="6" fill="#ffffff55" rx="2"/>
      <rect x="316" y="186" width="50" height="2" fill="#6366F1" rx="1" opacity="0.8"/>
      <rect x="140" y="216" width="340" height="50" fill="#080F20"/>
      <rect x="140" y="216" width="340" height="1" fill="rgba(255,255,255,0.06)"/>
      <rect x="152" y="228" width="110" height="26" fill="#00D4FF" rx="5"/>
      <text x="207" y="245" textAnchor="middle" fontFamily="Bebas Neue" fontSize="12" fill="#010816">BAIXAR ZIP</text>
      <rect x="274" y="228" width="70" height="26" fill="#0F1E3A" rx="5" stroke="#0F2840" strokeWidth="1"/>
      <text x="309" y="245" textAnchor="middle" fontFamily="Bebas Neue" fontSize="11" fill="#ffffff88">PREVIEW</text>
      <rect x="140" y="272" width="340" height="48" fill="#060E1F"/>
      <rect x="140" y="272" width="340" height="1" fill="rgba(255,255,255,0.06)"/>
      <circle cx="155" cy="297" r="6" fill="#00D4FF"/>
      <circle cx="172" cy="297" r="6" fill="#6366F1"/>
      <circle cx="189" cy="297" r="6" fill="#C8FF00"/>
      <circle cx="206" cy="297" r="6" fill="rgba(255,255,255,0.3)"/>
      <defs>
        <linearGradient id="appGrad" x1="0" y1="0" x2="480" y2="320" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.04"/>
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0.04"/>
        </linearGradient>
        <linearGradient id="s1Grad" x1="156" y1="16" x2="296" y2="204" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="#00D4FF" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="s2Grad" x1="304" y1="16" x2="444" y2="204" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────

const CSS = `
  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes marqueeReverse {
    0% { transform: translateX(-50%); }
    100% { transform: translateX(0); }
  }
  @keyframes topbarGradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes orb {
    0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.5; }
    50% { transform: translate(-50%,-50%) scale(1.12); opacity: 0.7; }
  }
  .lp-plans { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .lp-truth { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
  .lp-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  @media (max-width: 960px) {
    .lp-plans { grid-template-columns: 1fr 1fr; }
    .lp-truth { grid-template-columns: 1fr; }
    .lp-steps { grid-template-columns: 1fr; }
  }
  @media (max-width: 560px) {
    .lp-plans { grid-template-columns: 1fr; }
  }
`

export default function Landing() {
  const navigate = useNavigate()
  const go = () => navigate('/dashboard')

  return (
    <div style={{ background: '#010816', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#fff', overflowX: 'hidden' }}>
      <style>{CSS}</style>

      {/* ── TOPBAR ──────────────────────────────────────────────────── */}
      <div style={{
        height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(90deg, #00D4FF, #6366F1, #C8FF00, #6366F1, #00D4FF)',
        backgroundSize: '300% 300%',
        animation: 'topbarGradient 6s ease infinite',
        fontSize: 12, fontWeight: 700, color: '#010816', letterSpacing: '0.05em',
      }}>
        ConteúdOS gera Carrosseis Virais com IA em menos de 3 minutos!
      </div>

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 64,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(1,8,22,0.88)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color: '#00D4FF', letterSpacing: '0.06em' }}>
          ConteúdOS
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <a href="#como-funciona" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Como funciona</a>
          <a href="#precos" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Preços</a>
          <a href="/auth" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Entrar</a>
          <button onClick={go} style={{ background: '#00D4FF', color: '#010816', border: 'none', borderRadius: 8, padding: '8px 20px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Começar grátis
          </button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '88vh', display: 'flex', alignItems: 'center', overflow: 'hidden', padding: '80px 40px' }}>
        <TabuleiroBg />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 580, animation: 'fadeUp 0.8s ease both' }}>
          <div style={{ display: 'inline-block', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: '#00D4FF', letterSpacing: '0.08em', marginBottom: 24, fontWeight: 600 }}>
            IA PARA INSTAGRAM · FEITO NO BRASIL
          </div>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(42px, 6vw, 72px)', lineHeight: 1.05, letterSpacing: '0.02em', margin: '0 0 24px', color: '#fff' }}>
            Não existe post aleatório.{' '}
            <span style={{ color: '#00D4FF' }}>Existe tabuleiro.</span>{' '}
            Monte o seu com IA.
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, marginBottom: 36, maxWidth: 480 }}>
            Quem domina o Instagram não posta — joga. Copy estratégica, design que para o scroll e imagem por IA. Tudo em menos de 3 minutos.
          </p>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={go} style={{ background: '#00D4FF', color: '#010816', border: 'none', borderRadius: 10, padding: '14px 32px', fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, letterSpacing: '0.06em', cursor: 'pointer' }}>
              Quero montar meu tabuleiro
            </button>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Grátis para começar · Sem cartão</span>
          </div>
          <div style={{ display: 'flex', gap: 36, marginTop: 48, flexWrap: 'wrap' }}>
            {[['3min', 'por carrossel'], ['10×', 'mais rápido'], ['100%', 'IA']].map(([n, l]) => (
              <div key={n}>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 36, color: '#00D4FF', lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STRIP DE CRIADORES ──────────────────────────────────────── */}
      <section style={{ padding: '40px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginBottom: 20, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Criadores que já montam o tabuleiro
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 32, width: 'max-content', animation: 'marquee 20s linear infinite' }}>
            {[...CREATORS, ...CREATORS].map((c, i) => <CreatorAvatar key={i} c={c} />)}
          </div>
        </div>
      </section>

      {/* ── PLANOS ──────────────────────────────────────────────────── */}
      <section id="precos" style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 11, color: '#00D4FF', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>Preços</div>
            <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(36px, 4vw, 52px)', margin: 0 }}>Monte seu tabuleiro pelo preço certo</h2>
          </div>
          <div className="lp-plans">
            {PLANS.map((plan) => (
              <div key={plan.name} style={{
                borderRadius: 16,
                background: plan.pop ? 'rgba(0,212,255,0.04)' : '#0A1525',
                border: plan.pop ? '1.5px solid #00D4FF' : '1px solid rgba(255,255,255,0.08)',
                padding: '28px 22px',
                position: 'relative',
                display: 'flex', flexDirection: 'column',
              }}>
                {plan.pop && plan.badge && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#00D4FF', color: '#010816', fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 20, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, letterSpacing: '0.04em', color: plan.pop ? '#00D4FF' : '#fff', marginBottom: 4 }}>{plan.name}</div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 36, color: '#fff' }}>{plan.price}</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{plan.period}</span>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20, lineHeight: 1.4 }}>{plan.desc}</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                      <span style={{ color: '#00D4FF', flexShrink: 0, marginTop: 1 }}>✓</span> {f}
                    </div>
                  ))}
                </div>
                <button onClick={go} style={{
                  width: '100%', padding: '12px 0',
                  background: plan.pop ? '#00D4FF' : 'transparent',
                  color: plan.pop ? '#010816' : '#00D4FF',
                  border: plan.pop ? 'none' : '1px solid rgba(0,212,255,0.35)',
                  borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── A VERDADE BRUTAL ────────────────────────────────────────── */}
      <section style={{ padding: '80px 40px', background: '#060E1F', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="lp-truth">
            <div>
              <div style={{ fontSize: 11, color: '#00D4FF', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16 }}>A verdade que ninguém te conta</div>
              <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(30px, 4vw, 48px)', margin: '0 0 24px', lineHeight: 1.1 }}>
                Você não tem problema de criatividade.<br />
                <span style={{ color: '#00D4FF' }}>Tem problema de velocidade.</span>
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, maxWidth: 480, margin: 0 }}>
                A ideia existe. O tempo de executar não. O ConteúdOS elimina o gap entre pensar e publicar — de 2 horas para 3 minutos. Copy estratégica gerada para o seu nicho, design que para o scroll e imagem de IA, tudo ao mesmo tempo.
              </p>
              <button onClick={go} style={{ marginTop: 32, background: 'transparent', border: '1px solid rgba(0,212,255,0.4)', color: '#00D4FF', borderRadius: 8, padding: '12px 28px', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Ver como funciona →
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <AppMockupSVG />
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 PASSOS ────────────────────────────────────────────────── */}
      <section id="como-funciona" style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 11, color: '#00D4FF', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>Como funciona</div>
            <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(32px, 4vw, 48px)', margin: 0 }}>3 passos. 3 minutos.</h2>
          </div>
          <div className="lp-steps">
            {[
              { n: '01', title: 'Descreva o tema', desc: 'Digite o tema do carrossel, seu nicho e tom de voz. Opcional: deixe o voice profile fazer isso por você.' },
              { n: '02', title: 'IA gera tudo', desc: 'Copy de cada slide, título, corpo, CTA, imagem de fundo personalizada e design completo — automático.' },
              { n: '03', title: 'Exporte e publique', desc: 'Baixe o ZIP com todos os slides em alta resolução. Direto para o Instagram, Canva ou onde quiser.' },
            ].map((step) => (
              <div key={step.n} style={{ padding: '32px 28px', borderRadius: 16, background: '#0A1525', border: '1px solid rgba(255,255,255,0.07)', position: 'relative' }}>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 52, color: 'rgba(0,212,255,0.1)', position: 'absolute', top: 12, right: 18, lineHeight: 1 }}>{step.n}</div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 13, color: '#00D4FF', letterSpacing: '0.12em', marginBottom: 14 }}>PASSO {step.n}</div>
                <h3 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 26, margin: '0 0 12px', color: '#fff', letterSpacing: '0.02em' }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE DE SLIDES ───────────────────────────────────────── */}
      <section style={{ padding: '60px 0', overflow: 'hidden', background: '#060E1F', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 16, width: 'max-content', animation: 'marquee 30s linear infinite' }}>
            {[...FAKE_CAROUSEL_SLIDES, ...FAKE_CAROUSEL_SLIDES].map((s, i) => <SlideCard key={i} s={s} />)}
          </div>
        </div>
        <div style={{ marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 16, width: 'max-content', animation: 'marqueeReverse 25s linear infinite' }}>
            {[...FAKE_CAROUSEL_SLIDES, ...FAKE_CAROUSEL_SLIDES].map((s, i) => <SlideCard key={i} s={s} />)}
          </div>
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 16, width: 'max-content', animation: 'marquee 40s linear infinite' }}>
            {[...FAKE_CAROUSEL_SLIDES, ...FAKE_CAROUSEL_SLIDES].map((s, i) => <SlideCard key={i} s={s} />)}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ─────────────────────────────────────────────── */}
      <section style={{ padding: '80px 0', overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', padding: '0 40px', marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: '#00D4FF', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>Depoimentos</div>
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(32px, 4vw, 48px)', margin: 0 }}>Quem já está no tabuleiro</h2>
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 20, width: 'max-content', animation: 'marquee 35s linear infinite' }}>
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => <TestimonialCard key={i} t={t} />)}
          </div>
        </div>
      </section>

      {/* ── COMPARATIVO DE PREÇO ────────────────────────────────────── */}
      <section style={{ padding: '80px 40px', background: '#060E1F', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#00D4FF', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16 }}>Quanto custa fazer sem o ConteúdOS</div>
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(28px, 3.5vw, 42px)', margin: '0 0 40px' }}>Você já paga caro demais por isso</h2>
          <div style={{ background: '#0A1525', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            {[
              { tool: 'Canva Pro', price: 'R$89/mês' },
              { tool: 'ChatGPT Plus', price: 'R$110/mês' },
              { tool: 'Designer freelancer (4h/semana)', price: 'R$363/mês' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                <span>{row.tool}</span>
                <span style={{ color: '#ff6b6b', fontWeight: 600 }}>{row.price}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: 15, fontWeight: 700 }}>
              <span style={{ color: '#fff' }}>Total atual</span>
              <span style={{ color: '#ff6b6b', fontSize: 20 }}>~R$562/mês</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: 'rgba(0,212,255,0.05)', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ background: '#00D4FF', color: '#010816', fontSize: 11, padding: '3px 10px', borderRadius: 4, fontWeight: 700, flexShrink: 0 }}>ConteúdOS Construtor</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Tudo acima, integrado</span>
              </div>
              <span style={{ color: '#00D4FF', fontSize: 24, fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.03em' }}>R$47/mês</span>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 16 }}>Economia de R$515/mês. Sem perder qualidade.</p>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 40px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(32px, 4vw, 48px)', margin: 0 }}>Perguntas frequentes</h2>
          </div>
          <Accordion items={FAQ_ITEMS} />
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────── */}
      <section style={{ padding: '100px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.14) 0%, transparent 70%)',
          animation: 'orb 6s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, color: '#00D4FF', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 20 }}>Comece agora</div>
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(36px, 5vw, 64px)', margin: '0 0 20px', lineHeight: 1.05 }}>
            Seu tabuleiro espera por você.<br />
            <span style={{ color: '#00D4FF' }}>Monte agora.</span>
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 40, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
            3 carrosseis grátis. Sem cartão. Sem compromisso. Só resultado.
          </p>
          <button onClick={go} style={{
            background: '#00D4FF', color: '#010816', border: 'none', borderRadius: 12,
            padding: '18px 48px', fontFamily: 'Bebas Neue, sans-serif', fontSize: 22,
            letterSpacing: '0.06em', cursor: 'pointer',
          }}>
            Montar meu primeiro tabuleiro grátis
          </button>
          <div style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Mais de 2.400 criadores já usam</div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, color: '#00D4FF', letterSpacing: '0.06em' }}>ConteúdOS</div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[['Como funciona', '#como-funciona'], ['Preços', '#precos'], ['Entrar', '/auth']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>{label}</a>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2026 ConteúdOS. Todos os direitos reservados.</div>
      </footer>
    </div>
  )
}
