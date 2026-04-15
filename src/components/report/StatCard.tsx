import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Stat {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
}

const accentColors = [
  "bg-primary/10 text-primary",
  "bg-accent/10 text-accent",
  "bg-chart-3/10 text-chart-3",
  "bg-chart-4/10 text-chart-4",
  "bg-chart-5/10 text-chart-5",
];

export function StatCard({ stat, index }: { stat: Stat; index: number }) {
  const colorClass = accentColors[index % accentColors.length];

  return (
    <Card className="glass border-border/50 hover:glow-primary transition-all">
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{stat.label}</p>
        <p className="text-2xl font-bold mt-1">{stat.value}</p>
        {stat.change && (
          <div className="flex items-center gap-1 mt-2">
            {stat.trend === "up" ? (
              <TrendingUp className="h-3.5 w-3.5 text-chart-4" />
            ) : stat.trend === "down" ? (
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            ) : (
              <Minus className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span
              className={`text-xs font-medium ${
                stat.trend === "up"
                  ? "text-chart-4"
                  : stat.trend === "down"
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {stat.change}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
