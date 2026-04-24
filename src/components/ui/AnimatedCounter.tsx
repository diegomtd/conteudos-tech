import { useEffect, useRef, useState } from 'react'

interface AnimatedCounterProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
}

function cubicEaseOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function AnimatedCounter({
  value,
  duration = 800,
  prefix = '',
  suffix = '',
  decimals = 0,
}: AnimatedCounterProps) {
  const [current, setCurrent] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const startValueRef = useRef(0)

  useEffect(() => {
    startValueRef.current = current
    startTimeRef.current = null

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
    }

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = cubicEaseOut(progress)
      const next = startValueRef.current + (value - startValueRef.current) * eased

      setCurrent(next)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setCurrent(value)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [value, duration])

  const formatted = current.toFixed(decimals)

  return (
    <span>
      {prefix}{formatted}{suffix}
    </span>
  )
}
