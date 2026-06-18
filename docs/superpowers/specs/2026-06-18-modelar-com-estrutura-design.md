# Design — Fase 3: Modelar com estrutura

Data: 2026-06-18
Status: Aprovado para implementação (foco: só "modelar com estrutura")

## Decisão de escopo

A Fase 1 já entregou uma boa experiência de descoberta de ideias dentro do
Studio (abas Pra você / Modelar / Do zero + busca/filtro). Por isso a página
dedicada `/ideias` foi **descartada** (duplicaria a Fase 1). A Fase 3 foca só na
parte genuinamente nova e de maior valor: **modelar um conteúdo viral com
precisão** — extrair o esqueleto e gerar seguindo aquela fórmula.

## Objetivo

Na aba Modelar, após analisar um viral (link ou texto), a IA também devolve o
ESQUELETO do conteúdo (papel de cada slide). O usuário vê a estrutura e pode
gerar um carrossel novo seguindo exatamente aquela fórmula, no seu nicho/tom.

## Arquitetura (baixo risco)

### 1. `analyze-content` v2 — aditivo

A função (hoje v1, `verify_jwt: false`, decodifica o JWT manualmente) passa a
pedir ao Claude um campo extra no JSON: `estrutura`.

Saída nova:
```json
{
  "tema": "...",
  "hacks": ["..."],
  "sugestao": "...",
  "resumo": "...",
  "estrutura": [
    { "papel": "Hook", "resumo": "abre com uma afirmação que quebra expectativa" },
    { "papel": "Contexto", "resumo": "..." },
    { "papel": "Virada", "resumo": "..." },
    { "papel": "CTA", "resumo": "..." }
  ]
}
```
- 5 a 8 itens. `papel` = função do slide (Hook, Contexto, Desenvolvimento,
  Virada, Prova, CTA…). `resumo` = o que aquele slide faz (máx ~15 palavras).
- **Aditivo:** o fluxo atual de Fase 1 (`applyViral` lê `sugestao`/`hacks`/
  `resumo`) continua idêntico se `estrutura` vier ausente. `verify_jwt`
  permanece `false` (não regredir).

### 2. Studio `StateInput` — UI + wiring

- Estender o tipo de `viralResult` com
  `estrutura?: Array<{ papel: string; resumo: string }>`.
- No card de resultado do painel Modelar (após hacks / "tema aplicado"),
  renderizar a lista numerada do esqueleto quando `estrutura` existir.
- Adicionar botão **"✨ Gerar seguindo essa estrutura"** que chama o `onGenerate`
  existente com:
  - `tema`: o `tema` atual (já setado para `sugestao`);
  - `slides`: `Math.min(estrutura.length, maxSlidesAllowed)` — respeita o limite
    do plano;
  - `instructions`: string formatada do esqueleto, anexada ao `iaInstructions`
    se houver. Formato:
    `"Siga EXATAMENTE esta estrutura de N slides (um slide por item):\n1. [Hook] ...\n2. [Contexto] ...\n..."`.
  - Demais campos (`tom`, `cta`, `template_id`, kit/produto) seguem o padrão já
    usado nas duas chamadas existentes de `onGenerate`.

### 3. `generate-carousel` — INTOCADO

O esqueleto trafega pelo campo `instructions`, que a função já aceita e usa para
guiar a geração. Nenhuma mudança no fluxo crítico de geração.

## Garantia anti-quebra

- `analyze-content`: só adiciona um campo no prompt e no JSON; mesma assinatura
  de entrada; `verify_jwt` inalterado; se o parse de `estrutura` falhar, os
  outros campos seguem funcionando.
- `Studio.tsx`: estende um tipo, adiciona um bloco de render condicional e um
  botão. O fluxo "Analisar → tema aplicado" da Fase 1 permanece.
- `generate-carousel`: não tocado.

## Critérios de sucesso

- Analisar um viral retorna, além do atual, uma lista de 5–8 slides com papel +
  resumo.
- "Gerar seguindo essa estrutura" produz um carrossel cujo número de slides e
  sequência refletem o esqueleto, no nicho/tom do usuário.
- Analisar conteúdo sem estrutura clara (texto curto) ainda funciona — o botão
  só aparece quando `estrutura` tem itens.
- `npm run build` limpo antes do push.

## Fora de escopo

- Página dedicada `/ideias` (descartada por redundância com a Fase 1).
- Qualquer mudança em `generate-carousel` ou no banco.
