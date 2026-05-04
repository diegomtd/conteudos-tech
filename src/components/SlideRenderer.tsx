import React from 'react'

// ─── Types ────────────────────────────────────────────────────

export type CarouselTemplate =
  | 'impacto'
  | 'editorial'
  | 'lista'
  | 'citacao'
  | 'comparacao'
  | 'storytelling'
  | 'editorial_foto'
  | 'texto_imagem'
  | 'split_visual'
  | 'citacao_bold'

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
  highlightedWords?: string[]
  accentColor?: string
  bgPattern?: string
  bgPatternOpacity?: number
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
  cinematic:    'linear-gradient(160deg,#060d14 0%,#0d1f30 60%,#091829 100%)',
  illustration: 'linear-gradient(160deg,#080c1a 0%,#0f1e4a 60%,#081530 100%)',
  abstract:     'linear-gradient(160deg,#0a0814 0%,#1a0f2e 60%,#0d0820 100%)',
  minimal:      'linear-gradient(160deg,#080808 0%,#141414 100%)',
  gradient:     'linear-gradient(160deg,#030a14 0%,#071525 100%)',
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
    textTransform: slide.titleUppercase ? 'uppercase' : 'none',
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


// ─── Container style ──────────────────────────────────────────
// backgroundImage intentionally omitted — rendered as z-indexed child in SlideRenderer

