"use client";

import { Filter, Plus, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Task, TaskStatus } from "@/lib/db/schema/tasks";
import type { TaskFilters } from "@/lib/query/hooks/tasks";

export function TasksPageContent() {
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");

  // Auto-open form if new=true query parameter is present
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setShowForm(true);
    }
  }, [searchParams]);

  const handleTaskCreated = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const handleTaskDeleted = () => {
    // React Query will automatically refetch, no manual trigger needed
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const getTaskFilters = (): TaskFilters => {
    const filters: TaskFilters = {};
    if (statusFilter !== "all") {
      filters.status = statusFilter;
    }
    return filters;
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
              onClick={() => {
                if (showForm) {
                  handleCancelEdit();
                } else {
                  setEditingTask(null);
                  setShowForm(true);
                }
              }}
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
                  task={editingTask || undefined}
                  onSuccess={handleTaskCreated}
                  onCancel={handleCancelEdit}
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

                  {/* Filter Controls */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <div className="flex gap-1">
                        <Badge
                          variant={
                            statusFilter === "all" ? "default" : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => setStatusFilter("all")}
                        >
                          All
                        </Badge>
                        <Badge
                          variant={
                            statusFilter === "todo" ? "default" : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => setStatusFilter("todo")}
                        >
                          To Do
                        </Badge>
                        <Badge
                          variant={
                            statusFilter === "in_progress"
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => setStatusFilter("in_progress")}
                        >
                          In Progress
                        </Badge>
                        <Badge
                          variant={
                            statusFilter === "completed" ? "default" : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => setStatusFilter("completed")}
                        >
                          Completed
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <TaskList
                  onEditTask={handleEditTask}
                  onDeleteTask={handleTaskDeleted}
                  filters={getTaskFilters()}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
