import { readFile } from "node:fs/promises";
import { join } from "node:path";

const semanticVersionPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const calendarDatePattern = /^\d{4}-(0[1-9]|1[0-2])-([012]\d|3[01])$/;

function assertObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

function assertExactKeys(value, expectedKeys, label) {
  const actualKeys = Object.keys(value).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();
  if (actualKeys.join("\0") !== sortedExpectedKeys.join("\0")) {
    throw new Error(
      `${label} must contain exactly: ${sortedExpectedKeys.join(", ")}.`
    );
  }
}

function assertSemanticVersion(value, label) {
  if (typeof value !== "string" || !semanticVersionPattern.test(value)) {
    throw new Error(`${label} must use MAJOR.MINOR.PATCH.`);
  }
}

function assertCalendarDate(value, label) {
  if (typeof value !== "string" || !calendarDatePattern.test(value)) {
    throw new Error(`${label} must use YYYY-MM-DD.`);
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} must be a real calendar date.`);
  }
}

function assertOneLine(value, label) {
  if (
    typeof value !== "string" ||
    value.trim() !== value ||
    value.length === 0 ||
    /[\r\n]/.test(value)
  ) {
    throw new Error(`${label} must be a non-empty, trimmed single line.`);
  }
}

function assertLines(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }

  value.forEach((line, index) => assertOneLine(line, `${label}[${index}]`));
}

function compareSemanticVersions(left, right) {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);

  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) {
      return leftParts[index] - rightParts[index];
    }
  }

  return 0;
}

function readChangelogReleases(changelog) {
  return [...changelog.matchAll(/^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})$/gm)].map(
    ([, version, date]) => ({ version, date })
  );
}

export function validateReleaseNotes(document, changelog, projectVersion) {
  assertObject(document, "Release notes");
  assertExactKeys(
    document,
    ["schemaVersion", "companionSince", "releases"],
    "Release notes"
  );

  if (document.schemaVersion !== 1) {
    throw new Error(`Unsupported release-notes schema: ${document.schemaVersion}.`);
  }

  assertSemanticVersion(document.companionSince, "companionSince");
  assertSemanticVersion(projectVersion, "Project version");
  if (!Array.isArray(document.releases) || document.releases.length === 0) {
    throw new Error("Release notes must contain at least one release.");
  }

  const seenVersions = new Set();
  for (const [index, release] of document.releases.entries()) {
    const label = `Release notes entry ${index}`;
    assertObject(release, label);
    assertExactKeys(
      release,
      ["version", "date", "highlight", "features", "fixes"],
      label
    );
    assertSemanticVersion(release.version, `${label} version`);
    assertCalendarDate(release.date, `${label} date`);
    assertOneLine(release.highlight, `${label} highlight`);
    assertLines(release.features, `${label} features`);
    assertLines(release.fixes, `${label} fixes`);

    if (release.features.length + release.fixes.length === 0) {
      throw new Error(`${label} must contain at least one feature or fix.`);
    }
    if (seenVersions.has(release.version)) {
      throw new Error(`Duplicate release-notes version: ${release.version}.`);
    }
    seenVersions.add(release.version);

    if (
      index > 0 &&
      compareSemanticVersions(
        document.releases[index - 1].version,
        release.version
      ) <= 0
    ) {
      throw new Error("Release notes must list versions newest first.");
    }
  }

  if (document.releases[0].version !== projectVersion) {
    throw new Error(
      `Latest release notes ${document.releases[0].version} do not match VERSION ${projectVersion}.`
    );
  }

  const changelogReleases = readChangelogReleases(changelog);
  if (changelogReleases.length === 0) {
    throw new Error("CHANGELOG.md contains no versioned releases.");
  }
  const changelogByVersion = new Map(
    changelogReleases.map((release) => [release.version, release.date])
  );

  for (const release of document.releases) {
    const changelogDate = changelogByVersion.get(release.version);
    if (!changelogDate) {
      throw new Error(
        `Release notes ${release.version} have no matching CHANGELOG.md release.`
      );
    }
    if (changelogDate !== release.date) {
      throw new Error(
        `Release notes ${release.version} date ${release.date} does not match CHANGELOG.md ${changelogDate}.`
      );
    }
  }

  const requiredCompanionVersions = changelogReleases
    .filter(
      ({ version }) =>
        compareSemanticVersions(version, document.companionSince) >= 0
    )
    .map(({ version }) => version);
  const missingCompanionVersions = requiredCompanionVersions.filter(
    (version) => !seenVersions.has(version)
  );
  if (missingCompanionVersions.length > 0) {
    throw new Error(
      `Release notes must cover every release since ${document.companionSince}; missing: ${missingCompanionVersions.join(", ")}.`
    );
  }

  return document;
}

export async function validateReleaseNotesFiles(repositoryRoot) {
  const [source, changelog, versionSource] = await Promise.all([
    readFile(join(repositoryRoot, "companion", "release-notes.json"), "utf8"),
    readFile(join(repositoryRoot, "CHANGELOG.md"), "utf8"),
    readFile(join(repositoryRoot, "VERSION"), "utf8"),
  ]);
  const document = JSON.parse(source);
  return validateReleaseNotes(document, changelog, versionSource.trim());
}
