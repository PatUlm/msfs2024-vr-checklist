import {
  access,
  cp,
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { spawn } from "node:child_process";

export const packageName = "patulm-vr-checklist";
export const stagingDirectoryName = "msfs2024-vr-checklist-staging";
export const releaseDirectoryName = "msfs2024-vr-checklist-releases";
export const communityDirectoryName = "Community2024";

const semanticVersionPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const legacyCalVerPattern = /^\d{4}\.(0[1-9]|1[0-2])(?:\.\d+)?$/;

export function validateReleaseVersion(version) {
  if (!semanticVersionPattern.test(version ?? "")) {
    throw new Error(
      `Release version must use MAJOR.MINOR.PATCH: ${version ?? "<missing>"}`
    );
  }

  return version;
}

export function validateArtifactVersion(version) {
  if (
    !semanticVersionPattern.test(version ?? "") &&
    !legacyCalVerPattern.test(version ?? "")
  ) {
    throw new Error(
      `Artifact version must use MAJOR.MINOR.PATCH: ${version ?? "<missing>"}`
    );
  }

  return version;
}

export async function readProjectVersion(repositoryRoot) {
  return validateReleaseVersion(
    (await readFile(join(repositoryRoot, "VERSION"), "utf8")).trim()
  );
}

export async function validateProjectVersionSources(repositoryRoot) {
  const version = await readProjectVersion(repositoryRoot);
  const packageDefinition = await readFile(
    join(
      repositoryRoot,
      "msfs",
      "PackageDefinitions",
      "patulm-vr-checklist.xml"
    ),
    "utf8"
  );
  const packageDefinitionVersion = /<AssetPackage\s+Version="([^"]+)"/.exec(
    packageDefinition
  )?.[1];
  const npmPackage = await readJson(
    join(repositoryRoot, "msfs", "PackageSources", "VRChecklist", "package.json")
  );
  const npmPackageLock = await readJson(
    join(
      repositoryRoot,
      "msfs",
      "PackageSources",
      "VRChecklist",
      "package-lock.json"
    )
  );

  for (const [label, actualVersion] of [
    ["MSFS package definition", packageDefinitionVersion],
    ["EFB npm package", npmPackage.version],
    ["EFB npm lockfile", npmPackageLock.version],
    ["EFB npm lockfile root package", npmPackageLock.packages?.[""]?.version],
  ]) {
    if (actualVersion !== version) {
      throw new Error(
        `${label} version ${actualVersion ?? "<missing>"} does not match VERSION ${version}.`
      );
    }
  }

  return version;
}

export function assertManagedWindowsDirectory(path, expectedName, label) {
  if (!path) {
    throw new Error(`${label} is not configured.`);
  }

  const resolvedPath = resolve(path);
  if (!/^\/mnt\/[a-z](?:\/|$)/i.test(resolvedPath)) {
    throw new Error(`${label} must be on a mounted Windows drive: ${path}`);
  }

  if (basename(resolvedPath) !== expectedName) {
    throw new Error(
      `${label} must be named ${expectedName}: ${resolvedPath}`
    );
  }

  return resolvedPath;
}

