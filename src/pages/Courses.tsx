import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import { PageBackBar } from "@/components/common/PageBackBar";
import CourseCard from "@/components/courses/CourseCard";
import BottomNav from "@/components/common/BottomNav";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl } from "@/services/api";

type Course = {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  instructorId: string;
  enrolledCount: number | null;
  createdAt: Date | null;
};

type Enrollment = {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date | null;
  createdAt?: string | null;
};

const progressFromEnrollment = (en: Enrollment | undefined): number => {
  if (!en) return 20;
  const raw = en.createdAt ?? (en.enrolledAt as unknown as string | null);
  if (!raw) return 22;
  const t = new Date(raw).getTime();
  if (Number.isNaN(t)) return 22;
  const days = (Date.now() - t) / 86400000;
  return Math.min(95, Math.round(18 + days * 12));
};

export default function Courses() {
  const [activePage, setActivePage] = useState('menu');
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { logout } = useAuth();
  const { toast } = useToast();

  // Fetch courses
  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  // Fetch user's enrollments
  const { data: enrollments = [] } = useQuery<Enrollment[]>({
    queryKey: ['/api/enrollments', userId],
    enabled: !!userId,
  });

  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!userId) throw new Error('User not logged in');
      const url = buildApiUrl('/api/enrollments');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, courseId }),
      });
      if (!response.ok) throw new Error('Failed to enroll');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments', userId] });
      toast({
        title: "Success",
        description: "Successfully enrolled in course",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to enroll in course",
        variant: "destructive",
      });
    },
  });

  // Check if user is enrolled in a course
  const isEnrolled = (courseId: string) => {
    return enrollments.some(e => e.courseId === courseId);
  };

  const enrollmentByCourse = useMemo(() => {
    const m = new Map<string, Enrollment>();
    enrollments.forEach((e) => m.set(e.courseId, e));
    return m;
  }, [enrollments]);

  // Format courses with enrollment status
  const coursesWithStatus = courses.map(course => ({
    ...course,
    enrolled: isEnrolled(course.id),
  }));

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header 
        showSearch={true} 
        unreadNotifications={3}
        onNotifications={() => setLocation('/notifications')}
        onCreate={() => setLocation('/')}
        onSettings={() => setLocation('/profile')}
        onLogout={logout} 
      />

      <PageBackBar fallback="/menu" />

      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-foreground">Courses</h1>
          <p className="text-muted-foreground mt-2">Enhance your relationship skills with expert courses</p>
        </div>

        {coursesLoading ? (
          <LoadingState message="Loading courses..." showMascot={true} />
        ) : courses.length === 0 ? (
          <div className="py-12">
            <EmptyState
              useMascot={true}
              mascotType="default"
              title="No courses available yet"
              description="Check back later for new courses or contact us to suggest topics!"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coursesWithStatus.map((course) => (
              <CourseCard
                key={course.id}
                {...course}
                progressPercent={
                  course.enrolled ? progressFromEnrollment(enrollmentByCourse.get(course.id)) : undefined
                }
                onEnroll={(id) => {
                  if (!isEnrolled(id)) {
                    enrollMutation.mutate(id);
                  }
                }}
                onClick={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
  );
}
