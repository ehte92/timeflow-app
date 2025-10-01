import { ArrowDown, ArrowUp } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  borderColor?: string;
  iconBgColor?: string;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      icon: Icon,
      value,
      label,
      trend,
      borderColor = "border-t-primary",
      iconBgColor = "bg-primary/10",
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-border bg-card shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 p-8 border-t-4",
          borderColor,
          className,
        )}
        {...props}
      >
        <div className="flex flex-col space-y-6">
          {/* Icon */}
          <div className="flex items-center justify-between">
            <div
              className={cn(
                "flex size-12 items-center justify-center rounded-lg",
                iconBgColor,
              )}
            >
              <Icon className="size-6" />
            </div>
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  trend.isPositive ? "text-success" : "text-destructive",
                )}
              >
                {trend.isPositive ? (
                  <ArrowUp className="size-3" />
                ) : (
                  <ArrowDown className="size-3" />
                )}
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>

          {/* Value */}
          <div className="space-y-1">
            <p className="text-5xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
          </div>
        </div>
      </div>
    );
  },
);

StatCard.displayName = "StatCard";

export { StatCard };
