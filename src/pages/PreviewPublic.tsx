import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { SlideRenderer, getSlideContainerStyle } from '@/components/SlideRenderer'
import type { CarouselTemplate, SlideData } from '@/components/SlideRenderer'

const BG  = '#080808'
const S   = '#0F0F0F'
const B   = 'rgba(255,255,255,0.08)'
const T   = '#F5F5F5'
const M   = 'rgba(255,255,255,0.45)'
const A   = '#C8FF00'
const ff  = 'DM Sans, sans-serif'
const ffd = '"Bebas Neue", sans-serif'

const SCALE   = 360 / 1080
const SLIDE_W = 360
const SLIDE_H = Math.round(SLIDE_W * 1350 / 1080) // 450

interface LoadedCarousel {
  tema: string
  legenda: string
  template: CarouselTemplate
  hasWatermark: boolean
  slides: SlideData[]
}

export default function PreviewPublic() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<'loading' | 'found' | 'not-found'>('loading')
  const [carousel, setCarousel] = useState<LoadedCarousel | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!token) { setState('not-found'); return }

    async function load() {
      const { data: car, error: carErr } = await supabase
        .from('carousels')
        .select('id, tema, legenda, has_watermark, template_style')
        .eq('preview_token', token)
        .single()

      if (carErr || !car) { setState('not-found'); return }

      const { data: slidesData, error: slidesErr } = await supabase
        .from('carousel_slides')
        .select('position, titulo, corpo, bg_image_url, bg_solid_color, font_size_title, font_size_body, font_weight_title, font_family, text_color, body_color, text_align, title_position_x, title_position_y, overlay_opacity, bg_zoom, bg_pos_x, bg_pos_y, highlighted_words, accent_color, subtitle, subtitle_font_size')
        .eq('carousel_id', (car as Record<string, unknown>).id)
        .order('position', { ascending: true })

      if (slidesErr || !slidesData || slidesData.length === 0) { setState('not-found'); return }

      const slides: SlideData[] = (slidesData as Array<Record<string, unknown>>).map((s) => ({
        titulo:           (s.titulo as string)                  ?? '',
        corpo:            (s.corpo as string)                   ?? '',
        bgImageUrl:       (s.bg_image_url as string)            ?? undefined,
        bgSolidColor:     (s.bg_solid_color as string)          ?? undefined,
        titleFontSize:    (s.font_size_title as number)         ?? undefined,
        bodyFontSize:     (s.font_size_body as number)          ?? undefined,
        fontWeightTitle:  (s.font_weight_title as 'normal' | 'bold') ?? undefined,
        fontFamily:       (s.font_family as string)             ?? undefined,
        textColor:        (s.text_color as string)              ?? undefined,
        bodyColor:        (s.body_color as string)              ?? undefined,
        textAlign:        (s.text_align as 'left' | 'center' | 'right') ?? undefined,
        titlePos:         (s.title_position_x != null && s.title_position_y != null)
          ? { x: s.title_position_x as number, y: s.title_position_y as number }
          : undefined,
        overlayOpacity:   (s.overlay_opacity as number)         ?? undefined,
        bgZoom:           (s.bg_zoom as number)                 ?? undefined,
        bgPositionX:      (s.bg_pos_x as number)                ?? undefined,
        bgPositionY:      (s.bg_pos_y as number)                ?? undefined,
        highlightedWords: Array.isArray(s.highlighted_words)
          ? (s.highlighted_words as string[])
          : typeof s.highlighted_words === 'string' && (s.highlighted_words as string).trim()
          ? (() => { try { return JSON.parse(s.highlighted_words as string) } catch { return [] } })()
          : [],
        accentColor:      (s.accent_color as string)            ?? undefined,
        subtitle:         (s.subtitle as string)                ?? undefined,
        subtitleFontSize: (s.subtitle_font_size as number)      ?? undefined,
      }))

      setCarousel({
        tema:         (car as Record<string, unknown>).tema as string         ?? '',
        legenda:      (car as Record<string, unknown>).legenda as string      ?? '',
        template:     ((car as Record<string, unknown>).template_style as CarouselTemplate) ?? 'impacto',
        hasWatermark: (car as Record<string, unknown>).has_watermark as boolean ?? false,
        slides,
      })
      setState('found')
    }

    load()
  }, [token])

  function copyLegenda() {
    if (!carousel?.legenda) return
    navigator.clipboard.writeText(carousel.legenda).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (state === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: `2px solid ${B}`, borderTopColor: A,
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontFamily: ff, fontSize: 13, color: M }}>Carregando...</span>
        </div>
      </div>
    )
  }

  if (state === 'not-found' || !carousel) {
    return (
      <div style={{
        minHeight: '100vh', background: BG,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 12, padding: 32,
      }}>
        <span style={{ fontFamily: ffd, fontSize: 48, color: T, letterSpacing: 2 }}>404</span>
        <span style={{ fontFamily: ffd, fontSize: 22, color: M, letterSpacing: 1 }}>Carrossel não encontrado</span>
        <span style={{ fontFamily: ff, fontSize: 13, color: 'rgba(255,255,255,0.25)', textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
          Este link pode ter expirado ou o carrossel foi removido.
        </span>
      </div>
    )
  }

  const total = carousel.slides.length

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: ff }}>

      {/* Header */}
      <header style={{
        width: '100%', borderBottom: `1px solid ${B}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 56, flexShrink: 0, boxSizing: 'border-box',
      }}>
        <span style={{ fontFamily: ffd, fontSize: 20, color: T, letterSpacing: 1 }}>
          Conteúd<span style={{ color: A }}>OS</span>
        </span>
        {carousel.hasWatermark && (
          <span style={{
            fontFamily: ff, fontSize: 11, color: M,
            padding: '4px 10px', border: `1px solid ${B}`, borderRadius: 4,
          }}>
            Criado com ConteudOS
          </span>
        )}
        <a
          href="https://conteudos.tech"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: ff, fontSize: 12, color: M,
            textDecoration: 'none', padding: '6px 14px',
            border: `1px solid ${B}`, borderRadius: 6,
          }}
        >
          Criar o meu
        </a>
      </header>

      {/* Tema */}
      <div style={{ marginTop: 32, marginBottom: 8, textAlign: 'center', padding: '0 24px' }}>
        <p style={{ fontFamily: ffd, fontSize: 22, color: T, letterSpacing: 1, margin: 0 }}>{carousel.tema}</p>
        <p style={{ fontFamily: ff, fontSize: 12, color: M, margin: '4px 0 0' }}>{total} slides</p>
      </div>

      {/* Grid 2 colunas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(2, ${SLIDE_W}px)`,
        gap: 16,
        padding: '24px',
        width: 'fit-content',
        maxWidth: '100vw',
        overflowX: 'auto',
      }}>
        {carousel.slides.map((slide, i) => (
          <div
            key={i}
            style={{
              width: SLIDE_W,
              height: SLIDE_H,
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
              flexShrink: 0,
              ...getSlideContainerStyle(slide, i, total, carousel.template, 'cinematic', SCALE),
            }}
          >
            <SlideRenderer
              slide={slide}
              index={i}
              total={total}
              template={carousel.template}
              imageStyle="cinematic"
              scale={SCALE}
              hasWatermark={carousel.hasWatermark}
            />
          </div>
        ))}
      </div>

      {/* Legenda copiável */}
      {carousel.legenda && (
        <div style={{
          marginTop: 32,
          width: 'calc(100% - 48px)', maxWidth: 752,
          backgroundColor: S, border: `1px solid ${B}`,
          borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderBottom: `1px solid ${B}`,
          }}>
            <span style={{ fontFamily: ff, fontSize: 12, color: M }}>Legenda</span>
            <button
              onClick={copyLegenda}
              style={{
                fontFamily: ff, fontSize: 12,
                color: copied ? A : M,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '2px 8px', transition: 'color 0.15s',
              }}
            >
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <pre style={{
            margin: 0, padding: '16px',
            fontFamily: ff, fontSize: 13, color: T,
            lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {carousel.legenda}
          </pre>
        </div>
      )}

      {/* CTA */}
      <div style={{
        marginTop: 32, marginBottom: 48,
        backgroundColor: S, border: `1px solid ${B}`,
        borderRadius: 16, padding: '28px 32px',
        maxWidth: 400, width: 'calc(100% - 48px)',
        textAlign: 'center', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 14,
      }}>
        <p style={{ fontFamily: ffd, fontSize: 20, color: T, margin: 0, letterSpacing: 1 }}>
          Crie carrosseis assim em minutos
        </p>
        <p style={{ fontFamily: ff, fontSize: 13, color: M, margin: 0, lineHeight: 1.6 }}>
          IA que escreve na sua voz, com templates que convertem.
        </p>
        <a
          href="https://conteudos.tech"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block', backgroundColor: A, color: '#000',
            fontFamily: ffd, fontSize: 16, letterSpacing: 1,
            padding: '12px 28px', borderRadius: 8, textDecoration: 'none',
          }}
        >
          COMEÇAR GRÁTIS
        </a>
      </div>
    </div>
  )
}
