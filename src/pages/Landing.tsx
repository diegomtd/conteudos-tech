import { useNavigate } from 'react-router-dom'

const ACCENT = '#C8FF00'
const TEXT_MUTED = 'rgba(255,255,255,0.45)'
const BORDER_ACCENT = 'rgba(200,255,0,0.25)'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#080808',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      gap: 48,
    }}>
      {/* Hero */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 'clamp(56px, 10vw, 96px)',
          lineHeight: 1,
          margin: '0 0 16px',
          letterSpacing: 3,
        }}>
          <span style={{ color: '#F5F5F5' }}>Conteúd</span>
          <span style={{ color: ACCENT }}>OS</span>
        </h1>
        <p style={{
          color: TEXT_MUTED,
          fontSize: 18,
          fontFamily: 'DM Sans, sans-serif',
          margin: '0 0 32px',
          maxWidth: 480,
        }}>
          Laboratório de viralidade com IA. Cole um conteúdo que viralizou — a IA decodifica os hacks e recria com a sua voz.
        </p>
        <button
          onClick={() => navigate('/auth')}
          style={{
            backgroundColor: ACCENT,
            color: '#000',
            border: 'none',
            borderRadius: 8,
            padding: '14px 32px',
            fontSize: 16,
            fontWeight: 700,
            fontFamily: 'DM Sans, sans-serif',
            cursor: 'pointer',
            letterSpacing: 0.3,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ADDF00' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ACCENT }}
        >
          Começar grátis
        </button>
      </div>

      {/* Card de exemplo */}
      <div style={{
        backgroundColor: '#0F0F0F',
        border: `1px solid ${BORDER_ACCENT}`,
        borderRadius: 16,
        padding: '28px 32px',
        maxWidth: 440,
        width: '100%',
      }}>
        <div style={{
          fontSize: 11,
          fontFamily: 'DM Sans, sans-serif',
          color: ACCENT,
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginBottom: 12,
          fontWeight: 600,
        }}>
          Curiosity Gap detectado
        </div>
        <p style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 28,
          color: '#F5F5F5',
          margin: '0 0 12px',
          lineHeight: 1.2,
          letterSpacing: 1,
        }}>
          O algoritmo não favorece quem posta mais. Favorece quem para o scroll.
        </p>
        <p style={{
          color: TEXT_MUTED,
          fontSize: 14,
          fontFamily: 'DM Sans, sans-serif',
          margin: 0,
          lineHeight: 1.6,
        }}>
          7 slides gerados com IA — identidade visual sua, hacks de viralidade aplicados.
        </p>
      </div>
    </div>
  )
}
