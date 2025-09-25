import { and, desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth-simple";
import { db } from "@/lib/db/client";
import { taskPriorityEnum, taskStatusEnum, tasks } from "@/lib/db/schema/tasks";

// Validation schema for creating tasks
const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().optional(),
  priority: z.enum(taskPriorityEnum).default("medium"),
  dueDate: z.string().datetime().optional(),
  categoryId: z.string().uuid().optional(),
});

// Validation schema for task filtering
const taskFilterSchema = z.object({
  status: z.enum(taskStatusEnum).optional(),
  priority: z.enum(taskPriorityEnum).optional(),
  categoryId: z.string().uuid().optional(),
  limit: z.string().default("50").transform(Number),
  offset: z.string().default("0").transform(Number),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = taskFilterSchema.parse({
      status: searchParams.get("status") || undefined,
      priority: searchParams.get("priority") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      limit: searchParams.get("limit") || "50",
      offset: searchParams.get("offset") || "0",
    });

    // Apply filters
    const conditions = [eq(tasks.userId, session.user.id)];

    if (filters.status) {
      conditions.push(eq(tasks.status, filters.status));
    }

    if (filters.priority) {
      conditions.push(eq(tasks.priority, filters.priority));
    }

    if (filters.categoryId) {
      conditions.push(eq(tasks.categoryId, filters.categoryId));
    }

    const userTasks = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt))
      .limit(filters.limit)
      .offset(filters.offset);

    return NextResponse.json({
      tasks: userTasks,
      count: userTasks.length,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);

    const newTask = await db
      .insert(tasks)
      .values({
        ...validatedData,
        userId: session.user.id,
        dueDate: validatedData.dueDate
          ? new Date(validatedData.dueDate)
          : undefined,
      })
      .returning();

    return NextResponse.json(
      {
        message: "Task created successfully",
        task: newTask[0],
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating task:", error);

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
