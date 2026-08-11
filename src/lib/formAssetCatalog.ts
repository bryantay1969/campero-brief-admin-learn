/** Shared catalog types and merge helpers for Digital / Paid / Physical / PR. */

export type CatalogSection = "digital" | "paid" | "physical" | "pr";

export type FormAssetCatalogDef = {
  id: string;
  slug: string;
  title: string;
  specs: string;
  notesDefault: string;
  notesPlaceholder: string;
  priorityDefault: string;
  linkLabel: string;
  linkHref: string;
  dbId?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export const CATALOG_SECTION_META: Record<
  CatalogSection,
  { label: string; shortLabel: string; formTab: string }
> = {
  digital: {
    label: "Digital assets",
    shortLabel: "Digital",
    formTab: "Digital",
  },
  paid: {
    label: "Paid media assets",
    shortLabel: "Paid Media",
    formTab: "Paid",
  },
  physical: {
    label: "In-store assets",
    shortLabel: "In-Store",
    formTab: "In-Store",
  },
  pr: {
    label: "PR assets",
    shortLabel: "PR",
    formTab: "PR",
  },
};

export type ListAssetLike = {
  id: string;
  title?: string;
  label?: string;
  specs: string;
  enabled: boolean;
  notes: string;
  priority?: string;
  linkLabel?: string;
  linkHref?: string;
};

/** Merge catalog into a title/specs/notes list (digital/paid-like). */
export function mergeListWithCatalog<T extends ListAssetLike>(
  briefAssets: T[],
  catalog: FormAssetCatalogDef[],
  factory: (partial: {
    id: string;
    title: string;
    specs: string;
    notes: string;
    enabled: boolean;
    priority?: string;
    linkLabel?: string;
    linkHref?: string;
  }) => T
): T[] {
  const byId = new Map(briefAssets.filter((a) => a?.id).map((a) => [a.id, a]));
  const catalogSlugs = new Set(catalog.map((c) => c.slug));

  const merged = catalog.map((c) => {
    const existing = byId.get(c.slug);
    if (existing) {
      return factory({
        id: c.slug,
        title: c.title,
        specs: c.specs,
        notes: existing.notes?.trim() ? existing.notes : c.notesDefault,
        enabled: existing.enabled,
        priority:
          (existing.priority && existing.priority.trim()) ||
          c.priorityDefault ||
          "",
        linkLabel: c.linkLabel || "",
        linkHref: c.linkHref || "",
      });
    }
    return factory({
      id: c.slug,
      title: c.title,
      specs: c.specs,
      notes: c.notesDefault,
      enabled: false,
      priority: c.priorityDefault || "",
      linkLabel: c.linkLabel || "",
      linkHref: c.linkHref || "",
    });
  });

  const custom = briefAssets.filter(
    (a) => a?.id && !catalogSlugs.has(a.id)
  ) as T[];

  return [...merged, ...custom];
}

/** Physical uses `label` instead of `title`. */
export function mergePhysicalWithCatalog<
  T extends {
    id: string;
    label: string;
    specs: string;
    enabled: boolean;
    notes: string;
  },
>(
  briefAssets: T[],
  catalog: FormAssetCatalogDef[],
  factory: (partial: {
    id: string;
    label: string;
    specs: string;
    notes: string;
    enabled: boolean;
    priority?: string;
    linkLabel?: string;
    linkHref?: string;
  }) => T
): T[] {
  const byId = new Map(briefAssets.filter((a) => a?.id).map((a) => [a.id, a]));
  const catalogSlugs = new Set(catalog.map((c) => c.slug));

  const merged = catalog.map((c) => {
    const existing = byId.get(c.slug);
    if (existing) {
      return factory({
        id: c.slug,
        label: c.title,
        specs: c.specs,
        notes: existing.notes?.trim() ? existing.notes : c.notesDefault,
        enabled: existing.enabled,
        priority:
          ((existing as { priority?: string }).priority || "").trim() ||
          c.priorityDefault ||
          "",
        linkLabel: c.linkLabel || "",
        linkHref: c.linkHref || "",
      });
    }
    return factory({
      id: c.slug,
      label: c.title,
      specs: c.specs,
      notes: c.notesDefault,
      enabled: false,
      priority: c.priorityDefault || "",
      linkLabel: c.linkLabel || "",
      linkHref: c.linkHref || "",
    });
  });

  const custom = briefAssets.filter(
    (a) => a?.id && !catalogSlugs.has(a.id)
  ) as T[];

  return [...merged, ...custom];
}

export function isInCatalog(
  id: string,
  catalog: FormAssetCatalogDef[]
): boolean {
  return catalog.some((c) => c.slug === id || c.id === id);
}
