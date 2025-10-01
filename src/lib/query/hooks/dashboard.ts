import { useQuery } from "@tanstack/react-query";
import { endOfToday, endOfWeek, startOfToday, startOfWeek } from "date-fns";
import type { Task } from "@/lib/db/schema/tasks";
import { queryKeys } from "@/lib/query/client";

// Dashboard statistics
export interface DashboardStats {
  totalTasks: number;
  completedToday: number;
  overdueTasks: number;
  dueThisWeek: number;
}

// API functions
const dashboardApi = {
  // Fetch dashboard statistics
  fetchStats: async (): Promise<DashboardStats> => {
    const response = await fetch("/api/tasks");

    if (!response.ok) {
      throw new Error("Failed to fetch dashboard stats");
    }

    const { tasks } = await response.json();

    const now = new Date();
    const todayStart = startOfToday();
    const todayEnd = endOfToday();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    // Calculate stats
    const totalTasks = tasks.length;

    const completedToday = tasks.filter((task: Task) => {
      if (task.status !== "completed" || !task.completedAt) return false;
      const completedDate = new Date(task.completedAt);
      return completedDate >= todayStart && completedDate <= todayEnd;
    }).length;

    const overdueTasks = tasks.filter((task: Task) => {
      if (task.status === "completed" || task.status === "cancelled") {
        return false;
      }
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < now;
    }).length;

    const dueThisWeek = tasks.filter((task: Task) => {
      if (task.status === "completed" || task.status === "cancelled") {
        return false;
      }
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= weekStart && dueDate <= weekEnd;
    }).length;

    return {
      totalTasks,
      completedToday,
      overdueTasks,
      dueThisWeek,
    };
  },

  // Fetch today's priority tasks (top 3)
  fetchTodaysTasks: async (): Promise<Task[]> => {
    const response = await fetch("/api/tasks");

    if (!response.ok) {
      throw new Error("Failed to fetch today's tasks");
    }

    const { tasks } = await response.json();
    const today = startOfToday();
    const todayEnd = endOfToday();

    // Priority ranking
    const priorityRank = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    // Filter and sort
    const todaysTasks = tasks
      .filter((task: Task) => {
        // Exclude completed and cancelled
        if (task.status === "completed" || task.status === "cancelled") {
          return false;
        }

        // Include if due today OR high/urgent priority
        const isDueToday =
          task.dueDate &&
          new Date(task.dueDate) >= today &&
          new Date(task.dueDate) <= todayEnd;

        const isHighPriority =
          task.priority === "urgent" || task.priority === "high";

        return isDueToday || isHighPriority;
      })
      .sort((a: Task, b: Task) => {
        // Sort by priority first (highest first)
        const priorityDiff =
          priorityRank[b.priority] - priorityRank[a.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then by due date (soonest first)
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;

        return 0;
      })
      .slice(0, 3); // Top 3 only

    return todaysTasks;
  },

  // Fetch recent activity (last 5 updates)
  fetchRecentActivity: async (): Promise<Task[]> => {
    const response = await fetch(
      "/api/tasks?sortBy=updatedAt&sortOrder=desc&limit=5",
    );

    if (!response.ok) {
      throw new Error("Failed to fetch recent activity");
    }

    const { tasks } = await response.json();
    return tasks;
  },
};

// Hooks

/**
 * Fetch dashboard statistics
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.tasks.stats(),
    queryFn: dashboardApi.fetchStats,
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true,
  });
}

/**
 * Fetch today's priority tasks (top 3)
 */
export function useTodaysTasks() {
  return useQuery({
    queryKey: queryKeys.tasks.today(),
    queryFn: dashboardApi.fetchTodaysTasks,
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true,
  });
}

/**
 * Fetch recent activity (last 5 task updates)
 */
export function useRecentActivity() {
  return useQuery({
    queryKey: queryKeys.tasks.recent(),
    queryFn: dashboardApi.fetchRecentActivity,
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true,
  });
}
