/*
 * The checklist domain model. It mirrors the JSON schema of
 * checklists/data/ and carries no runtime state.
 */

export interface ChecklistAlternative {
  when: string;
  response: string;
}

export interface ChecklistItem {
  id: string;
  challenge: string;
  response: string;
  kind: "action" | "verify" | "communication" | "optional";
  condition?: string;
  alternatives?: ChecklistAlternative[];
  notes?: string[];
  needsReview?: boolean;
  reviewNote?: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface AircraftMatchCriterion {
  equals?: string;
  contains?: string;
}

export interface AircraftMatchRule {
  atcModel?: AircraftMatchCriterion;
  atcType?: AircraftMatchCriterion;
  title?: AircraftMatchCriterion;
}

export interface Checklist {
  id: string;
  title: string;
  aircraft: {
    manufacturer: string;
    model: string;
    msfsMatches: AircraftMatchRule[];
  };
  revision: string;
  sections: ChecklistSection[];
}

/*
 * The badge text of an item kind. The data keeps the semantic kind
 * `communication`, the flight deck says `ATC`.
 */
export const ITEM_KIND_LABELS: Record<ChecklistItem["kind"], string> = {
  action: "Action",
  verify: "Verify",
  communication: "ATC",
  optional: "Optional",
};
