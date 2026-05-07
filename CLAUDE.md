# ConteudOS — CLAUDE.md

## REGRAS DE TRABALHO (LEIA ANTES DE QUALQUER AÇÃO)

### Economia de tokens — OBRIGATÓRIO
- NUNCA usar `cat` em Studio.tsx, SlideRenderer.tsx ou qualquer arquivo >200 linhas
- SEMPRE usar `grep -n "padrão"` para localizar antes de editar
- SEMPRE usar `sed -n 'X,Yp'` para ler apenas o trecho necessário
- 1 arquivo por prompt — nunca editar 2 arquivos ao mesmo tempo
- `npm run build` antes de qualquer push — nunca push sem build limpo

### Antes de qualquer mudança
1. grep -n para confirmar que o padrão existe
2. Ler apenas o bloco relevante com sed
3. Editar cirurgicamente — NÃO refatorar o que não foi pedido
4. Build + push

## STACK
Frontend: React 18 + TypeScript + Vite + Tailwind v4
Backend: Supabase PostgreSQL + RLS + Edge Functions (Deno)
IA Copy: claude-sonnet-4-20250514
IA Image: fal-ai/flux-2-pro
Deploy: Vercel (auto no push main)

## ARQUIVOS CRÍTICOS
- src/pages/Studio.tsx (~3500 linhas) — NUNCA usar cat
- src/components/SlideRenderer.tsx (~1000 linhas) — NUNCA usar cat

## SISTEMA DE SAVE
- saveFormatToDb(slideId, dbUpdates)
- UUID → .eq('id', slideId)
- 'slide-N' → .eq('position', N)
- triggerAutoSave foi REMOVIDO — não recriar
- Capturar capturedSlideId ANTES do setTimeout (closure fix)

## BUGS RESOLVIDOS — NÃO REGREDIR
- triggerAutoSave sobrescrevia edições → REMOVIDO
- UUID slides não salvavam → dual path id/position
- Race condition handleDone → setTimeout 50ms
- handleDone sem UUIDs → reload banco 600ms após geração
- Export texto minúsculo → scale=1 + pixelRatio=2
- Closure stale → captura antes do setTimeout

## SLIDE_TO_COL (React → banco)
titleFontSize→font_size_title, bodyFontSize→font_size_body,
fontFamily→font_family, textColor→text_color, bodyColor→body_color,
textAlign→text_align, bgZoom→bg_zoom, bgPositionX→bg_pos_x,
bgPositionY→bg_pos_y, overlayOpacity→overlay_opacity,
highlightedWords→highlighted_words, accentColor→accent_color

## TOKENS DE DESIGN
BG=#080808, S=#0F0F0F, S2=#141414, A=#C8FF00 (accent verde lima)
ff=Bebas Neue, ffBody=DM Sans
