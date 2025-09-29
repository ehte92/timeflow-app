import { and, desc, eq, gte, ilike, isNotNull, lt, lte, or } from "drizzle-orm";
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
  dateRange: z
    .enum([
      "overdue",
      "today",
      "tomorrow",
      "this_week",
      "next_week",
      "this_month",
    ])
    .optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  search: z.string().max(255).optional(),
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
      dateRange: searchParams.get("dateRange") || undefined,
      dueDateFrom: searchParams.get("dueDateFrom") || undefined,
      dueDateTo: searchParams.get("dueDateTo") || undefined,
      search: searchParams.get("search") || undefined,
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

    // Text search across title and description
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      const searchCondition = or(
        ilike(tasks.title, searchTerm),
        and(isNotNull(tasks.description), ilike(tasks.description, searchTerm)),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Date range filtering
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (filters.dateRange) {
      switch (filters.dateRange) {
        case "overdue": {
          const statusCondition = or(
            eq(tasks.status, "todo"),
            eq(tasks.status, "in_progress"),
          );
          conditions.push(isNotNull(tasks.dueDate));
          conditions.push(lt(tasks.dueDate, today));
          if (statusCondition) conditions.push(statusCondition);
          break;
        }
        case "today":
          conditions.push(isNotNull(tasks.dueDate));
          conditions.push(gte(tasks.dueDate, today));
          conditions.push(lt(tasks.dueDate, tomorrow));
          break;
        case "tomorrow": {
          const dayAfterTomorrow = new Date(tomorrow);
          dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
          conditions.push(isNotNull(tasks.dueDate));
          conditions.push(gte(tasks.dueDate, tomorrow));
          conditions.push(lt(tasks.dueDate, dayAfterTomorrow));
          break;
        }
        case "this_week": {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 7);
          conditions.push(isNotNull(tasks.dueDate));
          conditions.push(gte(tasks.dueDate, startOfWeek));
          conditions.push(lt(tasks.dueDate, endOfWeek));
          break;
        }
        case "next_week": {
          const nextWeekStart = new Date(today);
          nextWeekStart.setDate(today.getDate() + (7 - today.getDay()));
          const nextWeekEnd = new Date(nextWeekStart);
          nextWeekEnd.setDate(nextWeekStart.getDate() + 7);
          conditions.push(isNotNull(tasks.dueDate));
          conditions.push(gte(tasks.dueDate, nextWeekStart));
          conditions.push(lt(tasks.dueDate, nextWeekEnd));
          break;
        }
        case "this_month": {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          conditions.push(isNotNull(tasks.dueDate));
          conditions.push(gte(tasks.dueDate, startOfMonth));
          conditions.push(lt(tasks.dueDate, endOfMonth));
          break;
        }
      }
    }

    // Custom date range filtering
    if (filters.dueDateFrom) {
      conditions.push(isNotNull(tasks.dueDate));
      conditions.push(gte(tasks.dueDate, new Date(filters.dueDateFrom)));
    }

    if (filters.dueDateTo) {
      conditions.push(isNotNull(tasks.dueDate));
      conditions.push(lte(tasks.dueDate, new Date(filters.dueDateTo)));
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
