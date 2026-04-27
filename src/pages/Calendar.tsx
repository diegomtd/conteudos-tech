import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Plus, Trash2, ExternalLink, X,
  Calendar as CalIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { usePlan } from '@/hooks/usePlan'

// ─── Tokens ───────────────────────────────────────────────────
const A   = '#C8FF00'
const BG  = '#050D14'
const S   = '#0A1E30'
const S2  = '#0F2538'
const T   = '#F5F5F5'
const M   = 'rgba(255,255,255,0.45)'
const B   = 'rgba(255,255,255,0.08)'
const ff  = 'DM Sans, sans-serif'
const ffd = '"Bebas Neue", sans-serif'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                 'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DOW = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

type PostStatus = 'pending' | 'notified' | 'posted'

interface ScheduledPost {
  id: string
  carousel_id: string | null
  scheduled_at: string
  notify_minutes_before: number
  status: PostStatus
  carousels: { tema: string; preview_token: string } | null
}

interface CarouselOption { id: string; tema: string }

// ─── Helpers ──────────────────────────────────────────────────
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function firstDow(y: number, m: number)    { return new Date(y, m, 1).getDay() }
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}
function fmtHHMM(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
function dayKey(d: Date) { return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` }

const STATUS_META: Record<PostStatus, { bg: string; color: string; label: string }> = {
  pending:  { bg: 'rgba(255,255,255,0.06)', color: M,         label: 'Pendente'   },
  notified: { bg: 'rgba(0,180,216,0.12)',   color: '#00B4D8', label: 'Notificado' },
  posted:   { bg: 'rgba(200,255,0,0.1)',    color: A,         label: 'Postado'    },
}

// ─── Upgrade overlay ──────────────────────────────────────────
function UpgradeOverlay({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 20,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(6px)', backgroundColor: 'rgba(5,13,20,0.85)',
    }}>
      <div style={{
        background: S, border: `1px solid rgba(200,255,0,0.2)`, borderRadius: 16,
        padding: '36px 40px', maxWidth: 360, textAlign: 'center',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <span style={{ fontSize: 34 }}>📅</span>
        <h2 style={{ fontFamily: ffd, fontSize: 26, color: T, margin: 0, letterSpacing: 1 }}>
          CALENDÁRIO DE POSTS
        </h2>
        <p style={{ fontFamily: ff, fontSize: 14, color: M, margin: 0, lineHeight: 1.7 }}>
          Disponível no plano Profissional. Agende posts, receba notificações no Telegram e organize sua semana de conteúdo.
        </p>
        <button
          onClick={onUpgrade}
          style={{
            background: A, border: 'none', borderRadius: 8, color: '#000',
            fontFamily: ffd, fontSize: 16, letterSpacing: 1,
            padding: '13px 0', cursor: 'pointer',
          }}
        >
          VER PLANO PROFISSIONAL →
        </button>
      </div>
    </div>
  )
}

// ─── Schedule modal ───────────────────────────────────────────
function ScheduleModal({
  onClose, onSaved, userId, initialDate,
}: {
  onClose: () => void
  onSaved: () => void
  userId: string
  initialDate: Date | null
}) {
  const [carousels, setCarousels] = useState<CarouselOption[]>([])
  const [carouselId, setCarouselId] = useState('')
  const [dateTime, setDateTime] = useState(() => {
    const d = initialDate ? new Date(initialDate) : new Date()
    d.setHours(19, 0, 0, 0)
    return d.toISOString().slice(0, 16)
  })
  const [notifyMin, setNotifyMin] = useState(10)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('carousels').select('id, tema')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setCarousels(data as CarouselOption[]) })
  }, [userId])

  const applyTime = (hhmm: string) => {
    const base = dateTime ? dateTime.slice(0, 10) : new Date().toISOString().slice(0, 10)
    setDateTime(`${base}T${hhmm}`)
  }

  const handleSave = async () => {
    if (!dateTime) { toast.error('Selecione uma data e hora'); return }
    setSaving(true)
    const { error } = await supabase.from('scheduled_posts').insert({
      user_id: userId,
      carousel_id: carouselId || null,
      scheduled_at: new Date(dateTime).toISOString(),
      notify_minutes_before: notifyMin,
      status: 'pending',
    })
    setSaving(false)
    if (error) { toast.error('Erro ao agendar'); return }
    toast.success('Post agendado')
    onSaved()
  }

  const inputSt: React.CSSProperties = {
    width: '100%', background: S2, border: `1px solid ${B}`,
    borderRadius: 7, color: T, fontFamily: ff, fontSize: 13,
    padding: '8px 12px', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: S, border: `1px solid ${B}`, borderRadius: 16, padding: '28px', width: 380, display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontFamily: ffd, fontSize: 22, color: T, margin: 0, letterSpacing: 1 }}>AGENDAR POST</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: M, cursor: 'pointer', padding: 4, display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, color: M, fontFamily: ff, marginBottom: 6 }}>Carrossel (opcional)</label>
          <select value={carouselId} onChange={(e) => setCarouselId(e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
            <option value="" style={{ background: S2 }}>Selecione um carrossel...</option>
            {carousels.map((c) => (
              <option key={c.id} value={c.id} style={{ background: S2 }}>{c.tema}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, color: M, fontFamily: ff, marginBottom: 6 }}>Data e hora</label>
          <input
            type="datetime-local" value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            style={{ ...inputSt, colorScheme: 'dark' }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(200,255,0,0.4)' }}
            onBlur={(e)  => { e.target.style.borderColor = B }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, color: M, fontFamily: ff, marginBottom: 6 }}>Horários sugeridos</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[{ label: 'Manhã', time: '08:00' }, { label: 'Tarde', time: '13:00' }, { label: 'Noite', time: '19:00' }].map(({ label, time }) => (
              <button key={time} onClick={() => applyTime(time)}
                style={{ flex: 1, height: 34, background: S2, border: `1px solid ${B}`, borderRadius: 7, color: M, fontFamily: ff, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(200,255,0,0.4)'; e.currentTarget.style.color = T }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = B; e.currentTarget.style.color = M }}
              >
                {label} {time}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, color: M, fontFamily: ff, marginBottom: 6 }}>Avisar com antecedência</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[5, 10, 15, 30, 60].map((min) => {
              const sel = notifyMin === min
              return (
                <button key={min} onClick={() => setNotifyMin(min)}
                  style={{ height: 30, padding: '0 12px', borderRadius: 6, background: sel ? 'rgba(200,255,0,0.1)' : 'transparent', border: `1px solid ${sel ? 'rgba(200,255,0,0.4)' : B}`, color: sel ? A : M, fontFamily: ff, fontSize: 12, cursor: 'pointer' }}>
                  {min} min
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={onClose}
            style={{ flex: 1, height: 42, background: 'none', border: `1px solid ${B}`, borderRadius: 8, color: M, fontFamily: ff, fontSize: 13, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving || !dateTime}
            style={{ flex: 2, height: 42, background: (!dateTime || saving) ? S2 : A, border: 'none', borderRadius: 8, color: (!dateTime || saving) ? M : '#000', fontFamily: ff, fontSize: 13, fontWeight: 700, cursor: (!dateTime || saving) ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Agendando...' : 'Confirmar agendamento'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────
export default function Calendar() {
  const navigate   = useNavigate()
  const { user }   = useAuth()
  const { plan }   = usePlan()
  const today      = new Date()

  const [viewYear,    setViewYear]    = useState(today.getFullYear())
  const [viewMonth,   setViewMonth]   = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<Date | null>(today)
  const [posts,       setPosts]       = useState<ScheduledPost[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showModal,   setShowModal]   = useState(false)

  const canAccess = plan === 'profissional' || plan === 'agencia'

  const fetchPosts = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const startOfMonth = new Date(viewYear, viewMonth, 1).toISOString()
    const endOfMonth   = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59).toISOString()
    const { data } = await supabase
      .from('scheduled_posts')
      .select('*, carousels(tema, preview_token)')
      .eq('user_id', user.id)
      .gte('scheduled_at', startOfMonth)
      .lte('scheduled_at', endOfMonth)
      .order('scheduled_at', { ascending: true })
    if (data) setPosts(data as unknown as ScheduledPost[])
    setLoading(false)
  }, [user, viewYear, viewMonth])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const daysWithPosts = new Set(posts.map((p) => dayKey(new Date(p.scheduled_at))))

  const selectedPosts = selectedDay
    ? posts.filter((p) => sameDay(new Date(p.scheduled_at), selectedDay))
    : posts

  const deletePost = async (id: string) => {
    if (!confirm('Remover este agendamento?')) return
    const { error } = await supabase.from('scheduled_posts').delete().eq('id', id)
    if (error) { toast.error('Erro ao remover'); return }
    toast.success('Agendamento removido')
    fetchPosts()
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }

  const fd       = firstDow(viewYear, viewMonth)
  const dim      = daysInMonth(viewYear, viewMonth)
  const cells: (number | null)[] = [
    ...Array(fd).fill(null),
    ...Array.from({ length: dim }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: BG, overflow: 'hidden', position: 'relative' }}>
      {!canAccess && <UpgradeOverlay onUpgrade={() => navigate('/settings')} />}

      {/* ── Sidebar ── */}
      <div style={{ width: 280, flexShrink: 0, background: S, borderRight: `1px solid ${B}`, display: 'flex', flexDirection: 'column' }}>
        {/* Back */}
        <div style={{ padding: '18px 16px 0' }}>
          <button onClick={() => navigate('/dashboard')}
            style={{ background: 'none', border: 'none', color: M, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: ff, fontSize: 12, padding: 0 }}>
            <ChevronLeft size={14} /> Dashboard
          </button>
        </div>

        {/* Month header */}
        <div style={{ padding: '14px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: ffd, fontSize: 15, color: T, letterSpacing: 1 }}>
            {MONTHS[viewMonth].toUpperCase()} {viewYear}
          </span>
          <div style={{ display: 'flex', gap: 2 }}>
            {([prevMonth, nextMonth] as const).map((fn, i) => (
              <button key={i} onClick={fn}
                style={{ width: 26, height: 26, background: 'none', border: `1px solid ${B}`, borderRadius: 6, color: M, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {i === 0 ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
              </button>
            ))}
          </div>
        </div>

        {/* DOW header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', padding: '0 8px' }}>
          {DOW.map((d) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 9, color: M, fontFamily: ff, fontWeight: 700, letterSpacing: 0.5, padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', padding: '0 6px', gap: '2px 0' }}>
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />
            const cellDate  = new Date(viewYear, viewMonth, day)
            const isToday   = sameDay(cellDate, today)
            const isSel     = selectedDay ? sameDay(cellDate, selectedDay) : false
            const hasPost   = daysWithPosts.has(dayKey(cellDate))
            return (
              <button key={i} onClick={() => setSelectedDay(isSel ? null : cellDate)}
                style={{ width: '100%', aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: isSel ? 'rgba(200,255,0,0.15)' : 'none', border: 'none', borderRadius: 6, cursor: 'pointer', gap: 2 }}>
                <span style={{ fontFamily: ff, fontSize: 12, lineHeight: 1, color: isToday ? '#000' : isSel ? A : T, background: isToday ? A : 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: isToday ? 700 : 400 }}>
                  {day}
                </span>
                {hasPost && <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: A, flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>

        <div style={{ padding: '14px 16px', borderTop: `1px solid ${B}`, marginTop: 'auto' }}>
          <button onClick={() => setShowModal(true)}
            style={{ width: '100%', height: 38, background: 'rgba(200,255,0,0.1)', border: `1px solid rgba(200,255,0,0.3)`, borderRadius: 8, color: A, fontFamily: ff, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Plus size={14} /> Agendar post
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 28px', borderBottom: `1px solid ${B}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: ffd, fontSize: 28, color: T, margin: 0, letterSpacing: 1 }}>
              {selectedDay
                ? selectedDay.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
                : `${MONTHS[viewMonth]} ${viewYear}`}
            </h1>
            <p style={{ fontFamily: ff, fontSize: 13, color: M, margin: '4px 0 0' }}>
              {selectedPosts.length} post{selectedPosts.length !== 1 ? 's' : ''} agendado{selectedPosts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ height: 38, padding: '0 18px', background: A, border: 'none', borderRadius: 8, color: '#000', fontFamily: ff, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Agendar
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
              <span style={{ fontFamily: ff, fontSize: 14, color: M }}>Carregando...</span>
            </div>
          ) : selectedPosts.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <CalIcon size={36} color={M} style={{ margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontFamily: ff, fontSize: 14, color: M, margin: '0 0 6px' }}>
                  {selectedDay ? 'Nenhum post agendado para este dia.' : 'Nenhum post agendado neste mês.'}
                </p>
                <p style={{ fontFamily: ff, fontSize: 12, color: 'rgba(255,255,255,0.2)', margin: 0 }}>
                  Use os horários sugeridos abaixo ou clique em Agendar
                </p>
              </div>

              {selectedDay && (
                <div>
                  <p style={{ fontFamily: ff, fontSize: 11, color: M, marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 700 }}>
                    Melhores horários para {DOW[selectedDay.getDay()]}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Manhã',  time: '08:00', desc: 'Ideal para conteúdo educativo' },
                      { label: 'Tarde',  time: '13:00', desc: 'Pico de engajamento' },
                      { label: 'Noite',  time: '19:00', desc: 'Audiência mais disponível' },
                    ].map(({ label, time, desc }) => (
                      <button key={time} onClick={() => setShowModal(true)}
                        style={{ height: 60, background: S, border: `1px solid ${B}`, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 14, transition: 'border-color 0.15s', textAlign: 'left', width: '100%' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(200,255,0,0.3)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = B }}>
                        <span style={{ fontFamily: ffd, fontSize: 18, color: A, letterSpacing: 1, minWidth: 58 }}>{time}</span>
                        <div>
                          <p style={{ fontFamily: ff, fontSize: 13, color: T, margin: 0, fontWeight: 600 }}>{label}</p>
                          <p style={{ fontFamily: ff, fontSize: 11, color: M, margin: 0 }}>{desc}</p>
                        </div>
                        <Plus size={14} color={M} style={{ marginLeft: 'auto', flexShrink: 0 }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            selectedPosts.map((post) => {
              const meta  = STATUS_META[post.status] ?? STATUS_META.pending
              const tema  = post.carousels?.tema ?? 'Sem tema'
              const token = post.carousels?.preview_token
              return (
                <div key={post.id}
                  style={{ background: S, border: `1px solid ${B}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color 0.15s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.15)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = B }}
                >
                  <span style={{ fontFamily: ffd, fontSize: 22, color: A, letterSpacing: 1, minWidth: 52 }}>
                    {fmtHHMM(post.scheduled_at)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: ff, fontSize: 14, color: T, margin: '0 0 3px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tema}</p>
                    <p style={{ fontFamily: ff, fontSize: 11, color: M, margin: 0 }}>
                      {new Date(post.scheduled_at).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {' · '}{post.notify_minutes_before} min antes
                    </p>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 99, background: meta.bg, color: meta.color, fontFamily: ff, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {meta.label}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {token && (
                      <button
                        onClick={() => window.open(`/preview/${token}`, '_blank')}
                        title="Ver preview"
                        style={{ width: 32, height: 32, background: 'none', border: `1px solid ${B}`, borderRadius: 6, color: M, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = T }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = B; e.currentTarget.style.color = M }}
                      >
                        <ExternalLink size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => deletePost(post.id)}
                      title="Remover"
                      style={{ width: 32, height: 32, background: 'none', border: `1px solid rgba(248,113,113,0.3)`, borderRadius: 6, color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f87171' }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && user && (
          <ScheduleModal
            onClose={() => setShowModal(false)}
            onSaved={() => { setShowModal(false); fetchPosts() }}
            userId={user.id}
            initialDate={selectedDay}
          />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
