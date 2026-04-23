-- ============================================================
-- ConteudOS — Migration 003
-- Policy pública para preview de carrossel por token
-- ============================================================

-- Permite que qualquer pessoa (sem auth) leia um carrossel pelo preview_token
-- Usado pela página /preview/:token
CREATE POLICY "carousels: public preview by token"
  ON public.carousels FOR SELECT
  USING (true);

-- Permite leitura pública dos slides de um carrossel público
CREATE POLICY "carousel_slides: public preview select"
  ON public.carousel_slides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.carousels c
      WHERE c.id = carousel_id
    )
  );
