import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard, Users, BarChart3, FileText, Calendar,
  UsersRound, MessageSquare, Shield, Settings, TrendingUp,
  Heart, BookOpen, GraduationCap, LogOut, Menu, X, ListChecks, ClipboardList,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const adminMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
  { id: 'matches', label: 'Matches', icon: Heart, path: '/admin/matches' },
  { id: 'posts', label: 'Posts', icon: FileText, path: '/admin/posts' },
  { id: 'events', label: 'Events', icon: Calendar, path: '/admin/events' },
  { id: 'questions', label: 'Setup Questions', icon: ListChecks, path: '/admin/questions' },
  {
    id: 'onboarding-q',
    label: 'Onboarding Q&A',
    icon: ClipboardList,
    path: '/admin/onboarding-questionnaire',
  },
  { id: 'groups', label: 'Groups', icon: UsersRound, path: '/admin/groups' },
  { id: 'courses', label: 'Courses', icon: BookOpen, path: '/admin/courses' },
  { id: 'coaches', label: 'Coaches', icon: GraduationCap, path: '/admin/coaches' },
  { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/admin/messages' },
  { id: 'reports', label: 'Reports', icon: Shield, path: '/admin/reports' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { logout } = useAuth();

  // Desktop sidebar collapse state
  const [collapsed, setCollapsed] = useState(false);
  // Mobile drawer open state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const currentPath = location;
  const currentPage = adminMenuItems.find(
    item => item.path === currentPath || (item.path !== '/admin' && currentPath.startsWith(item.path))
  )?.label || 'Dashboard';

  const handleNavigate = (path: string) => {
    setLocation(path);
    setDrawerOpen(false);
  };

  const NavItems = ({ showLabels }: { showLabels: boolean }) => (
    <>
      {adminMenuItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.path ||
          (item.path !== '/admin' && currentPath.startsWith(item.path));
        return (
          <Button
            key={item.id}
            variant={isActive ? "secondary" : "ghost"}
            className={cn("w-full justify-start", showLabels ? "px-4" : "px-2")}
            onClick={() => handleNavigate(item.path)}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {showLabels && <span className="ml-3 truncate">{item.label}</span>}
          </Button>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── DESKTOP SIDEBAR (md+) ── */}
      <aside className={cn(
        "hidden md:flex flex-col bg-card border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="p-4 border-b flex items-center justify-between">
          {!collapsed && <h2 className="text-lg font-semibold truncate">Admin Panel</h2>}
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          <NavItems showLabels={!collapsed} />
        </nav>
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            className={cn("w-full justify-start text-destructive hover:text-destructive", collapsed ? "px-2" : "px-4")}
            onClick={logout}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* ── MOBILE TOP BAR (< md) ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b flex items-center gap-3 px-4 h-14">
        <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(true)}>
          <Menu className="w-5 h-5" />
        </Button>
        <span className="font-bold text-base flex-1 truncate">Matchify</span>
        <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">ADMIN</span>
        <span className="text-xs text-muted-foreground truncate max-w-[100px]">{currentPage}</span>
      </div>

      {/* ── MOBILE DRAWER OVERLAY ── */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          onClick={() => setDrawerOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" />
          {/* Drawer */}
          <div
            className="relative bg-card w-72 h-full flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Admin Panel</h2>
              <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
              <NavItems showLabels={true} />
            </nav>
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start px-4 text-destructive hover:text-destructive"
                onClick={() => { logout(); setDrawerOpen(false); }}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-14">
        {children}
      </main>
    </div>
  );
}
