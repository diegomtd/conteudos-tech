# ConteudOS — Estado do Projeto

## O que é
SaaS de carrosseis virais para Instagram com IA.
Stack: React 18 + TypeScript + Vite + Tailwind + Supabase + Claude API + fal.ai
Supabase project ref: klqfdgstclcqalhvhciv

## Planos (nomes atualizados)
- free: 3 exportações/mês, 0 imagens IA
- criador R$47: 20 exportações/mês, 20 imagens IA
- profissional R$97: exportações ilimitadas, 60 imagens IA + calendário + Telegram
- agencia R$197: exportações ilimitadas, 200 imagens IA + 5 subcontas

## O que está funcionando
- Auth completo
- Onboarding 5 passos
- Dashboard com métricas (exportações + imagens IA)
- Studio: input → generating → preview
- Geração de copy via Claude API (bloqueia no limite do plano)
- Edge Functions: generate-carousel, generate-image, reset-monthly-counters, webhook-cakto
- Preview com bgImageUrl no phone mockup
- Export ZIP (bloqueia quando canExport = false)
- Controle de ai_images_limit no banco
- Editor de texto: font size, peso, cor, alinhamento por slide
- Drag & drop do título na capa
- Upload de imagem própria por slide
- Overlay opacity slider por slide
- 6 templates de carrossel (Impacto, Editorial, Lista, Citação, Comparação, Narrativa)
- SlideRenderer.tsx — componente unificado para mockup e export
- template_style salvo no banco (carousels.template_style)
- Comparação template: campos beforeText/afterText editáveis separadamente
- Cron de reset mensal (todo dia 1 às 00:00 UTC)
- Webhook Cakto ativo (mapeia product_id → plano automaticamente)

## Modelo de imagem IA
- Modelo atual: fal-ai/flux-2-pro
- image_size: { width: 1080, height: 1350 } (4:5, Instagram padrão)
- NO TEXT prefix/suffix forte no prompt
- 1 imagem por carrossel (aplicada em todos os slides)
- Limites por plano: free=0, criador=20, profissional=60, agencia=200

## Variáveis de ambiente necessárias (Supabase Edge Functions)
- SUPABASE_URL — automático
- SUPABASE_SERVICE_ROLE_KEY — automático
- ANTHROPIC_API_KEY — chave da API do Claude
- FAL_KEY — chave da API fal.ai
- CAKTO_WEBHOOK_SECRET — token que a Cakto envia no header x-kiwify-token
- CAKTO_PRODUCT_CRIADOR — ID do produto Criador na Cakto
- CAKTO_PRODUCT_PROFISSIONAL — ID do produto Profissional na Cakto
- CAKTO_PRODUCT_AGENCIA — ID do produto Agência na Cakto

## Deploy de funções
```
supabase functions deploy generate-carousel --no-verify-jwt
supabase functions deploy generate-image --no-verify-jwt
supabase functions deploy reset-monthly-counters --no-verify-jwt
supabase functions deploy webhook-cakto --no-verify-jwt
```

## Problemas resolvidos

### ✅ RESOLVIDO — Imagens com texto dentro (2026-04-20)
Migrado para fal-ai/flux-2-pro com NO_TEXT prefix/suffix.

### ✅ RESOLVIDO — Editor de texto (2026-04-20)
Font size, peso, cor, alinhamento, drag title, overlay opacity.

### ✅ RESOLVIDO — Templates de carrossel (2026-04-20)
6 templates com SlideRenderer.tsx. Salvo em carousels.template_style.

### ✅ RESOLVIDO — exports_limit e ai_images_limit no banco (2026-04-20)

### ✅ RESOLVIDO — Acesso a carrosseis salvos (2026-04-20)
Dashboard → Studio com ?carousel_id= carrega slides do banco.

### ✅ RESOLVIDO — Comparação template editor (2026-04-22)
beforeText/afterText campos independentes.

### ✅ RESOLVIDO — Gaps pré-lançamento (2026-04-22)
- Migration 002 com ai_images_limit + ai_images_used_this_month
- Tipos Profile atualizados
- generate-carousel bloqueia no limite (403 export_limit_reached)
- Cron reset-monthly-counters todo dia 1
- Dashboard/Sidebar mostra saldo de imagens IA
- Webhook Cakto implementado

## Problemas em aberto por prioridade

### 1. ALTO — Copy com dados inventados
Claude gera estatísticas falsas.
FIX: Web search antes de gerar copy para buscar dados reais do nicho.

### 2. MÉDIO — Preview /preview/:token é placeholder

### 3. MÉDIO — Deploy Vercel não feito

### 4. MÉDIO — Configurar variáveis CAKTO_* no painel Supabase
URL do webhook para a Cakto: https://klqfdgstclcqalhvhciv.supabase.co/functions/v1/webhook-cakto

## Próximo passo imediato
Item 1: Copy com dados reais — web search antes de gerar para evitar estatísticas inventadas.
