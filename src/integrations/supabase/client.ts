import { getData, saveData, getUsers, getSessionUser, logoutUser } from '@/lib/beta-store';

const uid = () => crypto.randomUUID();
const iso = () => new Date().toISOString();

class QueryBuilder implements PromiseLike<any> {
  private table: string;
  private op: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: any = null;
  private filters: ((row: any) => boolean)[] = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private head = false;
  private countMode: 'exact' | null = null;
  private selectString = '*';
  constructor(table: string) { this.table = table; }
  select(columns = '*', opts?: { count?: 'exact'; head?: boolean }) { if (this.op !== 'insert' && this.op !== 'update') this.op = 'select'; this.selectString = columns; this.countMode = opts?.count ?? null; this.head = !!opts?.head; return this; }
  insert(payload: any) { this.op = 'insert'; this.payload = Array.isArray(payload) ? payload : [payload]; return this; }
  update(payload: any) { this.op = 'update'; this.payload = payload; return this; }
  delete() { this.op = 'delete'; return this; }
  eq(column: string, value: any) { this.filters.push((r) => r[column] === value); return this; }
  in(column: string, values: any[]) { this.filters.push((r) => values.includes(r[column])); return this; }
  not(column: string, op: string, value: any) { if (op === 'is') this.filters.push((r) => r[column] !== value); return this; }
  gte(column: string, value: any) { this.filters.push((r) => String(r[column] ?? '') >= String(value)); return this; }
  order(column: string, opts?: { ascending?: boolean }) { this.orderBy = { column, ascending: opts?.ascending !== false }; return this; }
  maybeSingle() { return this.then((r) => ({ data: r.data?.[0] ?? null, error: r.error })); }
  single() { return this.then((r) => ({ data: r.data?.[0] ?? null, error: r.data?.length ? r.error : { message: 'Registro não encontrado' } })); }
  then<TResult1 = any, TResult2 = never>(onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): PromiseLike<TResult1 | TResult2> {
    try {
      const data = getData();
      let rows = this.table === 'profiles' ? getUsers().map((u:any) => ({ id:u.id, full_name:u.full_name, email:u.email, avatar_url:u.avatar_url, created_at:u.created_at, blocked:u.blocked })) : this.table === 'user_roles' ? getUsers().map((u:any) => ({ user_id:u.id, role:u.role })) : [...(data[this.table] ?? [])];
      if (this.op === 'insert') {
        const inserted = this.payload.map((item: any) => ({ id: item.id ?? uid(), created_at: item.created_at ?? iso(), reported_at: item.reported_at ?? iso(), updated_at: iso(), protocol: item.protocol ?? (this.table === 'fire_reports' ? `FH-${new Date().getFullYear()}-${String(Math.floor(Math.random()*90000)+10000)}` : undefined), ...item }));
        if (this.table === 'profiles' || this.table === 'user_roles') { /* auth data is managed by beta-store */ } else { data[this.table] = [...rows, ...inserted]; saveData(data); }
        return Promise.resolve({ data: inserted, error: null }).then(onfulfilled as any, onrejected as any);
      }
      if (this.op === 'update') {
        const updated = rows.map((row) => this.filters.every((f) => f(row)) ? { ...row, ...this.payload } : row);
        if (this.table === 'profiles') {
          const users = getUsers().map((u:any) => { const row = { id:u.id, full_name:u.full_name, avatar_url:u.avatar_url, blocked:u.blocked, created_at:u.created_at }; return this.filters.every((f) => f(row)) ? { ...u, ...this.payload } : u; });
          localStorage.setItem('firehelpbeta_users', JSON.stringify(users)); window.dispatchEvent(new Event('firehelpbeta:users-changed'));
        } else { data[this.table] = updated; saveData(data); }
        return Promise.resolve({ data: updated.filter((r) => this.filters.every((f) => f(r))), error: null }).then(onfulfilled as any, onrejected as any);
      }
      if (this.op === 'delete') {
        data[this.table] = rows.filter((r) => !this.filters.every((f) => f(r))); saveData(data);
        return Promise.resolve({ data: null, error: null }).then(onfulfilled as any, onrejected as any);
      }
      rows = rows.filter((r) => this.filters.every((f) => f(r)));
      if (this.orderBy) rows.sort((a,b) => String(a[this.orderBy!.column] ?? '').localeCompare(String(b[this.orderBy!.column] ?? '')) * (this.orderBy!.ascending ? 1 : -1));
      if (this.selectString.includes('fire_report_images')) rows = rows.map((r) => ({ ...r, fire_report_images: (data.fire_report_images ?? []).filter((i:any) => i.fire_report_id === r.id) }));
      if (this.selectString.includes('forum_comments') && this.table === 'forum_posts') rows = rows.map((r) => ({ ...r, forum_comments: (data.forum_comments ?? []).filter((c:any) => c.post_id === r.id).map((c:any) => ({ id:c.id, created_at:c.created_at })) }));
      const result = this.head && this.countMode ? { data: null, count: rows.length, error: null } : { data: rows, count: this.countMode ? rows.length : null, error: null };
      return Promise.resolve(result).then(onfulfilled as any, onrejected as any);
    } catch (error) { return Promise.reject(error).then(onfulfilled as any, onrejected as any); }
  }
}

function userObject(user: ReturnType<typeof getSessionUser>) {
  return user ? { id: user.id, email: user.email, user_metadata: { full_name: user.full_name } } : null;
}

const auth = {
  async getSession() { const user = getSessionUser(); return { data: { session: user ? { user: userObject(user) } : null }, error: null }; },
  async getUser() { const user = getSessionUser(); return { data: { user: userObject(user) }, error: user ? null : { message: 'Not authenticated' } }; },
  onAuthStateChange(callback: (event: string, session: any) => void) { const handler = () => { const u = getSessionUser(); callback('SIGNED_IN', u ? { user: userObject(u) } : null); }; window.addEventListener('firehelpbeta:auth-changed', handler); return { data: { subscription: { unsubscribe: () => window.removeEventListener('firehelpbeta:auth-changed', handler) } } }; },
  async signOut() { logoutUser(); window.dispatchEvent(new Event('firehelpbeta:auth-changed')); return { error: null }; },
};

export const supabase: any = {
  auth,
  from: (table: string) => new QueryBuilder(table),
  storage: {
    from: (_bucket: string) => ({
      async upload(path: string, file: File) { return { data: { path }, error: null }; },
      async createSignedUrl(path: string) { return { data: { signedUrl: URL.createObjectURL(new Blob()) }, error: null }; },
    }),
  },
};

export function notifyAuthChanged() { if (typeof window !== 'undefined') window.dispatchEvent(new Event('firehelpbeta:auth-changed')); }
