import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const TaskListSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { count?: number }
>(({ count = 3, ...props }, ref) => {
  return (
    <div ref={ref} className="space-y-3" {...props}>
      {Array.from({ length: count }, (_, index) => index).map((index) => (
        <div
          key={`task-skeleton-${index}`}
          className="flex items-center gap-4 p-4 rounded-lg border border-slate-200"
        >
          <Skeleton className="size-4 rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
});

TaskListSkeleton.displayName = "TaskListSkeleton";

const ActivityListSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { count?: number }
>(({ count = 5, ...props }, ref) => {
  return (
    <div ref={ref} className="space-y-0" {...props}>
      {Array.from({ length: count }, (_, index) => index).map((index) => (
        <div
          key={`activity-skeleton-${index}`}
          className={`flex items-center gap-3 py-3 ${
            index !== count - 1 ? "border-b border-slate-200" : ""
          }`}
        >
          <Skeleton className="size-4 rounded-full flex-shrink-0" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-3 w-16 flex-shrink-0" />
        </div>
      ))}
    </div>
  );
});

ActivityListSkeleton.displayName = "ActivityListSkeleton";

export { TaskListSkeleton, ActivityListSkeleton };
