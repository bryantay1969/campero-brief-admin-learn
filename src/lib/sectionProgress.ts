import type { PromoBrief, SectionId } from "./types";

/** Whether a form section has enough content to mark complete in the nav. */
export function sectionComplete(id: SectionId, brief: PromoBrief): boolean {
  switch (id) {
    case "overview":
      return !!(brief.projectLead && brief.promoName && brief.launchDate);
    case "messaging":
      return brief.messagingBullets.some((b) => b.text.trim());
    case "digital":
      return (
        Array.isArray(brief.digitalAssets) &&
        brief.digitalAssets.some((a) => a.enabled)
      );
    case "it":
      return (
        Array.isArray(brief.itElements) &&
        brief.itElements.some((a) => a.enabled)
      );
    case "paid":
      return (
        Array.isArray(brief.paidMedia) &&
        brief.paidMedia.some((a) => a.enabled)
      );
    case "pr":
      return brief.pr.blogPost.enabled || brief.pr.pressRelease.enabled;
    case "physical":
      return (
        Array.isArray(brief.physicalAssets) &&
        brief.physicalAssets.some((a) => a.enabled)
      );
    case "legal":
      return !!brief.legal.legalText.trim();
    case "review":
      return false;
    default:
      return false;
  }
}
