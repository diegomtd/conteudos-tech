/**
 * Gera todas as imagens da landing automaticamente via Playwright.
 *
 * Pré-requisito: adicionar ao .env.local:
 *   VITE_DEV_EMAIL=diegoalves.mtd@gmail.com
 *   VITE_DEV_PASSWORD=<sua_senha>
 *
 * Executar:
 *   node --env-file=.env.local scripts/generate-landing-images.mjs
 */

import { chromium } from 'playwright'
import { mkdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'

// ---------------------------------------------------------------------------
// Carregar .env.local manualmente (compatível com qualquer Node.js)
// ---------------------------------------------------------------------------
let envVars = {}
try {
  const raw = await readFile('.env.local', 'utf-8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([^#=\s][^=]*?)\s*=\s*(.*)\s*$/)
    if (m) envVars[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  // sem .env.local — depende de variáveis já no ambiente
}

const BASE_URL    = 'https://conteudos-tech.vercel.app'
const OUT         = 'public/images'
const EMAIL       = process.env.VITE_DEV_EMAIL    ?? envVars.VITE_DEV_EMAIL    ?? 'diegoalves.mtd@gmail.com'
const PASSWORD    = process.env.VITE_DEV_PASSWORD ?? envVars.VITE_DEV_PASSWORD
const SUPABASE_URL = process.env.VITE_SUPABASE_URL  ?? envVars.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? envVars.VITE_SUPABASE_ANON_KEY

if (!PASSWORD) {
  console.error('❌ VITE_DEV_PASSWORD não encontrado. Adicione ao .env.local.')
  process.exit(1)
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontrados.')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Criar diretórios de saída
// ---------------------------------------------------------------------------
await mkdir(`${OUT}/recursos`, { recursive: true })
await mkdir(`${OUT}/slides-virais`, { recursive: true })
for (let i = 1; i <= 3; i++) {
  await mkdir(`${OUT}/carrosseis/CARROSSEL-${i}`, { recursive: true })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sbHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

async function sbGet(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1${path}`, { headers: sbHeaders })
  if (!r.ok) throw new Error(`Supabase ${path} → ${r.status}: ${await r.text()}`)
  return r.json()
}

async function sbCount(table) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id`, {
    headers: { ...sbHeaders, Prefer: 'count=exact', 'Range-Unit': 'items', Range: '0-0' },
  })
  const range = r.headers.get('content-range') || ''
  return range.split('/')[1] ?? '?'
}

async function login(page) {
  await page.goto(`${BASE_URL}/auth`)
  await page.waitForSelector('input[type="email"]', { timeout: 20000 })
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 25000 })
  console.log('   ✓ Login OK')
}

// ---------------------------------------------------------------------------
// PARTE 1 — Screenshots do app (dashboard, studio, grade/imagem-ia)
// ---------------------------------------------------------------------------
console.log('\n📸 PARTE 1: Screenshots do app')

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width: 1400, height: 900 })

await login(page)
await page.waitForTimeout(2500)

// 1a. Dashboard
await page.screenshot({ path: `${OUT}/recursos/dashboard.jpg`, type: 'jpeg', quality: 90 })
console.log('   ✅ recursos/dashboard.jpg')

// 1b. Studio — pegar o primeiro link de carousel no dashboard
const carouselLinks = await page.$$eval(
  'a[href*="studio"]',
  els => els.slice(0, 1).map(e => e.href),
)

