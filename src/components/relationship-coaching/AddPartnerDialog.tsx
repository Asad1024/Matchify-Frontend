import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Search, Loader2, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useCurrentUser } from "@/contexts/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buildApiUrl } from "@/services/api";

interface FoundUser {
  id: string;
  name: string;
  username: string;
  avatar?: string | null;
}

interface AddPartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddPartnerDialog({ open, onOpenChange }: AddPartnerDialogProps) {
  const { toast } = useToast();
  const { userId } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [searching, setSearching] = useState(false);

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      setSearching(true);
      try {
        const res = await fetch(
          buildApiUrl(`/api/users/search?q=${encodeURIComponent(query)}`),
          { credentials: "include" },
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        return Array.isArray(data) ? data[0] || null : null;
      } finally {
        setSearching(false);
      }
    },
    onSuccess: (user) => {
      if (user) {
        setFoundUser(user);
      } else {
        toast({ title: "No user found with that username", variant: "destructive" });
        setFoundUser(null);
      }
    },
    onError: () => {
      toast({ title: "Search failed. Please try again.", variant: "destructive" });
    },
  });

  const addPartnerMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      const res = await fetch(buildApiUrl(`/api/users/${userId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ inRelationship: true, partnerId }),
      });
      if (!res.ok) throw new Error("Failed to add partner");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      toast({ title: "Partner added! 💕", description: "You're now in a relationship." });
      setFoundUser(null);
      setSearchQuery("");
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to add partner", variant: "destructive" });
    },
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    searchMutation.mutate(searchQuery.trim());
  };

  const handleAddPartner = () => {
    if (!foundUser) return;
    addPartnerMutation.mutate(foundUser.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary fill-primary/20" />
            </div>
            <DialogTitle className="text-lg font-bold">Add Partner</DialogTitle>
          </div>
          <DialogDescription>
            Search for your partner by their username to link your accounts and unlock relationship coaching features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="partner-search">Partner's Username</Label>
            <div className="flex gap-2">
              <Input
                id="partner-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username..."
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button
                size="icon"
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
              >
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {foundUser && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
              <Avatar className="w-12 h-12">
                <AvatarImage src={foundUser.avatar || undefined} alt={foundUser.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {foundUser.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{foundUser.name}</p>
                <p className="text-xs text-muted-foreground">@{foundUser.username}</p>
              </div>
              <UserCheck className="w-5 h-5 text-primary flex-shrink-0" />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddPartner}
            disabled={!foundUser || addPartnerMutation.isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {addPartnerMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 mr-2" />
                Add Partner
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
