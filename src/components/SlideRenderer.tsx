import React from 'react'

// ─── Types ────────────────────────────────────────────────────

export type CarouselTemplate =
  | 'impacto'
  | 'editorial'
  | 'lista'
  | 'citacao'
  | 'comparacao'
  | 'storytelling'

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

  if (template === 'editorial' || template === 'lista' || template === 'comparacao') {
    return {
      ...base,
      background: '#0a0a0a',
      justifyContent: index === 0 ? 'flex-start' : template === 'comparacao' ? 'center' : justify,
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

// ─── Template: IMPACTO ────────────────────────────────────────

function Impacto({ slide, index, total, selectedEl, onSelectEl, onTitleMouseDown, scale: s = 1 }: SlideRenderProps & { scale: number }) {
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
        <p
          onClick={() => onSelectEl?.('titulo')}
          onMouseDown={onTitleMouseDown}
          style={{
            fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 48) * s}px`, fontWeight: fw,
            color, textAlign: align, margin: 0, zIndex: Z_CONTENT,
            transform: slide.titlePos ? `translate(${slide.titlePos.x * s}px,${slide.titlePos.y * s}px)` : undefined,
            cursor: onSelectEl ? (selectedEl === 'titulo' ? 'grab' : 'pointer') : 'default',
            userSelect: 'none', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
          }}
        >{slide.titulo}</p>
        <p style={{
          position: 'absolute', bottom: `${12 * s}px`, right: `${14 * s}px`,
          fontSize: `${9 * s}px`, color: 'rgba(255,255,255,0.45)', fontFamily: ff,
          margin: 0, zIndex: Z_CONTENT,
        }}>Arrasta para o lado →</p>
      </>
    ) : isLast ? (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${6 * s}px`, zIndex: Z_CONTENT, width: '100%' }}>
        <p onClick={() => onSelectEl?.('titulo')} style={{
          fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 28) * s}px`, fontWeight: fw,
          color, textAlign: 'center', margin: 0,
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
        }}>{slide.titulo}</p>
        <p onClick={() => onSelectEl?.('corpo')} style={{
          fontSize: `${(slide.bodyFontSize ?? 12) * s}px`, textAlign: 'center', margin: 0,
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s),
        }}>{slide.corpo}</p>
        <p style={{ fontSize: `${10 * s}px`, color: slide.textColor ?? A, fontFamily: ff, fontWeight: 600, margin: 0 }}>
          Salve para não perder
        </p>
      </div>
    ) : (
      <>
        <p onClick={() => onSelectEl?.('titulo')} style={{
          fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 26) * s}px`, fontWeight: fw,
          color, textAlign: align, margin: `0 0 ${blockGap(slide, s)}`, zIndex: Z_CONTENT,
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
        }}>{slide.titulo}</p>
        <p onClick={() => onSelectEl?.('corpo')} style={{
          fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, textAlign: align, margin: 0, zIndex: Z_CONTENT,
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s),
        }}>{slide.corpo}</p>
      </>
    )}
  </>
}

// ─── Template: EDITORIAL ──────────────────────────────────────

