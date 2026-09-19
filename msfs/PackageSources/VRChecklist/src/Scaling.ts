/*
 * Viewport-proportional scaling, see "Dichteprofile" in
 * docs/design-decisions.md. The root font size of the app element is
 * the short side of its layout box divided by a profile constant; every
 * stylesheet length follows it in em, so every viewport of a profile shows
 * the same content and only the physical size differs. The basis is the
 * layout box, not the window: the EFB shell frames the detached panel, so
 * the box is smaller than the window (measured boxes in
 * docs/msfs-sdk-reference.md).
 */

export type DensityProfile = "vr" | "non-vr";

/** Mounted tablet: 17 px on the 468 px wide layout box. */
export const VR_PROFILE_DIVISOR = 27.5;

/** Detached panel outside VR: 39 em of content on the layout box width. */
export const NON_VR_PROFILE_DIVISOR = 39;

/*
 * Outside VR the mounted tablet (468 px box) also gets the VR profile. The
 * threshold sits midway between it and the detached Small panel (624 px box).
 */
export const MOUNTED_VIEWPORT_THRESHOLD_PX = 546;

export interface ScalingResult {
  readonly profile: DensityProfile;
  /** Root font size in CSS pixels, rounded to 0.1 px. */
  readonly rootFontSizePx: number;
}

export function selectDensityProfile(
  isInVr: boolean,
  shortViewportSidePx: number
): DensityProfile {
  if (isInVr || shortViewportSidePx < MOUNTED_VIEWPORT_THRESHOLD_PX) {
    return "vr";
  }

  return "non-vr";
}

export function computeRootFontSizePx(
  shortViewportSidePx: number,
  profile: DensityProfile
): number {
  const divisor =
    profile === "vr" ? VR_PROFILE_DIVISOR : NON_VR_PROFILE_DIVISOR;
  return Math.round((shortViewportSidePx / divisor) * 10) / 10;
}

export function resolveScaling(
  isInVr: boolean,
  viewportWidthPx: number,
  viewportHeightPx: number
): ScalingResult {
  const shortViewportSidePx = Math.min(viewportWidthPx, viewportHeightPx);
  const profile = selectDensityProfile(isInVr, shortViewportSidePx);
  return {
    profile,
    rootFontSizePx: computeRootFontSizePx(shortViewportSidePx, profile),
  };
}
