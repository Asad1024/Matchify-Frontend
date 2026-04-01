import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Shield,
  Sparkles,
  Star,
  ArrowRight,
  MessageCircle,
  Brain,
  Compass,
  Calendar,
  GraduationCap,
  Eye,
  Target,
  Home,
  Globe,
  Handshake,
  Check,
} from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const STATS = [
  { value: "15M+", label: "Members worldwide" },
  { value: "600K+", label: "Success stories" },
  { value: "4.8", label: "Average rating", star: true },
];

const WHY_ROWS = [
  {
    icon: Shield,
    title: "Safe & respectful",
    line: "Verification-friendly profiles, privacy controls, and community standards built in.",
  },
  {
    icon: Heart,
    title: "Serious intentions",
    line: "For people who want depth — every background, one respectful place to meet.",
  },
  {
    icon: Sparkles,
    title: "Smarter matching",
    line: "AI Matchmaker plus Luna coach — not just photos and a bio.",
  },
];

const STEPS = [
  { n: "01", title: "Create your profile", desc: "Share values, lifestyle, and what you’re looking for." },
  { n: "02", title: "Discover & connect", desc: "Explore, get matched, chat, and join groups when you’re ready." },
  { n: "03", title: "Meet IRL & grow", desc: "RSVP to events, book coaches, and use Luna for the long run." },
];

const FEATURE_TILES = [
  { icon: Compass, label: "Explore & directory", sub: "Filters, boosts, compatibility hints" },
  { icon: Target, label: "AI Matchmaker", sub: "Blueprint from a guided questionnaire" },
  { icon: MessageCircle, label: "Chat & icebreakers", sub: "Threads that start from profiles" },
  { icon: Home, label: "Feed & stories", sub: "Posts and circles around your journey" },
  { icon: Globe, label: "Community & groups", sub: "Interest spaces beyond one-to-one" },
  { icon: Calendar, label: "Events & RSVP", sub: "Grid, calendar, swipe — then show up" },
  { icon: Brain, label: "Luna AI coach", sub: "Tips, journey, optional partner sharing" },
  { icon: Eye, label: "Empathy Observer", sub: "Practice perspective-taking" },
  { icon: Handshake, label: "Human coaches", sub: "Book real sessions in-app" },
  { icon: GraduationCap, label: "Courses", sub: "Structured relationship skills" },
];

const LUNA_POINTS = [
  "Conversation & conflict tips tuned to you",
  "Date ideas and a Journey tab with milestones",
  "Optional sharing with a partner in your Luna space",
  "Not a substitute for crisis care — safety-aware by design",
];

const TESTIMONIALS = [
  {
    name: "Sara M.",
    quote: "Intentional matching and events — I wasn’t stuck in endless swipe fatigue.",
    avatar: "SM",
  },
  {
    name: "James T.",
    quote: "Luna and the courses changed how we argue. Didn’t expect that from a dating app.",
    avatar: "JT",
  },
  {
    name: "Priya N.",
    quote: "Finally a place that respects that I want something serious.",
    avatar: "PN",
  },
];

const FAQ_ITEMS = [
  {
    q: "Is Matchify only for one religion or culture?",
    a: "No. Matchify is built for anyone who wants a serious, respectful connection. You can share as much or as little about your background as you like.",
  },
  {
    q: "What’s included beyond swiping?",
    a: "Home feed and stories, community groups, events with RSVP (and optional match questionnaires), chat, AI Matchmaker, Luna relationship coaching, Empathy Observer, human coaches, and courses — plus subscriptions when you want more.",
  },
  {
    q: "How does Luna work?",
    a: "Luna offers tips, exercises, and chat-style coaching. You can track milestones and recaps, and optionally involve a partner in a shared space. It’s supportive guidance, not therapy or emergency help.",
  },
  {
    q: "Are events moderated?",
    a: "Community-created events can be reviewed before they go live. Admins also have tools for approvals and safety.",
  },
];

