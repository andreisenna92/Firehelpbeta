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

function seedData() {
  const existing = localStorage.getItem(KEYS.data);
  if (existing) return JSON.parse(existing);
  const data = {
    fire_reports: [
      { id: 'demo-report-1', protocol: 'FH-2026-00128', user_id: null, type: 'florestal', severity: 'grande', description: 'Foco de incêndio próximo à área de vegetação.', latitude: -22.935, longitude: -42.507, address: 'Bacaxá, Saquarema/RJ', status: 'active', is_demo: true, reported_at: now(), updated_at: now() },
      { id: 'demo-report-2', protocol: 'FH-2026-00127', user_id: null, type: 'queimada', severity: 'medio', description: 'Fumaça intensa em terreno baldio.', latitude: -22.934, longitude: -42.492, address: 'Centro, Saquarema/RJ', status: 'pending', is_demo: true, reported_at: new Date(Date.now()-3600000).toISOString(), updated_at: now() },
      { id: 'demo-report-3', protocol: 'FH-2026-00121', user_id: null, type: 'residencial', severity: 'baixo', description: 'Ocorrência controlada pela comunidade.', latitude: -22.900, longitude: -42.510, address: 'Itaúna, Saquarema/RJ', status: 'resolved', is_demo: true, reported_at: new Date(Date.now()-86400000).toISOString(), updated_at: now() },
    ],
    news: [
      { id: 'demo-news-1', title: 'Como prevenir queimadas em períodos de estiagem', slug: 'como-prevenir-queimadas', summary: 'Cuidados simples ajudam a reduzir o risco de incêndios.', content: 'Evite queimar lixo, mantenha terrenos limpos e nunca deixe fogo sem supervisão. Em emergências, acione os serviços oficiais.', image_url: null, category: 'prevencao', author_id: null, author_name: 'Equipe FireHelpBeta', published: true, created_at: now() },
      { id: 'demo-news-2', title: 'FireHelpBeta: comunidade conectada pela prevenção', slug: 'firehelpbeta-comunidade', summary: 'Informação rápida para proteger Saquarema.', content: 'A plataforma aproxima moradores, informação e gestão comunitária para apoiar a prevenção e o acompanhamento de ocorrências.', image_url: null, category: 'comunidade', author_id: null, author_name: 'Equipe FireHelpBeta', published: true, created_at: new Date(Date.now()-3600000).toISOString() },
      { id: 'demo-news-3', title: 'Fauna e flora: por que prevenir incêndios?', slug: 'fauna-e-flora', summary: 'O fogo afeta diretamente os ecossistemas locais.', content: 'A prevenção protege áreas naturais, animais, vegetação e a qualidade ambiental do município.', image_url: null, category: 'meio_ambiente', author_id: null, author_name: 'Equipe FireHelpBeta', published: true, created_at: new Date(Date.now()-7200000).toISOString() },
    ],
    forum_posts: [
      { id: 'demo-post-1', title: 'Como podemos melhorar a prevenção no nosso bairro?', content: 'Compartilhe ideias, pontos de atenção e iniciativas comunitárias.', category: 'prevencao', author_name: 'Equipe FireHelpBeta', user_id: null, is_demo: true, created_at: now() },
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

export const betaKeys = KEYS;
