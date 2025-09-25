import { auth } from "@/lib/auth/auth-simple";
import { Header } from "@/components/layout/header";

export default async function TestAuthPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Authentication Test Page
          </h1>

          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-md">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                🔍 Authentication Status
              </h3>
              <p className="text-blue-700">
                {session?.user ? (
                  <>
                    ✅ <strong>Authenticated</strong> - User is signed in
                  </>
                ) : (
                  <>
                    ❌ <strong>Not Authenticated</strong> - User is not signed
                    in
                  </>
                )}
              </p>
            </div>

            {session?.user && (
              <div className="p-4 bg-green-50 rounded-md">
                <h3 className="text-lg font-medium text-green-900 mb-2">
                  👤 User Information
                </h3>
                <div className="text-green-700 space-y-1">
                  <p>
                    <strong>ID:</strong> {session.user.id}
                  </p>
                  <p>
                    <strong>Name:</strong> {session.user.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {session.user.email}
                  </p>
                </div>
              </div>
            )}

            <div className="p-4 bg-amber-50 rounded-md">
              <h3 className="text-lg font-medium text-amber-900 mb-2">
                🧪 Test Cases
              </h3>
              <div className="text-amber-700 space-y-2">
                <p>
                  • Try accessing{" "}
                  <code className="bg-amber-100 px-1 rounded">/dashboard</code>{" "}
                  without authentication
                </p>
                <p>
                  • Try accessing{" "}
                  <code className="bg-amber-100 px-1 rounded">
                    /auth/signin
                  </code>{" "}
                  while authenticated
                </p>
                <p>• Sign out and see the redirect behavior</p>
                <p>• Refresh the page and verify session persistence</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
