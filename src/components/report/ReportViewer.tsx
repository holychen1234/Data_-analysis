import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartRenderer, type ChartConfig } from "./ChartRenderer";
import { StatCard } from "./StatCard";
import { DataTableView } from "./DataTable";

export interface ReportData {
  title?: string;
  summary?: string;
  stats?: Array<{
    label: string;
    value: string | number;
    change?: string;
    trend?: "up" | "down" | "neutral";
  }>;
  charts?: ChartConfig[];
  tables?: Array<{
    title: string;
    headers: string[];
    rows: (string | number)[][];
  }>;
  insights?: string[];
}

interface ReportViewerProps {
  data: Record<string, unknown>;
}

export function ReportViewer({ data }: ReportViewerProps) {
  const report = data as unknown as ReportData;

  return (
    <div className="space-y-6">
      {/* Summary */}
      {report.summary && (
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-gradient-primary">Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{report.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
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
              <CardHeader>
                <CardTitle className="text-base">{chart.title}</CardTitle>
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
            <CardTitle className="text-gradient-accent">Key Insights</CardTitle>
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
    </div>
  );
}
