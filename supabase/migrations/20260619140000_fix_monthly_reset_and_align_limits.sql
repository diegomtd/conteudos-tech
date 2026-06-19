-- ─────────────────────────────────────────────────────────────────────────────
-- FIX CRÍTICO: reset mensal de cota
--
-- Problema 1: reset_monthly_exports() não zerava carousels_used_this_month.
-- Problema 2: nenhum cron chamava a função → cotas nunca resetavam → clientes
--             pagantes eram bloqueados permanentemente ao bater o teto.
--
-- Solução: função reset_monthly_usage() que zera os 3 contadores + agendamento
-- pg_cron no dia 1 de cada mês às 00:00 (horário do servidor / UTC).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET exports_used_this_month   = 0,
      ai_images_used_this_month = 0,
      carousels_used_this_month = 0;
END;
$$;

-- Mantém a função antiga funcional (backward compat): agora delega para a nova
CREATE OR REPLACE FUNCTION public.reset_monthly_exports()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.reset_monthly_usage();
END;
$$;

-- Agenda o reset no dia 1 de cada mês (idempotente: remove agendamento anterior)
SELECT cron.unschedule('reset-monthly-usage')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reset-monthly-usage');

SELECT cron.schedule(
  'reset-monthly-usage',
  '0 0 1 * *',
  $$SELECT public.reset_monthly_usage();$$
);

-- Alinha plan_limits (cardápio) com o limite real aplicado nos profiles: 200
UPDATE public.plan_limits SET ai_images_per_month = 200 WHERE plan = 'agencia';