export function getSlideContainerStyle(
  slide: SlideData,
  index: number,
  _total: number,
  template: CarouselTemplate,
  imageStyle: string,
  scale: number,
): React.CSSProperties {
  const hasImg  = !!slide.bgImageUrl
  const pos     = slide.textPosition ?? 'bottom'
  const justify = pos === 'top' ? 'flex-start' : pos === 'center' ? 'center' : 'flex-end'
  const pad     = 20 * scale
  const base: React.CSSProperties = {
    position: 'relative', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
  }

  const px = slide.paddingX !== undefined ? slide.paddingX * scale : pad

  if (template === 'split_visual') {
    return { ...base, background: '#0a0a0a', padding: 0 }
  }

  if (template === 'editorial' || template === 'lista' || template === 'comparacao' ||
      template === 'texto_imagem' || template === 'citacao_bold') {
    return {
      ...base,
      background: '#0a0a0a',
      justifyContent: index === 0 ? 'flex-start' : template === 'comparacao' ? 'center' : justify,
      paddingTop: pad, paddingBottom: pad, paddingLeft: px, paddingRight: px,
    }
  }

  if (template === 'editorial_foto') {
    const bg = hasImg ? {} : { background: IA_BG[imageStyle] ?? 'linear-gradient(160deg, #060d14, #0d1f30)' }
    return {
      ...base, ...bg,
      justifyContent: 'flex-end',
      paddingTop: pad, paddingBottom: pad, paddingLeft: px, paddingRight: px,
    }
  }

  const bg = hasImg ? {} : { background: IA_BG[imageStyle] ?? IA_BG.cinematic }
  return {
    ...base,
    ...bg,
    justifyContent: index === 0 ? 'center' : justify,
    alignItems: index === 0 ? 'center' : 'stretch',
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

  if (!onWordClick) {
    return (
      <p {...pProps}>
        {words.map((word, i) => {
          const clean = word.replace(/[.,!?;:]/g, '')
          return (
            <span key={i} style={highlighted.includes(clean) ? { color: accentClr, fontWeight: 'bold' } : undefined}>
              {word}{i < words.length - 1 ? ' ' : ''}
            </span>
          )
        })}
      </p>
    )
  }

  const { style: baseStyle, ...restProps } = pProps
  return (
    <p {...restProps} style={{ ...baseStyle, userSelect: 'none' }}>
      {words.map((word, i) => {
        const clean = word.replace(/[.,!?;:]/g, '')
        const isHighlighted = highlighted.includes(clean)
        return (
          <span
            key={i}
            onClick={() => onWordClick(clean)}
            style={{
              color: isHighlighted ? accentClr : 'inherit',
              fontWeight: isHighlighted ? 'bold' : 'inherit',
              backgroundColor: isHighlighted ? 'rgba(200,255,0,0.1)' : 'transparent',
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
          const clean = word.replace(/[.,!?;:]/g, '')
          return (
            <span key={i} style={highlighted.includes(clean) ? { color: accentClr, fontWeight: 'bold' } : undefined}>
              {word}{i < words.length - 1 ? ' ' : ''}
            </span>
          )
        })}
      </p>
    )
  }

  const { style: baseStyle, ...restProps } = pProps
  return (
    <p {...restProps} style={{ ...baseStyle, userSelect: 'none' }}>
      {words.map((word, i) => {
        const clean = word.replace(/[.,!?;:]/g, '')
        const isHighlighted = highlighted.includes(clean)
        return (
          <span
            key={i}
            onClick={() => onTitleWordClick(clean)}
            style={{
              color: isHighlighted ? accentClr : 'inherit',
              fontWeight: isHighlighted ? 'bold' : 'inherit',
              backgroundColor: isHighlighted ? 'rgba(200,255,0,0.1)' : 'transparent',
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
            fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 48) * s}px`, fontWeight: fw,
            color, textAlign: align, margin: 0, zIndex: Z_CONTENT,
            transform: slide.titlePos ? `translate(${slide.titlePos.x * s}px,${slide.titlePos.y * s}px)` : undefined,
            cursor: onSelectEl ? (selectedEl === 'titulo' ? 'grab' : 'pointer') : 'default',
            ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
          },
        }, onTitleWordClick)}
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
            fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 28) * s}px`, fontWeight: fw,
            color, textAlign: 'center', margin: 0,
            cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
          },
        }, onTitleWordClick)}
        {renderBodyWithHighlights(slide.corpo, slide, {
          onClick: () => onSelectEl?.('corpo'),
          style: { fontSize: `${(slide.bodyFontSize ?? 12) * s}px`, textAlign: 'center', margin: 0, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
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
            fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 26) * s}px`, fontWeight: fw,
            color, textAlign: align, margin: `0 0 ${blockGap(slide, s)}`, zIndex: Z_CONTENT,
            cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
          },
        }, onTitleWordClick)}
        {renderBodyWithHighlights(slide.corpo, slide, {
          onClick: () => onSelectEl?.('corpo'),
          style: { fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, textAlign: align, margin: 0, zIndex: Z_CONTENT, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
        }, onBodyWordClick)}
      </>
    )}
  </>
}

// ─── Template: EDITORIAL ──────────────────────────────────────

function Editorial({ slide, index, total, selectedEl, onSelectEl, onBodyWordClick, onTitleWordClick, scale: s = 1 }: SlideRenderProps & { scale: number }) {
  const isLast = index === total - 1
  const isCapa = index === 0
  const color  = slide.textColor ?? _T
  const fw     = slide.fontWeightTitle === 'bold' ? 900 : 700

  if (isCapa) return <>
    <div style={{ height: `${2 * s}px`, backgroundColor: A, marginBottom: `${18 * s}px`, zIndex: Z_CONTENT }} />
    {renderTitleWithHighlights(slide.titulo, slide, {
      onClick: () => onSelectEl?.('titulo'),
      style: {
        fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 38) * s}px`, fontWeight: fw,
        color, margin: 0, zIndex: Z_CONTENT,
        cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
      },
    }, onTitleWordClick)}
    {renderBodyWithHighlights(slide.corpo, slide, {
      onClick: () => onSelectEl?.('corpo'),
      style: { fontSize: `${(slide.bodyFontSize ?? 13) * s}px`, margin: `${blockGap(slide, s)} 0 0`, zIndex: Z_CONTENT, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
    }, onBodyWordClick)}
    <p style={{
      position: 'absolute', bottom: `${14 * s}px`, right: `${16 * s}px`,
      fontSize: `${10 * s}px`, color: 'rgba(255,255,255,0.25)', fontFamily: ff, margin: 0, zIndex: Z_CONTENT,
    }}>1/{total}</p>
  </>

  if (isLast) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: `${8 * s}px`, zIndex: Z_CONTENT }}>
      {renderTitleWithHighlights(slide.titulo || 'E aí, faz sentido?', slide, {
        onClick: () => onSelectEl?.('titulo'),
        style: {
          fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 26) * s}px`, fontWeight: fw,
          color, textAlign: 'center', margin: 0,
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
        },
      }, onTitleWordClick)}
      {renderBodyWithHighlights(slide.corpo, slide, {
        onClick: () => onSelectEl?.('corpo'),
        style: { fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, textAlign: 'center', margin: 0, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
      }, onBodyWordClick)}
      <div style={{ width: `${36 * s}px`, height: `${2 * s}px`, backgroundColor: A, marginTop: `${4 * s}px` }} />
    </div>
  )

  return <>
    <span style={{
      position: 'absolute', left: `${-2 * s}px`, top: '50%', transform: 'translateY(-50%)',
      fontFamily: bn, fontSize: `${100 * s}px`, color: A, opacity: 0.08, userSelect: 'none', lineHeight: 1,
      zIndex: Z_CONTENT,
    }}>{index}</span>
    {renderTitleWithHighlights(slide.titulo, slide, {
      onClick: () => onSelectEl?.('titulo'),
      style: {
        fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 20) * s}px`, fontWeight: fw,
        color, margin: `0 0 ${blockGap(slide, s)}`, zIndex: Z_CONTENT,
        cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
      },
    }, onTitleWordClick)}
    {renderBodyWithHighlights(slide.corpo, slide, {
      onClick: () => onSelectEl?.('corpo'),
      style: { fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, margin: 0, zIndex: Z_CONTENT, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
    }, onBodyWordClick)}
    <div style={{
      position: 'absolute', bottom: `${12 * s}px`, left: `${18 * s}px`, right: `${18 * s}px`,
      height: 1, backgroundColor: 'rgba(255,255,255,0.07)', zIndex: Z_CONTENT,
    }} />
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
        fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 30) * s}px`, fontWeight: fw,
        color, margin: 0, zIndex: Z_CONTENT,
        cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
      },
    }, onTitleWordClick)}
    {renderBodyWithHighlights(slide.corpo, slide, {
      onClick: () => onSelectEl?.('corpo'),
      style: { fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, margin: `${blockGap(slide, s)} 0 0`, zIndex: Z_CONTENT, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
    }, onBodyWordClick)}
  </>

  if (isLast) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: `${8 * s}px`, zIndex: Z_CONTENT }}>
      {renderTitleWithHighlights(slide.titulo, slide, {
        onClick: () => onSelectEl?.('titulo'),
        style: {
          fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 22) * s}px`, fontWeight: fw,
          color, textAlign: 'center', margin: 0,
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
        },
      }, onTitleWordClick)}
      {renderBodyWithHighlights(slide.corpo, slide, {
        onClick: () => onSelectEl?.('corpo'),
        style: { fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, textAlign: 'center', margin: 0, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
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
        fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 20) * s}px`, fontWeight: fw,
        color, margin: `0 0 ${blockGap(slide, s)}`, zIndex: Z_CONTENT,
        cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
      },
    }, onTitleWordClick)}
    {renderBodyWithHighlights(slide.corpo, slide, {
      onClick: () => onSelectEl?.('corpo'),
      style: { fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, margin: 0, zIndex: Z_CONTENT, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
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
            fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 22) * s}px`,
            fontWeight: fw, color, textAlign: 'center', margin: 0,
            transform: slide.titlePos ? `translate(${slide.titlePos.x * s}px,${slide.titlePos.y * s}px)` : undefined,
            cursor: onSelectEl ? (selectedEl === 'titulo' ? 'grab' : 'pointer') : 'default',
            ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
          },
        }, onTitleWordClick)}
        {renderBodyWithHighlights(slide.corpo, slide, {
          onClick: () => onSelectEl?.('corpo'),
          style: { fontSize: `${(slide.bodyFontSize ?? 10) * s}px`, margin: `${blockGap(slide, s)} 0 0`, textAlign: 'center', cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
        }, onBodyWordClick)}
      </div>
    </> : isLast ? (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: `${8 * s}px`, zIndex: Z_CONTENT }}>
        {renderTitleWithHighlights(slide.titulo, slide, {
          onClick: () => onSelectEl?.('titulo'),
          style: {
            fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 22) * s}px`, fontWeight: fw,
            color, textAlign: 'center', margin: 0,
            cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
          },
        }, onTitleWordClick)}
        {renderBodyWithHighlights(slide.corpo, slide, {
          onClick: () => onSelectEl?.('corpo'),
          style: { fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, textAlign: 'center', margin: 0, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
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
            fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 20) * s}px`,
            fontWeight: fw, color, textAlign: 'center', margin: 0,
            cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
          },
        }, onTitleWordClick)}
        {renderBodyWithHighlights(slide.corpo, slide, {
          onClick: () => onSelectEl?.('corpo'),
          style: { fontSize: `${(slide.bodyFontSize ?? 10) * s}px`, margin: `${blockGap(slide, s)} 0 0`, textAlign: 'center', cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
        }, onBodyWordClick)}
      </div>
    )}
  </>
}

