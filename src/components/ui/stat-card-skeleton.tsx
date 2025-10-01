import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const StatCardSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => {
  return (
    <div
      ref={ref}
      className="rounded-lg border border-border bg-card shadow-sm p-8"
      {...props}
    >
      <div className="flex flex-col space-y-4">
        {/* Icon placeholder */}
        <div className="flex items-center justify-between">
          <Skeleton className="size-12 rounded-lg" />
        </div>

        {/* Value and label placeholders */}
        <div className="space-y-1">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
    </div>
  );
});

StatCardSkeleton.displayName = "StatCardSkeleton";

export { StatCardSkeleton };
