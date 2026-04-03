import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Star, DollarSign, Languages, Clock } from "lucide-react";
import { VerifiedTick } from "@/components/common/VerifiedTick";
import { cn } from "@/lib/utils";

interface CoachCardProps {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  rating: number;
  reviewCount: number;
  pricePerSession: number;
  languages?: string[] | null;
  image?: string;
  requestSent?: boolean;
  onBookSession?: (id: string) => void;
  onClick?: (id: string) => void;
}

const SPECIALTY_COLORS: Record<string, string> = {
  "Pre-marriage": "from-red-800 to-primary",
  "Communication": "from-blue-400 to-indigo-500",
  "Conflict": "from-orange-400 to-amber-500",
  "Intimacy": "from-purple-400 to-violet-500",
  "Family": "from-green-400 to-emerald-500",
};

function getGradient(specialty: string) {
  for (const [key, gradient] of Object.entries(SPECIALTY_COLORS)) {
    if (specialty.toLowerCase().includes(key.toLowerCase())) return gradient;
  }
  return "from-primary to-primary/70";
}

export default function CoachCard({
  id,
  name,
  specialty,
  bio,
  rating,
  reviewCount,
  pricePerSession,
  languages,
  image,
  requestSent = false,
  onBookSession,
  onClick
}: CoachCardProps) {
  const initials = name.slice(0, 2).toUpperCase();
  const gradient = getGradient(specialty);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card
        className="cursor-pointer overflow-hidden border border-border/70 bg-card shadow-sm transition-all hover:shadow-md"
        onClick={() => onClick?.(id)}
        data-testid={`card-coach-${id}`}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <Avatar className="w-14 h-14 border border-border">
              <AvatarImage src={image} alt={name} />
                <AvatarFallback className={cn("text-sm font-bold text-white bg-gradient-to-br", gradient)}>
                {initials}
              </AvatarFallback>
            </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate font-display font-bold text-base text-foreground">{name}</h3>
                  <VerifiedTick size="sm" />
                </div>
                <Badge className="mt-1 rounded-full border-0 bg-primary/10 text-[11px] text-primary">
                  {specialty}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Available
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"}`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-foreground">{rating}</span>
            <span className="text-xs text-muted-foreground">({reviewCount} reviews)</span>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">{bio}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <DollarSign className="w-4 h-4 text-green-600" />
              ${pricePerSession}<span className="text-xs font-normal text-muted-foreground">/session</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">50 min</span>
            </div>
            {Array.isArray(languages) && languages.length > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Languages className="w-3.5 h-3.5" />
                <span className="text-xs">{languages.slice(0, 2).join(", ")}</span>
              </div>
            )}
          </div>

          <Button
            className="w-full rounded-full font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              onBookSession?.(id);
            }}
            disabled={requestSent}
            data-testid={`button-book-${id}`}
          >
            {requestSent ? "Request sent" : "Book Session"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
