import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Post = { id: string; title: string; content: string; image_url?: string | null };

export function AdminPostEditor({ post, onDone }: { post: Post; onDone: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [imageUrl, setImageUrl] = useState(post.image_url ?? "");
  const [saving, setSaving] = useState(false);

  async function upload(file: File) {
    if (!user) return;
    const path = `${user.id}/posts/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const up = await supabase.storage.from("fire-images").upload(path, file);
    if (up.error) { toast.error("Falha ao enviar a foto."); return; }
    const { data } = await supabase.storage.from("fire-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    if (data?.signedUrl) setImageUrl(data.signedUrl);
  }

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("forum_posts")
      .update({ title: title.trim(), content: content.trim(), image_url: imageUrl || null, updated_at: new Date().toISOString() })
      .eq("id", post.id);
    setSaving(false);
    if (error) { toast.error("Não foi possível salvar."); return; }
    toast.success("Post atualizado.");
    void qc.invalidateQueries({ queryKey: ["forum_posts"] });
    onDone();
  }

  return (
    <div className="mt-3 w-full space-y-2">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
      {imageUrl && <img src={imageUrl} alt="" className="h-32 rounded-lg object-cover" />}
      <div className="flex flex-wrap items-center gap-2">
        <Input type="file" accept="image/*" className="max-w-xs" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        {imageUrl && <Button size="sm" variant="outline" onClick={() => setImageUrl("")}>Remover foto</Button>}
        <Button size="sm" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        <Button size="sm" variant="ghost" onClick={onDone}>Cancelar</Button>
      </div>
    </div>
  );
}
