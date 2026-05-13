-- Corrigir status dos carrosseis que têm slides mas ficaram como draft
UPDATE carousels c
SET status = 'ready'
WHERE status = 'draft'
  AND EXISTS (
    SELECT 1 FROM carousel_slides cs WHERE cs.carousel_id = c.id
  );

-- Recalcular carousels_used_this_month para cada usuário baseado no mês atual
UPDATE profiles p
SET carousels_used_this_month = (
  SELECT COUNT(*) FROM carousels c
  WHERE c.user_id = p.user_id
    AND c.created_at >= date_trunc('month', NOW())
);

-- Função RPC para incremento atômico (evita race condition e null)
CREATE OR REPLACE FUNCTION increment_counter(p_user_id uuid, p_field text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format(
    'UPDATE profiles SET %I = COALESCE(%I, 0) + 1 WHERE user_id = $1',
    p_field, p_field
  ) USING p_user_id;
END;
$$;
