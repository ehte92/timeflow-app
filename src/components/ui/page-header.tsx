import { ChevronLeft } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  backButton?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    { className, title, description, backButton, onBack, actions, ...props },
    ref,
  ) => {
    return (
      <div ref={ref} className={cn("mb-8", className)} {...props}>
        {/* Back Button (if present) */}
        {backButton && onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-4 -ml-2"
          >
            <ChevronLeft className="size-4 mr-1" />
            Back
          </Button>
        )}

        {/* Header Content */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Title and Description */}
          <div className="flex-1 space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {description && (
              <p className="text-base text-muted-foreground">{description}</p>
            )}
          </div>

          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-2 sm:self-start">
              {actions}
            </div>
          )}
        </div>
      </div>
    );
  },
);

PageHeader.displayName = "PageHeader";

export { PageHeader };