// ─── Template: COMPARAÇÃO ─────────────────────────────────────

function Comparacao({ slide, index, total, selectedEl, onSelectEl, onBodyWordClick, onTitleWordClick, scale: s = 1 }: SlideRenderProps & { scale: number }) {
  const isLast  = index === total - 1
  const isCapa  = index === 0
  const color   = slide.textColor ?? _T
  const fw      = slide.fontWeightTitle === 'bold' ? 900 : 700

  const parts      = slide.corpo.split('|').map((p) => p.trim())
  const antesText  = slide.beforeText ?? parts[0] ?? slide.corpo
  const depoisText = slide.afterText  ?? parts[1] ?? ''

  if (isCapa) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: `${10 * s}px`, zIndex: Z_CONTENT }}>
      {renderTitleWithHighlights(slide.titulo, slide, {
        onClick: () => onSelectEl?.('titulo'),
        style: {
          fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 30) * s}px`, fontWeight: fw,
          color, textAlign: 'center', margin: 0,
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
        },
      }, onTitleWordClick)}
      <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * s}px` }}>
        <span style={{ color: '#ff4444', fontFamily: bn, fontSize: `${12 * s}px`, letterSpacing: 1 }}>ANTES</span>
        <span style={{ fontSize: `${14 * s}px`, opacity: 0.5 }}>→</span>
        <span style={{ color: A, fontFamily: bn, fontSize: `${12 * s}px`, letterSpacing: 1 }}>DEPOIS</span>
      </div>
      {renderBodyWithHighlights(slide.corpo, slide, {
        onClick: () => onSelectEl?.('corpo'),
        style: { fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, textAlign: 'center', margin: 0, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
      }, onBodyWordClick)}
    </div>
  )

  if (isLast) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: `${8 * s}px`, zIndex: Z_CONTENT }}>
      {renderTitleWithHighlights(slide.titulo, slide, {
        onClick: () => onSelectEl?.('titulo'),
        style: {
          fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 22) * s}px`, fontWeight: fw,
          color, textAlign: 'center', margin: 0,
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
        },
      }, onTitleWordClick)}
      {renderBodyWithHighlights(slide.corpo, slide, {
        onClick: () => onSelectEl?.('corpo'),
        style: { fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, textAlign: 'center', margin: 0, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
      }, onBodyWordClick)}
    </div>
  )

  return (
    <div style={{ display: 'flex', flex: 1, marginTop: `${-20 * s}px`, marginLeft: `${-20 * s}px`, marginRight: `${-20 * s}px`, zIndex: Z_CONTENT }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${16 * s}px ${14 * s}px`, gap: `${6 * s}px` }}>
        <span style={{ fontFamily: bn, fontSize: `${10 * s}px`, color: '#ff4444', letterSpacing: 1 }}>ANTES</span>
        {renderBodyWithHighlights(antesText, slide, {
          style: { fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, margin: 0, ...bodyX(slide, s) },
        }, onBodyWordClick)}
      </div>
      <div style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'stretch' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${16 * s}px ${14 * s}px`, gap: `${6 * s}px` }}>
        <span style={{ fontFamily: bn, fontSize: `${10 * s}px`, color: A, letterSpacing: 1 }}>DEPOIS</span>
        {renderBodyWithHighlights(depoisText, slide, {
          style: { fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, margin: 0, ...bodyX(slide, s) },
        }, onBodyWordClick)}
      </div>
    </div>
  )
}

// ─── Template: STORYTELLING ───────────────────────────────────

function Storytelling({ slide, index, total, selectedEl, onSelectEl, onTitleMouseDown, onBodyWordClick, onTitleWordClick, scale: s = 1 }: SlideRenderProps & { scale: number }) {
  const isLast = index === total - 1
  const isCapa = index === 0
  const color  = slide.textColor ?? _T
  const fw     = slide.fontWeightTitle === 'bold' ? 900 : 700

  return <>
    {/* Overlay — z-index: 1, above image */}
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
          fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 22) * s}px`,
          fontWeight: fw, color, margin: 0, zIndex: Z_CONTENT,
          transform: slide.titlePos ? `translate(${slide.titlePos.x * s}px,${slide.titlePos.y * s}px)` : undefined,
          cursor: onSelectEl ? (selectedEl === 'titulo' ? 'grab' : 'pointer') : 'default',
          ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
        },
      }, onTitleWordClick)}
      {renderBodyWithHighlights(slide.corpo, slide, {
        onClick: () => onSelectEl?.('corpo'),
        style: { fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, margin: `${blockGap(slide, s)} 0 0`, zIndex: Z_CONTENT, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
      }, onBodyWordClick)}
    </> : isLast ? (
      <div style={{ display: 'flex', flexDirection: 'column', zIndex: Z_CONTENT, gap: `${8 * s}px` }}>
        {renderTitleWithHighlights(slide.titulo, slide, {
          onClick: () => onSelectEl?.('titulo'),
          style: {
            fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 22) * s}px`, fontWeight: fw,
            color, margin: 0,
            cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
          },
        }, onTitleWordClick)}
        {renderBodyWithHighlights(slide.corpo, slide, {
          onClick: () => onSelectEl?.('corpo'),
          style: { fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, margin: 0, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
        }, onBodyWordClick)}
        <p style={{ fontSize: `${10 * s}px`, color: slide.textColor ?? A, fontFamily: ff, fontWeight: 600, margin: 0 }}>
          {slide.ctaText ?? 'Se isso te tocou, compartilha'}
        </p>
      </div>
    ) : <>
      {renderBodyWithHighlights(slide.corpo, slide, {
        onClick: () => onSelectEl?.('corpo'),
        style: { fontSize: `${(slide.bodyFontSize ?? 12) * s}px`, margin: `0 0 ${blockGap(slide, s)}`, zIndex: Z_CONTENT, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
      }, onBodyWordClick)}
      {renderTitleWithHighlights(slide.titulo, slide, {
        onClick: () => onSelectEl?.('titulo'),
        style: {
          fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 16) * s}px`, fontWeight: fw,
          color, margin: 0, zIndex: Z_CONTENT,
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
        },
      }, onTitleWordClick)}
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

