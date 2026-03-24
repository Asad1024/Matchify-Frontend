import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, Heart, Coffee, Music, Utensils, Dumbbell } from "lucide-react";
import { motion } from "framer-motion";

const EVENT_THEMES = [
  { gradient: "from-rose-400 via-pink-500 to-red-400", icon: Heart },
  { gradient: "from-amber-400 via-orange-400 to-yellow-500", icon: Coffee },
  { gradient: "from-violet-500 via-purple-500 to-indigo-400", icon: Music },
  { gradient: "from-emerald-400 via-green-500 to-teal-400", icon: Utensils },
  { gradient: "from-blue-400 via-cyan-500 to-sky-400", icon: Dumbbell },
];

function getEventTheme(id: string) {
  const idx = id.charCodeAt(0) % EVENT_THEMES.length;
  return EVENT_THEMES[idx];
}

interface EventCardProps {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'online' | 'offline';
  attendees: number;
  capacity: number;
  price?: string;
  image?: string;
  isRSVPd?: boolean;
  isLoading?: boolean;
  onRSVP?: (id: string) => void;
  onClick?: (id: string) => void;
}

export default function EventCard({
  id,
  title,
  description,
  date,
  time,
  location,
  type,
  attendees,
  capacity,
  price,
  image,
  isRSVPd = false,
  isLoading = false,
  onRSVP,
  onClick
}: EventCardProps) {
  const theme = getEventTheme(id);
  const ThemeIcon = theme.icon;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card 
        className="overflow-hidden hover-elevate cursor-pointer transition-all shadow-lg hover:shadow-2xl"
        onClick={() => onClick?.(id)}
        data-testid={`card-event-${id}`}
      >
        <div className="relative h-52">
          {image ? (
            <img src={image} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center`}>
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }}
              />
              <ThemeIcon className="w-20 h-20 text-white/80" strokeWidth={1} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <Badge className="absolute top-4 left-4 bg-background/90 backdrop-blur-md border-primary/20 shadow-lg">
            {type === 'online' ? '🌐 Online' : '📍 In Person'}
          </Badge>
          {price && (
            <Badge className="absolute top-4 right-4 bg-success text-success-foreground shadow-lg shadow-success/30">
              {price}
            </Badge>
          )}
        </div>
        <CardContent className="p-5 space-y-4">
          <div>
            <h3 className="font-display font-bold text-xl text-foreground leading-tight">{title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2 leading-relaxed">{description}</p>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-foreground">
              <div className="bg-primary/20 p-2 rounded-lg">
                <Calendar className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-medium">{date}</span>
            </div>
            <div className="flex items-center gap-3 text-foreground">
              <div className="bg-primary/20 p-2 rounded-lg">
                <Clock className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-medium">{time}</span>
            </div>
            <div className="flex items-center gap-3 text-foreground">
              <div className="bg-primary/20 p-2 rounded-lg">
                <MapPin className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="line-clamp-1 font-medium">{location}</span>
            </div>
            <div className="flex items-center gap-3 text-foreground">
              <div className="bg-primary/20 p-2 rounded-lg">
                <Users className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-medium">{attendees}/{capacity} attending</span>
            </div>
          </div>
          <motion.div whileTap={{ scale: isLoading ? 1 : 0.95 }} className="w-full">
            <Button
              className={`w-full rounded-full h-12 font-bold shadow-lg ${!isRSVPd ? 'bg-success text-success-foreground hover:bg-success/90 glow-primary transition-all duration-300' : ''}`}
              variant={isRSVPd ? "outline" : "default"}
              disabled={isLoading}
              onClick={(e) => {
                e.stopPropagation();
                onRSVP?.(id);
              }}
              data-testid={`button-rsvp-${id}`}
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
                  />
                  {isRSVPd ? 'Cancelling...' : 'RSVPing...'}
                </>
              ) : (
                isRSVPd ? '✓ RSVP\'d' : 'RSVP Now'
              )}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
