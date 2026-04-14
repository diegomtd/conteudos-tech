# ConteudOS — PRD Completo

## Visão
Laboratório de viralidade com IA. O usuário cola um conteúdo que viralizou, a IA decodifica os hacks psicológicos e recria com a voz e identidade visual do criador.

## Diferencial central
Nenhuma ferramenta atual analisa POR QUE um conteúdo viralizou. O ConteudOS faz isso e aplica os mesmos mecanismos na recriação.

## Hacks psicológicos detectados
- Curiosity Gap
- Identity Mirror
- Zeigarnik Effect
- Pattern Interrupt
- Social Proof implícito

## Fluxo principal
1. Usuário define tema (ou cola conteúdo viral para análise)
2. Claude gera JSON da copy — custa token mas NÃO conta como exportação
3. Editor visual tipo Canva — edição zero custo (só JSON local)
4. Usuário escolhe estilo de imagem de fundo (7 opções)
5. Preview HTML gerado em tempo real
6. Usuário clica Exportar → Nano Banana gera imagem → Export PNG ZIP
7. ZIP disponível para download → conta 1 crédito do plano
8. Usuário agenda no calendário → Telegram avisa 10 min antes de postar

## Exportação (o que conta como crédito)
Só o download do ZIP conta. Gerar e editar rascunhos é gratuito.
Custo por exportação: ~R$0,32 (Claude copy + Nano Banana + Playwright)

## Slides
- Mínimo: 3 slides
- Máximo: 15 slides
- Padrão: 7 slides
- Definido antes de gerar
- Adicionável depois sem custo (slide vazio) ou com custo mínimo (gerar com IA)
- Editável sem custo via interface visual

## Imagem de fundo (7 estilos)
- Cinemático: fotografia dark dramática, navy blue, cyan
- Fotorrealista: foto limpa natural
- Abstrato: formas fluidas, azuis oceano
- Ilustração: traço editorial limpo
- Dark Minimal: fundo escuro, geometria sutil
- Gradiente: navy para cyan
- Cenário real: ambiente do nicho do usuário
Limite: 3 regenerações por post, depois só upload manual

## Legenda (gerada na mesma chamada da copy)
Estrutura obrigatória:
1. Gancho (1-2 linhas) — para o scroll, não revela conteúdo
2. Corpo (3-5 parágrafos curtos) — complementa, não repete slides
3. CTA — escolhido pelo usuário:
   ① Engajamento ② Salvar ③ Seguir ④ DM ⑤ Link na bio
   ⑥ Palavra mágica ⑦ Personalizado ⑧ Padrão do perfil

## Hashtags
Opcional. Até 5, geradas na mesma chamada. Toggle on/off.

## Banco de dados (Supabase)

### Tabelas
- organizations: id, owner_user_id, name, plan, seats_used, seats_limit
- profiles: id, user_id FK, organization_id nullable, role, display_name, instagram_handle, niche, voice_profile jsonb, visual_kit jsonb, plan DEFAULT 'free', exports_used_this_month DEFAULT 0, exports_limit DEFAULT 1, onboarding_completed DEFAULT false
- content_analyses: id, user_id, input_url, input_text, analysis_json jsonb
- carousels: id, user_id, analysis_id nullable, tema, tom, num_slides, slides_json jsonb, html_url, preview_token uuid, has_watermark boolean, status DEFAULT 'draft', exported_at
- carousel_slides: id, carousel_id FK, position, titulo, corpo, hack_aplicado, bg_image_url, custom_styles jsonb
- usage_logs: id, user_id, action, tokens_used, cost_brl decimal
- scheduled_posts: id, user_id, carousel_id nullable, tema, scheduled_at, notify_minutes_before DEFAULT 10, telegram_notified DEFAULT false, status DEFAULT 'pending'
- weekly_trends: id, nicho, week_start date, temas jsonb

### RLS
- Todas as tabelas: auth.uid() = user_id
- Organizations: owner vê tudo da org
- weekly_trends: SELECT público, INSERT só service_role

## Edge Functions (Supabase Deno)
- analyze-content: analisa conteúdo viral com Claude
- generate-carousel: gera copy JSON com Claude
- generate-image: gera imagem com Nano Banana
- build-html: monta HTML + salva Storage
- export-slides: Playwright → PNG → ZIP
- cakto-webhook: processa pagamentos
- send-telegram: envia notificações
- trends-weekly: busca trends semanais (ativa com 10+ usuários pagos)

## Melhores horários por dia (benchmark BR)
- Segunda: 08:00 | 13:00 | 19:00
- Terça: 08:00 | 12:00 | 19:30
- Quarta: 07:30 | 13:00 | 20:00
- Quinta: 08:00 | 12:30 | 19:00
- Sexta: 08:00 | 13:00 | 18:00
- Sábado: 09:00 | 14:00 | 20:00
- Domingo: 10:00 | 15:00 | 19:00

## Tom por horário
- Manhã (5h-12h): motivacional, foco, energia
- Tarde (12h-18h): educativo, estratégico, valor
- Noite (18h-24h): introspectivo, identidade, emoção

## Onboarding (5 passos, máx 3 min)
1. Nome + Instagram handle + nicho
2. Escolha de voz (4 exemplos reais de copy)
3. Kit visual (cor + estilo + fonte)
4. Texto de exemplo próprio (calibra voz)
5. Primeiro carrossel direto

## Segurança
- NUNCA expor service_role no frontend
- preview_token: UUID único por carrossel, expira em 7 dias
- Webhook Cakto: sempre validar assinatura
- Tokens de API: nunca no código, sempre em .env

## Postagem
- MVP: notificação Telegram 10 min antes, usuário posta manualmente
- Futuro: flag auto_publish_enabled para ativar postagem automática
- Preview link enviado no Telegram: conteudos.tech/preview/{token}

## Margem por plano
- Free: custo de aquisição
- Starter R$47: margem ~81%
- Pro R$97: margem ~81%
- Agency R$197: margem ~73%
- Créditos extras R$29: margem ~78%
