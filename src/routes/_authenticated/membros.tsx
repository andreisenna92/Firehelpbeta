import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/firehelp";

export const Route = createFileRoute("/_authenticated/membros")({
  head: () => ({
    meta: [
      { title: "Membros da comunidade — FireHelp Saquarema" },
      { name: "description", content: "Conheça os membros da comunidade FireHelp de Saquarema." },
      { property: "og:title", content: "Membros da comunidade — FireHelp" },
      { property: "og:description", content: "Lista de membros da comunidade FireHelp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MembersPage,
});

function isOnline(ts: string | null) {
  return !!ts && Date.now() - new Date(ts).getTime() < 15 * 60 * 1000;
}

function MembersPage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const members = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio, created_at, last_seen_at, blocked")
        .eq("blocked", false)
        .order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const rows = (members.data ?? []).filter((m) =>
    m.full_name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Membros da comunidade</h1>
          <p className="text-sm text-muted-foreground">Encontre vizinhos e converse com eles.</p>
        </div>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome" />
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((m) => (
            <div key={m.id} className="surface-card flex items-center gap-3 p-4">
              <Avatar className="size-11">
                <AvatarImage src={m.avatar_url ?? undefined} />
                <AvatarFallback>{m.full_name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{m.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {isOnline(m.last_seen_at) ? "Ativo recentemente" : `Membro desde ${formatDate(m.created_at)}`}
                </p>
                {m.bio && <p className="mt-1 line-clamp-2 text-sm">{m.bio}</p>}
              </div>
              {m.id !== user?.id && (
                <Button asChild size="sm" variant="outline">
                  <Link to="/mensagens" search={{ com: m.id }}>
                    <MessageCircle className="size-4" /> Mensagem
                  </Link>
                </Button>
              )}
            </div>
          ))}
          {!members.isLoading && rows.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum membro encontrado.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
