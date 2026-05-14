import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CREATORS = [
  { handle: '@marina.mkt',   initials: 'MM', color: '#00D4FF' },
  { handle: '@joao.criador', initials: 'JC', color: '#6366F1' },
  { handle: '@bia.social',   initials: 'BS', color: '#C8FF00' },
  { handle: '@pedro.ads',    initials: 'PA', color: '#00D4FF' },
  { handle: '@carol.brand',  initials: 'CB', color: '#6366F1' },
  { handle: '@rafa.content', initials: 'RC', color: '#C8FF00' },
  { handle: '@lucas.mkt',    initials: 'LM', color: '#00D4FF' },
  { handle: '@ana.viral',    initials: 'AV', color: '#6366F1' },
  { handle: '@diego.ia',     initials: 'DI', color: '#C8FF00' },
  { handle: '@julia.posts',  initials: 'JP', color: '#00D4FF' },
]

const PLANS = [
  {
    name: 'Free', price: 'R$0', period: '', pop: false,
    features: ['3 carrosseis/mês', 'Copy IA básica', '3 imagens IA/mês', '1 workspace', 'Export PNG'],
    cta: 'Começar grátis',
  },
  {
    name: 'Construtor', price: 'R$47', period: '/mês', pop: false,
    features: ['30 carrosseis/mês', 'Copy IA avançada', '20 imagens IA/mês', 'Calendário editorial', 'Export PNG + PDF'],
    cta: 'Assinar agora',
  },
  {
    name: 'Escala', price: 'R$97', period: '/mês', pop: true,
    features: ['100 carrosseis/mês', 'Copy estratégica premium', '60 imagens IA/mês', 'Múltiplos workspaces', 'Calendário + agendamento'],
    cta: 'Escolher Escala',
  },
  {
    name: 'Agência', price: 'R$197', period: '/mês', pop: false,
    features: ['Carrosseis ilimitados', 'Copy white-label', '200 imagens IA/mês', 'Até 10 clientes', 'Suporte prioritário'],
    cta: 'Falar com time',
  },
]

const STEPS = [
  { num: '01', title: 'Descreva o tema', body: 'Digite o assunto do carrossel. A IA entende contexto, tom e objetivo — não precisa de prompt técnico.' },
  { num: '02', title: 'IA gera tudo', body: 'Copy estratégica, título de cada slide, corpo e imagem cinematográfica gerados em segundos.' },
  { num: '03', title: 'Publique', body: 'Ajuste o que quiser no Studio, exporte em PNG e poste direto no Instagram.' },
]

const FEATURES = [
  { id: 'copy',      label: 'Copy IA',    title: 'Copy que para o scroll',       body: 'Cada slide recebe título, subtítulo e corpo calibrados para engajamento. A IA lê o tema e gera narrativa com gancho, desenvolvimento e CTA — sem você precisar saber de copywriting.' },
  { id: 'image',     label: 'Imagem IA',  title: 'Visual cinematográfico',       body: 'fal.ai Flux 2 Pro gera imagens de fundo para cada slide com base no conteúdo real. O resultado é um carrossel que parece produção de estúdio.' },
  { id: 'studio',    label: 'Studio',     title: 'Editor visual completo',       body: 'Ajuste fonte, cor, tamanho, imagem, sobreposição e posição de cada slide. O que a IA gera é ponto de partida — você finaliza como quiser.' },
  { id: 'calendar',  label: 'Calendário', title: 'Seu tabuleiro de conteúdo',    body: 'Visualize todos os carrosseis no calendário e organize sua presença digital por semana ou mês. Nunca mais posta no improviso.' },
  { id: 'export',    label: 'Export',     title: 'Pronto pra postar',            body: 'Exporte cada slide como PNG em alta resolução (1080×1350). Ideal para Stories e Feed. Sem marca d\'água nos planos pagos.' },
  { id: 'workspace', label: 'Workspace',  title: 'Para times e agências',        body: 'Crie múltiplos workspaces para clientes diferentes. Cada workspace tem seu próprio calendário, carrosseis e configurações.' },
]

