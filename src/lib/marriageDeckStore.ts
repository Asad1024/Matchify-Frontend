/** Local persistence for Marriage tab: pass / like / favorite / compliment lists. */

const P = "matchify_marriage_deck_";

export type DeckEntry = { id: string; at: string };

function emitUpdate(): void {
  try {
    window.dispatchEvent(new Event("matchify-marriage-deck-updated"));
  } catch {
    /* ignore */
  }
}

function readList(key: string): DeckEntry[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const j = JSON.parse(raw);
    if (!Array.isArray(j)) return [];
    return j.filter((x) => x && typeof x.id === "string");
  } catch {
    return [];
  }
}

function writeList(key: string, list: DeckEntry[]): void {
  localStorage.setItem(key, JSON.stringify(list.slice(0, 120)));
  emitUpdate();
}

function pushEntry(list: DeckEntry[], id: string): DeckEntry[] {
  const next = list.filter((e) => e.id !== id);
  next.unshift({ id, at: new Date().toISOString() });
  return next;
}

export const getMarriagePassed = (): DeckEntry[] => readList(`${P}passed`);
export const getMarriageLiked = (): DeckEntry[] => readList(`${P}liked`);
export const getMarriageFavorites = (): DeckEntry[] => readList(`${P}favorites`);
export const getMarriageComplimented = (): DeckEntry[] => readList(`${P}complimented`);

export function getMarriagePassedIds(): Set<string> {
  return new Set(getMarriagePassed().map((e) => e.id));
}

export function getMarriageLikedIds(): Set<string> {
  return new Set(getMarriageLiked().map((e) => e.id));
}

export function addMarriagePassed(id: string): void {
  writeList(`${P}passed`, pushEntry(getMarriagePassed(), id));
}

export function addMarriageLiked(id: string): void {
  writeList(`${P}liked`, pushEntry(getMarriageLiked(), id));
}

export function addMarriageComplimented(id: string): void {
  writeList(`${P}complimented`, pushEntry(getMarriageComplimented(), id));
}

export function isMarriageFavorite(id: string): boolean {
  return getMarriageFavorites().some((e) => e.id === id);
}

/** Returns new favorite state (true = now favorited). */
export function toggleMarriageFavorite(id: string): boolean {
  const list = getMarriageFavorites();
  if (list.some((e) => e.id === id)) {
    writeList(
      `${P}favorites`,
      list.filter((e) => e.id !== id),
    );
    return false;
  }
  writeList(`${P}favorites`, pushEntry(list, id));
  return true;
}

/** Dev/testing: clear pass / like / favorite / compliment lists (Explore → My history + Marriage deck). */
export function clearMarriageDeckListsForTesting(): void {
  try {
    localStorage.removeItem(`${P}passed`);
    localStorage.removeItem(`${P}liked`);
    localStorage.removeItem(`${P}favorites`);
    localStorage.removeItem(`${P}complimented`);
  } catch {
    /* ignore */
  }
  emitUpdate();
}
