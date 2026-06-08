import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useSpring, useMotionValue, AnimatePresence } from 'framer-motion'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CyberneticGridShader } from '@/components/CyberneticGridShader'
import { LiveCarouselDemo } from '@/components/LiveCarouselDemo'

gsap.registerPlugin(ScrollTrigger)

// ─── reveal helpers (Framer Motion) — substituem o IntersectionObserver .aos ─
const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
}
const stagger = (gap = 0.1) => ({
  hidden: {},
  show: { transition: { staggerChildren: gap } },
})
const Reveal = ({ children, delay = 0, ...rest }: any) => (
  <motion.div
    variants={fadeUp}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
    {...rest}
  >
    {children}
  </motion.div>
)
const RevealGroup = ({ children, gap = 0.1, ...rest }: any) => (
  <motion.div variants={stagger(gap)} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} {...rest}>
    {children}
  </motion.div>
)

// ─── botão magnético — segue o cursor levemente, solta com spring ────────────
function Magnetic({ children, strength = 18 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 })
  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy, display: 'inline-block' }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        x.set((e.clientX - r.left - r.width / 2) / strength)
        y.set((e.clientY - r.top - r.height / 2) / strength)
      }}
      onMouseLeave={() => { x.set(0); y.set(0) }}
    >
      {children}
    </motion.div>
  )
}

const CREATORS = [
  { handle: '@marinafonseca.mkt',  name: 'Marina Fonseca',  img: '/images/creators/marinafonseca.jpg', nicho: 'Marketing digital' },
  { handle: '@bealeal.criadora',   name: 'Beatriz Leal',    img: '/images/creators/bealeal.jpg',        nicho: 'Empreendedorismo' },
  { handle: '@camilarocha.ia',     name: 'Camila Rocha',    img: '/images/creators/camilarocha.jpg',    nicho: 'IA e tecnologia' },
  { handle: '@analuiza.conteudo',  name: 'Ana Luiza Pires', img: '/images/creators/analuiza.jpg',       nicho: 'Educação online' },
  { handle: '@fernandavaz.social', name: 'Fernanda Vaz',    img: '/images/creators/fernandavaz.jpg',    nicho: 'Agência de conteúdo' },
  { handle: '@raquelmatos.brand',  name: 'Raquel Matos',    img: '/images/creators/raquelmatos.jpg',    nicho: 'Personal brand' },
  { handle: '@pedroalves.ads',     name: 'Pedro Alves',     img: '/images/creators/pedroalves.jpg',     nicho: 'Tráfego pago' },
  { handle: '@rafacosta.mentor',   name: 'Rafael Costa',    img: '/images/creators/rafacosta.jpg',      nicho: 'Mentoria e vendas' },
  { handle: '@lucas.drummond',     name: 'Lucas Drummond',  img: '/images/creators/lucas.jpg',          nicho: 'Finanças pessoais' },
  { handle: '@joaohenrique.mkt',   name: 'João Henrique',   img: '/images/creators/joaohenrique.jpg',   nicho: 'Marketing de conteúdo' },
]

const PLANS = [
  {
    name: 'Free', price: 'R$0', period: '', pop: false,
    features: ['3 carrosseis com copy/mês', '3 imagens IA/mês', '7 slides máx.', 'Exportação com marca d\'água'],
    cta: 'Começar grátis',
  },
  {
    name: 'Construtor', price: 'R$47', period: '/mês', pop: false,
    features: ['50 carrosseis com copy/mês', '100 exportações/mês', '20 imagens IA/mês', '10 slides máx.', 'Sem marca d\'água', 'Suba suas próprias imagens'],
    cta: 'Assinar agora',
  },
  {
    name: 'Escala', price: 'R$97', period: '/mês', pop: true,
    features: ['150 carrosseis com copy/mês', 'Exportação ilimitada', '60 imagens IA/mês', '15 slides máx.', 'Voice profile da sua marca', 'Todos os templates'],
    cta: 'Escolher Escala',
  },
  {
    name: 'Agência', price: 'R$197', period: '/mês', pop: false,
    features: ['300 carrosseis com copy/mês', 'Exportação ilimitada', '150 imagens IA/mês', '15 slides máx.', '3 perfis de cliente separados', 'Tudo do Escala incluído'],
    cta: 'Falar com time',
  },
]

const STEPS = [
  { num: '01', title: 'Diga o que quer falar', body: 'Sem fórmula, sem prompt técnico — escreva o tema como você falaria com um amigo. A IA lê contexto, tom e objetivo sozinha.' },
  { num: '02', title: 'Veja o carrossel nascer', body: 'Copy, título, corpo e imagem cinematográfica aparecem slide a slide, em tempo real — exatamente como você viu na demonstração acima.' },
  { num: '03', title: 'Ajuste, exporte, publique', body: 'Refine no Studio se quiser tocar em algo, baixe o ZIP em PNG 1080×1350 e poste direto — sem abrir mais nenhum app.' },
]

const FEATURES = [
  { id: 'copy',      label: 'Copy IA',    img: '/images/recursos/copy-ia.jpg',      title: 'Copy que para o scroll',       body: 'Cada slide recebe título, subtítulo e corpo calibrados para engajamento. A IA lê o tema e gera narrativa com gancho, desenvolvimento e CTA — sem você precisar saber de copywriting.' },
  { id: 'image',     label: 'Imagem IA',  img: '/images/recursos/imagem-ia.jpg',    title: 'Visual cinematográfico',       body: 'fal.ai Flux 2 Pro gera imagens de fundo para cada slide com base no conteúdo real. O resultado é um carrossel que parece produção de estúdio.' },
  { id: 'studio',    label: 'Studio',     img: '/images/recursos/studio.jpg',       title: 'Editor visual completo',       body: 'Ajuste fonte, cor, tamanho, imagem, sobreposição e posição de cada slide. O que a IA gera é ponto de partida — você finaliza como quiser.' },
  { id: 'calendar',  label: 'Calendário', img: '/images/recursos/calendario.jpg',   title: 'Seu tabuleiro de conteúdo',    body: 'Visualize todos os carrosseis no calendário e organize sua presença digital por semana ou mês. Nunca mais posta no improviso.' },
  { id: 'export',    label: 'Export',     img: '/images/recursos/export.jpg',       title: 'Pronto pra postar',            body: 'Exporte cada slide como PNG em alta resolução (1080×1350). Ideal para Stories e Feed. Sem marca d\'água nos planos pagos.' },
  { id: 'workspace', label: 'Workspace',  img: '/images/recursos/workspace.jpg',    title: 'Para times e agências',        body: 'Crie múltiplos workspaces para clientes diferentes. Cada workspace tem seu próprio calendário, carrosseis e configurações.' },
]

