import { IconClock } from "@tabler/icons-react";
import { Suspense } from "react";
import { AuthTabs } from "@/components/auth/auth-tabs";

export default function Home() {
  return (
    <div className="flex min-h-screen">
      {/* Left Side - Brand Panel (Hidden on Mobile) */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-900 p-16">
        {/* Decorative gradient orbs */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-20 top-20 size-96 rounded-full bg-white blur-3xl" />
          <div className="absolute -right-20 bottom-20 size-96 rounded-full bg-emerald-400 blur-3xl" />
        </div>

        {/* Logo - Top Left */}
        <div className="absolute left-16 top-16 z-10 flex items-center gap-2 text-white">
          <IconClock size={24} stroke={2} />
          <span className="text-2xl font-bold">TimeFlow</span>
        </div>

        {/* Centered Content */}
        <div className="relative z-10 text-center space-y-8">
          <h1 className="text-6xl font-bold leading-tight text-white">
            Master Your Time,
            <br />
            Amplify Your Impact
          </h1>
          <p className="text-2xl text-emerald-50 max-w-lg mx-auto">
            Transform scattered tasks into focused achievement with intelligent
            scheduling and AI-driven insights
          </p>

          {/* Single Key Stat */}
          <div className="pt-8">
            <div className="inline-block rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-8 py-6">
              <div className="text-5xl font-bold text-white">1M+</div>
              <div className="text-sm text-emerald-50 mt-2">
                Tasks Completed by 10,000+ Professionals
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="flex w-full flex-col justify-center bg-white px-4 py-12 sm:px-6 lg:w-1/2 lg:px-20 xl:px-24">
        {/* Mobile Logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <IconClock size={24} stroke={2} className="text-emerald-600" />
          <span className="text-2xl font-bold text-slate-900">TimeFlow</span>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <Suspense
            fallback={
              <div className="h-96 flex items-center justify-center">
                Loading...
              </div>
            }
          >
            <AuthTabs />
          </Suspense>

          {/* Footer Links */}
          <div className="mt-8 text-center text-sm text-slate-600">
            <p>© 2025 TimeFlow. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
