import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/auth-simple";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session.user.name}!
          </h1>
          <p className="text-gray-600">
            Ready to boost your productivity? Let's get started.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/tasks?new=true">
              <Button className="flex items-center gap-2">
                ➕ New Task
              </Button>
            </Link>
            <Link href="/dashboard/tasks">
              <Button variant="outline" className="flex items-center gap-2">
                📝 View All Tasks
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
                <div className="text-3xl mr-3">📝</div>
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                  Task Management
                </h3>
              </div>
              <p className="text-gray-600 text-sm">
                Create, organize, and track your tasks with our powerful task manager.
              </p>
              <div className="mt-4 text-sm text-blue-600 group-hover:text-blue-700">
                Get started →
              </div>
            </div>
          </Link>

          <div className="bg-white shadow rounded-lg p-6 h-full opacity-60">
            <div className="flex items-center mb-3">
              <div className="text-3xl mr-3">📁</div>
              <h3 className="text-lg font-medium text-gray-500">
                Categories
              </h3>
            </div>
            <p className="text-gray-500 text-sm">
              Organize your tasks with custom categories and tags.
            </p>
            <div className="mt-4 text-sm text-gray-400">
              Coming Soon
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 h-full opacity-60">
            <div className="flex items-center mb-3">
              <div className="text-3xl mr-3">📅</div>
              <h3 className="text-lg font-medium text-gray-500">
                Calendar View
              </h3>
            </div>
            <p className="text-gray-500 text-sm">
              Visualize your tasks and deadlines in a calendar format.
            </p>
            <div className="mt-4 text-sm text-gray-400">
              Coming Soon
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 h-full opacity-60">
            <div className="flex items-center mb-3">
              <div className="text-3xl mr-3">📊</div>
              <h3 className="text-lg font-medium text-gray-500">
                Analytics
              </h3>
            </div>
            <p className="text-gray-500 text-sm">
              Track your productivity with insightful analytics and reports.
            </p>
            <div className="mt-4 text-sm text-gray-400">
              Coming Soon
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 h-full opacity-60">
            <div className="flex items-center mb-3">
              <div className="text-3xl mr-3">⏰</div>
              <h3 className="text-lg font-medium text-gray-500">
                Time Tracking
              </h3>
            </div>
            <p className="text-gray-500 text-sm">
              Monitor time spent on tasks and improve your efficiency.
            </p>
            <div className="mt-4 text-sm text-gray-400">
              Coming Soon
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 h-full opacity-60">
            <div className="flex items-center mb-3">
              <div className="text-3xl mr-3">🎯</div>
              <h3 className="text-lg font-medium text-gray-500">
                Goals & Habits
              </h3>
            </div>
            <p className="text-gray-500 text-sm">
              Set and track long-term goals and build productive habits.
            </p>
            <div className="mt-4 text-sm text-gray-400">
              Coming Soon
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Account Information
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="text-sm text-gray-900">{session.user.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">{session.user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="text-sm text-gray-900 font-mono">{session.user.id}</dd>
                </div>
              </dl>
            </div>
            <div className="bg-green-50 p-4 rounded-md">
              <div className="flex items-center">
                <div className="text-green-400 mr-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Account Active
                  </p>
                  <p className="text-xs text-green-600">
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
