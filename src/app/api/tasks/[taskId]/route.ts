import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth-simple";
import { db } from "@/lib/db/client";
import { taskPriorityEnum, taskStatusEnum, tasks } from "@/lib/db/schema/tasks";

// Validation schema for updating tasks
const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title too long")
    .optional(),
  description: z.string().optional(),
  priority: z.enum(taskPriorityEnum).optional(),
  status: z.enum(taskStatusEnum).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  estimatedMinutes: z.number().int().positive().optional().nullable(),
  actualMinutes: z.number().int().positive().optional().nullable(),
});

interface RouteParams {
  params: Promise<{
    taskId: string;
  }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;

    if (!taskId || typeof taskId !== "string") {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const task = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)))
      .limit(1);

    if (!task.length) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({
      task: task[0],
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;

    if (!taskId || typeof taskId !== "string") {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    // Check if task exists and belongs to user
    const existingTask = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)))
      .limit(1);

    if (!existingTask.length) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      ...validatedData,
      updatedAt: new Date(),
    };

    // Handle date conversion
    if (validatedData.dueDate !== undefined) {
      updateData.dueDate = validatedData.dueDate
        ? new Date(validatedData.dueDate)
        : null;
    }

    // Handle completion timestamp
    if (
      validatedData.status === "completed" &&
      existingTask[0].status !== "completed"
    ) {
      updateData.completedAt = new Date();
    } else if (
      validatedData.status !== "completed" &&
      existingTask[0].status === "completed"
    ) {
      updateData.completedAt = null;
    }

    const updatedTask = await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)))
      .returning();

    return NextResponse.json({
      message: "Task updated successfully",
      task: updatedTask[0],
    });
  } catch (error) {
    console.error("Error updating task:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;

    if (!taskId || typeof taskId !== "string") {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    // Check if task exists and belongs to user
    const existingTask = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)))
      .limit(1);

    if (!existingTask.length) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)));

    return NextResponse.json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
