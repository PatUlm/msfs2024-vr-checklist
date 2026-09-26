# MSFS EFB package sources

`VRChecklist/` started from the official MSFS 2024 SDK 1.7.3 EFB Template
Sample. Its build and editor configuration (`build.js`, `tsconfig.json`,
`package.json`, `.env`, `VRChecklist.code-workspace`) still largely follows the
template and is therefore not covered by the project's MIT License; the
application code in `src/` is the project's own.

`efb_api/` (Asobo EFB API) and `vendor/` (`@microsoft/msfs-sdk` package) are
not versioned: the SDK EULA (section 1(b)) forbids external distribution of
sample content. `task install` copies both from the EFB sample of the local SDK
configured in `VR_CHECKLIST_MSFS_SDK_ROOT`. The installed SDK stays read-only.

Use the repository-level tasks documented in
[development.md](../../docs/development.md) to install, build and deploy the
app. Do not run builds in the installed SDK sample.
