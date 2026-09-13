import {
  access,
  cp,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { spawn } from "node:child_process";

export const packageName = "patulm-vr-checklist";
export const companionName = "VRChecklist.Companion";
export const companionInstallDirectoryName = "VRChecklist Companion";
export const stagingDirectoryName = "msfs2024-vr-checklist-staging";
export const companionStagingDirectoryName =
  "msfs2024-vr-checklist-companion-staging";
export const releaseDirectoryName = "msfs2024-vr-checklist-releases";
export const communityDirectoryName = "Community2024";
const companionInstallMarkerName = ".vr-checklist-companion-install.json";

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

export function assertCompanionInstallDirectory(path) {
  const resolvedPath = assertManagedWindowsDirectory(
    path,
    companionInstallDirectoryName,
    "Companion install directory"
  );

  if (
    !/^\/mnt\/[a-z]\/Users\/[^/]+\/AppData\/Local\/Programs\/VRChecklist Companion$/i.test(
      resolvedPath
    )
  ) {
    throw new Error(
      `Companion install directory must be below a Windows user's AppData/Local/Programs directory: ${resolvedPath}`
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

async function pathEntryExists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function createWindowsDirectoryJunction(sourceDirectory, linkPath) {
  const linkWindowsPath = toWindowsPath(linkPath);
  const sourceWindowsPath = toWindowsPath(sourceDirectory);

  await new Promise((resolvePromise, reject) => {
    const child = spawn(
      "cmd.exe",
      ["/d", "/c", "mklink", "/J", linkWindowsPath, sourceWindowsPath],
      {
        cwd: dirname(linkPath),
        stdio: ["ignore", "pipe", "pipe"],
      }
    );
    let errorOutput = "";

    child.stdout.on("data", (chunk) => {
      errorOutput += chunk;
    });
    child.stderr.on("data", (chunk) => {
      errorOutput += chunk;
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      reject(
        new Error(
          `Windows junction creation failed${
            signal ? ` with signal ${signal}` : ` with exit code ${code}`
          }: ${errorOutput.trim() || "no error output"}`
        )
      );
    });
  });
}

export async function installDirectoryLink({
  sourceDirectory,
  installTarget,
  temporaryTarget,
  backupTarget,
  createDirectoryLink = createWindowsDirectoryJunction,
  verifyLinkedDirectory = async () => {},
}) {
  await rm(temporaryTarget, { force: true, recursive: true });
  await rm(backupTarget, { force: true, recursive: true });

  let previousInstallMoved = false;
  let linkedInstallPlaced = false;
  try {
    await createDirectoryLink(sourceDirectory, temporaryTarget);
    const temporaryLinkStats = await lstat(temporaryTarget);
    if (!temporaryLinkStats.isSymbolicLink()) {
      throw new Error(
        `Temporary install entry is not a directory link: ${temporaryTarget}`
      );
    }

    const [resolvedLinkTarget, resolvedSourceDirectory] = await Promise.all([
      realpath(temporaryTarget),
      realpath(sourceDirectory),
    ]);
    if (resolvedLinkTarget !== resolvedSourceDirectory) {
      throw new Error(
        `Temporary install link resolves to an unexpected target: ${resolvedLinkTarget}`
      );
    }
    await verifyLinkedDirectory(resolvedLinkTarget);

    if (await pathEntryExists(installTarget)) {
      await rename(installTarget, backupTarget);
      previousInstallMoved = true;
    }

    await rename(temporaryTarget, installTarget);
    linkedInstallPlaced = true;
    await rm(backupTarget, { force: true, recursive: true });
    previousInstallMoved = false;
  } catch (error) {
    if (linkedInstallPlaced) {
      await rm(installTarget, { force: true, recursive: true });
      linkedInstallPlaced = false;
    }
    if (previousInstallMoved && !(await pathEntryExists(installTarget))) {
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

export async function verifyCompanion(
  companionRoot,
  expectedReleaseVersion
) {
  const resolvedRoot = resolve(companionRoot);
  const rootStats = await lstat(resolvedRoot);
  if (!rootStats.isDirectory() || rootStats.isSymbolicLink()) {
    throw new Error(`Companion root must be a real directory: ${resolvedRoot}`);
  }

  const files = await listPackageFiles(resolvedRoot);
  const requiredFiles = [
    `${companionName}.exe`,
    `${companionName}.dll`,
    `${companionName}.deps.json`,
    `${companionName}.runtimeconfig.json`,
    "THIRD-PARTY-NOTICES.md",
    "VERSION",
  ];

  for (const requiredFile of requiredFiles) {
    if (!files.includes(requiredFile)) {
      throw new Error(`Required companion file is missing: ${requiredFile}`);
    }
  }

  const forbiddenFile = files.find((file) => {
    const lowerCaseFile = file.toLowerCase();
    const fileName = lowerCaseFile.split("/").at(-1);
    return (
      lowerCaseFile.endsWith(".pdb") ||
      fileName === "simconnect.dll" ||
      fileName === "simconnect-path.txt"
    );
  });
  if (forbiddenFile) {
    throw new Error(`Companion package contains a forbidden file: ${forbiddenFile}`);
  }

  const companionVersion = (
    await readFile(join(resolvedRoot, "VERSION"), "utf8")
  ).trim();
  validateArtifactVersion(companionVersion);
  if (
    expectedReleaseVersion &&
    companionVersion !== expectedReleaseVersion
  ) {
    throw new Error(
      `Companion version ${companionVersion} does not match release ${expectedReleaseVersion}.`
    );
  }

  return {
    fileCount: files.length,
    version: companionVersion,
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
  companionStagingDirectory,
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
  const companionStagingRoot = assertManagedWindowsDirectory(
    companionStagingDirectory,
    companionStagingDirectoryName,
    "Companion staging directory"
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
  const companionVerification = await verifyCompanion(
    companionStagingRoot,
    version
  );

  await mkdir(releaseRoot, { recursive: true });
  const temporaryTarget = join(releaseRoot, `.${version}.release-${process.pid}`);
  await rm(temporaryTarget, { force: true, recursive: true });

  try {
    await mkdir(temporaryTarget, { recursive: true });
    await cp(packageOutput, join(temporaryTarget, packageName), {
      recursive: true,
    });
    await cp(
      companionStagingRoot,
      join(temporaryTarget, companionName),
      {
        recursive: true,
        filter: (source) => {
          const sourceRelativePath = relative(companionStagingRoot, source);
          if (!sourceRelativePath) {
            return true;
          }

          const [topLevelName] = sourceRelativePath.split(sep);
          // simconnect-path.txt is a machine-local path written by the
          // staging deploy; the install step writes its own for the release.
          return (
            topLevelName !== "tools" &&
            topLevelName !== ".vr-checklist-companion-staging.json" &&
            topLevelName !== "simconnect-path.txt"
          );
        },
      }
    );
    await verifyCompanion(join(temporaryTarget, companionName), version);
    await writeFile(
      join(temporaryTarget, "release.json"),
      `${JSON.stringify(
        {
          schemaVersion: 2,
          packageName,
          companionName,
          releaseVersion: version,
          packageVersion: verification.manifest.package_version,
          companionVersion: companionVerification.version,
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
    companionVersion: companionVerification.version,
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
    ![1, 2].includes(metadata.schemaVersion) ||
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

  await installDirectoryLink({
    sourceDirectory: releasePackage,
    installTarget,
    temporaryTarget,
    backupTarget,
    verifyLinkedDirectory: (linkedDirectory) =>
      verifyPackage(linkedDirectory, version),
  });

  return {
    installTarget,
    linkTarget: releasePackage,
    packageVersion: verification.manifest.package_version,
  };
}

export async function installCompanionRelease({
  version,
  releaseDirectory,
  installDirectory,
  simConnectDirectory,
}) {
  validateReleaseVersion(version);
  const releaseRoot = assertManagedWindowsDirectory(
    releaseDirectory,
    releaseDirectoryName,
    "Release directory"
  );
  const installTarget = assertCompanionInstallDirectory(installDirectory);
  const releaseTarget = join(releaseRoot, version);
  const metadata = await readJson(join(releaseTarget, "release.json"));
  if (
    metadata.schemaVersion !== 2 ||
    metadata.companionName !== companionName ||
    metadata.releaseVersion !== version ||
    metadata.companionVersion !== version
  ) {
    throw new Error(
      `Release metadata has no matching companion app for version ${version}.`
    );
  }

  const releaseCompanion = join(releaseTarget, companionName);
  await verifyCompanion(releaseCompanion, version);

  let simConnectWindowsPath;
  if (simConnectDirectory) {
    const resolvedSimConnectDirectory = resolve(simConnectDirectory);
    if (!/^\/mnt\/[a-z](?:\/|$)/i.test(resolvedSimConnectDirectory)) {
      throw new Error(
        `SimConnect directory must be on a mounted Windows drive: ${simConnectDirectory}`
      );
    }
    if (!(await pathExists(join(resolvedSimConnectDirectory, "SimConnect.dll")))) {
      throw new Error(
        `SimConnect.dll is missing from configured directory: ${resolvedSimConnectDirectory}`
      );
    }
    simConnectWindowsPath = toWindowsPath(resolvedSimConnectDirectory);
  }

  if (await pathExists(installTarget)) {
    const installStats = await lstat(installTarget);
    if (!installStats.isDirectory() || installStats.isSymbolicLink()) {
      throw new Error(
        `Companion install target must be a real directory: ${installTarget}`
      );
    }

    const entries = await readdir(installTarget);
    if (entries.length > 0) {
      const markerPath = join(installTarget, companionInstallMarkerName);
      if (!(await pathExists(markerPath))) {
        throw new Error(
          `Refusing to replace non-empty, unmanaged companion install directory: ${installTarget}`
        );
      }
      const existingMarker = await readJson(markerPath);
      if (
        existingMarker.managedBy !== "msfs2024-vr-checklist" ||
        existingMarker.schemaVersion !== 1
      ) {
        throw new Error(
          `Companion install marker is not owned by this project: ${markerPath}`
        );
      }
    }
  }

  const installParent = dirname(installTarget);
  const temporaryTarget = join(
    installParent,
    `.${companionInstallDirectoryName}.install-${process.pid}`
  );
  const backupTarget = join(
    installParent,
    `.${companionInstallDirectoryName}.backup-${process.pid}`
  );
  await mkdir(installParent, { recursive: true });
  await rm(temporaryTarget, { force: true, recursive: true });
  await rm(backupTarget, { force: true, recursive: true });

  let previousInstallMoved = false;
  try {
    await cp(releaseCompanion, temporaryTarget, { recursive: true });
    if (simConnectWindowsPath) {
      await writeFile(
        join(temporaryTarget, "simconnect-path.txt"),
        `${simConnectWindowsPath}\n`
      );
    }
    await writeFile(
      join(temporaryTarget, companionInstallMarkerName),
      `${JSON.stringify(
        {
          managedBy: "msfs2024-vr-checklist",
          schemaVersion: 1,
          version,
        },
        null,
        2
      )}\n`
    );
    await verifyCompanion(temporaryTarget, version);

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
    companionVersion: version,
  };
}
