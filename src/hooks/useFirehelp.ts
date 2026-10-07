import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ReportRow = {
  id: string;
  protocol: string;
  user_id: string | null;
  type: string;
  severity: string;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  status: string;
  is_demo: boolean;
  reported_at: string;
  fire_report_images: { image_url: string }[];
};

export function useReports() {
  return useQuery({
    queryKey: ["fire_reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fire_reports")
        .select("*, fire_report_images(image_url)")
        .order("reported_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ReportRow[];
    },
  });
}

export function useMyReports(userId: string | null) {
  return useQuery({
    queryKey: ["my_reports", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fire_reports")
        .select("*, fire_report_images(image_url)")
        .eq("user_id", userId!)
        .order("reported_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ReportRow[];
    },
  });
}

export function useNews(category?: string) {
  return useQuery({
    queryKey: ["news", category ?? "all"],
    queryFn: async () => {
      let query = supabase.from("news").select("*").order("created_at", { ascending: false });
      if (category) query = query.eq("category", category as never);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useNewsArticle(slug: string) {
  return useQuery({
    queryKey: ["news", "slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useForumPosts(category?: string) {
  return useQuery({
    queryKey: ["forum_posts", category ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("forum_posts")
        .select("*, forum_comments(id, created_at)")
        .order("created_at", { ascending: false });
      if (category) query = query.eq("category", category as never);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as (Record<string, never> & {
        id: string;
        title: string;
        content: string;
        category: string;
        author_name: string | null;
        user_id: string | null;
        is_demo: boolean;
        created_at: string;
        forum_comments: { id: string; created_at: string }[];
      })[];
    },
  });
}

export function useCommunityStats() {
  return useQuery({
    queryKey: ["community_stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [active, todayCount, resolved, users] = await Promise.all([
        supabase
          .from("fire_reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        supabase
          .from("fire_reports")
          .select("id", { count: "exact", head: true })
          .gte("reported_at", today.toISOString()),
        supabase
          .from("fire_reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "resolved"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      return {
        active: active.count ?? 0,
        today: todayCount.count ?? 0,
        resolved: resolved.count ?? 0,
        users: users.count ?? 0,
      };
    },
  });
}
