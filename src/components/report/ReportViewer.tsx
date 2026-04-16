import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChartRenderer, type ChartConfig } from "./ChartRenderer";
import { StatCard } from "./StatCard";
import { DataTableView } from "./DataTable";
import { Lightbulb, Rocket } from "lucide-react";

export interface ReportData {
  title?: string;
  summary?: string;
  stats?: Array<{
    label: string;
    value: string | number;
    change?: string;
    trend?: "up" | "down" | "neutral";
  }>;
  charts?: (ChartConfig & { description?: string })[];
  tables?: Array<{
    title: string;
    description?: string;
    headers: string[];
    rows: (string | number)[][];
  }>;
  insights?: string[];
  recommendations?: string[];
}

interface ReportViewerProps {
  data: Record<string, unknown>;
}

export function ReportViewer({ data }: ReportViewerProps) {
  const report = data as unknown as ReportData;
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Summary */}
      {report.summary && (
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-gradient-primary">{t("report.summary")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{report.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Key Stats */}
      {report.stats && report.stats.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {report.stats.map((stat, i) => (
            <StatCard key={i} stat={stat} index={i} />
          ))}
        </div>
      )}

      {/* Charts */}
      {report.charts && report.charts.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {report.charts.map((chart, i) => (
            <Card key={i} className="glass border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{chart.title}</CardTitle>
                {chart.description && (
                  <p className="text-xs text-muted-foreground mt-1">{chart.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <ChartRenderer config={chart} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tables */}
      {report.tables && report.tables.length > 0 && (
        <div className="space-y-6">
          {report.tables.map((table, i) => (
            <DataTableView key={i} table={table} />
          ))}
        </div>
      )}

      {/* Insights */}
      {report.insights && report.insights.length > 0 && (
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-400" />
              <span className="text-gradient-accent">{t("report.keyInsights")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {report.insights.map((insight, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-primary text-[10px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed pt-0.5">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <Card className="glass border-border/50 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <span className="text-gradient-primary">{t("report.recommendations")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {report.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary border border-primary/30">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed pt-0.5 text-foreground">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
