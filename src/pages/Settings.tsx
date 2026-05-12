import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, Loader2, Send, User, Palette, MessageSquare, CreditCard, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Profile, Plan } from '@/types'

// ─── Tokens ───────────────────────────────────────────────────
const A   = '#00D4FF'
const BG  = '#010816'
const S   = '#0A1628'
const S2  = '#0F2040'
const T   = '#E8F4FF'
const M   = 'rgba(232,244,255,0.42)'
const B   = 'rgba(255,255,255,0.07)'
const ff  = 'DM Sans, sans-serif'
const ffd = '"Bebas Neue", sans-serif'

// ─── Constants ────────────────────────────────────────────────
type Tab = 'perfil' | 'voz' | 'telegram' | 'plano'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'perfil',    label: 'Perfil',       icon: <User size={16} /> },
  { key: 'voz',       label: 'Voz & Estilo', icon: <Palette size={16} /> },
  { key: 'telegram',  label: 'Telegram',     icon: <MessageSquare size={16} /> },
  { key: 'plano',     label: 'Plano',        icon: <CreditCard size={16} /> },
]

const NICHES = [
  'empreendedorismo','marketing','saúde','autoconhecimento',
  'espiritualidade','tecnologia','lifestyle','educação','finanças','outro',
]

const TONES = [
  { slug: 'provocador',    label: 'Provocador',    example: 'Você está sabotando seu crescimento sem perceber' },
  { slug: 'educativo',     label: 'Educativo',     example: '5 erros que impedem o crescimento no Instagram' },
  { slug: 'bastidor',      label: 'Bastidor',      example: 'Hoje aprendi algo que mudou como vejo conteúdo' },
  { slug: 'inspiracional', label: 'Inspiracional', example: 'Pequenas ações consistentes criam grandes resultados' },
]

const PALETTE = ['#C8FF00','#FF6B2B','#00B4D8','#A855F7','#F43F5E','#10B981','#F59E0B','#FFFFFF']

const STYLES = [
  { slug: 'dark_cinematic', label: 'Dark Cinematic', bg: 'linear-gradient(135deg,#0a0a0a,#1a2a3a)' },
  { slug: 'light_clean',    label: 'Light Clean',    bg: 'linear-gradient(135deg,#f8f8f8,#e0e0e0)' },
  { slug: 'colorful',       label: 'Colorido',       bg: 'linear-gradient(135deg,#FF6B2B,#A855F7)' },
  { slug: 'minimal_bw',     label: 'Minimalista',    bg: 'linear-gradient(135deg,#222,#555)' },
]

const FONTS = [
  { label: 'Bebas Neue',       value: '"Bebas Neue", sans-serif' },
  { label: 'DM Sans',          value: 'DM Sans, sans-serif' },
  { label: 'Inter',            value: 'Inter, sans-serif' },
  { label: 'Playfair Display', value: '"Playfair Display", serif' },
  { label: 'Oswald',           value: 'Oswald, sans-serif' },
]

const PLAN_LABELS: Record<Plan, string> = {
  free: 'FREE', criador: 'CRIADOR', profissional: 'PROFISSIONAL', agencia: 'AGÊNCIA',
}
const PLAN_COLORS: Record<Plan, string> = {
  free: M, criador: A, profissional: T, agencia: '#F59E0B',
}
const PLAN_UPGRADES = [
  { plan: 'criador' as Plan,      label: 'Criador',      price: 'R$47/mês',  features: ['20 exportações/mês','20 imagens IA'],                              url: 'https://pay.cakto.com.br/vzjyawh_859532' },
  { plan: 'profissional' as Plan, label: 'Profissional', price: 'R$97/mês',  features: ['Exportações ilimitadas','60 imagens IA','Calendário','Telegram'],  url: 'https://pay.cakto.com.br/v5utxm4_859534' },
  { plan: 'agencia' as Plan,      label: 'Agência',      price: 'R$197/mês', features: ['Ilimitado','200 imagens IA','5 subcontas'],                         url: 'https://pay.cakto.com.br/3fyfktb_859537' },
]

