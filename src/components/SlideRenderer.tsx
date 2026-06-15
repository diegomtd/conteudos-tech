import React from 'react'

// ─── Types ────────────────────────────────────────────────────

export type CarouselTemplate =
  | 'impacto'
  | 'editorial'
  | 'lista'
  | 'citacao'
  | 'storytelling'
  | 'dados'
  | 'gancho'

export interface SlideData {
  titulo: string
  corpo: string
  bgImageUrl?: string
  textColor?: string
  textAlign?: 'left' | 'center' | 'right'
  titleFontSize?: number
  bodyFontSize?: number
  fontWeightTitle?: 'normal' | 'bold'
  titlePos?: { x: number; y: number }
  overlayOpacity?: number
  textPosition?: 'top' | 'center' | 'bottom'
  fontFamily?: string
  blockSpacing?: number
  imageOpacity?: number
  beforeText?: string
  afterText?: string
  afterImageUrl?: string
  paddingX?: number
  bgZoom?: number
  bgPositionX?: number
  bgPositionY?: number
  bgFilter?: string
  bgVisible?: boolean
  bgSolidColor?: string
  borderVignette?: boolean
  vignetteIntensity?: number
  titleItalic?: boolean
  titleUppercase?: boolean
  titleLetterSpacing?: number
  titleLineHeight?: number
  titleBgEnabled?: boolean
  titleBgColor?: string
  titleShadow?: boolean
  titleShadowIntensity?: number
  bodyFontFamily?: string
  bodyFontWeight?: 'normal' | 'bold'
  bodyColor?: string
  bodyItalic?: boolean
  bodyLineHeight?: number
  bodyLetterSpacing?: number
  bodyBgEnabled?: boolean
  bodyBgColor?: string
  ctaText?: string
  profileBadgeEnabled?: boolean
  profileHandle?: string
  profileAvatarUrl?: string
  profileBadgePosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  profileBadgeSize?: number
  profileBadgeBg?: string
  profileBadgeTextColor?: string
  highlightedWords?: string[]
  accentColor?: string
  bgPattern?: string
  bgPatternOpacity?: number
  subtitle?: string
  subtitleFontSize?: number
}

export interface SlideRenderProps {
  slide: SlideData
  index: number
  total: number
  template: CarouselTemplate
  imageStyle: string
  scale?: number
  selectedEl?: 'titulo' | 'corpo' | null
  onSelectEl?: (el: 'titulo' | 'corpo') => void
  onTitleMouseDown?: (e: React.MouseEvent) => void
  hasWatermark?: boolean
  onBodyWordClick?: (word: string) => void
  onTitleWordClick?: (word: string) => void
}

// ─── Z-index layer system ─────────────────────────────────────
// 0 = background image
// 1 = overlay / darkening layer
// 2 = text content, interactive elements
// 3 = watermark (always on top)

const Z_IMG      = 0
const Z_OVERLAY  = 1
const Z_CONTENT  = 2
const Z_WATERMARK = 3

// ─── Constants ────────────────────────────────────────────────

const _T = '#F5F5F5'
const A  = '#C8FF00'
const ff = 'DM Sans, sans-serif'
const bn = '"Bebas Neue", sans-serif'

const IA_BG: Record<string, string> = {
  cinematic:      'linear-gradient(160deg,#060d14 0%,#0d1f30 60%,#091829 100%)',
  dark_cinematic: 'linear-gradient(160deg,#060d14 0%,#0d1f30 60%,#091829 100%)',
  illustration:   'linear-gradient(160deg,#080c1a 0%,#0f1e4a 60%,#081530 100%)',
  abstract:       'linear-gradient(160deg,#0a0814 0%,#1a0f2e 60%,#0d0820 100%)',
  minimal:        'linear-gradient(160deg,#080808 0%,#141414 100%)',
  gradient:       'linear-gradient(160deg,#030a14 0%,#071525 100%)',
}

// ─── Helpers ──────────────────────────────────────────────────

function overlayGrad(pct: number, dir = 'to bottom'): string {
  const o  = pct / 100
  const lo = Math.max(0, o - 0.2)
  return `linear-gradient(${dir}, rgba(0,0,0,${o}) 0%, rgba(0,0,0,${lo}) 100%)`
}

function selBorder(active: boolean): React.CSSProperties {
  return active
    ? { outline: '1px dashed rgba(200,255,0,0.5)', outlineOffset: 3, borderRadius: 2 }
    : {}
}

function titleFont(slide: SlideData): string {
  return slide.fontFamily ?? bn
}

function blockGap(slide: SlideData, s: number): string {
  return `${(slide.blockSpacing ?? 16) * s}px`
}

function titleX(slide: SlideData, s: number): React.CSSProperties {
  return {
    fontStyle: slide.titleItalic ? 'italic' : 'normal',
    textTransform: (slide.titleUppercase || (slide.fontFamily ?? '').includes('Bebas')) ? 'uppercase' : 'none',
    letterSpacing: `${(slide.titleLetterSpacing ?? 0) * s}px`,
    lineHeight: slide.titleLineHeight ?? 1.1,
    backgroundColor: slide.titleBgEnabled ? (slide.titleBgColor ?? 'rgba(200,255,0,0.2)') : 'transparent',
    padding: slide.titleBgEnabled ? `${2 * s}px ${8 * s}px` : '0',
    borderRadius: slide.titleBgEnabled ? `${4 * s}px` : '0',
    textShadow: slide.titleShadow ? `0 ${2 * s}px ${(slide.titleShadowIntensity ?? 8) * s}px rgba(0,0,0,0.9)` : 'none',
  }
}

function bodyX(slide: SlideData, s: number): React.CSSProperties {
  return {
    color: slide.bodyColor ?? slide.textColor ?? 'rgba(255,255,255,0.7)',
    fontFamily: slide.bodyFontFamily ?? slide.fontFamily ?? ff,
    fontWeight: slide.bodyFontWeight === 'bold' ? 700 : 400,
    fontStyle: slide.bodyItalic ? 'italic' : 'normal',
    lineHeight: slide.bodyLineHeight ?? 1.6,
    letterSpacing: `${(slide.bodyLetterSpacing ?? 0) * s}px`,
    backgroundColor: slide.bodyBgEnabled ? (slide.bodyBgColor ?? 'rgba(255,255,255,0.1)') : 'transparent',
    padding: slide.bodyBgEnabled ? `${2 * s}px ${6 * s}px` : '0',
    whiteSpace: 'pre-wrap' as React.CSSProperties['whiteSpace'],
  }
}


