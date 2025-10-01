import {
  IconCalendar,
  IconChartBar,
  IconCircleCheck,
  IconClock,
  IconFileText,
  IconFolder,
  IconPlus,
  IconTarget,
} from "@tabler/icons-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth/auth-simple";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Mobile-only header */}
      <header className="flex lg:hidden h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {session.user.name}!
          </h1>
          <p className="text-slate-600">
            Ready to boost your productivity? Let's get started.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/tasks?new=true">
              <Button className="flex items-center gap-2">
                <IconPlus className="size-4" />
                New Task
              </Button>
            </Link>
            <Link href="/dashboard/tasks">
              <Button variant="outline" className="flex items-center gap-2">
                <IconFileText className="size-4" />
                View All Tasks
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Navigation Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            href="/dashboard/tasks"
            className="block group hover:shadow-lg transition-shadow"
          >
            <div className="bg-white shadow rounded-lg p-6 h-full">
              <div className="flex items-center mb-3">
                <IconFileText className="size-8 mr-3 text-emerald-600" />
                <h3 className="text-lg font-medium text-slate-900 group-hover:text-emerald-600">
                  Task Management
                </h3>
              </div>
              <p className="text-slate-600 text-sm">
                Create, organize, and track your tasks with our powerful task
                manager.
              </p>
              <div className="mt-4 text-sm text-emerald-600 group-hover:text-emerald-700">
                Get started →
              </div>
            </div>
          </Link>

          <div className="bg-white shadow rounded-lg p-6 h-full opacity-60">
            <div className="flex items-center mb-3">
              <IconFolder className="size-8 mr-3 text-slate-400" />
              <h3 className="text-lg font-medium text-slate-500">Categories</h3>
            </div>
            <p className="text-slate-500 text-sm">
              Organize your tasks with custom categories and tags.
            </p>
            <div className="mt-4 text-sm text-slate-400">Coming Soon</div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 h-full opacity-60">
            <div className="flex items-center mb-3">
              <IconCalendar className="size-8 mr-3 text-slate-400" />
              <h3 className="text-lg font-medium text-slate-500">
                Calendar View
              </h3>
            </div>
            <p className="text-slate-500 text-sm">
              Visualize your tasks and deadlines in a calendar format.
            </p>
            <div className="mt-4 text-sm text-slate-400">Coming Soon</div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 h-full opacity-60">
            <div className="flex items-center mb-3">
              <IconChartBar className="size-8 mr-3 text-slate-400" />
              <h3 className="text-lg font-medium text-slate-500">Analytics</h3>
            </div>
            <p className="text-slate-500 text-sm">
              Track your productivity with insightful analytics and reports.
            </p>
            <div className="mt-4 text-sm text-slate-400">Coming Soon</div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 h-full opacity-60">
            <div className="flex items-center mb-3">
              <IconClock className="size-8 mr-3 text-slate-400" />
              <h3 className="text-lg font-medium text-slate-500">
                Time Tracking
              </h3>
            </div>
            <p className="text-slate-500 text-sm">
              Monitor time spent on tasks and improve your efficiency.
            </p>
            <div className="mt-4 text-sm text-slate-400">Coming Soon</div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 h-full opacity-60">
            <div className="flex items-center mb-3">
              <IconTarget className="size-8 mr-3 text-slate-400" />
              <h3 className="text-lg font-medium text-slate-500">
                Goals & Habits
              </h3>
            </div>
            <p className="text-slate-500 text-sm">
              Set and track long-term goals and build productive habits.
            </p>
            <div className="mt-4 text-sm text-slate-400">Coming Soon</div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Account Information
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-slate-500">Name</dt>
                  <dd className="text-sm text-slate-900">
                    {session.user.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Email</dt>
                  <dd className="text-sm text-slate-900">
                    {session.user.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">
                    User ID
                  </dt>
                  <dd className="text-sm text-slate-900 font-mono">
                    {session.user.id}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="bg-emerald-50 p-4 rounded-md">
              <div className="flex items-center">
                <IconCircleCheck className="size-5 text-emerald-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">
                    Account Active
                  </p>
                  <p className="text-xs text-emerald-600">
                    Authentication & security verified
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