// ─── Shared input style ───────────────────────────────────────
const inputSt: React.CSSProperties = {
  width: '100%', background: S2, border: `1px solid ${B}`,
  borderRadius: 8, color: T, fontFamily: ff, fontSize: 13,
  padding: '10px 14px', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

// ─── Field component ──────────────────────────────────────────
function Field({ label, value, onChange, placeholder, prefix }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; prefix?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: ff, fontSize: 12, color: M }}>{label}</label>
      <div style={{ display: 'flex' }}>
        {prefix && (
          <span style={{ background: S2, border: `1px solid ${B}`, borderRight: 'none', borderRadius: '8px 0 0 8px', padding: '10px 12px', fontFamily: ff, fontSize: 13, color: M, userSelect: 'none' }}>
            {prefix}
          </span>
        )}
        <input
          value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={{ ...inputSt, borderRadius: prefix ? '0 8px 8px 0' : 8 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(200,255,0,0.4)' }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = B }}
        />
      </div>
    </div>
  )
}

// ─── Chip list ────────────────────────────────────────────────
function ChipList({ items, onRemove, onAdd, placeholder }: {
  items: string[]; onRemove: (i: number) => void; onAdd: (v: string) => void; placeholder?: string
}) {
  const [val, setVal] = useState('')
  const add = () => {
    const v = val.trim()
    if (v && !items.includes(v)) { onAdd(v); setVal('') }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {items.map((item, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.06)', border: `1px solid ${B}`, borderRadius: 99, padding: '3px 10px', fontFamily: ff, fontSize: 12, color: T }}>
            {item}
            <button onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', color: M, cursor: 'pointer', padding: 0, display: 'flex', lineHeight: 1 }}>
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder ?? 'Adicionar...'}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          style={{ ...inputSt, flex: 1 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(200,255,0,0.4)' }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = B }}
        />
        <button onClick={add}
          style={{ height: 42, padding: '0 14px', background: 'rgba(200,255,0,0.1)', border: `1px solid rgba(200,255,0,0.3)`, borderRadius: 8, color: A, fontFamily: ff, fontSize: 12, cursor: 'pointer' }}>
          + Adicionar
        </button>
      </div>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────
function Section({ title, children, notice }: { title: string; children: React.ReactNode; notice?: string }) {
  return (
    <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {notice && (
        <div style={{ background: 'rgba(200,255,0,0.06)', border: `1px solid rgba(200,255,0,0.2)`, borderRadius: 8, padding: '10px 14px' }}>
          <p style={{ fontFamily: ff, fontSize: 12, color: 'rgba(200,255,0,0.8)', margin: 0 }}>{notice}</p>
        </div>
      )}
      <h2 style={{ fontFamily: ffd, fontSize: 20, color: T, margin: 0, letterSpacing: 1 }}>{title}</h2>
      {children}
    </div>
  )
}

// ─── Save button ──────────────────────────────────────────────
function SaveBtn({ onClick, saving, label = 'Salvar' }: { onClick: () => void; saving: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={saving}
      style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, background: A, color: '#000', border: 'none', borderRadius: 8, padding: '10px 22px', fontFamily: ffd, fontSize: 15, letterSpacing: 1, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
      {saving ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Salvando...</> : <><Check size={14} /> {label}</>}
    </button>
  )
}

// ─── Aba: Perfil ──────────────────────────────────────────────
function TabPerfil({ profile, userId }: { profile: Profile; userId: string }) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [instagram,   setInstagram]   = useState(profile.instagram_handle ?? '')
  const [niche,       setNiche]       = useState(profile.niche ?? '')
  const [avatarUrl,   setAvatarUrl]   = useState<string | null>(profile.avatar_url ?? null)
  const [saving,     setSaving]       = useState(false)
  const [uploading,  setUploading]    = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleAvatarUpload = async (file: File) => {
    setUploading(true)
    try {
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `avatars/${userId}_profile.${ext}`
      const { error: upErr } = await supabase.storage.from('carousel-images').upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) { toast.error('Erro ao enviar foto'); return }
      const { data: { publicUrl } } = supabase.storage.from('carousel-images').getPublicUrl(path)
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', userId)
      setAvatarUrl(publicUrl)
      toast.success('Foto atualizada')
    } catch { toast.error('Erro ao enviar foto') }
    finally { setUploading(false) }
  }

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      display_name:     displayName.trim() || null,
      instagram_handle: instagram.replace('@', '').trim() || null,
      niche:            niche || null,
    }).eq('user_id', userId)
    setSaving(false)
    if (error) { toast.error('Erro ao salvar'); return }
    toast.success('Perfil atualizado')
  }

  const initials = displayName ? displayName[0].toUpperCase() : '?'

  return (
    <Section title="Perfil">
      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${B}` }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: S2, border: `2px dashed ${B}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: ffd, fontSize: 28, color: M }}>{initials}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = '' }} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{ height: 36, padding: '0 18px', background: S2, border: `1px solid ${B}`, borderRadius: 8, color: uploading ? M : T, fontFamily: ff, fontSize: 13, cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'border-color 0.15s' }}
            onMouseEnter={(e) => { if (!uploading) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = B }}>
            {uploading ? <><Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> Enviando...</> : 'Trocar foto'}
          </button>
          {avatarUrl && (
            <button onClick={async () => { await supabase.from('profiles').update({ avatar_url: null }).eq('user_id', userId); setAvatarUrl(null) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: ff, fontSize: 12, color: '#f87171', padding: 0, textAlign: 'left' }}>
              Remover foto
            </button>
          )}
        </div>
      </div>

      <Field label="Nome" value={displayName} onChange={setDisplayName} placeholder="Seu nome" />
      <Field label="Instagram" value={instagram} onChange={setInstagram} placeholder="seuperfil" prefix="@" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontFamily: ff, fontSize: 12, color: M }}>Nicho</label>
        <select value={niche} onChange={(e) => setNiche(e.target.value)}
          style={{ ...inputSt, cursor: 'pointer', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff66' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', appearance: 'none' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(200,255,0,0.4)' }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = B }}>
          <option value="" style={{ background: S2 }}>Selecione seu nicho...</option>
          {NICHES.map((n) => (
            <option key={n} value={n} style={{ background: S2 }}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>
          ))}
        </select>
      </div>

      <SaveBtn onClick={save} saving={saving} label="Salvar perfil" />
    </Section>
  )
}