// ─── Text block positioning ───────────────────────────────────
export function getTextBlockPosition(slide: SlideData, _s: number): React.CSSProperties {
  const vPos   = slide.textPosition ?? 'bottom'
  const hAlign = slide.textAlign    ?? 'left'
  const justifyMap: Record<string, string> = { top: 'flex-start', center: 'center', bottom: 'flex-end' }
  const alignMap:   Record<string, string> = { left: 'flex-start', center: 'center', right: 'flex-end' }
  return {
    display: 'flex', flexDirection: 'column',
    justifyContent: justifyMap[vPos]   ?? 'flex-end',
    alignItems:     alignMap[hAlign]   ?? 'flex-start',
  }
}

// ─── Container style ──────────────────────────────────────────
// backgroundImage intentionally omitted — rendered as z-indexed child in SlideRenderer

export function getSlideContainerStyle(
  slide: SlideData,
  _index: number,
  _total: number,
  template: CarouselTemplate,
  imageStyle: string,
  scale: number,
): React.CSSProperties {
  const hasImg    = !!(slide.bgImageUrl && slide.bgImageUrl.trim() !== '')
  const pos       = slide.textPosition ?? 'bottom'
  const justify   = pos === 'top' ? 'flex-start' : pos === 'center' ? 'center' : 'flex-end'
  const hAlign    = slide.textAlign ?? 'left'
  const aItems    = hAlign === 'center' ? 'center' : hAlign === 'right' ? 'flex-end' : 'flex-start'
  const pad       = 20 * scale
  const base: React.CSSProperties = {
    position: 'relative', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
  }
  const px = slide.paddingX !== undefined ? slide.paddingX * scale : pad

  if (slide.bgSolidColor && !hasImg) return {
    ...base,
    background: slide.bgSolidColor,
    justifyContent: justify,
    alignItems: aItems,
    paddingTop: 20 * scale, paddingBottom: 20 * scale,
    paddingLeft: (slide.paddingX !== undefined ? slide.paddingX * scale : 20 * scale),
    paddingRight: (slide.paddingX !== undefined ? slide.paddingX * scale : 20 * scale),
  }

  if (template === 'editorial' || template === 'lista') {
    return {
      ...base,
      background: '#0a0a0a',
      justifyContent: justify,
      alignItems: aItems,
      paddingTop: pad, paddingBottom: pad, paddingLeft: px, paddingRight: px,
    }
  }

  if (false) {
    const bg = hasImg ? {} : { background: IA_BG[imageStyle] ?? 'linear-gradient(160deg, #060d14, #0d1f30)' }
    return {
      ...base, ...bg,
      justifyContent: justify,
      alignItems: aItems,
      paddingTop: pad, paddingBottom: pad, paddingLeft: px, paddingRight: px,
    }
  }

  const bg = hasImg ? {} : { background: IA_BG[imageStyle] ?? IA_BG.cinematic }
  return {
    ...base,
    ...bg,
    justifyContent: justify,
    alignItems: aItems,
    paddingTop: pad, paddingBottom: pad,
    paddingLeft: px, paddingRight: px,
  }
}

// ─── Background patterns ──────────────────────────────────────

const BG_PATTERNS: Record<string, string> = {
  grid: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M40 0v40M0 0h40' stroke='white' stroke-width='0.5' opacity='1'/%3E%3C/svg%3E")`,
  dots: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='2' cy='2' r='1.2' fill='white'/%3E%3C/svg%3E")`,
  lines: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Cpath d='M0 10h20' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
  diagonal: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Cpath d='M0 20L20 0' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
  diagonal_cross: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Cpath d='M0 20L20 0M0 0l20 20' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
}

function BgPattern({ slide, s }: { slide: SlideData; s: number }): React.ReactElement | null {
  const pattern = slide.bgPattern
  if (!pattern || pattern === 'none' || !BG_PATTERNS[pattern]) return null
  const opacity = (slide.bgPatternOpacity ?? 20) / 100
  const size = pattern === 'grid' ? `${40 * s}px ${40 * s}px` : `${20 * s}px ${20 * s}px`
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: Z_CONTENT, pointerEvents: 'none',
      backgroundImage: BG_PATTERNS[pattern],
      backgroundSize: size,
      opacity,
    }} />
  )
}

// ─── Word highlight renderer ──────────────────────────────────

