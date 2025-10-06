"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconAlertCircle,
  IconCalendarTime,
  IconClock,
  IconFileText,
  IconLink,
  IconLoader2,
  IconTag,
} from "@tabler/icons-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { timeBlockTypeEnum } from "@/lib/db/schema/time-blocks";
import { useTasks } from "@/lib/query/hooks/tasks";
import { useCreateTimeBlock } from "@/lib/query/hooks/time-blocks";

// Form validation schema
const timeBlockFormSchema = z
  .object({
    title: z.string().max(255, "Title too long").optional(),
    type: z.enum(timeBlockTypeEnum),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    description: z.string().optional(),
    taskId: z
      .string()
      .transform((val) => (val === "" ? undefined : val))
      .optional()
      .refine(
        (val) => !val || z.string().uuid().safeParse(val).success,
        "Invalid task ID",
      ),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  });

type TimeBlockFormData = z.infer<typeof timeBlockFormSchema>;

interface TimeBlockFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStartTime?: string; // ISO string
  defaultEndTime?: string; // ISO string
  onSuccess?: () => void;
}

export function TimeBlockFormDialog({
  open,
  onOpenChange,
  defaultStartTime,
  defaultEndTime,
  onSuccess,
}: TimeBlockFormDialogProps) {
  const createTimeBlockMutation = useCreateTimeBlock();
  const { data: tasksData, isLoading: tasksLoading } = useTasks({
    status: "todo",
    limit: 100,
  });

  const tasks = tasksData?.tasks || [];

  const form = useForm<TimeBlockFormData>({
    resolver: zodResolver(timeBlockFormSchema),
    defaultValues: {
      title: "",
      type: "scheduled",
      startTime: defaultStartTime
        ? new Date(defaultStartTime).toISOString().slice(0, 16)
        : "",
      endTime: defaultEndTime
        ? new Date(defaultEndTime).toISOString().slice(0, 16)
        : "",
      description: "",
      taskId: undefined,
    },
  });

  // Reset form when dialog opens with new default times
  useEffect(() => {
    if (open && (defaultStartTime || defaultEndTime)) {
      form.reset({
        title: "",
        type: "scheduled",
        startTime: defaultStartTime
          ? new Date(defaultStartTime).toISOString().slice(0, 16)
          : "",
        endTime: defaultEndTime
          ? new Date(defaultEndTime).toISOString().slice(0, 16)
          : "",
        description: "",
        taskId: undefined,
      });
    }
  }, [open, defaultStartTime, defaultEndTime, form]);

  const onSubmit = async (data: TimeBlockFormData) => {
    try {
      const payload = {
        title: data.title || undefined,
        type: data.type,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
        description: data.description || undefined,
        taskId: data.taskId,
      };

      await createTimeBlockMutation.mutateAsync(payload);

      // Reset form and close dialog
      form.reset();
      onOpenChange(false);

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      // Error is already logged in the mutation
      console.error("Form submission error:", err);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onKeyDown={handleKeyDown} className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <IconCalendarTime className="h-5 w-5 text-primary" />
            Create Time Block
          </DialogTitle>
          <DialogDescription>
            Schedule a time block on your calendar. Add details about what
            you'll be working on.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {createTimeBlockMutation.error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
              <IconAlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="text-sm text-red-800 dark:text-red-200">
                {createTimeBlockMutation.error?.message ||
                  "Failed to create time block"}
              </div>
            </div>
          )}

          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <IconTag className="h-4 w-4" />
              Basic Information
            </h3>

            {/* Title Field */}
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <IconFileText className="h-4 w-4 text-muted-foreground" />
                Title (Optional)
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., Deep work session"
                {...form.register("title")}
                aria-invalid={!!form.formState.errors.title}
                disabled={createTimeBlockMutation.isPending}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <IconAlertCircle className="h-3.5 w-3.5" />
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            {/* Type Field */}
            <div className="space-y-2">
              <Label htmlFor="type" className="flex items-center gap-2">
                <IconTag className="h-4 w-4 text-muted-foreground" />
                Type *
              </Label>
              <Select
                value={form.watch("type")}
                onValueChange={(value) =>
                  form.setValue(
                    "type",
                    value as (typeof timeBlockTypeEnum)[number],
                  )
                }
                disabled={createTimeBlockMutation.isPending}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      Scheduled
                    </div>
                  </SelectItem>
                  <SelectItem value="actual">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      Actual
                    </div>
                  </SelectItem>
                  <SelectItem value="break">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-gray-500" />
                      Break
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.type && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <IconAlertCircle className="h-3.5 w-3.5" />
                  {form.formState.errors.type.message}
                </p>
              )}
            </div>
          </div>

          {/* Time & Schedule Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <IconClock className="h-4 w-4" />
              Time &amp; Schedule
            </h3>

            {/* Start Time Field */}
            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center gap-2">
                <IconClock className="h-4 w-4 text-muted-foreground" />
                Start Time *
              </Label>
              <Input
                id="startTime"
                type="datetime-local"
                {...form.register("startTime")}
                aria-invalid={!!form.formState.errors.startTime}
                disabled={createTimeBlockMutation.isPending}
              />
              {form.formState.errors.startTime && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <IconAlertCircle className="h-3.5 w-3.5" />
                  {form.formState.errors.startTime.message}
                </p>
              )}
            </div>

            {/* End Time Field */}
            <div className="space-y-2">
              <Label htmlFor="endTime" className="flex items-center gap-2">
                <IconClock className="h-4 w-4 text-muted-foreground" />
                End Time *
              </Label>
              <Input
                id="endTime"
                type="datetime-local"
                {...form.register("endTime")}
                aria-invalid={!!form.formState.errors.endTime}
                disabled={createTimeBlockMutation.isPending}
              />
              {form.formState.errors.endTime && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <IconAlertCircle className="h-3.5 w-3.5" />
                  {form.formState.errors.endTime.message}
                </p>
              )}
            </div>
          </div>

          {/* Additional Details Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <IconFileText className="h-4 w-4" />
              Additional Details
            </h3>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <IconFileText className="h-4 w-4 text-muted-foreground" />
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Add notes about this time block..."
                {...form.register("description")}
                disabled={createTimeBlockMutation.isPending}
                rows={3}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <IconAlertCircle className="h-3.5 w-3.5" />
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* Task Link Field */}
            <div className="space-y-2">
              <Label htmlFor="taskId" className="flex items-center gap-2">
                <IconLink className="h-4 w-4 text-muted-foreground" />
                Link to Task (Optional)
              </Label>
              <Select
                value={form.watch("taskId") || "__none__"}
                onValueChange={(value) =>
                  form.setValue(
                    "taskId",
                    value === "__none__" ? undefined : value,
                  )
                }
                disabled={createTimeBlockMutation.isPending || tasksLoading}
              >
                <SelectTrigger id="taskId">
                  <SelectValue placeholder="Select a task to link" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.taskId && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <IconAlertCircle className="h-3.5 w-3.5" />
                  {form.formState.errors.taskId.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={createTimeBlockMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTimeBlockMutation.isPending}
              className="gap-2"
            >
              {createTimeBlockMutation.isPending && (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              )}
              {createTimeBlockMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
