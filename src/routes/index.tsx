import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Map as MapIcon, Newspaper, ShieldCheck, Users, Activity } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SafetyNotice } from "@/components/SafetyNotice";
import { FireMap } from "@/components/map/FireMap";
import { useCommunityStats, useNews, useReports } from "@/hooks/useFirehelp";
import {
  FIRE_STATUSES,
  FIRE_TYPES,
  formatDate,
  label,
  statusBadgeClass,
  type FireStatus,
  type FireType,
} from "@/lib/firehelp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FireHelpBeta Saquarema — Incêndios e prevenção" },
      {
        name: "description",
        content:
          "Informe incêndios, acompanhe ocorrências no mapa e compartilhe prevenção com a comunidade de Saquarema.",
      },
      { property: "og:title", content: "FireHelpBeta Saquarema — Incêndios e prevenção" },
      {
        property: "og:description",
        content: "Informe incêndios e acompanhe ocorrências em Saquarema, Rio de Janeiro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const stats = useCommunityStats();
  const reports = useReports();
  const news = useNews();

  const recent = (reports.data ?? []).slice(0, 5);

  return (
    <AppShell>
      <section className="hero-institutional">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14 md:grid-cols-[1.2fr_1fr] md:items-center md:py-20">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <Activity className="size-3.5" /> Rede comunitária de Saquarema
            </span>
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
              Ajude a proteger Saquarema.
            </h1>
            <p className="max-w-xl text-white/75">
              Informe incêndios, acompanhe ocorrências e compartilhe informações importantes com
              moradores de Saquarema.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="xl" variant="hero">
                <Link to="/reportar">
                  <Flame className="size-5" /> Reportar incêndio
                </Link>
              </Button>
              <Button asChild size="xl" variant="heroGhost">
                <Link to="/mapa">
                  <MapIcon className="size-5" /> Ver ocorrências
                </Link>
              </Button>
            </div>
          </div>

          <div className="h-64 overflow-hidden rounded-2xl border border-white/20 shadow-lift md:h-80">
            <FireMap
              points={(reports.data ?? []).map((r) => ({
                id: r.id,
                latitude: r.latitude,
                longitude: r.longitude,
                status: r.status as FireStatus,
              }))}
              zoom={12}
            />
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Incêndios ativos"
            value={stats.data?.active ?? 0}
            loading={stats.isLoading}
            icon={<Flame className="size-4 text-alert" />}
            accent="text-alert"
          />
          <StatCard
            label="Reportados hoje"
            value={stats.data?.today ?? 0}
            loading={stats.isLoading}
            icon={<Activity className="size-4 text-ember" />}
            accent="text-ember"
          />
          <StatCard
            label="Ocorrências resolvidas"
            value={stats.data?.resolved ?? 0}
            loading={stats.isLoading}
            icon={<ShieldCheck className="size-4 text-success" />}
            accent="text-success"
          />
          <StatCard
            label="Pessoas na comunidade"
            value={stats.data?.users ?? 0}
            loading={stats.isLoading}
            icon={<Users className="size-4 text-primary" />}
            accent="text-foreground"
          />
        </div>

        <SafetyNotice />

        <section className="space-y-4">
          <SectionHeader
            title="Ocorrências recentes"
            action={<Link to="/mapa" className="text-sm font-medium text-alert hover:underline">Ver no mapa</Link>}
          />
          {reports.isLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {recent.map((report) => (
                <div key={report.id} className="surface-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {label(FIRE_TYPES, report.type as FireType)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {report.address ?? "Local não informado"} · {formatDate(report.reported_at)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(report.status as FireStatus)}`}
                    >
                      {label(FIRE_STATUSES, report.status as FireStatus)}
                    </span>
                  </div>
                  {report.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {report.description}
                    </p>
                  )}
                  {report.is_demo && <DemoTag />}
                </div>
              ))}
              {recent.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma ocorrência registrada ainda.</p>
              )}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="Notícias e alertas"
            action={
              <Link to="/noticias" className="text-sm font-medium text-alert hover:underline">
                Ver todas
              </Link>
            }
          />
          <div className="grid gap-4 md:grid-cols-3">
            {news.isLoading
              ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-56 rounded-xl" />)
              : (news.data ?? []).slice(0, 3).map((item) => (
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
                        className="h-36 w-full object-cover"
                        loading="lazy"
                      />
                    )}
                    <div className="space-y-2 p-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Newspaper className="size-3.5" />
                        {formatDate(item.created_at)}
                      </div>
                      <h3 className="font-semibold leading-snug group-hover:text-alert">
                        {item.title}
                      </h3>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{item.summary}</p>
                      {item.is_demo && <DemoTag />}
                    </div>
                  </Link>
                ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-xl font-bold md:text-2xl">{title}</h2>
      {action}
    </div>
  );
}

function StatCard({
  label: text,
  value,
  loading,
  icon,
  accent,
}: {
  label: string;
  value?: number;
  loading: boolean;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="surface-card p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        <span className="truncate">{text}</span>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-14" />
      ) : (
        <p className={`mt-1 text-3xl font-extrabold ${accent}`}>{value ?? 0}</p>
      )}
    </div>
  );
}

export function DemoTag() {
  return (
    <span className="mt-2 inline-block rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      Dado de demonstração
    </span>
  );
}
