import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { useNews } from "@/hooks/useFirehelp";
import { NEWS_CATEGORIES, formatDate } from "@/lib/firehelp";

export const Route = createFileRoute("/noticias/")({
  head: () => ({
    meta: [
      { title: "Notícias e alertas de Saquarema — FireHelpBeta" },
      {
        name: "description",
        content:
          "Notícias, alertas e conteúdos de prevenção contra incêndios para Saquarema, RJ.",
      },
      { property: "og:title", content: "Notícias e alertas de Saquarema — FireHelpBeta" },
      {
        property: "og:description",
        content: "Prevenção, meio ambiente, segurança e alertas para Saquarema.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewsList,
});

function NewsList() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const { data, isLoading } = useNews(category);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">📰 Notícias e alertas</h1>
          <p className="text-sm text-muted-foreground">
             Conteúdos de prevenção, alertas e informações para Saquarema.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory(undefined)}
            className={chipClass(category === undefined)}
          >
            Todas
          </button>
          {NEWS_CATEGORIES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
              className={chipClass(category === item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {(data ?? []).map((item) => (
              <Link
                key={item.id}
                to="/noticias/$slug"
                params={{ slug: item.slug }}
                className="surface-card group overflow-hidden transition-shadow hover:shadow-lift"
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-40 w-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="space-y-2 p-4">
                  <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-foreground">
                    {NEWS_CATEGORIES.find((c) => c.value === item.category)?.label}
                  </span>
                  <h2 className="font-semibold leading-snug group-hover:text-alert">
                    {item.title}
                  </h2>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{item.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.author_name ?? "FireHelpBeta"} · {formatDate(item.created_at)}
                  </p>
                  {item.is_demo && (
                    <span className="inline-block rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Demonstração
                    </span>
                  )}
                </div>
              </Link>
            ))}
            {(data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma notícia nesta categoria.</p>
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
