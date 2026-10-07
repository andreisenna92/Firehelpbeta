import { Link, useNavigate } from "@tanstack/react-router";
import {
  Flame,
  Home,
  LogOut,
  Map,
  MessageSquare,
  Newspaper,
  Shield,
  User,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";

const desktopNav = [
  { to: "/", label: "Início", icon: Home },
  { to: "/noticias", label: "Notícias", icon: Newspaper },
  { to: "/mapa", label: "Mapa", icon: Map },
  { to: "/comunidade", label: "Fórum", icon: MessageSquare },
  { to: "/membros", label: "Membros", icon: User },
  { to: "/mensagens", label: "Mensagens", icon: MessageSquare },
] as const;

const mobileNav = [
  { to: "/", label: "Início", icon: Home },
  { to: "/mapa", label: "Mapa", icon: Map },
  { to: "/reportar", label: "Reportar", icon: Flame },
  { to: "/comunidade", label: "Fórum", icon: MessageSquare },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, profile, isStaff, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    void navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-3 sm:h-16 sm:px-4">
          <Link to="/" className="min-w-0 shrink-0" aria-label="FireHelp — início">
            <span className="sm:hidden"><Logo compact /></span>
            <span className="hidden sm:inline"><Logo /></span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {desktopNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
            {isStaff && (
              <Link
                to="/admin"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                <span className="flex items-center gap-1.5">
                  <Shield className="size-4" /> Moderação
                </span>
              </Link>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="alert" size="sm" className="hidden sm:inline-flex">
              <Link to="/reportar">
                <Flame className="size-4" /> Reportar
              </Link>
            </Button>
            {user ? (
              <>
                <Link to="/perfil" className="hidden sm:block">
                  <Avatar className="size-9 border border-border">
                    <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.full_name} />
                    <AvatarFallback>{(profile?.full_name ?? "U").slice(0, 1)}</AvatarFallback>
                  </Avatar>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  aria-label="Sair"
                  className="hidden sm:inline-flex"
                >
                  <LogOut className="size-4" />
                </Button>
              </>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link to="/auth">Entrar</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="min-w-0 flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-10">{children}</main>

      <footer className="hidden border-t border-border bg-card/60 py-8 md:block">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 text-sm text-muted-foreground">
          <Logo />
          <p className="max-w-2xl">
            FireHelp Saquarema — Informação que protege. Comunidade que ajuda. Plataforma
            comunitária de informação; não substitui os serviços oficiais de emergência
            (Bombeiros 193).
          </p>
        </div>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur supports-[backdrop-filter]:bg-card/85 md:hidden" aria-label="Navegação principal">
        <div className="mx-auto grid h-16 w-full max-w-md grid-cols-5">
          {mobileNav.map((item) => {
            const Icon = item.icon;
            const isReport = item.to === "/reportar";
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex min-w-0 flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-semibold text-muted-foreground transition-colors"
                activeProps={{ className: "text-foreground" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                <span
                  className={
                    isReport
                      ? "grid size-9 -translate-y-3 place-items-center rounded-full bg-alert text-alert-foreground shadow-lift"
                      : "grid size-9 place-items-center"
                  }
                >
                  <Icon className="size-5" />
                </span>
                <span className={isReport ? "-mt-3" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