const SLIDE_IMAGES = [
  '/images/slides-virais/viral-1.jpg',
  '/images/slides-virais/viral-2.jpg',
  '/images/slides-virais/viral-3.jpg',
  '/images/slides-virais/viral-4.jpg',
  '/images/slides-virais/viral-5.jpg',
  '/images/slides-virais/viral-6.jpg',
  '/images/slides-virais/viral-7.jpg',
  '/images/slides-virais/viral-8.jpg',
]

const TESTIMONIALS = [
  { name: 'Ana Luiza Pires',  handle: '@analuiza.conteudo',  img: '/images/creators/analuiza.jpg',      stars: 5, text: 'Em 3 minutos tenho um carrossel completo. Isso mudou minha relação com conteúdo.' },
  { name: 'Pedro Alves',      handle: '@pedroalves.ads',     img: '/images/creators/pedroalves.jpg',    stars: 5, text: 'Recomendo para qualquer criador que quer escalar sem contratar equipe.' },
  { name: 'Marina Fonseca',   handle: '@marinafonseca.mkt',  img: '/images/creators/marinafonseca.jpg', stars: 5, text: 'Criei 12 carrosseis em uma tarde. Antes levava uma semana no Canva.' },
  { name: 'João Henrique',    handle: '@joaohenrique.mkt',   img: '/images/creators/joaohenrique.jpg',  stars: 5, text: 'A copy que a IA gera já vem no meu tom. Para de parecer IA genérica.' },
  { name: 'Beatriz Leal',     handle: '@bealeal.criadora',   img: '/images/creators/bealeal.jpg',       stars: 5, text: 'Finalmente consigo postar todo dia sem travar na hora de criar.' },
  { name: 'Rafael Costa',     handle: '@rafacosta.mentor',   img: '/images/creators/rafacosta.jpg',     stars: 5, text: 'Uso para meus clientes também. A identidade visual de cada um fica separada.' },
  { name: 'Camila Rocha',     handle: '@camilarocha.ia',     img: '/images/creators/camilarocha.jpg',   stars: 5, text: 'A imagem IA realmente entende o que o slide precisa. Não é imagem genérica.' },
]