// ─── Template: EDITORIAL FOTO ─────────────────────────────────

function EditorialFoto({ slide, index, total, selectedEl, onSelectEl, onTitleMouseDown, onBodyWordClick, onTitleWordClick, scale: s = 1 }: SlideRenderProps & { scale: number }) {
  const isLast = index === total - 1
  const isCapa = index === 0
  const fw = slide.fontWeightTitle === 'bold' ? 900 : 700

  return <>
    <div style={{
      position: 'absolute', inset: 0, zIndex: Z_OVERLAY,
      background: `linear-gradient(to top, rgba(0,0,0,${(slide.overlayOpacity ?? 92) / 100}) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.05) 100%)`,
      boxShadow: slide.borderVignette ? `inset 0 0 ${(slide.vignetteIntensity ?? 60) * 1.5}px rgba(0,0,0,0.8)` : 'none',
    }} />

    {!isCapa && !isLast && (
      <span style={{
        position: 'absolute', top: `${8 * s}px`, right: `${10 * s}px`,
        fontFamily: bn, fontSize: `${11 * s}px`, color: 'rgba(255,255,255,0.35)',
        zIndex: Z_CONTENT, userSelect: 'none',
      }}>{index}/{total - 2}</span>
    )}

    {isCapa && !slide.profileBadgeEnabled && slide.profileHandle && (
      <span style={{
        position: 'absolute', top: `${12 * s}px`, left: `${14 * s}px`,
        fontFamily: ff, fontSize: `${10 * s}px`, color: 'rgba(255,255,255,0.55)',
        zIndex: Z_CONTENT, letterSpacing: `${0.3 * s}px`,
      }}>@{(slide.profileHandle ?? '').replace('@', '')}</span>
    )}

    {isCapa ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${8 * s}px`, zIndex: Z_CONTENT }}>
        {renderTitleWithHighlights(slide.titulo, slide, {
          onClick: () => onSelectEl?.('titulo'),
          onMouseDown: onTitleMouseDown,
          style: {
            fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 40) * s}px`, fontWeight: 900,
            color: _T, margin: 0,
            transform: slide.titlePos ? `translate(${slide.titlePos.x * s}px,${slide.titlePos.y * s}px)` : undefined,
            cursor: onSelectEl ? (selectedEl === 'titulo' ? 'grab' : 'pointer') : 'default',
            ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
          },
        }, onTitleWordClick)}
        {renderBodyWithHighlights(slide.corpo, slide, {
          onClick: () => onSelectEl?.('corpo'),
          style: { fontSize: `${(slide.bodyFontSize ?? 12) * s}px`, margin: 0, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
        }, onBodyWordClick)}
      </div>
    ) : isLast ? (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${8 * s}px`, zIndex: Z_CONTENT, width: '100%' }}>
        {renderTitleWithHighlights(slide.titulo, slide, {
          onClick: () => onSelectEl?.('titulo'),
          style: {
            fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 26) * s}px`, fontWeight: fw,
            color: _T, textAlign: 'center', margin: 0,
            cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
          },
        }, onTitleWordClick)}
        {renderBodyWithHighlights(slide.corpo, slide, {
          onClick: () => onSelectEl?.('corpo'),
          style: { fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, textAlign: 'center', margin: 0, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
        }, onBodyWordClick)}
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${8 * s}px`, zIndex: Z_CONTENT }}>
        {renderTitleWithHighlights(slide.titulo, slide, {
          onClick: () => onSelectEl?.('titulo'),
          style: {
            fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 28) * s}px`, fontWeight: 900,
            color: _T, margin: 0,
            cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
          },
        }, onTitleWordClick)}
        {renderBodyWithHighlights(slide.corpo, slide, {
          onClick: () => onSelectEl?.('corpo'),
          style: { fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, margin: 0, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
        }, onBodyWordClick)}
      </div>
    )}
  </>
}

