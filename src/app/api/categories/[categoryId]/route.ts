import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth-simple";
import { db } from "@/lib/db/client";
import { categories } from "@/lib/db/schema/categories";

// Validation schema for updating categories
const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be 50 characters or less")
    .optional(),
  color: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      "Color must be a valid hex color (e.g., #FF5733)",
    )
    .optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { categoryId } = await params;

    // Validate UUID format
    if (!z.string().uuid().safeParse(categoryId).success) {
      return NextResponse.json(
        { error: "Invalid category ID format" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validatedData = updateCategorySchema.parse(body);

    // Check if the category exists and belongs to the user
    const existingCategory = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.userId, session.user.id),
        ),
      )
      .limit(1);

    if (existingCategory.length === 0) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    // If name is being updated, check for duplicates
    if (validatedData.name) {
      const duplicateCategory = await db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.userId, session.user.id),
            eq(categories.name, validatedData.name),
          ),
        )
        .limit(1);

      if (
        duplicateCategory.length > 0 &&
        duplicateCategory[0].id !== categoryId
      ) {
        return NextResponse.json(
          { error: "A category with this name already exists" },
          { status: 409 },
        );
      }
    }

    // Update the category
    const updatedCategory = await db
      .update(categories)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.userId, session.user.id),
        ),
      )
      .returning();

    return NextResponse.json({
      message: "Category updated successfully",
      category: updatedCategory[0],
    });
  } catch (error) {
    console.error("Error updating category:", error);

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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { categoryId } = await params;

    // Validate UUID format
    if (!z.string().uuid().safeParse(categoryId).success) {
      return NextResponse.json(
        { error: "Invalid category ID format" },
        { status: 400 },
      );
    }

    // Check if the category exists and belongs to the user
    const existingCategory = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.userId, session.user.id),
        ),
      )
      .limit(1);

    if (existingCategory.length === 0) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    // Delete the category
    // Note: Tasks with this categoryId will have their categoryId set to null
    // due to the "onDelete: set null" constraint in the schema
    await db
      .delete(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.userId, session.user.id),
        ),
      );

    return NextResponse.json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
