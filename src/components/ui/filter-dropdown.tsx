"use client";

import { IconCheck, IconChevronDown, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

interface FilterDropdownProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  className?: string;
}

export function FilterDropdown({
  label,
  icon,
  value,
  options,
  onChange,
  className,
}: FilterDropdownProps) {
  const isActive = value !== "all";
  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label || label;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("all");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isActive ? "secondary" : "outline"}
          className={cn("gap-2 h-8 px-3", isActive && "pr-2", className)}
        >
          <span className="flex items-center gap-2">
            {icon}
            <span className="hidden sm:inline">{displayLabel}</span>
            <span className="sm:hidden">
              {selectedOption?.label.split(" ")[0] || label}
            </span>
          </span>
          {isActive ? (
            <button
              type="button"
              onClick={handleClear}
              className="ml-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
              aria-label={`Clear ${label} filter`}
            >
              <IconX className="size-3.5" />
            </button>
          ) : (
            <IconChevronDown className="size-3.5 opacity-50" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onChange(option.value)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {option.icon && <span className="size-4">{option.icon}</span>}
                {option.color && (
                  <div
                    className="size-3 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                )}
                <span>{option.label}</span>
              </div>
              {isSelected && <IconCheck className="size-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
