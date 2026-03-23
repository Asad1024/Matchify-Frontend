import { Rocket } from "lucide-react";
import { getBoosts } from "@/lib/muzzEconomy";

/** Header pill: boost count (Muzz-style). */
export function MuzzEconomyPill({ onClick }: { onClick?: () => void }) {
  const n = getBoosts();
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-full bg-teal-600/90 px-2.5 py-1 text-white text-xs font-bold shadow-sm active:scale-[0.98] transition-transform"
    >
      <span>{n}</span>
      <Rocket className="w-3.5 h-3.5" />
    </button>
  );
}
