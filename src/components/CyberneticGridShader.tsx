// @ts-nocheck
import { useEffect, useRef } from 'react'

export function CyberneticGridShader() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let animId: number
    let t = 0

    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'width:100%;height:100%;display:block'
    el.appendChild(canvas)
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width = el.clientWidth
      canvas.height = el.clientHeight
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    let mx = canvas.width / 2, my = canvas.height / 2
    const onMouse = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      mx = e.clientX - r.left
      my = e.clientY - r.top
    }
    el.addEventListener('mousemove', onMouse)

    const draw = () => {
      t += 0.008
      const w = canvas.width, h = canvas.height
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#010816'
      ctx.fillRect(0, 0, w, h)

      const gridSize = 48
      const cols = Math.ceil(w / gridSize) + 1
      const rows = Math.ceil(h / gridSize) + 1

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * gridSize
          const y = j * gridSize
          const dx = x - mx, dy = y - my
          const dist = Math.sqrt(dx * dx + dy * dy)
          const warp = Math.sin(dist * 0.05 - t * 4) * (30 / (1 + dist * 0.02))
          const wx = x + (dx / (dist + 1)) * warp
          const wy = y + (dy / (dist + 1)) * warp

          const pulse = 0.3 + Math.sin(t * 2 + i * 0.5 + j * 0.3) * 0.15
          const isIndigo = (i + j) % 5 === 0
          const alpha = Math.max(0, pulse - dist * 0.001)

          ctx.beginPath()
          ctx.arc(wx, wy, 1.2, 0, Math.PI * 2)
          ctx.fillStyle = isIndigo
            ? `rgba(99,102,241,${alpha})`
            : `rgba(0,212,255,${alpha})`
          ctx.fill()
        }
      }

      for (let j = 0; j < rows; j++) {
        const y = j * gridSize
        const alpha = 0.04 + Math.sin(t + j * 0.4) * 0.02
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.strokeStyle = `rgba(0,212,255,${alpha})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      for (let i = 0; i < cols; i++) {
        const x = i * gridSize
        const alpha = 0.04 + Math.sin(t + i * 0.4) * 0.02
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.strokeStyle = `rgba(0,212,255,${alpha})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      const grad = ctx.createRadialGradient(mx, my, 0, mx, my, 120)
      grad.addColorStop(0, 'rgba(0,212,255,0.08)')
      grad.addColorStop(1, 'rgba(0,212,255,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
      el.removeEventListener('mousemove', onMouse)
      canvas.remove()
    }
  }, [])

  return <div ref={ref} style={{ width: '100%', height: '100%', minHeight: '320px' }} />
}
