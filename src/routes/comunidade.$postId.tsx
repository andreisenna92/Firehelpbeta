import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Flag, Heart, Reply } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FORUM_CATEGORIES, REPORT_REASONS, formatDateTime } from "@/lib/firehelp";

export const Route = createFileRoute("/comunidade/$postId")({
  head: () => ({
    meta: [
      { title: "Tópico da comunidade — FireHelpBeta" },
      {
        name: "description",
        content: "Participe da discussão da comunidade de Saquarema sobre prevenção e segurança.",
      },
      { property: "og:title", content: "Tópico da comunidade — FireHelpBeta" },
      {
        property: "og:description",
        content: "Comente, responda e ajude moradores de Saquarema com informações confiáveis.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TopicPage,
});

type CommentRow = {
  id: string;
  parent_id: string | null;
  user_id: string | null;
  author_name: string | null;
  content: string;
  created_at: string;
};

function TopicPage() {
  const { postId } = Route.useParams();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const post = useQuery({
    queryKey: ["forum_post", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_posts")
        .select("*")
        .eq("id", postId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const comments = useQuery({
    queryKey: ["forum_comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_comments")
        .select("id, parent_id, user_id, author_name, content, created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CommentRow[];
    },
  });

  const likes = useQuery({
    queryKey: ["forum_likes", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_likes")
        .select("id, comment_id, user_id")
        .not("comment_id", "is", null);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function submitComment(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (!message.trim()) return;
    setSending(true);
    const { error } = await supabase.from("forum_comments").insert({
      post_id: postId,
      parent_id: replyTo,
      user_id: user.id,
      author_name: profile?.full_name ?? "Usuário",
      content: message.trim(),
    });
    setSending(false);
    if (error) {
      toast.error("Não foi possível enviar o comentário.");
      return;
    }
    setMessage("");
    setReplyTo(null);
    void queryClient.invalidateQueries({ queryKey: ["forum_comments", postId] });
  }

  async function toggleLike(commentId: string) {
    if (!user) { toast.error("Entre para curtir comentários."); return; }
    const existing = (likes.data ?? []).find(
      (like) => like.comment_id === commentId && like.user_id === user.id,
    );
    if (existing) {
      await supabase.from("forum_likes").delete().eq("id", existing.id);
    } else {
      await supabase.from("forum_likes").insert({ comment_id: commentId, user_id: user.id });
    }
    void queryClient.invalidateQueries({ queryKey: ["forum_likes", postId] });
  }

  async function reportContent(targetType: string, targetId: string) {
    if (!user) { toast.error("Entre para denunciar conteúdo."); return; }
    const reason = window.prompt(`Motivo da denúncia:\n${REPORT_REASONS.join(" · ")}`);
    if (!reason) return;
    const { error } = await supabase.from("content_reports").insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
    });
    if (error) toast.error("Não foi possível registrar a denúncia.");
    else toast.success("Denúncia enviada para moderação.");
  }

  const roots = (comments.data ?? []).filter((c) => !c.parent_id);
  const childrenOf = (id: string) => (comments.data ?? []).filter((c) => c.parent_id === id);
  const likeCount = (id: string) => (likes.data ?? []).filter((l) => l.comment_id === id).length;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-8">
        <Link
          to="/comunidade"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Voltar para a comunidade
        </Link>

        {post.isLoading ? (
          <Skeleton className="h-32 rounded-xl" />
        ) : !post.data ? (
          <p className="text-muted-foreground">Tópico não encontrado.</p>
        ) : (
          <div className="surface-card space-y-3 p-5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-secondary-foreground">
                {FORUM_CATEGORIES.find((c) => c.value === post.data!.category)?.label}
              </span>
              <span>{post.data.author_name ?? "Membro da comunidade"}</span>
              <span>· {formatDateTime(post.data.created_at)}</span>
            </div>
            <h1 className="text-2xl font-bold">{post.data.title}</h1>
            <p className="whitespace-pre-line leading-relaxed">{post.data.content}</p>
            <button
              type="button"
              onClick={() => reportContent("forum_post", post.data!.id)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-alert"
            >
              <Flag className="size-3.5" /> Denunciar conteúdo
            </button>
          </div>
        )}

        <h2 className="text-lg font-semibold">Respostas ({comments.data?.length ?? 0})</h2>

        {user ? (
          <form onSubmit={submitComment} className="surface-card space-y-3 p-4">
            {replyTo && (
              <p className="text-xs text-muted-foreground">
                Respondendo a um comentário ·{" "}
                <button type="button" className="underline" onClick={() => setReplyTo(null)}>
                  cancelar
                </button>
              </p>
            )}
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Escreva sua resposta"
              rows={3}
            />
            <Button type="submit" disabled={sending}>
              {sending ? "Enviando..." : "Comentar"}
            </Button>
          </form>
        ) : (
          <Button asChild variant="outline">
            <Link to="/auth">Entrar para comentar</Link>
          </Button>
        )}

        <div className="space-y-3">
          {roots.map((comment) => (
            <div key={comment.id} className="surface-card space-y-2 p-4">
              <CommentBody
                comment={comment}
                likes={likeCount(comment.id)}
                onLike={() => toggleLike(comment.id)}
                onReply={() => setReplyTo(comment.id)}
                onReport={() => reportContent("forum_comment", comment.id)}
              />
              {childrenOf(comment.id).map((child) => (
                <div key={child.id} className="ml-5 border-l border-border pl-4">
                  <CommentBody
                    comment={child}
                    likes={likeCount(child.id)}
                    onLike={() => toggleLike(child.id)}
                    onReply={() => setReplyTo(comment.id)}
                    onReport={() => reportContent("forum_comment", child.id)}
                  />
                </div>
              ))}
            </div>
          ))}
          {roots.length === 0 && !comments.isLoading && (
            <p className="text-sm text-muted-foreground">Seja a primeira pessoa a responder.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function CommentBody({
  comment,
  likes,
  onLike,
  onReply,
  onReport,
}: {
  comment: CommentRow;
  likes: number;
  onLike: () => void;
  onReply: () => void;
  onReport: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">
        {comment.author_name ?? "Membro"} · {formatDateTime(comment.created_at)}
      </p>
      <p className="whitespace-pre-line text-sm">{comment.content}</p>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <button type="button" onClick={onLike} className="inline-flex items-center gap-1 hover:text-alert">
          <Heart className="size-3.5" /> {likes}
        </button>
        <button type="button" onClick={onReply} className="inline-flex items-center gap-1 hover:text-foreground">
          <Reply className="size-3.5" /> Responder
        </button>
        <button type="button" onClick={onReport} className="inline-flex items-center gap-1 hover:text-alert">
          <Flag className="size-3.5" /> Denunciar
        </button>
      </div>
    </div>
  );
}
