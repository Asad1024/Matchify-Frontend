import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Star, DollarSign, Languages, CheckCircle, Clock } from "lucide-react";

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
  onBookSession,
  onClick
}: CoachCardProps) {
  const gradient = getGradient(specialty);
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card
        className="overflow-hidden hover-elevate cursor-pointer transition-all border-0 shadow-md"
        onClick={() => onClick?.(id)}
        data-testid={`card-coach-${id}`}
      >
        {/* Colored header strip */}
        <div className={`h-20 bg-gradient-to-r ${gradient} relative`}>
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }}
          />
          {/* Availability badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-[11px] font-semibold text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Available
          </div>
        </div>

        <CardContent className="p-5 space-y-4 -mt-10 relative">
          {/* Avatar overlapping header */}
          <div className="flex items-end gap-4 mb-2">
            <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
              <AvatarImage src={image} alt={name} />
              <AvatarFallback className={`text-xl font-black text-white bg-gradient-to-br ${gradient}`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-bold text-base text-foreground">{name}</h3>
                <CheckCircle className="w-4 h-4 text-primary fill-primary/20 flex-shrink-0" />
              </div>
              <Badge className="bg-primary/10 text-primary border-0 text-[11px] mt-0.5 rounded-full">
                {specialty}
              </Badge>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"}`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-foreground">{rating}</span>
            <span className="text-xs text-muted-foreground">({reviewCount} reviews)</span>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{bio}</p>

          {/* Details row */}
          <div className="flex items-center gap-4 text-sm">
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
                <span className="text-xs">{languages.slice(0, 2).join(', ')}</span>
              </div>
            )}
          </div>

          <Button
            className="w-full rounded-full font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              onBookSession?.(id);
            }}
            data-testid={`button-book-${id}`}
          >
            Book Session
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
