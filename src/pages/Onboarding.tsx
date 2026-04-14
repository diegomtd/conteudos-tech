import { useNavigate } from 'react-router-dom'

export default function Onboarding() {
  const navigate = useNavigate()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#050D14',
      gap: 24,
    }}>
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, fontFamily: 'DM Sans, sans-serif' }}>
        Onboarding em construção
      </span>
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          backgroundColor: '#00B4D8',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          padding: '12px 24px',
          fontSize: 15,
          fontFamily: 'DM Sans, sans-serif',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Ir para o Dashboard
      </button>
    </div>
  )
}
