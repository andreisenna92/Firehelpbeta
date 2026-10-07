-- Profiles: public info, hide email
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, full_name, avatar_url, blocked, created_at, bio, last_seen_at) ON public.profiles TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_blocked(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT blocked FROM public.profiles WHERE id = _user_id), false)
$$;

-- Only staff may change "blocked"; staff can't block themselves
CREATE OR REPLACE FUNCTION public.guard_profile_block()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.blocked IS DISTINCT FROM OLD.blocked THEN
    IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
    IF NEW.id = auth.uid() THEN RAISE EXCEPTION 'Você não pode suspender a si mesmo'; END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS profiles_guard_block ON public.profiles;
CREATE TRIGGER profiles_guard_block BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.guard_profile_block();

CREATE POLICY "staff update profiles" ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Blocked users cannot write
DROP POLICY IF EXISTS "reports insert own" ON public.fire_reports;
CREATE POLICY "reports insert own" ON public.fire_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND NOT public.is_blocked(auth.uid()));
DROP POLICY IF EXISTS "posts insert own" ON public.forum_posts;
CREATE POLICY "posts insert own" ON public.forum_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND NOT public.is_blocked(auth.uid()));
DROP POLICY IF EXISTS "comments insert own" ON public.forum_comments;
CREATE POLICY "comments insert own" ON public.forum_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND NOT public.is_blocked(auth.uid()));
DROP POLICY IF EXISTS "likes own write" ON public.forum_likes;
CREATE POLICY "likes own write" ON public.forum_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND NOT public.is_blocked(auth.uid()));

-- Posts: photo + staff edit
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.forum_posts ADD COLUMN IF NOT EXISTS updated_at timestamptz;
CREATE POLICY "posts staff update" ON public.forum_posts FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Roles: no self-demotion
CREATE OR REPLACE FUNCTION public.guard_self_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.user_id = auth.uid() AND OLD.role IN ('admin','moderator') THEN
    RAISE EXCEPTION 'Você não pode remover sua própria função de gestor';
  END IF;
  RETURN OLD;
END $$;
DROP TRIGGER IF EXISTS user_roles_guard_self ON public.user_roles;
CREATE TRIGGER user_roles_guard_self BEFORE DELETE OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.guard_self_role();

-- Initial gestor
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email,'usuario'),'@',1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  IF lower(NEW.email) = 'luisandreisenna@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $function$;
INSERT INTO public.user_roles (user_id, role)
  SELECT id, 'admin' FROM auth.users WHERE lower(email) = 'luisandreisenna@gmail.com'
  ON CONFLICT DO NOTHING;

-- Status history
CREATE TABLE public.fire_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fire_report_id uuid NOT NULL REFERENCES public.fire_reports(id) ON DELETE CASCADE,
  old_status public.fire_status,
  new_status public.fire_status NOT NULL,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fire_status_history TO authenticated;
GRANT ALL ON public.fire_status_history TO service_role;
ALTER TABLE public.fire_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history staff read" ON public.fire_status_history FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE INDEX ON public.fire_status_history (fire_report_id);

CREATE OR REPLACE FUNCTION public.log_fire_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.fire_status_history (fire_report_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS fire_reports_status_log ON public.fire_reports;
CREATE TRIGGER fire_reports_status_log BEFORE UPDATE ON public.fire_reports FOR EACH ROW EXECUTE FUNCTION public.log_fire_status();

-- Private messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) BETWEEN 1 AND 4000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_id <> recipient_id)
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages read own" ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "messages send" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND NOT public.is_blocked(auth.uid()));
CREATE POLICY "messages mark read" ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);
CREATE INDEX ON public.messages (recipient_id, read_at);
CREATE INDEX ON public.messages (sender_id, created_at);

CREATE OR REPLACE FUNCTION public.guard_message_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.content <> OLD.content OR NEW.sender_id <> OLD.sender_id OR NEW.recipient_id <> OLD.recipient_id OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'Somente a leitura pode ser alterada';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER messages_guard_update BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.guard_message_update();