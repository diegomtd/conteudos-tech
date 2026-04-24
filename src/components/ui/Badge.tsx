import { CSSProperties, ReactNode } from 'react'

type BadgeVariant = 'default' | 'accent' | 'cyan' | 'hot'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  children: ReactNode
}

const variantStyles: Record<BadgeVariant, CSSProperties> = {
  default: {
    background: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.75)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  accent: {
    background: 'rgba(200,255,0,0.1)',
    color: '#C8FF00',
    border: '1px solid rgba(200,255,0,0.25)',
  },
  cyan: {
    background: 'rgba(0,180,216,0.1)',
    color: '#00B4D8',
    border: '1px solid rgba(0,180,216,0.25)',
  },
  hot: {
    background: 'rgba(255,107,43,0.1)',
    color: '#FF6B2B',
    border: '1px solid rgba(255,107,43,0.25)',
  },
}

const sizeStyles: Record<BadgeSize, CSSProperties> = {
  sm: { padding: '2px 8px', fontSize: '11px' },
  md: { padding: '4px 12px', fontSize: '12px' },
}

export function Badge({ variant = 'default', size = 'md', children }: BadgeProps) {
  const style: CSSProperties = {
    ...variantStyles[variant],
    ...sizeStyles[size],
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '99px',
    fontFamily: 'DM Sans, sans-serif',
    fontWeight: 600,
    letterSpacing: '0.5px',
    lineHeight: 1.6,
    whiteSpace: 'nowrap',
  }

  return <span style={style}>{children}</span>
}
