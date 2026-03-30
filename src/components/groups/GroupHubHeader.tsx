import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ChevronLeft, PenSquare } from "lucide-react";

export interface GroupHubGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  image?: string | null;
  tags?: string[] | null;
  religionFocus?: string | null;
}

interface GroupHubHeaderProps {
  group: GroupHubGroup;
  isMember: boolean;
  joinPending?: boolean;
  leavePending?: boolean;
  onBack: () => void;
  onJoin: () => void;
  onLeave: () => void;
  onCreatePost: () => void;
}

export default function GroupHubHeader({
  group,
  isMember,
  joinPending,
  leavePending,
  onBack,
  onJoin,
  onLeave,
  onCreatePost,
}: GroupHubHeaderProps) {
  const { name, description, memberCount, image, tags, religionFocus } = group;

  const communityLabel =
    religionFocus === "all" || !religionFocus
      ? null
      : religionFocus === "interfaith"
        ? "Interfaith"
        : religionFocus === "prefer_not_say"
          ? "Community"
          : String(religionFocus).replace(/_/g, " ");

  return (
    <div className="space-y-2" data-testid="group-hub-open">
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
        You’re inside a community group
      </p>
      <div className="rounded-2xl overflow-hidden border-2 border-primary bg-white shadow-xl shadow-primary/15">
      <div className="flex items-center justify-between gap-2 px-3 py-3 bg-primary text-primary-foreground">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 -ml-1 h-9 rounded-full text-primary-foreground hover:bg-white/15 hover:text-primary-foreground font-semibold"
          onClick={onBack}
        >
          <ChevronLeft className="w-4 h-4" />
          Browse all groups
        </Button>
        <Badge className="shrink-0 bg-white/20 text-white border border-white/35 text-[10px] font-bold uppercase tracking-wide">
          Inside group
        </Badge>
      </div>

      <div className="relative h-44 bg-gradient-to-br from-primary/25 via-primary/10 to-accent/20">
        {image ? (
          <img src={image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-7xl font-display font-bold text-primary/35">
            {name.slice(0, 2)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-display font-bold text-white drop-shadow-sm leading-tight">
              {name}
            </h2>
            {communityLabel && (
              <Badge
                variant="secondary"
                className="text-[10px] bg-white/90 text-primary border-0 font-semibold"
              >
                {communityLabel}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

        <div className="flex items-center gap-2 text-sm">
          <div className="bg-primary/15 p-2 rounded-lg">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-foreground">
            {memberCount.toLocaleString()} members
          </span>
        </div>

        {Array.isArray(tags) && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 6).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs bg-primary/10 text-foreground border-primary/20"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="rounded-xl bg-muted/50 border border-border/80 p-3">
          <p className="text-xs font-semibold text-foreground mb-0.5">In this group</p>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Share posts with members, like and comment — use the button below when you&apos;re in.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {isMember ? (
            <>
              <Button
                type="button"
                className="rounded-full font-semibold glow-primary flex-1 sm:flex-none min-h-10"
                onClick={onCreatePost}
              >
                <PenSquare className="w-4 h-4" />
                Create post
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full font-semibold flex-1 sm:flex-none min-h-10"
                disabled={leavePending}
                onClick={onLeave}
              >
                Leave group
              </Button>
            </>
          ) : (
            <Button
              type="button"
              className="rounded-full font-semibold bg-success text-success-foreground hover:bg-success/90 flex-1 min-h-10"
              disabled={joinPending}
              onClick={onJoin}
            >
              Join to post and view the feed
            </Button>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
