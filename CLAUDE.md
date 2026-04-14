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