const FAQ_ITEMS = [
  { q: 'Como a IA gera o conteúdo?',          a: 'Você descreve o tema do carrossel. O Claude (Anthropic) analisa e gera copy para cada slide: título, subtítulo e corpo com narrativa estratégica. A imagem IA (fal.ai Flux 2 Pro) usa esse contexto para gerar um visual cinematográfico.' },
  { q: 'Quantos carrosseis posso criar?',      a: 'Depende do plano: Free 3/mês, Construtor 50/mês, Escala 150/mês, Agência 300/mês. A exportação é ilimitada a partir do Escala. O contador reseta todo mês.' },
  { q: 'A imagem IA tem limite?',              a: 'Sim. Free: 3/mês. Construtor: 20. Escala: 60. Agência: 150. A geração de copy é o produto principal e está inclusa na cota de carrosseis. Você pode usar suas próprias imagens sem limite em todos os planos.' },
  { q: 'Posso cancelar a qualquer momento?',   a: 'Sim. Sem fidelidade, sem multa. Cancele pelo painel e o plano segue ativo até o fim do período pago.' },
  { q: 'Funciona para qualquer nicho?',        a: 'Sim. A IA foi calibrada para criadores de conteúdo, coaches, nutricionistas, designers, agências, e-commerce e qualquer perfil que queira crescer no Instagram.' },
  { q: 'O que é o Studio?',                   a: 'É o editor visual do ConteúdOS. Depois que a IA gera os slides, você pode ajustar fonte, cor, tamanho de texto, imagem de fundo, opacidade de overlay e posição — tudo sem sair da plataforma.' },
  { q: 'Preciso instalar algo?',               a: 'Não. ConteúdOS roda 100% no navegador. Acesse de qualquer dispositivo, sem download.' },
  { q: 'O carrossel sai pronto pra postar?',   a: 'Sim. Exporte cada slide como PNG 1080×1350 — o formato ideal para feed e stories do Instagram. Sem marca d\'água nos planos pagos.' },
]

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
:root {
  --ig:   linear-gradient(135deg,#00D4FF 0%,#6366F1 50%,#00D4FF 100%);
  --c1:   #00D4FF;
  --c2:   #6366F1;
  --c3:   #C8FF00;
  --bg:   #010816;
  --bg2:  #060E1F;
  --bg3:  #0B1528;
  --text: #E8EDF5;
  --muted:#8899AA;
  --r:    14px;
}
*{box-sizing:border-box;margin:0;padding:0;}
body{background:var(--bg);color:var(--text);font-family:'Space Grotesk','DM Sans',sans-serif;-webkit-font-smoothing:antialiased;}
.lp-wrap{overflow-x:hidden;}

/* topbar */
.topbar{height:4px;background:linear-gradient(90deg,#00A8CC,#00D4FF,#6366F1,#00D4FF,#C8FF00,#00D4FF,#6366F1,#00A8CC);background-size:300% 100%;animation:topbarFlow 6s linear infinite;}
@keyframes topbarFlow{0%{background-position:0% 0%}100%{background-position:300% 0%}}

/* nav */
.nav{position:sticky;top:0;z-index:100;padding:0 5%;height:64px;display:flex;align-items:center;justify-content:space-between;transition:background .3s,backdrop-filter .3s;}
.nav.scrolled{background:rgba(1,8,22,.82);backdrop-filter:blur(20px);border-bottom:1px solid rgba(0,212,255,.06);}
.nav-logo{font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:.06em;background:var(--ig);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.nav-links{display:flex;gap:32px;list-style:none;}
.nav-links a{color:var(--muted);text-decoration:none;font-size:14px;font-weight:500;transition:color .2s;}
.nav-links a:hover{color:var(--text);}
.nav-cta{padding:9px 22px;border-radius:999px;background:var(--ig);color:#fff;font-size:14px;font-weight:600;cursor:pointer;border:none;transition:opacity .2s,transform .2s;}
.nav-cta:hover{opacity:.85;transform:translateY(-1px);}
.nav-burger{display:none;flex-direction:column;gap:5px;cursor:pointer;padding:4px;}
.nav-burger span{display:block;width:22px;height:2px;background:var(--text);border-radius:2px;}
.mob-menu{display:none;position:fixed;inset:0;z-index:200;background:rgba(1,8,22,.97);flex-direction:column;align-items:center;justify-content:center;gap:32px;}
.mob-menu.open{display:flex;}
.mob-menu a{color:var(--text);text-decoration:none;font-family:'Bebas Neue',sans-serif;font-size:32px;letter-spacing:.06em;}
.mob-close{position:absolute;top:20px;right:24px;font-size:28px;color:var(--muted);cursor:pointer;background:none;border:none;}
@media(max-width:768px){.nav-links,.nav-cta{display:none;}.nav-burger{display:flex;}}

/* hero */
.hero{min-height:92vh;display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:64px;padding:80px 5% 60px;}
.hero-sec-lbl{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;background:rgba(0,212,255,.08);border:1px solid rgba(0,212,255,.2);color:var(--c1);font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:20px;}
.hero h1{font-family:'Bebas Neue',sans-serif;font-size:clamp(44px,6vw,76px);line-height:.96;letter-spacing:.02em;margin-bottom:20px;}
.gt2{background:linear-gradient(135deg,#00D4FF,#6366F1,#C8FF00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.hero-sub{color:var(--muted);font-size:17px;line-height:1.65;margin-bottom:36px;max-width:480px;}
.hero-btns{display:flex;gap:12px;flex-wrap:wrap;align-items:center;}
.btn-primary{padding:14px 30px;border-radius:999px;background:var(--ig);color:#fff;font-size:15px;font-weight:700;cursor:pointer;border:none;transition:opacity .2s,transform .2s,box-shadow .2s;box-shadow:0 8px 30px rgba(0,212,255,.25);}
.btn-primary:hover{opacity:.9;transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,212,255,.35);}
.btn-ghost{padding:14px 24px;border-radius:999px;background:transparent;border:1px solid rgba(0,212,255,.25);color:var(--c1);font-size:15px;font-weight:600;cursor:pointer;transition:background .2s,border-color .2s;}
.btn-ghost:hover{background:rgba(0,212,255,.07);border-color:rgba(0,212,255,.5);}
.hero-stats{display:flex;gap:28px;margin-top:36px;padding-top:28px;border-top:1px solid rgba(255,255,255,.06);}
.stat-num{font-family:'Bebas Neue',sans-serif;font-size:28px;color:var(--c1);letter-spacing:.04em;}
.stat-lbl{font-size:12px;color:var(--muted);}
@media(max-width:900px){.hero{grid-template-columns:1fr;gap:40px;text-align:center;padding:60px 5%;}.hero-sub{max-width:none;}.hero-btns,.hero-stats{justify-content:center;}.hero-visual{display:none;}}

/* divider */
.div{height:1px;background:linear-gradient(90deg,transparent,rgba(0,212,255,.15),transparent);margin:0 5%;}

/* creators */
.creators{padding:48px 0;overflow:hidden;}
.creators-lbl{text-align:center;font-size:12px;color:var(--muted);letter-spacing:.12em;text-transform:uppercase;margin-bottom:28px;}
.cr-track-wrap{overflow:hidden;position:relative;}
.cr-track-wrap::before,.cr-track-wrap::after{content:'';position:absolute;top:0;bottom:0;width:100px;z-index:2;}
.cr-track-wrap::before{left:0;background:linear-gradient(90deg,var(--bg),transparent);}
.cr-track-wrap::after{right:0;background:linear-gradient(-90deg,var(--bg),transparent);}
.cr-track{display:flex;gap:16px;width:max-content;animation:creatorScroll 30s linear infinite;}
.cr-item{display:flex;align-items:center;gap:10px;padding:10px 18px;border-radius:999px;background:var(--bg2);border:1px solid rgba(255,255,255,.06);white-space:nowrap;}
.cr-ring{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:13px;color:#fff;flex-shrink:0;overflow:hidden;}
.cr-ring img{width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;}
.cr-handle{font-size:13px;font-weight:500;color:var(--text);}
@keyframes creatorScroll{0%{transform:translateX(0)}100%{transform:translateX(-33.333%)}}

/* section header */
.sec-hd{text-align:center;margin-bottom:60px;}
.sec-lbl{display:inline-block;font-size:12px;color:var(--c1);letter-spacing:.12em;text-transform:uppercase;font-weight:600;margin-bottom:12px;}
.sec-hd h2{font-family:'Bebas Neue',sans-serif;font-size:clamp(36px,5vw,60px);letter-spacing:.02em;line-height:1;margin-bottom:12px;}
.sec-hd p{color:var(--muted);font-size:16px;max-width:480px;margin:0 auto;}

/* plans */
.plans-sec{padding:100px 5%;}
.plans-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;max-width:1100px;margin:0 auto;}
.plan{background:var(--bg2);border:1px solid rgba(255,255,255,.06);border-radius:20px;padding:32px 26px;display:flex;flex-direction:column;gap:20px;transition:border-color .3s,transform .3s;position:relative;}
.plan:hover{border-color:rgba(0,212,255,.2);transform:translateY(-4px);}
.plan.pop{background:linear-gradient(135deg,rgba(0,212,255,.06),rgba(99,102,241,.1));border-color:rgba(0,212,255,.3);transform:translateY(-8px);}
.plan.pop:hover{transform:translateY(-12px);}
.plan-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);padding:4px 14px;border-radius:999px;background:var(--ig);font-size:11px;font-weight:700;color:#fff;letter-spacing:.06em;white-space:nowrap;}
.plan-name{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:.06em;color:var(--text);}
.plan-price-row{display:flex;align-items:baseline;gap:4px;}
.plan-price{font-family:'Bebas Neue',sans-serif;font-size:42px;color:var(--c1);letter-spacing:.02em;line-height:1;}
.plan-period{font-size:14px;color:var(--muted);}
.plan-features{list-style:none;display:flex;flex-direction:column;gap:10px;flex:1;}
.plan-features li{display:flex;align-items:center;gap:10px;font-size:14px;color:var(--muted);}
.plan-features li::before{content:'✓';width:18px;height:18px;border-radius:50%;background:rgba(0,212,255,.12);color:var(--c1);font-size:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.plan-btn{padding:12px 0;border-radius:999px;font-size:14px;font-weight:700;cursor:pointer;border:none;transition:opacity .2s,transform .2s;width:100%;}
.plan.pop .plan-btn{background:var(--ig);color:#fff;}
.plan:not(.pop) .plan-btn{background:transparent;border:1px solid rgba(255,255,255,.15);color:var(--text);}
.plan-btn:hover{opacity:.85;transform:translateY(-1px);}
@media(max-width:900px){.plans-grid{grid-template-columns:1fr 1fr;gap:16px;}.plan.pop{transform:none;}.plan.pop:hover{transform:translateY(-4px);}}
@media(max-width:520px){.plans-grid{grid-template-columns:1fr;}}

/* truth */
.truth{padding:100px 5%;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;}
.truth-num{font-family:'Bebas Neue',sans-serif;font-size:120px;line-height:1;background:linear-gradient(135deg,rgba(0,212,255,.15),transparent);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:-16px;}
.truth h2{font-family:'Bebas Neue',sans-serif;font-size:clamp(36px,4vw,52px);letter-spacing:.02em;line-height:1.05;margin-bottom:20px;}
.truth p{color:var(--muted);line-height:1.7;font-size:16px;margin-bottom:20px;}
.truth-visual{aspect-ratio:1;max-width:400px;border-radius:20px;background:var(--bg2);border:1px solid rgba(0,212,255,.1);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}
.truth-visual-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(0,212,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,.04) 1px,transparent 1px);background-size:32px 32px;}
@media(max-width:900px){.truth{grid-template-columns:1fr;gap:40px;}}

/* steps */
.steps-sec{padding:100px 5%;}
.steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;max-width:900px;margin:0 auto;}
.step{background:var(--bg2);border:1px solid rgba(255,255,255,.06);border-radius:20px;padding:32px 28px;transition:border-color .3s,transform .3s;}
.step:hover{border-color:rgba(0,212,255,.2);transform:translateY(-4px);}
.step-num{font-family:'Bebas Neue',sans-serif;font-size:60px;line-height:1;background:linear-gradient(135deg,rgba(0,212,255,.3),transparent);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:16px;}
.step h3{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:.04em;margin-bottom:10px;color:var(--text);}
.step p{color:var(--muted);font-size:14px;line-height:1.65;}
@media(max-width:768px){.steps-grid{grid-template-columns:1fr;}}

/* slide marquees */
.slides-sec{padding:80px 0;overflow:hidden;}
.slides-track-wrap{overflow:hidden;position:relative;margin-bottom:16px;}
.slides-track-wrap::before,.slides-track-wrap::after{content:'';position:absolute;top:0;bottom:0;width:100px;z-index:2;}
.slides-track-wrap::before{left:0;background:linear-gradient(90deg,var(--bg),transparent);}
.slides-track-wrap::after{right:0;background:linear-gradient(-90deg,var(--bg),transparent);}
.slides-track{display:flex;gap:16px;width:max-content;}
.slides-track.fwd{animation:marquee 20s linear infinite;}
.slides-track.rev{animation:marqueeReverse 22s linear infinite;}
@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes marqueeReverse{0%{transform:translateX(-50%)}100%{transform:translateX(0)}}
.ws-card{width:180px;height:220px;border-radius:12px;background:var(--bg2);border:1px solid rgba(255,255,255,.06);flex-shrink:0;overflow:hidden;position:relative;display:flex;flex-direction:column;padding:14px;}
.ws-card-num{font-size:10px;color:var(--c1);font-family:'Bebas Neue',sans-serif;letter-spacing:.1em;margin-bottom:6px;}
.ws-card-title{font-size:13px;font-family:'Bebas Neue',sans-serif;color:#fff;line-height:1.2;letter-spacing:.03em;}
.ws-card-bar{position:absolute;bottom:12px;left:14px;right:14px;height:2px;border-radius:1px;opacity:.7;}

/* features */
.fs-sec{padding:100px 5%;}
.fs-tabs{display:flex;gap:4px;padding:6px;background:var(--bg2);border-radius:14px;margin-bottom:40px;width:fit-content;margin-left:auto;margin-right:auto;}
.fs-tab{padding:9px 20px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;border:none;background:transparent;color:var(--muted);transition:background .2s,color .2s;}
.fs-tab.active{background:rgba(0,212,255,.12);color:var(--c1);}
.fs-content{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;max-width:960px;margin:0 auto;}
.fs-content h3{font-family:'Bebas Neue',sans-serif;font-size:40px;letter-spacing:.04em;margin-bottom:16px;}
.fs-content p{color:var(--muted);font-size:16px;line-height:1.7;}
.fs-visual{aspect-ratio:4/3;border-radius:16px;background:var(--bg2);border:1px solid rgba(0,212,255,.1);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}
.fs-visual-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(0,212,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,.04) 1px,transparent 1px);background-size:32px 32px;}
.fs-mobile{display:none;flex-direction:column;gap:16px;}
.fs-card{background:var(--bg2);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:24px;cursor:pointer;transition:border-color .3s;}
.fs-card.open{border-color:rgba(0,212,255,.25);}
.fs-card-hd{display:flex;justify-content:space-between;align-items:center;}
.fs-card-hd h3{font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:.04em;}
.fs-card-body{margin-top:12px;color:var(--muted);font-size:14px;line-height:1.65;}
@media(max-width:768px){.fs-tabs,.fs-content{display:none;}.fs-mobile{display:flex;}}

/* ia section */
.ia-sec{padding:100px 5%;background:linear-gradient(135deg,rgba(0,212,255,.04),rgba(99,102,241,.04));border-top:1px solid rgba(0,212,255,.08);border-bottom:1px solid rgba(0,212,255,.08);}
.ia-grid{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;max-width:1100px;margin:0 auto;}
.ia-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:28px;}
.ia-chip{padding:6px 14px;border-radius:999px;border:1px solid rgba(0,212,255,.2);color:var(--c1);font-size:12px;font-weight:600;}
@media(max-width:900px){.ia-grid{grid-template-columns:1fr;gap:40px;}}

/* transparency */
.transp-sec{padding:100px 5%;}
.transp-cards{display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:700px;margin:40px auto 0;}
.transp-card{background:var(--bg2);border:1px solid rgba(255,255,255,.06);border-radius:20px;padding:32px 28px;text-align:center;}
.transp-card-icon{font-family:'Bebas Neue',sans-serif;font-size:48px;color:var(--c1);margin-bottom:12px;}
.transp-card h3{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:.04em;margin-bottom:8px;}
.transp-card p{color:var(--muted);font-size:14px;line-height:1.6;}
@media(max-width:520px){.transp-cards{grid-template-columns:1fr;}}

/* testimonials */
.deps-sec{padding:80px 0;overflow:hidden;}
.dep-track-wrap{overflow:hidden;position:relative;}
.dep-track-wrap::before,.dep-track-wrap::after{content:'';position:absolute;top:0;bottom:0;width:140px;z-index:2;}
.dep-track-wrap::before{left:0;background:linear-gradient(90deg,var(--bg),transparent);}
.dep-track-wrap::after{right:0;background:linear-gradient(-90deg,var(--bg),transparent);}
.dep-track{display:flex;gap:20px;width:max-content;animation:depScroll 40s linear infinite;}
.dep{width:300px;background:var(--bg2);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:24px;flex-shrink:0;}
.dep-stars{color:var(--c1);font-size:13px;margin-bottom:12px;letter-spacing:2px;}
.dep-text{font-size:14px;line-height:1.65;color:var(--text);margin-bottom:16px;}
.dep-author{display:flex;align-items:center;gap:10px;}
.dep-av{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:13px;color:#fff;flex-shrink:0;overflow:hidden;}
.dep-av img{width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;}
.dep-handle{font-size:13px;font-weight:600;color:var(--muted);}
@keyframes depScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

/* faq */
.faq-sec{padding:100px 5%;}
.faq-list{max-width:700px;margin:0 auto;display:flex;flex-direction:column;gap:12px;}
.faq-item{background:var(--bg2);border:1px solid rgba(255,255,255,.06);border-radius:14px;overflow:hidden;transition:border-color .3s;}
.faq-item.open{border-color:rgba(0,212,255,.2);}
.faq-q{width:100%;background:none;border:none;padding:20px 24px;display:flex;justify-content:space-between;align-items:center;color:var(--text);font-size:15px;font-weight:600;cursor:pointer;text-align:left;gap:16px;}
.faq-icon{color:var(--c1);font-size:20px;flex-shrink:0;transition:transform .3s;}
.faq-item.open .faq-icon{transform:rotate(45deg);}
.faq-a{padding:0 24px 20px;color:var(--muted);font-size:14px;line-height:1.7;}

/* suporte */
.suporte-sec{padding:80px 5%;}
.suporte-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:900px;margin:0 auto;}
.sup-card{background:var(--bg2);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:28px 24px;text-align:center;transition:border-color .3s,transform .3s;cursor:pointer;text-decoration:none;display:block;}
.sup-card:hover{border-color:rgba(0,212,255,.2);transform:translateY(-4px);}
.sup-icon{font-size:28px;margin-bottom:12px;}
.sup-card h4{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:.04em;margin-bottom:6px;color:var(--text);}
.sup-card p{font-size:13px;color:var(--muted);}
@media(max-width:600px){.suporte-grid{grid-template-columns:1fr;}}

/* cta */
.cta-sec{padding:100px 5%;text-align:center;background:radial-gradient(ellipse at 50% 0%,rgba(0,212,255,.08),transparent 70%);}
.cta-sec h2{font-family:'Bebas Neue',sans-serif;font-size:clamp(40px,6vw,72px);letter-spacing:.02em;line-height:1;margin-bottom:20px;}
.cta-sec p{color:var(--muted);font-size:17px;max-width:440px;margin:0 auto 36px;line-height:1.6;}

/* footer */
.footer{padding:60px 5% 40px;border-top:1px solid rgba(255,255,255,.06);}
.footer-top{display:grid;grid-template-columns:1.5fr repeat(3,1fr);gap:40px;margin-bottom:48px;}
.footer-logo{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:.06em;background:var(--ig);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;display:inline-block;margin-bottom:12px;}
.footer-brand p{font-size:13px;color:var(--muted);line-height:1.65;max-width:240px;}
.footer-col h5{font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:.1em;color:var(--muted);margin-bottom:16px;}
.footer-col ul{list-style:none;display:flex;flex-direction:column;gap:10px;}
.footer-col a{font-size:13px;color:var(--muted);text-decoration:none;transition:color .2s;cursor:pointer;}
.footer-col a:hover{color:var(--text);}
.footer-bottom{display:flex;justify-content:space-between;align-items:center;padding-top:28px;border-top:1px solid rgba(255,255,255,.06);font-size:12px;color:var(--muted);}
@media(max-width:768px){.footer-top{grid-template-columns:1fr 1fr;}.footer-bottom{flex-direction:column;gap:8px;text-align:center;}}
@media(max-width:420px){.footer-top{grid-template-columns:1fr;}}

/* aos */
.aos{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease;}
.aos.in{opacity:1;transform:translateY(0);}

/* live demo — keyframes usados pelo LiveCarouselDemo */
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shimmerMove{0%{background-position:0% 0%}100%{background-position:200% 0%}}

/* magnetic / glow on cta */
.glow-orbit{position:relative;}
.glow-orbit::before{content:'';position:absolute;inset:-1px;border-radius:inherit;padding:1px;background:conic-gradient(from var(--ang,0deg),#00D4FF,#6366F1,#C8FF00,#00D4FF);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:0;transition:opacity .3s;}
.glow-orbit:hover::before{opacity:1;animation:rotateAng 2.4s linear infinite;}
@keyframes rotateAng{to{--ang:360deg}}

/* 21dev placeholder */
@keyframes gridPan{0%{background-position:0 0}100%{background-position:48px 48px}}
@keyframes pulse{0%,100%{opacity:1;box-shadow:0 0 8px #00D4FF}50%{opacity:.5;box-shadow:0 0 16px #00D4FF}}
`

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()
  const [scrolled,    setScrolled]    = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [openFaq,     setOpenFaq]     = useState<string | null>(null)
  const [activeTab,   setActiveTab]   = useState('copy')
  const [openFsCard,  setOpenFsCard]  = useState<string | null>(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const els = document.querySelectorAll('.aos')
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') }),
      { threshold: 0.12 }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  // ── Lenis (scroll suave) acoplado ao ticker do GSAP/ScrollTrigger ──────────
  // Dá a sensação de "rolagem com peso" e mantém os ScrollTriggers sincronizados
  // com o scroll virtual do Lenis (sem isso, pin/scrub ficam dessincronizados).
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
      gsap.ticker.remove((time) => lenis.raf(time * 1000))
    }
  }, [])

  // ── Parallax sutil no visual do hero — acompanha o scroll com profundidade ─
  const heroVisualRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!heroVisualRef.current) return
    const ctx = gsap.context(() => {
      gsap.to(heroVisualRef.current, {
        yPercent: 14,
        ease: 'none',
        scrollTrigger: { trigger: heroVisualRef.current, start: 'top top', end: 'bottom top', scrub: 0.6 },
      })
    })
    return () => ctx.revert()
  }, [])

  const activeFeature = FEATURES.find(f => f.id === activeTab) ?? FEATURES[0]
  const creators3 = [...CREATORS, ...CREATORS, ...CREATORS]
  const slides4   = [...SLIDE_IMAGES, ...SLIDE_IMAGES, ...SLIDE_IMAGES, ...SLIDE_IMAGES]
  const deps2     = [...TESTIMONIALS, ...TESTIMONIALS]

  return (
    <>
      <style>{CSS}</style>
      <div className="lp-wrap">

        {/* topbar */}
        <div className="topbar" />

        {/* nav */}
        <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
          <div className="nav-logo">ConteúdOS</div>
          <ul className="nav-links">
            <li><a href="#planos">Planos</a></li>
            <li><a href="#como-funciona">Como funciona</a></li>
            <li><a href="#recursos">Recursos</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
          <button className="nav-cta" onClick={() => navigate('/dashboard')}>Começar grátis</button>
          <div className="nav-burger" onClick={() => setMobileOpen(true)}>
            <span /><span /><span />
          </div>
        </nav>

        {/* mobile menu */}
        <div className={`mob-menu${mobileOpen ? ' open' : ''}`}>
          <button className="mob-close" onClick={() => setMobileOpen(false)}>✕</button>
          <a href="#planos"        onClick={() => setMobileOpen(false)}>Planos</a>
          <a href="#como-funciona" onClick={() => setMobileOpen(false)}>Como funciona</a>
          <a href="#recursos"      onClick={() => setMobileOpen(false)}>Recursos</a>
          <a href="#faq"           onClick={() => setMobileOpen(false)}>FAQ</a>
          <button className="btn-primary" onClick={() => { setMobileOpen(false); navigate('/dashboard') }}>
            Começar grátis
          </button>
        </div>

        {/* hero */}
        <section className="hero">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <div className="hero-sec-lbl"><span>✦</span> Veja a IA montar um carrossel — ao vivo, agora</div>
            <h1>
              Você descreve.<br />
              <span className="gt2">Ela constrói.</span><br />
              Em tempo real.
            </h1>
            <p className="hero-sub">
              O ConteúdOS acabou de montar esse carrossel ao vivo — sem Canva, sem prompt técnico, sem designer.
              Você descreve o tema, ele escreve a copy, gera a imagem e entrega pronto pra postar.
            </p>
            <div className="hero-btns">
              <Magnetic>
                <button className="btn-primary glow-orbit" onClick={() => navigate('/dashboard')}>Montar meu primeiro carrossel →</button>
              </Magnetic>
              <button className="btn-ghost" onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}>Ver demo abaixo ↓</button>
            </div>
            <div className="hero-stats">
              <div><div className="stat-num">3min</div><div className="stat-lbl">do tema ao slide pronto</div></div>
              <div><div className="stat-num">até 15</div><div className="stat-lbl">slides por carrossel</div></div>
              <div><div className="stat-num">0</div><div className="stat-lbl">apps extras pra abrir</div></div>
            </div>
          </motion.div>
          {/* ── HERO DIREITA: Shader + demo viva do produto rodando ── */}
          <div ref={heroVisualRef} className="hero-visual" style={{
            position: 'relative',
            width: '100%',
            maxWidth: '480px',
            flexShrink: 0,
          }}>
            {/* Shader como fundo atmosférico */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: '20px', overflow: 'hidden', zIndex: 0, opacity: 0.5 }}>
              <CyberneticGridShader />
            </div>
            {/* Vinheta para fundir com o fundo da página */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '20px',
              background: 'radial-gradient(ellipse at center, transparent 35%, rgba(1,8,22,0.65) 100%)',
              zIndex: 1, pointerEvents: 'none',
            }} />
            {/* Demo viva — o produto rodando de verdade, em loop */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              <LiveCarouselDemo />
            </div>
          </div>
        </section>

        <div className="div" />

        {/* creator strip */}
        <section className="creators">
          <p className="creators-lbl">criadores que já montam o tabuleiro deles</p>
          <div className="cr-track-wrap">
            <div className="cr-track">
              {creators3.map((c, i) => (
                <div className="cr-item" key={i}>
                  <div className="cr-ring">
                    <img src={c.img} alt={c.name} loading="lazy" />
                  </div>
                  <span className="cr-handle">{c.handle}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="div" />

        {/* plans #1 */}
        <section className="plans-sec" id="planos">
          <Reveal className="sec-hd">
            <div className="sec-lbl">planos</div>
            <h2>Escolha seu <span className="gt2">nível</span></h2>
            <p>Do criador solo à agência digital. Sem contrato, cancele quando quiser.</p>
          </Reveal>
          <RevealGroup className="plans-grid" gap={0.1}>
            {PLANS.map(p => (
              <motion.div className={`plan${p.pop ? ' pop' : ''}`} key={p.name} variants={fadeUp} whileHover={{ y: -6 }}>
                {p.pop && <div className="plan-badge">MAIS POPULAR</div>}
                <div className="plan-name">{p.name}</div>
                <div className="plan-price-row">
                  <div className="plan-price">{p.price}</div>
                  {p.period && <div className="plan-period">{p.period}</div>}
                </div>
                <ul className="plan-features">{p.features.map(f => <li key={f}>{f}</li>)}</ul>
                <Magnetic strength={26}>
                  <button className="plan-btn" onClick={() => navigate('/dashboard')}>{p.cta}</button>
                </Magnetic>
              </motion.div>
            ))}
          </RevealGroup>
          <Reveal delay={0.15}>
            <p style={{ textAlign: 'center', color: 'var(--muted)', maxWidth: '680px', margin: '32px auto 0', fontSize: '14px', lineHeight: 1.7 }}>
              Copy completa inclusa em cada carrossel gerado — o limite é de carrosseis por mês, nunca de texto.<br />
              Imagem IA tem cota separada porque gera custo real de processamento. Suba suas próprias imagens sem limite, em qualquer plano.
            </p>
          </Reveal>
        </section>

        {/* verdade brutal */}
        <section className="truth">
          <Reveal>
            <div className="truth-num">97%</div>
            <h2>Você posta.<br />Eles <span className="gt2">jogam outro jogo.</span></h2>
            <p>97% dos perfis publicam no escuro — sem tema fixo, sem narrativa, sem sequência. O algoritmo nota essa falta de padrão e empurra pra baixo. Não é falta de talento: é falta de tabuleiro.</p>
            <p>Os perfis que crescem pensam em peças que se conectam — cada carrossel puxa o próximo, constrói autoridade post a post. O ConteúdOS monta esse tabuleiro com você, com IA, em minutos.</p>
            <Magnetic><button className="btn-primary glow-orbit" onClick={() => navigate('/dashboard')}>Montar meu tabuleiro →</button></Magnetic>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="truth-visual">
              <div className="truth-visual-grid" />
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '40px', fontFamily: '"Bebas Neue",sans-serif' }}
              >
                <div style={{ fontSize: '72px', lineHeight: 1, background: 'linear-gradient(135deg,#00D4FF,#6366F1,#C8FF00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  TABULEIRO
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(0,212,255,0.4)', letterSpacing: '0.12em', marginTop: '8px' }}>
                  ESTRATÉGIA · CONSISTÊNCIA · RESULTADO
                </div>
              </motion.div>
            </div>
          </Reveal>
        </section>

        {/* como funciona */}
        <section className="steps-sec" id="como-funciona">
          <Reveal className="sec-hd">
            <div className="sec-lbl">como funciona</div>
            <h2>O mesmo processo que você <span className="gt2">acabou de ver</span></h2>
            <p>3 passos. Sem aprender prompt, sem contratar designer, sem perder a tarde inteira numa ferramenta de design.</p>
          </Reveal>
          <RevealGroup className="steps-grid" gap={0.12}>
            {STEPS.map(s => (
              <motion.div className="step" key={s.num} variants={fadeUp} whileHover={{ y: -6, borderColor: 'rgba(0,212,255,.35)' }} transition={{ duration: 0.3 }}>
                <div className="step-num">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </motion.div>
            ))}
          </RevealGroup>
        </section>

        {/* slide marquees */}
        <section className="slides-sec">
          <div className="slides-track-wrap">
            <div className="slides-track fwd">
              {slides4.map((src, i) => (
                <div className="ws-card" key={i} style={{ padding: 0, overflow: 'hidden', borderColor: 'transparent' }}>
                  <img src={src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ))}
            </div>
          </div>
          <div className="slides-track-wrap">
            <div className="slides-track rev">
              {[...slides4].reverse().map((src, i) => (
                <div className="ws-card" key={i} style={{ padding: 0, overflow: 'hidden', borderColor: 'transparent' }}>
                  <img src={src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* recursos */}
        <section className="fs-sec" id="recursos">
          <Reveal className="sec-hd">
            <div className="sec-lbl">recursos</div>
            <h2>Tudo que o carrossel precisa, <span className="gt2">num lugar só</span></h2>
            <p>Da ideia ao arquivo pronto pra postar — sem trocar de ferramenta no meio do caminho.</p>
          </Reveal>
          <div className="fs-tabs">
            {FEATURES.map(f => (
              <button key={f.id} className={`fs-tab${activeTab === f.id ? ' active' : ''}`} onClick={() => setActiveTab(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="fs-content">
            <motion.div key={activeFeature.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <h3>{activeFeature.title}</h3>
              <p>{activeFeature.body}</p>
            </motion.div>
            <motion.div className="fs-visual" style={{ padding: 0, overflow: 'hidden' }}
              key={activeFeature.id + '-img'}
              initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <img src={activeFeature.img} alt={activeFeature.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </motion.div>
          </div>
          <div className="fs-mobile">
            {FEATURES.map(f => (
              <div key={f.id} className={`fs-card${openFsCard === f.id ? ' open' : ''}`} onClick={() => setOpenFsCard(openFsCard === f.id ? null : f.id)}>
                <div className="fs-card-hd">
                  <h3>{f.title}</h3>
                  <span style={{ color: 'var(--c1)', fontSize: '18px' }}>{openFsCard === f.id ? '−' : '+'}</span>
                </div>
                {openFsCard === f.id && <p className="fs-card-body">{f.body}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* ia section — mudança 3 */}
        <section className="ia-sec">
          <div className="ia-grid">
            <Reveal>
              <div className="sec-lbl">IA contextual</div>
              <h2 style={{ fontFamily: '"Bebas Neue",sans-serif', fontSize: 'clamp(36px,4vw,52px)', letterSpacing: '.02em', lineHeight: 1.05, marginBottom: '16px' }}>
                Ela não improvisa.<br />Ela <span className="gt2">lê antes de gerar</span>
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '16px', lineHeight: 1.7, marginBottom: '28px' }}>
                Antes de escrever uma linha ou desenhar um pixel, a IA lê o conteúdo real daquele slide específico — o título, o corpo, a intenção por trás. É por isso que a copy não soa genérica e a imagem realmente conversa com o texto, em vez de competir com ele.
              </p>
              <div className="ia-chips">
                <div className="ia-chip">Claude Sonnet</div>
                <div className="ia-chip">fal.ai Flux 2 Pro</div>
                <div className="ia-chip">Contexto por slide</div>
                <div className="ia-chip">Narrativa estratégica</div>
              </div>
            </Reveal>
            <motion.div className="fs-visual" style={{ padding: 0, overflow: 'hidden' }}
              initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            >
              <img src="/images/recursos/imagem-ia.jpg" alt="IA Contextual"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </motion.div>
          </div>
        </section>

        {/* transparência — mudança 7 */}
        <section className="transp-sec">
          <Reveal className="sec-hd">
            <div className="sec-lbl">limites</div>
            <h2>Sem letra miúda. <span className="gt2">Sem pegadinha.</span></h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p style={{ textAlign: 'center', color: 'var(--muted)', maxWidth: '620px', margin: '0 auto', fontSize: '16px', lineHeight: 1.7 }}>
              Cada plano tem um número de carrosseis por mês — copy completa inclusa em cada um. Imagem IA tem cota separada porque gera custo real de processamento (não é frescura: é GPU rodando de verdade). Você sempre vê quanto usou e quanto resta, antes de gerar.
            </p>
          </Reveal>
          <RevealGroup className="transp-cards" gap={0.12}>
            <motion.div className="transp-card" variants={fadeUp} whileHover={{ y: -4 }}>
              <div className="transp-card-icon" style={{ fontSize: '36px' }}>📄</div>
              <h3>COPY POR CARROSSEL</h3>
              <p>Cada carrossel gerado inclui copy completa — título, corpo e legenda. O limite é de carrosseis por mês, não de caracteres ou tokens.</p>
            </motion.div>
            <motion.div className="transp-card" variants={fadeUp} whileHover={{ y: -4 }}>
              <div className="transp-card-icon" style={{ fontSize: '32px' }}>IA</div>
              <h3>IMAGEM IA COM LIMITE</h3>
              <p>Free 3 · Construtor 20 · Escala 60 · Agência 150</p>
              <p style={{ marginTop: '8px', fontSize: '13px' }}>Suba suas próprias imagens sem limite, em qualquer plano — sempre que quiser.</p>
            </motion.div>
          </RevealGroup>
        </section>

        {/* plans #2 */}
        <section className="plans-sec" style={{ paddingTop: 60 }}>
          <Reveal className="sec-hd">
            <div className="sec-lbl">preços</div>
            <h2>Sem letra miúda. <span className="gt2">Comece grátis hoje.</span></h2>
            <p>Todos os planos incluem Studio, Calendário e Export PNG. Cancele quando quiser, sem perguntas.</p>
          </Reveal>
          <RevealGroup className="plans-grid" gap={0.1}>
            {PLANS.map(p => (
              <motion.div className={`plan${p.pop ? ' pop' : ''}`} key={p.name + '2'} variants={fadeUp} whileHover={{ y: -6 }}>
                {p.pop && <div className="plan-badge">MAIS POPULAR</div>}
                <div className="plan-name">{p.name}</div>
                <div className="plan-price-row">
                  <div className="plan-price">{p.price}</div>
                  {p.period && <div className="plan-period">{p.period}</div>}
                </div>
                <ul className="plan-features">{p.features.map(f => <li key={f}>{f}</li>)}</ul>
                <Magnetic strength={26}>
                  <button className="plan-btn" onClick={() => navigate('/dashboard')}>{p.cta}</button>
                </Magnetic>
              </motion.div>
            ))}
          </RevealGroup>
          <Reveal delay={0.15}>
            <p style={{ textAlign: 'center', color: 'var(--muted)', maxWidth: '680px', margin: '32px auto 0', fontSize: '14px', lineHeight: 1.7 }}>
              Copy completa inclusa em cada carrossel gerado — o limite é de carrosseis por mês, nunca de texto.<br />
              Imagem IA tem cota separada porque gera custo real de processamento (GPU rodando de verdade). Suba suas próprias imagens sem limite, em qualquer plano.
            </p>
          </Reveal>
        </section>

        {/* testimonials */}
        <section className="deps-sec">
          <Reveal className="sec-hd" style={{ padding: '0 5% 48px' }}>
            <div className="sec-lbl">depoimentos</div>
            <h2>Gente real, <span className="gt2">resultado real</span></h2>
          </Reveal>
          <div className="dep-track-wrap">
            <div className="dep-track">
              {deps2.map((d, i) => (
                <motion.div className="dep" key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6, delay: (i % 6) * 0.06, ease: [0.16, 1, 0.3, 1] }}>
                  <div className="dep-stars">★★★★★</div>
                  <p className="dep-text">"{d.text}"</p>
                  <div className="dep-author">
                    <div className="dep-av">
                      <img src={d.img} alt={d.name} loading="lazy" />
                    </div>
                    <span className="dep-handle">{d.handle}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* faq */}
        <section className="faq-sec" id="faq">
          <Reveal className="sec-hd">
            <div className="sec-lbl">faq</div>
            <h2>Antes de você <span className="gt2">perguntar</span></h2>
          </Reveal>
          <RevealGroup className="faq-list" gap={0.06}>
            {FAQ_ITEMS.map((item, i) => (
              <motion.div key={i} variants={fadeUp} className={`faq-item${openFaq === String(i) ? ' open' : ''}`}>
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === String(i) ? null : String(i))}>
                  {item.q}
                  <motion.span className="faq-icon" animate={{ rotate: openFaq === String(i) ? 45 : 0 }} transition={{ duration: 0.25 }}>+</motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === String(i) && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <p className="faq-a">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </RevealGroup>
        </section>

        {/* suporte */}
        <section className="suporte-sec">
          <Reveal className="sec-hd">
            <div className="sec-lbl">suporte</div>
            <h2>Travou em algo? <span className="gt2">A gente resolve.</span></h2>
          </Reveal>
          <RevealGroup className="suporte-grid" gap={0.1}>
            <motion.a className="sup-card" variants={fadeUp} whileHover={{ y: -4 }} href="https://wa.me/5511999999999" target="_blank" rel="noreferrer">
              <div className="sup-icon">💬</div>
              <h4>WhatsApp</h4>
              <p>Resposta rápida em dias úteis</p>
            </motion.a>
            <motion.a className="sup-card" variants={fadeUp} whileHover={{ y: -4 }} href="mailto:contato@conteudos.tech">
              <div className="sup-icon">✉️</div>
              <h4>E-mail</h4>
              <p>contato@conteudos.tech</p>
            </motion.a>
            <motion.a className="sup-card" variants={fadeUp} whileHover={{ y: -4 }} href="https://instagram.com/i_mdiego" target="_blank" rel="noreferrer">
              <div className="sup-icon">📸</div>
              <h4>Instagram</h4>
              <p>@i_mdiego</p>
            </motion.a>
          </RevealGroup>
        </section>

        {/* cta final */}
        <section className="cta-sec">
          <Reveal>
            <h2>Daqui a <span className="gt2">3 minutos</span><br />seu primeiro carrossel pode estar pronto.</h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p>Sem cartão. Sem instalar nada. É só descrever o tema e ver a IA construir — do jeito que você acabou de ver lá em cima.</p>
          </Reveal>
          <Reveal delay={0.22}>
            <Magnetic strength={14}>
              <button className="btn-primary glow-orbit" onClick={() => navigate('/dashboard')}>Criar minha conta grátis →</button>
            </Magnetic>
          </Reveal>
        </section>

        {/* footer */}
        <footer className="footer">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo">ConteúdOS</div>
              <p>Tabuleiro de conteúdo com IA para criadores que querem crescer de forma estratégica no Instagram.</p>
            </div>
            <div className="footer-col">
              <h5>Produto</h5>
              <ul>
                <li><a href="#como-funciona">Como funciona</a></li>
                <li><a href="#recursos">Recursos</a></li>
                <li><a href="#planos">Planos</a></li>
                <li><a onClick={() => navigate('/dashboard')}>Dashboard</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h5>Empresa</h5>
              <ul>
                <li><a href="mailto:contato@conteudos.tech">Contato</a></li>
                <li><a href="https://instagram.com/i_mdiego" target="_blank" rel="noreferrer">Instagram</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h5>Legal</h5>
              <ul>
                <li><a href="#">Termos de uso</a></li>
                <li><a href="#">Privacidade</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 ConteúdOS — Todos os direitos reservados</span>
            <span>conteudos.tech</span>
          </div>
        </footer>

      </div>
    </>
  )
}
