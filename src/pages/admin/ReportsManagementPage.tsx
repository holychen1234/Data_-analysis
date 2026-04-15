import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileText } from "lucide-react";
import type { Report } from "@/hooks/use-reports";

export default function ReportsManagementPage() {
  const { t } = useLanguage();
  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-all-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*, profiles(display_name, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (Report & { profiles: { display_name: string; email: string } | null })[];
    },
  });

  const statusVariant = (status: string) => {
    switch (status) {
      case "completed": return "default" as const;
      case "processing": return "secondary" as const;
      case "failed": return "destructive" as const;
      default: return "secondary" as const;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "completed": return t("common.completed");
      case "processing": return t("common.processing");
      case "failed": return t("common.failed");
      default: return status;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">{t("admin.reports.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("admin.reports.subtitle")}</p>
      </div>

      <Card className="glass border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (reports ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-sm">{t("admin.reports.noReports")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("reports.col.title")}</TableHead>
                  <TableHead>{t("common.user")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("reports.col.credits")}</TableHead>
                  <TableHead>{t("common.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reports ?? []).map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.title}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{report.profiles?.display_name ?? t("common.unknown")}</p>
                        <p className="text-xs text-muted-foreground">{report.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(report.status)}>{statusLabel(report.status)}</Badge>
                    </TableCell>
                    <TableCell>{report.credits_used}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(report.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
