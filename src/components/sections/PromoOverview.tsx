"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
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
import {
  BUILTIN_LOCATIONS,
  BUILTIN_PROJECT_LEADS,
} from "@/lib/overviewOptions";
import { fetchOverviewOptionsForForm } from "@/lib/supabase/overviewOptionsApi";

export function PromoOverview() {
  const brief = useBriefStore((s) => s.brief);
  const patch = useBriefStore((s) => s.patch);
  const updateBrief = useBriefStore((s) => s.updateBrief);
  const { canAdmin } = useAuth();

  const [projectLeads, setProjectLeads] = useState<string[]>(() =>
    BUILTIN_PROJECT_LEADS.map((o) => o.label)
  );
  const [locations, setLocations] = useState<string[]>(() =>
    BUILTIN_LOCATIONS.map((o) => o.label)
  );
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsSource, setOptionsSource] = useState<"cloud" | "builtin">(
    "builtin"
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingOptions(true);
      try {
        const [leads, locs] = await Promise.all([
          fetchOverviewOptionsForForm("project_lead"),
          fetchOverviewOptionsForForm("location"),
        ]);
        if (cancelled) return;
        setProjectLeads(leads.map((o) => o.label));
        setLocations(locs.map((o) => o.label));
        const fromCloud = leads.some((o) => o.dbId) || locs.some((o) => o.dbId);
        setOptionsSource(fromCloud ? "cloud" : "builtin");
      } catch {
        // Built-ins already in state
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-stone-500">
          {loadingOptions
            ? "Loading catalog…"
            : optionsSource === "cloud"
              ? "Shared catalog"
              : "Built-in catalog"}
        </p>
        {canAdmin && (
          <Link
            href="/admin/overview/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-900 hover:bg-violet-100"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Manage overview options
          </Link>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="projectLead" required>
            Project Lead
          </FieldLabel>
          <select
            id="projectLead"
            value={brief.projectLead}
            onChange={(e) => patch("projectLead", e.target.value)}
            className="box-border h-[42px] w-full rounded-lg border border-stone-200 bg-white px-3 text-sm leading-normal text-stone-900 shadow-sm focus:border-campero-orange focus:outline-none focus:ring-2 focus:ring-campero-orange/20"
          >
            <option value="">Select project lead…</option>
            {projectLeads.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            {/* Keep current value selectable if it isn't in the admin list */}
            {brief.projectLead &&
              !projectLeads.includes(brief.projectLead) && (
                <option value={brief.projectLead}>{brief.projectLead}</option>
              )}
          </select>
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
        <FieldLabel htmlFor="quickNote">Project Description</FieldLabel>
        <TextArea
          id="quickNote"
          value={brief.quickNote}
          onChange={(e) => patch("quickNote", e.target.value)}
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
          {locations.map((loc) => (
            <option key={loc} value={loc} />
          ))}
        </datalist>
      </div>
    </SectionCard>
  );
}
