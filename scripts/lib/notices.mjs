import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const artifactTitles = {
  companion: "VR Checklist Companion",
  efb: "VR Checklist EFB app",
};

export async function readNotices(repositoryRoot) {
  return JSON.parse(
    await readFile(join(repositoryRoot, "licenses", "notices.json"), "utf8")
  );
}

function componentsFor(notices, artifact) {
  return notices.components.filter((component) =>
    component.artifacts.includes(artifact)
  );
}

// Renders THIRD-PARTY-NOTICES.txt; identical texts are reproduced only once.
export async function renderNotices(repositoryRoot, notices, artifact) {
  const components = componentsFor(notices, artifact);
  const lines = [
    `${artifactTitles[artifact]}: third-party notices`,
    "",
    "This download contains the third-party components listed below. Their",
    "license texts follow; the project's own license is in LICENSE.txt.",
    "",
    ...components.map(
      (component) => `- ${component.name} ${component.version}: ${component.license}`
    ),
  ];
  const reproduced = new Map();

  for (const component of components) {
    lines.push(
      "",
      "=".repeat(80),
      `${component.name} ${component.version}`,
      `License: ${component.license}`,
      `Source: ${component.source}`
    );
    if (component.note) {
      lines.push("", component.note);
    }
    for (const file of component.texts) {
      const text = (
        await readFile(join(repositoryRoot, "licenses", component.id, file), "utf8")
      )
        .replaceAll("\r\n", "\n")
        .trimEnd();
      const hash = createHash("sha256").update(text).digest("hex");
      lines.push("", "-".repeat(80), `${component.name}: ${file}`, "");
      if (reproduced.has(hash)) {
        lines.push(`Identical to ${reproduced.get(hash)} above.`);
      } else {
        reproduced.set(hash, `${component.name}: ${file}`);
        lines.push(text);
      }
    }
  }

  return `${lines.join("\n")}\n`;
}

/*
 * Every NuGet package or runtime pack that ships files in the self-contained
 * publish needs a notice for exactly its version, and no notice may be stale.
 */
export function companionNoticeProblems(notices, depsJson) {
  const [, target = {}] =
    Object.entries(depsJson.targets).find(([name]) => name.includes("/")) ?? [];
  const noticed = new Map(
    componentsFor(notices, "companion").flatMap((component) =>
      (component.packages ?? []).map((name) => [name, component.version])
    )
  );
  const shipped = new Set();
  const problems = [];

  for (const [library, entry] of Object.entries(target)) {
    const shipsFiles = ["runtime", "native", "resources"].some(
      (kind) => Object.keys(entry[kind] ?? {}).length > 0
    );
    if (depsJson.libraries[library]?.type === "project" || !shipsFiles) {
      continue;
    }
    const [name, version] = library.split("/");
    shipped.add(name);
    if (!noticed.has(name)) {
      problems.push(`${library} has no license notice`);
    } else if (noticed.get(name) !== version) {
      problems.push(`${library} has a notice for version ${noticed.get(name)}`);
    }
  }
  for (const name of noticed.keys()) {
    if (!shipped.has(name)) {
      problems.push(`notice for ${name} matches no shipped package`);
    }
  }

  return problems;
}

// EFB components are bundled from a local package; its version must match.
export async function efbNoticeProblems(repositoryRoot, notices) {
  const problems = [];
  for (const component of componentsFor(notices, "efb")) {
    const installed = JSON.parse(
      await readFile(join(repositoryRoot, component.packageJson), "utf8")
    );
    if (installed.name !== component.name || installed.version !== component.version) {
      problems.push(
        `${installed.name} ${installed.version} does not match the notice for ${component.name} ${component.version}`
      );
    }
  }
  return problems;
}

export async function writeLicenseFiles(targetDirectory, repositoryRoot, notices, artifact) {
  await writeFile(
    join(targetDirectory, "LICENSE.txt"),
    await readFile(join(repositoryRoot, "LICENSE"))
  );
  await writeFile(
    join(targetDirectory, "THIRD-PARTY-NOTICES.txt"),
    await renderNotices(repositoryRoot, notices, artifact)
  );
  if (artifact === "companion") {
    await writeFile(
      join(targetDirectory, "AUDIO-LICENSE.txt"),
      await readFile(join(repositoryRoot, "assets", "audio", "LICENSE"))
    );
  }
}
