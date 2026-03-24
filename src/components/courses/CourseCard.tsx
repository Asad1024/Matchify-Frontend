import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Clock, BarChart } from "lucide-react";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  image?: string;
  enrolled?: boolean;
  /** 0–100 when enrolled; grows slightly by days since enrollment (demo) */
  progressPercent?: number;
  onEnroll?: (id: string) => void;
  onClick?: (id: string) => void;
}

export default function CourseCard({
  id,
  title,
  description,
  duration,
  level,
  image,
  enrolled = false,
  progressPercent,
  onEnroll,
  onClick
}: CourseCardProps) {
  const levelColors = {
    beginner: 'bg-chart-2/20 text-chart-2',
    intermediate: 'bg-chart-4/20 text-chart-4',
    advanced: 'bg-chart-5/20 text-chart-5'
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card 
        className="overflow-hidden hover-elevate cursor-pointer transition-all"
        onClick={() => onClick?.(id)}
        data-testid={`card-course-${id}`}
      >
      <div className="relative h-40 bg-gradient-to-br from-primary/20 to-chart-1/20">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BarChart className="w-12 h-12 text-primary/50" />
          </div>
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-display font-semibold text-lg text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
          <Badge variant="secondary" className={levelColors[level]}>
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </Badge>
        </div>
        {enrolled && typeof progressPercent === "number" && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>Your progress</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={Math.min(100, Math.max(0, progressPercent))} className="h-2" />
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className={`w-full rounded-full ${!enrolled ? 'glow-primary transition-all duration-300' : ''}`}
          variant={enrolled ? "outline" : "default"}
          onClick={(e) => {
            e.stopPropagation();
            onEnroll?.(id);
          }}
          data-testid={`button-enroll-${id}`}
        >
          {enrolled ? 'Continue Learning' : 'Enroll Now'}
        </Button>
      </CardFooter>
    </Card>
    </motion.div>
  );
}
