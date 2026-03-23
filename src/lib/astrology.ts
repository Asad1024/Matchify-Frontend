export const ZODIAC_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
] as const;

export const COMPATIBILITY_MATRIX: Record<string, Record<string, number>> = {
  capricorn: { virgo: 95, taurus: 90, scorpio: 85, pisces: 80, cancer: 75, capricorn: 70, libra: 65, gemini: 60, leo: 55, aries: 50, sagittarius: 45, aquarius: 40 },
  virgo: { capricorn: 95, taurus: 90, cancer: 85, scorpio: 80, pisces: 75, virgo: 70, libra: 65, gemini: 60, leo: 55, aries: 50, sagittarius: 45, aquarius: 40 },
  taurus: { virgo: 95, capricorn: 90, cancer: 85, pisces: 80, scorpio: 75, taurus: 70, libra: 65, gemini: 60, leo: 55, aries: 50, sagittarius: 45, aquarius: 40 },
  scorpio: { cancer: 95, pisces: 90, capricorn: 85, virgo: 80, taurus: 75, scorpio: 70, libra: 65, gemini: 60, leo: 55, aries: 50, sagittarius: 45, aquarius: 40 },
  cancer: { scorpio: 95, pisces: 90, taurus: 85, virgo: 80, capricorn: 75, cancer: 70, libra: 65, gemini: 60, leo: 55, aries: 50, sagittarius: 45, aquarius: 40 },
  pisces: { scorpio: 95, cancer: 90, capricorn: 80, virgo: 75, taurus: 75, pisces: 70, libra: 65, gemini: 60, leo: 55, aries: 50, sagittarius: 45, aquarius: 40 },
  libra: { gemini: 90, aquarius: 85, leo: 80, sagittarius: 75, aries: 70, libra: 70, scorpio: 65, cancer: 60, pisces: 60, virgo: 55, taurus: 55, capricorn: 50 },
  gemini: { libra: 90, aquarius: 85, leo: 80, sagittarius: 75, aries: 70, gemini: 70, scorpio: 65, cancer: 60, pisces: 60, virgo: 55, taurus: 55, capricorn: 50 },
  aquarius: { gemini: 90, libra: 85, sagittarius: 80, aries: 75, leo: 70, aquarius: 70, scorpio: 65, cancer: 60, pisces: 60, virgo: 55, taurus: 55, capricorn: 50 },
  leo: { sagittarius: 90, aries: 85, libra: 80, gemini: 75, aquarius: 70, leo: 70, scorpio: 65, cancer: 60, pisces: 60, virgo: 55, taurus: 55, capricorn: 50 },
  sagittarius: { leo: 90, aries: 85, aquarius: 80, libra: 75, gemini: 70, sagittarius: 70, scorpio: 65, cancer: 60, pisces: 60, virgo: 55, taurus: 55, capricorn: 50 },
  aries: { leo: 90, sagittarius: 85, aquarius: 80, libra: 75, gemini: 70, aries: 70, scorpio: 65, cancer: 60, pisces: 60, virgo: 55, taurus: 55, capricorn: 50 },
};

export function calculateAstrologyCompatibility(sign1: string, sign2: string): number {
  return COMPATIBILITY_MATRIX[sign1]?.[sign2] || COMPATIBILITY_MATRIX[sign2]?.[sign1] || 50;
}

export function getAstrologyInsight(sign1: string, sign2: string, score: number): string {
  const sign1Cap = sign1.charAt(0).toUpperCase() + sign1.slice(1);
  const sign2Cap = sign2.charAt(0).toUpperCase() + sign2.slice(1);
  
  if (score >= 90) return `${sign1Cap} + ${sign2Cap}: Exceptional compatibility! Both signs value stability and commitment.`;
  if (score >= 80) return `${sign1Cap} + ${sign2Cap}: Great match! Your signs complement each other well.`;
  if (score >= 70) return `${sign1Cap} + ${sign2Cap}: Good compatibility with potential for growth.`;
  return `${sign1Cap} + ${sign2Cap}: Different approaches, but can learn from each other.`;
}

