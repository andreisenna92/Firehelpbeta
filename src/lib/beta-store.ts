export type BetaFireReport = {
  id: string;
  protocol: string;
  user_id: string | null;
  type: string;
  severity: string;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  status: string;
  is_demo: boolean;
  reported_at: string;
  updated_at: string;
  fire_report_images: { image_url: string }[];
};

export type BetaNews = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  image_url: string | null;
  category: string;
  content_type: 'noticia' | 'alerta';
  author_id: string | null;
  author_name: string;
  published: boolean;
  created_at: string;
};

export type BetaUser = {
  id: string;
  full_name: string;
  email: string;
  cpf: string;
  password: string;
  avatar_url: string | null;
  created_at: string;
  blocked: boolean;
  role: 'admin' | 'moderator' | 'user';
};

const KEYS = {
  users: 'firehelpbeta_users',
  session: 'firehelpbeta_session',
  data: 'firehelpbeta_data',
};

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

function demoImage(kind: 'fire' | 'community' | 'nature') {
  const palette = kind === 'fire' ? ['#7f1d1d','#f97316','#facc15'] : kind === 'nature' ? ['#14532d','#22c55e','#bef264'] : ['#0f172a','#0ea5e9','#67e8f9'];
  const labels = { fire: 'PREVENÇÃO CONTRA INCÊNDIOS', community: 'COMUNIDADE FIREHELP', nature: 'PROTEÇÃO DA FAUNA E FLORA' };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="${palette[0]}"/><stop offset=".55" stop-color="${palette[1]}"/><stop offset="1" stop-color="${palette[2]}"/></linearGradient></defs><rect width="1200" height="675" fill="url(#g)"/><circle cx="980" cy="130" r="120" fill="white" opacity=".12"/><path d="M0 560 Q180 420 360 560 T720 560 T1200 520 V675 H0Z" fill="#000" opacity=".22"/><text x="70" y="520" fill="white" font-family="Arial" font-size="42" font-weight="700">${labels[kind]}</text><text x="72" y="575" fill="white" opacity=".85" font-family="Arial" font-size="24">FireHelp · Saquarema/RJ</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function seedData() {
  const existing = localStorage.getItem(KEYS.data);
  if (existing) {
    const parsed = JSON.parse(existing);
    if (Array.isArray(parsed.news)) {
      parsed.news = parsed.news.map((item: any, index: number) => ({
        ...item,
        content_type: item.content_type === 'alerta' ? 'alerta' : 'noticia',
        image_url: item.image_url || demoImage(index % 3 === 0 ? 'fire' : index % 3 === 1 ? 'community' : 'nature'),
      }));
    }
    if (Array.isArray(parsed.fire_reports)) {
      parsed.fire_reports = parsed.fire_reports.map((item: any) => ({
        ...item,
        fire_report_images: Array.isArray(item.fire_report_images) ? item.fire_report_images : [],
        updated_at: item.updated_at || item.reported_at || now(),
      }));
    }
    localStorage.setItem(KEYS.data, JSON.stringify(parsed));
    return parsed;
  }
  const data = {
    fire_reports: [
      { id: 'demo-report-1', protocol: 'FH-2026-00128', user_id: null, type: 'florestal', severity: 'grande', description: 'Foco de incêndio próximo à área de vegetação.', latitude: -22.935, longitude: -42.507, address: 'Bacaxá, Saquarema/RJ', status: 'active', is_demo: true, reported_at: now(), updated_at: now(), fire_report_images: [{ image_url: demoImage('fire') }] },
      { id: 'demo-report-2', protocol: 'FH-2026-00127', user_id: null, type: 'queimada', severity: 'medio', description: 'Fumaça intensa em terreno baldio.', latitude: -22.934, longitude: -42.492, address: 'Centro, Saquarema/RJ', status: 'pending', is_demo: true, reported_at: new Date(Date.now()-3600000).toISOString(), updated_at: now(), fire_report_images: [{ image_url: demoImage('fire') }] },
      { id: 'demo-report-3', protocol: 'FH-2026-00121', user_id: null, type: 'residencial', severity: 'baixo', description: 'Ocorrência controlada pela comunidade.', latitude: -22.900, longitude: -42.510, address: 'Itaúna, Saquarema/RJ', status: 'resolved', is_demo: true, reported_at: new Date(Date.now()-86400000).toISOString(), updated_at: now(), fire_report_images: [{ image_url: demoImage('fire') }] },
    ],
    news: [
      { id: 'demo-news-1', title: 'Como prevenir queimadas em períodos de estiagem', slug: 'como-prevenir-queimadas', summary: 'Cuidados simples ajudam a reduzir o risco de incêndios.', content: 'Evite queimar lixo, mantenha terrenos limpos e nunca deixe fogo sem supervisão. Em emergências, acione os serviços oficiais.', image_url: demoImage('fire'), category: 'prevencao', content_type: 'noticia', author_id: null, author_name: 'Equipe FireHelp', published: true, created_at: now() },
      { id: 'demo-news-2', title: 'FireHelp: comunidade conectada pela prevenção', slug: 'firehelpbeta-comunidade', summary: 'Informação rápida para proteger Saquarema.', content: 'A plataforma aproxima moradores, informação e gestão comunitária para apoiar a prevenção e o acompanhamento de ocorrências.', image_url: demoImage('community'), category: 'comunidade', content_type: 'noticia', author_id: null, author_name: 'Equipe FireHelp', published: true, created_at: new Date(Date.now()-3600000).toISOString() },
      { id: 'demo-news-3', title: 'Fauna e flora: por que prevenir incêndios?', slug: 'fauna-e-flora', summary: 'O fogo afeta diretamente os ecossistemas locais.', content: 'A prevenção protege áreas naturais, animais, vegetação e a qualidade ambiental do município.', image_url: demoImage('nature'), category: 'meio_ambiente', content_type: 'noticia', author_id: null, author_name: 'Equipe FireHelp', published: true, created_at: new Date(Date.now()-7200000).toISOString() },
    ],
    forum_posts: [
      { id: 'demo-post-1', title: 'Como podemos melhorar a prevenção no nosso bairro?', content: 'Compartilhe ideias, pontos de atenção e iniciativas comunitárias.', category: 'prevencao', author_name: 'Equipe FireHelp', user_id: null, is_demo: true, created_at: now() },
      { id: 'demo-post-2', title: 'Alerta sobre descarte de resíduos e queimadas', content: 'Vamos conversar sobre alternativas seguras para o descarte e limpeza de terrenos.', category: 'meio_ambiente', author_name: 'Morador de Saquarema', user_id: null, is_demo: true, created_at: new Date(Date.now()-7200000).toISOString() },
    ],
    forum_comments: [],
    forum_likes: [],
    content_reports: [],
    messages: [],
    fire_report_images: [],
  };
  localStorage.setItem(KEYS.data, JSON.stringify(data));
  return data;
}

export function getData(): any {
  if (typeof window === 'undefined') return {};
  return seedData();
}

export function saveData(data: any) {
  localStorage.setItem(KEYS.data, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('firehelpbeta:data-changed'));
}

export function getUsers(): BetaUser[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(KEYS.users) || '[]');
}

