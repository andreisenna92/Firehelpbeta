import type { Database } from "@/integrations/supabase/types";

export type FireType = Database["public"]["Enums"]["fire_type"];
export type FireSeverity = Database["public"]["Enums"]["fire_severity"];
export type FireStatus = Database["public"]["Enums"]["fire_status"];
export type NewsCategory = Database["public"]["Enums"]["news_category"];
export type ForumCategory = Database["public"]["Enums"]["forum_category"];

export const SAQUAREMA_CENTER: [number, number] = [-22.9324, -42.4867];

export const FIRE_TYPES: { value: FireType; label: string }[] = [
  { value: "florestal", label: "Incêndio florestal" },
  { value: "residencial", label: "Incêndio residencial" },
  { value: "comercial", label: "Incêndio comercial" },
  { value: "veicular", label: "Incêndio veicular" },
  { value: "queimada", label: "Queimada" },
  { value: "outro", label: "Outro" },
];

export const FIRE_SEVERITIES: { value: FireSeverity; label: string }[] = [
  { value: "pequeno", label: "Pequeno" },
  { value: "medio", label: "Médio" },
  { value: "grande", label: "Grande" },
  { value: "emergencia", label: "Emergência" },
];

export const FIRE_STATUSES: { value: FireStatus; label: string }[] = [
  { value: "pending", label: "Reportado" },
  { value: "verified", label: "Verificado" },
  { value: "active", label: "Ativo" },
  { value: "resolved", label: "Resolvido" },
  { value: "false_report", label: "Encerrado / falso" },
];

export const NEWS_CATEGORIES: { value: NewsCategory; label: string }[] = [
  { value: "prevencao", label: "Prevenção" },
  { value: "incendios", label: "Incêndios" },
  { value: "meio_ambiente", label: "Meio ambiente" },
  { value: "seguranca", label: "Segurança" },
  { value: "alertas", label: "Alertas" },
  { value: "comunidade", label: "Comunidade" },
];

export const FORUM_CATEGORIES: { value: ForumCategory; label: string; emoji: string }[] = [
  { value: "incendios", label: "Incêndios", emoji: "🔥" },
  { value: "meio_ambiente", label: "Meio ambiente", emoji: "🌳" },
  { value: "prevencao", label: "Prevenção", emoji: "🧯" },
  { value: "seguranca", label: "Segurança", emoji: "🚒" },
  { value: "alertas", label: "Alertas", emoji: "📢" },
  { value: "comunidade", label: "Comunidade", emoji: "🤝" },
  { value: "geral", label: "Geral", emoji: "💬" },
];

export const REPORT_REASONS = [
  "Informação falsa",
  "Conteúdo ofensivo",
  "Spam",
  "Conteúdo perigoso",
  "Outro",
];

export function label<T extends string>(list: { value: T; label: string }[], value: T | null) {
  return list.find((item) => item.value === value)?.label ?? "—";
}

/** Marker / badge color per occurrence status. */
export function statusColor(status: FireStatus): string {
  switch (status) {
    case "active":
      return "#e5484d";
    case "pending":
      return "#f0801a";
    case "verified":
      return "#d9a406";
    case "resolved":
      return "#1f9d5a";
    default:
      return "#8b93a1";
  }
}

export function statusBadgeClass(status: FireStatus): string {
  switch (status) {
    case "active":
      return "bg-alert/12 text-alert border-alert/30";
    case "pending":
      return "bg-ember/15 text-ember border-ember/30";
    case "verified":
      return "bg-warning/20 text-warning-foreground border-warning/40";
    case "resolved":
      return "bg-success/15 text-success border-success/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export const SAFETY_NOTICE =
  "O FireHelp é uma plataforma comunitária de informação. Em situações de emergência, afaste-se do perigo e acione os serviços oficiais de emergência.";