const FAKE_SLIDES = [
  { num: '01', title: 'O ERRO QUE TRAVA 90% DOS PERFIS', accent: '#00D4FF' },
  { num: '02', title: 'VOCÊ POSTA PRA FANTASMA',          accent: '#6366F1' },
  { num: '03', title: 'META ADS NÃO ESTÁ MORRENDO',       accent: '#C8FF00' },
  { num: '04', title: 'A DECISÃO QUE QUEBROU 3 NEGÓCIOS', accent: '#00D4FF' },
  { num: '05', title: 'ALGORITMO NÃO É SEU INIMIGO',      accent: '#6366F1' },
  { num: '06', title: 'CONTEÚDO SEM ESTRATÉGIA É RUÍDO',  accent: '#C8FF00' },
  { num: '07', title: 'QUEM DOMINA O JOGO NÃO POSTA',     accent: '#00D4FF' },
  { num: '08', title: 'VIRALIZAR NÃO É SORTE',            accent: '#6366F1' },
]

const TESTIMONIALS = [
  { text: 'Criei 12 carrosseis em uma tarde. Antes levava uma semana no Canva.',                          handle: '@marina.mkt',   initials: 'MM', color: '#00D4FF' },
  { text: 'A copy que a IA gera é melhor do que o que eu escrevia depois de horas pensando.',             handle: '@joao.criador', initials: 'JC', color: '#6366F1' },
  { text: 'Meu engagement dobrou no primeiro mês. Finalmente tenho consistência.',                         handle: '@bia.social',   initials: 'BS', color: '#C8FF00' },
  { text: 'Uso o ConteúdOS para meus 5 clientes. Economizo 3 dias de trabalho por semana.',               handle: '@pedro.ads',    initials: 'PA', color: '#00D4FF' },
  { text: 'O Studio é incrível. Consigo personalizar cada detalhe sem sair do app.',                      handle: '@carol.brand',  initials: 'CB', color: '#6366F1' },
  { text: 'A imagem IA transformou o visual dos meus posts. Parece trabalho de designer.',                 handle: '@rafa.content', initials: 'RC', color: '#C8FF00' },
  { text: 'Nunca mais tive ansiedade de "o que eu posto hoje". O calendário resolve tudo.',               handle: '@lucas.mkt',    initials: 'LM', color: '#00D4FF' },
  { text: 'Em 3 minutos tenho um carrossel completo. Isso mudou minha relação com conteúdo.',             handle: '@ana.viral',    initials: 'AV', color: '#6366F1' },
  { text: 'Recomendo para qualquer criador que quer escalar sem contratar equipe.',                        handle: '@diego.ia',     initials: 'DI', color: '#C8FF00' },
]

