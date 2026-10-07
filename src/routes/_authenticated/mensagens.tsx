import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDateTime } from "@/lib/firehelp";

export const Route = createFileRoute("/_authenticated/mensagens")({
  validateSearch: z.object({ com: z.string().uuid().optional() }),
  head: () => ({
    meta: [
      { title: "Mensagens — FireHelpBeta Saquarema" },
      { name: "description", content: "Suas conversas privadas com membros da comunidade FireHelpBeta." },
      { property: "og:title", content: "Mensagens — FireHelpBeta" },
      { property: "og:description", content: "Conversas privadas da comunidade FireHelpBeta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MessagesPage,
});

type Msg = { id: string; sender_id: string; recipient_id: string; content: string; read_at: string | null; created_at: string };

function MessagesPage() {
  const { user } = useAuth();
  const { com } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const me = user?.id ?? "";

  const msgs = useQuery({
    queryKey: ["messages", me],
    enabled: !!me,
    refetchInterval: 8000,
    queryFn: async () => {
      const { data, error } = await supabase.from("messages").select("*").order("created_at");
      if (error) throw error;
      return (data ?? []) as Msg[];
    },
  });

  const convos = useMemo(() => {
    const map = new Map<string, { last: Msg; unread: number }>();
    for (const m of msgs.data ?? []) {
      const other = m.sender_id === me ? m.recipient_id : m.sender_id;
      const prev = map.get(other);
      const unread = (prev?.unread ?? 0) + (m.recipient_id === me && !m.read_at ? 1 : 0);
      map.set(other, { last: m, unread });
    }
    if (com && !map.has(com)) map.set(com, { last: undefined as unknown as Msg, unread: 0 });
    return [...map.entries()].sort((a, b) => (b[1].last?.created_at ?? "9").localeCompare(a[1].last?.created_at ?? "9"));
  }, [msgs.data, me, com]);

  const ids = convos.map(([id]) => id);
  const people = useQuery({
    queryKey: ["msg_people", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids);
      return new Map((data ?? []).map((p) => [p.id, p]));
    },
  });

  const thread = (msgs.data ?? []).filter(
    (m) => com && ((m.sender_id === me && m.recipient_id === com) || (m.sender_id === com && m.recipient_id === me)),
  );

  useEffect(() => {
    if (!com) return;
    const unread = thread.filter((m) => m.recipient_id === me && !m.read_at).map((m) => m.id);
    if (unread.length === 0) return;
    void supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unread)
      .then(() => qc.invalidateQueries({ queryKey: ["messages"] }));
    bottom.current?.scrollIntoView();
  }, [com, thread.length]); // eslint-disable-line react-hooks/exhaustive-deps

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!com || !text.trim()) return;
    const { error } = await supabase.from("messages").insert({ sender_id: me, recipient_id: com, content: text.trim() });
    if (error) { toast.error("Não foi possível enviar."); return; }
    setText("");
    void qc.invalidateQueries({ queryKey: ["messages"] });
  }

  const other = com ? people.data?.get(com) : undefined;

  return (
    <AppShell>
      <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-8 md:grid-cols-[280px_1fr]">
        <aside className={`surface-card space-y-1 p-2 ${com ? "hidden md:block" : ""}`}>
          <div className="flex items-center justify-between p-2">
            <h1 className="font-bold">Mensagens</h1>
            <Link to="/membros" className="text-xs font-semibold text-primary">Membros</Link>
          </div>
          {convos.map(([id, c]) => {
            const p = people.data?.get(id);
            return (
              <button
                key={id}
                onClick={() => navigate({ to: "/mensagens", search: { com: id } })}
                className={`flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-secondary ${com === id ? "bg-secondary" : ""}`}
              >
                <Avatar className="size-8">
                  <AvatarImage src={p?.avatar_url ?? undefined} />
                  <AvatarFallback>{(p?.full_name ?? "?").slice(0, 1)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p?.full_name ?? "Membro"}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.last?.content ?? "Nova conversa"}</p>
                </div>
                {c.unread > 0 && (
                  <span className="rounded-full bg-alert px-2 text-xs font-bold text-alert-foreground">{c.unread}</span>
                )}
              </button>
            );
          })}
          {convos.length === 0 && (
            <p className="p-2 text-sm text-muted-foreground">Nenhuma conversa ainda. Escolha alguém em Membros.</p>
          )}
        </aside>

        <section className={`surface-card flex min-h-[60vh] flex-col ${com ? "" : "hidden md:flex"}`}>
          {com ? (
            <>
              <div className="flex items-center gap-2 border-b border-border p-3">
                <Link to="/mensagens" className="text-sm text-muted-foreground md:hidden">←</Link>
                <p className="font-semibold">{other?.full_name ?? "Membro"}</p>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {thread.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_id === me ? "justify-end" : ""}`}>
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.sender_id === me ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <p className="mt-1 text-[10px] opacity-70">{formatDateTime(m.created_at)}</p>
                    </div>
                  </div>
                ))}
                <div ref={bottom} />
              </div>
              <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
                <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Escreva sua mensagem" maxLength={4000} />
                <Button type="submit">Enviar</Button>
              </form>
            </>
          ) : (
            <p className="m-auto text-sm text-muted-foreground">Selecione uma conversa.</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