// ─── Template: TEXTO + IMAGEM ─────────────────────────────────

function TextoImagem({ slide, index, total, selectedEl, onSelectEl, onBodyWordClick, onTitleWordClick, scale: s = 1 }: SlideRenderProps & { scale: number }) {
  const isLast = index === total - 1
  const color = slide.textColor ?? _T
  const fw = slide.fontWeightTitle === 'bold' ? 900 : 700
  const hasImg = !!slide.bgImageUrl

  if (isLast) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: `${8 * s}px`, zIndex: Z_CONTENT }}>
      {renderTitleWithHighlights(slide.titulo, slide, {
        onClick: () => onSelectEl?.('titulo'),
        style: {
          fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 22) * s}px`, fontWeight: fw,
          color, textAlign: 'center', margin: 0,
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
        },
      }, onTitleWordClick)}
      {renderBodyWithHighlights(slide.corpo, slide, {
        onClick: () => onSelectEl?.('corpo'),
        style: { fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, textAlign: 'center', margin: 0, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
      }, onBodyWordClick)}
    </div>
  )

  if (!hasImg) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', zIndex: Z_CONTENT }}>
      <div style={{ paddingBottom: `${12 * s}px` }}>
        {renderTitleWithHighlights(slide.titulo, slide, {
          onClick: () => onSelectEl?.('titulo'),
          style: {
            fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 28) * s}px`, fontWeight: fw,
            color, margin: `0 0 ${blockGap(slide, s)}`,
            cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
          },
        }, onTitleWordClick)}
        {renderBodyWithHighlights(slide.corpo, slide, {
          onClick: () => onSelectEl?.('corpo'),
          style: { fontSize: `${(slide.bodyFontSize ?? 12) * s}px`, margin: 0, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
        }, onBodyWordClick)}
      </div>
      <div style={{
        flex: 1, borderRadius: `${12 * s}px`,
        background: 'rgba(255,255,255,0.04)',
        border: `1px dashed rgba(255,255,255,0.15)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: `${6 * s}px`,
      }}>
        <svg width={`${22 * s}`} height={`${22 * s}`} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <span style={{ fontSize: `${10 * s}px`, color: 'rgba(255,255,255,0.2)', fontFamily: ff }}>Adicione uma imagem</span>
      </div>
    </div>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', zIndex: Z_CONTENT }}>
      <div style={{ paddingBottom: `${12 * s}px` }}>
        {renderTitleWithHighlights(slide.titulo, slide, {
          onClick: () => onSelectEl?.('titulo'),
          style: {
            fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 24) * s}px`, fontWeight: fw,
            color, margin: `0 0 ${blockGap(slide, s)}`,
            cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
          },
        }, onTitleWordClick)}
        {renderBodyWithHighlights(slide.corpo, slide, {
          onClick: () => onSelectEl?.('corpo'),
          style: { fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, margin: 0, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
        }, onBodyWordClick)}
      </div>
      <div style={{
        flex: 1, borderRadius: `${12 * s}px`, overflow: 'hidden',
        backgroundImage: `url("${slide.bgImageUrl}")`,
        backgroundSize: (slide.bgZoom ?? 100) === 100 ? 'cover' : `${slide.bgZoom ?? 100}%`,
        backgroundPosition: `${slide.bgPositionX ?? 50}% ${slide.bgPositionY ?? 50}%`,
        filter: slide.bgFilter ?? 'none',
        opacity: (slide.imageOpacity ?? 100) / 100,
      }} />
    </div>
  )
}

