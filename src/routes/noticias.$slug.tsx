import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { useNewsArticle } from "@/hooks/useFirehelp";
import { NEWS_CATEGORIES, formatDate } from "@/lib/firehelp";

export const Route = createFileRoute("/noticias/$slug")({
  head: () => ({
    meta: [
      { title: "Notícia — FireHelpBeta" },
      {
        name: "description",
        content: "Leia a notícia completa do FireHelpBeta Saquarema sobre prevenção e incêndios.",
      },
      { property: "og:title", content: "Notícia — FireHelpBeta" },
      {
        property: "og:description",
        content: "Conteúdo de prevenção, alerta e informação comunitária para Saquarema.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewsArticle,
});

function NewsArticle() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useNewsArticle(slug);

  return (
    <AppShell>
      <article className="mx-auto w-full max-w-3xl space-y-5 px-4 py-8">
        <Link
          to="/noticias"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Todas as notícias
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !data ? (
          <p className="text-muted-foreground">Notícia não encontrada.</p>
        ) : (
          <>
            <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-foreground">
              {NEWS_CATEGORIES.find((c) => c.value === data.category)?.label}
            </span>
            <h1 className="text-3xl font-extrabold leading-tight">{data.title}</h1>
            <p className="text-sm text-muted-foreground">
              {data.author_name ?? "FireHelpBeta"} · {formatDate(data.created_at)}
            </p>
            {data.image_url && (
              <img
                src={data.image_url}
                alt={data.title}
                className="w-full rounded-2xl border border-border object-cover shadow-soft"
              />
            )}
            {data.summary && <p className="text-lg text-muted-foreground">{data.summary}</p>}
            <div className="whitespace-pre-line leading-relaxed">{data.content}</div>
          </>
        )}
      </article>
    </AppShell>
  );
}
