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
import SubscriptionTier from "@/components/common/SubscriptionTier";
import { SUBSCRIPTION_TIER_DEFINITIONS } from "@/lib/subscriptionPlans";
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

/** Matches the “Everything in one app.” full-bleed wine band */
const WINE_FEATURES_BG = "linear-gradient(160deg, hsl(349 50% 38%) 0%, hsl(350 42% 30%) 100%)";

const HERO_NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#about", label: "About" },
] as const;

const HERO_SOCIAL_AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=face&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=face&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=96&h=96&fit=crop&crop=face&q=80",
];

const PHONE_PROFILE_SRC =
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=faces&q=80";

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[min(100%,252px)] sm:w-[min(100%,272px)] lg:mx-0 lg:justify-self-end">
      {/* Soft wine-tinted glow (reads on white hero) */}
      <div
        className="pointer-events-none absolute left-1/2 top-[42%] h-[min(320px,88%)] w-[min(360px,125%)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[100px] sm:opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(349 52% 45% / 0.22) 0%, hsl(350 45% 40% / 0.12) 50%, transparent 72%)",
        }}
      />
      <div
        className="pointer-events-none absolute left-[55%] top-[38%] h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[12%] top-[58%] h-36 w-36 rounded-full bg-primary/8 blur-3xl"
        aria-hidden
      />

      <div className="relative animate-hero-float">
        <div
          className="pointer-events-none absolute -inset-10 rounded-[4rem] opacity-40 blur-2xl sm:opacity-50"
          style={{
            background:
              "linear-gradient(165deg, hsl(349 50% 45% / 0.18) 0%, hsl(350 42% 40% / 0.12) 50%, transparent 85%)",
          }}
        />
        <div className="relative rounded-[2.5rem] bg-gradient-to-b from-zinc-700/90 via-zinc-900 to-zinc-950 p-[2.5px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.2),0_0_40px_-12px_hsl(349_52%_38%_/_0.15)] ring-1 ring-zinc-200/80 sm:rounded-[2.65rem] sm:p-[3px]">
          <div className="overflow-hidden rounded-[2.15rem] bg-zinc-950 p-1 sm:rounded-[2.5rem] sm:p-1.5">
            {/* Shorter than 9/19.5 so the hero phone doesn’t dominate vertically */}
            <div className="flex aspect-[9/16.25] flex-col overflow-hidden rounded-[1.9rem] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] sm:rounded-[2.1rem]">
              <div className="flex h-6 shrink-0 items-center justify-center bg-gradient-to-b from-zinc-50 to-white">
                <div className="h-3.5 w-14 rounded-full bg-zinc-900/[0.12] sm:w-[4.25rem]" />
              </div>
              <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-rose-50/90 via-white to-violet-50/50 px-2.5 pb-2.5 pt-0.5 sm:px-3 sm:pb-3 sm:pt-1">
                <div className="mb-2 flex items-center justify-between sm:mb-2.5">
                  <span className="text-[10px] font-bold tracking-wide text-zinc-800 sm:text-[11px]">Discover</span>
                  <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[8px] font-semibold text-primary shadow-sm ring-1 ring-zinc-100 sm:px-2 sm:text-[9px]">
                    For you
                  </span>
                </div>
                <div className="rounded-xl border border-zinc-100/80 bg-white p-2 shadow-[0_12px_40px_-12px_rgba(127,29,29,0.15)] ring-1 ring-zinc-100/60 sm:rounded-2xl sm:p-2.5">
                  <div className="relative mx-auto mb-2 aspect-square w-full max-w-[7.25rem] overflow-hidden rounded-xl bg-zinc-100 shadow-inner sm:mb-2.5 sm:max-w-[8.25rem] sm:rounded-2xl">
                    <img
                      src={PHONE_PROFILE_SRC}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover scale-110 blur-xl motion-safe:will-change-[filter] lg:scale-100 lg:blur-none"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-1.5 pb-1.5 pt-6 sm:px-2 sm:pb-2 sm:pt-8">
                      <p className="text-xs font-bold text-white drop-shadow-sm sm:text-sm">Maya, 28</p>
                      <p className="text-[9px] font-medium text-white/90 sm:text-[10px]">San Francisco · 2 km away</p>
                    </div>
                  </div>
                  <div className="mb-2 flex flex-wrap gap-1 sm:mb-2.5 sm:gap-1.5">
                    {["Values", "Events", "Coach"].map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-semibold text-rose-800/90 ring-1 ring-rose-100"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="mb-2 line-clamp-2 text-[9px] leading-snug text-zinc-600 sm:mb-2.5 sm:text-[10px]">
                    Coffee, museums, and long walks. Looking for something intentional.
                  </p>
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary py-2 text-[10px] font-bold text-primary-foreground shadow-md shadow-black/15 sm:gap-2 sm:py-2.5 sm:text-xs"
                  >
                    <Heart className="h-3.5 w-3.5 fill-white/90" strokeWidth={2} />
                    Match
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between rounded-xl border border-zinc-100 bg-white/90 px-2 py-1.5 shadow-sm sm:rounded-2xl sm:px-2.5 sm:py-2">
                  <div className="flex gap-0.5 sm:gap-1">
                    <div className="h-7 w-7 rounded-full bg-zinc-100 sm:h-8 sm:w-8" />
                    <div className="h-7 w-7 rounded-full bg-zinc-100 sm:h-8 sm:w-8" />
                    <div className="h-7 w-7 rounded-full bg-zinc-100 sm:h-8 sm:w-8" />
                  </div>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-primary shadow-md sm:h-9 sm:w-9" />
                </div>
              </div>
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
  /** Opens in-app subscriptions (e.g. logged-in users on marketing URL). */
  onViewPlans?: () => void;
}

