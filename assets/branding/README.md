# Branding assets

This directory is the editable source of truth for release branding:

- `app-icon.svg` is copied into the EFB application bundle by `task build`.
- `app-icon-windows.svg` is the editable 256 × 256 source of the Windows
  companion icon: the EFB mark on a rounded dark tile so it stays visible on
  light Windows surfaces.
- `app-icon-windows.ico` is the rasterized multi-size icon (16–256 px) that the
  companion build embeds as EXE icon and window icon. Regenerate it from the
  SVG after any change, for example with ImageMagick, rendering every size
  separately instead of downscaling one render.
- `content-info-thumbnail.svg` is the editable 360 × 240 My Library thumbnail
  source with the centered product name below the checklist mark.
- `content-info-thumbnail.jpg` is the rasterized file consumed by the MSFS
  ContentInfo package group.

Keep the raster thumbnail at exactly 360 × 240 pixels and inspect both assets
at original resolution before a release. After changing the SVG thumbnail,
regenerate the JPEG without changing its dimensions.
