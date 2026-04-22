-- ============================================================
-- ConteudOS — Migration 002
-- Adiciona campos de imagens IA e corrige limites por plano
-- ============================================================

-- Campos de imagens IA (podem já existir no banco via dashboard)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_images_limit          int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_images_used_this_month int DEFAULT 0;

-- Inclui ai_images_used_this_month no reset mensal
CREATE OR REPLACE FUNCTION public.reset_monthly_exports()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET exports_used_this_month       = 0,
      ai_images_used_this_month     = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualiza limites corretos por plano para todos os profiles existentes
UPDATE public.profiles SET
  ai_images_limit = CASE plan
    WHEN 'free'          THEN 0
    WHEN 'criador'       THEN 20
    WHEN 'profissional'  THEN 60
    WHEN 'agencia'       THEN 200
    ELSE 0 END,
  exports_limit = CASE plan
    WHEN 'free'          THEN 3
    WHEN 'criador'       THEN 20
    WHEN 'profissional'  THEN 999999
    WHEN 'agencia'       THEN 999999
    ELSE 3 END;
