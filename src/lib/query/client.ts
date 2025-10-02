import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 1000 * 60 * 5,
      // Keep data in cache for 10 minutes after last use
      gcTime: 1000 * 60 * 10,
      // Retry failed queries 2 times with exponential backoff
      retry: 2,
      // Refetch on window focus for real-time updates
      refetchOnWindowFocus: true,
      // Don't refetch on mount if data exists and is fresh
      refetchOnMount: "always",
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      // Global error handler for mutations
      onError: (error) => {
        console.error("Mutation error:", error);
      },
    },
  },
});

// Global error handler for queries
queryClient.setMutationDefaults(["auth"], {
  mutationFn: async () => {
    throw new Error("Authentication required");
  },
  onError: (error: unknown) => {
    if ((error as { status?: number })?.status === 401) {
      // Handle 401 errors globally - redirect to login
      window.location.href = "/auth/signin";
    }
  },
});

// Query key factory for consistent naming
export const queryKeys = {
  tasks: {
    all: () => ["tasks"] as const,
    lists: () => ["tasks", "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["tasks", "list", filters] as const,
    details: () => ["tasks", "detail"] as const,
    detail: (id: string) => ["tasks", "detail", id] as const,
    stats: () => ["tasks", "stats"] as const,
    today: () => ["tasks", "today"] as const,
    recent: () => ["tasks", "recent"] as const,
  },
  categories: {
    all: () => ["categories"] as const,
    lists: () => ["categories", "list"] as const,
  },
  timeBlocks: {
    all: () => ["timeBlocks"] as const,
    lists: () => ["timeBlocks", "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["timeBlocks", "list", filters] as const,
    details: () => ["timeBlocks", "detail"] as const,
    detail: (id: string) => ["timeBlocks", "detail", id] as const,
  },
} as const;
