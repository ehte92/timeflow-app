import { and, asc, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth-simple";
import { db } from "@/lib/db/client";
import { timeBlocks, timeBlockTypeEnum } from "@/lib/db/schema/time-blocks";

// Validation schema for creating time blocks
const createTimeBlockSchema = z
  .object({
    title: z.string().max(255, "Title too long").optional(),
    type: z.enum(timeBlockTypeEnum).default("scheduled"),
    startTime: z.string().datetime("Invalid start time format"),
    endTime: z.string().datetime("Invalid end time format"),
    description: z.string().optional(),
    taskId: z.string().uuid("Invalid task ID").optional(),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  });

// Validation schema for time block filtering
const timeBlockFilterSchema = z.object({
  type: z.enum(timeBlockTypeEnum).optional(),
  taskId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(["startTime", "endTime", "createdAt"]).default("startTime"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  limit: z.string().default("100").transform(Number),
  offset: z.string().default("0").transform(Number),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = timeBlockFilterSchema.parse({
      type: searchParams.get("type") || undefined,
      taskId: searchParams.get("taskId") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
      limit: searchParams.get("limit") || "100",
      offset: searchParams.get("offset") || "0",
    });

    // Apply filters
    const conditions = [eq(timeBlocks.userId, session.user.id)];

    if (filters.type) {
      conditions.push(eq(timeBlocks.type, filters.type));
    }

    if (filters.taskId) {
      conditions.push(eq(timeBlocks.taskId, filters.taskId));
    }

    // Date range filtering
    if (filters.startDate) {
      conditions.push(gte(timeBlocks.startTime, new Date(filters.startDate)));
    }

    if (filters.endDate) {
      conditions.push(lte(timeBlocks.endTime, new Date(filters.endDate)));
    }

    // Dynamic sorting logic
    let orderByClause: SQL | ReturnType<typeof asc> | ReturnType<typeof desc>;
    const orderFn = filters.sortOrder === "asc" ? asc : desc;

    switch (filters.sortBy) {
      case "endTime":
        orderByClause = orderFn(timeBlocks.endTime);
        break;
      case "createdAt":
        orderByClause = orderFn(timeBlocks.createdAt);
        break;
      default:
        orderByClause = orderFn(timeBlocks.startTime);
        break;
    }

    const userTimeBlocks = await db
      .select()
      .from(timeBlocks)
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(filters.limit)
      .offset(filters.offset);

    return NextResponse.json({
      timeBlocks: userTimeBlocks,
      count: userTimeBlocks.length,
    });
  } catch (error) {
    console.error("Error fetching time blocks:", error);

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
    const validatedData = createTimeBlockSchema.parse(body);

    const newTimeBlock = await db
      .insert(timeBlocks)
      .values({
        ...validatedData,
        userId: session.user.id,
        startTime: new Date(validatedData.startTime),
        endTime: new Date(validatedData.endTime),
      })
      .returning();

    return NextResponse.json(
      {
        message: "Time block created successfully",
        timeBlock: newTimeBlock[0],
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating time block:", error);

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
