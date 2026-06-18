# Repaginação da Criação de Temas (Fase 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganizar visualmente o componente `StateInput` (tela de criação do Studio) num fluxo estilo Apple — seletor de origem com 3 abas, busca + filtro nas sugestões, e ajustes recolhidos — sem alterar banco, Edge Functions ou a lógica de geração.

**Architecture:** Mudança 100% de frontend, restrita a `src/pages/Studio.tsx`, componente `StateInput` (≈ linhas 327–935). Adicionam-se 4 estados de UI (`origem`, `buscaTema`, `filtroTipo`, `showAjustes`), hoistam-se 2 mapas (`TIPO_COLORS`/`TIPO_LABELS`) que hoje vivem inline no JSX, e reorganiza-se o JSX do `return`. Nenhum estado de conteúdo, default ou chamada de função (`handleGenerate`, `applyViral`, `handleSuggestTopics`, `suggest-topics`, `analyze-content`) é alterado.

**Tech Stack:** React 18 + TypeScript + Vite + Framer Motion (AnimatePresence já em uso no arquivo). Sem suíte de testes no projeto — verificação por `npm run build` limpo + checagem visual no browser (`npm run dev`).

---

## Convenções de verificação (todo o plano)

- O projeto **não tem testes unitários**. Onde um plano TDD pediria "rode o teste", aqui se usa:
  - `npm run build` → deve compilar sem erros TypeScript/Vite.
  - Checagem visual no `npm run dev` quando indicado.
- Regra do repo (CLAUDE.md): nunca commitar/pushar sem `npm run build` limpo.
- Trabalhar **só em `src/pages/Studio.tsx`**. Não tocar outro arquivo.

## Mapa de arquivos

- Modify: `src/pages/Studio.tsx` — único arquivo. Componente `StateInput`
  (declaração em `:327`, `return` em `:479`, botão Gerar em `:911`).

## Estado-alvo do JSX (ordem final do `return` de StateInput)

```
H1
Input de tema (inalterado)
─ Seletor de origem (NOVO segmented control: Pra você | Modelar | Do zero)
─ Painel da aba ativa:
    origem==='paravoce' → Sugestões (com busca + chips de filtro)  [aba padrão]
    origem==='modelar'  → Painel "Analisar viral" (movido, sem o botão toggle)
    origem==='dozero'   → nada (usuário digita no input acima)
─ Instruções para a IA (inalterado, colapsável próprio)
─ "⚙ Ajustes" (NOVO colapsável, fechado por padrão) contendo:
      Template grid · Tom · Slides · CTA + Kit · seletor de Produto
Botão GERAR (inalterado)
```

---

### Task 1: Adicionar estados de UI e hoistar os mapas de tipo

**Files:**
- Modify: `src/pages/Studio.tsx` — bloco de `useState` do StateInput (`:335-354`); mapas `TIPO_COLORS`/`TIPO_LABELS` hoje inline (`:863-872`).

- [ ] **Step 1: Adicionar os 4 estados de UI**

Logo após a linha `const [produtoId, setProdutoId] = useState<string>('')` (`:354`), adicionar:

```tsx
  // Fase 1 — UI da central de ideias
  const [origem, setOrigem] = useState<'paravoce' | 'modelar' | 'dozero'>('paravoce')
  const [buscaTema, setBuscaTema] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null)
  const [showAjustes, setShowAjustes] = useState(false)
```

- [ ] **Step 2: Hoistar os mapas de tipo para o topo do componente**

Esses mapas hoje são recriados dentro do `.map()` das sugestões (`:863-872`). Movê-los para perto dos outros mapas estáticos do componente, logo após `TOM_TOOLTIPS` (após `:410`):

```tsx
  const TIPO_COLORS: Record<string, string> = {
    curiosity_gap: CYAN, pattern_interrupt: A,
    identity_mirror: '#A855F7', revelation: '#F59E0B',
    social_proof: '#10B981', urgency: '#EF4444',
  }
  const TIPO_LABELS: Record<string, string> = {
    curiosity_gap: 'Curiosidade', pattern_interrupt: 'Quebra padrão',
    identity_mirror: 'Espelho', revelation: 'Revelação',
    social_proof: 'Prova social', urgency: 'Urgência',
  }
```

Depois, dentro do `.map()` das sugestões (`:862-873`), **remover** as duas `const TIPO_COLORS`/`TIPO_LABELS` locais (deixar apenas `const tipoColor = TIPO_COLORS[t.tipo] ?? M`).

- [ ] **Step 3: Ampliar o tipo de `suggestedTopics` para incluir `contexto`**

