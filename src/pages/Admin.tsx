import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, DollarSign, Settings, Server,
  LogOut, ChevronLeft, ChevronRight, X, RefreshCw, Check,
  AlertCircle, Loader2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Design tokens ────────────────────────────────────────────────
const A   = '#00D4FF'
const BG  = '#010816'
const S   = '#0A1628'
const S2  = '#0F2040'
const T   = '#E8F4FF'
const M   = 'rgba(232,244,255,0.42)'
const M2  = 'rgba(232,244,255,0.25)'
const B   = 'rgba(255,255,255,0.07)'
const B2  = 'rgba(255,255,255,0.04)'
const ff  = 'DM Sans, sans-serif'
const ffd = '"Bebas Neue", sans-serif'
const ERR = '#FF4444'

type Section = 'overview' | 'users' | 'financial' | 'config' | 'system'

const PLAN_COLOR: Record<string, string> = {
  free:          M,
  criador:       '#00B4D8',
  profissional:  A,
  agencia:       '#A855F7',
}
const PLAN_PRICE: Record<string, number> = {
  free: 0, criador: 47, profissional: 97, agencia: 197,
}
const PLAN_LABEL: Record<string, string> = {
  free: 'Free', criador: 'Criador', profissional: 'Profissional', agencia: 'Agência',
}

// ─── Types ────────────────────────────────────────────────────────
interface KPIs {
  totalUsers:     number
  paidUsers:      number
  totalCarousels: number
  exportedCarousels: number
  carouselsLast30: number
  totalTokens:    number
  totalCostBrl:   number
  avgCostPerGen:  number
  planCounts:     Record<string, number>
}

interface ProfileRow {
  id:                       string
  user_id:                  string
  display_name:             string | null
  instagram_handle:         string | null
  niche:                    string | null
  plan:                     string
  exports_used_this_month:  number
  exports_limit:            number
  ai_images_used_this_month?: number
  ai_images_limit?:         number
  telegram_chat_id:         string | null
  onboarding_completed:     boolean
  created_at:               string
}

interface UsageLog {
  id:         string
  user_id:    string
  action:     string
  tokens_used: number
  cost_brl:   number
  created_at: string
}

interface ConfigRow {
  id:       string
  category: string
  key:      string
  value:    string | null
}

