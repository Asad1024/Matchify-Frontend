import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import PageWrapper from "@/components/common/PageWrapper";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, Download, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type CourseRow = {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  image?: string | null;
  price?: number;
  resourceUrl?: string | null;
  resourceName?: string | null;
  isFree?: boolean | number | null;
  enrolled?: boolean;
  canAccessMaterial?: boolean;
};

export default function Courses() {
  const [activePage, setActivePage] = useState("menu");
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [payDialogCourse, setPayDialogCourse] = useState<CourseRow | null>(null);

  const { data: courses = [], isLoading: coursesLoading } = useQuery<CourseRow[]>({
    queryKey: ["/api/courses"],
  });

  const unlockMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!userId) throw new Error("Sign in required");
      const res = await fetch(buildApiUrl("/api/enrollments"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders(true) },
        credentials: "include",
        body: JSON.stringify({
          userId,
          courseId,
          paymentComplete: true,
        }),
      });
      const text = await res.text();
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = JSON.parse(text) as { message?: string };
          if (j?.message) msg = j.message;
        } catch {
          if (text) msg = text.slice(0, 180);
        }
        throw new Error(msg);
      }
      return text ? JSON.parse(text) : {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      if (userId) {
        queryClient.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[0] === "/api/enrollments" &&
            q.queryKey.includes(userId),
        });
      }
      setPayDialogCourse(null);
      toast({ title: "Unlocked", description: "You can view and download this course." });
    },
    onError: (e: Error) => {
      toast({ title: "Could not unlock", description: e.message, variant: "destructive" });
    },
  });

  const isFreeCourse = (c: CourseRow) => c.isFree !== false && c.isFree !== 0;

  /** Same flag the API uses to include material + enrolled (fixes Pay staying visible after unlock). */
  const hasCourseAccess = (c: CourseRow) =>
    isFreeCourse(c) ||
    c.canAccessMaterial === true ||
    c.canAccessMaterial === 1 ||
    c.enrolled === true ||
    c.enrolled === 1;

  /** API exposes file URL only when free or enrolled (paid). */
  const canUseFile = (c: CourseRow) => Boolean(c.resourceUrl);

  const openMaterial = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const downloadMaterial = (url: string, name?: string | null) => {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    if (name) a.download = name;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-24">
      <Header
        showSearch={true}
        title="Courses"
        subtitle="Guides & downloads from Matchify"
        onNotifications={() => setLocation("/notifications")}
        onCreate={() => setLocation("/")}
        onSettings={() => setLocation("/profile")}
        onLogout={logout}
      />

      <PageWrapper className="mx-auto w-full max-w-lg px-4 pt-4">
        {coursesLoading ? (
          <LoadingState message="Loading courses…" showMascot={true} />
        ) : courses.length === 0 ? (
          <div className="py-10">
            <EmptyState
              useMascot={true}
              mascotType="default"
              title="No courses yet"
              description="New programs will appear here when the team publishes them."
            />
          </div>
        ) : (
          <ul className="flex flex-col gap-3 pb-4">
            {courses.map((c) => {
              const free = isFreeCourse(c);
              const unlocked = hasCourseAccess(c);
              const showPay = !free && !unlocked;
              const fileOk = canUseFile(c);

              return (
                <li
                  key={c.id}
                  className={cn(
                    "matchify-surface rounded-2xl border border-border/60 bg-card/90 overflow-hidden shadow-sm",
                  )}
                >
                  <div className="flex text-left">
                    <div className="relative h-28 w-28 shrink-0 bg-primary/10">
                      {c.image ? (
                        <img src={c.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <BookOpen className="h-10 w-10 text-primary/40" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 p-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h2 className="font-semibold text-foreground line-clamp-2">{c.title}</h2>
                        {free ? (
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            Free
                          </Badge>
                        ) : unlocked ? (
                          <Badge variant="outline" className="text-[10px] shrink-0 border-emerald-500/50 text-emerald-700 dark:text-emerald-400">
                            Unlocked
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] shrink-0 border-primary/40 text-primary">
                            ${c.price ?? 0}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{c.description}</p>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        {c.duration} · {c.level}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-border/50 px-3 py-2.5">
                    {showPay ? (
                      <Button
                        size="sm"
                        className="w-full rounded-full"
                        disabled={unlockMutation.isPending}
                        onClick={() => {
                          if (!userId) {
                            toast({
                              title: "Sign in required",
                              description: "Log in to unlock this course.",
                              variant: "destructive",
                            });
                            return;
                          }
                          setPayDialogCourse(c);
                        }}
                      >
                        Pay
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="flex-1 rounded-full gap-1.5"
                          disabled={!fileOk}
                          onClick={() => fileOk && c.resourceUrl && openMaterial(c.resourceUrl)}
                        >
                          <ExternalLink className="h-4 w-4 shrink-0" />
                          View
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="flex-1 rounded-full gap-1.5"
                          disabled={!fileOk}
                          onClick={() => fileOk && c.resourceUrl && downloadMaterial(c.resourceUrl, c.resourceName)}
                        >
                          <Download className="h-4 w-4 shrink-0" />
                          Download
                        </Button>
                      </div>
                    )}
                    {!fileOk && !showPay && (
                      <p className="text-center text-[11px] text-muted-foreground">No file attached to this course yet.</p>
                    )}
                    {!free && unlocked && fileOk && (
                      <p className="text-center text-[11px] text-muted-foreground">View or download anytime.</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PageWrapper>

      <Dialog open={!!payDialogCourse} onOpenChange={(open) => !open && setPayDialogCourse(null)}>
        <DialogContent className="mx-auto max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Unlock course</DialogTitle>
            <DialogDescription>
              {payDialogCourse ? (
                <>
                  <span className="block font-medium text-foreground">
                    {payDialogCourse.title}
                  </span>
                  <span className="mt-2 block text-sm">
                    Amount: <strong>${payDialogCourse.price ?? 0}</strong> — checkout is simulated (no real card).
                    Tap Pay to unlock View and Download.
                  </span>
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setPayDialogCourse(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={unlockMutation.isPending || !payDialogCourse}
              onClick={() => payDialogCourse && unlockMutation.mutate(payDialogCourse.id)}
            >
              {unlockMutation.isPending ? "Processing…" : "Pay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
  );
}
