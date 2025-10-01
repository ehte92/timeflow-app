"use client";

import { useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AuthTabs() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const defaultTab = tab === "signup" ? "signup" : "signin";

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>

      {/* Sign In Form */}
      <TabsContent value="signin" className="mt-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome back
          </h1>
          <p className="text-sm text-slate-600">
            Enter your credentials to access your account
          </p>
        </div>

        <AuthForm mode="signin" />
      </TabsContent>

      {/* Sign Up Form */}
      <TabsContent value="signup" className="mt-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Create your account
          </h1>
          <p className="text-sm text-slate-600">
            Start your journey to peak productivity
          </p>
        </div>

        <AuthForm mode="signup" />
      </TabsContent>
    </Tabs>
  );
}
