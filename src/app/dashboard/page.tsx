"use client";

import {
  IconAlertCircle,
  IconArrowRight,
  IconCalendar,
  IconCalendarDue,
  IconCircle,
  IconCircleCheck,
  IconClock,
  IconListCheck,
  IconPlus,
  IconTarget,
} from "@tabler/icons-react";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { StatCard } from "@/components/ui/stat-card";
import { StatCardSkeleton } from "@/components/ui/stat-card-skeleton";
import {
  ActivityListSkeleton,
  TaskListSkeleton,
} from "@/components/ui/task-list-skeleton";
import type { Task, TaskStatus } from "@/lib/db/schema/tasks";
import {
  useDashboardStats,
  useRecentActivity,
  useTodaysTasks,
} from "@/lib/query/hooks/dashboard";
import { useCreateTask } from "@/lib/query/hooks/tasks";

// Status icon mapping
const statusIcons = {
  todo: IconCircle,
  in_progress: IconClock,
  completed: IconCircleCheck,
  cancelled: IconCircleCheck,
} as const;

// Priority badge colors
const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
} as const;

// Priority border colors
const priorityBorderColors = {
  low: "border-l-emerald-400",
  medium: "border-l-yellow-400",
  high: "border-l-orange-400",
  urgent: "border-l-red-400",
} as const;

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [quickTaskTitle, setQuickTaskTitle] = useState("");

  // Data hooks
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: todaysTasks = [], isLoading: todaysLoading } = useTodaysTasks();
  const { data: recentActivity = [], isLoading: activityLoading } =
    useRecentActivity();

  const createTaskMutation = useCreateTask();

  if (status === "loading") {
    return null;
  }

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    try {
      await createTaskMutation.mutateAsync({
        title: quickTaskTitle,
        priority: "medium",
        dueDate: new Date().toISOString(),
      });
      setQuickTaskTitle("");
    } catch (error) {
      console.error("Failed to create quick task:", error);
    }
  };

  // Get status icon
  const getStatusIcon = (status: TaskStatus) => {
    const Icon = statusIcons[status];
    return <Icon className="size-4" />;
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 bg-slate-50">
      {/* Mobile-only header */}
      <header className="flex lg:hidden h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
        <SidebarTrigger className="-ml-1" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
        {/* Welcome Section */}
        <Card className="p-10 mb-8 border-t-4 border-t-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Welcome back, {session.user.name}!
              </h1>
              <p className="text-base text-slate-600">
                Here's what's happening with your tasks today.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-slate-600">
              <IconCalendar className="size-5" />
              <span className="text-sm font-medium">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </span>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                icon={IconListCheck}
                value={stats?.totalTasks ?? 0}
                label="Total Tasks"
                borderColor="border-t-blue-500"
                iconBgColor="bg-blue-500/10"
              />
              <StatCard
                icon={IconCircleCheck}
                value={stats?.completedToday ?? 0}
                label="Completed Today"
                borderColor="border-t-emerald-500"
                iconBgColor="bg-emerald-500/10"
              />
              <StatCard
                icon={IconAlertCircle}
                value={stats?.overdueTasks ?? 0}
                label="Overdue Tasks"
                borderColor="border-t-red-500"
                iconBgColor="bg-red-500/10"
              />
              <StatCard
                icon={IconCalendarDue}
                value={stats?.dueThisWeek ?? 0}
                label="Due This Week"
                borderColor="border-t-amber-500"
                iconBgColor="bg-amber-500/10"
              />
            </>
          )}
        </div>

        {/* Today's Focus */}
        <Card className="p-8 mb-8">
          <div className="mb-8 pb-4 border-b border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  Today's Focus
                </h2>
                <p className="text-sm text-slate-600">
                  Your top priorities for today
                </p>
              </div>
              <Link
                href="/dashboard/tasks"
                className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors mt-1"
              >
                View All
                <IconArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          {todaysLoading ? (
            <TaskListSkeleton count={3} className="mb-6" />
          ) : todaysTasks.length === 0 ? (
            <EmptyState
              icon={IconTarget}
              title="No tasks scheduled for today"
              description="Add a new task to get started"
              action={
                <Link href="/dashboard/tasks?new=true">
                  <Button>
                    <IconPlus className="size-4 mr-2" />
                    Create Task
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3 mb-6">
              {todaysTasks.map((task: Task) => (
                <Link
                  key={task.id}
                  href={`/dashboard/tasks?id=${task.id}`}
                  className="block"
                >
                  <div
                    className={`flex items-center gap-4 p-5 rounded-lg border border-slate-300 hover:border-slate-400 hover:shadow-lg hover:-translate-y-0.5 transition-all border-l-4 ${priorityBorderColors[task.priority]}`}
                  >
                    <div className="flex-shrink-0">
                      {getStatusIcon(task.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 truncate">
                        {task.title}
                      </h3>
                      {task.dueDate && (
                        <p className="text-xs text-slate-500 mt-1">
                          Due: {format(new Date(task.dueDate), "p")}
                        </p>
                      )}
                    </div>
                    <Badge
                      className={priorityColors[task.priority]}
                      variant="outline"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Quick Add Form */}
          <form onSubmit={handleQuickAdd} className="flex gap-2">
            <Input
              type="text"
              placeholder="Add a quick task for today..."
              value={quickTaskTitle}
              onChange={(e) => setQuickTaskTitle(e.target.value)}
              disabled={createTaskMutation.isPending}
              className="flex-1"
            />
            <Button
              type="submit"
              variant="ghost"
              disabled={createTaskMutation.isPending || !quickTaskTitle.trim()}
            >
              {createTaskMutation.isPending ? (
                <IconClock className="size-4 animate-spin" />
              ) : (
                <IconPlus className="size-4" />
              )}
            </Button>
          </form>
        </Card>

        {/* Recent Activity */}
        <Card className="p-8">
          <div className="mb-8 pb-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-slate-900">
                Recent Activity
              </h2>
              <Link
                href="/dashboard/tasks"
                className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                View All
                <IconArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          {activityLoading ? (
            <ActivityListSkeleton count={5} />
          ) : recentActivity.length === 0 ? (
            <EmptyState
              icon={IconClock}
              title="No recent activity"
              description="Task updates will appear here"
            />
          ) : (
            <div className="space-y-0">
              {recentActivity.map((task: Task, index: number) => (
                <Link
                  key={task.id}
                  href={`/dashboard/tasks?id=${task.id}`}
                  className="block"
                >
                  <div
                    className={`flex items-center gap-3 py-3 hover:bg-slate-100 -mx-2 px-2 rounded transition-colors ${
                      index !== recentActivity.length - 1
                        ? "border-b border-slate-200"
                        : ""
                    }`}
                  >
                    <div className="flex-shrink-0 text-slate-400">
                      {getStatusIcon(task.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 truncate">
                        {task.title}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {formatDistanceToNow(new Date(task.updatedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
