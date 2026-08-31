import assert from "node:assert/strict";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  assertCompanionInstallDirectory,
  assertManagedWindowsDirectory,
  companionName,
  installDirectoryLink,
  readProjectVersion,
  toWindowsPath,
  validateArtifactVersion,
  validateProjectVersionSources,
  validateReleaseVersion,
  verifyCompanion,
  verifyPackage,
} from "./lib/msfs-release.mjs";
import { validateReleaseNotes } from "./lib/release-notes.mjs";

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

test("companion release notes are complete and match changelog metadata", () => {
  const changelog = [
    "## [Unreleased]",
    "",
    "## [0.3.1] - 2026-08-30",
    "",
    "## [0.3.0] - 2026-08-29",
    "",
    "## [0.2.4] - 2026-08-29",
    "",
    "## [0.2.0] - 2026-08-27",
  ].join("\n");
  const document = {
    schemaVersion: 1,
    companionSince: "0.3.0",
    releases: [
      {
        version: "0.3.1",
        date: "2026-08-30",
        highlight: "Current companion release.",
        features: [],
        fixes: ["Keeps snapshots current."],
      },
      {
        version: "0.3.0",
        date: "2026-08-29",
        highlight: "First companion release.",
        features: ["Shows checklist state."],
        fixes: [],
      },
    ],
  };

  assert.equal(validateReleaseNotes(document, changelog, "0.3.1"), document);
  const documentWithOlderMilestone = {
    ...document,
    releases: [
      ...document.releases,
      {
        version: "0.2.0",
        date: "2026-08-27",
        highlight: "Older product milestone.",
        features: ["Adds in-sim confirmation."],
        fixes: [],
      },
    ],
  };
  assert.equal(
    validateReleaseNotes(documentWithOlderMilestone, changelog, "0.3.1"),
    documentWithOlderMilestone
  );
  assert.throws(
    () =>
      validateReleaseNotes(
        { ...document, releases: document.releases.slice(0, 1) },
        changelog,
        "0.3.1"
      ),
    /every release since 0\.3\.0/
  );
  assert.throws(
    () =>
      validateReleaseNotes(
        {
          ...document,
          releases: [
            { ...document.releases[0], date: "2026-02-30" },
            document.releases[1],
          ],
        },
        changelog,
        "0.3.1"
      ),
    /real calendar date/
  );
  assert.throws(
    () => validateReleaseNotes(document, changelog, "0.3.2"),
    /do not match VERSION/
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

test("directory link installation replaces a copy without duplicating files", async () => {
  const root = join(tmpdir(), `vr-checklist-link-test-${process.pid}`);
  temporaryRoots.push(root);
  const sourceDirectory = join(root, "releases", "0.4.2", "package");
  const installTarget = join(root, "Community2024", "package");
  const temporaryTarget = join(root, "Community2024", ".package.install");
  const backupTarget = join(root, ".package.backup");

  await mkdir(sourceDirectory, { recursive: true });
  await writeFile(join(sourceDirectory, "VERSION"), "0.4.2\n");
  await mkdir(installTarget, { recursive: true });
  await writeFile(join(installTarget, "VERSION"), "old copy\n");

  await installDirectoryLink({
    sourceDirectory,
    installTarget,
    temporaryTarget,
    backupTarget,
    createDirectoryLink: (source, link) => symlink(source, link, "dir"),
    verifyLinkedDirectory: async (linkedDirectory) => {
      assert.equal(
        await readFile(join(linkedDirectory, "VERSION"), "utf8"),
        "0.4.2\n"
      );
    },
  });

  assert.equal((await lstat(installTarget)).isSymbolicLink(), true);
  assert.equal(await realpath(installTarget), await realpath(sourceDirectory));
  assert.equal(await readFile(join(installTarget, "VERSION"), "utf8"), "0.4.2\n");
});

test("directory link installation keeps the current install when link verification fails", async () => {
  const root = join(tmpdir(), `vr-checklist-link-rollback-test-${process.pid}`);
  temporaryRoots.push(root);
  const sourceDirectory = join(root, "releases", "0.4.2", "package");
  const installTarget = join(root, "Community2024", "package");
  const temporaryTarget = join(root, "Community2024", ".package.install");
  const backupTarget = join(root, ".package.backup");

  await mkdir(sourceDirectory, { recursive: true });
  await mkdir(installTarget, { recursive: true });
  await writeFile(join(installTarget, "VERSION"), "current install\n");

  await assert.rejects(
    () =>
      installDirectoryLink({
        sourceDirectory,
        installTarget,
        temporaryTarget,
        backupTarget,
        createDirectoryLink: (source, link) => symlink(source, link, "dir"),
        verifyLinkedDirectory: async () => {
          throw new Error("verification failed");
        },
      }),
    /verification failed/
  );

  assert.equal((await lstat(installTarget)).isDirectory(), true);
  assert.equal(
    await readFile(join(installTarget, "VERSION"), "utf8"),
    "current install\n"
  );
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
