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
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { findConflicts } from "@/lib/calendar/conflicts";
import type { TimeBlock } from "@/lib/db/schema/time-blocks";
import { timeBlockTypeEnum } from "@/lib/db/schema/time-blocks";
import { useTasks } from "@/lib/query/hooks/tasks";
import {
  useCreateTimeBlock,
  useTimeBlocks,
} from "@/lib/query/hooks/time-blocks";

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

interface TimeBlockFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStartTime?: string; // ISO string
  defaultEndTime?: string; // ISO string
  onSuccess?: () => void;
}

export function TimeBlockFormSheet({
  open,
  onOpenChange,
  defaultStartTime,
  defaultEndTime,
  onSuccess,
}: TimeBlockFormSheetProps) {
  const createTimeBlockMutation = useCreateTimeBlock();
  const { data: tasksData, isLoading: tasksLoading } = useTasks({
    status: "todo",
    limit: 100,
  });

  const tasks = tasksData?.tasks || [];

  // Calculate date range for fetching time blocks (current month +/- 1 month for buffer)
  const dateRange = useMemo(() => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }, []);

  // Fetch existing time blocks for conflict detection
  const { data: existingTimeBlocksData } = useTimeBlocks({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    limit: 1000,
  });

  // Conflict detection state
  const [detectedConflicts, setDetectedConflicts] = useState<TimeBlock[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

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

  // Reset form when sheet opens with new default times
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
      // Reset conflict state when sheet opens
      setDetectedConflicts([]);
      setShowConfirmation(false);
    }
  }, [open, defaultStartTime, defaultEndTime, form]);

  // Watch form values for conflict detection
  const startTime = useWatch({ control: form.control, name: "startTime" });
  const endTime = useWatch({ control: form.control, name: "endTime" });

  // Detect conflicts when times change
  useEffect(() => {
    if (startTime && endTime && existingTimeBlocksData?.timeBlocks) {
      try {
        const conflicts = findConflicts(existingTimeBlocksData.timeBlocks, {
          startTime,
          endTime,
        });

        setDetectedConflicts(conflicts);
        // Reset confirmation state when times change
        setShowConfirmation(false);
      } catch (_error) {
        // Invalid date format, ignore
        setDetectedConflicts([]);
      }
    } else {
      setDetectedConflicts([]);
    }
  }, [startTime, endTime, existingTimeBlocksData]);

  const onSubmit = async (data: TimeBlockFormData) => {
    // If conflicts exist and user hasn't confirmed, show confirmation
    if (detectedConflicts.length > 0 && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }

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

      // Reset form and close sheet
      form.reset();
      setShowConfirmation(false);
      setDetectedConflicts([]);
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
    setDetectedConflicts([]);
    setShowConfirmation(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-2xl">
            <IconCalendarTime className="h-5 w-5 text-primary" />
            Create Time Block
          </SheetTitle>
          <SheetDescription>
            Schedule a time block on your calendar. Add details about what
            you'll be working on.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="px-4 space-y-6 mt-6"
        >
          {createTimeBlockMutation.error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
              <IconAlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="text-sm text-red-800 dark:text-red-200">
                {createTimeBlockMutation.error?.message ||
                  "Failed to create time block"}
              </div>
            </div>
          )}

          {/* Conflict Warning */}
          {detectedConflicts.length > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
              <IconAlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
                  ⚠️ Scheduling Conflict Detected
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                  This time block overlaps with {detectedConflicts.length}{" "}
                  existing time block
                  {detectedConflicts.length > 1 ? "s" : ""}:
                </p>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 ml-4">
                  {detectedConflicts.slice(0, 3).map((conflict) => (
                    <li key={conflict.id} className="list-disc">
                      {conflict.title || `${conflict.type} time block`} (
                      {new Date(conflict.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(conflict.endTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      )
                    </li>
                  ))}
                  {detectedConflicts.length > 3 && (
                    <li className="text-xs italic">
                      ...and {detectedConflicts.length - 3} more
                    </li>
                  )}
                </ul>
                {!showConfirmation && (
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-2 font-medium">
                    Click "Create Anyway" to proceed with this conflict.
                  </p>
                )}
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

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={createTimeBlockMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTimeBlockMutation.isPending}
              variant={
                showConfirmation && detectedConflicts.length > 0
                  ? "destructive"
                  : "default"
              }
              className="flex-1 gap-2"
            >
              {createTimeBlockMutation.isPending && (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              )}
              {createTimeBlockMutation.isPending
                ? "Creating..."
                : showConfirmation && detectedConflicts.length > 0
                  ? "Create Anyway"
                  : "Create"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
