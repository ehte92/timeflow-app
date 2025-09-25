"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({
        callbackUrl: "/",
        redirect: true,
      });
    } catch (error) {
      console.error("Sign out error:", error);
      setIsSigningOut(false);
    }
  };

  if (status === "loading") {
    return <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />;
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm text-gray-700">
        <span className="font-medium">{session.user.name}</span>
        <div className="text-xs text-gray-500">{session.user.email}</div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        disabled={isSigningOut}
      >
        {isSigningOut ? "Signing out..." : "Sign Out"}
      </Button>
    </div>
  );
}
