import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { SafetyNotice } from '@/components/SafetyNotice';

export const Route = createFileRoute('/auth')({ head: () => ({ meta: [{ title: 'Entrar — FireHelpBeta' }, { name:'description', content:'Acesse o FireHelpBeta com CPF, e-mail e senha.' }] }), component: AuthPage });
function AuthPage() {
  const { user, loading, signIn, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [name,setName]=useState(''); const [cpf,setCpf]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [busy,setBusy]=useState(false);
  useEffect(()=>{ if(!loading && user) void navigate({to:'/',replace:true}); },[user,loading,navigate]);
  async function submit(e:React.FormEvent){ e.preventDefault(); setBusy(true); const r = mode==='login' ? await signIn(cpf,email,password) : await register({full_name:name,email,cpf,password}); setBusy(false); if(r.error){toast.error(r.error);return;} if(mode==='register' && r.first) toast.success('Cadastro criado. Você é o primeiro usuário e foi definido como gerente do projeto.'); else toast.success('Acesso realizado com sucesso.'); void navigate({to:'/',replace:true}); }
  return <div className="grid min-h-screen lg:grid-cols-2"><div className="hero-institutional hidden flex-col justify-between p-12 lg:flex"><Logo/><div className="space-y-4"><h1 className="max-w-md text-4xl font-extrabold leading-tight">Informação que protege.<br/>Comunidade que ajuda.</h1><p className="max-w-md text-white/75">O FireHelpBeta conecta moradores de Saquarema para informar, acompanhar e prevenir incêndios.</p></div><p className="text-xs text-white/60">Em emergências, acione os Bombeiros (193) ou a Defesa Civil (199).</p></div><div className="flex items-center justify-center px-6 py-16"><div className="w-full max-w-sm space-y-6"><div className="lg:hidden"><Logo/></div><div><h2 className="text-2xl font-bold">{mode==='login'?'Entrar no FireHelpBeta':'Criar conta'}</h2><p className="mt-2 text-sm text-muted-foreground">{mode==='login'?'Acesse com CPF, e-mail e senha.':'Cadastre-se com seus dados para participar da comunidade.'}</p></div><form onSubmit={submit} className="space-y-4">{mode==='register'&&<><div><Label>Nome completo</Label><Input value={name} onChange={e=>setName(e.target.value)} required placeholder="Seu nome"/></div><div><Label>CPF</Label><Input value={cpf} onChange={e=>setCpf(e.target.value)} required placeholder="000.000.000-00"/></div></>} {mode==='login' ? <><div><Label>CPF</Label><Input value={cpf} onChange={e=>setCpf(e.target.value)} required placeholder="000.000.000-00"/></div><div><Label>E-mail</Label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="voce@email.com"/></div></> : <div><Label>E-mail</Label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="voce@email.com"/></div>}<div><Label>Senha</Label><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={4} placeholder="Sua senha"/></div><Button type="submit" size="xl" className="w-full" disabled={busy}>{busy?'Aguarde...':mode==='login'?'Entrar':'Criar conta'}</Button></form><button type="button" className="w-full text-sm text-alert underline" onClick={()=>setMode(mode==='login'?'register':'login')}>{mode==='login'?'Primeiro acesso? Criar conta':'Já tenho conta. Entrar'}</button><SafetyNotice/><p className="text-center text-sm text-muted-foreground"><Link to="/" className="underline">Explorar o site</Link></p></div></div></div>;
}
