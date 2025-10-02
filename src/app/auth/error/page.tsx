import { IconClock } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  searchParams: { error?: string };
}

export default function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const error = searchParams.error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <IconClock className="size-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-900">TimeFlow</h1>
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-gray-900">
            Authentication Error
          </h2>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <div className="text-center space-y-4">
            <div className="text-red-600 bg-red-50 p-4 rounded-md">
              <p className="text-sm">
                {error === "Configuration" &&
                  "There is a problem with the server configuration."}
                {error === "AccessDenied" &&
                  "You do not have permission to sign in."}
                {error === "Verification" &&
                  "The verification link has expired or has already been used."}
                {!error && "An error occurred during authentication."}
              </p>
            </div>

            <Link href="/auth/signin">
              <Button className="w-full">Back to Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