O estado em `:344` é `Array<{titulo: string; hook: string; tipo: string}>`. A `suggest-topics` também retorna `contexto`, usado na busca. Trocar a assinatura para:

```tsx
  const [suggestedTopics, setSuggestedTopics] = useState<Array<{titulo: string; hook: string; tipo: string; contexto?: string}>>([])
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: compila sem erros. (Os estados ainda não são usados no JSX — TypeScript não reclama de `useState` não lido; se algum lint falhar por variável não usada, prosseguir, será usada nas próximas tasks.)

- [ ] **Step 5: Commit**

```bash
git add src/pages/Studio.tsx
git commit -m "feat(studio): estados de UI e mapas de tipo para central de ideias"
```

---

### Task 2: Inserir o seletor de origem (segmented control)

**Files:**
- Modify: `src/pages/Studio.tsx` — inserir após o input de tema (depois do `</input>` que fecha em `:523`) e antes do bloco "Analisar conteúdo viral" (`:525`).

- [ ] **Step 1: Inserir o segmented control**

Imediatamente após o fechamento do `<input>` do tema (`:523`), inserir:

```tsx
      {/* Seletor de origem — Fase 1 */}
      <div style={{ display: 'flex', gap: 6, padding: 4, background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
        {([
          { key: 'paravoce', label: '✦ Pra você' },
          { key: 'modelar',  label: '🔗 Modelar' },
          { key: 'dozero',   label: '✎ Do zero' },
        ] as const).map(({ key, label }) => {
          const sel = origem === key
          return (
            <button
              key={key}
              onClick={() => { setOrigem(key); if (key === 'dozero') document.getElementById('tema-input')?.focus() }}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 9, cursor: 'pointer',
                border: 'none', fontFamily: ff, fontSize: 13, letterSpacing: 0.5,
                background: sel ? 'rgba(200,255,0,0.10)' : 'transparent',
                color: sel ? A : M,
                boxShadow: sel ? '0 0 12px rgba(200,255,0,0.10)' : 'none',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: compila sem erros.

- [ ] **Step 3: Verificação visual**

Run: `npm run dev` e abrir o Studio (estado `input`).
Expected: o seletor de 3 abas aparece abaixo do input de tema; clicar troca o destaque; "Do zero" foca o input. (As abas ainda não escondem/mostram nada — próxima task.)

- [ ] **Step 4: Commit**

```bash
git add src/pages/Studio.tsx
git commit -m "feat(studio): seletor de origem (segmented control) na criação"
```

---

### Task 3: Painel "Modelar" controlado pela aba (remover o toggle próprio)

**Files:**
- Modify: `src/pages/Studio.tsx` — bloco "Analisar conteúdo viral" (`:525-634`).

- [ ] **Step 1: Remover o botão toggle e condicionar o painel à aba**

No bloco que começa em `{/* Botão "Analisar conteúdo viral" */}` (`:525`):
- **Remover** o `<button onClick={() => setViralOpen(v => !v)} ...>` inteiro (`:527-547`), incluindo o ícone `<Link>` e o caret.
- Trocar a condição do `AnimatePresence` de `{viralOpen && (` para `{origem === 'modelar' && (`.
- No `<div>` interno do painel (`:558-564`), como não há mais o botão-cabeçalho, ajustar o `borderRadius` de `'0 0 10px 10px'` para `10` e `borderTop` de `'none'` para `'1px solid #00B4D8'` (vira um cartão completo).

Resultado: o painel de colar link/texto aparece somente quando `origem === 'modelar'`. `applyViral`, `viralInput`, `viralResult` e a chamada `analyze-content` permanecem idênticos.

- [ ] **Step 2: Remover o estado `viralOpen` agora órfão**

Remover a linha `:340` `const [viralOpen, setViralOpen] = useState(false)`. Confirmar com:

Run: `grep -n "viralOpen" src/pages/Studio.tsx`
Expected: nenhuma ocorrência restante.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: compila sem erros (nenhuma referência a `viralOpen`).

- [ ] **Step 4: Verificação visual**

Run: `npm run dev` → Studio.
Expected: clicar em "🔗 Modelar" revela o campo de colar link; colar um link e clicar "Analisar →" preenche o tema (fluxo `analyze-content` intacto). Nas outras abas o painel some.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Studio.tsx
git commit -m "feat(studio): painel Modelar controlado pela aba de origem"
```

---

### Task 4: Busca + filtro por tipo nas sugestões; condicionar à aba "Pra você"

**Files:**
- Modify: `src/pages/Studio.tsx` — bloco "Sugestões de temas" (`:813-905`).

- [ ] **Step 1: Envolver o bloco de sugestões na condição da aba**

O bloco que começa em `{/* Sugestões de temas */}` (`:813`) com `<div>` deve renderizar somente em "Pra você". Envolver todo o bloco com:

```tsx
      {origem === 'paravoce' && (
        <div>
          {/* ...conteúdo atual de sugestões... */}
        </div>
      )}
```

(O `<div>` externo atual em `:814` passa a ser o filho desse condicional.)

- [ ] **Step 2: Inserir a barra de busca + chips de filtro**

Dentro do ramo `suggestedTopics.length > 0` (`:848`), logo após a abertura do `<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>` (`:849`) e ANTES do cabeçalho "Pautas para o seu nicho" (`:850`), inserir:

```tsx
                <input
                  type="text"
                  value={buscaTema}
                  onChange={e => setBuscaTema(e.target.value)}
                  placeholder="Buscar nas pautas..."
                  style={{
                    width: '100%', boxSizing: 'border-box', height: 38, padding: '0 12px',
                    background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, color: T, fontFamily: ff, fontSize: 13, outline: 'none',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(200,255,0,0.4)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(['curiosity_gap','pattern_interrupt','identity_mirror','revelation','social_proof','urgency'] as const).map(tp => {
                    const sel = filtroTipo === tp
                    const c = TIPO_COLORS[tp]
                    return (
                      <button
                        key={tp}
                        onClick={() => setFiltroTipo(sel ? null : tp)}
                        style={{
                          fontSize: 9, fontFamily: ff, fontWeight: 700, letterSpacing: 0.5,
                          textTransform: 'uppercase', borderRadius: 99, padding: '4px 9px',
                          cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                          color: sel ? '#000' : c,
                          background: sel ? c : `${c}11`,
                          border: `1px solid ${c}${sel ? '' : '33'}`,
                        }}
                      >
                        {TIPO_LABELS[tp]}
                      </button>
                    )
                  })}
                </div>
```

- [ ] **Step 3: Aplicar busca + filtro na lista renderizada**

A lista renderiza `suggestedTopics.slice(0, 10).map(...)` (`:862`). Trocar `suggestedTopics` pela lista filtrada. Inserir, logo antes do `return (` do ramo `suggestedTopics.length > 0` (ou seja, dentro do bloco condicional, antes do JSX que usa a lista), uma constante derivada — colocá-la no corpo da função do componente, perto dos outros derivados, após `canCreate` (`:395`):

```tsx
  const topicosFiltrados = suggestedTopics.filter(t => {
    if (filtroTipo && t.tipo !== filtroTipo) return false
    if (buscaTema.trim()) {
      const q = buscaTema.trim().toLowerCase()
      const alvo = `${t.titulo} ${t.hook ?? ''} ${t.contexto ?? ''}`.toLowerCase()
      if (!alvo.includes(q)) return false
    }
    return true
  })
```

Em seguida, na linha `:862`, trocar `suggestedTopics.slice(0, 10).map((t, i) => {` por `topicosFiltrados.slice(0, 10).map((t, i) => {`.

- [ ] **Step 4: Estado vazio do filtro**

Logo após o `</div>` que fecha a lista de cards (o `<div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>` de `:861`, que fecha em `:897`), inserir:

```tsx
                {topicosFiltrados.length === 0 && (
                  <p style={{ fontSize: 12, color: M, fontFamily: ff, margin: '4px 0', textAlign: 'center' }}>
                    Nenhuma pauta corresponde.{' '}
                    <button
                      onClick={() => { setBuscaTema(''); setFiltroTipo(null) }}
                      style={{ background: 'none', border: 'none', color: A, fontFamily: ff, fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
                    >limpar filtros</button>
                  </p>
                )}
```

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: compila sem erros.

- [ ] **Step 6: Verificação visual**

Run: `npm run dev` → Studio, aba "Pra você".
Expected: gerar pautas; a barra de busca filtra por palavra instantaneamente; clicar num chip de tipo filtra; clicar de novo no mesmo chip limpa; com filtro sem resultado aparece "Nenhuma pauta corresponde / limpar filtros"; clicar numa pauta preenche o tema (inalterado).

- [ ] **Step 7: Commit**

```bash
git add src/pages/Studio.tsx
git commit -m "feat(studio): busca e filtro por tipo nas sugestões de pauta"
```

---

### Task 5: Recolher Template/Tom/Slides/CTA/Kit em "⚙ Ajustes"

**Files:**
- Modify: `src/pages/Studio.tsx` — wrapper "Configuração" (`:687-811`).

- [ ] **Step 1: Envolver o bloco de configuração num colapsável**

O wrapper atual começa em `{/* ─── Configuração ─── */}` (`:687`) com
`<div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>` e fecha
após o seletor de produto. Substituir a abertura desse `<div>` por um cabeçalho
clicável + `AnimatePresence`, mantendo todo o conteúdo interno (Template, Tom,
Slides, CTA+Kit, Produto) **sem alteração**:

```tsx
      {/* ─── Ajustes (recolhível) ───────────────────────────── */}
      <div>
        <button
          onClick={() => setShowAjustes(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            background: 'none',
            border: `1px solid ${showAjustes ? 'rgba(255,255,255,0.15)' : B}`,
            borderRadius: showAjustes ? '8px 8px 0 0' : 8,
            color: showAjustes ? T : M, fontFamily: ff, fontSize: 13,
            padding: '9px 14px', cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s',
          }}
        >
          ⚙ Ajustes (template, tom, slides, CTA)
          <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: 11 }}>{showAjustes ? '▲' : '▼'}</span>
        </button>
        <AnimatePresence>
          {showAjustes && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 18,
                border: '1px solid rgba(255,255,255,0.08)', borderTop: 'none',
                borderRadius: '0 0 8px 8px', padding: '16px 14px',
              }}>
                {/* TEMPLATE / TOM / SLIDES / CTA+KIT / PRODUTO — conteúdo atual movido aqui, sem mudança */}
```

- [ ] **Step 2: Fechar corretamente os novos wrappers**

No fim do conteúdo de configuração (após o fechamento do bloco do seletor de
produto, `:811`), o `</div>` que fechava o wrapper antigo deve agora fechar a
cadeia nova na ordem: `</div>` (conteúdo) → `</motion.div>` → `)}` → `</AnimatePresence>` → `</div>`.

Verificar o balanceamento com build (próximo passo). Em caso de erro de JSX,
conferir que cada tag aberta no Step 1 tem seu fechamento.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: compila sem erros de JSX/TypeScript.

- [ ] **Step 4: Verificação visual**

Run: `npm run dev` → Studio.
Expected: a tela abre com "⚙ Ajustes" fechado e visualmente mais limpa; abrir revela Template/Tom/Slides/CTA/Kit com comportamento idêntico ao atual; mudar template ainda ajusta o número de slides; CTA "Venda de produto" ainda revela o seletor de produto dentro do bloco.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Studio.tsx
git commit -m "feat(studio): agrupar configuracao em Ajustes recolhivel"
```

---

### Task 6: Verificação end-to-end e fechamento

**Files:**
- Nenhum (verificação).

- [ ] **Step 1: Build final**

Run: `npm run build`
Expected: limpo.

- [ ] **Step 2: Smoke test dos 3 caminhos no browser**

Run: `npm run dev` → Studio (estado `input`).
Expected, sem regressão:
- Abre em "Pra você" com Ajustes fechado.
- "Pra você": gerar/usar cache de pautas, buscar, filtrar por tipo, clicar → tema preenchido → GERAR funciona.
- "Modelar": colar link → Analisar → tema preenchido → GERAR funciona.
- "Do zero": digitar tema → GERAR funciona.
- Abrir Ajustes, trocar tom/template/slides/CTA, gerar → config aplicada (mesmo `onGenerate`).

- [ ] **Step 3: Confirmar que nada de banco/edge mudou**

Run: `git diff --name-only main`
Expected: apenas `src/pages/Studio.tsx` e os dois docs em `docs/superpowers/`.

- [ ] **Step 4: Commit final (se houver ajustes pendentes) e parar**

Não fazer push automático. Reportar ao usuário que a Fase 1 está pronta para
review/push.

---

## Self-Review (preenchido pelo autor do plano)

- **Cobertura do spec:** seletor de origem (Task 2) ✓; campo de tema unificado
  (inalterado, Tasks 2-4 convergem nele) ✓; busca + filtro por tipo (Task 4) ✓;
  Ajustes recolhidos (Task 5) ✓; aba padrão "Pra você" (Task 1, default do
  estado) ✓; garantia anti-quebra (Task 6 Step 3) ✓.
- **Placeholders:** nenhum "TODO"/"TBD"; código real em cada step.
- **Consistência de tipos:** `origem` usa o mesmo literal union em Task 1, 2, 3,
  4; `suggestedTopics` ampliado com `contexto?` (Task 1) é consumido em
  `topicosFiltrados` (Task 4); `TIPO_COLORS`/`TIPO_LABELS` hoistados (Task 1) e
  usados em Task 4.
- **Fora de escopo confirmado:** sem migration, sem Edge Function, sem mudança em
  `handleGenerate`/`applyViral`/`handleSuggestTopics`.
