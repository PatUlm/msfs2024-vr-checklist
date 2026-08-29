import {
  access,
  cp,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const stagingDirectoryName =
  "msfs2024-vr-checklist-companion-staging";
const markerFileName = ".vr-checklist-companion-staging.json";
const marker = {
  managedBy: "msfs2024-vr-checklist",
  schemaVersion: 1,
};

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const buildRoot = join(
  repositoryRoot,
  "companion",
  "src",
  "VRChecklist.TransportProbe",
  "bin",
  "Release",
  "net10.0"
);
const stagingArgument =
  process.argv[2] ??
  "/mnt/c/dev/msfs2024-vr-checklist-companion-staging";
const stagingRoot = resolve(stagingArgument);

function assertSafeStagingRoot() {
  if (!isAbsolute(stagingArgument)) {
    throw new Error(`Staging path must be absolute: ${stagingArgument}`);
  }

  if (!/^\/mnt\/[a-z]\//i.test(stagingRoot)) {
    throw new Error(
      `Staging path must point to a mounted Windows drive: ${stagingRoot}`
    );
  }

  if (basename(stagingRoot) !== stagingDirectoryName) {
    throw new Error(
      `Staging directory must be named ${stagingDirectoryName}: ${stagingRoot}`
    );
  }
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function assertSourceBuild() {
  const requiredBuildFiles = [
    "VRChecklist.TransportProbe.dll",
    "VRChecklist.TransportProbe.deps.json",
    "VRChecklist.TransportProbe.runtimeconfig.json",
  ];

  for (const fileName of requiredBuildFiles) {
    const requiredFile = join(buildRoot, fileName);

    if (!(await pathExists(requiredFile))) {
      throw new Error(`Required build output is missing: ${requiredFile}`);
    }
  }
}

async function assertManagedOrEmptyTarget() {
  if (!(await pathExists(stagingRoot))) {
    return;
  }

  const entries = await readdir(stagingRoot);
  if (entries.length === 0) {
    return;
  }

  const markerPath = join(stagingRoot, markerFileName);
  if (!(await pathExists(markerPath))) {
    throw new Error(
      `Refusing to replace non-empty, unmanaged staging directory: ${stagingRoot}`
    );
  }

  const existingMarker = JSON.parse(await readFile(markerPath, "utf8"));
  if (
    existingMarker.managedBy !== marker.managedBy ||
    existingMarker.schemaVersion !== marker.schemaVersion
  ) {
    throw new Error(
      `Staging marker is not owned by this project: ${markerPath}`
    );
  }
}

assertSafeStagingRoot();
await assertSourceBuild();
await assertManagedOrEmptyTarget();

await mkdir(dirname(stagingRoot), { recursive: true });

const tempRoot = join(
  dirname(stagingRoot),
  `.${stagingDirectoryName}.deploy-${process.pid}`
);
await rm(tempRoot, { force: true, recursive: true });

try {
  await cp(buildRoot, tempRoot, { recursive: true });
  await writeFile(
    join(tempRoot, markerFileName),
    `${JSON.stringify(marker, null, 2)}\n`
  );
  await writeFile(
    join(tempRoot, "VERSION"),
    await readFile(join(repositoryRoot, "VERSION"), "utf8")
  );
  await rm(stagingRoot, { force: true, recursive: true });
  await rename(tempRoot, stagingRoot);
} finally {
  await rm(tempRoot, { force: true, recursive: true });
}

console.log(`Deployed companion transport probe to ${stagingRoot}`);
