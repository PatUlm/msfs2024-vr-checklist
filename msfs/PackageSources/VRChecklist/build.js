const globalExternals = require("@fal-works/esbuild-plugin-global-externals");
const { typecheckPlugin } = require("@jgoz/esbuild-plugin-typecheck");
const esbuild = require("esbuild");
const fs = require("node:fs");
const postcss = require("postcss");
const postCssUrl = require("postcss-url");
const postcssPrefixSelector = require("postcss-prefix-selector");
const sassPlugin = require("esbuild-sass-plugin");
const path = require("node:path");

require("dotenv").config({ path: __dirname + "/.env" });

const env = {
  typechecking: process.env.TYPECHECKING === "true",
  sourcemaps: process.env.SOURCE_MAPS === "true",
  minify: process.env.MINIFY === "true",
};

const appDirectoryName = path.basename(__dirname);
const projectVersionSource = path.resolve(__dirname, "../../../VERSION");
const appIconSource = path.resolve(
  __dirname,
  "../../../assets/branding/app-icon.svg"
);

function copyBrandingAssets() {
  return {
    name: "copy-branding-assets",
    setup(build) {
      build.onEnd((result) => {
        if (result.errors.length > 0) {
          return;
        }

        const appIconTarget = path.resolve(__dirname, "dist/Assets/app-icon.svg");
        fs.mkdirSync(path.dirname(appIconTarget), { recursive: true });
        fs.copyFileSync(appIconSource, appIconTarget);
      });
    },
  };
}

function readProjectVersion() {
  const version = fs.readFileSync(projectVersionSource, "utf8").trim();
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
    throw new Error(`Project VERSION must use MAJOR.MINOR.PATCH: ${version}`);
  }

  return version;
}

function createDevelopmentVersion(version, date = new Date()) {
  const timestamp = date.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `${version}-dev.${timestamp}`;
}

const projectVersion = readProjectVersion();
const appVersion =
  process.env.VR_CHECKLIST_VERSION || createDevelopmentVersion(projectVersion);

const baseConfig = {
  entryPoints: ["src/VRChecklist.tsx"],
  keepNames: true,
  bundle: true,
  outdir: "dist",
  sourcemap: env.sourcemaps,
  minify: env.minify,
  logLevel: "debug",
  loader: {
    ".html": "copy",
  },
  target: "es2017",
  define: {
    APP_VERSION: JSON.stringify(appVersion),
    BASE_URL: `"coui://html_ui/efb_ui/efb_apps/${appDirectoryName}"`,
  },
  plugins: [
    copyBrandingAssets(),
    globalExternals.globalExternals({
      "@microsoft/msfs-sdk": {
        varName: "msfssdk",
        type: "cjs",
      },
      "@workingtitlesim/garminsdk": {
        varName: "garminsdk",
        type: "cjs",
      },
    }),
    sassPlugin.sassPlugin({
      async transform(source) {
        const { css } = await postcss([
          postCssUrl({
            url: "copy",
          }),
          postcssPrefixSelector({
            prefix: `.efb-view.${appDirectoryName}`,
          }),
        ]).process(source, { from: undefined });
        return css;
      },
    }),
  ],
};

if (env.typechecking) {
  baseConfig.plugins.push(
    typecheckPlugin({ watch: process.env.SERVING_MODE === "WATCH" })
  );
}

if (process.env.SERVING_MODE === "WATCH") {
  esbuild.context(baseConfig).then((ctx) => ctx.watch());
} else if (process.env.SERVING_MODE === "SERVE") {
  esbuild
    .context(baseConfig)
    .then((ctx) => ctx.serve({ port: process.env.PORT_SERVER }));
} else if (["", undefined].includes(process.env.SERVING_MODE)) {
  esbuild.build(baseConfig);
} else {
  console.error(`MODE ${process.env.SERVING_MODE} is unknown`);
}
