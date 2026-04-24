import { motion } from 'framer-motion'
import { CSSProperties, ReactNode } from 'react'

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  accentColor?: string
}

export function FeatureCard({
  icon,
  title,
  description,
  accentColor = '#C8FF00',
}: FeatureCardProps) {
  const cardStyle: CSSProperties = {
    background: '#0F0F0F',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    cursor: 'default',
  }

  const iconWrapperStyle: CSSProperties = {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    background: `${accentColor}14`,
    color: accentColor,
    flexShrink: 0,
  }

  const titleStyle: CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontWeight: 700,
    fontSize: '16px',
    color: '#F5F5F5',
    lineHeight: 1.2,
    margin: 0,
  }

  const descStyle: CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontWeight: 400,
    fontSize: '14px',
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 1.6,
    margin: 0,
  }

  return (
    <motion.div
      style={cardStyle}
      whileHover={{
        y: -4,
        boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
        borderColor: 'rgba(255,255,255,0.14)',
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div style={iconWrapperStyle}>{icon}</div>
      <div>
        <p style={titleStyle}>{title}</p>
        <p style={{ ...descStyle, marginTop: '8px' }}>{description}</p>
      </div>
    </motion.div>
  )
}