function Editorial({ slide, index, total, selectedEl, onSelectEl, scale: s = 1 }: SlideRenderProps & { scale: number }) {
  const isLast = index === total - 1
  const isCapa = index === 0
  const color  = slide.textColor ?? _T
  const fw     = slide.fontWeightTitle === 'bold' ? 900 : 700

  if (isCapa) return <>
    <div style={{ height: `${2 * s}px`, backgroundColor: A, marginBottom: `${18 * s}px`, zIndex: Z_CONTENT }} />
    <p onClick={() => onSelectEl?.('titulo')} style={{
      fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 38) * s}px`, fontWeight: fw,
      color, margin: 0, zIndex: Z_CONTENT,
      cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
    }}>{slide.titulo}</p>
    <p onClick={() => onSelectEl?.('corpo')} style={{
      fontSize: `${(slide.bodyFontSize ?? 13) * s}px`, margin: `${blockGap(slide, s)} 0 0`, zIndex: Z_CONTENT,
      cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s),
    }}>{slide.corpo}</p>
    <p style={{
      position: 'absolute', bottom: `${14 * s}px`, right: `${16 * s}px`,
      fontSize: `${10 * s}px`, color: 'rgba(255,255,255,0.25)', fontFamily: ff, margin: 0, zIndex: Z_CONTENT,
    }}>1/{total}</p>
  </>

  if (isLast) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: `${8 * s}px`, zIndex: Z_CONTENT }}>
      <p onClick={() => onSelectEl?.('titulo')} style={{
        fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 26) * s}px`, fontWeight: fw,
        color, textAlign: 'center', margin: 0,
        cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
      }}>{slide.titulo || 'E aí, faz sentido?'}</p>
      <p onClick={() => onSelectEl?.('corpo')} style={{
        fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, textAlign: 'center', margin: 0,
        cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s),
      }}>{slide.corpo}</p>
      <div style={{ width: `${36 * s}px`, height: `${2 * s}px`, backgroundColor: A, marginTop: `${4 * s}px` }} />
    </div>
  )

  return <>
    <span style={{
      position: 'absolute', left: `${-2 * s}px`, top: '50%', transform: 'translateY(-50%)',
      fontFamily: bn, fontSize: `${100 * s}px`, color: A, opacity: 0.08, userSelect: 'none', lineHeight: 1,
      zIndex: Z_CONTENT,
    }}>{index}</span>
    <p onClick={() => onSelectEl?.('titulo')} style={{
      fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 20) * s}px`, fontWeight: fw,
      color, margin: `0 0 ${blockGap(slide, s)}`, zIndex: Z_CONTENT,
      cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
    }}>{slide.titulo}</p>
    <p onClick={() => onSelectEl?.('corpo')} style={{
      fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, margin: 0, zIndex: Z_CONTENT,
      cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s),
    }}>{slide.corpo}</p>
    <div style={{
      position: 'absolute', bottom: `${12 * s}px`, left: `${18 * s}px`, right: `${18 * s}px`,
      height: 1, backgroundColor: 'rgba(255,255,255,0.07)', zIndex: Z_CONTENT,
    }} />
  </>
}

// ─── Template: LISTA VIRAL ────────────────────────────────────

function Lista({ slide, index, total, selectedEl, onSelectEl, scale: s = 1 }: SlideRenderProps & { scale: number }) {
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
    <p onClick={() => onSelectEl?.('titulo')} style={{
      fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 30) * s}px`, fontWeight: fw,
      color, margin: 0, zIndex: Z_CONTENT,
      cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
    }}>{slide.titulo}</p>
    <p onClick={() => onSelectEl?.('corpo')} style={{
      fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, margin: `${blockGap(slide, s)} 0 0`, zIndex: Z_CONTENT,
      cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s),
    }}>{slide.corpo}</p>
  </>

  if (isLast) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: `${8 * s}px`, zIndex: Z_CONTENT }}>
      <p onClick={() => onSelectEl?.('titulo')} style={{
        fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 22) * s}px`, fontWeight: fw,
        color, textAlign: 'center', margin: 0,
        cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
      }}>{slide.titulo}</p>
      <p onClick={() => onSelectEl?.('corpo')} style={{
        fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, textAlign: 'center', margin: 0,
        cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s),
      }}>{slide.corpo}</p>
    </div>
  )

  return <>
    <span style={{
      fontFamily: bn, fontSize: `${48 * s}px`, color: A, fontWeight: 900,
      lineHeight: 1, margin: `0 0 ${4 * s}px`, zIndex: Z_CONTENT,
    }}>
      {String(index).padStart(2, '0')}
    </span>
    <p onClick={() => onSelectEl?.('titulo')} style={{
      fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 20) * s}px`, fontWeight: fw,
      color, margin: `0 0 ${blockGap(slide, s)}`, zIndex: Z_CONTENT,
      cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
    }}>{slide.titulo}</p>
    <p onClick={() => onSelectEl?.('corpo')} style={{
      fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, margin: 0, zIndex: Z_CONTENT,
      cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s),
    }}>{slide.corpo}</p>
    <ProgressDots />
  </>
}

// ─── Template: CITAÇÃO ────────────────────────────────────────

