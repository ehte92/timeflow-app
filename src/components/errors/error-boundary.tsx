"use client";

import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by ErrorBoundary:", error, errorInfo);
    }

    // In production, you would send this to an error tracking service like Sentry
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Allow custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted">
          <Card className="max-w-md w-full p-8">
            <div className="flex flex-col items-center text-center">
              <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <IconAlertTriangle className="size-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Something went wrong
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                {this.state.error?.message ||
                  "An unexpected error occurred. Please try again."}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                  }}
                  variant="outline"
                >
                  <IconRefresh className="size-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={() => {
                    window.location.href = "/dashboard";
                  }}
                >
                  Go to Dashboard
                </Button>
              </div>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-6 w-full">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    Error Details (Dev Only)
                  </summary>
                  <pre className="mt-2 text-left text-xs bg-muted p-4 rounded-md overflow-auto max-h-40">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
