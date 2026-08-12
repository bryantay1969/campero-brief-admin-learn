/** Built-in Overview options (fallback if Supabase is empty/offline). */

export type OverviewOptionKind = "project_lead" | "location";

export type OverviewOptionDef = {
  id: string;
  label: string;
  kind: OverviewOptionKind;
  sortOrder?: number;
  /** Present when loaded from database */
  dbId?: string;
  isActive?: boolean;
};

export const BUILTIN_PROJECT_LEADS: OverviewOptionDef[] = [
  { id: "alex-rivera", kind: "project_lead", label: "Alex Rivera", sortOrder: 10 },
  { id: "jordan-lee", kind: "project_lead", label: "Jordan Lee", sortOrder: 20 },
  { id: "sam-patel", kind: "project_lead", label: "Sam Patel", sortOrder: 30 },
  { id: "morgan-chen", kind: "project_lead", label: "Morgan Chen", sortOrder: 40 },
  { id: "taylor-brooks", kind: "project_lead", label: "Taylor Brooks", sortOrder: 50 },
];

export const BUILTIN_LOCATIONS: OverviewOptionDef[] = [
  { id: "national", kind: "location", label: "National", sortOrder: 10 },
  {
    id: "la-southern-california",
    kind: "location",
    label: "LA / Southern California",
    sortOrder: 20,
  },
  { id: "houston", kind: "location", label: "Houston", sortOrder: 30 },
  {
    id: "dallas-fort-worth",
    kind: "location",
    label: "Dallas / Fort Worth",
    sortOrder: 40,
  },
  {
    id: "miami-south-florida",
    kind: "location",
    label: "Miami / South Florida",
    sortOrder: 50,
  },
  {
    id: "dc-md-va",
    kind: "location",
    label: "Washington DC / Maryland / Virginia",
    sortOrder: 60,
  },
  {
    id: "ny-nj",
    kind: "location",
    label: "New York / New Jersey",
    sortOrder: 70,
  },
];

export function builtinsForKind(kind: OverviewOptionKind): OverviewOptionDef[] {
  return kind === "project_lead"
    ? BUILTIN_PROJECT_LEADS.map((o) => ({ ...o }))
    : BUILTIN_LOCATIONS.map((o) => ({ ...o }));
}
