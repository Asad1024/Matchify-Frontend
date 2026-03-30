import { MarriageIntentionStrip } from "@/components/muzz/MarriageIntentionStrip";
import { normalizeCommitmentKey } from "@/lib/marriageIntentionUi";
import type { MarriageIntentProfileInput } from "@/lib/marriageIntentionUi";

export type IntentBarUser = MarriageIntentProfileInput & {
  name: string;
};

/** Maps API values (e.g. hookup) to strip step keys for forms / filters. */
export function normalizeCommitmentIntention(raw: string | null | undefined): string {
  return normalizeCommitmentKey(raw);
}

type ProfileMarriageIntentBarProps = {
  user: IntentBarUser;
  variant?: "self" | "other";
  className?: string;
};

/** Profile preview / Marriage deck: strip reflects commitment, timeline, approach, and family intent. */
export function ProfileMarriageIntentBar({
  user,
  variant = "other",
  className = "",
}: ProfileMarriageIntentBarProps) {
  const first = user.name.split(/\s+/)[0] || "Member";
  const caption =
    variant === "self" ? "Your marriage intention" : `${first}'s marriage intention`;

  return (
    <MarriageIntentionStrip
      caption={caption}
      className={className}
      narration={variant === "self" ? "first" : "third"}
      commitmentIntention={user.commitmentIntention}
      marriageTimeline={user.marriageTimeline}
      marriageApproach={user.marriageApproach}
      wantsChildren={user.wantsChildren}
    />
  );
}
