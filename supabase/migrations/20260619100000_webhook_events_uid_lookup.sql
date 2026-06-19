-- ──────────────────────────────────────────────────────────────
-- webhook_events: idempotência de eventos da Cakto
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    text        UNIQUE NOT NULL,
  event_type  text        NOT NULL,
  email       text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- Sem policies públicas — só service_role acessa via webhook

-- ──────────────────────────────────────────────────────────────
-- get_uid_by_email: lookup O(1) em auth.users
-- Evita listUsers() que pagina a 1000 e quebra em escala
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_uid_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM auth.users WHERE email = p_email LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_uid_by_email(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_uid_by_email(text) TO service_role;
