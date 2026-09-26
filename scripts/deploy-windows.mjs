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
import {
  efbNoticeProblems,
  readNotices,
  writeLicenseFiles,
} from "./lib/notices.mjs";

const stagingDirectoryName = "msfs2024-vr-checklist-staging";
const markerFileName = ".vr-checklist-staging.json";
const marker = {
  managedBy: "msfs2024-vr-checklist",
  schemaVersion: 1,
};

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const msfsSourceRoot = join(repositoryRoot, "msfs");
const brandingSourceRoot = join(repositoryRoot, "assets", "branding");
const appDistSource = join(
  msfsSourceRoot,
  "PackageSources",
  "VRChecklist",
  "dist"
);
const stagingArgument =
  process.argv[2] ?? "/mnt/c/dev/msfs2024-vr-checklist-staging";
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
    join(appDistSource, "VRChecklist.js"),
    join(appDistSource, "VRChecklist.css"),
    join(appDistSource, "Assets", "app-icon.svg"),
  ];

  requiredBuildFiles.push(
    join(brandingSourceRoot, "content-info-thumbnail.jpg")
  );

  for (const requiredFile of requiredBuildFiles) {
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
      `Refusing to modify non-empty, unmanaged staging directory: ${stagingRoot}`
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

async function prepareDeployment(tempRoot) {
  await mkdir(join(tempRoot, "PackageSources", "VRChecklist"), {
    recursive: true,
  });
  await mkdir(join(tempRoot, "Branding", "ContentInfo"), {
    recursive: true,
  });
  await cp(
    join(msfsSourceRoot, "VRChecklistProject.xml"),
    join(tempRoot, "VRChecklistProject.xml")
  );
  await cp(
    join(msfsSourceRoot, "PackageDefinitions"),
    join(tempRoot, "PackageDefinitions"),
    {
      recursive: true,
    }
  );
  await cp(
    appDistSource,
    join(tempRoot, "PackageSources", "VRChecklist", "dist"),
    {
      recursive: true,
    }
  );
  await cp(
    join(brandingSourceRoot, "content-info-thumbnail.jpg"),
    join(tempRoot, "Branding", "ContentInfo", "thumbnail.jpg")
  );

  // The package definition copies these license files into the package root.
  const notices = await readNotices(repositoryRoot);
  const problems = await efbNoticeProblems(repositoryRoot, notices);
  if (problems.length > 0) {
    throw new Error(
      `Update licenses/notices.json for the EFB app: ${problems.join("; ")}`
    );
  }
  await mkdir(join(tempRoot, "PackageSources", "Licenses"), { recursive: true });
  await writeLicenseFiles(
    join(tempRoot, "PackageSources", "Licenses"),
    repositoryRoot,
    notices,
    "efb"
  );
}

async function replaceManagedInputs(tempRoot) {
  const targetProject = join(stagingRoot, "VRChecklistProject.xml");
  const targetDefinitions = join(stagingRoot, "PackageDefinitions");
  const targetApp = join(stagingRoot, "PackageSources", "VRChecklist");
  const targetLicenses = join(stagingRoot, "PackageSources", "Licenses");
  const targetBranding = join(stagingRoot, "Branding");

  await rm(targetProject, { force: true });
  await rm(targetDefinitions, { force: true, recursive: true });
  await rm(targetApp, { force: true, recursive: true });
  await rm(targetLicenses, { force: true, recursive: true });
  await rm(targetBranding, { force: true, recursive: true });

  await mkdir(join(stagingRoot, "PackageSources"), { recursive: true });
  await rename(join(tempRoot, "VRChecklistProject.xml"), targetProject);
  await rename(join(tempRoot, "PackageDefinitions"), targetDefinitions);
  await rename(join(tempRoot, "PackageSources", "VRChecklist"), targetApp);
  await rename(join(tempRoot, "PackageSources", "Licenses"), targetLicenses);
  await rename(join(tempRoot, "Branding"), targetBranding);
  await writeFile(
    join(stagingRoot, markerFileName),
    `${JSON.stringify(marker, null, 2)}\n`
  );
}

assertSafeStagingRoot();
await assertSourceBuild();
await assertManagedOrEmptyTarget();

await mkdir(dirname(stagingRoot), { recursive: true });
await mkdir(stagingRoot, { recursive: true });

const tempRoot = join(
  dirname(stagingRoot),
  `.${stagingDirectoryName}.deploy-${process.pid}`
);
await rm(tempRoot, { force: true, recursive: true });

try {
  await prepareDeployment(tempRoot);
  await replaceManagedInputs(tempRoot);
} finally {
  await rm(tempRoot, { force: true, recursive: true });
}

console.log(`Deployed VR Checklist package inputs to ${stagingRoot}`);
console.log(
  "Preserved MSFS-generated Packages, PackagesMetadata and _PackageInt directories."
);
