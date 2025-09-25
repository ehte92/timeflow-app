"use client";

import { Plus, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import { Button } from "@/components/ui/button";

export function TasksPageContent() {
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);

  // Auto-open form if new=true query parameter is present
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setShowForm(true);
    }
  }, [searchParams]);

  const handleTaskCreated = () => {
    setShowForm(false);
  };

  const handleTaskDeleted = () => {
    // React Query will automatically refetch, no manual trigger needed
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
              <p className="text-gray-600 mt-1">
                Manage your tasks and stay organized
              </p>
            </div>

            <Button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2"
            >
              {showForm ? (
                <>
                  <X className="h-4 w-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Task
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Task Form */}
          {showForm && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <TaskForm
                  onSuccess={handleTaskCreated}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            </div>
          )}

          {/* Task List */}
          <div className={showForm ? "lg:col-span-2" : "lg:col-span-3"}>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Your Tasks
                  </h2>

                  {/* Future: Add filters and sorting controls here */}
                </div>

                <TaskList onDeleteTask={handleTaskDeleted} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