function Citacao({ slide, index, total, selectedEl, onSelectEl, onTitleMouseDown, scale: s = 1 }: SlideRenderProps & { scale: number }) {
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
        <p
          onClick={() => onSelectEl?.('titulo')}
          onMouseDown={onTitleMouseDown}
          style={{
            fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 22) * s}px`,
            fontWeight: fw, color, textAlign: 'center', margin: 0,
            transform: slide.titlePos ? `translate(${slide.titlePos.x * s}px,${slide.titlePos.y * s}px)` : undefined,
            cursor: onSelectEl ? (selectedEl === 'titulo' ? 'grab' : 'pointer') : 'default',
            userSelect: 'none', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
          }}
        >{slide.titulo}</p>
        <p onClick={() => onSelectEl?.('corpo')} style={{
          fontSize: `${(slide.bodyFontSize ?? 10) * s}px`, margin: `${blockGap(slide, s)} 0 0`, textAlign: 'center',
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s),
        }}>{slide.corpo}</p>
      </div>
    </> : isLast ? (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: `${8 * s}px`, zIndex: Z_CONTENT }}>
        <p onClick={() => onSelectEl?.('titulo')} style={{
          fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 22) * s}px`, fontWeight: fw,
          color, textAlign: 'center', margin: 0,
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
        }}>{slide.titulo}</p>
        <p onClick={() => onSelectEl?.('corpo')} style={{
          fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, textAlign: 'center', margin: 0,
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s),
        }}>{slide.corpo}</p>
        <p style={{ fontSize: `${10 * s}px`, color: slide.textColor ?? A, fontFamily: ff, fontWeight: 600, margin: 0 }}>
          Salve esse carrossel
        </p>
      </div>
    ) : (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: Z_CONTENT }}>
        <div style={{ width: `${28 * s}px`, height: `${2 * s}px`, backgroundColor: A, marginBottom: `${10 * s}px` }} />
        <p onClick={() => onSelectEl?.('titulo')} style={{
          fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 20) * s}px`,
          fontWeight: fw, color, textAlign: 'center', margin: 0,
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
        }}>{slide.titulo}</p>
        <p onClick={() => onSelectEl?.('corpo')} style={{
          fontSize: `${(slide.bodyFontSize ?? 10) * s}px`, margin: `${blockGap(slide, s)} 0 0`, textAlign: 'center',
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s),
        }}>{slide.corpo}</p>
      </div>
    )}
  </>
}

// ─── Template: COMPARAÇÃO ─────────────────────────────────────

function Comparacao({ slide, index, total, selectedEl, onSelectEl, scale: s = 1 }: SlideRenderProps & { scale: number }) {
  const isLast  = index === total - 1
  const isCapa  = index === 0
  const color   = slide.textColor ?? _T
  const fw      = slide.fontWeightTitle === 'bold' ? 900 : 700

  const parts      = slide.corpo.split('|').map((p) => p.trim())
  const antesText  = slide.beforeText ?? parts[0] ?? slide.corpo
  const depoisText = slide.afterText  ?? parts[1] ?? ''

  if (isCapa) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: `${10 * s}px`, zIndex: Z_CONTENT }}>
      <p onClick={() => onSelectEl?.('titulo')} style={{
        fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 30) * s}px`, fontWeight: fw,
        color, textAlign: 'center', margin: 0,
        cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
      }}>{slide.titulo}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * s}px` }}>
        <span style={{ color: '#ff4444', fontFamily: bn, fontSize: `${12 * s}px`, letterSpacing: 1 }}>ANTES</span>
        <span style={{ fontSize: `${14 * s}px`, opacity: 0.5 }}>→</span>
        <span style={{ color: A, fontFamily: bn, fontSize: `${12 * s}px`, letterSpacing: 1 }}>DEPOIS</span>
      </div>
      <p onClick={() => onSelectEl?.('corpo')} style={{
        fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, textAlign: 'center', margin: 0,
        cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s),
      }}>{slide.corpo}</p>
    </div>
  )

  if (isLast) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: `${8 * s}px`, zIndex: Z_CONTENT }}>
      <p onClick={() => onSelectEl?.('titulo')} style={{
        fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 22) * s}px`, fontWeight: fw,
        color, textAlign: 'center', margin: 0,
        cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
      }}>{slide.titulo}</p>
      <p onClick={() => onSelectEl?.('corpo')} style={{
        fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, textAlign: 'center', margin: 0,
        cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s),
      }}>{slide.corpo}</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flex: 1, marginTop: `${-20 * s}px`, marginLeft: `${-20 * s}px`, marginRight: `${-20 * s}px`, zIndex: Z_CONTENT }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${16 * s}px ${14 * s}px`, gap: `${6 * s}px` }}>
        <span style={{ fontFamily: bn, fontSize: `${10 * s}px`, color: '#ff4444', letterSpacing: 1 }}>ANTES</span>
        <p style={{ fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, margin: 0, ...bodyX(slide, s) }}>
          {antesText}
        </p>
      </div>
      <div style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'stretch' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${16 * s}px ${14 * s}px`, gap: `${6 * s}px` }}>
        <span style={{ fontFamily: bn, fontSize: `${10 * s}px`, color: A, letterSpacing: 1 }}>DEPOIS</span>
        <p style={{ fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, margin: 0, ...bodyX(slide, s) }}>
          {depoisText}
        </p>
      </div>
    </div>
  )
}

