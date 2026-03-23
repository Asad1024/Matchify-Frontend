import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  options?: string[];
}

interface FilterBarProps {
  filters: FilterOption[];
  sortOptions?: FilterOption[];
  activeFilters: string[];
  onFilterChange: (filterId: string, value: string) => void;
  onFilterRemove: (filterId: string) => void;
  onSortChange?: (value: string) => void;
  sortValue?: string;
  className?: string;
}

export function FilterBar({
  filters,
  sortOptions,
  activeFilters,
  onFilterChange,
  onFilterRemove,
  onSortChange,
  sortValue,
  className,
}: FilterBarProps) {
  // Initialize selected filters from props
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    filters.forEach(filter => {
      if (filter.value && filter.value !== "all") {
        initial[filter.id] = filter.value;
      }
    });
    return initial;
  });

  const handleFilterSelect = (filterId: string, value: string) => {
    setSelectedFilters((prev) => ({ ...prev, [filterId]: value }));
    onFilterChange(filterId, value);
  };

  const handleRemoveFilter = (filterId: string) => {
    setSelectedFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[filterId];
      return newFilters;
    });
    onFilterRemove(filterId);
  };

  const activeFilterEntries = Object.entries(selectedFilters).filter(([id, value]) =>
    activeFilters.includes(id) && value !== "all"
  );

  return (
    <div className={`space-y-4 ${className || ""}`}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter Selects */}
        {filters.map((filter) => (
          <Select
            key={filter.id}
            value={selectedFilters[filter.id] || ""}
            onValueChange={(value) => handleFilterSelect(filter.id, value)}
          >
            <SelectTrigger className="w-[140px] sm:w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{filter.label}: All</SelectItem>
              {filter.options && filter.options.length > 0 ? (
                filter.options
                  .filter((opt: string) => opt !== "all")
                  .map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option === "true" ? "Yes" : option.charAt(0).toUpperCase() + option.slice(1)}
                    </SelectItem>
                  ))
              ) : filter.value && filter.value !== "all" ? (
                <SelectItem value={filter.value}>{filter.value}</SelectItem>
              ) : null}
            </SelectContent>
          </Select>
        ))}

        {/* Sort Select */}
        {sortOptions && sortOptions.length > 0 && onSortChange && (
          <Select value={sortValue || ""} onValueChange={onSortChange}>
            <SelectTrigger className="w-[140px] sm:w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.id} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear All */}
        {activeFilterEntries.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              activeFilterEntries.forEach(([id]) => handleRemoveFilter(id));
            }}
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Active Filter Chips */}
      <AnimatePresence>
        {activeFilterEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {activeFilterEntries.map(([filterId, value]) => {
              const filter = filters.find((f) => f.id === filterId);
              return (
                <Badge
                  key={filterId}
                  variant="secondary"
                  className="gap-2 px-3 py-1"
                >
                  <span className="text-xs">
                    {filter?.label}: {value}
                  </span>
                  <button
                    onClick={() => handleRemoveFilter(filterId)}
                    className="ml-1 hover:bg-secondary/80 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

