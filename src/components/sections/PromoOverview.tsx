"use client";

import { useBriefStore } from "@/store/briefStore";
import {
  SectionCard,
  FieldLabel,
  TextInput,
  TextArea,
  ToggleYesNo,
} from "@/components/ui/FormControls";
import {
  BUILTIN_LEGAL_TEMPLATES,
  findTemplateText,
} from "@/lib/legalTemplates";

export function PromoOverview() {
  const brief = useBriefStore((s) => s.brief);
  const patch = useBriefStore((s) => s.patch);
  const updateBrief = useBriefStore((s) => s.updateBrief);

  const handleLoyaltyChange = (v: "yes" | "no") => {
    if (v === "yes") {
      const bogoText =
        findTemplateText(BUILTIN_LEGAL_TEMPLATES, "bogoLoyalty") ||
        brief.legal.legalText;
      updateBrief({
        loyaltyOnly: v,
        legal: {
          ...brief.legal,
          templateId: "bogoLoyalty",
          legalText: bogoText,
        },
      });
    } else {
      patch("loyaltyOnly", v);
    }
  };

  return (
    <SectionCard id="section-overview" title="Promo Overview">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="projectLead" required>
            Project Lead
          </FieldLabel>
          <TextInput
            id="projectLead"
            value={brief.projectLead}
            onChange={(e) => patch("projectLead", e.target.value)}
            placeholder="Name or team"
          />
        </div>
        <div>
          <FieldLabel htmlFor="promoName" required>
            Promo / Initiative Name
          </FieldLabel>
          <TextInput
            id="promoName"
            value={brief.promoName}
            onChange={(e) => patch("promoName", e.target.value)}
            placeholder="e.g. National Fried Chicken Day"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="launchDate" required>
            Launch Date
          </FieldLabel>
          <TextInput
            id="launchDate"
            type="date"
            value={brief.launchDate}
            onChange={(e) => patch("launchDate", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="endDate">End Date</FieldLabel>
          <TextInput
            id="endDate"
            type="date"
            value={brief.endDate}
            onChange={(e) => patch("endDate", e.target.value)}
          />
        </div>
      </div>

      <div>
        <FieldLabel
          htmlFor="quickNote"
          hint='e.g. "This is email and organic social only."'
        >
          Quick Note
        </FieldLabel>
        <TextArea
          id="quickNote"
          value={brief.quickNote}
          onChange={(e) => patch("quickNote", e.target.value)}
          placeholder="Scope, channel focus, or other context for partners…"
          rows={3}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel>Is this promo loyalty only?</FieldLabel>
          <ToggleYesNo
            name="loyaltyOnly"
            value={brief.loyaltyOnly}
            onChange={handleLoyaltyChange}
          />
          {brief.loyaltyOnly === "yes" && (
            <p className="mt-2 text-xs text-campero-orange font-medium">
              Loyalty legal template and badge notes will be surfaced.
            </p>
          )}
        </div>
        <div>
          <FieldLabel>Is a promo code needed?</FieldLabel>
          <ToggleYesNo
            name="promoCodeNeeded"
            value={brief.promoCodeNeeded}
            onChange={(v) => patch("promoCodeNeeded", v)}
          />
        </div>
      </div>

      <div>
        <FieldLabel
          htmlFor="locations"
          hint="National, or list specific markets"
        >
          Locations
        </FieldLabel>
        <TextInput
          id="locations"
          value={brief.locations}
          onChange={(e) => patch("locations", e.target.value)}
          placeholder="National / LA, Houston, Miami…"
          list="location-suggestions"
        />
        <datalist id="location-suggestions">
          <option value="National" />
          <option value="LA / Southern California" />
          <option value="Houston" />
          <option value="Dallas / Fort Worth" />
          <option value="Miami / South Florida" />
          <option value="Washington DC / Maryland / Virginia" />
          <option value="New York / New Jersey" />
        </datalist>
      </div>
    </SectionCard>
  );
}
