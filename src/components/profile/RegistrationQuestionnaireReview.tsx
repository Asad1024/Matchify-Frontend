import { Button } from "@/components/ui/button";
import { ProfilePreviewCard } from "@/components/profile/ProfilePreviewCard";
import { Sparkles } from "lucide-react";
import { blueprintToSections, hasBlueprintContent } from "@/lib/attractionBlueprintDisplay";

type Props = {
  attractionBlueprint: unknown;
  onStartOrUpdateQuestionnaire: () => void;
  hasSavedBlueprint: boolean;
};

/**
 * Read-only summary of registration / AI Matchmaker answers, grouped by questionnaire headings.
 */
export function RegistrationQuestionnaireReview({
  attractionBlueprint,
  onStartOrUpdateQuestionnaire,
  hasSavedBlueprint,
}: Props) {
  const sections = blueprintToSections(attractionBlueprint);
  const hasContent = hasBlueprintContent(attractionBlueprint);

  return (
    <ProfilePreviewCard
      icon={Sparkles}
      title="Questionnaires"
      description="Answers from your AI Matchmaker registration — shown by section."
    >
      {!hasContent ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            You haven&apos;t completed the matchmaker questionnaire yet. When you do, your answers will appear
            here by topic.
          </p>
          <Button
            className="h-11 w-full rounded-2xl bg-primary font-bold text-primary-foreground"
            onClick={onStartOrUpdateQuestionnaire}
          >
            <Sparkles className="mr-2 h-4 w-4" /> Start AI Matchmaker
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((sec) => (
            <div key={sec.key} className="rounded-2xl border border-stone-100 bg-stone-50/80 px-3.5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary/90">{sec.title}</p>
              <ul className="mt-2 space-y-1.5 text-sm font-semibold text-foreground">
                {sec.lines.map((line, i) => (
                  <li key={i} className="leading-snug">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <Button
            variant="outline"
            className="h-11 w-full rounded-2xl border-2 border-primary/25 font-bold text-primary"
            onClick={onStartOrUpdateQuestionnaire}
          >
            <Sparkles className="mr-2 h-4 w-4" /> {hasSavedBlueprint ? "Update questionnaire" : "Continue questionnaire"}
          </Button>
        </div>
      )}
    </ProfilePreviewCard>
  );
}
