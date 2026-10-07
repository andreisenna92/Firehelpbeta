import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useForumPosts } from "@/hooks/useFirehelp";
import { FORUM_CATEGORIES, formatDateTime, type ForumCategory } from "@/lib/firehelp";

export const Route = createFileRoute("/comunidade/")({
  head: () => ({
    meta: [
      { title: "Comunidade de Saquarema — FireHelpBeta" },
      {
        name: "description",
        content:
          "Fórum comunitário de Saquarema para discutir prevenção, ocorrências e segurança contra incêndios.",
      },
      { property: "og:title", content: "Comunidade de Saquarema — FireHelpBeta" },
      {
        property: "og:description",
        content: "Participe das discussões de Saquarema sobre prevenção, meio ambiente e segurança.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForumPage,
});

function ForumPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<string | undefined>(undefined);
  const { data, isLoading } = useForumPosts(category);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postCategory, setPostCategory] = useState<ForumCategory>("geral");
  const [saving, setSaving] = useState(false);

  async function createTopic(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (!title.trim() || !content.trim()) { toast.error("Preencha título e conteúdo."); return; }
    setSaving(true);
    const { error } = await supabase.from("forum_posts").insert({
      user_id: user.id,
      author_name: profile?.full_name ?? "Usuário",
      title: title.trim(),
      content: content.trim(),
      category: postCategory,
    });
    setSaving(false);
    if (error) {
      toast.error("Não foi possível criar o tópico.");
      return;
    }
    toast.success("Tópico publicado.");
    setTitle("");
    setContent("");
    setOpen(false);
    void queryClient.invalidateQueries({ queryKey: ["forum_posts"] });
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">💬 Comunidade</h1>
            <p className="text-sm text-muted-foreground">
              Discuta prevenção, ocorrências e segurança com moradores de Saquarema.
            </p>
          </div>
          {user ? (
            <Button variant="alert" onClick={() => setOpen((value) => !value)}>
              <Plus className="size-4" /> Novo tópico
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link to="/auth">Entrar para participar</Link>
            </Button>
          )}
        </div>

        {open && user && (
          <form onSubmit={createTopic} className="surface-card space-y-3 p-4">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Título do tópico"
            />
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Escreva sua mensagem"
              rows={4}
            />
            <div className="flex flex-wrap gap-2">
              {FORUM_CATEGORIES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setPostCategory(item.value)}
                  className={chipClass(postCategory === item.value)}
                >
                  {item.emoji} {item.label}
                </button>
              ))}
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Publicando..." : "Publicar tópico"}
            </Button>
          </form>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory(undefined)}
            className={chipClass(category === undefined)}
          >
            Todos
          </button>
          {FORUM_CATEGORIES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
              className={chipClass(category === item.value)}
            >
              {item.emoji} {item.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {(data ?? []).map((post) => {
              const comments = post.forum_comments ?? [];
              const last = comments
                .map((c) => c.created_at)
                .sort()
                .at(-1);
              return (
                <Link
                  key={post.id}
                  to="/comunidade/$postId"
                  params={{ postId: post.id }}
                  className="surface-card block p-4 transition-shadow hover:shadow-lift"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-secondary-foreground">
                      {FORUM_CATEGORIES.find((c) => c.value === post.category)?.emoji}{" "}
                      {FORUM_CATEGORIES.find((c) => c.value === post.category)?.label}
                    </span>
                    <span>{post.author_name ?? "Membro da comunidade"}</span>
                    <span>· {formatDateTime(post.created_at)}</span>
                  </div>
                  <h2 className="mt-2 font-semibold">{post.title}</h2>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{post.content}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="size-3.5" /> {comments.length} resposta(s)
                    </span>
                    {last && <span>Último comentário: {formatDateTime(last)}</span>}
                    {post.is_demo && <span className="uppercase">Demonstração</span>}
                  </div>
                </Link>
              );
            })}
            {(data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum tópico nesta categoria.</p>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function chipClass(active: boolean) {
  return `rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-card text-muted-foreground hover:bg-secondary"
  }`;
}
