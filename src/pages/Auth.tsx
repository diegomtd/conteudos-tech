import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'

type Mode = 'login' | 'signup' | 'forgot'

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#050D14',
  border: '1px solid rgba(0,180,216,0.3)',
  borderRadius: 8,
  padding: '11px 14px',
  color: 'white',
  fontSize: 14,
  fontFamily: 'DM Sans, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: 'rgba(255,255,255,0.6)',
  fontSize: 13,
  marginBottom: 6,
  fontFamily: 'DM Sans, sans-serif',
}

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
}

export default function Auth() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const reset = () => { setError(''); setSuccess('') }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    reset()
    setBusy(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar')
    } finally {
      setBusy(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    reset()
    setBusy(true)
    try {
      await signUp(email, password, name)
      setSuccess('Verifique seu email para confirmar a conta')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta')
    } finally {
      setBusy(false)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    reset()
    setBusy(true)
    try {
      await resetPassword(email)
      setSuccess('Link de recuperação enviado para seu email')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar email')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#050D14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          backgroundColor: '#0A1E30',
          border: '1px solid rgba(0,180,216,0.2)',
          borderRadius: 16,
          padding: 40,
          width: '100%',
          maxWidth: 400,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <span style={{
            fontFamily: '"Bebas Neue", cursive',
            fontSize: 36,
            color: 'white',
            letterSpacing: 2,
          }}>
            Conteúd
          </span>
          <span style={{
            fontFamily: '"Bebas Neue", cursive',
            fontSize: 36,
            color: '#00B4D8',
            letterSpacing: 2,
          }}>
            OS
          </span>
        </div>

        {/* Subtítulo */}
        <p style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.5)',
          fontSize: 14,
          fontFamily: 'DM Sans, sans-serif',
          margin: '0 0 28px',
        }}>
          Laboratório de viralidade com IA
        </p>

        {/* Toggle login / cadastro */}
        {mode !== 'forgot' && (
          <div style={{
            display: 'flex',
            gap: 24,
            marginBottom: 28,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); reset() }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 14,
                  fontWeight: mode === m ? 600 : 400,
                  color: mode === m ? 'white' : 'rgba(255,255,255,0.4)',
                  paddingBottom: 10,
                  borderBottom: mode === m ? '2px solid #00B4D8' : '2px solid transparent',
                  marginBottom: -1,
                  transition: 'all 0.2s',
                }}
              >
                {m === 'login' ? 'Login' : 'Cadastro'}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* — LOGIN — */}
          {mode === 'login' && (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleLogin}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div style={fieldStyle}>
                <label style={labelStyle}>E-mail</label>
                <input
                  style={inputStyle}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Senha</label>
                <input
                  style={inputStyle}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <div style={{ textAlign: 'right', marginTop: -8 }}>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); reset() }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#00B4D8',
                    fontSize: 13,
                    fontFamily: 'DM Sans, sans-serif',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Esqueci minha senha
                </button>
              </div>

              {error && <p style={{ color: '#f87171', fontSize: 13, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>{error}</p>}

              <button
                type="submit"
                disabled={busy}
                style={{
                  backgroundColor: '#00B4D8',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  height: 44,
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: 'DM Sans, sans-serif',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  opacity: busy ? 0.7 : 1,
                  transition: 'background-color 0.2s, opacity 0.2s',
                  width: '100%',
                }}
                onMouseEnter={(e) => { if (!busy) e.currentTarget.style.backgroundColor = '#0077A8' }}
                onMouseLeave={(e) => { if (!busy) e.currentTarget.style.backgroundColor = '#00B4D8' }}
              >
                {busy ? 'Aguarde...' : 'Entrar'}
              </button>
            </motion.form>
          )}

          {/* — CADASTRO — */}
          {mode === 'signup' && (
            <motion.form
              key="signup"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSignup}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div style={fieldStyle}>
                <label style={labelStyle}>Nome completo</label>
                <input
                  style={inputStyle}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>E-mail</label>
                <input
                  style={inputStyle}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Senha</label>
                <input
                  style={inputStyle}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              {error && <p style={{ color: '#f87171', fontSize: 13, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>{error}</p>}
              {success && <p style={{ color: '#34d399', fontSize: 13, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>{success}</p>}

              <button
                type="submit"
                disabled={busy}
                style={{
                  backgroundColor: '#00B4D8',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  height: 44,
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: 'DM Sans, sans-serif',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  opacity: busy ? 0.7 : 1,
                  transition: 'background-color 0.2s, opacity 0.2s',
                  width: '100%',
                }}
                onMouseEnter={(e) => { if (!busy) e.currentTarget.style.backgroundColor = '#0077A8' }}
                onMouseLeave={(e) => { if (!busy) e.currentTarget.style.backgroundColor = '#00B4D8' }}
              >
                {busy ? 'Aguarde...' : 'Criar conta gratuita'}
              </button>
            </motion.form>
          )}

          {/* — ESQUECI SENHA — */}
          {mode === 'forgot' && (
            <motion.form
              key="forgot"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleForgot}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                Informe seu email e enviaremos um link para redefinir sua senha.
              </p>
              <div style={fieldStyle}>
                <label style={labelStyle}>E-mail</label>
                <input
                  style={inputStyle}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              {error && <p style={{ color: '#f87171', fontSize: 13, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>{error}</p>}
              {success && <p style={{ color: '#34d399', fontSize: 13, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>{success}</p>}

              <button
                type="submit"
                disabled={busy}
                style={{
                  backgroundColor: '#00B4D8',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  height: 44,
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: 'DM Sans, sans-serif',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  opacity: busy ? 0.7 : 1,
                  transition: 'background-color 0.2s, opacity 0.2s',
                  width: '100%',
                }}
                onMouseEnter={(e) => { if (!busy) e.currentTarget.style.backgroundColor = '#0077A8' }}
                onMouseLeave={(e) => { if (!busy) e.currentTarget.style.backgroundColor = '#00B4D8' }}
              >
                {busy ? 'Aguarde...' : 'Enviar link de recuperação'}
              </button>

              <button
                type="button"
                onClick={() => { setMode('login'); reset() }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: 13,
                  fontFamily: 'DM Sans, sans-serif',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Voltar para o login
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
