"use client";

import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ErrorDisplayProps {
  error?: Error | null;
  message?: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

export function ErrorDisplay({
  error,
  message,
  onRetry,
  className = "",
  compact = false,
}: ErrorDisplayProps) {
  const errorMessage =
    message || error?.message || "An unexpected error occurred";

  // User-friendly error messages
  const getUserFriendlyMessage = (msg: string): string => {
    if (msg.includes("fetch") || msg.includes("network")) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }
    if (msg.includes("401") || msg.includes("Unauthorized")) {
      return "Your session has expired. Please sign in again.";
    }
    if (msg.includes("403") || msg.includes("Forbidden")) {
      return "You don't have permission to access this resource.";
    }
    if (msg.includes("404") || msg.includes("Not Found")) {
      return "The requested resource was not found.";
    }
    if (msg.includes("500") || msg.includes("Internal Server Error")) {
      return "A server error occurred. Please try again later.";
    }
    return msg;
  };

  const friendlyMessage = getUserFriendlyMessage(errorMessage);

  if (compact) {
    return (
      <div
        className={`rounded-md bg-destructive/10 border border-destructive/20 p-4 ${className}`}
      >
        <div className="flex items-start gap-3">
          <IconAlertCircle className="size-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-destructive font-medium">
              {friendlyMessage}
            </p>
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="ghost"
                size="sm"
                className="mt-2 h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <IconRefresh className="size-3 mr-1" />
                Try again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={`p-8 ${className}`}>
      <div className="flex flex-col items-center text-center max-w-md mx-auto">
        <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <IconAlertCircle className="size-6 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Oops! Something went wrong
        </h3>
        <p className="text-sm text-muted-foreground mb-6">{friendlyMessage}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            <IconRefresh className="size-4 mr-2" />
            Try Again
          </Button>
        )}
        {process.env.NODE_ENV === "development" && error && (
          <details className="mt-6 w-full">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              Error Details (Dev Only)
            </summary>
            <pre className="mt-2 text-left text-xs bg-muted p-4 rounded-md overflow-auto max-h-32">
              {error.stack || error.message}
            </pre>
          </details>
        )}
      </div>
    </Card>
  );
}
