/**
 * Actor-style portrait URLs for Flow A, Flow B, and match displays.
 * Hollywood / professional headshot look (Unsplash).
 */
const BASE = "https://images.unsplash.com";
const CROP = "w=400&h=600&fit=crop";

export const ACTOR_IMAGES = [
  // Original set
  `${BASE}/photo-1507003211169-0a1dd7228f2d?${CROP}`,
  `${BASE}/photo-1506794778202-cad84cf45f1d?${CROP}`,
  `${BASE}/photo-1494790108377-be9c29b29330?${CROP}`,
  `${BASE}/photo-1438761681033-6461ffad8d80?${CROP}`,
  `${BASE}/photo-1472099645785-5658abf4ff4e?${CROP}`,
  `${BASE}/photo-1534528741775-53994a69daeb?${CROP}`,
  `${BASE}/photo-1517841905240-472988babdf9?${CROP}`,
  `${BASE}/photo-1531123897727-8f129e1688ce?${CROP}`,
  `${BASE}/photo-1529626455594-4ff0802cfb7e?${CROP}`,
  `${BASE}/photo-1524504388940-b1c4dcf3cfc9?${CROP}`,
  `${BASE}/photo-1544005313-94ddf0286df2?${CROP}`,
  `${BASE}/photo-1500648767791-00dcc994a43e?${CROP}`,
  `${BASE}/photo-1552058544-f2b08422138a?${CROP}`,
  `${BASE}/photo-1560250097-0b93528c311a?${CROP}`,
  `${BASE}/photo-1573496359142-b8d87734a5a2?${CROP}`,
  `${BASE}/photo-1580489944761-15a19d654956?${CROP}`,
  `${BASE}/photo-1619895862022-09114b41f16f?${CROP}`,
  `${BASE}/photo-1594744803329-e58b31de8bf5?${CROP}`,
  `${BASE}/photo-1566492031773-4f4e44671857?${CROP}`,
  `${BASE}/photo-1573497019940-1c056c652b0f?${CROP}`,
  // Additional Hollywood-style professional portraits (unique IDs)
  `${BASE}/photo-1502685104226-ee32379fefbe?${CROP}`,
  `${BASE}/photo-1519085360753-af0119f7cbe7?${CROP}`,
  `${BASE}/photo-1531746020798-e6953c6e8e04?${CROP}`,
  `${BASE}/photo-1545167622-3a6ac756afa4?${CROP}`,
  `${BASE}/photo-1528892952291-009c663ce843?${CROP}`,
  `${BASE}/photo-1539571696357-5a69c17a67c6?${CROP}`,
  `${BASE}/photo-1534030349089-d33a43386801?${CROP}`,
  `${BASE}/photo-1519345182560-3f2917c472ef?${CROP}`,
  `${BASE}/photo-1502823403499-6ccfcf4fb453?${CROP}`,
  `${BASE}/photo-1508214751196-bcfd4ca60f91?${CROP}`,
  `${BASE}/photo-1519699047748-de8e457a634e?${CROP}`,
  `${BASE}/photo-1521577352947-9bb58764b69a?${CROP}`,
  `${BASE}/photo-1531427186611-ecfd6d936c79?${CROP}`,
  `${BASE}/photo-1504257432389-52343af06ae3?${CROP}`,
  `${BASE}/photo-1492562080023-ab3db95bfbce?${CROP}`,
  `${BASE}/photo-1526045478516-99145907023c?${CROP}`,
  `${BASE}/photo-1504703395950-b89145a5425b?${CROP}`,
  `${BASE}/photo-1509967419530-da38b4704bc6?${CROP}`,
  `${BASE}/photo-1522071820081-009f0129c71c?${CROP}`,
  `${BASE}/photo-1552374196-c4e7ffc6e126?${CROP}`,
  `${BASE}/photo-1551836022-d5d88e9218df?${CROP}`,
  `${BASE}/photo-1573497620053-eef530dfe32d?${CROP}`,
  `${BASE}/photo-1516726817505-f5ed825624d8?${CROP}`,
  `${BASE}/photo-1522529599102-193c0d76b5b6?${CROP}`,
  `${BASE}/photo-1506863530036-1efeddceb993?${CROP}`,
  `${BASE}/photo-1551836022-deb6028ef06e?${CROP}`,
  `${BASE}/photo-1517466787929-bc90951d0974?${CROP}`,
  `${BASE}/photo-1507591064344-4c612ce6e5b0?${CROP}`,
  `${BASE}/photo-1526510747491-58f928ec870f?${CROP}`,
  `${BASE}/photo-1530267988836-3ba0348f53d5?${CROP}`,
  `${BASE}/photo-1558618666-fcd25c85cd64?${CROP}`,
  `${BASE}/photo-1552374196-cc88e0cd9b8b?${CROP}`,
  `${BASE}/photo-1526413232644-8a81f10a6595?${CROP}`,
  `${BASE}/photo-1515886657613-9f3515b0c78f?${CROP}`,
];

export function getActorImage(index: number): string {
  return ACTOR_IMAGES[Math.abs(index) % ACTOR_IMAGES.length];
}
