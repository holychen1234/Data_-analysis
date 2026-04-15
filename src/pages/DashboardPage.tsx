import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileUp, FileText, Coins, TrendingUp, Clock, BarChart3 } from "lucide-react";
import { useReports } from "@/hooks/use-reports";

export default function DashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { reports, isLoading } = useReports(5);

  const completedReports = reports.filter((r) => r.status === "completed").length;
  const totalReports = reports.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="glass rounded-xl p-6 glow-primary">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, <span className="text-gradient-primary">{profile?.display_name || "User"}</span>
            </h1>
            <p className="mt-1 text-muted-foreground">
              Upload your data and let AI generate beautiful analysis reports
            </p>
          </div>
          <Button onClick={() => navigate("/analysis")} className="gradient-primary text-primary-foreground shrink-0">
            <FileUp className="mr-2 h-4 w-4" />
            New Analysis
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Credits Balance"
          value={profile?.credits ?? 0}
          icon={<Coins className="h-5 w-5" />}
          accent="primary"
        />
        <StatCard
          title="Total Reports"
          value={totalReports}
          icon={<FileText className="h-5 w-5" />}
          accent="accent"
        />
        <StatCard
          title="Completed"
          value={completedReports}
          icon={<TrendingUp className="h-5 w-5" />}
          accent="chart-4"
        />
      </div>

      {/* Recent reports */}
      <Card className="glass border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Reports</CardTitle>
            <CardDescription>Your latest analysis reports</CardDescription>
          </div>
          {reports.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/reports")}>
              View All
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground mb-4">No reports yet. Start your first analysis!</p>
              <Button onClick={() => navigate("/analysis")} variant="outline" className="border-primary/30 hover:bg-primary/10">
                <FileUp className="mr-2 h-4 w-4" />
                Upload Data
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => navigate(`/reports/${report.id}`)}
                  className="flex w-full items-center justify-between rounded-lg border border-border/50 p-3 text-left transition-all hover:bg-secondary/50 hover:border-primary/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{report.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={report.status === "completed" ? "default" : report.status === "processing" ? "secondary" : "destructive"}
                    className="shrink-0 ml-2"
                  >
                    {report.status}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Card className="glass border-border/50 hover:glow-primary transition-all">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-${accent}/10 text-${accent}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
