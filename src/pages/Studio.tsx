import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

const A = '#C8FF00'
const BG = '#080808'
const S = '#0F0F0F'
const S2 = '#1A1A1A'
const T = '#F5F5F5'
const M = 'rgba(255,255,255,0.45)'
const B = 'rgba(255,255,255,0.08)'
const ff = 'DM Sans, sans-serif'

export default function Studio() {
  const [searchParams] = useSearchParams()
  const temaFromURL = searchParams.get('tema') ?? ''
  const clienteId = searchParams.get('cliente')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      // Move cursor to end
      const len = inputRef.current.value.length
      inputRef.current.setSelectionRange(len, len)
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{
        backgroundColor: S, border: '1px solid rgba(200,255,0,0.15)', borderRadius: 20,
        padding: '40px 44px', width: '100%', maxWidth: 560,
      }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 28, color: A, letterSpacing: 1.5 }}>
              {clienteId ? 'STUDIO DO CLIENTE' : 'STUDIO'}
            </span>
            {clienteId && (
              <span style={{ fontSize: 11, color: A, fontFamily: ff, fontWeight: 600, backgroundColor: 'rgba(200,255,0,0.1)', padding: '3px 8px', borderRadius: 99, letterSpacing: 0.5 }}>
                AGÊNCIA
              </span>
            )}
          </div>
          <p style={{ color: M, fontSize: 14, fontFamily: ff, margin: 0 }}>
            Sobre o que é esse carrossel?
          </p>
        </div>

        {/* Topic input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          <label style={{ color: M, fontSize: 13, fontFamily: ff, fontWeight: 500 }}>
            Tema do carrossel
          </label>
          <input
            ref={inputRef}
            defaultValue={temaFromURL}
            placeholder="Ex: por que a maioria das pessoas nunca para de procrastinar"
            style={{
              width: '100%', backgroundColor: S2, border: `1px solid ${B}`,
              borderRadius: 10, padding: '14px 16px', color: T, fontSize: 15,
              fontFamily: ff, outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => { e.target.style.borderColor = A }}
            onBlur={(e) => { e.target.style.borderColor = B }}
          />
        </div>

        {/* Placeholder CTA */}
        <div style={{ backgroundColor: S2, border: `1px solid ${B}`, borderRadius: 12, padding: '20px 24px', textAlign: 'center' }}>
          <p style={{ color: M, fontSize: 13, fontFamily: ff, margin: '0 0 16px', lineHeight: 1.6 }}>
            O Studio completo chega na Fase 5 — geração de copy com Claude + editor visual de slides.
            {temaFromURL && (
              <><br /><br />
                <span style={{ color: T }}>Tema recebido: </span>
                <span style={{ color: A, fontWeight: 600 }}>"{temaFromURL}"</span>
              </>
            )}
          </p>
          <button style={{
            backgroundColor: A, color: '#000', border: 'none', borderRadius: 8,
            padding: '11px 24px', fontSize: 14, fontWeight: 700, fontFamily: ff,
            cursor: 'not-allowed', opacity: 0.5,
          }}>
            Gerar carrossel com IA →
          </button>
        </div>
      </div>
    </div>
  )
}
