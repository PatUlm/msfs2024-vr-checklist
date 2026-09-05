import {
  AircraftMatchCriterion,
  AircraftMatchRule,
  Checklist,
} from "./ChecklistModel";

/*
 * Matches the aircraft the pilot is sitting in against the `msfsMatches`
 * rules of the checklists. Pure functions only: the SimVar reads that supply
 * the identity live in the view.
 */

export interface AircraftIdentity {
  atcModel: string;
  atcType: string;
  title: string;
}

export const EMPTY_AIRCRAFT_IDENTITY: Readonly<AircraftIdentity> = {
  atcModel: "",
  atcType: "",
  title: "",
};

export interface ChecklistSelection {
  /** The single matching checklist; undefined when none or several match. */
  checklist: Checklist | undefined;
  matchingChecklists: Checklist[];
}

export function normalizeMsfsIdentityValue(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
}

export function normalizeAircraftIdentity(
  identity: AircraftIdentity
): AircraftIdentity {
  return {
    atcModel: normalizeMsfsIdentityValue(identity.atcModel),
    atcType: normalizeMsfsIdentityValue(identity.atcType),
    title: normalizeMsfsIdentityValue(identity.title),
  };
}

/*
 * The key that ties a stored progress record to one aircraft. It is built
 * from the normalized identity so that whitespace and casing differences
 * between reads do not count as an aircraft change.
 */
export function createAircraftIdentityKey(identity: AircraftIdentity): string {
  const normalized = normalizeAircraftIdentity(identity);
  return [normalized.atcModel, normalized.atcType, normalized.title].join("|");
}

export function hasAircraftIdentity(identity: AircraftIdentity): boolean {
  return createAircraftIdentityKey(identity).replace(/\|/g, "").length > 0;
}

/**
 * `ATC MODEL | ATC TYPE | TITLE` for logs and the diagnostics line. An empty
 * field is shown as `emptyLabel` when one is given.
 */
export function describeAircraftIdentity(
  identity: AircraftIdentity,
  emptyLabel?: string
): string {
  return [identity.atcModel, identity.atcType, identity.title]
    .map((value) => (emptyLabel === undefined ? value : value || emptyLabel))
    .join(" | ");
}

function matchesAircraftCriterion(
  value: string,
  criterion: AircraftMatchCriterion
): boolean {
  if (criterion.equals !== undefined) {
    return value === normalizeMsfsIdentityValue(criterion.equals);
  }

  if (criterion.contains !== undefined) {
    return value.includes(normalizeMsfsIdentityValue(criterion.contains));
  }

  return false;
}

function matchesAircraftRule(
  identity: AircraftIdentity,
  rule: AircraftMatchRule
): boolean {
  const fields: (keyof AircraftIdentity)[] = ["atcModel", "atcType", "title"];
  let matchedFieldCount = 0;

  for (const field of fields) {
    const criterion = rule[field];

    if (criterion !== undefined) {
      matchedFieldCount += 1;

      if (!matchesAircraftCriterion(identity[field], criterion)) {
        return false;
      }
    }
  }

  return matchedFieldCount > 0;
}

/** Expects an identity that went through `normalizeAircraftIdentity`. */
export function matchesAircraft(
  checklist: Checklist,
  normalizedIdentity: AircraftIdentity
): boolean {
  return checklist.aircraft.msfsMatches.some((rule) =>
    matchesAircraftRule(normalizedIdentity, rule)
  );
}

export function selectChecklistForAircraft(
  candidates: readonly Checklist[],
  identity: AircraftIdentity
): ChecklistSelection {
  const normalizedIdentity = normalizeAircraftIdentity(identity);
  const matchingChecklists = candidates.filter((candidate) =>
    matchesAircraft(candidate, normalizedIdentity)
  );

  return {
    checklist:
      matchingChecklists.length === 1 ? matchingChecklists[0] : undefined,
    matchingChecklists,
  };
}
