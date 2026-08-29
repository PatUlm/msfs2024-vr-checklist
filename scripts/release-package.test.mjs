import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  assertCompanionInstallDirectory,
  assertManagedWindowsDirectory,
  companionName,
  readProjectVersion,
  toWindowsPath,
  validateArtifactVersion,
  validateProjectVersionSources,
  validateReleaseVersion,
  verifyCompanion,
  verifyPackage,
} from "./lib/msfs-release.mjs";

const temporaryRoots = [];
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

after(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((path) =>
      rm(path, {
        force: true,
        recursive: true,
      })
    )
  );
});

test("release versions use SemVer and legacy artifacts remain selectable", () => {
  assert.equal(validateReleaseVersion("0.1.1"), "0.1.1");
  assert.equal(validateReleaseVersion("1.0.0"), "1.0.0");
  assert.throws(() => validateReleaseVersion("2026.08"), /MAJOR\.MINOR\.PATCH/);
  assert.throws(() => validateReleaseVersion("01.2.3"), /MAJOR\.MINOR\.PATCH/);
  assert.throws(() => validateReleaseVersion("0.1.1-dev.1"), /MAJOR\.MINOR\.PATCH/);
  assert.throws(() => validateReleaseVersion("../../Community2024"), /MAJOR\.MINOR\.PATCH/);
  assert.equal(validateArtifactVersion("2026.08"), "2026.08");
});

test("project version sources match the canonical VERSION file", async () => {
  assert.equal(
    await validateProjectVersionSources(repositoryRoot),
    await readProjectVersion(repositoryRoot)
  );
});

test("managed paths stay on an explicitly named Windows directory", () => {
  assert.equal(
    assertManagedWindowsDirectory(
      "/mnt/c/dev/msfs2024-vr-checklist-releases",
      "msfs2024-vr-checklist-releases",
      "Release directory"
    ),
    "/mnt/c/dev/msfs2024-vr-checklist-releases"
  );
  assert.throws(
    () =>
      assertManagedWindowsDirectory(
        "/mnt/c/dev/releases",
        "msfs2024-vr-checklist-releases",
        "Release directory"
      ),
    /must be named/
  );
  assert.throws(
    () =>
      assertManagedWindowsDirectory(
        "/tmp/msfs2024-vr-checklist-releases",
        "msfs2024-vr-checklist-releases",
        "Release directory"
      ),
    /mounted Windows drive/
  );
  assert.equal(
    assertCompanionInstallDirectory(
      "/mnt/c/Users/pilot/AppData/Local/Programs/VRChecklist Companion"
    ),
    "/mnt/c/Users/pilot/AppData/Local/Programs/VRChecklist Companion"
  );
  assert.throws(
    () =>
      assertCompanionInstallDirectory(
        "/mnt/c/dev/VRChecklist Companion"
      ),
    /AppData\/Local\/Programs/
  );
});

test("WSL paths are converted for FsPackageTool", () => {
  assert.equal(
    toWindowsPath("/mnt/c/dev/VR Checklist/Project.xml"),
    "C:\\dev\\VR Checklist\\Project.xml"
  );
  assert.throws(() => toWindowsPath("/tmp/Project.xml"), /non-Windows mount/);
});

test("package verification checks layout, release version, and source maps", async () => {
  const root = join(tmpdir(), `vr-checklist-release-test-${process.pid}`);
  temporaryRoots.push(root);
  const packageRoot = join(root, "patulm-vr-checklist");
  const files = new Map([
    ["ContentInfo/patulm-vr-checklist/Thumbnail.jpg", "thumbnail"],
    [
      "html_ui/efb_ui/efb_apps/VRChecklist/Assets/app-icon.svg",
      "<svg />",
    ],
    ["html_ui/efb_ui/efb_apps/VRChecklist/VRChecklist.css", "body{}"],
    [
      "html_ui/efb_ui/efb_apps/VRChecklist/VRChecklist.js",
      'const version="0.1.1";',
    ],
  ]);

  for (const [path, content] of files) {
    const absolutePath = join(packageRoot, path);
    await mkdir(join(absolutePath, ".."), { recursive: true });
    await writeFile(absolutePath, content);
  }

  await writeFile(
    join(packageRoot, "manifest.json"),
    JSON.stringify({ export_type: "Community", package_version: "0.1.1" })
  );
  await writeFile(
    join(packageRoot, "layout.json"),
    JSON.stringify({
      content: [...files].map(([path, content]) => ({
        path: path.toLowerCase(),
        size: Buffer.byteLength(content),
      })),
    })
  );

  const result = await verifyPackage(packageRoot, "0.1.1");
  assert.equal(result.fileCount, 4);
  assert.equal(result.manifest.package_version, "0.1.1");

  const mapPath = join(
    packageRoot,
    "html_ui/efb_ui/efb_apps/VRChecklist/VRChecklist.js.map"
  );
  await writeFile(mapPath, "{}");
  await assert.rejects(
    () => verifyPackage(packageRoot, "0.1.1"),
    /missing from layout\.json/
  );

  files.set(
    "html_ui/efb_ui/efb_apps/VRChecklist/VRChecklist.js.map",
    "{}"
  );
  await writeFile(
    join(packageRoot, "layout.json"),
    JSON.stringify({
      content: [...files].map(([path, content]) => ({
        path: path.toLowerCase(),
        size: Buffer.byteLength(content),
      })),
    })
  );
  await assert.rejects(
    () => verifyPackage(packageRoot, "0.1.1"),
    /contains a source map/
  );
});

test("companion verification requires an EXE and excludes SimConnect", async () => {
  const root = join(tmpdir(), `vr-checklist-companion-test-${process.pid}`);
  temporaryRoots.push(root);
  await mkdir(root, { recursive: true });

  for (const fileName of [
    `${companionName}.exe`,
    `${companionName}.dll`,
    `${companionName}.deps.json`,
    `${companionName}.runtimeconfig.json`,
    "THIRD-PARTY-NOTICES.md",
  ]) {
    await writeFile(join(root, fileName), fileName);
  }
  await writeFile(join(root, "VERSION"), "0.3.0\n");

  const result = await verifyCompanion(root, "0.3.0");
  assert.equal(result.version, "0.3.0");

  await writeFile(join(root, "SimConnect.dll"), "not redistributable");
  await assert.rejects(
    () => verifyCompanion(root, "0.3.0"),
    /forbidden file: SimConnect\.dll/
  );
});
