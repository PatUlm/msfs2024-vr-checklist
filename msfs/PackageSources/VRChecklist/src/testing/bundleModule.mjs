import { Buffer } from "node:buffer";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

/**
 * Bundles one TypeScript module with esbuild and imports the result. Only
 * modules without a `@microsoft/msfs-sdk` import can be loaded this way: the
 * SDK expects simulator globals such as `SimVar` at import time.
 */
export async function importBundledModule(moduleUrl) {
  const buildResult = await build({
    entryPoints: [fileURLToPath(moduleUrl)],
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2017",
    write: false,
  });
  const code = buildResult.outputFiles[0].text;
  return import(
    `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
  );
}
