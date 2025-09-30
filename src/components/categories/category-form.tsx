"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Category } from "@/lib/db/schema/categories";
import {
  useCreateCategory,
  useUpdateCategory,
} from "@/lib/query/hooks/categories";

// Predefined color palette for categories
const PRESET_COLORS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Yellow", value: "#F59E0B" },
  { name: "Red", value: "#EF4444" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Orange", value: "#F97316" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Lime", value: "#84CC16" },
  { name: "Gray", value: "#6B7280" },
];

// Form validation schema
const categoryFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be 50 characters or less"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  category?: Category; // If provided, form will be in edit mode
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CategoryForm({
  category,
  onSuccess,
  onCancel,
}: CategoryFormProps) {
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();

  const isEditing = !!category;

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name || "",
      color: category?.color || "#3B82F6",
    },
  });

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (isEditing && category) {
        // Update existing category
        await updateCategoryMutation.mutateAsync({
          id: category.id,
          data,
        });
      } else {
        // Create new category
        await createCategoryMutation.mutateAsync(data);
      }

      // Reset form only if creating a new category
      if (!isEditing) {
        form.reset();
      }

      // Call success callback
      onSuccess?.();
    } catch (err) {
      // Error is already logged in the mutation
      console.error("Form submission error:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {isEditing ? "Edit Category" : "Create New Category"}
        </h2>
        <p className="text-sm text-gray-600">
          {isEditing
            ? "Update the category details below."
            : "Fill in the details to create a new category."}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {(createCategoryMutation.error || updateCategoryMutation.error) && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">
              {(isEditing
                ? updateCategoryMutation.error
                : createCategoryMutation.error
              )?.message ||
                `Failed to ${isEditing ? "update" : "create"} category`}
            </div>
          </div>
        )}

        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name">Category Name *</Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter category name"
            {...form.register("name")}
            aria-invalid={!!form.formState.errors.name}
            disabled={
              createCategoryMutation.isPending ||
              updateCategoryMutation.isPending
            }
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-600">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        {/* Color Field */}
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <div className="space-y-3">
            {/* Color Preview */}
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-md border-2 border-gray-300"
                style={{ backgroundColor: form.watch("color") }}
              />
              <Input
                id="color"
                type="text"
                placeholder="#3B82F6"
                {...form.register("color")}
                className="flex-1"
                disabled={
                  createCategoryMutation.isPending ||
                  updateCategoryMutation.isPending
                }
              />
            </div>

            {/* Preset Color Palette */}
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => form.setValue("color", color.value)}
                  className={`h-8 w-full rounded-md border-2 transition-all hover:scale-110 ${
                    form.watch("color") === color.value
                      ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2"
                      : "border-gray-300"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                  disabled={
                    createCategoryMutation.isPending ||
                    updateCategoryMutation.isPending
                  }
                />
              ))}
            </div>
          </div>
          {form.formState.errors.color && (
            <p className="text-sm text-red-600">
              {form.formState.errors.color.message}
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
                createCategoryMutation.isPending ||
                updateCategoryMutation.isPending
              }
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={
              createCategoryMutation.isPending ||
              updateCategoryMutation.isPending
            }
          >
            {createCategoryMutation.isPending ||
            updateCategoryMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>{isEditing ? "Updating..." : "Creating..."}</span>
              </div>
            ) : isEditing ? (
              "Update Category"
            ) : (
              "Create Category"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
