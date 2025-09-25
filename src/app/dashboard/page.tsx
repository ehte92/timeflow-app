import { auth } from "@/lib/auth/auth-simple";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to TimeFlow Dashboard
          </h1>
          <p className="text-gray-600 mb-4">
            Hello, {session.user.name}! You are successfully authenticated.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                🎉 Authentication Complete!
              </h3>
              <p className="text-blue-700 text-sm">
                Your NextAuth.js integration is working perfectly with route protection.
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-green-900 mb-2">
                🔒 Route Protection Active
              </h3>
              <p className="text-green-700 text-sm">
                Try accessing /dashboard without authentication - you'll be redirected to sign in.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium text-gray-900 mb-2">Session Information:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>User ID:</strong> {session.user.id}</li>
              <li><strong>Email:</strong> {session.user.email}</li>
              <li><strong>Name:</strong> {session.user.name}</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}