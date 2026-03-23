import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl } from "@/services/api";
import { useCurrentUser } from "@/contexts/UserContext";

interface CoachBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coachId: string;
  coachName: string;
  pricePerSession: number;
  onBookingSuccess?: () => void;
}

export default function CoachBookingDialog({
  open,
  onOpenChange,
  coachId,
  coachName,
  pricePerSession,
  onBookingSuccess,
}: CoachBookingDialogProps) {
  const { userId } = useCurrentUser();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("");

  const bookingMutation = useMutation({
    mutationFn: async (data: { userId: string; coachId: string; sessionDate: string | null }) => {
      const url = buildApiUrl("/api/coaches/bookings");
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to book session");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking confirmed! 🎉",
        description: `Your session with ${coachName} has been booked successfully.`,
      });
      onBookingSuccess?.();
      onOpenChange(false);
      // Reset form
      setSelectedDate(undefined);
      setSelectedTime("");
    },
    onError: (error: Error) => {
      toast({
        title: "Booking failed",
        description: error.message || "Unable to book session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please log in to book a session.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDate) {
      toast({
        title: "Date required",
        description: "Please select a date for your session.",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time if time is provided
    let sessionDate: string | null = null;
    if (selectedDate) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      if (selectedTime) {
        sessionDate = `${dateStr}T${selectedTime}:00`;
      } else {
        sessionDate = dateStr;
      }
    }

    bookingMutation.mutate({
      userId,
      coachId,
      sessionDate,
    });
  };

  // Generate time slots (9 AM to 8 PM, hourly)
  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 9 + i;
    return `${hour.toString().padStart(2, "0")}:00`;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book Session with {coachName}</DialogTitle>
          <DialogDescription>
            Select a date and time for your coaching session. Price: ${pricePerSession}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="time">Select Time (Optional)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select
                  id="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a time</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedDate && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium">Session Summary</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Date: {format(selectedDate, "PPP")}
                  {selectedTime && ` at ${selectedTime}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total: ${pricePerSession}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={bookingMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={bookingMutation.isPending || !selectedDate}>
              {bookingMutation.isPending ? "Booking..." : "Confirm Booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
