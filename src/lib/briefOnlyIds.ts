/** Prefix for brief-only (non-catalog) asset ids — never written to admin catalogs. */
export const BRIEF_ONLY_ID_PREFIX = "briefonly-";

export function newBriefOnlyId(): string {
  const tail =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${BRIEF_ONLY_ID_PREFIX}${tail}`;
}

export function isBriefOnlyAssetId(id: string | undefined | null): boolean {
  return !!id && id.startsWith(BRIEF_ONLY_ID_PREFIX);
}
