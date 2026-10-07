import { useQuery } from "@tanstack/react-query";
import { getFireReports, getNews, getNewsArticle } from "@/lib/beta-store";

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
  updated_at: string;
  fire_report_images: { image_url: string }[];
};

export function useReports() {
  return useQuery({
    queryKey: ["fire_reports"],
    queryFn: async () => getFireReports() as ReportRow[],
  });
}

export function useMyReports(userId: string | null) {
  return useQuery({
    queryKey: ["my_reports", userId],
    enabled: !!userId,
    queryFn: async () => getFireReports(userId) as ReportRow[],
  });
}

export function useNews(category?: string) {
  return useQuery({
    queryKey: ["news", category ?? "all"],
    queryFn: async () => getNews(category),
  });
}

export function useNewsArticle(slug: string) {
  return useQuery({
    queryKey: ["news", "slug", slug],
    queryFn: async () => getNewsArticle(slug),
  });
}

export function useForumPosts(category?: string) {
  return useQuery({
    queryKey: ["forum_posts", category ?? "all"],
    queryFn: async () => {
      const { getData } = await import("@/lib/beta-store");
      const data = getData();
      let posts = [...(data.forum_posts ?? [])];
      if (category) posts = posts.filter((p: any) => p.category === category);
      return posts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
  });
}

export function useCommunityStats() {
  return useQuery({
    queryKey: ["community_stats"],
    queryFn: async () => {
      const reports = getFireReports();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const users = JSON.parse(localStorage.getItem("firehelpbeta_users") || "[]");
      return {
        active: reports.filter((r) => r.status === "active").length,
        today: reports.filter((r) => new Date(r.reported_at) >= today).length,
        resolved: reports.filter((r) => r.status === "resolved").length,
        users: users.length,
      };
    },
  });
}
