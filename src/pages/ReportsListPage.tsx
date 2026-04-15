import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Trash2, Eye, FileUp, Loader2, Clock, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useReports } from "@/hooks/use-reports";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const RETENTION_DAYS = 14;

function getDaysRemaining(createdAt: string): number {
  const created = new Date(createdAt);
  const expiry = new Date(created.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function ReportsListPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { reports, isLoading, refetch } = useReports();

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t("reports.deleteConfirm"))) return;

    const { error } = await supabase.from("reports").delete().eq("id", id);
    if (error) {
      toast({ title: t("common.error"), description: t("reports.deleteFailed"), variant: "destructive" });
    } else {
      toast({ title: t("reports.deleted"), description: t("reports.deletedDesc") });
      refetch();
    }
  };

  const statusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          variant: "success" as const,
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
          label: t("common.completed"),
        };
      case "processing":
        return {
          variant: "warning" as const,
          icon: <RefreshCw className="h-3 w-3 mr-1 animate-spin" />,
          label: t("common.processing"),
        };
      case "failed":
        return {
          variant: "danger" as const,
          icon: <AlertCircle className="h-3 w-3 mr-1" />,
          label: t("common.failed"),
        };
      default:
        return {
          variant: "secondary" as const,
          icon: null,
          label: status,
        };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("reports.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("reports.subtitle")}</p>
        </div>
        <Button onClick={() => navigate("/dashboard/analysis")} className="gradient-primary text-primary-foreground">
          <FileUp className="mr-2 h-4 w-4" />
          {t("nav.newAnalysis")}
        </Button>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-sm text-amber-400">
        <Clock className="h-4 w-4 shrink-0" />
        {t("reports.retentionNotice")}
      </div>

      <Card className="glass border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">{t("reports.noReports")}</p>
              <Button variant="link" onClick={() => navigate("/dashboard/analysis")} className="mt-2">
                {t("reports.createFirst")}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("reports.col.title")}</TableHead>
                  <TableHead>{t("reports.col.file")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("reports.col.credits")}</TableHead>
                  <TableHead>{t("common.date")}</TableHead>
                  <TableHead>{t("reports.col.retention")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const status = statusConfig(report.status);
                  const daysLeft = getDaysRemaining(report.created_at);
                  const isUrgent = daysLeft <= 3;

                  return (
                    <TableRow
                      key={report.id}
                      className="cursor-pointer hover:bg-secondary/30"
                      onClick={() => navigate(`/dashboard/reports/${report.id}`)}
                    >
                      <TableCell className="font-medium max-w-[200px] truncate">{report.title}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[160px] truncate">{report.file_name}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="inline-flex items-center whitespace-nowrap">
                          {status.icon}
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{report.credits_used}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {new Date(report.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm whitespace-nowrap ${isUrgent ? "text-red-400 font-medium" : "text-muted-foreground"}`}>
                          {daysLeft > 0
                            ? `${daysLeft} ${t("reports.daysLeft")}`
                            : t("reports.expired")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => handleDelete(report.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
