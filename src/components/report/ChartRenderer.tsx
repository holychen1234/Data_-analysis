import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export interface ChartConfig {
  title: string;
  type: "bar" | "line" | "pie" | "area" | "radar";
  data: Record<string, unknown>[];
  xKey?: string;
  yKeys?: string[];
  nameKey?: string;
  valueKey?: string;
}

const CHART_COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(187, 72%, 50%)",
  "hsl(270, 60%, 60%)",
  "hsl(142, 70%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(200, 80%, 55%)",
  "hsl(330, 70%, 55%)",
];

interface ChartRendererProps {
  config: ChartConfig;
}

export function ChartRenderer({ config }: ChartRendererProps) {
  const { type, data, xKey = "name", yKeys = ["value"], nameKey = "name", valueKey = "value" } = config;

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No data available</p>;
  }

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: "hsl(222, 40%, 9%)",
      border: "1px solid hsl(217, 91%, 60%, 0.2)",
      borderRadius: "8px",
      color: "hsl(210, 40%, 95%)",
      fontSize: "12px",
    },
  };

  switch (type) {
    case "bar":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 16%)" />
            <XAxis dataKey={xKey} tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} />
            <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} />
            <Tooltip {...tooltipStyle} />
            <Legend />
            {yKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );

    case "line":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 16%)" />
            <XAxis dataKey={xKey} tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} />
            <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} />
            <Tooltip {...tooltipStyle} />
            <Legend />
            {yKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS[i % CHART_COLORS.length], r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );

    case "pie":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey={valueKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={50}
              paddingAngle={2}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );

    case "area":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 16%)" />
            <XAxis dataKey={xKey} tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} />
            <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} />
            <Tooltip {...tooltipStyle} />
            <Legend />
            {yKeys.map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );

    case "radar":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={data}>
            <PolarGrid stroke="hsl(222, 20%, 16%)" />
            <PolarAngleAxis dataKey={xKey} tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} />
            <PolarRadiusAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} />
            {yKeys.map((key, i) => (
              <Radar
                key={key}
                dataKey={key}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                fillOpacity={0.2}
              />
            ))}
            <Tooltip {...tooltipStyle} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      );

    default:
      return <p className="text-sm text-muted-foreground">Unsupported chart type: {type}</p>;
  }
}
