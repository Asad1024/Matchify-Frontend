import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Home, Users, Calendar, MessageCircle, User as UserIcon, Compass, Bell, GraduationCap, Sparkles, Search, Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMockData } from "@/lib/mockData";
import { fetchPostsFeedPage } from "@/lib/fetchPostsFeed";
import type { User, Event, Group, Post } from "@shared/schema";
import { VerifiedTick } from "@/components/common/VerifiedTick";
import { useCurrentUser } from "@/contexts/UserContext";
import { filterEventsVisibleToViewer } from "@/lib/eventVisibility";

/** Dispatched by Header search button so the palette opens from the icon tap. */
export const OPEN_GLOBAL_SEARCH_EVENT = "matchify-open-global-search";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();

  const { data: me } = useQuery<User & { isAdmin?: boolean }>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  // Fetch data for search
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });
  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
  });
  const { data: posts = [] } = useQuery<Post[]>({
    queryKey: ["/api/posts", "global-search"],
    queryFn: () => fetchPostsFeedPage({ limit: 120, offset: 0 }) as Promise<Post[]>,
  });

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_GLOBAL_SEARCH_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_GLOBAL_SEARCH_EVENT, onOpen);
  }, []);

  // Filter results based on search query
  const filteredUsers = users.filter((user: any) =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const eventsForSearch = useMemo(
    () => filterEventsVisibleToViewer(events, userId, !!(me as { isAdmin?: boolean })?.isAdmin),
    [events, userId, me],
  );

  const filteredEvents = eventsForSearch.filter((event: any) =>
    event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter((group: any) =>
    group.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPosts = posts.filter((post: any) =>
    post.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navigationItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Compass, label: "People", path: "/directory" },
    { icon: Globe, label: "Feed", path: "/community" },
    { icon: Calendar, label: "Events", path: "/events" },
    { icon: MessageCircle, label: "Chat", path: "/chat" },
    { icon: UserIcon, label: "Profile", path: "/profile" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: GraduationCap, label: "Courses", path: "/courses" },
    { icon: Sparkles, label: "AI Matchmaker", path: "/ai-matchmaker" },
  ];

  const handleSelect = (path: string) => {
    setLocation(path);
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search users, events, groups, posts, or navigate..." 
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          {/* Quick Navigation */}
          {!searchQuery && (
            <CommandGroup heading="Navigation">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.path}
                    onSelect={() => handleSelect(item.path)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {/* Search Results */}
          {searchQuery && (
            <>
              {filteredUsers.length > 0 && (
                <CommandGroup heading="Users">
                  {filteredUsers.slice(0, 5).map((user: any) => (
                    <CommandItem
                      key={user.id}
                      onSelect={() => handleSelect(`/profile/${user.id}`)}
                    >
                      <UserIcon className="h-4 w-4" />
                      <span className="flex items-center gap-1.5">
                        <span>{user.name}</span>
                        {user.verified ? <VerifiedTick size="xs" /> : null}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {filteredEvents.length > 0 && (
                <CommandGroup heading="Events">
                  {filteredEvents.slice(0, 5).map((event: any) => (
                    <CommandItem
                      key={event.id}
                      onSelect={() => handleSelect("/events")}
                    >
                      <Calendar className="h-4 w-4" />
                      <span>{event.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {filteredGroups.length > 0 && (
                <CommandGroup heading="Groups">
                  {filteredGroups.slice(0, 5).map((group: any) => (
                    <CommandItem
                      key={group.id}
                      onSelect={() => handleSelect("/community")}
                    >
                      <Users className="h-4 w-4" />
                      <span>{group.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {filteredPosts.length > 0 && (
                <CommandGroup heading="Posts">
                  {filteredPosts.slice(0, 5).map((post: any) => (
                    <CommandItem
                      key={post.id}
                      onSelect={() => handleSelect("/")}
                    >
                      <Search className="h-4 w-4" />
                      <span className="truncate">{post.content?.substring(0, 50)}...</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

