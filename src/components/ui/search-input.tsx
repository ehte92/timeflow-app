"use client";

import { Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  value = "",
  onChange,
  placeholder = "Search...",
  debounceMs = 300,
  className = "",
}: SearchInputProps) {
  const [inputValue, setInputValue] = useState(value);

  // Debounced callback to trigger onChange
  const debouncedOnChange = useCallback(
    (searchValue: string) => {
      const timeoutId = setTimeout(() => {
        onChange(searchValue);
      }, debounceMs);

      return () => clearTimeout(timeoutId);
    },
    [onChange, debounceMs],
  );

  // Update input value when external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle input changes with debouncing
  useEffect(() => {
    const cleanup = debouncedOnChange(inputValue);
    return cleanup;
  }, [inputValue, debouncedOnChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleClear = () => {
    setInputValue("");
    onChange("");
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {inputValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
        >
          <X className="h-3 w-3 text-gray-400" />
        </Button>
      )}
    </div>
  );
}