// ─── Template: SPLIT VISUAL ───────────────────────────────────

function SplitVisual({ slide, index, total, selectedEl, onSelectEl, onBodyWordClick, onTitleWordClick, scale: s = 1 }: SlideRenderProps & { scale: number }) {
  const isLast = index === total - 1
  const isCapa = index === 0
  const color = slide.textColor ?? _T
  const fw = slide.fontWeightTitle === 'bold' ? 900 : 700

  if (isCapa || isLast) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: `${8 * s}px`, zIndex: Z_CONTENT, padding: `${20 * s}px` }}>
      {renderTitleWithHighlights(slide.titulo, slide, {
        onClick: () => onSelectEl?.('titulo'),
        style: {
          fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 28) * s}px`, fontWeight: fw,
          color, textAlign: 'center', margin: 0,
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
        },
      }, onTitleWordClick)}
      {renderBodyWithHighlights(slide.corpo, slide, {
        onClick: () => onSelectEl?.('corpo'),
        style: { fontSize: `${(slide.bodyFontSize ?? 12) * s}px`, textAlign: 'center', margin: 0, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
      }, onBodyWordClick)}
    </div>
  )

  const topImg = slide.bgImageUrl
  const botImg = slide.afterImageUrl ?? ''
  const topIsUrl = !!topImg && topImg.startsWith('http')
  const botIsUrl = !!botImg && botImg.startsWith('http')

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        backgroundImage: topIsUrl ? `url("${topImg}")` : 'linear-gradient(160deg, #060d14, #1a2a3a)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
        {renderTitleWithHighlights(slide.titulo, slide, {
          onClick: () => onSelectEl?.('titulo'),
          style: {
            position: 'relative', fontFamily: titleFont(slide),
            fontSize: `${(slide.titleFontSize ?? 22) * s}px`, fontWeight: fw,
            color, textAlign: 'center', margin: 0, padding: `0 ${16 * s}px`, zIndex: 1,
            cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
          },
        }, onTitleWordClick)}
      </div>
      <div style={{ height: `${2 * s}px`, backgroundColor: A, flexShrink: 0 }} />
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        backgroundImage: botIsUrl ? `url("${botImg}")` : 'linear-gradient(160deg, #0a0a14, #14140a)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
        {renderBodyWithHighlights(slide.corpo, slide, {
          onClick: () => onSelectEl?.('corpo'),
          style: { position: 'relative', fontFamily: ff, fontSize: `${(slide.bodyFontSize ?? 14) * s}px`, textAlign: 'center', margin: 0, padding: `0 ${16 * s}px`, zIndex: 1, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
        }, onBodyWordClick)}
      </div>
    </div>
  )
}

// ─── Template: CITAÇÃO BOLD ───────────────────────────────────

function CitacaoBold({ slide, index, total, selectedEl, onSelectEl, onBodyWordClick, onTitleWordClick, scale: s = 1 }: SlideRenderProps & { scale: number }) {
  const isLast = index === total - 1
  const isCapa = index === 0
  const color = slide.textColor ?? _T
  const isMid = !isCapa && !isLast

  return <>
    {isMid && (
      <span style={{
        position: 'absolute', top: '-10%', left: `${-6 * s}px`,
        fontFamily: bn, fontSize: `${200 * s}px`, color: A, opacity: 0.12,
        lineHeight: 1, zIndex: Z_CONTENT, userSelect: 'none',
        pointerEvents: 'none',
      }}>"</span>
    )}
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: `${12 * s}px`, zIndex: Z_CONTENT,
    }}>
      {renderTitleWithHighlights(slide.titulo, slide, {
        onClick: () => onSelectEl?.('titulo'),
        style: {
          fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 32) * s}px`,
          fontWeight: 900, color, textAlign: 'center', margin: 0,
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
        },
      }, onTitleWordClick)}
      <div style={{ width: `${40 * s}px`, height: `${2 * s}px`, backgroundColor: A }} />
      {renderBodyWithHighlights(slide.corpo, slide, {
        onClick: () => onSelectEl?.('corpo'),
        style: { fontSize: `${(slide.bodyFontSize ?? 12) * s}px`, textAlign: 'center', margin: 0, cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s) },
      }, onBodyWordClick)}
      {isLast && (
        <p style={{ fontSize: `${10 * s}px`, color: slide.textColor ?? A, fontFamily: ff, fontWeight: 600, margin: `${4 * s}px 0 0` }}>
          {slide.ctaText ?? 'Salve esse carrossel'}
        </p>
      )}
    </div>
  </>
}

