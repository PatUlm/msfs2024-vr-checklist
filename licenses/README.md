# Third-party license texts

This directory holds the license texts that the release artifacts must carry,
verbatim from the exact shipped version. `notices.json` assigns each shipped
component its version, source, target artifact (`companion`, `efb`) and texts
in the folder named by its `id`. The release scripts render them into
`THIRD-PARTY-NOTICES.txt` and add the project `LICENSE` as `LICENSE.txt`; the
companion also receives the audio terms as `AUDIO-LICENSE.txt`. The overview
with primary sources is [third-party-licenses.md](../docs/third-party-licenses.md).

## Updating

When a shipped dependency changes, replace its texts with the files from the new
package version (NuGet package, or the repository at the commit named in its
`.nuspec`) and update version and source in `notices.json`. `task release`
refuses a companion whose `deps.json` ships a package without matching entry;
deploying the EFB app refuses an EFB API version without matching entry.

Velopack's Setup, Update.exe and stub statically link Rust crates. After a
Velopack update, regenerate `velopack/rust-crates.txt` from the Velopack commit
named in its `.nuspec` with [cargo-about](https://github.com/EmbarkStudios/cargo-about)
and the configuration next to it, for example in a `rust` container:

```sh
cp licenses/velopack/about.toml <velopack>/src/bins/about.toml
cargo about generate --manifest-path <velopack>/src/bins/Cargo.toml \
  --features windows --locked -c <velopack>/src/bins/about.toml \
  -o rust-crates.txt licenses/velopack/about.hbs
```

Also recheck the natively linked parts that cargo-about does not cover: the
Zstandard license in `zstd-sys` and the WebView2 SDK license and notice for the
loader version linked by `webview2-com-sys`.
