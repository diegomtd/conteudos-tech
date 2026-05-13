-- Tarefa 1: Reformular planos e limites
-- Renomeia criador→construtor, profissional→escala
-- Adiciona colunas faltantes e centraliza limites em plan_limits

-- 1. Adicionar colunas faltantes em profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS price_brl integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS carousels_limit integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS carousels_used_this_month integer DEFAULT 0;

-- 2. Renomear planos existentes
UPDATE profiles SET plan = 'construtor' WHERE plan = 'criador';
UPDATE profiles SET plan = 'escala'     WHERE plan = 'profissional';

-- 3. Atualizar defaults das colunas
ALTER TABLE profiles
  ALTER COLUMN carousels_limit SET DEFAULT 3,
  ALTER COLUMN exports_limit   SET DEFAULT 0,
  ALTER COLUMN ai_images_limit SET DEFAULT 3;

-- 4. Aplicar limites corretos por plano
UPDATE profiles SET
  price_brl       = CASE plan
    WHEN 'free'        THEN 0
    WHEN 'construtor'  THEN 47
    WHEN 'escala'      THEN 97
    WHEN 'agencia'     THEN 197
    ELSE 0 END,
  carousels_limit = CASE plan
    WHEN 'free'        THEN 3
    WHEN 'construtor'  THEN 30
    WHEN 'escala'      THEN 100
    WHEN 'agencia'     THEN 999999
    ELSE 3 END,
  exports_limit   = CASE plan
    WHEN 'free'        THEN 0
    WHEN 'construtor'  THEN 999999
    WHEN 'escala'      THEN 999999
    WHEN 'agencia'     THEN 999999
    ELSE 0 END,
  ai_images_limit = CASE plan
    WHEN 'free'        THEN 3
    WHEN 'construtor'  THEN 20
    WHEN 'escala'      THEN 60
    WHEN 'agencia'     THEN 200
    ELSE 3 END;

-- 5. Criar tabela centralizada de limites por plano
CREATE TABLE IF NOT EXISTS plan_limits (
  plan                text PRIMARY KEY,
  price_brl           integer NOT NULL DEFAULT 0,
  carousels_per_month integer NOT NULL DEFAULT 3,
  exports_per_month   integer NOT NULL DEFAULT 0,
  ai_images_per_month integer NOT NULL DEFAULT 3,
  max_slides          integer NOT NULL DEFAULT 7,
  has_watermark       boolean NOT NULL DEFAULT true,
  workspaces          integer NOT NULL DEFAULT 1,
  label               text    NOT NULL DEFAULT 'Free'
);

INSERT INTO plan_limits VALUES
  ('free',        0,   3,      0,      3,   7,  true,  1, 'Grátis'),
  ('construtor',  47,  30,     999999, 20,  10, false, 1, 'Construtor'),
  ('escala',      97,  100,    999999, 60,  12, false, 1, 'Escala'),
  ('agencia',     197, 999999, 999999, 200, 15, false, 3, 'Agência')
ON CONFLICT (plan) DO UPDATE SET
  price_brl           = EXCLUDED.price_brl,
  carousels_per_month = EXCLUDED.carousels_per_month,
  exports_per_month   = EXCLUDED.exports_per_month,
  ai_images_per_month = EXCLUDED.ai_images_per_month,
  max_slides          = EXCLUDED.max_slides,
  has_watermark       = EXCLUDED.has_watermark,
  workspaces          = EXCLUDED.workspaces,
  label               = EXCLUDED.label;
