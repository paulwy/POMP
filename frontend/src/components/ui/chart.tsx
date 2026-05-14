import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./Card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  height?: number;
}

export function ChartContainer({
  title,
  subtitle,
  children,
  className,
  height = 300
}: ChartContainerProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex flex-col space-y-1">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px`, width: "100%" }}>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  icon?: React.ReactNode;
  className?: string;
  iconColor?: string;
}

export function StatCard({
  title,
  value,
  description,
  trend,
  icon,
  className,
  iconColor = "text-primary"
}: StatCardProps) {
  const getTrendColor = () => {
    if (!trend) return "text-muted-foreground";
    switch (trend.direction) {
      case "up":
        return "text-success";
      case "down":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case "up":
        return <TrendingUp className="h-4 w-4" />;
      case "down":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn("hover:shadow-md transition-all duration-normal hover:-translate-y-0.5", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              {trend && (
                <div className={cn("flex items-center gap-1 text-sm font-medium", getTrendColor())}>
                  {getTrendIcon()}
                  <span>{Math.abs(trend.value)}%</span>
                </div>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {icon && (
            <div className={cn("p-3 rounded-full bg-primary/10", iconColor)}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const chartColors = {
  primary: "hsl(var(--chart-primary))",
  primaryLight: "hsl(var(--chart-primary-light))",
  secondary: "hsl(var(--chart-secondary))",
  secondaryLight: "hsl(var(--chart-secondary-light))",
  success: "hsl(var(--chart-success))",
  successLight: "hsl(var(--chart-success-light))",
  warning: "hsl(var(--chart-warning))",
  warningLight: "hsl(var(--chart-warning-light))",
  destructive: "hsl(var(--chart-danger))",
  danger: "hsl(var(--chart-danger))",
  destructiveLight: "hsl(var(--chart-danger-light))",
  info: "hsl(var(--chart-info))",
  infoLight: "hsl(var(--chart-info-light))",
  gray: "hsl(var(--chart-gray))",
  grayLight: "hsl(var(--chart-gray-light))",
  grayLighter: "hsl(var(--chart-gray-lighter))",
};

export const chartGradientOptions = {
  blue: ["hsl(var(--chart-primary-light))", "hsl(var(--chart-primary))"],
  green: ["hsl(var(--chart-success-light))", "hsl(var(--chart-success))"],
  orange: ["hsl(var(--chart-warning-light))", "hsl(var(--chart-warning))"],
  purple: ["hsl(var(--chart-secondary-light))", "hsl(var(--chart-secondary))"],
};

export const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12,
          family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        color: "hsl(var(--muted-foreground))",
      },
    },
    tooltip: {
      backgroundColor: "hsl(var(--card))",
      titleColor: "hsl(var(--foreground))",
      bodyColor: "hsl(var(--muted-foreground))",
      borderColor: "hsl(var(--border))",
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      titleFont: {
        size: 13,
        weight: 600,
      },
      bodyFont: {
        size: 12,
      },
    },
  },
  grid: {
    color: "hsl(var(--border))",
    strokeDashArray: "3 3",
  },
  axis: {
    tickColor: "hsl(var(--muted-foreground))",
    tickFontSize: 11,
  },
};
