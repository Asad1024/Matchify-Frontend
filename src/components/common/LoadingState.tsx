import { motion } from "framer-motion";
import { SearchingMascot } from "./MascotIllustrations";

interface LoadingStateProps {
  message?: string;
  showMascot?: boolean;
}

export function LoadingState({ message = "Loading...", showMascot = false }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      {showMascot && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="rounded-[2rem] bg-gradient-to-b from-primary/12 via-primary/5 to-transparent px-8 py-6 ring-1 ring-primary/20 shadow-[0_12px_40px_-12px_hsl(346_96%_62%/0.35)]"
        >
          <SearchingMascot className="w-32 h-32" />
        </motion.div>
      )}
      
      <div className="flex items-center gap-2">
        <motion.div
          className="w-2 h-2 bg-primary rounded-full"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="w-2 h-2 bg-primary rounded-full"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="w-2 h-2 bg-primary rounded-full"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
        />
      </div>
      
      {message && (
        <motion.p
          className="text-sm font-medium text-primary/90"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}

// Enhanced loading state with gradient animation (like Amy app)
export function SearchingState({ message = "Searching..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <div className="relative w-64 h-12 bg-muted rounded-lg overflow-hidden">
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20"
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            backgroundSize: "200% 100%",
          }}
        />
        
        {/* Text overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-sm font-medium text-foreground"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {message}
          </motion.span>
        </div>
      </div>
      
      {/* Sources indicator */}
      <motion.div
        className="flex gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 bg-primary/40 rounded-full"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