const FAQ_ITEMS = [
  { q: 'Como a IA gera o conteúdo?',          a: 'Você descreve o tema do carrossel. O Claude (Anthropic) analisa e gera copy para cada slide: título, subtítulo e corpo com narrativa estratégica. A imagem IA (fal.ai Flux 2 Pro) usa esse contexto para gerar um visual cinematográfico.' },
  { q: 'Quantos carrosseis posso criar?',      a: 'Depende do plano: Free (3/mês), Construtor (30/mês), Escala (100/mês), Agência (ilimitado). O contador reseta todo mês.' },
  { q: 'A imagem IA tem limite?',              a: 'Sim. Free: 3/mês. Construtor: 20. Escala: 60. Agência: 200. A geração de copy é sempre ilimitada dentro da cota de carrosseis do plano.' },
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
@media(max-width:900px){.hero{grid-template-columns:1fr;gap:40px;text-align:center;padding:60px 5%;}.hero-sub{max-width:none;}.hero-btns,.hero-stats{justify-content:center;}}

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
.cr-ring{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:13px;color:#fff;flex-shrink:0;}
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
.dep-av{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:13px;color:#fff;flex-shrink:0;}
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

/* 21dev placeholder */
@keyframes gridPan{0%{background-position:0 0}100%{background-position:48px 48px}}
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

  const activeFeature = FEATURES.find(f => f.id === activeTab) ?? FEATURES[0]
  const creators3 = [...CREATORS, ...CREATORS, ...CREATORS]
  const slides4   = [...FAKE_SLIDES, ...FAKE_SLIDES, ...FAKE_SLIDES, ...FAKE_SLIDES]
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
          <div>
            <div className="hero-sec-lbl"><span>✦</span> Tabuleiro de conteúdo com IA</div>
            <h1>
              Não existe post<br />
              <span className="gt2">aleatório.</span><br />
              Existe tabuleiro.
            </h1>
            <p className="hero-sub">
              Monte sua estratégia de conteúdo com IA. Gere carrosseis virais para o Instagram
              em menos de 3 minutos — copy estratégica, design profissional, imagens cinematográficas.
            </p>
            <div className="hero-btns">
              <button className="btn-primary" onClick={() => navigate('/dashboard')}>Montar meu tabuleiro →</button>
              <button className="btn-ghost"   onClick={() => navigate('/dashboard')}>Ver como funciona</button>
            </div>
            <div className="hero-stats">
              <div><div className="stat-num">3min</div><div className="stat-lbl">por carrossel</div></div>
              <div><div className="stat-num">10+</div><div className="stat-lbl">slides gerados</div></div>
              <div><div className="stat-num">100%</div><div className="stat-lbl">no browser</div></div>
            </div>
          </div>
          <div>
            {/* EFEITO 21DEV — substituir este bloco quando Diego enviar o código */}
            <div style={{
              borderRadius: '20px', overflow: 'hidden', background: 'var(--bg2)',
              border: '1px solid rgba(0,212,255,0.1)', boxShadow: '0 32px 80px -20px rgba(0,212,255,0.2)',
              aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'linear-gradient(rgba(0,212,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,.04) 1px,transparent 1px)',
                backgroundSize: '48px 48px', animation: 'gridPan 20s linear infinite',
              }} />
              <div style={{
                position: 'relative', zIndex: 1, textAlign: 'center',
                fontFamily: '"Bebas Neue",sans-serif', fontSize: '13px',
                letterSpacing: '0.1em', color: 'rgba(0,212,255,0.35)',
              }}>
                EFEITO 21DEV<br />SERÁ INSERIDO AQUI
              </div>
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
                  <div className="cr-ring" style={{ background: `conic-gradient(${c.color},${c.color}80)` }}>{c.initials}</div>
                  <span className="cr-handle">{c.handle}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="div" />

        {/* plans #1 */}
        <section className="plans-sec" id="planos">
          <div className="sec-hd aos">
            <div className="sec-lbl">planos</div>
            <h2>Escolha seu <span className="gt2">nível</span></h2>
            <p>Do criador solo à agência digital. Sem contrato, cancele quando quiser.</p>
          </div>
          <div className="plans-grid">
            {PLANS.map(p => (
              <div className={`plan${p.pop ? ' pop' : ''}`} key={p.name}>
                {p.pop && <div className="plan-badge">MAIS POPULAR</div>}
                <div className="plan-name">{p.name}</div>
                <div className="plan-price-row">
                  <div className="plan-price">{p.price}</div>
                  {p.period && <div className="plan-period">{p.period}</div>}
                </div>
                <ul className="plan-features">{p.features.map(f => <li key={f}>{f}</li>)}</ul>
                <button className="plan-btn" onClick={() => navigate('/dashboard')}>{p.cta}</button>
              </div>
            ))}
          </div>
        </section>

        {/* verdade brutal */}
        <section className="truth">
          <div>
            <div className="truth-num">97%</div>
            <h2>Você posta.<br />Eles <span className="gt2">estrategizam.</span></h2>
            <p>97% dos criadores de conteúdo postam no improviso — sem tema fixo, sem narrativa, sem sequência. O resultado é feed aleatório que não converte nem fideliza.</p>
            <p>Os perfis que crescem de verdade têm tabuleiro. Cada post tem propósito. Cada carrossel tem lugar na estratégia. ConteúdOS monta esse tabuleiro pra você.</p>
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>Montar meu tabuleiro →</button>
          </div>
          <div>
            <div className="truth-visual">
              <div className="truth-visual-grid" />
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '40px', fontFamily: '"Bebas Neue",sans-serif' }}>
                <div style={{ fontSize: '72px', lineHeight: 1, background: 'linear-gradient(135deg,#00D4FF,#6366F1,#C8FF00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  TABULEIRO
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(0,212,255,0.4)', letterSpacing: '0.12em', marginTop: '8px' }}>
                  ESTRATÉGIA · CONSISTÊNCIA · RESULTADO
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* como funciona */}
        <section className="steps-sec" id="como-funciona">
          <div className="sec-hd aos">
            <div className="sec-lbl">como funciona</div>
            <h2>3 passos do <span className="gt2">zero ao post</span></h2>
            <p>Sem aprender prompt. Sem contratar designer. Sem perder horas.</p>
          </div>
          <div className="steps-grid">
            {STEPS.map(s => (
              <div className="step aos" key={s.num}>
                <div className="step-num">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* slide marquees */}
        <section className="slides-sec">
          <div className="slides-track-wrap">
            <div className="slides-track fwd">
              {slides4.map((s, i) => (
                <div className="ws-card" key={i} style={{ borderColor: `${s.accent}22` }}>
                  <div className="ws-card-num">SLIDE {s.num}</div>
                  <div className="ws-card-title">{s.title}</div>
                  <div className="ws-card-bar" style={{ background: s.accent }} />
                </div>
              ))}
            </div>
          </div>
          <div className="slides-track-wrap">
            <div className="slides-track rev">
              {[...slides4].reverse().map((s, i) => (
                <div className="ws-card" key={i} style={{ borderColor: `${s.accent}22` }}>
                  <div className="ws-card-num">SLIDE {s.num}</div>
                  <div className="ws-card-title">{s.title}</div>
                  <div className="ws-card-bar" style={{ background: s.accent }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* recursos */}
        <section className="fs-sec" id="recursos">
          <div className="sec-hd aos">
            <div className="sec-lbl">recursos</div>
            <h2>Tudo que você precisa <span className="gt2">em um lugar</span></h2>
          </div>
          <div className="fs-tabs">
            {FEATURES.map(f => (
              <button key={f.id} className={`fs-tab${activeTab === f.id ? ' active' : ''}`} onClick={() => setActiveTab(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="fs-content">
            <div>
              <h3>{activeFeature.title}</h3>
              <p>{activeFeature.body}</p>
            </div>
            <div className="fs-visual">
              <div className="fs-visual-grid" />
              <div style={{ position: 'relative', zIndex: 1, fontFamily: '"Bebas Neue",sans-serif', fontSize: '13px', letterSpacing: '0.1em', color: 'rgba(0,212,255,0.35)', textAlign: 'center' }}>
                {activeFeature.label.toUpperCase()}<br />PREVIEW
              </div>
            </div>
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
            <div className="aos">
              <div className="sec-lbl">IA contextual</div>
              <h2 style={{ fontFamily: '"Bebas Neue",sans-serif', fontSize: 'clamp(36px,4vw,52px)', letterSpacing: '.02em', lineHeight: 1.05, marginBottom: '16px' }}>
                Copy e imagem geradas<br />com <span className="gt2">contexto real</span>
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '16px', lineHeight: 1.7, marginBottom: '28px' }}>
                A IA lê o conteúdo de cada slide antes de gerar. O resultado é copy estratégica e imagem cinematográfica que complementam exatamente o que o slide precisa comunicar.
              </p>
              <div className="ia-chips">
                <div className="ia-chip">Claude Sonnet</div>
                <div className="ia-chip">fal.ai Flux 2 Pro</div>
                <div className="ia-chip">Contexto por slide</div>
                <div className="ia-chip">Narrativa estratégica</div>
              </div>
            </div>
            <div className="fs-visual">
              <div className="fs-visual-grid" />
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', fontFamily: '"Bebas Neue",sans-serif', fontSize: '13px', letterSpacing: '0.1em', color: 'rgba(0,212,255,0.35)' }}>
                IA CONTEXTUAL<br />PREVIEW
              </div>
            </div>
          </div>
        </section>

        {/* transparência — mudança 7 */}
        <section className="transp-sec">
          <div className="sec-hd aos">
            <div className="sec-lbl">limites</div>
            <h2>Transparência total <span className="gt2">sobre os limites</span></h2>
          </div>
          <p style={{ textAlign: 'center', color: 'var(--muted)', maxWidth: '620px', margin: '0 auto', fontSize: '16px', lineHeight: 1.7 }}>
            A geração de copy é ilimitada em todos os planos — texto, título, subtítulo e estrutura narrativa sem restrição. Imagem IA tem limite por plano porque cada geração tem custo real (usamos fal.ai, não repassamos markup). Você sempre sabe quanto tem disponível antes de gerar.
          </p>
          <div className="transp-cards">
            <div className="transp-card">
              <div className="transp-card-icon">∞</div>
              <h3>Copy ilimitada</h3>
              <p>∞ carrosseis com texto em todos os planos</p>
            </div>
            <div className="transp-card">
              <div className="transp-card-icon" style={{ fontSize: '32px' }}>IA</div>
              <h3>Imagem IA com limite</h3>
              <p>Free 3 · Construtor 20 · Escala 60 · Agência 200</p>
            </div>
          </div>
        </section>

        {/* plans #2 */}
        <section className="plans-sec" style={{ paddingTop: 60 }}>
          <div className="sec-hd aos">
            <div className="sec-lbl">preços</div>
            <h2>Comece hoje, <span className="gt2">escale amanhã</span></h2>
            <p>Todos os planos incluem Studio, Calendário e Export PNG.</p>
          </div>
          <div className="plans-grid">
            {PLANS.map(p => (
              <div className={`plan${p.pop ? ' pop' : ''}`} key={p.name + '2'}>
                {p.pop && <div className="plan-badge">MAIS POPULAR</div>}
                <div className="plan-name">{p.name}</div>
                <div className="plan-price-row">
                  <div className="plan-price">{p.price}</div>
                  {p.period && <div className="plan-period">{p.period}</div>}
                </div>
                <ul className="plan-features">{p.features.map(f => <li key={f}>{f}</li>)}</ul>
                <button className="plan-btn" onClick={() => navigate('/dashboard')}>{p.cta}</button>
              </div>
            ))}
          </div>
        </section>

        {/* testimonials */}
        <section className="deps-sec">
          <div className="sec-hd aos" style={{ padding: '0 5% 48px' }}>
            <div className="sec-lbl">depoimentos</div>
            <h2>Quem já <span className="gt2">monta o tabuleiro</span></h2>
          </div>
          <div className="dep-track-wrap">
            <div className="dep-track">
              {deps2.map((d, i) => (
                <div className="dep" key={i}>
                  <div className="dep-stars">★★★★★</div>
                  <p className="dep-text">"{d.text}"</p>
                  <div className="dep-author">
                    <div className="dep-av" style={{ background: `conic-gradient(${d.color},${d.color}80)` }}>{d.initials}</div>
                    <span className="dep-handle">{d.handle}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* faq */}
        <section className="faq-sec" id="faq">
          <div className="sec-hd aos">
            <div className="sec-lbl">faq</div>
            <h2>Perguntas <span className="gt2">frequentes</span></h2>
          </div>
          <div className="faq-list">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className={`faq-item${openFaq === String(i) ? ' open' : ''}`}>
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === String(i) ? null : String(i))}>
                  {item.q}
                  <span className="faq-icon">+</span>
                </button>
                {openFaq === String(i) && <p className="faq-a">{item.a}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* suporte */}
        <section className="suporte-sec">
          <div className="sec-hd aos">
            <div className="sec-lbl">suporte</div>
            <h2>Sempre que <span className="gt2">precisar</span></h2>
          </div>
          <div className="suporte-grid">
            <a className="sup-card" href="https://wa.me/55SEUNUMERO" target="_blank" rel="noreferrer">
              <div className="sup-icon">💬</div>
              <h4>WhatsApp</h4>
              <p>Resposta rápida em dias úteis</p>
            </a>
            <a className="sup-card" href="mailto:contato@conteudos.tech">
              <div className="sup-icon">✉️</div>
              <h4>E-mail</h4>
              <p>contato@conteudos.tech</p>
            </a>
            <a className="sup-card" href="https://instagram.com/i_mdiego" target="_blank" rel="noreferrer">
              <div className="sup-icon">📸</div>
              <h4>Instagram</h4>
              <p>@i_mdiego</p>
            </a>
          </div>
        </section>

        {/* cta final */}
        <section className="cta-sec">
          <h2 className="aos">Monte seu<br /><span className="gt2">tabuleiro agora.</span></h2>
          <p className="aos">Crie sua conta grátis e gere seu primeiro carrossel em menos de 3 minutos.</p>
          <button className="btn-primary" onClick={() => navigate('/dashboard')}>Começar grátis →</button>
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
