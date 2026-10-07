import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Crosshair, Flame, Loader2, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SafetyNotice } from "@/components/SafetyNotice";
import { FireMap } from "@/components/map/FireMap";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  FIRE_SEVERITIES,
  FIRE_TYPES,
  SAQUAREMA_CENTER,
  type FireSeverity,
  type FireType,
} from "@/lib/firehelp";

export const Route = createFileRoute("/_authenticated/reportar")({
  head: () => ({
    meta: [
      { title: "Reportar incêndio em Saquarema — FireHelpBeta" },
      {
        name: "description",
        content: "Registre um foco de incêndio em Saquarema: tipo, foto, localização e descrição.",
      },
      { property: "og:title", content: "Reportar incêndio em Saquarema — FireHelpBeta" },
      {
        property: "og:description",
        content: "Registre uma ocorrência e ajude a comunidade de Saquarema a reagir mais rápido.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { user } = useAuth();
  const [type, setType] = useState<FireType | null>(null);
  const [severity, setSeverity] = useState<FireSeverity>("medio");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [protocol, setProtocol] = useState<string | null>(null);

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error("Seu navegador não permite localização automática.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude };
        setCoords(next);
        setLocating(false);
        void reverseGeocode(next);
      },
      () => {
        setLocating(false);
        toast.error("Não conseguimos obter sua localização. Selecione o ponto no mapa.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function reverseGeocode(point: { lat: number; lng: number }) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${point.lat}&lon=${point.lng}&accept-language=pt-BR`,
      );
      const data = (await response.json()) as { display_name?: string };
      if (data.display_name) setAddress(data.display_name);
    } catch {
      /* endereço aproximado é opcional */
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (!type) { toast.error("Escolha o tipo de ocorrência."); return; }
    if (!coords) { toast.error("Informe a localização da ocorrência."); return; }
    if (!confirmed) { toast.error("Confirme que as informações são verdadeiras."); return; }

    setSaving(true);
    try {
      const { data: report, error } = await supabase
        .from("fire_reports")
        .insert({
          user_id: user.id,
          type,
          severity,
          description: description.trim() || null,
          latitude: coords.lat,
          longitude: coords.lng,
          address: address.trim() || null,
        })
        .select("id, protocol")
        .single();
      if (error) throw error;

      for (const file of files) {
        const path = `${user.id}/${report.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "")}`;
        const upload = await supabase.storage.from("fire-images").upload(path, file);
        if (upload.error) continue;
        const signed = await supabase.storage
          .from("fire-images")
          .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
        if (signed.data?.signedUrl) {
          await supabase
            .from("fire_report_images")
            .insert({ fire_report_id: report.id, image_url: signed.data.signedUrl });
        }
      }

      setProtocol(report.protocol);
      toast.success("Ocorrência registrada com sucesso.");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível registrar a ocorrência. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  if (protocol) {
    return (
      <AppShell>
        <div className="mx-auto w-full max-w-lg px-4 py-16 text-center">
          <div className="surface-card space-y-4 p-8">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-success/15 text-success">
              <Flame className="size-7" />
            </div>
            <h1 className="text-2xl font-bold">Ocorrência registrada com sucesso.</h1>
            <p className="text-sm text-muted-foreground">
              Guarde o número de protocolo para acompanhar o andamento.
            </p>
            <p className="rounded-lg bg-muted px-4 py-3 font-display text-xl font-bold tracking-wide">
              {protocol}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button asChild variant="alert">
                <Link to="/mapa">Ver no mapa</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/perfil">Minhas ocorrências</Link>
              </Button>
            </div>
            <SafetyNotice />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold md:text-3xl">🚨 Reportar incêndio em Saquarema</h1>
          <p className="text-sm text-muted-foreground">
            Se você estiver em perigo, afaste-se do local e procure ajuda das autoridades.
          </p>
        </div>

        <SafetyNotice />

        <Field step={1} title="Tipo de ocorrência">
          <div className="flex flex-wrap gap-2">
            {FIRE_TYPES.map((option) => (
              <Chip
                key={option.value}
                active={type === option.value}
                onClick={() => setType(option.value)}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field step={2} title="Nível aparente">
          <div className="flex flex-wrap gap-2">
            {FIRE_SEVERITIES.map((option) => (
              <Chip
                key={option.value}
                active={severity === option.value}
                onClick={() => setSeverity(option.value)}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field step={3} title="Fotos (opcional)">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-card px-4 py-5 text-sm text-muted-foreground hover:bg-secondary">
            <Camera className="size-5" />
            Toque para adicionar fotos da ocorrência
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 5))}
            />
          </label>
          {files.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {files.map((file, index) => (
                <span
                  key={file.name + index}
                  className="flex items-center gap-2 rounded-lg bg-muted px-2 py-1 text-xs"
                >
                  {file.name.slice(0, 22)}
                  <button
                    type="button"
                    onClick={() => setFiles(files.filter((_, i) => i !== index))}
                    aria-label="Remover foto"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Field>

        <Field step={4} title="Localização">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={useMyLocation} disabled={locating}>
              {locating ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
              Usar minha localização
            </Button>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
             <MapPin className="size-3.5" /> ou toque no mapa de Saquarema para marcar o ponto
            </span>
          </div>
          <div className="mt-3 h-64 overflow-hidden rounded-xl border border-border">
            <FireMap
              picked={coords}
              center={coords ? [coords.lat, coords.lng] : SAQUAREMA_CENTER}
              zoom={coords ? 15 : 11}
              onPick={(next) => {
                setCoords(next);
                void reverseGeocode(next);
              }}
            />
          </div>
          {coords && (
            <p className="mt-2 text-xs text-muted-foreground">
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              {address ? ` · ${address}` : ""}
            </p>
          )}
        </Field>

        <Field step={5} title="Descrição">
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="O que você está vendo? Ex.: fumaça densa em área de mata próxima a casas em Itaúna."
            rows={4}
          />
        </Field>

        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
          <Checkbox
            id="confirm"
            checked={confirmed}
            onCheckedChange={(value) => setConfirmed(value === true)}
          />
          <Label htmlFor="confirm" className="text-sm font-normal leading-relaxed">
            Confirmo que as informações enviadas são verdadeiras. Data e horário do registro são
            preenchidos automaticamente.
          </Label>
        </div>

        <Button type="submit" size="xl" variant="hero" className="w-full" disabled={saving}>
          {saving ? <Loader2 className="size-5 animate-spin" /> : <Flame className="size-5" />}
          {saving ? "Enviando..." : "Enviar denúncia"}
        </Button>
      </form>
    </AppShell>
  );
}

function Field({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="grid size-6 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-alert bg-alert text-alert-foreground"
          : "border-border bg-card hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}
