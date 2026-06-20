-- Cache de pré-visualizações de ideias (capa + slide 2 reais gerados pela IA).
-- Permite mostrar prévias no dashboard e reaproveitar EXATAMENTE os 2 slides
-- como "seed" quando o usuário escolhe o tema (generate-carousel mode=full).
CREATE TABLE IF NOT EXISTS public.topic_previews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tema        text NOT NULL,
  tom         text,
  template_id text,
  slides      jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tema)
);

ALTER TABLE public.topic_previews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "topic_previews: owner select"
  ON public.topic_previews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "topic_previews: owner write"
  ON public.topic_previews FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_topic_previews_user_tema
  ON public.topic_previews (user_id, tema);
