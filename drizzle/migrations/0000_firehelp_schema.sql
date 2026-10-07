-- ENUMS
CREATE TYPE public.app_role AS ENUM ('user','moderator','admin');
CREATE TYPE public.fire_type AS ENUM ('florestal','residencial','comercial','veicular','queimada','outro');
CREATE TYPE public.fire_severity AS ENUM ('pequeno','medio','grande','emergencia');
CREATE TYPE public.fire_status AS ENUM ('pending','verified','active','resolved','false_report');
CREATE TYPE public.news_category AS ENUM ('prevencao','incendios','meio_ambiente','seguranca','alertas','comunidade');
CREATE TYPE public.forum_category AS ENUM ('incendios','meio_ambiente','prevencao','seguranca','alertas','comunidade','geral');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'Usuário',
  email TEXT,
  avatar_url TEXT,
  blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE VIEW public.public_profiles AS SELECT id, full_name, avatar_url, created_at FROM public.profiles;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','moderator'))
$$;

CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email,'usuario'),'@',1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  ) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- FIRE REPORTS
CREATE TABLE public.fire_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol TEXT NOT NULL UNIQUE DEFAULT ('FH-' || upper(substr(md5(random()::text),1,8))),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type public.fire_type NOT NULL,
  severity public.fire_severity NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  status public.fire_status NOT NULL DEFAULT 'pending',
  is_demo BOOLEAN NOT NULL DEFAULT false,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fr_lat ON public.fire_reports(latitude);
