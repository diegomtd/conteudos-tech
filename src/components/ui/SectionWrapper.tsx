import { CSSProperties, ReactNode } from 'react'

type Background = 'dark' | 'darker' | 'surface'

interface SectionWrapperProps {
  id?: string
  background?: Background
  children: ReactNode
  paddingY?: number
}

const backgroundValues: Record<Background, string> = {
  dark: '#080808',
  darker: '#050D14',
  surface: '#0A0A0A',
}

export function SectionWrapper({
  id,
  background = 'dark',
  children,
  paddingY = 96,
}: SectionWrapperProps) {
  const sectionStyle: CSSProperties = {
    width: '100%',
    backgroundColor: backgroundValues[background],
    paddingTop: `${paddingY}px`,
    paddingBottom: `${paddingY}px`,
  }

  const innerStyle: CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    paddingLeft: '24px',
    paddingRight: '24px',
    width: '100%',
    boxSizing: 'border-box',
  }

  return (
    <section id={id} style={sectionStyle}>
      <div style={innerStyle}>{children}</div>
    </section>
  )
}