// ─── Aba: Voz & Estilo ────────────────────────────────────────
function TabVoz({ profile, userId }: { profile: Profile; userId: string }) {
  const vp = (profile.voice_profile ?? {}) as Record<string, unknown>
  const vk = profile.visual_kit ?? { cor: '#C8FF00', estilo: 'dark_cinematic', fonte: '"Bebas Neue", sans-serif' }

  const [tom,          setTom]          = useState((vp.tom as string) ?? '')
  const [proibidas,    setProibidas]    = useState<string[]>((vp.palavras_proibidas as string[]) ?? [])
  const [definidoras,  setDefinidoras]  = useState<string[]>((vp.palavras_definidoras as string[]) ?? [])
  const [exemplo,      setExemplo]      = useState((vp.exemplo_texto as string) ?? '')
  const [cor,          setCor]          = useState(vk.cor ?? '#C8FF00')
  const [estilo,       setEstilo]       = useState(vk.estilo ?? 'dark_cinematic')
  const [fonte,        setFonte]        = useState(vk.fonte ?? '"Bebas Neue", sans-serif')
  const [saving,       setSaving]       = useState(false)

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      voice_profile: { tom, palavras_proibidas: proibidas, palavras_definidoras: definidoras, exemplo_texto: exemplo },
      visual_kit:    { cor, estilo, fonte },
    }).eq('user_id', userId)
    setSaving(false)
    if (error) { toast.error('Erro ao salvar'); return }
    toast.success('Voz e estilo atualizados')
  }

  return (
    <Section title="Voz & Estilo" notice="Esses dados são usados pela IA ao gerar seus carrosseis">

      {/* Tom */}
      <div>
        <p style={{ fontFamily: ff, fontSize: 12, color: M, margin: '0 0 10px' }}>Tom de voz</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {TONES.map((t) => {
            const sel = tom === t.slug
            return (
              <button key={t.slug} onClick={() => setTom(t.slug)}
                style={{ background: sel ? 'rgba(200,255,0,0.08)' : S2, border: `2px solid ${sel ? A : B}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: sel ? A : T, fontFamily: ff, margin: '0 0 4px' }}>{t.label}</p>
                <p style={{ fontSize: 11, color: M, fontFamily: ff, margin: 0, lineHeight: 1.4 }}>"{t.example}"</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Palavras proibidas */}
      <div>
        <p style={{ fontFamily: ff, fontSize: 12, color: M, margin: '0 0 8px' }}>Palavras proibidas</p>
        <ChipList items={proibidas} onRemove={(i) => setProibidas((p) => p.filter((_, j) => j !== i))} onAdd={(v) => setProibidas((p) => [...p, v])} placeholder="Ex: sinergia, impactar..." />
      </div>

      {/* Palavras definidoras */}
      <div>
        <p style={{ fontFamily: ff, fontSize: 12, color: M, margin: '0 0 8px' }}>Palavras definidoras</p>
        <ChipList items={definidoras} onRemove={(i) => setDefinidoras((p) => p.filter((_, j) => j !== i))} onAdd={(v) => setDefinidoras((p) => [...p, v])} placeholder="Ex: prático, direto, humano..." />
      </div>

      {/* Exemplo de texto */}
      <div>
        <p style={{ fontFamily: ff, fontSize: 12, color: M, margin: '0 0 6px' }}>Exemplo do seu estilo de escrita</p>
        <textarea value={exemplo} onChange={(e) => setExemplo(e.target.value)} rows={4}
          placeholder="Cole aqui um trecho de texto seu para a IA aprender seu tom..."
          style={{ ...inputSt, resize: 'vertical', lineHeight: 1.6, padding: '10px 14px' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(200,255,0,0.4)' }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = B }} />
      </div>

      {/* Cor */}
      <div>
        <p style={{ fontFamily: ff, fontSize: 12, color: M, margin: '0 0 8px' }}>Cor principal</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {PALETTE.map((c) => (
            <button key={c} onClick={() => setCor(c)}
              style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: c, border: 'none', cursor: 'pointer', outline: cor === c ? `2px solid ${A}` : '2px solid transparent', outlineOffset: 2 }} />
          ))}
          <input type="color" value={cor} onChange={(e) => setCor(e.target.value)}
            style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${B}`, cursor: 'pointer', padding: 0, background: 'transparent' }} />
        </div>
      </div>

      {/* Estilo visual */}
      <div>
        <p style={{ fontFamily: ff, fontSize: 12, color: M, margin: '0 0 8px' }}>Estilo visual</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {STYLES.map((st) => {
            const sel = estilo === st.slug
            return (
              <button key={st.slug} onClick={() => setEstilo(st.slug)}
                style={{ background: sel ? 'rgba(200,255,0,0.06)' : S2, border: `2px solid ${sel ? A : B}`, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', padding: 0, textAlign: 'left', transition: 'all 0.15s' }}>
                <div style={{ height: 36, background: st.bg }} />
                <p style={{ fontSize: 11, fontWeight: 700, color: sel ? A : T, fontFamily: ff, margin: 0, padding: '6px 10px 8px' }}>{st.label}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Fonte */}
      <div>
        <p style={{ fontFamily: ff, fontSize: 12, color: M, margin: '0 0 8px' }}>Fonte principal</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FONTS.map((f) => {
            const sel = fonte === f.value
            return (
              <button key={f.value} onClick={() => setFonte(f.value)}
                style={{ height: 36, padding: '0 14px', borderRadius: 8, background: sel ? 'rgba(200,255,0,0.1)' : S2, border: `1px solid ${sel ? 'rgba(200,255,0,0.4)' : B}`, color: sel ? A : M, fontFamily: f.value, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}>
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      <SaveBtn onClick={save} saving={saving} label="Salvar voz & estilo" />
    </Section>
  )
}

// ─── Aba: Telegram ────────────────────────────────────────────
function TabTelegram({ profile, userId }: { profile: Profile; userId: string }) {
  const [chatId,    setChatId]    = useState(profile.telegram_chat_id ?? '')
  const [saving,    setSaving]    = useState(false)
  const [testing,   setTesting]   = useState(false)

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ telegram_chat_id: chatId.trim() || null }).eq('user_id', userId)
    setSaving(false)
    if (error) { toast.error('Erro ao salvar'); return }
    toast.success('Chat ID salvo')
  }

  const test = async () => {
    if (!chatId.trim()) return
    setTesting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { toast.error('Sessão expirada'); return }
      const res  = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId, message_type: 'limit_warning' }),
      })
      const data = await res.json()
      if (data.error === 'telegram_not_configured') toast.error('Salve o chat_id antes de testar.')
      else if (data.error === 'telegram_send_failed') toast.error('Falha ao enviar. Verifique o chat_id.')
      else if (data.success) toast.success('Mensagem de teste enviada')
      else toast.error('Erro desconhecido')
    } catch { toast.error('Erro de rede') }
    finally { setTesting(false) }
  }

  const connected = !!profile.telegram_chat_id

  return (
    <Section title="Telegram">
      {connected && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981', flexShrink: 0 }} />
          <span style={{ fontFamily: ff, fontSize: 13, color: '#10B981', fontWeight: 600 }}>Conectado</span>
        </div>
      )}

      <div style={{ background: S2, border: `1px solid ${B}`, borderRadius: 10, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ fontFamily: ffd, fontSize: 14, color: T, margin: 0, letterSpacing: 0.5 }}>COMO CONFIGURAR</p>
        {[
          '1. Abra o Telegram',
          '2. Busque @userinfobot',
          '3. Envie qualquer mensagem',
          '4. Copie o ID numérico que aparecer',
          '5. Cole no campo abaixo e salve',
        ].map((step, i) => (
          <p key={i} style={{ fontFamily: ff, fontSize: 13, color: M, margin: 0, lineHeight: 1.5 }}>{step}</p>
        ))}
      </div>

      <Field label="Chat ID" value={chatId} onChange={setChatId} placeholder="Ex: 123456789" />

      <div style={{ display: 'flex', gap: 10 }}>
        <SaveBtn onClick={save} saving={saving} label="Salvar" />
        <button onClick={test} disabled={testing || !chatId.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: `1px solid ${!chatId.trim() ? B : 'rgba(255,255,255,0.2)'}`, borderRadius: 8, padding: '10px 20px', fontFamily: ff, fontSize: 13, color: !chatId.trim() ? M : T, cursor: (!chatId.trim() || testing) ? 'default' : 'pointer', opacity: testing ? 0.7 : 1, transition: 'all 0.15s' }}
          onMouseEnter={(e) => { if (chatId.trim() && !testing) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = !chatId.trim() ? B : 'rgba(255,255,255,0.2)' }}>
          {testing ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Enviando...</> : <><Send size={14} /> Testar notificação</>}
        </button>
      </div>
    </Section>
  )
}

// ─── Aba: Plano ───────────────────────────────────────────────
function TabPlano({ profile }: { profile: Profile }) {
  const plan        = (profile.plan ?? 'free') as Plan
  const exportsUsed = profile.exports_used_this_month ?? 0
  const exportsLim  = profile.exports_limit ?? 3
  const exportPct   = Math.min(100, (exportsUsed / Math.max(1, exportsLim)) * 100)
  const exportColor = exportPct >= 90 ? '#EF4444' : exportPct >= 70 ? '#F59E0B' : A
  const aiUsed      = profile.ai_images_used_this_month ?? 0
  const aiLim       = profile.ai_images_limit ?? 0
  const aiPct       = aiLim > 0 ? Math.min(100, (aiUsed / aiLim) * 100) : 0
  const aiColor     = aiPct >= 90 ? '#EF4444' : aiPct >= 70 ? '#F59E0B' : '#00B4D8'
  const isUnlimited = plan === 'profissional' || plan === 'agencia'

  const visibleUpgrades = PLAN_UPGRADES.filter((u) => {
    if (plan === 'free')         return true
    if (plan === 'criador')      return u.plan === 'profissional' || u.plan === 'agencia'
    if (plan === 'profissional') return u.plan === 'agencia'
    return false
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Section title="Plano atual">
        {/* Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ border: `1px solid ${PLAN_COLORS[plan]}`, borderRadius: 6, padding: '5px 14px', display: 'inline-flex' }}>
            <span style={{ fontFamily: ffd, fontSize: 16, letterSpacing: 1, color: PLAN_COLORS[plan] }}>{PLAN_LABELS[plan]}</span>
          </div>
          <span style={{ fontFamily: ff, fontSize: 12, color: M }}>{plan === 'free' ? 'Gratuito' : 'Renova em 30 dias'}</span>
        </div>

        {/* Exportações */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: ff, fontSize: 12, color: M }}>Exportações este mês</span>
            <span style={{ fontFamily: ff, fontSize: 12, color: T, fontWeight: 600 }}>
              {isUnlimited ? 'Ilimitadas' : `${exportsUsed} / ${exportsLim}`}
            </span>
          </div>
          {!isUnlimited && (
            <div style={{ height: 5, borderRadius: 3, background: B, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${exportPct}%`, background: exportColor, borderRadius: 3, transition: 'width 0.4s' }} />
            </div>
          )}
        </div>

        {/* Imagens IA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: ff, fontSize: 12, color: M }}>Imagens IA este mês</span>
            <span style={{ fontFamily: ff, fontSize: 12, color: aiLim > 0 ? T : 'rgba(255,255,255,0.2)', fontWeight: 600 }}>
              {aiLim > 0 ? `${aiUsed} / ${aiLim}` : 'Não incluso'}
            </span>
          </div>
          {aiLim > 0 && (
            <div style={{ height: 5, borderRadius: 3, background: B, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${aiPct}%`, background: aiColor, borderRadius: 3, transition: 'width 0.4s' }} />
            </div>
          )}
        </div>
      </Section>

      {visibleUpgrades.length > 0 && (
        <Section title="Fazer upgrade">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visibleUpgrades.map((u) => (
              <a key={u.plan} href={u.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div style={{ background: S2, border: `1px solid ${B}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(200,255,0,0.3)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = B }}>
                  <div>
                    <p style={{ fontFamily: ffd, fontSize: 15, color: T, margin: '0 0 4px', letterSpacing: 1 }}>{u.label}</p>
                    <p style={{ fontFamily: ff, fontSize: 11, color: M, margin: 0 }}>{u.features.join(' · ')}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontFamily: ffd, fontSize: 16, color: A, letterSpacing: 1 }}>{u.price}</span>
                    <span style={{ fontFamily: ff, fontSize: 10, color: '#000', background: A, borderRadius: 4, padding: '2px 7px', fontWeight: 700 }}>ASSINAR</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </Section>
      )}

      {plan === 'agencia' && (
        <Section title="Plano máximo">
          <p style={{ fontFamily: ff, fontSize: 13, color: M, margin: 0 }}>
            Você está no plano máximo. Precisa de mais?{' '}
            <a href="mailto:contato@conteudos.tech" style={{ color: A, textDecoration: 'none' }}>Fale com a gente.</a>
          </p>
        </Section>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────
export default function Settings() {
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState<Tab>('perfil')

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) setProfile(data as Profile)
      setLoading(false)
    })
  }, [user])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={28} color={A} style={{ animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!profile || !user) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BG, fontFamily: ff }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Sidebar ── */}
      <aside style={{ width: 220, flexShrink: 0, background: S, borderRight: `1px solid ${B}`, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '22px 20px 16px', borderBottom: `1px solid ${B}` }}>
          <button onClick={() => navigate('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: M, fontFamily: ff, fontSize: 13, padding: 0, marginBottom: 16 }}>
            <ChevronLeft size={14} /> Dashboard
          </button>
          <span style={{ fontFamily: ffd, fontSize: 20, color: T, letterSpacing: 1 }}>
            Conteúd<span style={{ color: A }}>OS</span>
          </span>
        </div>

        {/* Tabs */}
        <nav style={{ flex: 1, padding: '10px 0' }}>
          {TABS.map(({ key, label, icon }) => {
            const active = tab === key
            return (
              <button key={key} onClick={() => setTab(key)}
                style={{ width: '100%', background: active ? 'rgba(200,255,0,0.06)' : 'none', border: 'none', borderLeft: `3px solid ${active ? A : 'transparent'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 20px 11px 17px', color: active ? T : M, transition: 'background 0.15s, color 0.15s' }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'none' }}>
                {icon}
                <span style={{ fontFamily: ff, fontSize: 14 }}>{label}</span>
              </button>
            )
          })}
        </nav>

        {/* Plan badge */}
        <div style={{ padding: '16px 16px 24px', borderTop: `1px solid ${B}` }}>
          <div style={{ border: `1px solid ${PLAN_COLORS[(profile.plan ?? 'free') as Plan]}`, borderRadius: 6, padding: '6px 12px', display: 'inline-flex' }}>
            <span style={{ fontFamily: ffd, fontSize: 13, letterSpacing: 1, color: PLAN_COLORS[(profile.plan ?? 'free') as Plan] }}>
              {PLAN_LABELS[(profile.plan ?? 'free') as Plan]}
            </span>
          </div>
        </div>
      </aside>

      {/* ── Content ── */}
      <main style={{ flex: 1, minWidth: 0, padding: '40px 48px', overflowY: 'auto' }}>
        <h1 style={{ fontFamily: ffd, fontSize: 30, color: T, margin: '0 0 28px', letterSpacing: 1 }}>
          {TABS.find((t) => t.key === tab)?.label ?? 'Configurações'}
        </h1>

        <div style={{ maxWidth: 600 }}>
          {tab === 'perfil'   && <TabPerfil   profile={profile} userId={user.id} />}
          {tab === 'voz'      && <TabVoz      profile={profile} userId={user.id} />}
          {tab === 'telegram' && <TabTelegram profile={profile} userId={user.id} />}
          {tab === 'plano'    && <TabPlano    profile={profile} />}
        </div>
      </main>
    </div>
  )
}