CREATE INDEX idx_fr_lng ON public.fire_reports(longitude);
CREATE INDEX idx_fr_status ON public.fire_reports(status);
CREATE INDEX idx_fr_reported ON public.fire_reports(reported_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fire_reports TO authenticated;
GRANT SELECT ON public.fire_reports TO anon;
GRANT ALL ON public.fire_reports TO service_role;
ALTER TABLE public.fire_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports public read" ON public.fire_reports FOR SELECT USING (true);
CREATE POLICY "reports insert own" ON public.fire_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reports update own pending" ON public.fire_reports FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status = 'pending') WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reports staff manage" ON public.fire_reports FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "reports staff delete" ON public.fire_reports FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.fire_report_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fire_report_id UUID NOT NULL REFERENCES public.fire_reports(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fri_report ON public.fire_report_images(fire_report_id);
GRANT SELECT, INSERT, DELETE ON public.fire_report_images TO authenticated;
GRANT SELECT ON public.fire_report_images TO anon;
GRANT ALL ON public.fire_report_images TO service_role;
ALTER TABLE public.fire_report_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "images public read" ON public.fire_report_images FOR SELECT USING (true);
CREATE POLICY "images insert own" ON public.fire_report_images FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.fire_reports r WHERE r.id = fire_report_id AND r.user_id = auth.uid()));
CREATE POLICY "images staff delete" ON public.fire_report_images FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- NEWS
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  content TEXT,
  image_url TEXT,
  category public.news_category NOT NULL DEFAULT 'comunidade',
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_news_cat ON public.news(category);
CREATE INDEX idx_news_created ON public.news(created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT SELECT ON public.news TO anon;
GRANT ALL ON public.news TO service_role;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news public read" ON public.news FOR SELECT USING (published = true OR public.is_staff(auth.uid()));
CREATE POLICY "news staff write" ON public.news FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- FORUM
CREATE TABLE public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category public.forum_category NOT NULL DEFAULT 'geral',
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fp_cat ON public.forum_posts(category);
CREATE INDEX idx_fp_created ON public.forum_posts(created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_posts TO authenticated;
GRANT SELECT ON public.forum_posts TO anon;
GRANT ALL ON public.forum_posts TO service_role;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts public read" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "posts insert own" ON public.forum_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts update own" ON public.forum_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts delete own or staff" ON public.forum_posts FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE TABLE public.forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fc_post ON public.forum_comments(post_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_comments TO authenticated;
GRANT SELECT ON public.forum_comments TO anon;
GRANT ALL ON public.forum_comments TO service_role;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments public read" ON public.forum_comments FOR SELECT USING (true);
CREATE POLICY "comments insert own" ON public.forum_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments delete own or staff" ON public.forum_comments FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE TABLE public.forum_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id),
  UNIQUE (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.forum_likes TO authenticated;
GRANT SELECT ON public.forum_likes TO anon;
GRANT ALL ON public.forum_likes TO service_role;
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes public read" ON public.forum_likes FOR SELECT USING (true);
CREATE POLICY "likes own write" ON public.forum_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes own delete" ON public.forum_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- CONTENT REPORTS
CREATE TABLE public.content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_reports TO authenticated;
GRANT ALL ON public.content_reports TO service_role;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creports insert" ON public.content_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "creports read staff or own" ON public.content_reports FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR auth.uid() = reporter_id);
CREATE POLICY "creports staff update" ON public.content_reports FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- DEMO DATA
INSERT INTO public.news (title, slug, summary, content, image_url, category, author_name, is_demo) VALUES
('Como preparar sua casa para a temporada seca','preparar-casa-temporada-seca','Medidas simples reduzem drasticamente o risco de incêndio residencial.','A temporada seca aumenta o risco de incêndios. Mantenha calhas limpas, evite acúmulo de folhas secas, revise instalações elétricas e mantenha um extintor acessível. Crie uma faixa livre de vegetação ao redor da casa e combine um ponto de encontro com a família.','https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200','prevencao','Equipe FIREHELP',true),
('Queimadas urbanas: por que denunciar faz diferença','queimadas-urbanas-denunciar','Registros da comunidade ajudam autoridades a priorizar áreas críticas.','Cada ocorrência registrada gera um mapa de calor que orienta o trabalho de prevenção. Ao reportar uma queimada você ajuda a identificar padrões e áreas de reincidência.','https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=1200','incendios','Equipe FIREHELP',true),
('Alerta: risco elevado de incêndio florestal nesta semana','alerta-risco-elevado-semana','Baixa umidade e ventos fortes elevam o risco em áreas de mata.','Órgãos ambientais apontam umidade relativa abaixo de 30% nos próximos dias. Evite qualquer uso de fogo em áreas abertas e redobre a atenção com bitucas de cigarro e vidros expostos ao sol.','https://images.unsplash.com/photo-1600679472829-3044539ce8ed?w=1200','alertas','Equipe FIREHELP',true),
('Recuperação de áreas verdes após o fogo','recuperacao-areas-verdes','O que a comunidade pode fazer para ajudar na regeneração.','A regeneração começa com a proteção do solo. Ações comunitárias de plantio, cercamento e monitoramento aceleram a recuperação da vegetação nativa.','https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200','meio_ambiente','Equipe FIREHELP',true),
('Extintores: qual usar em cada tipo de incêndio','extintores-qual-usar','Conhecer as classes de fogo evita acidentes graves.','Classe A para sólidos, B para líquidos inflamáveis e C para equipamentos elétricos. O extintor ABC atende à maioria das situações domésticas.','https://images.unsplash.com/photo-1582139329536-e7284fece509?w=1200','seguranca','Equipe FIREHELP',true);

INSERT INTO public.fire_reports (type, severity, description, latitude, longitude, address, status, is_demo) VALUES
('florestal','grande','Foco de incêndio em área de mata com fumaça densa visível a quilômetros.',-23.5489,-46.6388,'Zona Norte, São Paulo - SP','active',true),
('queimada','medio','Queimada de lixo em terreno baldio próximo a residências.',-23.5629,-46.6544,'Bela Vista, São Paulo - SP','pending',true),
('residencial','emergencia','Princípio de incêndio em cozinha, bombeiros acionados.',-23.5905,-46.6820,'Pinheiros, São Paulo - SP','resolved',true),
('veicular','pequeno','Veículo com princípio de incêndio no acostamento.',-23.5320,-46.6100,'Av. Marginal, São Paulo - SP','verified',true),
('comercial','grande','Fumaça saindo de galpão comercial desativado.',-23.6100,-46.6300,'Ipiranga, São Paulo - SP','active',true);

INSERT INTO public.forum_posts (title, content, category, author_name, is_demo) VALUES
('Quem mais sentiu cheiro de queimado na região norte?','Desde ontem à noite o cheiro está muito forte por aqui. Alguém sabe de algum foco ativo?','incendios','Morador demo',true),
('Dicas para proteger o quintal na seca','Estou limpando folhas secas toda semana. O que mais vocês fazem?','prevencao','Morador demo',true),
('Mutirão de limpeza de terreno baldio','Estamos organizando um mutirão no próximo sábado. Quem quiser ajudar comente aqui.','comunidade','Morador demo',true),
('Números úteis de emergência','Bombeiros 193, Defesa Civil 199. Vale deixar salvo no celular.','seguranca','Morador demo',true),
('Regeneração da mata após o incêndio do ano passado','A vegetação está voltando devagar. Alguém acompanha a área?','meio_ambiente','Morador demo',true);