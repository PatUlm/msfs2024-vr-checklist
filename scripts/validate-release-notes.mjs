#!/usr/bin/env node

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateReleaseNotesFiles } from "./lib/release-notes.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const document = await validateReleaseNotesFiles(repositoryRoot);

console.log(`Validated ${document.releases.length} companion release-note versions.`);
