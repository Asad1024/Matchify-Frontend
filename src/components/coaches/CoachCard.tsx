import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Star, DollarSign, Languages } from "lucide-react";

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
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card 
        className="hover-elevate cursor-pointer transition-all"
        onClick={() => onClick?.(id)}
        data-testid={`card-coach-${id}`}
      >
      <CardContent className="p-6 space-y-4">
        <div className="flex gap-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={image} alt={name} />
            <AvatarFallback className="text-lg">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-lg text-foreground">{name}</h3>
            <p className="text-sm text-primary">{specialty}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-chart-4 text-chart-4" />
                <span className="text-sm font-medium">{rating}</span>
              </div>
              <span className="text-sm text-muted-foreground">({reviewCount} reviews)</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-3">{bio}</p>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-chart-2" />
            <span className="font-semibold text-foreground">${pricePerSession}/session</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Languages className="w-4 h-4" />
            <span>
              {Array.isArray(languages) && languages.length > 0 
                ? languages.join(', ') 
                : languages || 'English'}
            </span>
          </div>
        </div>

        <Button
          className="w-full rounded-full"
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
