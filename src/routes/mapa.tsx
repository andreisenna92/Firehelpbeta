import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Flame } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { FireMap } from "@/components/map/FireMap";
import { useReports } from "@/hooks/useFirehelp";
import {
  FIRE_STATUSES,
  FIRE_TYPES,
  formatDateTime,
  label,
  statusBadgeClass,
  statusColor,
  type FireStatus,
  type FireType,
} from "@/lib/firehelp";

export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa de incêndios em Saquarema — FireHelpBeta" },
      {
        name: "description",
        content:
          "Mapa interativo com focos de incêndio reportados pela comunidade de Saquarema, RJ.",
      },
      { property: "og:title", content: "Mapa de incêndios em Saquarema — FireHelpBeta" },
      {
        property: "og:description",
        content: "Veja focos de incêndio ativos, reportados e resolvidos em Saquarema.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapPage,
});

type StatusFilter = "todos" | FireStatus;
type TypeFilter = "todos" | FireType;

function MapPage() {
  const { data, isLoading } = useReports();
  const [status, setStatus] = useState<StatusFilter>("todos");
  const [type, setType] = useState<TypeFilter>("todos");

  const reports = data ?? [];
  const filtered = useMemo(
    () =>
      reports.filter(
        (r) =>
          (status === "todos" || r.status === status) && (type === "todos" || r.type === type),
      ),
    [reports, status, type],
  );

  const byId = useMemo(() => new Map(reports.map((r) => [r.id, r])), [reports]);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Mapa de ocorrências em Saquarema</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Carregando ocorrências..." : `${filtered.length} ocorrência(s) exibida(s)`}
            </p>
          </div>
          <Button asChild variant="alert">
            <Link to="/reportar">
              <Flame className="size-4" /> Reportar incêndio
            </Link>
          </Button>
        </div>

        <div className="space-y-2">
          <FilterRow
            options={[{ value: "todos", label: "Todos" }, ...FIRE_STATUSES]}
            value={status}
            onChange={(v) => setStatus(v as StatusFilter)}
          />
          <FilterRow
            options={[{ value: "todos", label: "Todos os tipos" }, ...FIRE_TYPES]}
            value={type}
            onChange={(v) => setType(v as TypeFilter)}
          />
        </div>

        <div className="h-[55vh] min-h-[360px] overflow-hidden rounded-2xl border border-border shadow-soft">
          <FireMap
            points={filtered.map((r) => ({
              id: r.id,
              latitude: r.latitude,
              longitude: r.longitude,
              status: r.status as FireStatus,
            }))}
            zoom={12}
            renderPopup={(id) => {
              const report = byId.get(id);
              if (!report) return null;
              return (
                <div className="space-y-1.5 text-sm">
                  <p className="font-semibold">{label(FIRE_TYPES, report.type as FireType)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(report.reported_at)}
                  </p>
                  <p className="text-xs">
                    Status: <strong>{label(FIRE_STATUSES, report.status as FireStatus)}</strong> ·
                    Nível: <strong>{report.severity}</strong>
                  </p>
                  {report.fire_report_images?.[0] && (
                    <img
                      src={report.fire_report_images[0].image_url}
                      alt="Foto da ocorrência"
                      className="h-24 w-full rounded object-cover"
                    />
                  )}
                  {report.description && <p className="text-xs">{report.description}</p>}
                  <p className="text-xs text-muted-foreground">
                    {report.address ?? `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
                  </p>
                </div>
              );
            }}
          />
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          {(["active", "pending", "resolved", "false_report"] as FireStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span
                className="size-3 rounded-full border border-white"
                style={{ backgroundColor: statusColor(s) }}
              />
              {label(FIRE_STATUSES, s)}
            </span>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((report) => (
            <div key={report.id} className="surface-card p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{label(FIRE_TYPES, report.type as FireType)}</p>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(report.status as FireStatus)}`}
                >
                  {label(FIRE_STATUSES, report.status as FireStatus)}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {report.address ?? "Local aproximado"} · {formatDateTime(report.reported_at)}
              </p>
              {report.description && <p className="mt-2 text-sm">{report.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function FilterRow({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === option.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:bg-secondary"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