// ─── Template: STORYTELLING ───────────────────────────────────

function Storytelling({ slide, index, total, selectedEl, onSelectEl, onTitleMouseDown, scale: s = 1 }: SlideRenderProps & { scale: number }) {
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
      <p
        onClick={() => onSelectEl?.('titulo')}
        onMouseDown={onTitleMouseDown}
        style={{
          fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 22) * s}px`,
          fontWeight: fw, color, margin: 0, zIndex: Z_CONTENT,
          transform: slide.titlePos ? `translate(${slide.titlePos.x * s}px,${slide.titlePos.y * s}px)` : undefined,
          cursor: onSelectEl ? (selectedEl === 'titulo' ? 'grab' : 'pointer') : 'default',
          userSelect: 'none', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
        }}
      >{slide.titulo}</p>
      <p onClick={() => onSelectEl?.('corpo')} style={{
        fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, margin: `${blockGap(slide, s)} 0 0`, zIndex: Z_CONTENT,
        cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s),
      }}>{slide.corpo}</p>
    </> : isLast ? (
      <div style={{ display: 'flex', flexDirection: 'column', zIndex: Z_CONTENT, gap: `${8 * s}px` }}>
        <p onClick={() => onSelectEl?.('titulo')} style={{
          fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 22) * s}px`, fontWeight: fw,
          color, margin: 0,
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
        }}>{slide.titulo}</p>
        <p onClick={() => onSelectEl?.('corpo')} style={{
          fontSize: `${(slide.bodyFontSize ?? 11) * s}px`, margin: 0,
          cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s),
        }}>{slide.corpo}</p>
        <p style={{ fontSize: `${10 * s}px`, color: slide.textColor ?? A, fontFamily: ff, fontWeight: 600, margin: 0 }}>
          Se isso te tocou, compartilha
        </p>
      </div>
    ) : <>
      <p onClick={() => onSelectEl?.('corpo')} style={{
        fontSize: `${(slide.bodyFontSize ?? 12) * s}px`, margin: `0 0 ${blockGap(slide, s)}`, zIndex: Z_CONTENT,
        cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'corpo'), ...bodyX(slide, s),
      }}>{slide.corpo}</p>
      <p onClick={() => onSelectEl?.('titulo')} style={{
        fontFamily: titleFont(slide), fontSize: `${(slide.titleFontSize ?? 16) * s}px`, fontWeight: fw,
        color, margin: 0, zIndex: Z_CONTENT,
        cursor: onSelectEl ? 'pointer' : 'default', ...selBorder(selectedEl === 'titulo'), ...titleX(slide, s),
      }}>{slide.titulo}</p>
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

// ─── Main export ──────────────────────────────────────────────

export function SlideRenderer(props: SlideRenderProps): React.ReactElement {
  const s = props.scale ?? 1
  const { slide } = props

  const inner = (() => {
    switch (props.template) {
      case 'editorial':    return <Editorial    {...props} scale={s} />
      case 'lista':        return <Lista        {...props} scale={s} />
      case 'citacao':      return <Citacao      {...props} scale={s} />
      case 'comparacao':   return <Comparacao   {...props} scale={s} />
      case 'storytelling': return <Storytelling {...props} scale={s} />
      default:             return <Impacto      {...props} scale={s} />
    }
  })()

  return <>
    {/* z-index: 0 — background image, behind everything. filter ONLY here, never on parent */}
    {slide.bgImageUrl && (
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
    {/* Template content — overlays at z-index:1, text at z-index:2 */}
    {inner}
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
