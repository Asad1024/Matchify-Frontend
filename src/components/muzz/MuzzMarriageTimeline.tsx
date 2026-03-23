import { Heart } from "lucide-react";

type Props = {
  firstName: string;
  commitmentIntention?: string | null;
  marriageTimeline?: string | null;
};

/**
 * Muzz-style horizontal “marriage intentions” strip: Match → path → time hint.
 */
export function MuzzMarriageTimeline({ firstName, commitmentIntention, marriageTimeline }: Props) {
  const goal =
    commitmentIntention === "marriage"
      ? "Marriage"
      : commitmentIntention === "serious"
        ? "Serious"
        : commitmentIntention === "casual"
          ? "Dating"
          : "Chatting";
  const when =
    marriageTimeline?.replace(/_/g, " ") ||
    (commitmentIntention === "marriage" ? "1–2 years" : "Agree together");

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
        {firstName}&apos;s marriage intentions
      </p>
      <div className="relative pt-8 pb-6">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-gray-200 rounded-full" />
        <div className="relative flex justify-between items-center">
          <div className="flex flex-col items-center gap-1 z-10">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md border-4 border-white">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-[10px] font-bold text-primary">Match!</span>
          </div>
          <div className="flex flex-col items-center gap-1 z-10 -mt-6">
            <span className="text-[10px] font-bold bg-gray-900 text-white px-2.5 py-1 rounded-full">
              Chatting
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 z-10 -mt-6">
            <span className="text-[10px] font-bold bg-gray-900 text-white px-2.5 py-1 rounded-full">
              {goal}
            </span>
          </div>
        </div>
        <div className="flex justify-between mt-2 px-2">
          <span className="text-[10px] text-gray-400" />
          <span className="text-[10px] text-gray-500 font-medium">{when}</span>
          <span className="text-[10px] text-gray-400" />
        </div>
      </div>
    </div>
  );
}