function PhoneMockup() {
  return (
    <div className="relative w-[min(100%,280px)] mx-auto md:mx-0">
      <div
        className="absolute -inset-4 rounded-[3rem] opacity-40 blur-2xl pointer-events-none"
        style={{ background: "linear-gradient(145deg, #fff 0%, rgba(255,255,255,0.2) 100%)" }}
      />
      <div className="relative rounded-[2.5rem] bg-zinc-900 p-2 shadow-xl ring-1 ring-black/40">
        <div className="rounded-[2rem] overflow-hidden bg-white aspect-[9/19] flex flex-col">
          <div className="h-7 bg-white flex items-center justify-center shrink-0">
            <div className="w-16 h-4 rounded-full bg-zinc-900/10" />
          </div>
          <div className="flex-1 bg-gradient-to-b from-primary/12 via-white to-red-50/60 p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <BrandLogo className="w-9 h-9 rounded-xl object-contain bg-white p-0.5" alt="" />
              <div className="flex-1 space-y-1">
                <div className="h-2.5 bg-zinc-200 rounded-full w-3/4" />
                <div className="h-2 bg-zinc-100 rounded-full w-1/2" />
              </div>
            </div>
            <div className="rounded-2xl bg-white shadow-sm border border-zinc-100 p-3 space-y-2 mt-1">
              <div className="flex gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 shrink-0" />
                <div className="flex-1 space-y-1.5 pt-0.5">
                  <div className="h-2 bg-zinc-200 rounded-full w-full" />
                  <div className="h-2 bg-zinc-100 rounded-full w-4/5" />
                </div>
              </div>
              <div className="h-16 rounded-xl bg-gradient-to-br from-primary/30 to-violet-200/40" />
            </div>
            <div className="rounded-2xl bg-white/90 border border-zinc-100 p-2.5 flex gap-2 mt-auto">
              <div className="flex-1 h-9 rounded-full bg-zinc-100" />
              <div className="w-9 h-9 rounded-full bg-primary shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SplashScreenProps {
  onGetStarted?: () => void;
  onLogin?: () => void;
}

export default function SplashScreen({ onGetStarted, onLogin }: SplashScreenProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      {/* ═══ HERO — Muzz-style split: headline left, phone right ═══ */}
      <section
        className="relative text-white overflow-hidden"
        style={{ background: "linear-gradient(165deg, hsl(349 52% 36%) 0%, hsl(350 48% 28%) 45%, hsl(280 35% 32%) 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[min(100%,600px)] h-[min(100%,600px)] rounded-full bg-white/[0.07] blur-3xl -translate-y-1/4 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-black/10 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-8 pb-14 md:pt-10 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex justify-center md:justify-start mb-8 md:mb-10"
          >
            {/* White pill so the logo always pops on the gradient hero */}
            <div className="inline-flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg">
              <BrandLogo
                className="h-9 sm:h-11 w-auto max-w-[9rem] sm:max-w-[11rem] object-contain"
                alt="Matchify"
              />
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 md:gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center md:text-left order-2 md:order-1"
            >
              <p className="text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-4">
                The relationship app
              </p>
              <h1 className="font-display font-bold text-[2.125rem] sm:text-4xl md:text-[2.75rem] lg:text-5xl leading-[1.08] tracking-tight">
                Where serious
                <br />
                people meet.
              </h1>
              <p className="mt-4 text-sm sm:text-base text-white/85 leading-relaxed max-w-md mx-auto md:mx-0">
                Matchify brings together matching, chat, community, events, and coaching — so you can go from hello to
                something real.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Button
                  size="lg"
                  className="h-12 sm:h-14 rounded-2xl bg-white text-primary hover:bg-white/95 font-bold text-[15px] px-8 shadow-lg shadow-black/20"
                  onClick={onGetStarted}
                  data-testid="button-get-started"
                >
                  Get started — free
                </Button>
                {onLogin && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 sm:h-14 rounded-2xl border-2 border-white/40 bg-transparent text-white hover:bg-white/10 font-semibold"
                    onClick={onLogin}
                    data-testid="button-login"
                  >
                    Log in
                  </Button>
                )}
              </div>

              <div className="mt-6 flex items-center justify-center md:justify-start gap-2 text-white/80 text-sm">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-300 text-amber-300" />
                  ))}
                </div>
                <span className="font-semibold text-white">4.8</span>
                <span className="text-white/60">· Loved for intentional dating</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="order-1 md:order-2 flex justify-center md:justify-end"
            >
              <PhoneMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ STATS STRIP — full-width bar like Muzz trust row ═══ */}
      <section className="border-y border-zinc-100 bg-zinc-50/80">
        <div className="max-w-6xl mx-auto px-5 py-8 sm:py-10">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 divide-x divide-zinc-200/80">
            {STATS.map(({ value, label, star }) => (
              <div key={label} className="text-center px-2 first:pl-0 last:pr-0">
                <div className="flex items-center justify-center gap-1">
                  {star && <Star className="w-5 h-5 fill-amber-400 text-amber-400 hidden sm:block" />}
                  <p className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-zinc-900 tracking-tight">
                    {value}
                  </p>
                </div>
                <p className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wide mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHY — three bold rows, lots of whitespace ═══ */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-14 sm:mb-16"
        >
          <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-[2.5rem] text-zinc-900 tracking-tight leading-tight">
            Built for something real.
          </h2>
          <p className="mt-3 text-zinc-500 text-sm sm:text-base">Not another endless swipe — a full journey in one app.</p>
        </motion.div>

        <div className="space-y-0 divide-y divide-zinc-100 border-y border-zinc-100">
          {WHY_ROWS.map(({ icon: Icon, title, line }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.05 }}
              className="grid sm:grid-cols-[auto_1fr] gap-6 sm:gap-10 py-10 sm:py-12 items-start"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                <Icon className="w-7 h-7 text-primary" strokeWidth={2} />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="font-display font-bold text-xl sm:text-2xl text-zinc-900 tracking-tight">{title}</h3>
                <p className="mt-2 text-sm sm:text-base text-zinc-600 leading-relaxed max-w-xl sm:max-w-none mx-auto sm:mx-0">
                  {line}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS — numbered steps (Muzz rhythm) ═══ */}
      <section className="bg-zinc-50 border-y border-zinc-100 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-zinc-900 text-center tracking-tight mb-12 sm:mb-14">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 md:gap-6">
            {STEPS.map(({ n, title, desc }, i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative bg-white rounded-3xl p-8 shadow-sm border border-zinc-100 text-center md:text-left"
              >
                <span className="font-display font-bold text-5xl text-primary/20 leading-none">{n}</span>
                <h3 className="font-display font-bold text-lg sm:text-xl text-zinc-900 mt-4 tracking-tight">{title}</h3>
                <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ALL FEATURES — full-bleed wine band ═══ */}
      <section
        className="py-16 sm:py-20 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, hsl(349 50% 38%) 0%, hsl(350 42% 30%) 100%)" }}
      >
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[radial-gradient(circle_at_30%_20%,white_1px,transparent_1px)] bg-[length:24px_24px]" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-2xl mb-10 sm:mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-[2.5rem] leading-tight tracking-tight">
              Everything in one app.
            </h2>
            <p className="mt-3 text-white/80 text-sm sm:text-base leading-relaxed">
              From first like to first date — and the conversations that keep you growing together.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {FEATURE_TILES.map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="flex gap-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-4 sm:py-5"
              >
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm sm:text-base leading-snug">{label}</p>
                  <p className="text-xs sm:text-sm text-white/75 mt-1 leading-relaxed">{sub}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-white/70">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-white" /> Notifications & privacy settings
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-white" /> Subscription tiers when you want more
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-white" /> Admin tools for approvals & safety
            </span>
          </div>
        </div>
      </section>

      {/* ═══ LUNA — card block ═══ */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-[2rem] overflow-hidden shadow-xl border border-violet-100 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white p-8 sm:p-10 md:p-12"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-lg">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-8 h-8 opacity-90" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/70">AI coach</span>
              </div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl tracking-tight leading-tight">
                Meet Luna.
              </h2>
              <p className="mt-3 text-white/85 text-sm sm:text-base leading-relaxed">
                Your in-app relationship coach — exercises, chat-style guidance, milestones, and date ideas. Optional
                partner space when you both use Matchify.
              </p>
            </div>
            <ul className="space-y-3 md:min-w-[280px]">
              {LUNA_POINTS.map((pt) => (
                <li key={pt} className="flex gap-3 text-sm text-white/90">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </span>
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </section>

      {/* ═══ STORIES ═══ */}
      <section className="bg-zinc-50 border-t border-zinc-100 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-zinc-900 text-center tracking-tight mb-3">
            Real stories
          </h2>
          <p className="text-center text-zinc-500 text-sm mb-12">From members who wanted more than a casual chat</p>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, quote, avatar }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-100 shadow-sm"
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-zinc-800 text-sm sm:text-base leading-relaxed font-medium">&ldquo;{quote}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary text-xs">
                    {avatar}
                  </div>
                  <span className="font-bold text-zinc-900 text-sm">{name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ — Muzz-style accordion ═══ */}
      <section className="max-w-2xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-zinc-900 text-center tracking-tight mb-2">
          Questions
        </h2>
        <p className="text-center text-zinc-500 text-sm mb-8">Quick answers before you join</p>
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map(({ q, a }, i) => (
            <AccordionItem key={q} value={`item-${i}`} className="border-zinc-200">
              <AccordionTrigger className="text-left font-bold text-zinc-900 text-sm sm:text-base hover:no-underline py-5">
                {q}
              </AccordionTrigger>
              <AccordionContent className="text-zinc-600 text-sm leading-relaxed pb-5">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ═══ FOOTER CTA ═══ */}
      <section
        className="mt-auto py-16 sm:py-20 px-5 text-center"
        style={{ background: "linear-gradient(165deg, hsl(349 52% 36%) 0%, hsl(350 45% 30%) 100%)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-lg mx-auto space-y-4"
        >
          <div className="inline-flex items-center bg-white/95 rounded-2xl px-5 py-2.5 shadow-md mx-auto">
            <BrandLogo
              className="h-10 sm:h-12 w-auto max-w-[10rem] object-contain"
              alt="Matchify"
            />
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight leading-tight">
            Start free today.
          </h2>
          <p className="text-white/75 text-sm sm:text-base">No credit card to create your account.</p>
          <Button
            size="lg"
            className="h-14 rounded-2xl bg-white text-primary font-bold text-base px-10 shadow-xl hover:bg-zinc-50"
            onClick={onGetStarted}
          >
            Create free account
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          {onLogin && (
            <button
              type="button"
              onClick={onLogin}
              className="block w-full text-center text-white/80 text-sm font-semibold underline-offset-4 hover:underline mt-2"
            >
              Already on Matchify? Log in
            </button>
          )}
        </motion.div>
      </section>
    </div>
  );
}