// ─── Main export ──────────────────────────────────────────────

const NO_BG_WALLPAPER: CarouselTemplate[] = ['texto_imagem', 'split_visual', 'citacao_bold']

export function SlideRenderer(props: SlideRenderProps): React.ReactElement {
  const s = props.scale ?? 1
  const { slide } = props

  const inner = (() => {
    switch (props.template) {
      case 'editorial':     return <Editorial     {...props} scale={s} />
      case 'lista':         return <Lista         {...props} scale={s} />
      case 'citacao':       return <Citacao       {...props} scale={s} />
      case 'comparacao':    return <Comparacao    {...props} scale={s} />
      case 'storytelling':  return <Storytelling  {...props} scale={s} />
      case 'editorial_foto':return <EditorialFoto {...props} scale={s} />
      case 'texto_imagem':  return <TextoImagem   {...props} scale={s} />
      case 'split_visual':  return <SplitVisual   {...props} scale={s} />
      case 'citacao_bold':  return <CitacaoBold   {...props} scale={s} />
      default:              return <Impacto       {...props} scale={s} />
    }
  })()

  // Profile badge
  const badge = slide.profileBadgeEnabled && slide.profileHandle ? (() => {
    const pos = slide.profileBadgePosition ?? 'bottom-left'
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
        padding: `${6 * s}px ${10 * s}px`,
        backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
        borderRadius: `${20 * s}px`, border: '1px solid rgba(255,255,255,0.15)',
      }}>
        {slide.profileAvatarUrl ? (
          <img src={slide.profileAvatarUrl} alt="" style={{
            width: `${24 * s}px`, height: `${24 * s}px`,
            borderRadius: '50%', objectFit: 'cover' as React.CSSProperties['objectFit'],
          }} />
        ) : (
          <div style={{
            width: `${24 * s}px`, height: `${24 * s}px`, borderRadius: '50%', backgroundColor: A,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: `${10 * s}px`, fontFamily: bn, color: '#000', fontWeight: 700,
          }}>{initials}</div>
        )}
        <span style={{ fontFamily: ff, fontSize: `${10 * s}px`, color: '#FFFFFF', fontWeight: 600, letterSpacing: `${0.3 * s}px` }}>
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
