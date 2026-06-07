-- Distinguir pagantes orgânicos (via Cakto webhook) de planos atribuídos manualmente
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_source text NOT NULL DEFAULT 'manual'
    CHECK (subscription_source IN ('manual', 'webhook'));

-- Email duplicado em profiles para acesso admin sem precisar da API de auth
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email text;

-- Trigger: mantém email sincronizado quando auth.users é inserido/atualizado
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET email = NEW.email WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_sync ON auth.users;
CREATE TRIGGER on_auth_user_email_sync
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_profile_email();

-- Backfill email dos usuários existentes
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id
  AND p.email IS NULL;