if (carouselLinks.length === 0) {
  console.warn('   ⚠️  Nenhum link de studio encontrado no dashboard. Pulando screenshots do studio.')
} else {
  await page.goto(carouselLinks[0])
  await page.waitForTimeout(4000)
  await page.screenshot({ path: `${OUT}/app-screenshot.jpg`, type: 'jpeg', quality: 90 })
  console.log('   ✅ app-screenshot.jpg')

  // 1c. Modo grade (imagem-ia)
  const gradeBtn = page.locator('text=Grade').or(page.locator('[data-view="grade"]')).first()
  const gradeVisible = await gradeBtn.isVisible({ timeout: 3000 }).catch(() => false)

  if (gradeVisible) {
    await gradeBtn.click()
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${OUT}/recursos/imagem-ia.jpg`, type: 'jpeg', quality: 90 })
    console.log('   ✅ recursos/imagem-ia.jpg (modo grade)')
  } else {
    // Fallback: cópia do app-screenshot
    await page.screenshot({ path: `${OUT}/recursos/imagem-ia.jpg`, type: 'jpeg', quality: 90 })
    console.log('   ✅ recursos/imagem-ia.jpg (fallback = studio)')
  }
}

// ---------------------------------------------------------------------------
// PARTE 2 — Slides dos 3 últimos carrosseis via export container oculto
// ---------------------------------------------------------------------------
console.log('\n🖼  PARTE 2: Slides dos carrosseis')

const carousels = await sbGet('/carousels?select=id,tema&order=created_at.desc&limit=3')

for (let ci = 0; ci < Math.min(carousels.length, 3); ci++) {
  const c = carousels[ci]
  console.log(`   Carrossel ${ci + 1}: ${c.tema ?? c.id}`)

  await page.goto(`${BASE_URL}/studio?carousel_id=${c.id}`)
  await page.waitForTimeout(5000)

  // O export container fica fora da tela com left: -9999px
  const wrapper = page.locator('div[style*="-9999"]').first()
  const wrapperVisible = await wrapper.count().then(n => n > 0)

  if (!wrapperVisible) {
    console.warn(`   ⚠️  Export container não encontrado para carrossel ${ci + 1}`)
    continue
  }

  const slideEls = wrapper.locator('> div')
  const count = await slideEls.count()
  console.log(`   ${count} slide(s) encontrado(s)`)

  for (let si = 0; si < Math.min(count, 8); si++) {
    const el = slideEls.nth(si)
    const pad = String(si + 1).padStart(2, '0')
    const outPath = `${OUT}/carrosseis/CARROSSEL-${ci + 1}/${pad}-slide.jpg`
    try {
      await el.screenshot({ path: outPath, type: 'jpeg', quality: 90 })
    } catch (e) {
      // Alguns slides podem estar sem conteúdo ainda
      console.warn(`   ⚠️  Slide ${si + 1} falhou: ${e.message}`)
    }
  }
  console.log(`   ✅ CARROSSEL-${ci + 1} gerado`)
}

await browser.close()

// ---------------------------------------------------------------------------
// PARTE 3 — Slides virais renderizados via HTML (sem login)
// ---------------------------------------------------------------------------
console.log('\n🎨 PARTE 3: Slides virais (HTML render)')

const slides = await sbGet(
  '/carousel_slides?select=titulo,corpo,accent_color&order=created_at.desc&limit=8',
)

const browser2 = await chromium.launch()
const p2 = await browser2.newPage()
await p2.setViewportSize({ width: 540, height: 675 })

const accentPalette = ['#C8FF00', '#00D4FF', '#6366F1', '#FF6B35', '#C8FF00', '#00D4FF', '#6366F1', '#FF6B35']

for (let i = 0; i < Math.min(slides.length, 8); i++) {
  const s    = slides[i]
  const accent = s.accent_color || accentPalette[i % accentPalette.length]
  const titulo = String(s.titulo ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const corpo  = String(s.corpo  ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  await p2.setContent(`<!DOCTYPE html>
<html>
<head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,400;0,500&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}</style>
</head>
<body>
<div style="
  width:540px;height:675px;
  background:#0B0B0B;
  font-family:'Bebas Neue',sans-serif;
  padding:44px 48px;
  display:flex;flex-direction:column;justify-content:flex-end;
  position:relative;overflow:hidden;
">
  <div style="
    position:absolute;inset:0;
    background:linear-gradient(135deg,rgba(255,255,255,0.015) 0%,transparent 60%);
    pointer-events:none;
  "></div>
  <div style="
    position:absolute;top:0;right:0;
    width:180px;height:180px;
    background:radial-gradient(circle,${accent}18 0%,transparent 70%);
    pointer-events:none;
  "></div>
  <div style="
    font-size:56px;color:#fff;line-height:1;
    letter-spacing:1px;
    text-transform:uppercase;
    position:relative;z-index:1;
  ">${titulo}</div>
  <div style="
    height:3px;background:${accent};
    width:44%;margin:16px 0 0;
    border-radius:2px;
    position:relative;z-index:1;
  "></div>
  <div style="
    font-size:16px;color:rgba(255,255,255,0.52);
    margin-top:14px;line-height:1.65;
    font-family:'DM Sans',sans-serif;font-weight:400;
    position:relative;z-index:1;
  ">${corpo}</div>
</div>
</body>
</html>`)

  // Aguardar fontes carregarem
  await p2.waitForTimeout(1800)
  await p2.screenshot({
    path: `${OUT}/slides-virais/viral-${i + 1}.jpg`,
    type: 'jpeg',
    quality: 92,
  })
  console.log(`   ✅ slides-virais/viral-${i + 1}.jpg`)
}

await browser2.close()

// ---------------------------------------------------------------------------
// PARTE 4 — Stats reais do banco
// ---------------------------------------------------------------------------
console.log('\n📊 PARTE 4: Stats do banco')

const totalCarousels = await sbCount('carousels')
const totalProfiles  = await sbCount('profiles').catch(() => '?')

console.log(`   Total carrosseis: ${totalCarousels}`)
console.log(`   Total profiles  : ${totalProfiles}`)
console.log('\n💡 Atualize as stats no Landing.tsx (linhas 402-404) com esses valores.')
console.log('\n✅ Todas as imagens geradas com sucesso!')
