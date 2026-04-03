import { MarriageIntentionStrip } from "@/components/muzz/MarriageIntentionStrip";
import type { MarriageIntentProfileInput } from "@/lib/marriageIntentionUi";

type Props = MarriageIntentProfileInput & {
  firstName: string;
};

/** Marriage intentions for discovery / view profile — copy from commitment, timeline, approach, and kids intent. */
export function MuzzMarriageTimeline({
  firstName,
  commitmentIntention,
  marriageTimeline,
  marriageApproach,
  wantsChildren,
}: Props) {
  const caption = `${firstName}'s marriage intention`;
  return (
    <MarriageIntentionStrip
      caption={caption}
      variant="default"
      commitmentIntention={commitmentIntention}
      marriageTimeline={marriageTimeline}
      marriageApproach={marriageApproach}
      wantsChildren={wantsChildren}
    />
  );
}
