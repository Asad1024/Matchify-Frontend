import { Heart, MessageCircle, Gem } from "lucide-react";

type Props = {
  firstName: string;
  commitmentIntention?: string | null;
  marriageTimeline?: string | null;
};

/**
 * Muzz-style marriage intentions: black rail, pink Match!, dark pills (Chatting + goal), timing labels.
 */
export function MuzzMarriageTimeline({ firstName, commitmentIntention, marriageTimeline }: Props) {
  const goalLabel =
    commitmentIntention === "marriage"
      ? "Marriage"
      : commitmentIntention === "serious"
        ? "Serious"
        : commitmentIntention === "casual"
          ? "Dating"
          : "Chatting";
  const labelLeft = marriageTimeline?.replace(/_/g, " ") || (commitmentIntention === "marriage" ? "1–2 years" : "When it feels right");
  const labelRight = commitmentIntention === "marriage" ? "Agree together" : "Agree together";

  return (
    <div className="rounded-2xl bg-stone-100/90 border border-stone-200/80 p-4 sm:p-5 shadow-sm">
      <p className="text-[13px] font-bold text-stone-700 mb-4">
        {firstName}&apos;s marriage intentions
      </p>

      <div className="relative pt-2 pb-2 min-h-[100px]">
        {/* Black timeline rail */}
        <div
          className="absolute left-[8%] right-[8%] top-[46px] h-[3px] bg-zinc-900 rounded-full z-0"
          aria-hidden
        />

        <div className="relative flex justify-between items-start px-[2%] z-10">
          {/* Match! */}
          <div className="flex flex-col items-center gap-1 w-[28%]">
            <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-md border-[3px] border-white ring-1 ring-primary/20">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-[11px] font-bold text-primary">Match!</span>
          </div>

          {/* Chatting pill */}
          <div className="flex flex-col items-center gap-2 w-[34%] -mt-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white text-[10px] font-bold px-2.5 py-1.5 shadow-sm">
              <MessageCircle className="w-3 h-3 shrink-0" strokeWidth={2.5} />
              Chatting
            </span>
            <span className="text-[10px] font-semibold text-stone-600 text-center leading-tight px-1">{labelLeft}</span>
          </div>

          {/* Marriage / goal pill */}
          <div className="flex flex-col items-center gap-2 w-[28%] -mt-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white text-[10px] font-bold px-2.5 py-1.5 shadow-sm">
              <Gem className="w-3 h-3 shrink-0" strokeWidth={2.5} />
              {goalLabel}
            </span>
            <span className="text-[10px] font-semibold text-stone-600 text-center leading-tight px-1">{labelRight}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
