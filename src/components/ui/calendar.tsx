import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  /** Smaller cells and padding (e.g. popovers). */
  compact?: boolean
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  compact = false,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(compact ? "p-2" : "p-3", className)}
      classNames={{
        months: compact
          ? "flex flex-col sm:flex-row space-y-2 sm:space-x-2 sm:space-y-0"
          : "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: compact ? "space-y-2" : "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: compact ? "text-xs font-medium" : "text-sm font-medium",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          compact
            ? "inline-flex size-6 min-h-6 min-w-6 max-h-6 max-w-6 shrink-0 items-center justify-center gap-0 p-0 bg-transparent opacity-50 hover:opacity-100 [&_svg]:!size-3.5"
            : "inline-flex size-7 min-h-7 min-w-7 max-h-7 max-w-7 shrink-0 items-center justify-center gap-0 p-0 bg-transparent opacity-50 hover:opacity-100 [&_svg]:!size-3.5",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: compact
          ? "text-muted-foreground rounded-md w-8 font-normal text-[0.7rem]"
          : "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: compact ? "flex w-full mt-1" : "flex w-full mt-2",
        cell: compact
          ? "h-8 w-8 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20"
          : "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          compact
            ? "h-8 w-8 min-h-8 min-w-8 max-h-8 max-w-8 p-0 text-xs font-normal aria-selected:opacity-100"
            : "h-9 w-9 min-h-9 min-w-9 p-0 font-normal aria-selected:opacity-100",
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
