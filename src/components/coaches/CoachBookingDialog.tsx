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
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/services/api";
import { useCurrentUser } from "@/contexts/UserContext";

interface CoachBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coachId: string;
  coachName: string;
  pricePerSession: number;
  onBookingSuccess?: (booking: Record<string, unknown>) => void;
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
  const todayStart = startOfDay(new Date());

  const bookingMutation = useMutation({
    mutationFn: async (data: {
      userId: string;
      coachId: string;
      sessionDate: string | null;
      paymentComplete: boolean;
    }) => {
      const res = await apiRequest("POST", "/api/coaches/bookings", data);
      return res.json() as Promise<Record<string, unknown>>;
    },
    onSuccess: (booking: Record<string, unknown>) => {
      toast({
        title: "Request sent",
        description: `Your session request for ${coachName} was submitted. You’ll get updates when it’s confirmed or rescheduled.`,
      });
      onBookingSuccess?.({
        ...booking,
        coach: (booking.coach as Record<string, unknown> | undefined) ?? { name: coachName },
      });
      onOpenChange(false);
      // Reset form
      setSelectedDate(undefined);
      setSelectedTime("");
    },
    onError: (error: Error) => {
      toast({
        title: "Could not send request",
        description: error.message || "Please try again in a moment.",
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

    if (!selectedTime) {
      toast({
        title: "Time required",
        description: "Please select a session time.",
        variant: "destructive",
      });
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const sessionDate = `${dateStr}T${selectedTime}:00`;

    bookingMutation.mutate({
      userId,
      coachId,
      sessionDate,
      paymentComplete: true,
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
            Choose a date and time, complete demo checkout, then submit. An admin confirms your session or suggests alternate slots if the coach is busy.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex h-10 w-full items-center justify-start gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm",
                      "text-foreground shadow-sm ring-offset-background transition-colors",
                      "hover:bg-accent/35 hover:text-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="z-[140] w-auto p-0"
                  align="start"
                  side="bottom"
                  sideOffset={-4}
                  collisionPadding={8}
                >
                  <Calendar
                    compact
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < todayStart}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="time">Select time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select
                  id="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Choose a time</option>
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
                {pricePerSession > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Session fee: ${pricePerSession} — demo checkout records payment as paid so the team can confirm your slot.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No fee on file for this coach; your request is still sent to the team for confirmation.
                  </p>
                )}
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
            <Button type="submit" disabled={bookingMutation.isPending || !selectedDate || !selectedTime}>
              {bookingMutation.isPending ? "Processing…" : "Pay & submit request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
