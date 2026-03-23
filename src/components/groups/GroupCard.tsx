import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { motion } from "framer-motion";

interface GroupData {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  image?: string | null;
  tags?: string[] | null;
  /** all | interfaith | or same value as user religion options */
  religionFocus?: string | null;
}

interface GroupCardProps {
  // Accept either a group object OR flat props
  group?: GroupData;
  id?: string;
  name?: string;
  description?: string;
  memberCount?: number;
  image?: string;
  tags?: string[];
  isMember?: boolean;
  isJoined?: boolean;
  onJoin?: (id?: string) => void;
  onLeave?: (id?: string) => void;
  onView?: (id?: string) => void;
  onClick?: (id: string) => void;
}

export default function GroupCard(props: GroupCardProps) {
  const {
    group,
    isMember,
    onJoin,
    onLeave,
    onView,
    onClick,
  } = props;

  // Support both group-object form and flat prop form
  const id = group?.id ?? props.id ?? "";
  const name = group?.name ?? props.name ?? "";
  const description = group?.description ?? props.description ?? "";
  const memberCount = group?.memberCount ?? props.memberCount ?? 0;
  const image = group?.image ?? props.image;
  const tags = group?.tags ?? props.tags ?? [];
  const religionFocus = group?.religionFocus ?? (props as { religionFocus?: string }).religionFocus;
  const isJoined = isMember ?? props.isJoined ?? false;

  const communityLabel =
    religionFocus === "all" || !religionFocus
      ? null
      : religionFocus === "interfaith"
        ? "Interfaith"
        : religionFocus === "prefer_not_say"
          ? "Community"
          : religionFocus.replace(/_/g, " ");

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card 
        className="overflow-hidden hover-elevate cursor-pointer transition-all shadow-md hover:shadow-xl"
        onClick={() => onClick?.(id)}
        data-testid={`card-group-${id}`}
      >
      <CardHeader className="p-0">
        <div className="h-40 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 flex items-center justify-center relative overflow-hidden">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-6xl font-display font-bold text-primary/40">{name.slice(0, 2)}</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-semibold text-lg text-foreground leading-tight">{name}</h3>
            {communityLabel && (
              <Badge variant="secondary" className="shrink-0 text-[10px] bg-primary/10 text-primary border-primary/20">
                {communityLabel}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2 leading-relaxed">{description}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="bg-primary/20 p-1.5 rounded-md">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <span className="font-medium text-foreground">{memberCount.toLocaleString()} members</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.isArray(tags) && tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs bg-primary/20 text-foreground border-primary/30 font-medium">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-5 pt-0 flex gap-2">
        {onView && (
          <motion.div className="flex-1" whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              className="w-full rounded-full h-9 font-semibold text-sm"
              onClick={(e) => {
                e.stopPropagation();
                onView(id);
              }}
            >
              View
            </Button>
          </motion.div>
        )}
        <motion.div className="flex-1" whileTap={{ scale: 0.95 }}>
          <Button
            className={`w-full rounded-full h-9 font-semibold shadow-md text-sm ${!isJoined ? 'bg-success text-success-foreground hover:bg-success/90 glow-primary transition-all duration-300' : ''}`}
            variant={isJoined ? "outline" : "default"}
            onClick={(e) => {
              e.stopPropagation();
              if (isJoined) {
                onLeave?.(id);
              } else {
                onJoin?.(id);
              }
            }}
            data-testid={`button-join-${id}`}
          >
            {isJoined ? '✓ Joined' : 'Join Group'}
          </Button>
        </motion.div>
      </CardFooter>
    </Card>
    </motion.div>
  );
}