export function saveUsers(users: BetaUser[]) {
  localStorage.setItem(KEYS.users, JSON.stringify(users));
  window.dispatchEvent(new CustomEvent('firehelpbeta:users-changed'));
}

export function getSessionUser(): BetaUser | null {
  if (typeof window === 'undefined') return null;
  const sessionId = localStorage.getItem(KEYS.session);
  if (!sessionId) return null;
  return getUsers().find((u) => u.id === sessionId) ?? null;
}

export function registerUser(input: { full_name: string; email: string; cpf: string; password: string }) {
  const users = getUsers();
  const cpf = input.cpf.replace(/\D/g, '');
  const email = input.email.trim().toLowerCase();
  if (users.some((u) => u.email === email)) return { error: 'Este e-mail já está cadastrado.' };
  if (users.some((u) => u.cpf === cpf)) return { error: 'Este CPF já está cadastrado.' };
  const first = users.length === 0;
  const user: BetaUser = { id: id(), full_name: input.full_name.trim(), email, cpf, password: input.password, avatar_url: null, created_at: now(), blocked: false, role: first ? 'admin' : 'user' };
  saveUsers([...users, user]);
  localStorage.setItem(KEYS.session, user.id);
  return { user, first };
}

export function loginUser(cpfInput: string, emailInput: string, password: string) {
  const value = emailInput.trim().toLowerCase();
  const cpf = cpfInput.replace(/\D/g, '');
  const user = getUsers().find((u) => u.email === value && u.cpf === cpf && u.password === password);
  if (!user) return { error: 'CPF/e-mail ou senha incorretos.' };
  if (user.blocked) return { error: 'Sua conta está suspensa. Entre em contato com a gestão.' };
  localStorage.setItem(KEYS.session, user.id);
  return { user };
}

