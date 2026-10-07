import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useNews } from "@/hooks/useFirehelp";
import { useAuth } from "@/hooks/useAuth";
import { createNews } from "@/lib/beta-store";
import { NEWS_CATEGORIES, formatDate } from "@/lib/firehelp";

export const Route = createFileRoute("/noticias/")({
  head: () => ({
    meta: [
      { title: "Notícias e alertas de Saquarema — FireHelp" },
      { name: "description", content: "Notícias, alertas e conteúdos de prevenção contra incêndios para Saquarema, RJ." },
      { property: "og:title", content: "Notícias e alertas de Saquarema — FireHelp" },
      { property: "og:description", content: "Prevenção, meio ambiente, segurança e alertas para Saquarema." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewsList,
});

function NewsList() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const { data, isLoading } = useNews(category);
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [openCreate, setOpenCreate] = useState(false);
  const [contentType, setContentType] = useState<'noticia' | 'alerta'>('noticia');
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("prevencao");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem."); return; }
    try { setImageUrl(await resizeImage(file, 1280, 0.82)); }
    catch { toast.error("Não foi possível carregar a foto."); }
    event.target.value = "";
  }

  function publish(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !profile) { toast.error("Faça login para publicar."); return; }
    if (!title.trim() || !content.trim()) { toast.error("Título e descrição são obrigatórios."); return; }
    if (!imageUrl) { toast.error("A foto é obrigatória para notícias e alertas."); return; }
    setBusy(true);
    createNews({
      title: title.trim(), summary: summary.trim() || null, content: content.trim(), image_url: imageUrl,
      category: selectedCategory, content_type: contentType, author_id: user.id, author_name: profile.full_name,
      published: true,
    });
    setTitle(""); setSummary(""); setContent(""); setImageUrl(null); setOpenCreate(false); setBusy(false);
    void queryClient.invalidateQueries({ queryKey: ["news"] });
    toast.success(contentType === 'alerta' ? "Alerta publicado." : "Notícia publicada.");
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">📰 Notícias e alertas</h1>
            <p className="text-sm text-muted-foreground">Conteúdos de prevenção, alertas e informações para Saquarema.</p>
          </div>
          {user && <Button onClick={() => setOpenCreate((value) => !value)}>{openCreate ? "Fechar" : "+ Publicar notícia ou alerta"}</Button>}
        </div>

        {openCreate && user && (
          <form onSubmit={publish} className="surface-card space-y-4 p-5">
            <div>
              <h2 className="text-lg font-bold">Nova publicação</h2>
              <p className="text-sm text-muted-foreground">Qualquer membro logado pode publicar. A foto é obrigatória.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setContentType('noticia')} className={chipClass(contentType === 'noticia')}>📰 Notícia</button>
              <button type="button" onClick={() => setContentType('alerta')} className={chipClass(contentType === 'alerta')}>🚨 Alerta</button>
            </div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
            <Input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Resumo" />
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Descrição / conteúdo" rows={5} />
            <div className="grid gap-3 md:grid-cols-2">
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                {NEWS_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <label className="flex cursor-pointer items-center justify-center rounded-md border border-dashed border-border px-3 py-2 text-sm font-semibold hover:bg-muted">
                📷 {imageUrl ? "Trocar foto" : "Adicionar foto obrigatória"}
                <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
              </label>
            </div>
            {imageUrl && <img src={imageUrl} alt="Pré-visualização" className="max-h-72 w-full rounded-xl object-cover" />}
            <Button type="submit" disabled={busy}>{busy ? "Publicando..." : "Publicar"}</Button>
          </form>
        )}

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setCategory(undefined)} className={chipClass(category === undefined)}>Todas</button>
          {NEWS_CATEGORIES.map((item) => <button key={item.value} type="button" onClick={() => setCategory(item.value)} className={chipClass(category === item.value)}>{item.label}</button>)}
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">{[0,1,2,3,4,5].map((i) => <Skeleton key={i} className="h-72 rounded-xl" />)}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {(data ?? []).map((item: any) => (
              <Link key={item.id} to="/noticias/$slug" params={{ slug: item.slug }} className="surface-card group overflow-hidden transition-shadow hover:shadow-lift">
                {item.image_url && <img src={item.image_url} alt={item.title} className="h-44 w-full object-cover" loading="lazy" />}
                <div className="space-y-2 p-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-foreground">{item.content_type === 'alerta' ? 'Alerta' : 'Notícia'}</span>
                    <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{NEWS_CATEGORIES.find((c) => c.value === item.category)?.label}</span>
                  </div>
                  <h2 className="font-semibold leading-snug group-hover:text-alert">{item.title}</h2>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{item.summary}</p>
                  <p className="text-xs text-muted-foreground">{item.author_name ?? "FireHelp"} · {formatDate(item.created_at)}</p>
                </div>
              </Link>
            ))}
            {(data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhuma publicação nesta categoria.</p>}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function chipClass(active: boolean) {
  return `rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-secondary"}`;
}

async function resizeImage(file: File, maxSize: number, quality: number) {
  const src = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src; });
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}
