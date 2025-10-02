import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth-simple";
import { db } from "@/lib/db/client";
import { timeBlocks, timeBlockTypeEnum } from "@/lib/db/schema/time-blocks";

// Validation schema for updating time blocks
const updateTimeBlockSchema = z
  .object({
    title: z.string().max(255, "Title too long").optional(),
    type: z.enum(timeBlockTypeEnum).optional(),
    startTime: z.string().datetime("Invalid start time format").optional(),
    endTime: z.string().datetime("Invalid end time format").optional(),
    description: z.string().optional().nullable(),
    taskId: z.string().uuid("Invalid task ID").optional().nullable(),
  })
  .refine(
    (data) => {
      // Only validate if both times are provided
      if (data.startTime && data.endTime) {
        return new Date(data.endTime) > new Date(data.startTime);
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    },
  );

interface RouteParams {
  params: Promise<{
    timeBlockId: string;
  }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { timeBlockId } = await params;

    if (!timeBlockId || typeof timeBlockId !== "string") {
      return NextResponse.json(
        { error: "Invalid time block ID" },
        { status: 400 },
      );
    }

    const timeBlock = await db
      .select()
      .from(timeBlocks)
      .where(
        and(
          eq(timeBlocks.id, timeBlockId),
          eq(timeBlocks.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!timeBlock.length) {
      return NextResponse.json(
        { error: "Time block not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      timeBlock: timeBlock[0],
    });
  } catch (error) {
    console.error("Error fetching time block:", error);
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

    const { timeBlockId } = await params;

    if (!timeBlockId || typeof timeBlockId !== "string") {
      return NextResponse.json(
        { error: "Invalid time block ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validatedData = updateTimeBlockSchema.parse(body);

    // Check if time block exists and belongs to user
    const existingTimeBlock = await db
      .select()
      .from(timeBlocks)
      .where(
        and(
          eq(timeBlocks.id, timeBlockId),
          eq(timeBlocks.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!existingTimeBlock.length) {
      return NextResponse.json(
        { error: "Time block not found" },
        { status: 404 },
      );
    }

    // Additional validation: if only one time is provided, check against existing time
    if (validatedData.startTime && !validatedData.endTime) {
      const newStartTime = new Date(validatedData.startTime);
      const existingEndTime = existingTimeBlock[0].endTime;
      if (newStartTime >= existingEndTime) {
        return NextResponse.json(
          { error: "Start time must be before end time" },
          { status: 400 },
        );
      }
    }

    if (validatedData.endTime && !validatedData.startTime) {
      const newEndTime = new Date(validatedData.endTime);
      const existingStartTime = existingTimeBlock[0].startTime;
      if (newEndTime <= existingStartTime) {
        return NextResponse.json(
          { error: "End time must be after start time" },
          { status: 400 },
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      ...validatedData,
      updatedAt: new Date(),
    };

    // Handle date conversion
    if (validatedData.startTime !== undefined) {
      updateData.startTime = new Date(validatedData.startTime);
    }

    if (validatedData.endTime !== undefined) {
      updateData.endTime = new Date(validatedData.endTime);
    }

    const updatedTimeBlock = await db
      .update(timeBlocks)
      .set(updateData)
      .where(
        and(
          eq(timeBlocks.id, timeBlockId),
          eq(timeBlocks.userId, session.user.id),
        ),
      )
      .returning();

    return NextResponse.json({
      message: "Time block updated successfully",
      timeBlock: updatedTimeBlock[0],
    });
  } catch (error) {
    console.error("Error updating time block:", error);

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

    const { timeBlockId } = await params;

    if (!timeBlockId || typeof timeBlockId !== "string") {
      return NextResponse.json(
        { error: "Invalid time block ID" },
        { status: 400 },
      );
    }

    // Check if time block exists and belongs to user
    const existingTimeBlock = await db
      .select()
      .from(timeBlocks)
      .where(
        and(
          eq(timeBlocks.id, timeBlockId),
          eq(timeBlocks.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!existingTimeBlock.length) {
      return NextResponse.json(
        { error: "Time block not found" },
        { status: 404 },
      );
    }

    await db
      .delete(timeBlocks)
      .where(
        and(
          eq(timeBlocks.id, timeBlockId),
          eq(timeBlocks.userId, session.user.id),
        ),
      );

    return NextResponse.json({
      message: "Time block deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting time block:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