export function logoutUser() { localStorage.removeItem(KEYS.session); }
export function currentUser() { return getSessionUser(); }
export function promoteUser(userId: string, role: 'admin' | 'moderator' | 'user') {
  const users = getUsers().map((u) => u.id === userId ? { ...u, role } : u);
  saveUsers(users);
}
export function blockUser(userId: string, blocked: boolean) {
  const users = getUsers().map((u) => u.id === userId ? { ...u, blocked } : u);
  saveUsers(users);
}

export function updateUserAvatar(userId: string, avatarUrl: string | null) {
  const users = getUsers().map((u) => u.id === userId ? { ...u, avatar_url: avatarUrl } : u);
  saveUsers(users);
}

export function getFireReports(userId?: string | null): BetaFireReport[] {
  const data = getData();
  return ((data.fire_reports ?? []) as BetaFireReport[])
    .filter((item) => !userId || item.user_id === userId)
    .sort((a, b) => new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime());
}

export function createFireReport(input: Omit<BetaFireReport, 'id' | 'protocol' | 'reported_at' | 'updated_at'>) {
  const data = getData();
  const year = new Date().getFullYear();
  const count = ((data.fire_reports ?? []) as BetaFireReport[]).length + 1;
  const protocol = `FH-${year}-${String(count).padStart(5, '0')}`;
  const item: BetaFireReport = { ...input, id: id(), protocol, reported_at: now(), updated_at: now() };
  data.fire_reports = [item, ...(data.fire_reports ?? [])];
  saveData(data);
  return item;
}

export function updateFireReportStatus(idValue: string, status: string) {
  const data = getData();
  data.fire_reports = (data.fire_reports ?? []).map((item: BetaFireReport) => item.id === idValue ? { ...item, status, updated_at: now() } : item);
  saveData(data);
}

export function getNews(category?: string): BetaNews[] {
  const data = getData();
  return ((data.news ?? []) as BetaNews[])
    .filter((item) => item.published !== false && (!category || item.category === category))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getNewsArticle(slug: string): BetaNews | null {
  const data = getData();
  return ((data.news ?? []) as BetaNews[]).find((item) => item.slug === slug && item.published !== false) ?? null;
}

export function createNews(input: Omit<BetaNews, 'id' | 'slug' | 'created_at'>) {
  const data = getData();
  const item: BetaNews = { ...input, id: id(), slug: `${slugifyLocal(input.title)}-${Date.now().toString(36).slice(-5)}`, created_at: now() };
  data.news = [item, ...(data.news ?? [])];
  saveData(data);
  return item;
}

export function updateNews(idValue: string, patch: Partial<BetaNews>) {
  const data = getData();
  data.news = (data.news ?? []).map((item: BetaNews) => item.id === idValue ? { ...item, ...patch } : item);
  saveData(data);
}

export function deleteNews(idValue: string) {
  const data = getData();
  data.news = (data.news ?? []).filter((item: BetaNews) => item.id !== idValue);
  saveData(data);
}

export function setNewsPublished(idValue: string, published: boolean) {
  updateNews(idValue, { published });
}

function slugifyLocal(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
}

export const betaKeys = KEYS;
