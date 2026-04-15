import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Report {
  id: string;
  user_id: string;
  title: string;
  file_name: string;
  status: "processing" | "completed" | "failed";
  report_html: string | null;
  report_data: Record<string, unknown> | null;
  credits_used: number;
  created_at: string;
}

export function useReports(limit?: number) {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["reports", user?.id, limit],
    queryFn: async () => {
      let query = supabase
        .from("reports")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Report[];
    },
    enabled: !!user,
  });

  return {
    reports: data ?? [],
    isLoading,
    refetch,
  };
}

export function useReport(id: string) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["report", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Report;
    },
    enabled: !!id,
  });

  return { report: data ?? null, isLoading, refetch };
}
