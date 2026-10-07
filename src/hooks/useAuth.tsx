import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { currentUser, loginUser, logoutUser, promoteUser, registerUser, blockUser, type BetaUser } from '@/lib/beta-store';
import { notifyAuthChanged } from '@/integrations/supabase/client';

export type Profile = { id: string; full_name: string; email: string | null; avatar_url: string | null; created_at: string; blocked?: boolean };
type AuthValue = {
  user: { id: string; email?: string } | null; session: any; profile: Profile | null; roles: string[]; isStaff: boolean; isAdmin: boolean; loading: boolean;
  signIn: (cpf: string, email: string, password: string) => Promise<{ error?: string; first?: boolean }>;
  register: (input: { full_name: string; email: string; cpf: string; password: string }) => Promise<{ error?: string; first?: boolean }>;
  signOut: () => Promise<void>;
  refresh: () => void;
};
const AuthContext = createContext<AuthValue | null>(null);
const map = (u: BetaUser | null): Profile | null => u ? { id:u.id, full_name:u.full_name, email:u.email, avatar_url:u.avatar_url, created_at:u.created_at, blocked:u.blocked } : null;
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<BetaUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = () => setUser(currentUser());
  useEffect(() => { refresh(); setLoading(false); const h = () => refresh(); window.addEventListener('firehelpbeta:auth-changed', h); window.addEventListener('firehelpbeta:users-changed', h); return () => { window.removeEventListener('firehelpbeta:auth-changed', h); window.removeEventListener('firehelpbeta:users-changed', h); }; }, []);
  const value = useMemo<AuthValue>(() => ({
    user: user ? { id:user.id, email:user.email } : null,
    session: user ? { user:{ id:user.id, email:user.email } } : null,
    profile: map(user), roles: user ? [user.role] : [], isStaff: user?.role === 'admin' || user?.role === 'moderator', isAdmin: user?.role === 'admin', loading,
    signIn: async (cpf, email, password) => { const r = loginUser(cpf, email, password); if (r.user) { setUser(r.user); notifyAuthChanged(); return {}; } return { error:r.error }; },
    register: async (input) => { const r = registerUser(input); if (r.user) { setUser(r.user); notifyAuthChanged(); return { first:r.first }; } return { error:r.error }; },
    signOut: async () => { logoutUser(); setUser(null); notifyAuthChanged(); },
    refresh,
  }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider'); return ctx; }
export { promoteUser, blockUser };
