import { motion } from 'framer-motion'
import { CSSProperties, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'accent'
type Size = 'sm' | 'md' | 'lg'

interface GlowButtonProps {
  variant?: Variant
  size?: Size
  children: ReactNode
  onClick?: () => void
  href?: string
  disabled?: boolean
  fullWidth?: boolean
}

const variantStyles: Record<Variant, CSSProperties & { '--glow': string }> = {
  primary: {
    background: '#C8FF00',
    color: '#000000',
    border: 'none',
    '--glow': '0 0 20px rgba(200,255,0,0.45)',
  },
  secondary: {
    background: 'transparent',
    color: '#F5F5F5',
    border: '1px solid rgba(255,255,255,0.15)',
    '--glow': '0 0 20px rgba(255,255,255,0.12)',
  },
  accent: {
    background: 'transparent',
    color: '#C8FF00',
    border: '1px solid rgba(200,255,0,0.4)',
    '--glow': '0 0 20px rgba(200,255,0,0.3)',
  },
}

const sizeStyles: Record<Size, CSSProperties> = {
  sm: { height: '36px', padding: '0 16px', fontSize: '13px' },
  md: { height: '44px', padding: '0 24px', fontSize: '14px' },
  lg: { height: '52px', padding: '0 32px', fontSize: '16px' },
}

export function GlowButton({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  href,
  disabled = false,
  fullWidth = false,
}: GlowButtonProps) {
  const { '--glow': glowColor, ...variantStyle } = variantStyles[variant]
  const sizeStyle = sizeStyles[size]

  const baseStyle: CSSProperties = {
    ...variantStyle,
    ...sizeStyle,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '8px',
    fontFamily: 'DM Sans, sans-serif',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    width: fullWidth ? '100%' : undefined,
    boxSizing: 'border-box',
    outline: 'none',
    position: 'relative',
    letterSpacing: '0.3px',
    transition: 'opacity 150ms ease-out',
  }

  const hoverAnimation = disabled
    ? {}
    : {
        scale: 1,
        boxShadow: glowColor as string,
        y: -2,
      }

  const tapAnimation = disabled ? {} : { scale: 0.97 }

  const content = (
    <motion.button
      style={baseStyle}
      whileHover={hoverAnimation}
      whileTap={tapAnimation}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  )

  if (href && !disabled) {
    const isExternal = href.startsWith('http')
    return (
      <motion.a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        style={{ ...baseStyle, display: 'inline-flex' }}
        whileHover={hoverAnimation}
        whileTap={tapAnimation}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        {children}
      </motion.a>
    )
  }

  return content
}
