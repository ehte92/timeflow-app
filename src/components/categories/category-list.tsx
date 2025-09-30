"use client";

import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Category } from "@/lib/db/schema/categories";
import { useCategories, useDeleteCategory } from "@/lib/query/hooks/categories";

interface CategoryListProps {
  onEditCategory?: (category: Category) => void;
}

export function CategoryList({ onEditCategory }: CategoryListProps) {
  const { data, isLoading, error, refetch } = useCategories();
  const deleteCategoryMutation = useDeleteCategory();

  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );

  const categories = data?.categories || [];

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategoryMutation.mutateAsync(categoryToDelete.id);
    } catch (err) {
      console.error("Error deleting category:", err);
    } finally {
      setCategoryToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-gray-600">Loading categories...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-800">
          {error.message || "Failed to load categories"}
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          className="mt-2"
        >
          Try again
        </Button>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-4 h-12 w-12 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-full h-full"
            role="img"
            aria-label="Tag icon"
          >
            <title>Tag icon</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 6h.008v.008H6V6z"
            />
          </svg>
        </div>
        <p className="text-gray-600 mb-2">No categories yet</p>
        <p className="text-sm text-gray-500">
          Create your first category to organize your tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <div
          key={category.id}
          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-3">
            {/* Color indicator */}
            <div
              className="h-8 w-8 rounded-md border border-gray-300 flex-shrink-0"
              style={{ backgroundColor: category.color }}
            />
            {/* Category name */}
            <div>
              <h3 className="font-medium text-gray-900">{category.name}</h3>
              <p className="text-xs text-gray-500">{category.color}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onEditCategory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditCategory(category)}
                title="Edit category"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteClick(category)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={deleteCategoryMutation.isPending}
              title="Delete category"
            >
              <Trash2
                className={`h-4 w-4 ${
                  deleteCategoryMutation.isPending ? "animate-pulse" : ""
                }`}
              />
            </Button>
          </div>
        </div>
      ))}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the category "
              {categoryToDelete?.name}"? Tasks in this category will become
              uncategorized.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteCategoryMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Deleting...</span>
                </div>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