// ─── Helpers ──────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
function fmtCurrency(n: number) {
  return `R$${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function userLabel(p: ProfileRow) {
  if (p.display_name) return p.display_name
  if (p.instagram_handle) return `@${p.instagram_handle}`
  return p.user_id.slice(0, 8) + '…'
}

// ─── Components ───────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div style={{
      background: S, border: `1px solid ${B}`, borderRadius: 12,
      padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <span style={{ fontFamily: ff, fontSize: 11, color: M, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
      <span style={{ fontFamily: ffd, fontSize: 32, color: accent ? A : T, letterSpacing: 1, lineHeight: 1 }}>{value}</span>
      {sub && <span style={{ fontFamily: ff, fontSize: 11, color: M2 }}>{sub}</span>}
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <Loader2 size={24} color={M} style={{ animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function Pill({ plan }: { plan: string }) {
  return (
    <span style={{
      fontFamily: ffd, fontSize: 11, letterSpacing: 1,
      color: PLAN_COLOR[plan] ?? M, background: `${PLAN_COLOR[plan] ?? M}18`,
      padding: '2px 8px', borderRadius: 4,
    }}>
      {(PLAN_LABEL[plan] ?? plan).toUpperCase()}
    </span>
  )
}

// ─── Section: Visão Geral ─────────────────────────────────────────
function OverviewSection() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [profilesRes, carouselsRes, usageRes] = await Promise.all([
          supabase.from('profiles').select('plan'),
          supabase.from('carousels').select('status, created_at'),
          supabase.from('usage_logs').select('tokens_used, cost_brl, action'),
        ])

        if (profilesRes.error) throw profilesRes.error
        if (carouselsRes.error) throw carouselsRes.error
        if (usageRes.error) throw usageRes.error

        const profiles  = profilesRes.data ?? []
        const carousels = carouselsRes.data ?? []
        const logs      = usageRes.data ?? []

        const planCounts: Record<string, number> = {}
        for (const p of profiles) {
          planCounts[p.plan] = (planCounts[p.plan] ?? 0) + 1
        }

        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 30)

        const totalTokens  = logs.reduce((s, l) => s + (l.tokens_used ?? 0), 0)
        const totalCostBrl = logs.reduce((s, l) => s + Number(l.cost_brl ?? 0), 0)
        const genLogs      = logs.filter(l => l.action === 'generate_carousel')

        setKpis({
          totalUsers:       profiles.length,
          paidUsers:        profiles.filter(p => p.plan !== 'free').length,
          totalCarousels:   carousels.length,
          exportedCarousels: carousels.filter(c => c.status === 'exported').length,
          carouselsLast30:  carousels.filter(c => new Date(c.created_at) > cutoff).length,
          totalTokens,
          totalCostBrl,
          avgCostPerGen:    genLogs.length ? totalCostBrl / genLogs.length : 0,
          planCounts,
        })
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar KPIs')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <Spinner />
  if (error) return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: ERR, fontFamily: ff, fontSize: 13, padding: 24 }}>
      <AlertCircle size={16} /> {error}
    </div>
  )
  if (!kpis) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ fontFamily: ffd, fontSize: 28, color: T, letterSpacing: 1, margin: 0 }}>VISÃO GERAL</h2>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        <KpiCard label="Usuários totais"    value={kpis.totalUsers} />
        <KpiCard label="Usuários pagos"     value={kpis.paidUsers} accent />
        <KpiCard label="Carrosseis totais"  value={kpis.totalCarousels} />
        <KpiCard label="Exportados"         value={kpis.exportedCarousels} />
        <KpiCard label="Últimos 30 dias"    value={kpis.carouselsLast30} sub="carrosseis criados" />
        <KpiCard label="Custo total IA"     value={fmtCurrency(kpis.totalCostBrl)} sub={`${kpis.totalTokens.toLocaleString('pt-BR')} tokens`} />
        <KpiCard label="Custo médio / gen"  value={fmtCurrency(kpis.avgCostPerGen)} />
      </div>

      {/* Breakdown por plano */}
      <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 12, padding: '20px 24px' }}>
        <p style={{ fontFamily: ffd, fontSize: 16, color: T, letterSpacing: 1, margin: '0 0 16px' }}>USUÁRIOS POR PLANO</p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {(['free', 'criador', 'profissional', 'agencia'] as const).map(plan => (
            <div key={plan} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 100 }}>
              <span style={{ fontFamily: ffd, fontSize: 28, color: PLAN_COLOR[plan], letterSpacing: 1 }}>
                {kpis.planCounts[plan] ?? 0}
              </span>
              <span style={{ fontFamily: ff, fontSize: 11, color: M, textTransform: 'uppercase', letterSpacing: 1 }}>
                {PLAN_LABEL[plan]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── User Modal ───────────────────────────────────────────────────
function UserModal({ profile, onClose, onSaved }: {
  profile: ProfileRow
  onClose: () => void
  onSaved: () => void
}) {
  const [plan, setPlan] = useState(profile.plan)
  const [exportsLimit, setExportsLimit] = useState(String(profile.exports_limit))
  const [aiLimit, setAiLimit] = useState(String(profile.ai_images_limit ?? 0))
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [logs, setLogs] = useState<UsageLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadLogs() {
      const { data } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(10)
      setLogs(data ?? [])
      setLogsLoading(false)
    }
    loadLogs()
  }, [profile.user_id])

  async function save() {
    setSaving(true)
    setError('')
    setSuccess('')
    const { error: err } = await supabase
      .from('profiles')
      .update({
        plan,
        exports_limit:    Number(exportsLimit),
        ai_images_limit:  Number(aiLimit),
      })
      .eq('id', profile.id)

    setSaving(false)
    if (err) { setError(err.message); return }
    setSuccess('Salvo')
    setTimeout(() => setSuccess(''), 2000)
    onSaved()
  }

  async function resetCounters() {
    setResetting(true)
    setError('')
    const { error: err } = await supabase
      .from('profiles')
      .update({ exports_used_this_month: 0, ai_images_used_this_month: 0 })
      .eq('id', profile.id)
    setResetting(false)
    if (err) { setError(err.message); return }
    setSuccess('Contadores zerados')
    setTimeout(() => setSuccess(''), 2000)
    onSaved()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
      zIndex: 100,
    }} onClick={onClose}>
      <div
        style={{
          width: 400, height: '100vh', background: S, borderLeft: `1px solid ${B}`,
          overflowY: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 20,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontFamily: ffd, fontSize: 20, color: T, letterSpacing: 1, margin: 0 }}>
              {userLabel(profile)}
            </p>
            {profile.instagram_handle && (
              <p style={{ fontFamily: ff, fontSize: 12, color: M, margin: '2px 0 0' }}>
                @{profile.instagram_handle}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: M }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ borderTop: `1px solid ${B}` }} />

        {/* Plano */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontFamily: ff, fontSize: 11, color: M, textTransform: 'uppercase', letterSpacing: 1 }}>Plano</label>
          <select
            value={plan}
            onChange={e => setPlan(e.target.value)}
            style={{
              background: S2, border: `1px solid ${B}`, borderRadius: 8,
              padding: '10px 12px', color: T, fontFamily: ff, fontSize: 14,
            }}
          >
            {['free', 'criador', 'profissional', 'agencia'].map(p => (
              <option key={p} value={p}>{PLAN_LABEL[p]}</option>
            ))}
          </select>
        </div>

        {/* Limites */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Limite exports', value: exportsLimit, set: setExportsLimit },
            { label: 'Limite imagens IA', value: aiLimit, set: setAiLimit },
          ].map(({ label, value, set }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: ff, fontSize: 11, color: M, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</label>
              <input
                type="number"
                value={value}
                onChange={e => set(e.target.value)}
                style={{
                  background: S2, border: `1px solid ${B}`, borderRadius: 8,
                  padding: '10px 12px', color: T, fontFamily: ff, fontSize: 14,
                  width: '100%', boxSizing: 'border-box',
                }}
              />
            </div>
          ))}
        </div>

        {/* Uso atual */}
        <div style={{ background: B2, borderRadius: 8, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ fontFamily: ff, fontSize: 11, color: M, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>Uso atual</p>
          <div style={{ display: 'flex', gap: 24 }}>
            <span style={{ fontFamily: ff, fontSize: 13, color: T }}>
              Exports: <b>{profile.exports_used_this_month}</b> / {profile.exports_limit}
            </span>
            <span style={{ fontFamily: ff, fontSize: 13, color: T }}>
              IA: <b>{profile.ai_images_used_this_month ?? 0}</b> / {profile.ai_images_limit ?? 0}
            </span>
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div style={{ fontFamily: ff, fontSize: 12, color: ERR, display: 'flex', gap: 6, alignItems: 'center' }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}
        {success && (
          <div style={{ fontFamily: ff, fontSize: 12, color: A, display: 'flex', gap: 6, alignItems: 'center' }}>
            <Check size={14} /> {success}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={save}
            disabled={saving}
            style={{
              flex: 1, background: A, color: '#000', border: 'none', borderRadius: 8,
              padding: '10px 0', fontFamily: ffd, fontSize: 14, letterSpacing: 1,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'SALVANDO…' : 'SALVAR'}
          </button>
          <button
            onClick={resetCounters}
            disabled={resetting}
            style={{
              flex: 1, background: 'none', color: M, border: `1px solid ${B}`, borderRadius: 8,
              padding: '10px 0', fontFamily: ff, fontSize: 13,
              cursor: resetting ? 'not-allowed' : 'pointer',
              opacity: resetting ? 0.6 : 1,
            }}
          >
            {resetting ? 'Zerando…' : 'Zerar contadores'}
          </button>
        </div>

        <div style={{ borderTop: `1px solid ${B}` }} />

        {/* Usage logs */}
        <div>
          <p style={{ fontFamily: ffd, fontSize: 14, color: T, letterSpacing: 1, margin: '0 0 12px' }}>HISTÓRICO (últimas 10)</p>
          {logsLoading ? (
            <Spinner />
          ) : logs.length === 0 ? (
            <p style={{ fontFamily: ff, fontSize: 13, color: M2 }}>Sem registros</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {logs.map(log => (
                <div key={log.id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: `1px solid ${B}`,
                }}>
                  <span style={{ fontFamily: ff, fontSize: 12, color: T }}>{log.action}</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontFamily: ff, fontSize: 11, color: M }}>{fmtCurrency(Number(log.cost_brl))}</span>
                    <span style={{ fontFamily: ff, fontSize: 11, color: M2 }}>{fmtDate(log.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ background: B2, borderRadius: 8, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Row label="Nicho" value={profile.niche ?? '—'} />
          <Row label="Telegram" value={profile.telegram_chat_id ? 'Conectado' : 'Não'} />
          <Row label="Onboarding" value={profile.onboarding_completed ? 'Completo' : 'Pendente'} />
          <Row label="Membro desde" value={fmtDate(profile.created_at)} />
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontFamily: ff, fontSize: 12, color: M }}>{label}</span>
      <span style={{ fontFamily: ff, fontSize: 12, color: T }}>{value}</span>
    </div>
  )
}

// ─── Section: Usuários ────────────────────────────────────────────
const PAGE_SIZE = 20

function UsersSection() {
  const [users, setUsers] = useState<ProfileRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [planFilter, setPlanFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<ProfileRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    let q = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (planFilter) q = q.eq('plan', planFilter)
    if (search)     q = q.or(`display_name.ilike.%${search}%,instagram_handle.ilike.%${search}%`)

    const { data, error: err, count } = await q
    setLoading(false)
    if (err) { setError(err.message); return }
    setUsers(data ?? [])
    setTotal(count ?? 0)
  }, [page, planFilter, search])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h2 style={{ fontFamily: ffd, fontSize: 28, color: T, letterSpacing: 1, margin: 0 }}>
        USUÁRIOS <span style={{ fontSize: 16, color: M }}>({total})</span>
      </h2>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          placeholder="Buscar por nome ou @instagram…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          style={{
            flex: 1, minWidth: 220, background: S2, border: `1px solid ${B}`, borderRadius: 8,
            padding: '10px 14px', color: T, fontFamily: ff, fontSize: 13,
          }}
        />
        <select
          value={planFilter}
          onChange={e => { setPlanFilter(e.target.value); setPage(0) }}
          style={{
            background: S2, border: `1px solid ${B}`, borderRadius: 8,
            padding: '10px 12px', color: T, fontFamily: ff, fontSize: 13,
          }}
        >
          <option value="">Todos os planos</option>
          {['free', 'criador', 'profissional', 'agencia'].map(p => (
            <option key={p} value={p}>{PLAN_LABEL[p]}</option>
          ))}
        </select>
      </div>

      {error && (
        <div style={{ fontFamily: ff, fontSize: 13, color: ERR, display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Tabela */}
      <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 12, overflow: 'hidden' }}>
        {/* Cabeçalho */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px',
          padding: '12px 20px', borderBottom: `1px solid ${B}`,
        }}>
          {['Nome', 'Plano', 'Exports', 'IA', 'Desde'].map(h => (
            <span key={h} style={{ fontFamily: ff, fontSize: 11, color: M, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</span>
          ))}
        </div>

        {loading ? <Spinner /> : users.length === 0 ? (
          <p style={{ fontFamily: ff, fontSize: 13, color: M2, padding: '20px 24px' }}>Nenhum usuário encontrado</p>
        ) : (
          users.map((u, i) => (
            <div
              key={u.id}
              onClick={() => setSelected(u)}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px',
                padding: '14px 20px',
                borderBottom: i < users.length - 1 ? `1px solid ${B}` : 'none',
                cursor: 'pointer', transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = B2)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontFamily: ff, fontSize: 13, color: T }}>{userLabel(u)}</span>
                {u.niche && <span style={{ fontFamily: ff, fontSize: 11, color: M2 }}>{u.niche}</span>}
              </div>
              <div><Pill plan={u.plan} /></div>
              <span style={{ fontFamily: ff, fontSize: 13, color: T }}>
                {u.exports_used_this_month} / {u.exports_limit}
              </span>
              <span style={{ fontFamily: ff, fontSize: 13, color: T }}>
                {u.ai_images_used_this_month ?? 0} / {u.ai_images_limit ?? 0}
              </span>
              <span style={{ fontFamily: ff, fontSize: 12, color: M }}>{fmtDate(u.created_at)}</span>
            </div>
          ))
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              background: page === 0 ? 'transparent' : S2,
              border: `1px solid ${B}`, borderRadius: 8, padding: '8px 14px',
              color: page === 0 ? M2 : T, cursor: page === 0 ? 'default' : 'pointer',
              fontFamily: ff, fontSize: 13,
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontFamily: ff, fontSize: 13, color: M }}>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{
              background: page >= totalPages - 1 ? 'transparent' : S2,
              border: `1px solid ${B}`, borderRadius: 8, padding: '8px 14px',
              color: page >= totalPages - 1 ? M2 : T,
              cursor: page >= totalPages - 1 ? 'default' : 'pointer',
              fontFamily: ff, fontSize: 13,
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {selected && (
        <UserModal
          profile={selected}
          onClose={() => setSelected(null)}
          onSaved={() => { setSelected(null); load() }}
        />
      )}
    </div>
  )
}

// ─── Section: Financeiro ──────────────────────────────────────────
function FinancialSection() {
  const [planCounts, setPlanCounts] = useState<Record<string, number>>({})
  const [costLast30, setCostLast30] = useState(0)
  const [recentLogs, setRecentLogs] = useState<(UsageLog & { display_name?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 30)

      const [profilesRes, costRes, logsRes] = await Promise.all([
        supabase.from('profiles').select('plan'),
        supabase.from('usage_logs').select('cost_brl').gte('created_at', cutoff.toISOString()),
        supabase.from('usage_logs').select('*').order('created_at', { ascending: false }).limit(50),
      ])

      setLoading(false)
      if (profilesRes.error) { setError(profilesRes.error.message); return }

      const counts: Record<string, number> = {}
      for (const p of profilesRes.data ?? []) {
        counts[p.plan] = (counts[p.plan] ?? 0) + 1
      }
      setPlanCounts(counts)
      setCostLast30((costRes.data ?? []).reduce((s, l) => s + Number(l.cost_brl ?? 0), 0))
      setRecentLogs(logsRes.data ?? [])
    }
    load()
  }, [])

  const mrr = Object.entries(planCounts).reduce((s, [plan, count]) => {
    return s + (PLAN_PRICE[plan] ?? 0) * count
  }, 0)
  const margin = mrr - costLast30

  if (loading) return <Spinner />
  if (error) return (
    <div style={{ fontFamily: ff, fontSize: 13, color: ERR, display: 'flex', gap: 8, alignItems: 'center', padding: 24 }}>
      <AlertCircle size={14} /> {error}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ fontFamily: ffd, fontSize: 28, color: T, letterSpacing: 1, margin: 0 }}>FINANCEIRO</h2>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        <KpiCard label="MRR estimado"     value={fmtCurrency(mrr)}        accent sub="assinaturas ativas" />
        <KpiCard label="Custo IA (30d)"   value={fmtCurrency(costLast30)} sub="últimos 30 dias" />
        <KpiCard label="Margem estimada"  value={fmtCurrency(margin)}     sub="MRR − custo IA" />
      </div>

      {/* Breakdown MRR */}
      <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 12, padding: '20px 24px' }}>
        <p style={{ fontFamily: ffd, fontSize: 16, color: T, letterSpacing: 1, margin: '0 0 16px' }}>MRR POR PLANO</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(['criador', 'profissional', 'agencia'] as const).map(plan => {
            const count = planCounts[plan] ?? 0
            const revenue = count * PLAN_PRICE[plan]
            return (
              <div key={plan} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Pill plan={plan} />
                  <span style={{ fontFamily: ff, fontSize: 13, color: M }}>{count} usuários × {fmtCurrency(PLAN_PRICE[plan])}</span>
                </div>
                <span style={{ fontFamily: ffd, fontSize: 18, color: T, letterSpacing: 1 }}>{fmtCurrency(revenue)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Últimos 50 logs */}
      <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${B}` }}>
          <p style={{ fontFamily: ffd, fontSize: 14, color: T, letterSpacing: 1, margin: 0 }}>ÚLTIMOS 50 REGISTROS DE USO</p>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px',
          padding: '10px 20px', borderBottom: `1px solid ${B}`,
        }}>
          {['Ação', 'Tokens', 'Custo', 'Data'].map(h => (
            <span key={h} style={{ fontFamily: ff, fontSize: 11, color: M, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</span>
          ))}
        </div>
        {recentLogs.length === 0 ? (
          <p style={{ fontFamily: ff, fontSize: 13, color: M2, padding: '20px 24px' }}>Sem registros</p>
        ) : (
          recentLogs.map((log, i) => (
            <div key={log.id} style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px',
              padding: '12px 20px',
              borderBottom: i < recentLogs.length - 1 ? `1px solid ${B}` : 'none',
            }}>
              <span style={{ fontFamily: ff, fontSize: 13, color: T }}>{log.action}</span>
              <span style={{ fontFamily: ff, fontSize: 13, color: M }}>{(log.tokens_used ?? 0).toLocaleString('pt-BR')}</span>
              <span style={{ fontFamily: ff, fontSize: 13, color: M }}>{fmtCurrency(Number(log.cost_brl))}</span>
              <span style={{ fontFamily: ff, fontSize: 12, color: M2 }}>{fmtDate(log.created_at)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Section: Configurações ───────────────────────────────────────
const CONFIG_LABELS: Record<string, Record<string, string>> = {
  cakto:    { url_criador: 'URL Criador', url_profissional: 'URL Profissional', url_agencia: 'URL Agência' },
  telegram: { bot_token: 'Bot Token', admin_chat_id: 'Chat ID Admin' },
  ia:       { text_model: 'Modelo de Texto', image_model: 'Modelo de Imagem', cost_per_1k_tokens: 'Custo por 1k tokens (R$)' },
  geral:    { maintenance_mode: 'Modo manutenção (true/false)', site_url: 'URL do site' },
}
const CATEGORY_LABELS: Record<string, string> = {
  cakto: 'Cakto', telegram: 'Telegram', ia: 'IA', geral: 'Geral',
}

function ConfigSection() {
  const [configs, setConfigs] = useState<ConfigRow[]>([])
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error: err } = await supabase.from('system_config').select('*').order('category').order('key')
      setLoading(false)
      if (err) { setError(err.message); return }
      setConfigs(data ?? [])
    }
    load()
  }, [])

  async function save(row: ConfigRow) {
    const newVal = edits[row.id] ?? row.value ?? ''
    setSaving(row.id)
    const { error: err } = await supabase.from('system_config').update({ value: newVal }).eq('id', row.id)
    setSaving(null)
    if (err) { setError(err.message); return }
    setConfigs(prev => prev.map(c => c.id === row.id ? { ...c, value: newVal } : c))
    delete edits[row.id]
    setEdits({ ...edits })
    setSaved(row.id)
    setTimeout(() => setSaved(null), 2000)
  }

  if (loading) return <Spinner />

  const grouped: Record<string, ConfigRow[]> = {}
  for (const c of configs) {
    if (!grouped[c.category]) grouped[c.category] = []
    grouped[c.category].push(c)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ fontFamily: ffd, fontSize: 28, color: T, letterSpacing: 1, margin: 0 }}>CONFIGURAÇÕES</h2>

      {error && (
        <div style={{ fontFamily: ff, fontSize: 13, color: ERR, display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {Object.keys(grouped).length === 0 && (
        <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 12, padding: '24px', textAlign: 'center' }}>
          <p style={{ fontFamily: ff, fontSize: 13, color: M, margin: 0 }}>
            A tabela <code>system_config</code> não tem dados. Execute a migration 004 primeiro.
          </p>
        </div>
      )}

      {Object.entries(grouped).map(([category, rows]) => (
        <div key={category} style={{ background: S, border: `1px solid ${B}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${B}`, background: B2 }}>
            <p style={{ fontFamily: ffd, fontSize: 16, color: T, letterSpacing: 1, margin: 0 }}>
              {(CATEGORY_LABELS[category] ?? category).toUpperCase()}
            </p>
          </div>
          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {rows.map(row => {
              const label   = CONFIG_LABELS[category]?.[row.key] ?? row.key
              const current = edits[row.id] ?? row.value ?? ''
              const dirty   = edits[row.id] !== undefined && edits[row.id] !== row.value
              return (
                <div key={row.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontFamily: ff, fontSize: 11, color: M, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {label}
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={current}
                      onChange={e => setEdits(prev => ({ ...prev, [row.id]: e.target.value }))}
                      style={{
                        flex: 1, background: S2, border: `1px solid ${dirty ? A + '60' : B}`,
                        borderRadius: 8, padding: '10px 12px', color: T, fontFamily: ff, fontSize: 13,
                      }}
                    />
                    <button
                      onClick={() => save(row)}
                      disabled={!dirty || saving === row.id}
                      style={{
                        background: dirty ? A : B, color: dirty ? '#000' : M2,
                        border: 'none', borderRadius: 8, padding: '0 16px',
                        fontFamily: ffd, fontSize: 13, letterSpacing: 1,
                        cursor: dirty && saving !== row.id ? 'pointer' : 'default',
                        transition: 'background 0.15s',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      {saving === row.id ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> :
                       saved === row.id  ? <Check size={14} /> : 'OK'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Section: Sistema ─────────────────────────────────────────────
const EDGE_FUNCTIONS = [
  { name: 'generate-carousel',      desc: 'Gera carrossel com Claude AI',           method: 'POST' },
  { name: 'reset-monthly-counters', desc: 'Zera contadores mensais de todos usuários', method: 'POST' },
  { name: 'webhook-cakto',          desc: 'Processa pagamentos Cakto',              method: 'POST' },
  { name: 'send-telegram',          desc: 'Envia notificações via Telegram Bot',    method: 'POST' },
  { name: 'generate-image',         desc: 'Gera imagem de fundo com Gemini',        method: 'POST' },
]

const ENV_VARS = [
  'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'CAKTO_WEBHOOK_SECRET',
  'CAKTO_PRODUCT_CRIADOR', 'CAKTO_PRODUCT_PROFISSIONAL', 'CAKTO_PRODUCT_AGENCIA',
  'TELEGRAM_BOT_TOKEN', 'RESEND_API_KEY',
]

function SystemSection() {
  const [resetting, setResetting] = useState(false)
  const [resetMsg, setResetMsg] = useState('')
  const [recentLogs, setRecentLogs] = useState<UsageLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)

  useEffect(() => {
    async function loadLogs() {
      const { data } = await supabase
        .from('usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      setRecentLogs(data ?? [])
      setLogsLoading(false)
    }
    loadLogs()
  }, [])

  async function forceReset() {
    setResetting(true)
    setResetMsg('')
    const { error } = await supabase.functions.invoke('reset-monthly-counters')
    setResetting(false)
    setResetMsg(error ? `Erro: ${error.message}` : 'Contadores zerados com sucesso')
    setTimeout(() => setResetMsg(''), 4000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ fontFamily: ffd, fontSize: 28, color: T, letterSpacing: 1, margin: 0 }}>SISTEMA</h2>

      {/* Edge functions */}
      <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${B}`, background: B2 }}>
          <p style={{ fontFamily: ffd, fontSize: 16, color: T, letterSpacing: 1, margin: 0 }}>EDGE FUNCTIONS</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {EDGE_FUNCTIONS.map((fn, i) => (
            <div key={fn.name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 24px',
              borderBottom: i < EDGE_FUNCTIONS.length - 1 ? `1px solid ${B}` : 'none',
            }}>
              <div>
                <p style={{ fontFamily: ff, fontSize: 13, color: T, margin: '0 0 2px' }}>{fn.name}</p>
                <p style={{ fontFamily: ff, fontSize: 11, color: M2, margin: 0 }}>{fn.desc}</p>
              </div>
              <span style={{
                fontFamily: ff, fontSize: 11, color: A, background: `${A}18`,
                padding: '2px 8px', borderRadius: 4,
              }}>{fn.method}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Force reset */}
      <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 12, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontFamily: ffd, fontSize: 16, color: T, letterSpacing: 1, margin: 0 }}>FORÇAR RESET MENSAL</p>
        <p style={{ fontFamily: ff, fontSize: 13, color: M, margin: 0, lineHeight: 1.6 }}>
          Zera os contadores <code>exports_used_this_month</code> e <code>ai_images_used_this_month</code> de todos os usuários imediatamente.
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={forceReset}
            disabled={resetting}
            style={{
              background: 'none', border: `1px solid ${ERR}60`, borderRadius: 8,
              color: ERR, fontFamily: ff, fontSize: 13,
              padding: '10px 20px', cursor: resetting ? 'not-allowed' : 'pointer',
              opacity: resetting ? 0.6 : 1, display: 'flex', gap: 8, alignItems: 'center',
            }}
          >
            <RefreshCw size={14} /> {resetting ? 'Zerando…' : 'Zerar todos agora'}
          </button>
          {resetMsg && (
            <span style={{
              fontFamily: ff, fontSize: 13,
              color: resetMsg.startsWith('Erro') ? ERR : A,
            }}>
              {resetMsg}
            </span>
          )}
        </div>
      </div>

      {/* Env vars */}
      <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 12, padding: '20px 24px' }}>
        <p style={{ fontFamily: ffd, fontSize: 16, color: T, letterSpacing: 1, margin: '0 0 12px' }}>VARIÁVEIS DE AMBIENTE</p>
        <p style={{ fontFamily: ff, fontSize: 12, color: M2, margin: '0 0 16px', lineHeight: 1.5 }}>
          Configurar via <code>supabase secrets set KEY=value</code> ou no dashboard Supabase.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ENV_VARS.map(k => (
            <span key={k} style={{
              fontFamily: 'monospace', fontSize: 12, color: M,
              background: B2, border: `1px solid ${B}`, borderRadius: 6,
              padding: '4px 10px',
            }}>{k}</span>
          ))}
        </div>
      </div>

      {/* Últimos logs */}
      <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${B}`, background: B2 }}>
          <p style={{ fontFamily: ffd, fontSize: 14, color: T, letterSpacing: 1, margin: 0 }}>ÚLTIMOS 20 LOGS DE USO</p>
        </div>
        {logsLoading ? <Spinner /> : recentLogs.length === 0 ? (
          <p style={{ fontFamily: ff, fontSize: 13, color: M2, padding: '20px 24px' }}>Sem registros</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 120px',
              padding: '10px 24px', borderBottom: `1px solid ${B}`,
            }}>
              {['Ação', 'Tokens', 'Custo', 'Data'].map(h => (
                <span key={h} style={{ fontFamily: ff, fontSize: 11, color: M, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</span>
              ))}
            </div>
            {recentLogs.map((log, i) => (
              <div key={log.id} style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 120px',
                padding: '12px 24px',
                borderBottom: i < recentLogs.length - 1 ? `1px solid ${B}` : 'none',
              }}>
                <span style={{ fontFamily: ff, fontSize: 13, color: T }}>{log.action}</span>
                <span style={{ fontFamily: ff, fontSize: 13, color: M }}>{(log.tokens_used ?? 0).toLocaleString('pt-BR')}</span>
                <span style={{ fontFamily: ff, fontSize: 13, color: M }}>{fmtCurrency(Number(log.cost_brl))}</span>
                <span style={{ fontFamily: ff, fontSize: 12, color: M2 }}>{fmtDate(log.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Admin ───────────────────────────────────────────────────
const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',   label: 'Visão Geral',    icon: <LayoutDashboard size={16} /> },
  { id: 'users',      label: 'Usuários',        icon: <Users size={16} /> },
  { id: 'financial',  label: 'Financeiro',      icon: <DollarSign size={16} /> },
  { id: 'config',     label: 'Configurações',   icon: <Settings size={16} /> },
  { id: 'system',     label: 'Sistema',         icon: <Server size={16} /> },
]

export default function Admin() {
  const [section, setSection] = useState<Section>('overview')
  const navigate = useNavigate()

  async function logout() {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BG, fontFamily: ff }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, background: S, borderRight: `1px solid ${B}`,
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: `1px solid ${B}` }}>
          <span style={{ fontFamily: ffd, fontSize: 22, color: T, letterSpacing: 1 }}>
            Conteúd<span style={{ color: A }}>OS</span>
          </span>
          <span style={{
            display: 'block', fontFamily: ff, fontSize: 11, color: ERR,
            textTransform: 'uppercase', letterSpacing: 2, marginTop: 2,
          }}>Admin</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ id, label, icon }) => {
            const active = section === id
            return (
              <button
                key={id}
                onClick={() => setSection(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8,
                  background: active ? B : 'transparent',
                  border: 'none', cursor: 'pointer',
                  color: active ? T : M,
                  fontFamily: ff, fontSize: 13,
                  transition: 'background 0.12s, color 0.12s',
                  textAlign: 'left', width: '100%',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = B2 }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ color: active ? A : M }}>{icon}</span>
                {label}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 10px', borderTop: `1px solid ${B}` }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: M, fontFamily: ff, fontSize: 13, width: '100%',
              transition: 'color 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = T}
            onMouseLeave={e => e.currentTarget.style.color = M}
          >
            <ChevronLeft size={16} /> Dashboard
          </button>
          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: M, fontFamily: ff, fontSize: 13, width: '100%',
              transition: 'color 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = ERR}
            onMouseLeave={e => e.currentTarget.style.color = M}
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto', maxWidth: 1100 }}>
        {section === 'overview'  && <OverviewSection />}
        {section === 'users'     && <UsersSection />}
        {section === 'financial' && <FinancialSection />}
        {section === 'config'    && <ConfigSection />}
        {section === 'system'    && <SystemSection />}
      </main>
    </div>
  )
}
