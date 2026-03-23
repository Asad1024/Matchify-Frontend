import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, Shield, Users, Sparkles, Star, ArrowRight, MessageCircle, Brain } from "lucide-react";
import { MATCHIFY_LOGO_URL } from "@/lib/matchifyBranding";

const STATS = [
  { value: "15M+", label: "Members" },
  { value: "600K+", label: "Successes" },
  { value: "500+", label: "Daily Couples" },
];

const FEATURES = [
  {
    icon: Shield,
    title: "Safe & Verified",
    text: "Selfie verification and location checks keep you safe.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Heart,
    title: "Serious Connections",
    text: "For those seeking meaningful, lasting relationships.",
    color: "bg-rose-50 text-rose-500",
  },
  {
    icon: Sparkles,
    title: "Smart Matching",
    text: "AI-powered compatibility based on values and goals.",
    color: "bg-violet-50 text-violet-500",
  },
  {
    icon: Users,
    title: "Private & Discreet",
    text: "Hide your photos and use a nickname for privacy.",
    color: "bg-sky-50 text-sky-500",
  },
  {
    icon: Brain,
    title: "Luna AI Coach",
    text: "Your personal relationship coach — available 24/7.",
    color: "bg-purple-50 text-purple-600",
  },
];

const LUNA_HIGHLIGHTS = [
  { emoji: "💬", text: "Personalised conversation tips" },
  { emoji: "📅", text: "Date night ideas tailored to you" },
  { emoji: "❤️‍🩹", text: "Guidance through relationship milestones" },
  { emoji: "🌟", text: "Celebrates your wins together" },
];

const TESTIMONIALS = [
  {
    name: "Sara M.",
    rating: 5,
    quote: "Finally found someone who shares my values. This app is completely different.",
    avatar: "SM",
  },
  {
    name: "Ahmed K.",
    rating: 5,
    quote: "Thoughtful matching and real conversations from day one.",
    avatar: "AK",
  },
  {
    name: "Fatima R.",
    rating: 5,
    quote: "More intentional than other apps. Found the one here.",
    avatar: "FR",
  },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 22, stiffness: 300 },
  },
};

interface SplashScreenProps {
  onGetStarted?: () => void;
  onLogin?: () => void;
}

export default function SplashScreen({ onGetStarted, onLogin }: SplashScreenProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col overflow-y-auto">
      {/* ── Hero ── */}
      <div className="relative flex flex-col items-center justify-center px-6 pt-14 pb-10 overflow-hidden"
           style={{ background: "linear-gradient(160deg, hsl(346 96% 62%) 0%, hsl(338 95% 56%) 100%)" }}>

        {/* Decorative rings */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[220, 360, 500, 640].map((size, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white/10"
              style={{
                width: size,
                height: size,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 flex flex-col items-center text-center gap-4 w-full max-w-xs"
        >
          {/* Logo only — larger, no wordmark */}
          <motion.div variants={itemVariants} className="flex justify-center">
            <img
              src={MATCHIFY_LOGO_URL}
              alt=""
              className="w-[7.5rem] h-[7.5rem] sm:w-[8.5rem] sm:h-[8.5rem] object-contain drop-shadow-2xl"
              width={136}
              height={136}
            />
          </motion.div>

          {/* Tagline */}
          <motion.p variants={itemVariants} className="text-white/70 text-sm leading-relaxed max-w-[240px]">
            Meaningful connections for serious relationships, built on shared values.
          </motion.p>

          {/* Stats */}
          <motion.div variants={itemVariants}
            className="flex gap-5 mt-1 bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20 w-full justify-around"
          >
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-white font-black text-lg leading-tight font-display">{value}</p>
                <p className="text-white/65 text-[11px] font-medium">{label}</p>
              </div>
            ))}
          </motion.div>

          {/* CTA buttons */}
          <motion.div variants={itemVariants} className="w-full space-y-2.5 mt-1">
            <Button
              size="lg"
              className="w-full h-13 rounded-2xl bg-white text-primary font-bold text-[15px] shadow-xl shadow-black/20 hover:bg-gray-50 active:scale-[0.98] transition-all"
              onClick={onGetStarted}
              data-testid="button-get-started"
            >
              Get Started — It's Free
            </Button>
            {onLogin && (
              <Button
                size="lg"
                variant="ghost"
                className="w-full h-12 rounded-2xl text-white border border-white/30 font-semibold hover:bg-white/10 active:scale-[0.98]"
                onClick={onLogin}
                data-testid="button-login"
              >
                I already have an account
              </Button>
            )}
          </motion.div>

          <motion.p variants={itemVariants} className="text-white/45 text-[11px]">
            No credit card required
          </motion.p>
        </motion.div>
      </div>

      {/* ── Features ── */}
      <div className="px-5 py-10 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <h2 className="text-xl font-bold text-gray-900">Why people choose Matchify</h2>
          <p className="text-sm text-gray-500 mt-1">Everything you need to find the one</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          {FEATURES.map(({ icon: Icon, title, text, color }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${i === FEATURES.length - 1 && FEATURES.length % 2 !== 0 ? 'col-span-2' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="font-bold text-gray-900 text-sm leading-tight">{title}</p>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{text}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Testimonials ── */}
      <div className="px-5 py-8 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <h2 className="text-xl font-bold text-gray-900">Success stories</h2>
          <p className="text-sm text-gray-500 mt-1">Over 600,000 couples found their match</p>
        </motion.div>

        <div className="space-y-3 max-w-sm mx-auto">
          {TESTIMONIALS.map(({ name, rating, quote, avatar }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="flex gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-100"
            >
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-black text-primary">{avatar}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">"{quote}"</p>
                <p className="text-xs font-bold text-primary mt-1.5">— {name}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Luna Section ── */}
      <div className="px-5 py-10 bg-gradient-to-br from-purple-50 to-violet-50">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-sm mx-auto"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">Meet Luna</h2>
                <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full uppercase tracking-wide">AI</span>
              </div>
              <p className="text-sm text-gray-500">Your relationship coach, always in your corner</p>
            </div>
          </div>

          <div className="space-y-3 mb-5">
            {LUNA_HIGHLIGHTS.map(({ emoji, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
                className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-purple-100"
              >
                <span className="text-xl">{emoji}</span>
                <p className="text-sm font-medium text-gray-700">{text}</p>
              </motion.div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-4 border border-purple-200 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">Luna says</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  "Every relationship is unique. I'm here to help you navigate yours with confidence and joy."
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Footer CTA ── */}
      <div className="px-6 py-10 text-center"
           style={{ background: "linear-gradient(160deg, hsl(346 96% 62%) 0%, hsl(338 95% 56%) 100%)" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >
          <p className="text-white font-black text-2xl font-display leading-tight">
            Ready to find<br/>your match?
          </p>
          <p className="text-white/65 text-sm">Join thousands of singles today</p>
          <Button
            size="lg"
            className="rounded-2xl bg-white text-primary font-bold px-10 shadow-xl shadow-black/20 hover:bg-gray-50 active:scale-[0.98] transition-all"
            onClick={onGetStarted}
          >
            Create Free Account
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
