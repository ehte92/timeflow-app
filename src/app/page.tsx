import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">⏰ TimeFlow</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Smart Task Planner with AI-powered time blocking and productivity
          insights
        </p>

        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            🎉 Fresh Setup Complete!
          </h2>

          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500 h-5 w-5" />
                <span>Next.js 15 with App Router</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500 h-5 w-5" />
                <span>Tailwind CSS v4</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500 h-5 w-5" />
                <span>shadcn/ui Components</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500 h-5 w-5" />
                <span>Drizzle ORM</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500 h-5 w-5" />
                <span>Supabase Database</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500 h-5 w-5" />
                <span>TypeScript Configuration</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="text-sm text-gray-500 mb-4">
              Ready to start building...
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full"
                style={{ width: "100%" }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Button size="lg">Start Building</Button>
          <Button variant="outline" size="lg">
            View Documentation
          </Button>
        </div>
      </div>
    </div>
  );
}
