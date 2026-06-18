# Design — Fase 2: Meus Vencedores

Data: 2026-06-18
Status: Aprovado para implementação

## Problema

O usuário pediu (no pedido original da central de ideias) "saber os melhores
pra replicar". O sistema não tem nenhuma métrica de desempenho: a tabela
`carousels` guarda `tema`, `tom`, `template_style`, `status`, mas nada sobre
como o post performou. Sem isso, a IA não tem como recomendar repetir o que
funcionou.

A Fase 1 (já entregue) repaginou a criação. Esta fase adiciona o sinal de
performance e ensina a IA a usá-lo.

## Decisões do usuário

- Sinal de performance: **3 níveis** — bombou / ok / fraco (não binário).
- Marcação: **manual** pelo usuário.
- Uso pela IA: **aprende o padrão** — prioriza o ângulo/tipo dos vencedores e
  evita o dos fracos, gerando temas NOVOS (não re-sugere o mesmo tema).
- Controle de UI: **popover com 3 opções** no card do Dashboard.

## Escopo

Três superfícies, coesas, num único plano:
1. **Migration** (via Supabase MCP) — coluna `performance` em `carousels`.
2. **`supabase/functions/suggest-topics/index.ts`** — consome vencedores/fracos.
3. **`src/pages/Dashboard.tsx`** — controle de avaliação + handler de save.

## Arquitetura

### 1. Banco — migration aditiva

```sql
ALTER TABLE public.carousels
  ADD COLUMN performance text
  CHECK (performance IN ('alto','medio','baixo'));
```

- Nullable, sem default. Os 95 carrosseis existentes ficam `NULL` (= não
  avaliado). Aditiva — não afeta save/load do editor nem RLS (já há policy por
  `user_id` em `carousels`).
- Semântica: `alto` = bombou, `medio` = ok, `baixo` = fraco, `NULL` = não
  avaliado.

### 2. UI no Dashboard

Em cada card de carrossel (renderizado em DUAS paths: lista e grade), adicionar
um controle de avaliação compacto perto da data/status:

- Um indicador/ícone discreto com cor conforme o estado:
  - `alto` → verde (#10B981), `medio` → amarelo (#F59E0B),
    `baixo` → vermelho (#EF4444), `NULL` → neutro (cinza, sem cor).
- Clicar abre um **popover** com 4 ações: "🟢 Bombou", "🟡 Ok", "🔴 Fraco",
  "Limpar avaliação".
- Ao escolher, faz `update` otimista no estado local e persiste:
  `supabase.from('carousels').update({ performance: valor }).eq('id', c.id)`.
  `valor` é `'alto'|'medio'|'baixo'|null`.
- O popover fecha após a escolha. Erro de rede → toast + reverte o estado local.

Estado local: incluir `performance` no tipo do carrossel e no `select` que
carrega `recentCarousels` (hoje em `Dashboard.tsx`:
`.select('id, tema, status, created_at, exported_at, collection_id, carousel_slides(...)')`
→ adicionar `performance`).

Para evitar duplicar o popover nas duas render paths, extrair um pequeno
componente `PerformanceControl({ value, onChange })` dentro de `Dashboard.tsx`
e usá-lo nas duas.

### 3. IA — `suggest-topics` consome vencedores/fracos

Na função, junto da busca de perfil + temas recentes + notícias, adicionar uma
query dos carrosseis avaliados do usuário:

```ts
supabase
  .from('carousels')
  .select('tema, tom, performance')
  .eq('user_id', user.id)
  .in('performance', ['alto','baixo'])
  .order('created_at', { ascending: false })
  .limit(20)
```

Separar em dois grupos e injetar no `userPrompt`:

- **Vencedores** (`alto`): bloco "TEMAS QUE BOMBARAM (replique o ÂNGULO e o tipo
  psicológico, nunca o tema literal): ...". Lista `tema` (+ tom).
- **Fracos** (`baixo`): bloco "TEMAS QUE NÃO ENGAJARAM (evite esse ângulo/tom):
  ...".

Regras adicionais no prompt:
- "Priorize os ângulos/tipos dos que bombaram ao distribuir os 6 tipos."
- "Não repita nenhum tema já postado (lista de recentes que já existe)."

O retorno da função permanece **idêntico** (`{ temas: [...], _news }`), então a
UI da Fase 1 (busca/filtro/chips) não muda.

### Tom como sinal auxiliar

A coluna `tom` já existe em `carousels`. Incluí-la nos blocos dá à IA um segundo
eixo (ex: "provocador bombou, educativo flopou"). Não requer schema novo.

## Garantia anti-quebra

- Migration aditiva nullable — não toca dados existentes nem o fluxo de save do
  editor (Fase 1 / Studio).
- `suggest-topics`: +1 query e +2 parágrafos no prompt; assinatura de
  entrada/saída inalterada. Se a query de performance falhar ou vier vazia, a
  função opera como hoje (blocos condicionais, como já faz com notícias).
- `Dashboard.tsx`: adiciona `performance` ao select, um componente e um handler;
  nenhuma mudança em delete/coleções/busca existentes.

## Critérios de sucesso

- Marcar um card como Bombou/Ok/Fraco persiste e sobrevive a reload, com cor
  refletindo o estado.
- Gerar pautas após marcar alguns vencedores produz ideias claramente alinhadas
  ao ângulo dos vencedores (verificação qualitativa).
- A geração funciona normalmente para usuário sem nenhum carrossel avaliado
  (blocos condicionais ausentes).
- `npm run build` limpo antes do push.

## Fora de escopo

- Integração automática com Instagram / métricas reais (continua no backlog).
- Página dedicada `/ideias` e modelagem por esqueleto (Fase 3).
- Armazenar o `tipo` psicológico no carrossel (a IA infere dos temas; não é
  necessário agora).
