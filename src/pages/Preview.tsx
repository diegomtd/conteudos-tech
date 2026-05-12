import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SlideRenderer, getSlideContainerStyle } from '@/components/SlideRenderer'
import type { CarouselTemplate, SlideData } from '@/components/SlideRenderer'

// ─── Tokens ───────────────────────────────────────────────────
const BG  = '#010816'
const S   = '#0A1628'
const S2  = '#0F2040'
const A   = '#00D4FF'
const T   = '#E8F4FF'
const M   = 'rgba(232,244,255,0.42)'
const B   = 'rgba(255,255,255,0.07)'
const ff  = 'DM Sans, sans-serif'
const ffd = '"Bebas Neue", sans-serif'

interface LoadedCarousel {
  tema: string
  template: CarouselTemplate
  imageStyle: string
  hasWatermark: boolean
  slides: SlideData[]
}

export default function Preview() {
  const { token } = useParams<{ token: string }>()

  const [state, setState] = useState<'loading' | 'found' | 'not-found'>('loading')
  const [carousel, setCarousel] = useState<LoadedCarousel | null>(null)
  const [current, setCurrent] = useState(0)

  // ── Carrega carrossel pelo token ──────────────────────────────
  useEffect(() => {
    if (!token) { setState('not-found'); return }

    async function load() {
      const { data: car, error: carErr } = await supabase
        .from('carousels')
        .select('id, tema, template_style, has_watermark, status')
        .eq('preview_token', token)
        .single()

      if (carErr || !car) { setState('not-found'); return }

      const { data: slidesData, error: slidesErr } = await supabase
        .from('carousel_slides')
        .select('position, titulo, corpo, bg_image_url, bg_solid_color, font_size_title, font_size_body, font_weight_title, font_family, text_color, body_color, text_align, title_position_x, title_position_y, overlay_opacity, bg_zoom, bg_pos_x, bg_pos_y, highlighted_words, accent_color, subtitle, subtitle_font_size')
        .eq('carousel_id', car.id)
        .order('position', { ascending: true })

      if (slidesErr || !slidesData || slidesData.length === 0) { setState('not-found'); return }

      const slides: SlideData[] = (slidesData as Array<Record<string, unknown>>).map((s) => ({
        titulo:         (s.titulo as string)         ?? '',
        corpo:          (s.corpo as string)          ?? '',
        bgImageUrl:     (s.bg_image_url as string)   ?? undefined,
        bgSolidColor:   (s.bg_solid_color as string) ?? undefined,
        titleFontSize:  (s.font_size_title as number) ?? undefined,
        bodyFontSize:   (s.font_size_body as number)  ?? undefined,
        fontWeightTitle:(s.font_weight_title as 'normal' | 'bold') ?? undefined,
        fontFamily:     (s.font_family as string)    ?? undefined,
        textColor:      (s.text_color as string)     ?? undefined,
        bodyColor:      (s.body_color as string)     ?? undefined,
        textAlign:      (s.text_align as 'left' | 'center' | 'right') ?? undefined,
        titlePos:       (s.title_position_x != null && s.title_position_y != null)
          ? { x: s.title_position_x as number, y: s.title_position_y as number }
          : undefined,
        overlayOpacity: (s.overlay_opacity as number) ?? undefined,
        bgZoom:         (s.bg_zoom as number)        ?? undefined,
        bgPositionX:    (s.bg_pos_x as number)       ?? undefined,
        bgPositionY:    (s.bg_pos_y as number)       ?? undefined,
        highlightedWords: Array.isArray(s.highlighted_words)
          ? (s.highlighted_words as string[])
          : typeof s.highlighted_words === 'string' && (s.highlighted_words as string).trim()
          ? (() => { try { return JSON.parse(s.highlighted_words as string) } catch { return [] } })()
          : [],
        accentColor:    (s.accent_color as string)   ?? undefined,
        subtitle:       (s.subtitle as string)       ?? undefined,
        subtitleFontSize:(s.subtitle_font_size as number) ?? undefined,
      }))

      setCarousel({
        tema:         (car as Record<string, unknown>).tema as string ?? '',
        template:     ((car as Record<string, unknown>).template_style as CarouselTemplate) ?? 'impacto',
        imageStyle:   'cinematic',
        hasWatermark: (car as Record<string, unknown>).has_watermark as boolean ?? false,
        slides,
      })
      setState('found')
    }

    load()
  }, [token])

  // ── Navegação ─────────────────────────────────────────────────
  const total = carousel?.slides.length ?? 0

  const prev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), [])
  const next = useCallback(() => setCurrent((c) => Math.min(total - 1, c + 1)), [total])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next])

  // ── Estados ───────────────────────────────────────────────────

  if (state === 'loading') {
    return (
      <div style={{
        minHeight: '100vh', background: BG,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
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
        <span style={{ fontFamily: ffd, fontSize: 22, color: M, letterSpacing: 1 }}>
          Carrossel não encontrado
        </span>
        <span style={{ fontFamily: ff, fontSize: 13, color: 'rgba(255,255,255,0.25)', textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
          Este link pode ter expirado ou o carrossel foi removido.
        </span>
        <a
          href="https://conteudos.tech"
          style={{
            marginTop: 8, fontFamily: ff, fontSize: 13, color: A,
            textDecoration: 'none', borderBottom: `1px solid rgba(200,255,0,0.3)`,
            paddingBottom: 2,
          }}
        >
          Criar meu carrossel
        </a>
      </div>
    )
  }

  const slide      = carousel.slides[current]
  const isFirst    = current === 0
  const isLast     = current === total - 1
  const slideH     = 440

  return (
    <div style={{
      minHeight: '100vh', background: BG,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: ff,
    }}>
      {/* Header */}
      <header style={{
        width: '100%', borderBottom: `1px solid ${B}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 56, flexShrink: 0,
      }}>
        <span style={{ fontFamily: ffd, fontSize: 20, color: T, letterSpacing: 1 }}>
          Conteúd<span style={{ color: A }}>OS</span>
        </span>
        <a
          href="https://conteudos.tech"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: ff, fontSize: 12, color: M,
            textDecoration: 'none', padding: '6px 14px',
            border: `1px solid ${B}`, borderRadius: 6,
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = T; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = M; e.currentTarget.style.borderColor = B }}
        >
          Criar o meu
        </a>
      </header>

      {/* Tema */}
      <div style={{ marginTop: 32, marginBottom: 24, textAlign: 'center', padding: '0 24px' }}>
        <p style={{ fontFamily: ffd, fontSize: 22, color: T, letterSpacing: 1, margin: 0 }}>
          {carousel.tema}
        </p>
        <p style={{ fontFamily: ff, fontSize: 12, color: M, margin: '4px 0 0' }}>
          {current + 1} / {total}
        </p>
      </div>

      {/* Slide + navegação */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '0 24px', width: '100%', maxWidth: 560,
        boxSizing: 'border-box',
      }}>
        {/* Botão anterior */}
        <button
          onClick={prev}
          disabled={isFirst}
          style={{
            flexShrink: 0, width: 40, height: 40, borderRadius: '50%',
            background: isFirst ? 'transparent' : S2,
            border: `1px solid ${isFirst ? 'transparent' : B}`,
            color: isFirst ? 'transparent' : T,
            cursor: isFirst ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { if (!isFirst) e.currentTarget.style.background = '#252525' }}
          onMouseLeave={(e) => { if (!isFirst) e.currentTarget.style.background = S2 }}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Slide */}
        <div style={{
          flex: 1,
          height: slideH,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          ...getSlideContainerStyle(slide, current, total, carousel.template, carousel.imageStyle, 1),
        }}>
          <SlideRenderer
            slide={slide}
            index={current}
            total={total}
            template={carousel.template}
            imageStyle={carousel.imageStyle}
            scale={1}
            hasWatermark={carousel.hasWatermark}
          />
        </div>

        {/* Botão próximo */}
        <button
          onClick={next}
          disabled={isLast}
          style={{
            flexShrink: 0, width: 40, height: 40, borderRadius: '50%',
            background: isLast ? 'transparent' : S2,
            border: `1px solid ${isLast ? 'transparent' : B}`,
            color: isLast ? 'transparent' : T,
            cursor: isLast ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { if (!isLast) e.currentTarget.style.background = '#252525' }}
          onMouseLeave={(e) => { if (!isLast) e.currentTarget.style.background = S2 }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Dots de navegação */}
      <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
        {carousel.slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: i === current ? 20 : 6,
              height: 6, borderRadius: 3,
              background: i === current ? A : B,
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'width 0.2s, background 0.2s',
            }}
          />
        ))}
      </div>

      {/* Instrução teclado */}
      <p style={{
        marginTop: 12, fontFamily: ff, fontSize: 11,
        color: 'rgba(255,255,255,0.2)',
      }}>
        Use as setas ← → para navegar
      </p>

      {/* CTA fundo */}
      <div style={{
        marginTop: 48, marginBottom: 48,
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
