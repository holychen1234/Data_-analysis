import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Users, FileText, BrainCircuit, Loader2 } from "lucide-react";

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [usersRes, reportsRes, modelsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("reports").select("id", { count: "exact", head: true }),
        supabase.from("ai_models").select("id", { count: "exact", head: true }),
      ]);
      return {
        users: usersRes.count ?? 0,
        reports: reportsRes.count ?? 0,
        models: modelsRes.count ?? 0,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">{t("admin.dashboard")}</h1>
        <p className="text-muted-foreground mt-1">{t("admin.dashboardDesc")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <AdminStatCard title={t("admin.totalUsers")} value={stats?.users ?? 0} icon={<Users className="h-5 w-5" />} />
        <AdminStatCard title={t("admin.totalReports")} value={stats?.reports ?? 0} icon={<FileText className="h-5 w-5" />} />
        <AdminStatCard title={t("admin.aiModels")} value={stats?.models ?? 0} icon={<BrainCircuit className="h-5 w-5" />} />
      </div>
    </div>
  );
}

function AdminStatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="glass border-border/50 hover:glow-primary transition-all">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
