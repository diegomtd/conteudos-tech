# Design — Central de Ideias / Repaginação da criação de temas

Data: 2026-06-18
Status: Aprovado para Fase 1

## Problema

A tela de criação (`StateInput` em `src/pages/Studio.tsx`) acumulou recursos de
descoberta de tema empilhados verticalmente, todos visíveis ao mesmo tempo:
input de tema, painel "Analisar conteúdo viral" (colapsável), "Instruções para a
IA" (colapsável), grid de templates, chips de tom, chips de slides, seletor de
CTA, toggle de kit visual e a lista de sugestões. O resultado é poluição visual
e ausência de um caminho claro.

Pedido do usuário:
1. Melhorar **filtro e pesquisa** de temas (hoje inexistentes).
2. Organizar a linha de conteúdo e **saber os melhores pra replicar**.
3. **Modelar outros conteúdos com precisão**.
4. UI/UX mais simples e intuitiva, estilo Apple — entregar muito de forma
   simplificada.

## Realidade do sistema (confirmada no código/banco)

- Não existe filtro nem busca de temas hoje. Existe: gerador de lista de pautas
  (`suggest-topics`) + analisador de link (`analyze-content`).
- A `suggest-topics` já retorna, por pauta, os campos `titulo`, `hook`,
  `contexto` e `tipo` (6 categorias psicológicas). O `tipo` hoje é só
  decorativo — não é usado para filtrar.
- **Não há métrica de desempenho** no banco (`carousels`, `carousel_slides`,
  `scheduled_posts` não têm curtidas/salvamentos/alcance). Publicação automática
  no Instagram está no backlog. Logo, "o que funcionou pra mim" não pode ser
  medido sem alguém alimentar o dado.

## Decisões do usuário

- Fontes desejadas: histórico próprio que funcionou + modelar viral de fora +
  tendências em tempo real. (Não a "biblioteca genérica da IA".)
- Desempenho próprio: **marcação manual** ("★ bombou" no Dashboard).
- Localização: **híbrido** — página dedicada para explorar a fundo + atalho
  enxuto na criação.
- Modelagem de viral: **os dois** — mostra análise E oferece "gerar seguindo
  essa estrutura".
- Sequenciamento: **incremental (caminho B)**, sem quebrar o fluxo atual.
- Fase 1 — Ajustes começam **recolhidos**; aba padrão **"Pra você"**.

## Sequenciamento (caminho B — incremental)

Cada fase entrega valor sozinha e não quebra o que veio antes.

- **Fase 1 — Repaginar a criação (UX puro, sem banco):** este documento detalha.
- **Fase 2 — Meus Vencedores:** coluna de performance + botão "★ bombou" no
  Dashboard + `suggest-topics` cruzando ângulo/tipo dos vencedores.
- **Fase 3 — Página dedicada `/ideias` + modelagem com estrutura:** página
  própria no menu (explorar/filtrar/buscar) + `analyze-content` v2 que extrai
  esqueleto do viral e oferece "gerar seguindo essa estrutura".

---

## Fase 1 — Especificação detalhada

Escopo: **somente `src/pages/Studio.tsx`, componente `StateInput`.** Nenhuma
migration, nenhuma Edge Function alterada, nenhuma mudança em `handleGenerate`
ou no fluxo de geração.

### 1. Seletor de origem (segmented control)

Abaixo do H1, um seletor segmentado com 3 opções mutuamente exclusivas que
substitui os botões colapsáveis soltos de hoje. Apenas um painel visível por vez.

- **✦ Pra você** — abre as sugestões da IA (atual fluxo "Não sei o que criar").
  É a aba padrão ao abrir a tela. Carrega do cache do localStorage quando houver
  (sem custo de IA).
- **🔗 Modelar** — abre o campo de colar link/texto (atual "Analisar viral",
  `viralInput`/`applyViral`/`analyze-content`). Comportamento inalterado.
- **✎ Do zero** — foca no input de tema vazio.

Estado novo de UI: `origem: 'paravoce' | 'modelar' | 'dozero'` (default
`'paravoce'`). Substitui os estados `viralOpen` e o gatilho implícito das
sugestões — o painel exibido passa a depender de `origem`.

### 2. Campo de tema unificado

O input grande de tema (`tema`/`setTema`) continua sendo o destino de todos os
caminhos:
- escolher uma sugestão → `setTema(t.titulo)`;
- "Modelar" → `applyViral` já faz `setTema(data.sugestao)`;
- "Do zero" → digitação direta.

Nenhuma mudança de lógica; apenas posicionamento visual deixando claro que tudo
converge para um tema antes de gerar.

### 3. Busca + filtro nas sugestões ("filtro e pesquisa")

Dentro da aba "Pra você", acima da lista de pautas:
- **Campo de busca** (`buscaTema`, client-side): filtra `suggestedTopics` por
  substring case-insensitive em `titulo`/`hook`/`contexto`. Instantâneo, sem IA.
- **Chips de filtro por tipo** (`filtroTipo: string | null`): as 6 categorias já
  retornadas pela `suggest-topics` (`curiosity_gap`, `pattern_interrupt`,
  `identity_mirror`, `revelation`, `social_proof`, `urgency`). Reutiliza os mapas
  `TIPO_COLORS`/`TIPO_LABELS` que já existem no JSX. Clicar num chip filtra;
  clicar de novo limpa.

A lista renderizada passa a ser `suggestedTopics` filtrada por `buscaTema` e
`filtroTipo`. Estado vazio: "Nenhuma pauta corresponde — limpar filtros".

### 4. Ajustes recolhidos

Template + Tom + Slides + CTA + Kit visual passam para um bloco colapsável
**"⚙ Ajustes"**, fechado por padrão (`showAjustes: boolean`, default `false`).
Defaults atuais preservados (template Impacto, tom Provocador, slides=IA, etc.).
Todo o JSX desses controles é movido para dentro do colapsável sem alteração de
comportamento. O seletor de produto (CTA = "Venda de produto") permanece dentro
desse bloco, com a mesma condição.

### 5. Garantia anti-quebra

Permanecem idênticos: `handleGenerate`, `handleSuggestTopics`, `applyViral`,
todos os estados de conteúdo (`tema`, `tom`, `cta`, `slides`, `selectedTpl`,
`iaInstructions`, `viralInput`, `produtoId`, `useKit`), os defaults, a
`suggest-topics` e a `analyze-content`. Adições são apenas estados de UI novos
(`origem`, `buscaTema`, `filtroTipo`, `showAjustes`) e reorganização de JSX.

### Critérios de sucesso (Fase 1)

- A tela abre mostrando o seletor de origem em "Pra você", com Ajustes
  recolhidos e o canvas visualmente mais limpo que hoje.
- É possível buscar por palavra e filtrar as pautas por tipo, instantaneamente.
- Os 3 caminhos (sugestão, modelar, do zero) preenchem o mesmo campo de tema e
  geram pelo fluxo atual sem regressão.
- `npm run build` limpo antes do push.

### Fora de escopo da Fase 1

- Qualquer mudança de banco ou Edge Function.
- "Meus Vencedores" / marcação de performance (Fase 2).
- Página dedicada `/ideias` e extração de esqueleto (Fase 3).
