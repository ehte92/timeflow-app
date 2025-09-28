"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type Task,
  type TaskPriority,
  taskPriorityEnum,
} from "@/lib/db/schema/tasks";
import { useCreateTask, useUpdateTask } from "@/lib/query/hooks/tasks";

// Form validation schema
const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().optional(),
  priority: z.enum(taskPriorityEnum),
  dueDate: z.string().optional(),
  categoryId: z
    .string()
    .transform((val) => (val === "" ? undefined : val))
    .optional()
    .refine(
      (val) => !val || z.string().uuid().safeParse(val).success,
      "Invalid category ID",
    ),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  task?: Task; // If provided, form will be in edit mode
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TaskForm({ task, onSuccess, onCancel }: TaskFormProps) {
  const router = useRouter();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();

  const isEditing = !!task;

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      priority: task?.priority || "medium",
      dueDate: task?.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 16)
        : "",
      categoryId: task?.categoryId || undefined,
    },
  });

  const onSubmit = async (data: TaskFormData) => {
    try {
      const payload = {
        ...data,
        description: data.description || undefined,
        dueDate: data.dueDate
          ? new Date(data.dueDate).toISOString()
          : undefined,
      };

      if (isEditing && task) {
        // Update existing task
        await updateTaskMutation.mutateAsync({
          id: task.id,
          data: payload,
        });
      } else {
        // Create new task
        await createTaskMutation.mutateAsync(payload);
      }

      // Reset form only if creating a new task
      if (!isEditing) {
        form.reset();
      }

      // Call success callback
      if (onSuccess) {
        onSuccess();
      } else {
        // Default: redirect to tasks page
        router.push("/dashboard/tasks");
        router.refresh();
      }
    } catch (err) {
      // Error is already logged in the mutation
      console.error("Form submission error:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {isEditing ? "Edit Task" : "Create New Task"}
        </h2>
        <p className="text-sm text-gray-600">
          {isEditing
            ? "Update the task details below."
            : "Fill in the details to create a new task."}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {(createTaskMutation.error || updateTaskMutation.error) && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">
              {(isEditing ? updateTaskMutation.error : createTaskMutation.error)
                ?.message ||
                `Failed to ${isEditing ? "update" : "create"} task`}
            </div>
          </div>
        )}

        {/* Title Field */}
        <div className="space-y-2">
          <Label htmlFor="title">Task Title *</Label>
          <Input
            id="title"
            type="text"
            placeholder="Enter task title"
            {...form.register("title")}
            aria-invalid={!!form.formState.errors.title}
            disabled={
              createTaskMutation.isPending || updateTaskMutation.isPending
            }
          />
          {form.formState.errors.title && (
            <p className="text-sm text-red-600">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Enter task description (optional)"
            rows={4}
            {...form.register("description")}
            disabled={
              createTaskMutation.isPending || updateTaskMutation.isPending
            }
          />
          {form.formState.errors.description && (
            <p className="text-sm text-red-600">
              {form.formState.errors.description.message}
            </p>
          )}
        </div>

        {/* Priority Field */}
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={form.watch("priority")}
            onValueChange={(value) =>
              form.setValue("priority", value as TaskPriority, {
                shouldValidate: true,
              })
            }
            disabled={
              createTaskMutation.isPending || updateTaskMutation.isPending
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.priority && (
            <p className="text-sm text-red-600">
              {form.formState.errors.priority.message}
            </p>
          )}
        </div>

        {/* Due Date Field */}
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="datetime-local"
            {...form.register("dueDate")}
            disabled={
              createTaskMutation.isPending || updateTaskMutation.isPending
            }
          />
          {form.formState.errors.dueDate && (
            <p className="text-sm text-red-600">
              {form.formState.errors.dueDate.message}
            </p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={
                createTaskMutation.isPending || updateTaskMutation.isPending
              }
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={
              createTaskMutation.isPending || updateTaskMutation.isPending
            }
          >
            {createTaskMutation.isPending || updateTaskMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>{isEditing ? "Updating..." : "Creating..."}</span>
              </div>
            ) : isEditing ? (
              "Update Task"
            ) : (
              "Create Task"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
