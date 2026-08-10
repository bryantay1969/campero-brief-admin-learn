export function newBriefId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `brief-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function defaultBriefName(promoName: string, projectLead: string): string {
  const promo = promoName.trim();
  if (promo) return promo;
  const lead = projectLead.trim();
  if (lead) return `${lead} – Untitled promo`;
  return `Untitled brief · ${new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}
