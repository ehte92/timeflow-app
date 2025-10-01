import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon: Icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center py-16 px-4 text-center",
          className,
        )}
        {...props}
      >
        {/* Icon */}
        <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-muted">
          <Icon className="size-8 text-muted-foreground" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            {description}
          </p>
        )}

        {/* Action Button */}
        {action && <div>{action}</div>}
      </div>
    );
  },
);

EmptyState.displayName = "EmptyState";

export { EmptyState };
