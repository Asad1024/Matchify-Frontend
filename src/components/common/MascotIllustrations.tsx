import { useId } from "react";
import { motion } from "framer-motion";
import { MATCHIFY_PINK_HEX } from "@/lib/matchifyBranding";

/** Matchify red-wine brand tones for SVGs. */
const PINK = MATCHIFY_PINK_HEX;
const PINK_DEEP = "#4a1a26";
const PINK_LIGHT = "#dcb8c4";
const PINK_ACCENT = "#a84860";

// Matchify Mascot - A friendly heart character
export function MatchifyMascot({ className = "w-48 h-48", animated = true }: { className?: string; animated?: boolean }) {
  const uid = useId().replace(/:/g, "_");
  const heartGradient = `heartGradient_${uid}`;
  const MascotSVG = (
    <svg
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main heart body */}
      <motion.path
        d="M100,180 C100,180 40,120 40,80 C40,50 60,30 100,30 C140,30 160,50 160,80 C160,120 100,180 100,180 Z"
        fill={`url(#${heartGradient})`}
        stroke="rgba(139, 41, 66, 0.4)"
        strokeWidth="2"
        initial={animated ? { scale: 0.8, opacity: 0 } : {}}
        animate={animated ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
      />
      
      {/* Eyes */}
      <motion.circle
        cx="85"
        cy="75"
        r="8"
        fill="#1a1a1a"
        initial={animated ? { scale: 0 } : {}}
        animate={animated ? { scale: 1 } : {}}
        transition={{ delay: 0.3, type: "spring", bounce: 0.6 }}
      />
      <motion.circle
        cx="115"
        cy="75"
        r="8"
        fill="#1a1a1a"
        initial={animated ? { scale: 0 } : {}}
        animate={animated ? { scale: 1 } : {}}
        transition={{ delay: 0.35, type: "spring", bounce: 0.6 }}
      />
      
      {/* Sparkle effect */}
      <motion.g
        initial={animated ? { opacity: 0, scale: 0 } : {}}
        animate={animated ? { opacity: [0, 1, 0], scale: [0, 1, 0] } : {}}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      >
        <circle cx="60" cy="60" r="3" fill={PINK_ACCENT} />
        <circle cx="140" cy="50" r="2.5" fill={PINK_LIGHT} />
        <circle cx="50" cy="100" r="2" fill={PINK} />
      </motion.g>
      
      <defs>
        <linearGradient id={heartGradient} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={PINK_LIGHT} stopOpacity="0.95" />
          <stop offset="55%" stopColor={PINK} stopOpacity="1" />
          <stop offset="100%" stopColor={PINK_DEEP} stopOpacity="1" />
        </linearGradient>
      </defs>
    </svg>
  );

  return animated ? (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {MascotSVG}
    </motion.div>
  ) : (
    MascotSVG
  );
}

