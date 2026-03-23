import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Play, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl } from "@/services/api";
import { queryClient } from "@/lib/queryClient";

interface EventMatchAdminProps {
  eventId: string;
  eventTitle: string;
}

interface QuestionnaireSubmission {
  userId: string;
  userName: string;
  userAvatar?: string;
  submittedAt: string;
  completed: boolean;
}

export default function EventMatchAdmin({ eventId, eventTitle }: EventMatchAdminProps) {
  const { toast } = useToast();
  const [matchRevealTime, setMatchRevealTime] = useState<Date | null>(null);

  // Fetch questionnaire submissions
  const { data: submissions = [], isLoading } = useQuery<QuestionnaireSubmission[]>({
    queryKey: [`/api/events/${eventId}/questionnaire-submissions`],
    queryFn: async () => {
      const url = buildApiUrl(`/api/events/${eventId}/questionnaire-submissions`);
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch submissions');
      return res.json();
    },
  });

  // Calculate matches
  const calculateMatchesMutation = useMutation({
    mutationFn: async () => {
      const url = buildApiUrl(`/api/events/${eventId}/calculate-matches`);
      const res = await fetch(url, {
        method: "POST",
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to calculate matches');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Matches calculated! ✅",
        description: "Matches have been generated for all participants",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/matches`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Calculation failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Schedule match reveal
  const scheduleRevealMutation = useMutation({
    mutationFn: async (revealTime: Date) => {
      const url = buildApiUrl(`/api/events/${eventId}/schedule-reveal`);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ revealTime: revealTime.toISOString() }),
      });
      if (!res.ok) throw new Error('Failed to schedule reveal');
      return res.json();
    },
    onSuccess: (data) => {
      const raw = data.revealTime ?? data.matchRevealTime;
      const when = raw ? new Date(raw) : null;
      if (when && !Number.isNaN(when.getTime())) setMatchRevealTime(when);
      toast({
        title: "Reveal scheduled! ⏰",
        description: when
          ? `Matches will be revealed at ${when.toLocaleString()}`
          : "Reveal time saved.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Scheduling failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleScheduleReveal = () => {
    // Schedule reveal for 60 seconds from now (like SparkBox)
    const revealTime = new Date(Date.now() + 60 * 1000);
    scheduleRevealMutation.mutate(revealTime);
  };

  const completedCount = submissions.filter(s => s.completed).length;
  const totalCount = submissions.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Match Admin - {eventTitle}
          </CardTitle>
          <CardDescription>
            Manage questionnaire submissions and match reveals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-foreground">{totalCount}</div>
                <div className="text-sm text-muted-foreground">Total Submissions</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">{completedCount}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => calculateMatchesMutation.mutate()}
              disabled={calculateMatchesMutation.isPending || completedCount < 2}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              {calculateMatchesMutation.isPending ? "Calculating..." : "Calculate Matches"}
            </Button>
            <Button
              variant="outline"
              onClick={handleScheduleReveal}
              disabled={scheduleRevealMutation.isPending || completedCount < 2}
            >
              <Clock className="w-4 h-4 mr-2" />
              {matchRevealTime ? "Reschedule Reveal" : "Schedule Reveal"}
            </Button>
          </div>

          {matchRevealTime && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold">Reveal Scheduled</p>
                    <p className="text-sm text-muted-foreground">
                      {matchRevealTime.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {completedCount < 2 && (
            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <p className="text-sm">
                    Need at least 2 completed questionnaires to calculate matches
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submissions List */}
          <div>
            <h3 className="font-semibold mb-3">Questionnaire Submissions</h3>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No submissions yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.userId}>
                      <TableCell className="font-medium">{submission.userName}</TableCell>
                      <TableCell>
                        <Badge variant={submission.completed ? "default" : "secondary"}>
                          {submission.completed ? "Completed" : "In Progress"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(submission.submittedAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
