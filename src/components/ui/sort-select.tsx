"use client";

import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TaskSortBy, TaskSortOrder } from "@/lib/query/hooks/tasks";

interface SortOption {
  value: string;
  label: string;
  sortBy: TaskSortBy;
  sortOrder: TaskSortOrder;
}

const sortOptions: SortOption[] = [
  {
    value: "createdAt-desc",
    label: "Newest First",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
  {
    value: "createdAt-asc",
    label: "Oldest First",
    sortBy: "createdAt",
    sortOrder: "asc",
  },
  {
    value: "dueDate-asc",
    label: "Due Date (Soonest)",
    sortBy: "dueDate",
    sortOrder: "asc",
  },
  {
    value: "dueDate-desc",
    label: "Due Date (Latest)",
    sortBy: "dueDate",
    sortOrder: "desc",
  },
  {
    value: "priority-desc",
    label: "Priority (High to Low)",
    sortBy: "priority",
    sortOrder: "desc",
  },
  {
    value: "priority-asc",
    label: "Priority (Low to High)",
    sortBy: "priority",
    sortOrder: "asc",
  },
  {
    value: "title-asc",
    label: "Title (A-Z)",
    sortBy: "title",
    sortOrder: "asc",
  },
  {
    value: "title-desc",
    label: "Title (Z-A)",
    sortBy: "title",
    sortOrder: "desc",
  },
  {
    value: "updatedAt-desc",
    label: "Recently Updated",
    sortBy: "updatedAt",
    sortOrder: "desc",
  },
  {
    value: "completedAt-desc",
    label: "Recently Completed",
    sortBy: "completedAt",
    sortOrder: "desc",
  },
];

interface SortSelectProps {
  sortBy: TaskSortBy;
  sortOrder: TaskSortOrder;
  onSortChange: (sortBy: TaskSortBy, sortOrder: TaskSortOrder) => void;
}

export function SortSelect({
  sortBy,
  sortOrder,
  onSortChange,
}: SortSelectProps) {
  const currentValue = `${sortBy}-${sortOrder}`;

  const handleValueChange = (value: string) => {
    const option = sortOptions.find((opt) => opt.value === value);
    if (option) {
      onSortChange(option.sortBy, option.sortOrder);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={currentValue} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[200px]">
          <div className="flex items-center gap-2">
            {sortOrder === "asc" ? (
              <ArrowUpAZ className="h-4 w-4" />
            ) : (
              <ArrowDownAZ className="h-4 w-4" />
            )}
            <SelectValue placeholder="Sort by..." />
          </div>
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