function renderBodyWithHighlights(
  text: string,
  slide: SlideData,
  pProps: React.HTMLAttributes<HTMLParagraphElement>,
  onWordClick?: (word: string) => void
): React.ReactElement {
  const highlighted = slide.highlightedWords ?? []
  const accentClr   = slide.accentColor ?? '#C8FF00'
  const words       = text.split(' ')
  // Prefixo "BODY:" isola o destaque do corpo do destaque do título.
  // Antes os dois liam o mesmo highlightedWords por correspondência de string,
  // então marcar "MAIS" no título também acendia qualquer "mais" no corpo
  // (e vice-versa) — agora cada lado guarda sua própria entrada no array.
  const bodyKey = (w: string) => `BODY:${w.replace(/[.,!?;:"""'«»\-]/g, '').toUpperCase()}`

  if (!onWordClick) {
    return (
      <p {...pProps}>
        {words.map((word, i) => {
          return (
            <span key={i} style={highlighted.includes(bodyKey(word)) ? { color: accentClr, fontWeight: 'bold' } : undefined}>
              {word}{i < words.length - 1 ? ' ' : ''}
            </span>
          )
        })}
      </p>
    )
  }

  const { style: baseStyle, onClick: pOnClick, ...restProps } = pProps
  return (
    <p {...restProps} style={{ ...baseStyle, userSelect: 'none' }}>
      {words.map((word, i) => {
        const isHighlighted = highlighted.includes(bodyKey(word))
        return (
          <span
            key={i}
            onClick={(e) => {
              e.stopPropagation()
              ;(pOnClick as unknown as (() => void) | undefined)?.()
              onWordClick(bodyKey(word))
            }}
            style={{
              color: isHighlighted ? accentClr : 'inherit',
              fontWeight: isHighlighted ? 'bold' : 'inherit',
              borderRadius: 2,
              padding: '0 1px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {word}{i < words.length - 1 ? ' ' : ''}
          </span>
        )
      })}
    </p>
  )
}

// ─── Title word highlight renderer ───────────────────────────

function renderTitleWithHighlights(
  text: string,
  slide: SlideData,
  pProps: React.HTMLAttributes<HTMLParagraphElement>,
  onTitleWordClick?: (word: string) => void
): React.ReactElement {
  const highlighted = slide.highlightedWords ?? []
  const accentClr   = slide.accentColor ?? '#C8FF00'
  const words       = text.split(' ')

  if (!onTitleWordClick) {
    return (
      <p {...pProps}>
        {words.map((word, i) => {
          return (
            <span key={i} style={highlighted.includes(word.replace(/[.,!?;:"""'«»\-]/g, '').toUpperCase()) ? { color: accentClr, fontWeight: 'bold' } : undefined}>
              {word}{i < words.length - 1 ? ' ' : ''}
            </span>
          )
        })}
      </p>
    )
  }

  const { style: baseStyle, onClick: pOnClick, ...restProps } = pProps
  return (
    <p {...restProps} style={{ ...baseStyle, userSelect: 'none' }}>
      {words.map((word, i) => {
        const isHighlighted = highlighted.includes(word.replace(/[.,!?;:"""'«»\-]/g, '').toUpperCase())
        return (
          <span
            key={i}
            onClick={(e) => {
              e.stopPropagation()
              ;(pOnClick as unknown as (() => void) | undefined)?.()
              onTitleWordClick(word.replace(/[.,!?;:"""'«»\-]/g, '').toUpperCase())
            }}
            style={{
              color: isHighlighted ? accentClr : 'inherit',
              fontWeight: isHighlighted ? 'bold' : 'inherit',
              borderRadius: 2,
              padding: '0 1px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {word}{i < words.length - 1 ? ' ' : ''}
          </span>
        )
      })}
    </p>
  )
}

// ─── Subtitle renderer ────────────────────────────────────────
function renderSubtitle(slide: SlideData, s: number): React.ReactElement | null {
  if (!slide.subtitle) return null
  return (
    <p style={{
      fontFamily: slide.bodyFontFamily ?? slide.fontFamily ?? 'DM Sans, sans-serif',
      fontSize: `${(slide.subtitleFontSize ?? 22) * s}px`,
      color: slide.bodyColor ?? slide.textColor ?? 'rgba(255,255,255,0.75)',
      fontWeight: 500,
      lineHeight: 1.4,
      margin: `${6 * s}px 0 0`,
      textAlign: slide.textAlign ?? 'left',
      letterSpacing: 0,
    }}>
      {slide.subtitle}
    </p>
  )
}

// ─── Template: IMPACTO ────────────────────────────────────────

function Impacto({ slide, index, total, selectedEl, onSelectEl, onTitleMouseDown, onBodyWordClick, onTitleWordClick, scale: s = 1 }: SlideRenderProps & { scale: number }) {
  const isLast = index === total - 1
  const isCapa = index === 0
  const color  = slide.textColor ?? _T
  const fw     = slide.fontWeightTitle === 'bold' ? 900 : 700
  const align  = (slide.textAlign ?? (isCapa ? 'center' : 'left')) as React.CSSProperties['textAlign']

  return <>
    {/* Overlay — z-index: 1, sits above background image */}
    <div style={{
      position: 'absolute', inset: 0, zIndex: Z_OVERLAY,
      background: isCapa
        ? overlayGrad(slide.overlayOpacity ?? 70)
        : isLast
          ? `rgba(0,0,0,${(slide.overlayOpacity ?? 65) / 100})`
          : overlayGrad(slide.overlayOpacity ?? 55, 'to top'),
      boxShadow: slide.borderVignette ? `inset 0 0 ${(slide.vignetteIntensity ?? 60) * 1.5}px rgba(0,0,0,0.8)` : 'none',
    }} />

    {/* Slide number — mid slides */}
    {!isCapa && !isLast && (
      <span style={{
        position: 'absolute', top: `${8 * s}px`, right: `${10 * s}px`,
        fontFamily: bn, fontSize: `${13 * s}px`, color: _T,
        opacity: 0.3, zIndex: Z_CONTENT, userSelect: 'none',
      }}>{index + 1}</span>
    )}

    {isCapa ? (
      <>
        {renderTitleWithHighlights(slide.titulo, slide, {
          onClick: () => onSelectEl?.('titulo'),
          onMouseDown: onTitleMouseDown,
          style: {
            fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 80) * s}px`, fontWeight: fw,
            color, textAlign: align, margin: 0, zIndex: Z_CONTENT,
            transform: slide.titlePos ? `translate(${slide.titlePos.x * s}px,${slide.titlePos.y * s}px)` : undefined,
            cursor: onSelectEl ? (selectedEl === 'titulo' ? 'grab' : 'pointer') : 'default',
            ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
          },
        }, onTitleWordClick)}
        {renderSubtitle(slide, s)}
        {slide.corpo ? renderBodyWithHighlights(slide.corpo, slide, {
          onClick: () => onSelectEl?.('corpo'),
          style: { fontSize: `${(slide.bodyFontSize ?? 28) * s}px`, textAlign: align, margin: `${blockGap(slide, s)} 0 0`, zIndex: Z_CONTENT, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
        }, onBodyWordClick) : null}
        <p style={{
          position: 'absolute', bottom: `${12 * s}px`, right: `${14 * s}px`,
          fontSize: `${9 * s}px`, color: 'rgba(255,255,255,0.45)', fontFamily: ff,
          margin: 0, zIndex: Z_CONTENT,
        }}>Arrasta para o lado →</p>
      </>
    ) : isLast ? (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${6 * s}px`, zIndex: Z_CONTENT, width: '100%' }}>
        {renderTitleWithHighlights(slide.titulo, slide, {
          onClick: () => onSelectEl?.('titulo'),
          style: {
            fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 80) * s}px`, fontWeight: fw,
            color, textAlign: 'center', margin: 0,
            cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
          },
        }, onTitleWordClick)}
        {renderSubtitle(slide, s)}
        {renderBodyWithHighlights(slide.corpo, slide, {
          onClick: () => onSelectEl?.('corpo'),
          style: { fontSize: `${(slide.bodyFontSize ?? 28) * s}px`, textAlign: 'center', margin: 0, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
        }, onBodyWordClick)}
        <p style={{ fontSize: `${10 * s}px`, color: slide.textColor ?? A, fontFamily: ff, fontWeight: 600, margin: 0 }}>
          {slide.ctaText ?? 'Salve para não perder'}
        </p>
      </div>
    ) : (
      <>
        {renderTitleWithHighlights(slide.titulo, slide, {
          onClick: () => onSelectEl?.('titulo'),
          style: {
            fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 80) * s}px`, fontWeight: fw,
            color, textAlign: align, margin: `0 0 ${blockGap(slide, s)}`, zIndex: Z_CONTENT,
            cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
          },
        }, onTitleWordClick)}
        {renderSubtitle(slide, s)}
        {renderBodyWithHighlights(slide.corpo, slide, {
          onClick: () => onSelectEl?.('corpo'),
          style: { fontSize: `${(slide.bodyFontSize ?? 28) * s}px`, textAlign: align, margin: 0, zIndex: Z_CONTENT, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
        }, onBodyWordClick)}
      </>
    )}
  </>
}

// ─── Template: STORYTELLING ───────────────────────────────────

function Storytelling({ slide, index, total, selectedEl, onSelectEl, onTitleMouseDown, onBodyWordClick, onTitleWordClick, scale: s = 1 }: SlideRenderProps & { scale: number }) {
  const isLast = index === total - 1
  const isCapa = index === 0
  const color  = slide.textColor ?? _T
  const fw     = slide.fontWeightTitle === 'bold' ? 900 : 700

  return <>
    <div style={{
      position: 'absolute', inset: 0, zIndex: Z_OVERLAY,
      background: `rgba(0,0,0,${(slide.overlayOpacity ?? 62) / 100})`,
      boxShadow: slide.borderVignette ? `inset 0 0 ${(slide.vignetteIntensity ?? 60) * 1.5}px rgba(0,0,0,0.8)` : 'none',
    }} />

    {isCapa ? <>
      {renderTitleWithHighlights(slide.titulo, slide, {
        onClick: () => onSelectEl?.('titulo'),
        onMouseDown: onTitleMouseDown,
        style: {
          fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 80) * s}px`,
          fontWeight: fw, color, margin: 0, zIndex: Z_CONTENT,
          transform: slide.titlePos ? `translate(${slide.titlePos.x * s}px,${slide.titlePos.y * s}px)` : undefined,
          cursor: onSelectEl ? (selectedEl === 'titulo' ? 'grab' : 'pointer') : 'default',
          ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
        },
      }, onTitleWordClick)}
      {renderSubtitle(slide, s)}
      {renderBodyWithHighlights(slide.corpo, slide, {
        onClick: () => onSelectEl?.('corpo'),
        style: { fontSize: `${(slide.bodyFontSize ?? 28) * s}px`, margin: `${blockGap(slide, s)} 0 0`, zIndex: Z_CONTENT, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
      }, onBodyWordClick)}
    </> : isLast ? (
      <div style={{ display: 'flex', flexDirection: 'column', zIndex: Z_CONTENT, gap: `${8 * s}px` }}>
        {renderTitleWithHighlights(slide.titulo, slide, {
          onClick: () => onSelectEl?.('titulo'),
          style: {
            fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 80) * s}px`, fontWeight: fw,
            color, margin: 0,
            cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
          },
        }, onTitleWordClick)}
        {renderSubtitle(slide, s)}
        {renderBodyWithHighlights(slide.corpo, slide, {
          onClick: () => onSelectEl?.('corpo'),
          style: { fontSize: `${(slide.bodyFontSize ?? 28) * s}px`, margin: 0, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
        }, onBodyWordClick)}
        <p style={{ fontSize: `${10 * s}px`, color: slide.textColor ?? A, fontFamily: ff, fontWeight: 600, margin: 0 }}>
          {slide.ctaText ?? 'Se isso te tocou, compartilha'}
        </p>
      </div>
    ) : <>
      {renderBodyWithHighlights(slide.corpo, slide, {
        onClick: () => onSelectEl?.('corpo'),
        style: { fontSize: `${(slide.bodyFontSize ?? 28) * s}px`, margin: `0 0 ${blockGap(slide, s)}`, zIndex: Z_CONTENT, textAlign: slide.textAlign ?? 'left', width: '100%', cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
      }, onBodyWordClick)}
      {renderTitleWithHighlights(slide.titulo, slide, {
        onClick: () => onSelectEl?.('titulo'),
        style: {
          fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 80) * s}px`, fontWeight: fw,
          color, margin: 0, zIndex: Z_CONTENT,
          textAlign: slide.textAlign ?? 'left', width: '100%',
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
        },
      }, onTitleWordClick)}
      {renderSubtitle(slide, s)}
      <p style={{
        position: 'absolute', bottom: `${10 * s}px`, left: 0, right: 0,
        textAlign: 'center', fontSize: `${14 * s}px`, color: 'rgba(255,255,255,0.25)',
        margin: 0, letterSpacing: `${4 * s}px`, zIndex: Z_CONTENT,
      }}>...</p>
      <p style={{
        position: 'absolute', top: `${8 * s}px`, right: `${12 * s}px`,
        fontSize: `${8 * s}px`, color: 'rgba(255,255,255,0.2)', fontFamily: ff, margin: 0, zIndex: Z_CONTENT,
      }}>{index + 1}</p>
    </>}
  </>
}

// ─── Template: DADO CHOCANTE ──────────────────────────────────
function Dados({ slide, index, total, selectedEl, onSelectEl, onBodyWordClick, onTitleWordClick, scale: s = 1 }: SlideRenderProps & { scale: number }) {
  const isLast = index === total - 1
  const isCapa = index === 0
  const color  = slide.textColor ?? _T
  const fw     = slide.fontWeightTitle === 'bold' ? 900 : 700
  const accent = slide.accentColor ?? A

  if (isCapa) return <>
    <div style={{
      position: 'absolute', inset: 0, zIndex: Z_OVERLAY,
      background: overlayGrad(slide.overlayOpacity ?? 70),
      boxShadow: slide.borderVignette ? `inset 0 0 ${(slide.vignetteIntensity ?? 60) * 1.5}px rgba(0,0,0,0.8)` : 'none',
    }} />
    {/* Badge DADOS */}
    <span style={{
      fontFamily: bn, fontSize: `${9 * s}px`, color: accent,
      letterSpacing: `${2 * s}px`, textTransform: 'uppercase' as const,
      border: `1px solid ${accent}`, padding: `${2 * s}px ${8 * s}px`,
      borderRadius: `${2 * s}px`, marginBottom: `${14 * s}px`,
      zIndex: Z_CONTENT, display: 'inline-block', alignSelf: 'center',
    }}>DADOS</span>
    {renderTitleWithHighlights(slide.titulo, slide, {
      onClick: () => onSelectEl?.('titulo'),
      style: {
        fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 80) * s}px`, fontWeight: fw,
        color, textAlign: 'center', margin: 0, zIndex: Z_CONTENT,
        cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
      },
    }, onTitleWordClick)}
    {renderSubtitle(slide, s)}
    {slide.corpo ? renderBodyWithHighlights(slide.corpo, slide, {
      onClick: () => onSelectEl?.('corpo'),
      style: { fontSize: `${(slide.bodyFontSize ?? 28) * s}px`, textAlign: 'center', margin: `${blockGap(slide, s)} 0 0`, zIndex: Z_CONTENT, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
    }, onBodyWordClick) : null}
  </>

  if (isLast) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${6 * s}px`, zIndex: Z_CONTENT, width: '100%' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: Z_OVERLAY, background: `rgba(0,0,0,${(slide.overlayOpacity ?? 65) / 100})` }} />
      {renderTitleWithHighlights(slide.titulo, slide, {
        onClick: () => onSelectEl?.('titulo'),
        style: {
          fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 80) * s}px`, fontWeight: fw,
          color, textAlign: 'center', margin: 0, zIndex: Z_CONTENT,
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
        },
      }, onTitleWordClick)}
      {renderBodyWithHighlights(slide.corpo, slide, {
        onClick: () => onSelectEl?.('corpo'),
        style: { fontSize: `${(slide.bodyFontSize ?? 28) * s}px`, textAlign: 'center', margin: 0, zIndex: Z_CONTENT, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
      }, onBodyWordClick)}
      <p style={{ fontSize: `${10 * s}px`, color: accent, fontFamily: ff, fontWeight: 600, margin: 0, zIndex: Z_CONTENT }}>
        {slide.ctaText ?? 'Salve para não esquecer'}
      </p>
    </div>
  )

  // slides do meio — split: stat gigante em cima, corpo abaixo
  return <>
    <div style={{ position: 'absolute', inset: 0, zIndex: Z_OVERLAY, background: `rgba(8,8,8,0.85)` }} />
    {/* metade superior: título/stat */}
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: '50%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: `${16 * s}px ${16 * s}px 0`, zIndex: Z_CONTENT,
    }}>
      {renderTitleWithHighlights(slide.titulo, slide, {
        onClick: () => onSelectEl?.('titulo'),
        style: {
          fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 100) * s}px`, fontWeight: 900,
          color: accent, textAlign: 'center', margin: 0, lineHeight: 0.9,
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
        },
      }, onTitleWordClick)}
    </div>
    {/* linha divisória */}
    <div style={{
      position: 'absolute', top: '50%', left: `${16 * s}px`, right: `${16 * s}px`,
      height: '1px', backgroundColor: `${accent}66`, zIndex: Z_CONTENT,
    }} />
    {/* metade inferior: corpo */}
    <div style={{
      position: 'absolute', top: '50%', left: 0, right: 0, bottom: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: `${8 * s}px ${16 * s}px ${16 * s}px`, zIndex: Z_CONTENT,
    }}>
      {renderBodyWithHighlights(slide.corpo, slide, {
        onClick: () => onSelectEl?.('corpo'),
        style: { fontSize: `${(slide.bodyFontSize ?? 24) * s}px`, textAlign: 'center', margin: 0, color, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
      }, onBodyWordClick)}
    </div>
    {/* número do slide */}
    <span style={{
      position: 'absolute', top: `${8 * s}px`, right: `${10 * s}px`,
      fontFamily: bn, fontSize: `${13 * s}px`, color: accent,
      opacity: 0.5, zIndex: Z_CONTENT, userSelect: 'none',
    }}>{index + 1}</span>
  </>
}

// ─── Template: EDITORIAL ──────────────────────────────────────

function Editorial({ slide, index, total, selectedEl, onSelectEl, onBodyWordClick, onTitleWordClick, scale: s = 1 }: SlideRenderProps & { scale: number }) {
  const isLast = index === total - 1
  const isCapa = index === 0
  const color  = slide.textColor ?? _T
  const fw     = slide.fontWeightTitle === 'bold' ? 900 : 700
  const accent = slide.accentColor ?? A
  const handle = slide.profileHandle ? slide.profileHandle.replace('@', '') : null

  if (isCapa) return <>
    {/* overlay leve na capa */}
    <div style={{
      position: 'absolute', inset: 0, zIndex: Z_OVERLAY,
      background: overlayGrad(slide.overlayOpacity ?? 30),
      boxShadow: slide.borderVignette ? `inset 0 0 ${(slide.vignetteIntensity ?? 60) * 1.5}px rgba(0,0,0,0.8)` : 'none',
    }} />
    {/* linha accent + handle */}
    <div style={{ width: '100%', zIndex: Z_CONTENT }}>
      <div style={{ height: `${2 * s}px`, backgroundColor: accent, width: '100%', marginBottom: `${10 * s}px` }} />
      {handle && (
        <p style={{
          fontFamily: ff, fontSize: `${10 * s}px`, color: 'rgba(255,255,255,0.5)',
          textAlign: 'center', margin: `0 0 ${14 * s}px`, letterSpacing: `${1 * s}px`,
          zIndex: Z_CONTENT,
        }}>@{handle}</p>
      )}
    </div>
    {renderTitleWithHighlights(slide.titulo, slide, {
      onClick: () => onSelectEl?.('titulo'),
      style: {
        fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 80) * s}px`, fontWeight: fw,
        color, margin: 0, zIndex: Z_CONTENT,
        cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
      },
    }, onTitleWordClick)}
    {renderSubtitle(slide, s)}
    {renderBodyWithHighlights(slide.corpo, slide, {
      onClick: () => onSelectEl?.('corpo'),
      style: { fontSize: `${(slide.bodyFontSize ?? 28) * s}px`, margin: `${blockGap(slide, s)} 0 0`, zIndex: Z_CONTENT, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
    }, onBodyWordClick)}
    {/* CTA deslize no bottom */}
    <p style={{
      position: 'absolute', bottom: `${14 * s}px`, left: 0, right: 0,
      textAlign: 'center', fontSize: `${8 * s}px`, color: 'rgba(255,255,255,0.4)',
      fontFamily: ff, letterSpacing: `${2 * s}px`, textTransform: 'uppercase' as const,
      margin: 0, zIndex: Z_CONTENT,
    }}>DESLIZE PARA CONHECER</p>
  </>

  if (isLast) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: `${8 * s}px`, zIndex: Z_CONTENT }}>
      {renderTitleWithHighlights(slide.titulo || 'E aí, faz sentido?', slide, {
        onClick: () => onSelectEl?.('titulo'),
        style: {
          fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 80) * s}px`, fontWeight: fw,
          color, textAlign: 'center', margin: 0,
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
        },
      }, onTitleWordClick)}
      {renderSubtitle(slide, s)}
      {renderBodyWithHighlights(slide.corpo, slide, {
        onClick: () => onSelectEl?.('corpo'),
        style: { fontSize: `${(slide.bodyFontSize ?? 28) * s}px`, textAlign: 'center', margin: 0, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
      }, onBodyWordClick)}
      <div style={{ width: `${36 * s}px`, height: `${2 * s}px`, backgroundColor: accent, marginTop: `${4 * s}px` }} />
    </div>
  )

  // slides do meio — sem imagem, fundo sólido, título grande left, linha divisória, corpo abaixo
  return <>
    {/* título grande left-aligned */}
    {renderTitleWithHighlights(slide.titulo, slide, {
      onClick: () => onSelectEl?.('titulo'),
      style: {
        fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 90) * s}px`, fontWeight: fw,
        color, margin: `0 0 ${10 * s}px`, zIndex: Z_CONTENT,
        textAlign: 'left', width: '100%', lineHeight: 0.95,
        cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
      },
    }, onTitleWordClick)}
    {/* linha divisória accent */}
    <div style={{
      width: '100%', height: `${2 * s}px`, backgroundColor: accent,
      marginBottom: `${10 * s}px`, zIndex: Z_CONTENT,
    }} />
    {renderSubtitle(slide, s)}
    {renderBodyWithHighlights(slide.corpo, slide, {
      onClick: () => onSelectEl?.('corpo'),
      style: {
        fontSize: `${(slide.bodyFontSize ?? 26) * s}px`, margin: 0, zIndex: Z_CONTENT,
        textAlign: 'left', width: '100%', fontFamily: ff,
        cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s),
      },
    }, onBodyWordClick)}
    {/* número do slide canto inferior direito */}
    <span style={{
      position: 'absolute', bottom: `${10 * s}px`, right: `${12 * s}px`,
      fontFamily: bn, fontSize: `${28 * s}px`, color: accent,
      opacity: 0.4, zIndex: Z_CONTENT, userSelect: 'none', lineHeight: 1,
    }}>{String(index).padStart(2, '0')}</span>
  </>
}

// ─── Template: LISTA VIRAL ────────────────────────────────────

function Lista({ slide, index, total, selectedEl, onSelectEl, onBodyWordClick, onTitleWordClick, scale: s = 1 }: SlideRenderProps & { scale: number }) {
  const isLast   = index === total - 1
  const isCapa   = index === 0
  const color    = slide.textColor ?? _T
  const fw       = slide.fontWeightTitle === 'bold' ? 900 : 700
  const midCount = total - 2

  const ProgressDots = () => (
    <div style={{
      position: 'absolute', bottom: `${10 * s}px`, left: 0, right: 0,
      display: 'flex', justifyContent: 'center', gap: `${4 * s}px`, zIndex: Z_CONTENT,
    }}>
      {Array.from({ length: midCount }, (_, i) => (
        <span key={i} style={{
          width: `${5 * s}px`, height: `${5 * s}px`, borderRadius: '50%', display: 'inline-block',
          backgroundColor: i === index - 1 ? A : 'rgba(255,255,255,0.2)',
        }} />
      ))}
    </div>
  )

  if (isCapa) return <>
    <span style={{
      position: 'absolute', right: `${8 * s}px`, top: '50%', transform: 'translateY(-50%)',
      fontFamily: bn, fontSize: `${160 * s}px`, color: A, opacity: 0.1, userSelect: 'none', lineHeight: 1,
      zIndex: Z_CONTENT,
    }}>{midCount}</span>
    {renderTitleWithHighlights(slide.titulo, slide, {
      onClick: () => onSelectEl?.('titulo'),
      style: {
        fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 80) * s}px`, fontWeight: fw,
        color, margin: 0, zIndex: Z_CONTENT,
        cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
      },
    }, onTitleWordClick)}
    {renderSubtitle(slide, s)}
    {renderBodyWithHighlights(slide.corpo, slide, {
      onClick: () => onSelectEl?.('corpo'),
      style: { fontSize: `${(slide.bodyFontSize ?? 28) * s}px`, margin: `${blockGap(slide, s)} 0 0`, zIndex: Z_CONTENT, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
    }, onBodyWordClick)}
  </>

  if (isLast) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: `${8 * s}px`, zIndex: Z_CONTENT }}>
      {renderTitleWithHighlights(slide.titulo, slide, {
        onClick: () => onSelectEl?.('titulo'),
        style: {
          fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 80) * s}px`, fontWeight: fw,
          color, textAlign: 'center', margin: 0,
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
        },
      }, onTitleWordClick)}
      {renderSubtitle(slide, s)}
      {renderBodyWithHighlights(slide.corpo, slide, {
        onClick: () => onSelectEl?.('corpo'),
        style: { fontSize: `${(slide.bodyFontSize ?? 28) * s}px`, textAlign: 'center', margin: 0, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
      }, onBodyWordClick)}
    </div>
  )

  return <>
    <span style={{
      fontFamily: bn, fontSize: `${48 * s}px`, color: A, fontWeight: 900,
      lineHeight: 1, margin: `0 0 ${4 * s}px`, zIndex: Z_CONTENT,
    }}>
      {String(index).padStart(2, '0')}
    </span>
    {renderTitleWithHighlights(slide.titulo, slide, {
      onClick: () => onSelectEl?.('titulo'),
      style: {
        fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 80) * s}px`, fontWeight: fw,
        color, margin: `0 0 ${blockGap(slide, s)}`, zIndex: Z_CONTENT,
        textAlign: slide.textAlign ?? 'left',
        width: '100%',
        cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
      },
    }, onTitleWordClick)}
    {renderSubtitle(slide, s)}
    {renderBodyWithHighlights(slide.corpo, slide, {
      onClick: () => onSelectEl?.('corpo'),
      style: { fontSize: `${(slide.bodyFontSize ?? 28) * s}px`, margin: 0, zIndex: Z_CONTENT, textAlign: slide.textAlign ?? 'left', width: '100%', cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
    }, onBodyWordClick)}
    <ProgressDots />
  </>
}

// ─── Template: CITAÇÃO ────────────────────────────────────────

function Citacao({ slide, index, total, selectedEl, onSelectEl, onTitleMouseDown, onBodyWordClick, onTitleWordClick, scale: s = 1 }: SlideRenderProps & { scale: number }) {
  const isLast = index === total - 1
  const isCapa = index === 0
  const color  = slide.textColor ?? _T
  const fw     = slide.fontWeightTitle === 'bold' ? 900 : 700

  return <>
    {/* Overlay — z-index: 1, above image */}
    <div style={{
      position: 'absolute', inset: 0, zIndex: Z_OVERLAY,
      background: `rgba(0,0,0,${(slide.overlayOpacity ?? (isCapa ? 65 : 50)) / 100})`,
      boxShadow: slide.borderVignette ? `inset 0 0 ${(slide.vignetteIntensity ?? 60) * 1.5}px rgba(0,0,0,0.8)` : 'none',
    }} />

    {isCapa ? <>
      <span style={{
        position: 'absolute', top: `${14 * s}px`, left: `${12 * s}px`,
        fontFamily: bn, fontSize: `${70 * s}px`, color: A, opacity: 0.3, lineHeight: 1,
        zIndex: Z_CONTENT, userSelect: 'none',
      }}>"</span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: Z_CONTENT, width: '100%' }}>
        {renderTitleWithHighlights(slide.titulo, slide, {
          onClick: () => onSelectEl?.('titulo'),
          onMouseDown: onTitleMouseDown,
          style: {
            fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 80) * s}px`,
            fontWeight: fw, color, textAlign: 'center', margin: 0,
            transform: slide.titlePos ? `translate(${slide.titlePos.x * s}px,${slide.titlePos.y * s}px)` : undefined,
            cursor: onSelectEl ? (selectedEl === 'titulo' ? 'grab' : 'pointer') : 'default',
            ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
          },
        }, onTitleWordClick)}
        {renderSubtitle(slide, s)}
        {renderBodyWithHighlights(slide.corpo, slide, {
          onClick: () => onSelectEl?.('corpo'),
          style: { fontSize: `${(slide.bodyFontSize ?? 28) * s}px`, margin: `${blockGap(slide, s)} 0 0`, textAlign: 'center', cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
        }, onBodyWordClick)}
      </div>
    </> : isLast ? (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: `${8 * s}px`, zIndex: Z_CONTENT }}>
        {renderTitleWithHighlights(slide.titulo, slide, {
          onClick: () => onSelectEl?.('titulo'),
          style: {
            fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 80) * s}px`, fontWeight: fw,
            color, textAlign: 'center', margin: 0,
            cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
          },
        }, onTitleWordClick)}
        {renderSubtitle(slide, s)}
        {renderBodyWithHighlights(slide.corpo, slide, {
          onClick: () => onSelectEl?.('corpo'),
          style: { fontSize: `${(slide.bodyFontSize ?? 28) * s}px`, textAlign: 'center', margin: 0, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
        }, onBodyWordClick)}
        <p style={{ fontSize: `${10 * s}px`, color: slide.textColor ?? A, fontFamily: ff, fontWeight: 600, margin: 0 }}>
          {slide.ctaText ?? 'Salve esse carrossel'}
        </p>
      </div>
    ) : (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: Z_CONTENT }}>
        <div style={{ width: `${28 * s}px`, height: `${2 * s}px`, backgroundColor: A, marginBottom: `${10 * s}px` }} />
        {renderTitleWithHighlights(slide.titulo, slide, {
          onClick: () => onSelectEl?.('titulo'),
          style: {
            fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 80) * s}px`,
            fontWeight: fw, color, textAlign: 'center', margin: 0,
            cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
          },
        }, onTitleWordClick)}
        {renderSubtitle(slide, s)}
        {renderBodyWithHighlights(slide.corpo, slide, {
          onClick: () => onSelectEl?.('corpo'),
          style: { fontSize: `${(slide.bodyFontSize ?? 28) * s}px`, margin: `${blockGap(slide, s)} 0 0`, textAlign: 'center', cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
        }, onBodyWordClick)}
      </div>
    )}
  </>
}

// ─── Template: GANCHO ─────────────────────────────────────────

function Gancho({ slide, index, total, selectedEl, onSelectEl, onTitleMouseDown, onBodyWordClick, onTitleWordClick, scale: s = 1 }: SlideRenderProps & { scale: number }) {
  const isLast = index === total - 1
  const isCapa = index === 0
  const color  = slide.textColor ?? _T
  const fw     = slide.fontWeightTitle === 'bold' ? 900 : 700
  const accent = slide.accentColor ?? A

  if (isCapa) return <>
    <div style={{
      position: 'absolute', inset: 0, zIndex: Z_OVERLAY,
      background: overlayGrad(slide.overlayOpacity ?? 60),
      boxShadow: slide.borderVignette ? `inset 0 0 ${(slide.vignetteIntensity ?? 60) * 1.5}px rgba(0,0,0,0.8)` : 'none',
    }} />
    {/* Badge categoria */}
    <span style={{
      fontFamily: bn, fontSize: `${9 * s}px`, color: accent,
      letterSpacing: `${1.5 * s}px`, textTransform: 'uppercase' as const,
      border: `1px solid ${accent}`,
      background: `${accent}26`,
      padding: `${3 * s}px ${10 * s}px`,
      borderRadius: `${3 * s}px`,
      marginBottom: `${14 * s}px`,
      zIndex: Z_CONTENT, display: 'inline-block', alignSelf: 'flex-start',
    }}>{(slide as any).subtitulo || 'DESTAQUE'}</span>
    {renderTitleWithHighlights(slide.titulo, slide, {
      onClick: () => onSelectEl?.('titulo'),
      onMouseDown: onTitleMouseDown,
      style: {
        fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 80) * s}px`, fontWeight: fw,
        color, textAlign: 'left', margin: `0 0 auto`, zIndex: Z_CONTENT, flex: 1,
        transform: slide.titlePos ? `translate(${slide.titlePos.x * s}px,${slide.titlePos.y * s}px)` : undefined,
        cursor: onSelectEl ? (selectedEl === 'titulo' ? 'grab' : 'pointer') : 'default',
        ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
      },
    }, onTitleWordClick)}
    {renderBodyWithHighlights(slide.corpo, slide, {
      onClick: () => onSelectEl?.('corpo'),
      style: { fontSize: `${(slide.bodyFontSize ?? 26) * s}px`, textAlign: 'left', margin: `${8 * s}px 0`, zIndex: Z_CONTENT, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
    }, onBodyWordClick)}
    {/* CTA pill bottom */}
    <span style={{
      fontFamily: bn, fontSize: `${10 * s}px`, color: '#000',
      backgroundColor: accent, padding: `${5 * s}px ${14 * s}px`,
      borderRadius: `${3 * s}px`, letterSpacing: `${1 * s}px`,
      textTransform: 'uppercase' as const, zIndex: Z_CONTENT, alignSelf: 'flex-start',
    }}>{slide.ctaText ?? 'SEGUE O FIO ›'}</span>
  </>

  if (isLast) return <>
    <div style={{
      position: 'absolute', inset: 0, zIndex: Z_OVERLAY,
      background: `rgba(0,0,0,${(slide.overlayOpacity ?? 65) / 100})`,
    }} />
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${6 * s}px`, zIndex: Z_CONTENT, width: '100%' }}>
      {renderTitleWithHighlights(slide.titulo, slide, {
        onClick: () => onSelectEl?.('titulo'),
        style: {
          fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 80) * s}px`, fontWeight: fw,
          color, textAlign: 'center', margin: 0,
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
        },
      }, onTitleWordClick)}
      {renderBodyWithHighlights(slide.corpo, slide, {
        onClick: () => onSelectEl?.('corpo'),
        style: { fontSize: `${(slide.bodyFontSize ?? 26) * s}px`, textAlign: 'center', margin: 0, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
      }, onBodyWordClick)}
      {/* CTA pill */}
      <span style={{
        fontFamily: bn, fontSize: `${10 * s}px`, color: '#000',
        backgroundColor: accent, padding: `${6 * s}px ${18 * s}px`,
        borderRadius: `${3 * s}px`, letterSpacing: `${1 * s}px`,
        textTransform: 'uppercase' as const, zIndex: Z_CONTENT, marginTop: `${4 * s}px`,
      }}>{slide.ctaText ?? 'SALVA E COMPARTILHA'}</span>
    </div>
  </>

  // slides do meio: left accent bar + conteúdo com padding, número no canto superior direito
  return <>
    <div style={{
      position: 'absolute', inset: 0, zIndex: Z_OVERLAY,
      background: `rgba(0,0,0,${(slide.overlayOpacity ?? 55) / 100})`,
      boxShadow: slide.borderVignette ? `inset 0 0 ${(slide.vignetteIntensity ?? 60) * 1.5}px rgba(0,0,0,0.8)` : 'none',
    }} />
    {/* Left accent bar */}
    <div style={{
      position: 'absolute', left: 0, top: 0, bottom: 0,
      width: `${4 * s}px`, backgroundColor: `${accent}B3`,
      zIndex: Z_CONTENT,
    }} />
    {/* Número do slide */}
    <span style={{
      position: 'absolute', top: `${8 * s}px`, right: `${10 * s}px`,
      fontFamily: bn, fontSize: `${18 * s}px`, color: accent,
      opacity: 0.8, zIndex: Z_CONTENT, userSelect: 'none',
    }}>{String(index).padStart(2, '0')}</span>
    {/* Conteúdo com padding-left para a barra */}
    <div style={{ paddingLeft: `${16 * s}px`, width: '100%', zIndex: Z_CONTENT }}>
      {renderTitleWithHighlights(slide.titulo, slide, {
        onClick: () => onSelectEl?.('titulo'),
        style: {
          fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 80) * s}px`, fontWeight: fw,
          color, margin: `0 0 ${blockGap(slide, s)}`, textAlign: slide.textAlign ?? 'left', width: '100%',
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
        },
      }, onTitleWordClick)}
      {renderSubtitle(slide, s)}
      {renderBodyWithHighlights(slide.corpo, slide, {
        onClick: () => onSelectEl?.('corpo'),
        style: {
          fontSize: `${(slide.bodyFontSize ?? 26) * s}px`, margin: 0,
          textAlign: slide.textAlign ?? 'left', width: '100%', fontFamily: ff,
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s),
        },
      }, onBodyWordClick)}
    </div>
  </>
}

// ─── Main export ──────────────────────────────────────────────

const NO_BG_WALLPAPER: CarouselTemplate[] = ['editorial']

export function SlideRenderer(props: SlideRenderProps): React.ReactElement {
  const s = props.scale ?? 1
  const { slide } = props

  const inner = (() => {
    switch (props.template) {
      case 'editorial':     return <Editorial     {...props} scale={s} />
      case 'lista':         return <Lista         {...props} scale={s} />
      case 'citacao':       return <Citacao       {...props} scale={s} />
      case 'storytelling':  return <Storytelling  {...props} scale={s} />
      case 'dados':         return <Dados         {...props} scale={s} />
      case 'gancho':        return <Gancho        {...props} scale={s} />
      default:              return <Impacto       {...props} scale={s} />
    }
  })()

  // Profile badge
  const badge = slide.profileBadgeEnabled && slide.profileHandle ? (() => {
    const pos = slide.profileBadgePosition ?? 'bottom-left'
    const badgeSize = slide.profileBadgeSize ?? 28
    const posStyle: React.CSSProperties = {
      position: 'absolute', zIndex: Z_CONTENT,
      ...(pos.includes('top') ? { top: `${10 * s}px` } : { bottom: `${10 * s}px` }),
      ...(pos.includes('left') ? { left: `${10 * s}px` } : { right: `${10 * s}px` }),
    }
    const handle = (slide.profileHandle ?? '').replace('@', '')
    const initials = handle.slice(0, 1).toUpperCase()
    return (
      <div style={{
        ...posStyle,
        display: 'flex', alignItems: 'center', gap: `${6 * s}px`,
        padding: `${4 * s}px ${8 * s}px`,
        backgroundColor: slide.profileBadgeBg ?? 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
        borderRadius: `${(slide.profileBadgeSize ?? 28) * s}px`, border: '1px solid rgba(255,255,255,0.15)',
      }}>
        {slide.profileAvatarUrl ? (
          <img src={slide.profileAvatarUrl} alt="" style={{
            width: `${badgeSize * s}px`, height: `${badgeSize * s}px`,
            borderRadius: '50%', objectFit: 'cover' as React.CSSProperties['objectFit'],
          }} />
        ) : (
          <div style={{
            width: `${badgeSize * s}px`, height: `${badgeSize * s}px`, borderRadius: '50%', backgroundColor: A,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: `${(badgeSize * 0.4) * s}px`, fontFamily: bn, color: '#000', fontWeight: 700,
          }}>{initials}</div>
        )}
        <span style={{ fontFamily: ff, fontSize: `${(slide.profileBadgeSize ?? 14) * 0.6 * s}px`, color: slide.profileBadgeTextColor ?? '#ffffff', fontWeight: 600, letterSpacing: `${0.3 * s}px` }}>
          @{handle}
        </span>
      </div>
    )
  })() : null

  return <>
    {/* z-index: 0 — background image, behind everything. filter ONLY here, never on parent */}
    {slide.bgImageUrl && !NO_BG_WALLPAPER.includes(props.template) && (
      <div style={{
        position: 'absolute', inset: 0, zIndex: Z_IMG,
        display: slide.bgVisible === false ? 'none' : 'block',
        backgroundImage: `url("${slide.bgImageUrl}")`,
        backgroundSize: (slide.bgZoom ?? 100) === 100 ? 'cover' : `${slide.bgZoom ?? 100}%`,
        backgroundPositionX: `${slide.bgPositionX ?? 50}%`,
        backgroundPositionY: `${slide.bgPositionY ?? 50}%`,
        opacity: (slide.imageOpacity ?? 100) / 100,
        filter: slide.bgFilter ?? 'none',
      }} />
    )}
    {/* z-index: 2 — background pattern (above overlay, text at same z rendered after = on top) */}
    <BgPattern slide={slide} s={s} />
    {/* Template content — overlays at z-index:1, text at z-index:2 */}
    {inner}
    {badge}
    {/* z-index: 3 — always on top */}
    {props.hasWatermark && (
      <span style={{
        position: 'absolute', bottom: `${10 * s}px`, right: `${14 * s}px`, zIndex: Z_WATERMARK,
        fontSize: `${9 * s}px`, fontFamily: '"Bebas Neue", sans-serif', letterSpacing: `${1 * s}px`,
        color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase',
      }}>
        by Conteúd<span style={{ color: '#C8FF00' }}>OS</span>
      </span>
    )}
  </>
}
// cache bust qui  7 mai 2026 10:22:26 -03
