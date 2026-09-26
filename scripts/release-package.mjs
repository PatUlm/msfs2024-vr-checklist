#!/usr/bin/env node

import {
  buildRelease,
  installCompanionRelease,
  installRelease,
  prepareCompanionRelease,
  readProjectVersion,
  validateProjectVersionSources,
  validateReleaseVersion,
} from "./lib/msfs-release.mjs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateReleaseNotesFiles } from "./lib/release-notes.mjs";

const command = process.argv[2];
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const projectVersion = await readProjectVersion(repositoryRoot);
const version = process.env.VR_CHECKLIST_RELEASE_VERSION || projectVersion;

if (command === "current-version") {
  console.log(projectVersion);
} else if (command === "validate-version") {
  validateReleaseVersion(version);
  if (version !== projectVersion) {
    throw new Error(
      `Requested release ${version} does not match project VERSION ${projectVersion}.`
    );
  }
  await validateProjectVersionSources(repositoryRoot);
  await validateReleaseNotesFiles(repositoryRoot);
  console.log(`Release version: ${version}`);
} else if (command === "prepare-companion") {
  const result = await prepareCompanionRelease({
    version,
    publishDirectory: process.env.VR_CHECKLIST_RELEASE_COMPANION_PUBLISH_DIR,
    sdkRoot: process.env.VR_CHECKLIST_RELEASE_SDK_ROOT,
    noticesFile: resolve(repositoryRoot, "docs", "third-party-licenses.md"),
  });
  console.log(
    `Prepared companion ${result.version} with ${result.fileCount} files for packaging`
  );
} else if (command === "build") {
  const result = await buildRelease({
    version,
    stagingDirectory: process.env.VR_CHECKLIST_RELEASE_STAGING_DIR,
    companionPackageDirectory:
      process.env.VR_CHECKLIST_RELEASE_COMPANION_PACKAGE_DIR,
    releaseDirectory: process.env.VR_CHECKLIST_RELEASE_OUTPUT_DIR,
    sdkRoot: process.env.VR_CHECKLIST_RELEASE_SDK_ROOT,
  });
  console.log(
    `Created release ${version} (MSFS package ${result.packageVersion}, companion ${result.companionVersion}) at ${result.releaseTarget}`
  );
} else if (command === "install") {
  const result = await installRelease({
    version,
    releaseDirectory: process.env.VR_CHECKLIST_RELEASE_OUTPUT_DIR,
    communityDirectory: process.env.VR_CHECKLIST_RELEASE_COMMUNITY_DIR,
  });
  console.log(
    `Linked release ${version} (MSFS package ${result.packageVersion}) from ${result.linkTarget} to ${result.installTarget}`
  );
} else if (command === "install-companion") {
  const result = await installCompanionRelease({
    version,
    releaseDirectory: process.env.VR_CHECKLIST_RELEASE_OUTPUT_DIR,
    installDirectory: process.env.VR_CHECKLIST_RELEASE_COMPANION_INSTALL_DIR,
  });
  console.log(
    `Installed companion ${result.companionVersion} to ${result.installTarget}`
  );
} else {
  throw new Error(
    "Usage: release-package.mjs current-version|validate-version|prepare-companion|build|install|install-companion (configuration is read from the task environment)."
  );
}
