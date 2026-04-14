-- ============================================================
-- ConteudOS — Initial Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- 1. TABELAS
-- ============================================================

CREATE TABLE public.organizations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name             text NOT NULL,
  plan             text DEFAULT 'agency',
  seats_used       int DEFAULT 1,
  seats_limit      int DEFAULT 5,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE public.profiles (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  organization_id          uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  role                     text DEFAULT 'owner',
  display_name             text,
  instagram_handle         text,
  niche                    text,
  voice_profile            jsonb DEFAULT '{}',
  visual_kit               jsonb DEFAULT '{"cor":"#00B4D8","estilo":"dark","fonte":"DM Sans"}',
  plan                     text DEFAULT 'free',
  exports_used_this_month  int DEFAULT 0,
  exports_limit            int DEFAULT 1,
  onboarding_completed     boolean DEFAULT false,
  telegram_chat_id         text,
  created_at               timestamptz DEFAULT now()
);

CREATE TABLE public.content_analyses (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  input_url      text,
  input_text     text,
  analysis_json  jsonb DEFAULT '{}',
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE public.carousels (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id    uuid REFERENCES public.content_analyses(id) ON DELETE SET NULL,
  tema           text NOT NULL,
  tom            text DEFAULT 'provocador',
  num_slides     int DEFAULT 7,
  slides_json    jsonb DEFAULT '[]',
  legenda        text,
  html_url       text,
  preview_token  uuid DEFAULT gen_random_uuid(),
  has_watermark  boolean DEFAULT true,
  status         text DEFAULT 'draft',
  exported_at    timestamptz,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE public.carousel_slides (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carousel_id    uuid REFERENCES public.carousels(id) ON DELETE CASCADE,
  position       int NOT NULL,
  titulo         text,
  corpo          text,
  hack_aplicado  text,
  bg_image_url   text,
  custom_styles  jsonb DEFAULT '{}'
);

CREATE TABLE public.usage_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action       text NOT NULL,
  tokens_used  int DEFAULT 0,
  cost_brl     decimal(10,4) DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE public.scheduled_posts (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  carousel_id            uuid REFERENCES public.carousels(id) ON DELETE SET NULL,
  tema                   text,
  scheduled_at           timestamptz NOT NULL,
  notify_minutes_before  int DEFAULT 10,
  telegram_notified      boolean DEFAULT false,
  status                 text DEFAULT 'pending',
  created_at             timestamptz DEFAULT now()
);

CREATE TABLE public.weekly_trends (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nicho       text NOT NULL,
  week_start  date NOT NULL,
  temas       jsonb DEFAULT '[]',
  created_at  timestamptz DEFAULT now(),
  UNIQUE(nicho, week_start)
);

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.organizations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousels        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousel_slides  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_trends    ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------
-- organizations
-- ----------------------------------------
CREATE POLICY "organizations: owner select"
  ON public.organizations FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "organizations: owner update"
  ON public.organizations FOR UPDATE
  USING (auth.uid() = owner_user_id);

-- ----------------------------------------
-- profiles
-- ----------------------------------------
CREATE POLICY "profiles: owner select"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "profiles: owner insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles: owner update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "profiles: owner delete"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------
-- content_analyses
-- ----------------------------------------
CREATE POLICY "content_analyses: owner select"
  ON public.content_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "content_analyses: owner insert"
  ON public.content_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "content_analyses: owner update"
  ON public.content_analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "content_analyses: owner delete"
  ON public.content_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------
-- carousels
-- ----------------------------------------
CREATE POLICY "carousels: owner select"
  ON public.carousels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "carousels: owner insert"
  ON public.carousels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "carousels: owner update"
  ON public.carousels FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "carousels: owner delete"
  ON public.carousels FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------
-- carousel_slides (via JOIN com carousels)
-- ----------------------------------------
CREATE POLICY "carousel_slides: owner select"
  ON public.carousel_slides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.carousels c
      WHERE c.id = carousel_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "carousel_slides: owner insert"
  ON public.carousel_slides FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carousels c
      WHERE c.id = carousel_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "carousel_slides: owner update"
  ON public.carousel_slides FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.carousels c
      WHERE c.id = carousel_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "carousel_slides: owner delete"
  ON public.carousel_slides FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.carousels c
      WHERE c.id = carousel_id AND c.user_id = auth.uid()
    )
  );

-- ----------------------------------------
-- usage_logs
-- ----------------------------------------
CREATE POLICY "usage_logs: owner select"
  ON public.usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "usage_logs: owner insert"
  ON public.usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "usage_logs: owner update"
  ON public.usage_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "usage_logs: owner delete"
  ON public.usage_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------
-- scheduled_posts
-- ----------------------------------------
CREATE POLICY "scheduled_posts: owner select"
  ON public.scheduled_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "scheduled_posts: owner insert"
  ON public.scheduled_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "scheduled_posts: owner update"
  ON public.scheduled_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "scheduled_posts: owner delete"
  ON public.scheduled_posts FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------
-- weekly_trends
-- ----------------------------------------
CREATE POLICY "weekly_trends: public select"
  ON public.weekly_trends FOR SELECT
  USING (true);

CREATE POLICY "weekly_trends: service_role insert"
  ON public.weekly_trends FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "weekly_trends: service_role update"
  ON public.weekly_trends FOR UPDATE
  USING (auth.role() = 'service_role');

-- ============================================================
-- 3. TRIGGER — cria profile automaticamente após signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- 4. FUNÇÃO — reset mensal de exports (chamar via cron ou Edge Function)
-- ============================================================

CREATE OR REPLACE FUNCTION public.reset_monthly_exports()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles SET exports_used_this_month = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
