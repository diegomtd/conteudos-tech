import { AnimatePresence, motion } from 'framer-motion'
import { CSSProperties, useState } from 'react'

interface AccordionItem {
  id: string
  question: string
  answer: string
}

interface AccordionProps {
  items: AccordionItem[]
  allowMultiple?: boolean
}

interface AccordionRowProps {
  item: AccordionItem
  isOpen: boolean
  onToggle: () => void
  isLast: boolean
}

function AccordionRow({ item, isOpen, onToggle, isLast }: AccordionRowProps) {
  const rowStyle: CSSProperties = {
    borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.08)',
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '24px 0',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    width: '100%',
    textAlign: 'left',
  }

  const questionStyle: CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontWeight: 600,
    fontSize: '15px',
    color: '#F5F5F5',
    lineHeight: 1.4,
  }

  const iconStyle: CSSProperties = {
    flexShrink: 0,
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: isOpen ? '#C8FF00' : 'rgba(255,255,255,0.45)',
    fontSize: '20px',
    lineHeight: 1,
    fontWeight: 300,
    transition: 'color 150ms ease-out',
  }

  const answerStyle: CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 1.7,
    paddingBottom: '24px',
  }

  return (
    <div style={rowStyle}>
      <button style={headerStyle} onClick={onToggle} aria-expanded={isOpen}>
        <span style={questionStyle}>{item.question}</span>
        <motion.span
          style={iconStyle}
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          +
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <p style={answerStyle}>{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Accordion({ items, allowMultiple = false }: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (!allowMultiple) next.clear()
        next.add(id)
      }
      return next
    })
  }

  const containerStyle: CSSProperties = {
    width: '100%',
  }

  return (
    <div style={containerStyle}>
      {items.map((item, index) => (
        <AccordionRow
          key={item.id}
          item={item}
          isOpen={openIds.has(item.id)}
          onToggle={() => toggle(item.id)}
          isLast={index === items.length - 1}
        />
      ))}
    </div>
  )
}
