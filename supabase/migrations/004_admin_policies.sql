-- ============================================================
-- ConteudOS — Migration 004
-- Admin RLS policies + system_config table
-- ============================================================

-- ── Admin read/write policies (via user_metadata.role = 'admin') ──

CREATE POLICY "profiles: admin select all"
  ON public.profiles FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "profiles: admin update all"
  ON public.profiles FOR UPDATE
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "carousels: admin select all"
  ON public.carousels FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "carousel_slides: admin select all"
  ON public.carousel_slides FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "usage_logs: admin select all"
  ON public.usage_logs FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "scheduled_posts: admin select all"
  ON public.scheduled_posts FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ── system_config ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.system_config (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category  text NOT NULL,
  key       text NOT NULL,
  value     text,
  UNIQUE(category, key)
);

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_config: admin all"
  ON public.system_config FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Default config values
INSERT INTO public.system_config (category, key, value) VALUES
  ('cakto', 'url_criador',      'https://pay.cakto.com.br/criador'),
  ('cakto', 'url_profissional', 'https://pay.cakto.com.br/profissional'),
  ('cakto', 'url_agencia',      'https://pay.cakto.com.br/agencia'),
  ('telegram', 'bot_token',     ''),
  ('telegram', 'admin_chat_id', ''),
  ('ia', 'text_model',          'claude-sonnet-4-20250514'),
  ('ia', 'image_model',         'gemini-3.1-flash-image-preview'),
  ('ia', 'cost_per_1k_tokens',  '0.015'),
  ('geral', 'maintenance_mode', 'false'),
  ('geral', 'site_url',         'https://conteudos.tech')
ON CONFLICT (category, key) DO NOTHING;