export default function SplashScreen({ onGetStarted, onLogin, onViewPlans }: SplashScreenProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      {/* ═══ HERO — premium split + glass nav ═══ */}
      <section className="relative flex min-h-[min(100dvh,960px)] flex-col overflow-hidden bg-white text-primary">
        <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-5 py-1 sm:px-8 sm:py-1 lg:px-12 xl:px-16">
            <a
              href="#"
              className="flex shrink-0 items-center transition-opacity hover:opacity-90"
              aria-label="Matchify home"
            >
              <BrandLogo
                className="h-[3.5rem] w-auto max-w-[13rem] object-contain sm:h-16 sm:max-w-[15rem] md:h-[4.5rem] md:max-w-[17.5rem] lg:h-[5rem] lg:max-w-[19rem]"
                alt="Matchify"
              />
            </a>
            <nav
              className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex"
              aria-label="Page sections"
            >
              {HERO_NAV_LINKS.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="text-sm font-semibold text-primary/85 transition-colors hover:text-primary"
                >
                  {label}
                </a>
              ))}
            </nav>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {onLogin && (
                <button
                  type="button"
                  onClick={onLogin}
                  className="hidden h-9 items-center rounded-full border-2 border-primary px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 sm:inline-flex sm:px-4 sm:text-sm"
                  data-testid="button-login-nav"
                >
                  Log in
                </button>
              )}
              <button
                type="button"
                onClick={() => onGetStarted?.()}
                className="h-9 rounded-full bg-primary px-3 text-xs font-bold text-primary-foreground shadow-md shadow-primary/25 transition-colors hover:bg-primary/90 sm:px-4 sm:text-sm"
                data-testid="button-get-started-nav"
              >
                Get Started
              </button>
            </div>
          </div>
          <nav
            className="flex flex-wrap justify-center gap-x-3 gap-y-1 border-t border-zinc-100 bg-zinc-50/80 px-4 py-1.5 sm:px-8 lg:hidden"
            aria-label="Page sections"
          >
            {HERO_NAV_LINKS.map(({ href, label }) => (
              <a key={href} href={href} className="text-xs font-semibold text-primary/80 hover:text-primary">
                {label}
              </a>
            ))}
            {onLogin && (
              <button type="button" onClick={onLogin} className="text-xs font-semibold text-primary/80 hover:text-primary">
                Log in
              </button>
            )}
          </nav>
        </header>

        <div className="relative mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col justify-center px-6 pb-16 pt-10 sm:px-10 sm:pb-20 sm:pt-12 md:px-12 lg:px-14 lg:pb-24 lg:pt-6 xl:px-20">
          <div className="grid flex-1 grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="order-2 text-center lg:order-1 lg:text-left"
            >
              <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary/75 sm:text-xs">
                The relationship app
              </p>
              <h1 className="font-display text-[2.35rem] font-bold leading-[1.02] tracking-tight text-primary sm:text-5xl md:text-[3.25rem] lg:text-[3.5rem] xl:text-6xl">
                Where serious people
                <br />
                meet.
              </h1>
              <p className="mx-auto mt-6 max-w-md text-base font-light leading-snug text-primary/80 sm:text-lg lg:mx-0">
                <span className="block">
                  One app for matches, chat, events, and coaching — with{" "}
                  <span className="font-semibold text-primary">AI</span> matchmaking and smart support —
                </span>
                <span className="mt-1 block">built for relationships that last.</span>
              </p>

              <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                <button
                  type="button"
                  onClick={() => onGetStarted?.()}
                  className="inline-flex min-h-[3.25rem] items-center justify-center rounded-full bg-primary px-9 py-3.5 text-base font-bold text-primary-foreground shadow-xl shadow-primary/30 transition-colors hover:bg-primary/90 active:scale-[0.98]"
                  data-testid="button-get-started"
                >
                  Get started — free
                </button>
                {onLogin && (
                  <button
                    type="button"
                    onClick={onLogin}
                    className="inline-flex min-h-[3.25rem] items-center justify-center rounded-full border-2 border-primary px-9 text-base font-semibold text-primary transition-colors hover:bg-primary/10"
                    data-testid="button-login"
                  >
                    Log in
                  </button>
                )}
              </div>

              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start lg:gap-4">
                <div className="flex -space-x-2.5 rtl:space-x-reverse">
                  {HERO_SOCIAL_AVATARS.map((src, i) => (
                    <img
                      key={src}
                      src={src}
                      alt=""
                      width={40}
                      height={40}
                      loading="lazy"
                      decoding="async"
                      className="h-10 w-10 rounded-full border-2 border-white object-cover ring-2 ring-primary/20 shadow-sm"
                      style={{ zIndex: HERO_SOCIAL_AVATARS.length - i }}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-primary/85 sm:justify-start">
                  <span className="font-semibold tabular-nums text-primary">4.8</span>
                  <span className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-500" />
                    ))}
                  </span>
                  <span className="text-primary/50">·</span>
                  <span className="font-light text-primary/80">Trusted by 50,000+ couples</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="order-1 flex justify-center lg:order-2 lg:justify-end lg:pl-4"
            >
              <PhoneMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ STATS STRIP — full-width bar like Muzz trust row ═══ */}
      <section id="stats" className="scroll-mt-28 border-y border-zinc-100 bg-zinc-50/80">
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

      {/* ═══ PRICING — same tier cards as in-app subscriptions ═══ */}
      <section id="pricing" className="scroll-mt-28 border-y border-zinc-100 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mb-10 max-w-2xl text-center sm:mb-12"
          >
            <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Simple pricing
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base">
              Honest limits for Luna and AI Matchmaker — upgrade when you are ready. Full checkout after you create an
              account.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {SUBSCRIPTION_TIER_DEFINITIONS.map((tier) => (
              <SubscriptionTier
                key={tier.id}
                id={tier.id}
                name={tier.name}
                description={tier.description}
                price={tier.price}
                period={tier.period}
                features={tier.features}
                popular={tier.popular}
                variant="marketing"
                marketingButtonLabel="Get started"
                onMarketingAction={() => onGetStarted?.()}
                data-testid={`landing-tier-${tier.id}`}
              />
            ))}
          </div>
          {onViewPlans ? (
            <p className="mt-8 text-center text-sm text-zinc-600">
              <button
                type="button"
                onClick={onViewPlans}
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Already have an account? View plans in the app
              </button>
            </p>
          ) : null}
        </div>
      </section>

      {/* ═══ WHY — three bold rows, lots of whitespace ═══ */}
      <section id="about" className="scroll-mt-28 mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
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
      <section id="how-it-works" className="scroll-mt-28 border-y border-zinc-100 bg-zinc-50 py-16 sm:py-20">
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
        id="features"
        className="relative scroll-mt-28 overflow-hidden py-16 text-white sm:py-20"
        style={{ background: WINE_FEATURES_BG }}
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
              className="h-14 w-auto max-w-[min(85vw,15rem)] object-contain sm:h-16 sm:max-w-[18rem] md:h-[4.25rem] md:max-w-[22rem]"
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
