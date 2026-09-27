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
import { crc32, deflateRawSync } from "node:zlib";
import {
  companionNoticeProblems,
  readNotices,
  writeLicenseFiles,
} from "./notices.mjs";

export const packageName = "patulm-vr-checklist";
export const companionName = "VRChecklist.Companion";
// Velopack installs below %LOCALAPPDATA%\<packId>; the packId is companionName.
export const companionInstallDirectoryName = companionName;
export const companionSetupName = `${companionName}-win-Setup.exe`;
export const stagingDirectoryName = "msfs2024-vr-checklist-staging";
export const releaseDirectoryName = "msfs2024-vr-checklist-releases";
export const communityDirectoryName = "Community2024";

export function packageArchiveName(version) {
  return `${packageName}-${version}.zip`;
}

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
      `${packageName}.xml`
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
    !/^\/mnt\/[a-z]\/Users\/[^/]+\/AppData\/Local\/VRChecklist\.Companion$/i.test(
      resolvedPath
    )
  ) {
    throw new Error(
      `Companion install directory must be directly below a Windows user's AppData/Local directory: ${resolvedPath}`
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
    `/contentinfo/${packageName}/thumbnail.jpg`,
    "/html_ui/efb_ui/efb_apps/vrchecklist/assets/app-icon.svg",
    "/html_ui/efb_ui/efb_apps/vrchecklist/vrchecklist.css",
    "/html_ui/efb_ui/efb_apps/vrchecklist/vrchecklist.js",
  ];

  for (const suffix of requiredSuffixes) {
    if (!findFile(packageFiles.map((file) => `/${file}`), suffix)) {
      throw new Error(`Required release file is missing: ${suffix}`);
    }
  }
  for (const licenseFile of ["LICENSE.txt", "THIRD-PARTY-NOTICES.txt"]) {
    if (!packageFiles.includes(licenseFile)) {
      throw new Error(`Package root is missing ${licenseFile}.`);
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

// Verifies the self-contained payload that Velopack packs for release.
export async function verifyCompanion(companionRoot, expectedReleaseVersion) {
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
    "SimConnect.dll",
    "LICENSE.txt",
    "THIRD-PARTY-NOTICES.txt",
    "AUDIO-LICENSE.txt",
    "VERSION",
  ];

  for (const requiredFile of requiredFiles) {
    if (!files.includes(requiredFile)) {
      throw new Error(`Required companion file is missing: ${requiredFile}`);
    }
  }

  // simconnect-path.txt is a machine-local override and must not ship.
  const forbiddenFile = files.find((file) => {
    const lowerCaseFile = file.toLowerCase();
    return (
      lowerCaseFile.endsWith(".pdb") ||
      lowerCaseFile.split("/").at(-1) === "simconnect-path.txt"
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

/*
 * Completes the self-contained publish output before Velopack packs it:
 * the SimConnect.dll from the local SDK is shipped next to the EXE (ADR 0012).
 */
export async function prepareCompanionRelease({
  version,
  publishDirectory,
  sdkRoot,
  repositoryRoot,
}) {
  validateReleaseVersion(version);
  const publishRoot = resolve(publishDirectory ?? "");
  const resolvedSdkRoot = resolve(sdkRoot ?? "");
  if (!/^\/mnt\/[a-z](?:\/|$)/i.test(resolvedSdkRoot)) {
    throw new Error(`MSFS SDK root must be on a mounted Windows drive: ${sdkRoot}`);
  }

  const simConnectLibrary = join(
    resolvedSdkRoot,
    "SimConnect SDK",
    "lib",
    "SimConnect.dll"
  );
  for (const requiredPath of [
    join(publishRoot, `${companionName}.exe`),
    simConnectLibrary,
  ]) {
    if (!(await pathExists(requiredPath))) {
      throw new Error(`Required companion release input is missing: ${requiredPath}`);
    }
  }

  for (const file of await listPackageFiles(publishRoot)) {
    if (file.toLowerCase().endsWith(".pdb")) {
      await rm(join(publishRoot, file));
    }
  }
  await cp(simConnectLibrary, join(publishRoot, "SimConnect.dll"));
  const notices = await readNotices(repositoryRoot);
  const problems = companionNoticeProblems(
    notices,
    await readJson(join(publishRoot, `${companionName}.deps.json`))
  );
  if (problems.length > 0) {
    throw new Error(
      `Update licenses/notices.json for the shipped packages: ${problems.join("; ")}`
    );
  }
  await writeLicenseFiles(publishRoot, repositoryRoot, notices, "companion");
  await writeFile(join(publishRoot, "VERSION"), `${version}\n`);

  return verifyCompanion(publishRoot, version);
}

export async function verifyCompanionPackage(packageDirectory, expectedReleaseVersion) {
  const resolvedRoot = resolve(packageDirectory ?? "");
  const files = await listPackageFiles(resolvedRoot);
  const requiredFiles = [
    companionSetupName,
    `${companionName}-${expectedReleaseVersion}-full.nupkg`,
    "releases.win.json",
  ];

  for (const requiredFile of requiredFiles) {
    if (!files.includes(requiredFile)) {
      throw new Error(`Required companion package file is missing: ${requiredFile}`);
    }
  }

  const feed = await readJson(join(resolvedRoot, "releases.win.json"));
  const fullRelease = feed.Assets?.find(
    (asset) => asset.Type === "Full" && asset.Version === expectedReleaseVersion
  );
  if (!fullRelease || fullRelease.PackageId !== companionName) {
    throw new Error(
      `Companion update feed has no full release ${expectedReleaseVersion}.`
    );
  }

  return {
    fileCount: files.length,
    root: resolvedRoot,
  };
}

function toDosDateTime(date) {
  return {
    date:
      ((date.getFullYear() - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate(),
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2),
  };
}

/*
 * Writes a plain deflate ZIP whose single top-level folder is the source
 * directory name, so players can extract it directly into Community.
 */
export async function createZipArchive(sourceDirectory, archivePath, date = new Date()) {
  const sourceRoot = resolve(sourceDirectory);
  const rootName = basename(sourceRoot);
  const { date: dosDate, time: dosTime } = toDosDateTime(date);
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  const files = (await listPackageFiles(sourceRoot)).sort();
  for (const file of files) {
    const name = Buffer.from(`${rootName}/${file}`, "utf8");
    const data = await readFile(join(sourceRoot, file));
    const compressed = deflateRawSync(data);
    const checksum = crc32(data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localParts.push(localHeader, name, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);

    offset += localHeader.length + name.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);

  await writeFile(archivePath, Buffer.concat([...localParts, centralDirectory, end]));
  return { fileCount: files.length };
}

function runWindowsExecutable(executable, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(executable, args, { stdio: "inherit" });

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      reject(
        new Error(
          `${basename(executable)} failed${signal ? ` with signal ${signal}` : ` with exit code ${code}`}.`
        )
      );
    });
  });
}

export async function buildRelease({
  version,
  stagingDirectory,
  companionPackageDirectory,
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

  await runWindowsExecutable(packageTool, [
    toWindowsPath(projectFile),
    "-rebuild",
    "-mirroring",
    "-nopause",
  ]);
  const verification = await verifyPackage(packageOutput, version);
  if (verification.manifest.package_version !== version) {
    throw new Error(
      `MSFS package version ${verification.manifest.package_version} does not match release ${version}.`
    );
  }
  const companionPackage = await verifyCompanionPackage(
    companionPackageDirectory,
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
    await createZipArchive(
      join(temporaryTarget, packageName),
      join(temporaryTarget, packageArchiveName(version))
    );
    await cp(companionPackage.root, join(temporaryTarget, companionName), {
      recursive: true,
    });
    await verifyCompanionPackage(join(temporaryTarget, companionName), version);
    await writeFile(
      join(temporaryTarget, "release.json"),
      `${JSON.stringify(
        {
          schemaVersion: 3,
          packageName,
          packageArchive: packageArchiveName(version),
          companionName,
          companionSetup: companionSetupName,
          releaseVersion: version,
          packageVersion: verification.manifest.package_version,
          companionVersion: version,
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
    companionVersion: version,
    packageVersion: verification.manifest.package_version,
    releaseTarget,
  };
}

export const retainedReleaseLines = 3;

/*
 * Selects release folders outside the newest MAJOR.MINOR lines. Legacy CalVer
 * releases predate all SemVer releases; other entries are never selected.
 */
export function selectPrunableReleases(names, keep = []) {
  const releaseLine = (version) => version.split(".").slice(0, 2).join(".");
  const lines = [
    ...new Set(
      names
        .filter((name) => semanticVersionPattern.test(name))
        .map((name) => name.split(".").map(Number))
        .sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2])
        .map((parts) => releaseLine(parts.join(".")))
    ),
  ];
  const retained = new Set(lines.slice(-retainedReleaseLines));

  return names.filter(
    (name) =>
      !keep.includes(name) &&
      (semanticVersionPattern.test(name)
        ? !retained.has(releaseLine(name))
        : legacyCalVerPattern.test(name))
  );
}

export async function pruneReleases({ releaseDirectory, communityDirectory }) {
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

  // The Community junction points into a release; never delete that one.
  const keep = [];
  try {
    const linked = relative(
      await realpath(releaseRoot),
      await realpath(join(communityRoot, packageName))
    );
    if (linked && !linked.startsWith("..")) {
      keep.push(linked.split(sep)[0]);
    }
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  const entries = await readdir(releaseRoot, { withFileTypes: true });
  const removed = selectPrunableReleases(
    entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name),
    keep
  );
  for (const name of removed) {
    await rm(join(releaseRoot, name), { force: true, recursive: true });
  }

  return { removed, linkedRelease: keep[0] };
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
    ![1, 2, 3].includes(metadata.schemaVersion) ||
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

/*
 * Runs the release's Velopack setup unattended, exactly like a player's
 * install. It installs to %LOCALAPPDATA%\VRChecklist.Companion, closes a
 * running companion, and replaces an existing installation.
 */
export async function installCompanionRelease({
  version,
  releaseDirectory,
  installDirectory,
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
    metadata.schemaVersion !== 3 ||
    metadata.companionName !== companionName ||
    metadata.releaseVersion !== version ||
    metadata.companionVersion !== version
  ) {
    throw new Error(
      `Release metadata has no matching companion installer for version ${version}.`
    );
  }

  const releaseCompanion = join(releaseTarget, companionName);
  await verifyCompanionPackage(releaseCompanion, version);
  await runWindowsExecutable(join(releaseCompanion, companionSetupName), [
    "--silent",
  ]);

  const installedVersionPath = join(installTarget, "current", "VERSION");
  if (!(await pathExists(installedVersionPath))) {
    throw new Error(
      `Setup did not install the companion to the configured directory: ${installTarget}`
    );
  }
  const installedVersion = (await readFile(installedVersionPath, "utf8")).trim();
  if (installedVersion !== version) {
    throw new Error(
      `Installed companion version ${installedVersion} does not match release ${version}.`
    );
  }

  return {
    installTarget,
    companionVersion: installedVersion,
  };
}
