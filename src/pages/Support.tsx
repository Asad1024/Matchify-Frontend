import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { SupportChatbot } from "@/components/support/SupportChatbot";
import { Mail, ChevronLeft, Bug, ShieldCheck, ExternalLink } from "lucide-react";

export default function Support() {
  const [, setLocation] = useLocation();

  const supportEmail = "support@matchify.app";
  const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent("Matchify support")}`;

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-28">
      <Header
        showSearch={false}
        title="Help & support"
        subtitle="Quick answers + contact support"
        onBack={() => setLocation("/menu")}
      />

      <div className="mx-auto w-full max-w-lg px-3 pt-2">
        <div className="matchify-surface p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-foreground">Support center</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                Use chat for quick FAQs, or email us for account issues and bug reports.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            <a
              href={mailto}
              className="group flex items-center justify-between rounded-[18px] border border-border/70 bg-card/60 px-4 py-3 text-left shadow-2xs transition hover:bg-card"
            >
              <span className="inline-flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-muted/60 text-muted-foreground">
                  <Mail className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold text-foreground">Email support</span>
                  <span className="block text-[12px] text-muted-foreground">{supportEmail}</span>
                </span>
              </span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} aria-hidden />
            </a>

            <Button
              variant="outline"
              className="h-11 justify-start rounded-[18px] border-border/70 bg-card/60 px-4 text-foreground shadow-2xs hover:bg-card"
              onClick={() => setLocation("/settings")}
            >
              <ChevronLeft className="mr-2 h-4 w-4 rotate-180" strokeWidth={1.75} aria-hidden />
              Go to Settings
            </Button>

            <Button
              variant="outline"
              className="h-11 justify-start rounded-[18px] border-border/70 bg-card/60 px-4 text-foreground shadow-2xs hover:bg-card"
              onClick={() => {
                const url = `${window.location.origin}${window.location.pathname}`;
                window.open(
                  `mailto:${supportEmail}?subject=${encodeURIComponent("Bug report")}&body=${encodeURIComponent(
                    `What happened?\n\nWhat did you expect?\n\nPage:\n${url}\n\n`,
                  )}`,
                  "_self",
                );
              }}
            >
              <Bug className="mr-2 h-4 w-4" strokeWidth={1.75} aria-hidden />
              Report a bug
            </Button>
          </div>
        </div>
      </div>

      <SupportChatbot />
      <BottomNav active="menu" onNavigate={() => {}} />
    </div>
  );
}