// Searching/Loading Mascot
export function SearchingMascot({ className = "w-48 h-48" }: { className?: string }) {
  const uid = useId().replace(/:/g, "_");
  const searchGradient = `searchGradient_${uid}`;
  return (
    <motion.div
      className={className}
      animate={{ rotate: [0, 5, -5, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {/* Heart with magnifying glass */}
        <path
          d="M100,160 C100,160 50,110 50,70 C50,40 70,20 100,20 C130,20 150,40 150,70 C150,110 100,160 100,160 Z"
          fill={`url(#${searchGradient})`}
          opacity="0.9"
        />
        <motion.circle
          cx="85"
          cy="65"
          r="6"
          fill="#1a1a1a"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.circle
          cx="115"
          cy="65"
          r="6"
          fill="#1a1a1a"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        />
        {/* Magnifying glass */}
        <motion.g
          animate={{ x: [0, 5, 0], y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <circle cx="140" cy="120" r="25" fill="none" stroke={PINK} strokeWidth="3" />
          <line x1="160" y1="140" x2="175" y2="155" stroke={PINK_DEEP} strokeWidth="3" strokeLinecap="round" />
        </motion.g>
        <defs>
          <linearGradient id={searchGradient} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={PINK_LIGHT} stopOpacity="0.85" />
            <stop offset="100%" stopColor={PINK_DEEP} stopOpacity="0.9" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}

// Celebration Mascot
export function CelebrationMascot({ className = "w-48 h-48" }: { className?: string }) {
  const uid = useId().replace(/:/g, "_");
  const celebrationGradient = `celebrationGradient_${uid}`;
  return (
    <motion.div
      className={className}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", bounce: 0.6, duration: 0.8 }}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M100,160 C100,160 50,110 50,70 C50,40 70,20 100,20 C130,20 150,40 150,70 C150,110 100,160 100,160 Z"
          fill={`url(#${celebrationGradient})`}
        />
        <circle cx="85" cy="65" r="8" fill="#1a1a1a" />
        <circle cx="115" cy="65" r="8" fill="#1a1a1a" />
        {/* Smile */}
        <motion.path
          d="M 80 90 Q 100 110 120 90"
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        />
        {/* Confetti */}
        {[...Array(8)].map((_, i) => (
          <motion.circle
            key={i}
            cx={50 + i * 15}
            cy={30 + (i % 2) * 20}
            r="4"
            fill={[PINK, PINK_ACCENT, PINK_LIGHT, PINK_DEEP][i % 4]}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: 50, opacity: [0, 1, 0] }}
            transition={{
              delay: i * 0.1,
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 2,
            }}
          />
        ))}
        <defs>
          <linearGradient id={celebrationGradient} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={PINK_LIGHT} />
            <stop offset="100%" stopColor={PINK_DEEP} />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}

// Empty state mascot variations
export function NoMatchesMascot({ className = "w-48 h-48" }: { className?: string }) {
  const uid = useId().replace(/:/g, "_");
  const emptyGradient = `emptyGradient_${uid}`;
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M100,160 C100,160 50,110 50,70 C50,40 70,20 100,20 C130,20 150,40 150,70 C150,110 100,160 100,160 Z"
          fill={`url(#${emptyGradient})`}
          opacity="0.75"
        />
        <circle cx="85" cy="65" r="7" fill="#1a1a1a" />
        <circle cx="115" cy="65" r="7" fill="#1a1a1a" />
        {/* Question mark */}
        <motion.text
          x="100"
          y="110"
          fontSize="40"
          fill={PINK}
          textAnchor="middle"
          fontFamily="Arial"
          fontWeight="bold"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ?
        </motion.text>
        <defs>
          <linearGradient id={emptyGradient} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={PINK_LIGHT} stopOpacity="0.65" />
            <stop offset="100%" stopColor={PINK_DEEP} stopOpacity="0.75" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}

// Luna - Empathy Observer Mascot (Heart with Eye representing empathy and observation)
export function LunaMascot({ className = "w-48 h-48" }: { className?: string }) {
  const uid = useId().replace(/:/g, "_");
  const emmaGradient = `emmaGradient_${uid}`;
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {/* Main heart body */}
        <path
          d="M100,170 C100,170 40,110 40,70 C40,40 60,20 100,20 C140,20 160,40 160,70 C160,110 100,170 100,170 Z"
          fill={`url(#${emmaGradient})`}
          stroke="rgba(139, 41, 66, 0.4)"
          strokeWidth="2"
        />
        
        {/* Eye representing observation */}
        <motion.ellipse
          cx="100"
          cy="75"
          rx="25"
          ry="18"
          fill="#1a1a1a"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="100"
          cy="75"
          r="10"
          fill="#ffffff"
          animate={{ cx: [95, 105, 95] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Empathy sparkles around the eye */}
        {[...Array(6)].map((_, i) => {
          const angle = (i * 60) * (Math.PI / 180);
          const radius = 45;
          const x = Number((100 + Math.cos(angle) * radius).toFixed(2));
          const y = Number((75 + Math.sin(angle) * radius).toFixed(2));
          return (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill={PINK_ACCENT}
              animate={{ 
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          );
        })}
        
        {/* Gentle smile */}
        <motion.path
          d="M 75 100 Q 100 115 125 100"
          fill="none"
          stroke="rgba(26, 26, 26, 0.6)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        />
        
        <defs>
          <linearGradient id={emmaGradient} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={PINK_LIGHT} stopOpacity="0.95" />
            <stop offset="100%" stopColor={PINK_DEEP} stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}

