import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, Heart, X } from "lucide-react";

interface SwipeableEventCardProps {
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
  onSwipeLeft?: (id: string) => void;
  onSwipeRight?: (id: string) => void;
}

export default function SwipeableEventCard({
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
  onSwipeLeft,
  onSwipeRight
}: SwipeableEventCardProps) {
  const [exitX, setExitX] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      setExitX(200);
      setTimeout(() => {
        onSwipeRight?.(id);
      }, 100);
    } else if (info.offset.x < -100) {
      setExitX(-200);
      setTimeout(() => {
        onSwipeLeft?.(id);
      }, 100);
    } else {
      // Snap back if not swiped far enough
      setExitX(0);
    }
  };

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={exitX !== 0 ? { x: exitX } : {}}
      className="absolute w-full max-w-sm"
    >
      <Card className="overflow-hidden shadow-2xl">
        <div className="relative h-80 bg-gradient-to-br from-primary/20 to-chart-3/20">
          {image ? (
            <img src={image} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-chart-3/30">
              <Calendar className="w-32 h-32 text-primary/60" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          <Badge className="absolute top-4 left-4 bg-background/90 backdrop-blur-md border-primary/20 shadow-lg">
            {type === 'online' ? '🌐 Online' : '📍 In Person'}
          </Badge>
          {price && (
            <Badge className="absolute top-4 right-4 bg-success text-success-foreground shadow-lg shadow-success/30">
              {price}
            </Badge>
          )}

          {/* Swipe indicators */}
          <motion.div 
            className="absolute top-1/2 left-8 -translate-y-1/2"
            style={{ opacity: useTransform(x, [-200, -50, 0], [1, 0.5, 0]) }}
          >
            <div className="w-20 h-20 rounded-full bg-red-500/20 border-4 border-red-500 flex items-center justify-center backdrop-blur-sm">
              <X className="w-12 h-12 text-red-500" />
            </div>
          </motion.div>

          <motion.div 
            className="absolute top-1/2 right-8 -translate-y-1/2"
            style={{ opacity: useTransform(x, [0, 50, 200], [0, 0.5, 1]) }}
          >
            <div className="w-20 h-20 rounded-full bg-success/20 border-4 border-success flex items-center justify-center backdrop-blur-sm">
              <Heart className="w-12 h-12 text-success" />
            </div>
          </motion.div>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className="text-2xl font-display font-bold text-white drop-shadow-lg leading-tight">
              {title}
            </h3>
            <p className="text-white/90 text-sm mt-2 line-clamp-2">{description}</p>
          </div>
        </div>

        <CardContent className="p-6 space-y-4">
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

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 rounded-full border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={() => {
                setExitX(-200);
                setTimeout(() => onSwipeLeft?.(id), 100);
              }}
              data-testid="button-pass"
            >
              <X className="w-5 h-5 mr-2" />
              Pass
            </Button>
            <Button
              size="lg"
              className="flex-1 rounded-full bg-success text-success-foreground hover:bg-success/90 glow-primary"
              onClick={() => {
                setExitX(200);
                setTimeout(() => onSwipeRight?.(id), 100);
              }}
              data-testid="button-interested"
            >
              <Heart className="w-5 h-5 mr-2" />
              Interested
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
