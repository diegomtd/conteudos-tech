import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'

type Mode = 'login' | 'signup' | 'forgot'

const ACCENT = '#C8FF00'
const ACCENT_HOVER = '#ADDF00'
const BG = '#080808'
const SURFACE = '#0F0F0F'
const BORDER_ACCENT = 'rgba(200,255,0,0.2)'
const BORDER_INPUT = 'rgba(200,255,0,0.25)'
const TEXT_MUTED = 'rgba(255,255,255,0.45)'

const inputBase: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#1A1A1A',
  border: `1px solid ${BORDER_INPUT}`,
  borderRadius: 8,
  padding: '11px 14px',
  color: '#F5F5F5',
  fontSize: 14,
  fontFamily: 'DM Sans, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: TEXT_MUTED,
  fontSize: 13,
  marginBottom: 6,
  fontFamily: 'DM Sans, sans-serif',
}

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>{label}</label>
      <input
        {...props}
        style={{ ...inputBase, borderColor: focused ? ACCENT : BORDER_INPUT }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  )
}

function PrimaryButton({ busy, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      {...props}
      disabled={busy}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: hovered && !busy ? ACCENT_HOVER : ACCENT,
        color: '#000000',
        border: 'none',
        borderRadius: 8,
        height: 44,
        fontSize: 15,
        fontWeight: 700,
        fontFamily: 'DM Sans, sans-serif',
        cursor: busy ? 'not-allowed' : 'pointer',
        opacity: busy ? 0.65 : 1,
        transition: 'background-color 0.2s, opacity 0.2s',
        width: '100%',
        letterSpacing: 0.3,
      }}
    >
      {busy ? 'Aguarde...' : children}
    </button>
  )
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
    e.preventDefault(); reset(); setBusy(true)
    try { await signIn(email, password) }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao entrar') }
    finally { setBusy(false) }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault(); reset(); setBusy(true)
    try {
      await signUp(email, password, name)
      setSuccess('Verifique seu email para confirmar a conta')
    }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao criar conta') }
    finally { setBusy(false) }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault(); reset(); setBusy(true)
    try {
      await resetPassword(email)
      setSuccess('Link de recuperação enviado para seu email')
    }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao enviar email') }
    finally { setBusy(false) }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: BG,
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
          backgroundColor: SURFACE,
          border: `1px solid ${BORDER_ACCENT}`,
          borderRadius: 16,
          padding: 40,
          width: '100%',
          maxWidth: 400,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 40, color: '#F5F5F5', letterSpacing: 2 }}>
            Conteúd
          </span>
          <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 40, color: ACCENT, letterSpacing: 2 }}>
            OS
          </span>
        </div>

        {/* Subtítulo */}
        <p style={{
          textAlign: 'center',
          color: TEXT_MUTED,
          fontSize: 14,
          fontFamily: 'DM Sans, sans-serif',
          margin: '0 0 28px',
        }}>
          Laboratório de viralidade com IA
        </p>

        {/* Toggle */}
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
                  color: mode === m ? '#F5F5F5' : TEXT_MUTED,
                  paddingBottom: 10,
                  borderBottom: mode === m ? `2px solid ${ACCENT}` : '2px solid transparent',
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
          {/* LOGIN */}
          {mode === 'login' && (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
              onSubmit={handleLogin}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <Field label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              <Field label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />

              <div style={{ textAlign: 'right', marginTop: -8 }}>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); reset() }}
                  style={{ background: 'none', border: 'none', color: ACCENT, fontSize: 13, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', padding: 0 }}
                >
                  Esqueci minha senha
                </button>
              </div>

              {error && <p style={{ color: '#f87171', fontSize: 13, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>{error}</p>}
              <PrimaryButton busy={busy}>Entrar</PrimaryButton>
            </motion.form>
          )}

          {/* CADASTRO */}
          {mode === 'signup' && (
            <motion.form
              key="signup"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              onSubmit={handleSignup}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <Field label="Nome completo" type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
              <Field label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              <Field label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />

              {error && <p style={{ color: '#f87171', fontSize: 13, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>{error}</p>}
              {success && <p style={{ color: ACCENT, fontSize: 13, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>{success}</p>}
              <PrimaryButton busy={busy}>Criar conta gratuita</PrimaryButton>
            </motion.form>
          )}

          {/* ESQUECI SENHA */}
          {mode === 'forgot' && (
            <motion.form
              key="forgot"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              onSubmit={handleForgot}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <p style={{ color: TEXT_MUTED, fontSize: 14, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                Informe seu email e enviaremos um link para redefinir sua senha.
              </p>
              <Field label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />

              {error && <p style={{ color: '#f87171', fontSize: 13, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>{error}</p>}
              {success && <p style={{ color: ACCENT, fontSize: 13, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>{success}</p>}
              <PrimaryButton busy={busy}>Enviar link de recuperação</PrimaryButton>

              <button
                type="button"
                onClick={() => { setMode('login'); reset() }}
                style={{ background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 13, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', textAlign: 'center' }}
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
