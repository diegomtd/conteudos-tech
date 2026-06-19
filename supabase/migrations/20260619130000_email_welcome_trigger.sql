-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger: envia e-mail de boas-vindas quando um novo profile é criado.
-- Usa pg_net (já instalado) para chamar a edge function send-email de forma
-- assíncrona (fire-and-forget), sem bloquear o INSERT.
--
-- ATENÇÃO: a edge function send-email valida que o email existe em profiles
-- E que o profile foi criado há menos de 15 min antes de enviar.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url text := 'https://klqfdgstclcqalhvhciv.supabase.co';
  v_anon_key     text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtscWZkZ3N0Y2xjcWFsaHZoY2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxOTQyMTcsImV4cCI6MjA5MTc3MDIxN30.WspcHOwyYowpsVbKkdJTpB4GSZKCaTCYN6Hldei-V9U';
BEGIN
  -- Só dispara se o email estiver preenchido
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url     := v_supabase_url || '/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_anon_key
    ),
    body    := jsonb_build_object(
      'type',  'welcome',
      'email', NEW.email,
      'name',  COALESCE(NEW.display_name, split_part(NEW.email, '@', 1))
    )::text
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Nunca bloqueia o INSERT por falha de e-mail
  RAISE WARNING '[trigger_welcome_email] falha ao chamar send-email: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Remove trigger anterior se existir (idempotente)
DROP TRIGGER IF EXISTS on_profile_created_send_welcome ON public.profiles;

CREATE TRIGGER on_profile_created_send_welcome
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_welcome_email();
