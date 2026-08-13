export function newBriefId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `brief-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Pre-filled Promo / Initiative Name for new / blank briefs. */
export function untitledBriefPromoName(when: Date = new Date()): string {
  const date = when.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = when.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `Untitled Brief · ${date} · ${time}`;
}

export function defaultBriefName(promoName: string, projectLead: string): string {
  const promo = promoName.trim();
  if (promo) return promo;
  const lead = projectLead.trim();
  if (lead) return `${lead} – Untitled promo`;
  // Auto-title for early drafts (Option F hybrid save)
  return untitledBriefPromoName();
}
