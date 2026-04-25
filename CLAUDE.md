# ConteudOS — Contexto do Projeto

## O que é
SaaS de criação de carrosseis virais para Instagram com IA.
Domínio: conteudos.tech
Repositório: https://github.com/diegomtd/conteudos-tech

## Stack
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: Supabase (DB + Auth + Edge Functions + Storage)
- IA texto: Claude API (claude-sonnet-4-20250514)
- IA imagem: Gemini gemini-3.1-flash-image-preview (Nano Banana)
- Pagamentos: Cakto (assinaturas) + InfinitePay (avulso)
- Email: Resend
- Notificações: Telegram Bot
- Deploy: Vercel + GitHub

## Design System
- Fundo dark: #050D14
- Fundo card: #0A1E30
- Accent cyan: #00B4D8
- Accent escuro: #0077A8
- Fonte display: Bebas Neue
- Fonte texto: DM Sans

## Planos
- Free: 1 exportação/mês com marca d'água ConteudOS
- Starter R$47: 20 exportações/mês
- Pro R$97: 50 exportações/mês + calendário + Telegram
- Agency R$197: 150 exportações/mês + 5 subcontas
- Créditos extras: R$29 por 20 exportações adicionais

## Regras absolutas de copy (IA)
- ZERO travessão em qualquer campo
- ZERO ponto de exclamação
- ZERO conectivos de IA: portanto, ademais, vale destacar, sendo assim
- Tom direto, observacional, humano
- Cada slide = uma ideia

## Rotas
- / → Landing (público)
- /auth → Login/cadastro (público)
- /preview/:token → Preview público do carrossel (sem auth)
- /dashboard → Painel principal (protegido)
- /studio → Criação de carrossel (protegido)
- /calendar → Calendário de posts (protegido)
- /settings → Configurações (protegido)
- /admin → Painel admin (protegido + role=admin)

## Canvas Editor — Especificacoes tecnicas

### Tipo Slide completo (usar exatamente esses campos)
bgZoom: number 50-300 default 100 — backgroundSize
bgPosX: number 0-100 default 50 — backgroundPositionX
bgPosY: number 0-100 default 50 — backgroundPositionY
bgFilter: string — filter CSS aplicado SOMENTE na div da imagem (zIndex 0)
bgVisible: boolean — display none/block na div da imagem
imageOpacity: number 10-100 — opacity da div da imagem
overlayOpacity: number 0-90 — opacity do overlay escuro (zIndex 1)
borderVignette: boolean — boxShadow inset 0 0 80px rgba(0,0,0,0.7) no overlay
titleFontSize, titleFontFamily, fontWeightTitle, titleItalic, titleUppercase
titleLetterSpacing: number 0-10
titleLineHeight: number 0.8-2.5 default 1.1
textColor: string — cor do titulo
titleBgEnabled: boolean + titleBgColor: string — highlight fundo titulo
titleShadow: boolean + titleShadowIntensity: number 0-20
bodyFontSize, bodyFontFamily, bodyFontWeight, bodyItalic
bodyColor: string — cor do corpo SEPARADA do titulo
bodyBgEnabled: boolean + bodyBgColor: string
bodyLineHeight: number 1.2-3 default 1.6
bodyLetterSpacing: number 0-10
textAlign, textPosition, paddingX, blockSpacing, titlePos

### Regras do SlideRenderer
- filter SOMENTE na div zIndex 0 (imagem), nunca no container pai
- overlayOpacity e imageOpacity sao layers separadas — nao misturar
- titleBgEnabled aplica backgroundColor no proprio <p> com padding 2px 8px borderRadius 4px
- bodyColor e textColor sao campos SEPARADOS — corpo tem cor independente
- Quando bgZoom != 100, usar backgroundSize como porcentagem, nao 'cover'

### Painel de edicao — UX obrigatorio
- Cada slider: label caps 10px + valor numerico atualizado em tempo real a direita
- Botao Reset inline quando valor diferente do default
- Controles de TITULO e CORPO em sub-abas separadas dentro da secao TEXTOS
- 6 templates em grid 2x3, todos visiveis sem scroll
- Efeitos: Original, P&B, Sepia, Frio, Quente, Vintage, Dramatico, Desbotado