export function toWindowsPath(path) {
  const resolvedPath = resolve(path);
  const match = /^\/mnt\/([a-z])(?:\/(.*))?$/i.exec(resolvedPath);
  if (!match) {
    throw new Error(`Cannot convert non-Windows mount path: ${path}`);
  }

  const suffix = match[2] ? `\\${match[2].replaceAll("/", "\\")}` : "\\";
  return `${match[1].toUpperCase()}:${suffix}`;
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function listPackageFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(current, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Release packages may not contain symbolic links: ${path}`);
    }

    if (entry.isDirectory()) {
      files.push(...(await listPackageFiles(root, path)));
      continue;
    }

    if (!entry.isFile()) {
      throw new Error(`Unsupported package entry: ${path}`);
    }

    files.push(relative(root, path).split(sep).join("/"));
  }

  return files;
}

function findFile(files, suffix) {
  const normalizedSuffix = suffix.toLowerCase().replace(/^\/+/, "");
  return files.find((file) =>
    file.toLowerCase().replace(/^\/+/, "").endsWith(normalizedSuffix)
  );
}

export async function verifyPackage(packageRoot, expectedReleaseVersion) {
  const resolvedRoot = resolve(packageRoot);
  const rootStats = await lstat(resolvedRoot);
  if (!rootStats.isDirectory() || rootStats.isSymbolicLink()) {
    throw new Error(`Package root must be a real directory: ${resolvedRoot}`);
  }

  const manifest = await readJson(join(resolvedRoot, "manifest.json"));
  const layout = await readJson(join(resolvedRoot, "layout.json"));

  if (manifest.export_type !== "Community") {
    throw new Error(`Package export_type must be Community: ${manifest.export_type}`);
  }

  if (!semanticVersionPattern.test(manifest.package_version ?? "")) {
    throw new Error(
      `Package manifest version must use MAJOR.MINOR.PATCH: ${manifest.package_version}`
    );
  }

  if (!Array.isArray(layout.content)) {
    throw new Error("Package layout.json must contain a content array.");
  }

  const packageFiles = await listPackageFiles(resolvedRoot);
  const payloadFiles = packageFiles.filter(
    (file) => !["layout.json", "manifest.json"].includes(file.toLowerCase())
  );
  const actualFiles = new Map(payloadFiles.map((file) => [file.toLowerCase(), file]));
  const layoutFiles = new Map();

  for (const entry of layout.content) {
    if (
      typeof entry?.path !== "string" ||
      !Number.isSafeInteger(entry?.size) ||
      entry.size < 0
    ) {
      throw new Error("Package layout contains an invalid file entry.");
    }

    const normalizedPath = entry.path.replaceAll("\\", "/").toLowerCase();
    if (layoutFiles.has(normalizedPath)) {
      throw new Error(`Package layout contains a duplicate path: ${entry.path}`);
    }
    layoutFiles.set(normalizedPath, entry);

    const actualPath = actualFiles.get(normalizedPath);
    if (!actualPath) {
      throw new Error(`Package layout references a missing file: ${entry.path}`);
    }

    const actualSize = (await stat(join(resolvedRoot, actualPath))).size;
    if (actualSize !== entry.size) {
      throw new Error(
        `Package layout size mismatch for ${entry.path}: ${entry.size} != ${actualSize}`
      );
    }
  }

  for (const [normalizedPath, actualPath] of actualFiles) {
    if (!layoutFiles.has(normalizedPath)) {
      throw new Error(`Package file is missing from layout.json: ${actualPath}`);
    }
  }

  const requiredSuffixes = [
    "/contentinfo/patulm-vr-checklist/thumbnail.jpg",
    "/html_ui/efb_ui/efb_apps/vrchecklist/assets/app-icon.svg",
    "/html_ui/efb_ui/efb_apps/vrchecklist/vrchecklist.css",
    "/html_ui/efb_ui/efb_apps/vrchecklist/vrchecklist.js",
  ];

  for (const suffix of requiredSuffixes) {
    if (!findFile(packageFiles.map((file) => `/${file}`), suffix)) {
      throw new Error(`Required release file is missing: ${suffix}`);
    }
  }

  const sourceMap = packageFiles.find((file) => file.toLowerCase().endsWith(".map"));
  if (sourceMap) {
    throw new Error(`Production package contains a source map: ${sourceMap}`);
  }

  if (expectedReleaseVersion) {
    validateArtifactVersion(expectedReleaseVersion);
    const appScript = findFile(
      packageFiles,
      "/html_ui/efb_ui/efb_apps/vrchecklist/vrchecklist.js"
    );
    const appSource = await readFile(join(resolvedRoot, appScript), "utf8");
    if (!appSource.includes(expectedReleaseVersion)) {
      throw new Error(
        `App bundle does not contain release version ${expectedReleaseVersion}.`
      );
    }
  }

  return {
    fileCount: payloadFiles.length,
    manifest,
  };
}

async function runPackageTool(executable, projectFile) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(
      executable,
      [toWindowsPath(projectFile), "-rebuild", "-mirroring", "-nopause"],
      { stdio: "inherit" }
    );

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      reject(
        new Error(
          `FsPackageTool failed${signal ? ` with signal ${signal}` : ` with exit code ${code}`}.`
        )
      );
    });
  });
}

export async function buildRelease({
  version,
  stagingDirectory,
  releaseDirectory,
  sdkRoot,
}) {
  validateReleaseVersion(version);
  const stagingRoot = assertManagedWindowsDirectory(
    stagingDirectory,
    stagingDirectoryName,
    "MSFS staging directory"
  );
  const releaseRoot = assertManagedWindowsDirectory(
    releaseDirectory,
    releaseDirectoryName,
    "Release directory"
  );
  const resolvedSdkRoot = resolve(sdkRoot ?? "");
  if (!/^\/mnt\/[a-z](?:\/|$)/i.test(resolvedSdkRoot)) {
    throw new Error(`MSFS SDK root must be on a mounted Windows drive: ${sdkRoot}`);
  }

  const projectFile = join(stagingRoot, "VRChecklistProject.xml");
  const packageTool = join(resolvedSdkRoot, "Tools", "bin", "fspackagetool.exe");
  const packageOutput = join(stagingRoot, "Packages", packageName);
  const releaseTarget = join(releaseRoot, version);

  for (const requiredPath of [projectFile, packageTool]) {
    if (!(await pathExists(requiredPath))) {
      throw new Error(`Required release input is missing: ${requiredPath}`);
    }
  }

  if (await pathExists(releaseTarget)) {
    throw new Error(
      `Release ${version} already exists and is immutable: ${releaseTarget}`
    );
  }

  await runPackageTool(packageTool, projectFile);
  const verification = await verifyPackage(packageOutput, version);
  if (verification.manifest.package_version !== version) {
    throw new Error(
      `MSFS package version ${verification.manifest.package_version} does not match release ${version}.`
    );
  }

  await mkdir(releaseRoot, { recursive: true });
  const temporaryTarget = join(releaseRoot, `.${version}.release-${process.pid}`);
  await rm(temporaryTarget, { force: true, recursive: true });

  try {
    await mkdir(temporaryTarget, { recursive: true });
    await cp(packageOutput, join(temporaryTarget, packageName), {
      recursive: true,
    });
    await writeFile(
      join(temporaryTarget, "release.json"),
      `${JSON.stringify(
        {
          schemaVersion: 1,
          packageName,
          releaseVersion: version,
          packageVersion: verification.manifest.package_version,
          createdAt: new Date().toISOString(),
        },
        null,
        2
      )}\n`
    );
    await rename(temporaryTarget, releaseTarget);
  } finally {
    await rm(temporaryTarget, { force: true, recursive: true });
  }

  return {
    packageVersion: verification.manifest.package_version,
    releaseTarget,
  };
}

export async function installRelease({
  version,
  releaseDirectory,
  communityDirectory,
}) {
  validateArtifactVersion(version);
  const releaseRoot = assertManagedWindowsDirectory(
    releaseDirectory,
    releaseDirectoryName,
    "Release directory"
  );
  const communityRoot = assertManagedWindowsDirectory(
    communityDirectory,
    communityDirectoryName,
    "MSFS Community directory"
  );
  const releaseRootStats = await lstat(releaseRoot);
  const communityRootStats = await lstat(communityRoot);
  if (!releaseRootStats.isDirectory() || !communityRootStats.isDirectory()) {
    throw new Error("Release and Community paths must already be directories.");
  }

  const releaseTarget = join(releaseRoot, version);
  const metadata = await readJson(join(releaseTarget, "release.json"));
  if (
    metadata.schemaVersion !== 1 ||
    metadata.packageName !== packageName ||
    metadata.releaseVersion !== version
  ) {
    throw new Error(`Release metadata does not match requested version ${version}.`);
  }

  const releasePackage = join(releaseTarget, packageName);
  const verification = await verifyPackage(releasePackage, version);
  if (verification.manifest.package_version !== metadata.packageVersion) {
    throw new Error("Release metadata and package manifest versions do not match.");
  }

  const installTarget = join(communityRoot, packageName);
  const temporaryTarget = join(
    communityRoot,
    `.${packageName}.install-${process.pid}`
  );
  const backupTarget = join(
    dirname(communityRoot),
    `.${packageName}.backup-${process.pid}`
  );

  await rm(temporaryTarget, { force: true, recursive: true });
  await rm(backupTarget, { force: true, recursive: true });

  let previousInstallMoved = false;
  try {
    await cp(releasePackage, temporaryTarget, { recursive: true });
    await verifyPackage(temporaryTarget, version);

    if (await pathExists(installTarget)) {
      await rename(installTarget, backupTarget);
      previousInstallMoved = true;
    }

    await rename(temporaryTarget, installTarget);
    previousInstallMoved = false;
    await rm(backupTarget, { force: true, recursive: true });
  } catch (error) {
    if (previousInstallMoved && !(await pathExists(installTarget))) {
      await rename(backupTarget, installTarget);
      previousInstallMoved = false;
    }
    throw error;
  } finally {
    await rm(temporaryTarget, { force: true, recursive: true });
    if (!previousInstallMoved) {
      await rm(backupTarget, { force: true, recursive: true });
    }
  }

  return {
    installTarget,
    packageVersion: verification.manifest.package_version,
  };
}
