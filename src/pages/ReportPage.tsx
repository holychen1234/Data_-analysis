import { useParams, useNavigate } from "react-router-dom";
import { useReport } from "@/hooks/use-reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { ReportViewer } from "@/components/report/ReportViewer";
import { exportReportAsHtml } from "@/components/report/ReportExporter";

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { report, isLoading } = useReport(id || "");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">Report not found</p>
        <Button variant="outline" onClick={() => navigate("/dashboard/reports")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reports
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/reports")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{report.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={report.status === "completed" ? "default" : "secondary"}>
                {report.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {report.file_name} &middot; {new Date(report.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        {report.status === "completed" && (
          <Button
            variant="outline"
            onClick={() => exportReportAsHtml(report)}
            className="border-primary/30 hover:bg-primary/10"
          >
            <Download className="mr-2 h-4 w-4" />
            Export HTML
          </Button>
        )}
      </div>

      {/* Report content */}
      {report.status === "completed" && report.report_data ? (
        <ReportViewer data={report.report_data} />
      ) : report.status === "processing" ? (
        <Card className="glass border-border/50 glow-primary">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Analysis is still processing...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass border-border/50">
          <CardContent className="flex items-center justify-center py-16">
            <p className="text-destructive">Analysis failed. Please try again.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
