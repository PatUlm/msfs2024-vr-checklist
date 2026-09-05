import { NodeReference, Subject } from "@microsoft/msfs-sdk";
import { resolveScaling } from "./Scaling";

/*
 * The EFB shell changes the layout box of the app after the window resize
 * event, not with it (measured: within 50 ms, see docs/msfs-sdk-reference.md).
 * After each trigger the box is therefore re-measured in this bounded sequence
 * (cumulative 50, 150 and 400 ms); it stops by itself.
 */
const SCALING_SETTLE_STEPS_MS = [50, 100, 250];

export interface ScalingControllerOptions {
  /** The app root element whose layout box is the scaling basis. */
  rootRef: NodeReference<HTMLDivElement>;
  instanceId: string;
  isViewActive: () => boolean;
  /** Runs on every settle step; expected to end in `apply`. */
  onSettleStep: () => void;
}

/*
 * Applies the density profile and root font size from Scaling.ts to the view
 * and owns the settle sequence that follows each layout trigger.
 */
export class ScalingController {
  public readonly isVrProfile: Subject<boolean>;
  public readonly rootFontSize: Subject<string>;
  private readonly rootRef: NodeReference<HTMLDivElement>;
  private readonly instanceId: string;
  private readonly isViewActive: () => boolean;
  private readonly onSettleStep: () => void;
  private settleTimer: number | undefined;

  public constructor(options: ScalingControllerOptions) {
    this.rootRef = options.rootRef;
    this.instanceId = options.instanceId;
    this.isViewActive = options.isViewActive;
    this.onSettleStep = options.onSettleStep;

    // The initial values come from the viewport alone; the first `apply`
    // adds E:IS IN VR.
    const initialScaling = resolveScaling(
      false,
      window.innerWidth,
      window.innerHeight
    );
    this.isVrProfile = Subject.create(initialScaling.profile === "vr");
    this.rootFontSize = Subject.create(`${initialScaling.rootFontSizePx}px`);
  }

  /*
   * Sets density profile and root font size from the short viewport side, see
   * Scaling.ts. Runs only on resume, resize, VR change and the slow aircraft
   * fallback; unchanged results leave the DOM untouched.
   */
  public apply(isInVr: boolean): void {
    const viewport = this.measureLayoutViewport();
    const scaling = resolveScaling(isInVr, viewport.width, viewport.height);
    const isVrProfile = scaling.profile === "vr";
    const rootFontSize = `${scaling.rootFontSizePx}px`;

    if (
      isVrProfile === this.isVrProfile.get() &&
      rootFontSize === this.rootFontSize.get()
    ) {
      return;
    }

    this.isVrProfile.set(isVrProfile);
    this.rootFontSize.set(rootFontSize);
    console.info(
      `[VR Checklist] Scaling on instance ${this.instanceId}: ` +
        `profile ${scaling.profile}, root font ${rootFontSize}, ` +
        `layout box ${viewport.width}x${viewport.height}`
    );
  }

  public scheduleSettle(): void {
    this.cancelSettle();
    this.runSettleStep(0);
  }

  public cancelSettle(): void {
    if (this.settleTimer !== undefined) {
      window.clearTimeout(this.settleTimer);
      this.settleTimer = undefined;
    }
  }

  private runSettleStep(step: number): void {
    if (!this.isViewActive() || step >= SCALING_SETTLE_STEPS_MS.length) {
      return;
    }

    this.settleTimer = window.setTimeout(() => {
      this.settleTimer = undefined;
      this.onSettleStep();
      this.runSettleStep(step + 1);
    }, SCALING_SETTLE_STEPS_MS[step]);
  }

  /*
   * The layout box of the app element is the scaling basis, not the window:
   * the EFB shell frames the detached panel, so the box is smaller than the
   * window (see docs/msfs-sdk-reference.md). The window is only the fallback
   * before the element is laid out.
   */
  private measureLayoutViewport(): { width: number; height: number } {
    const element = this.rootRef.getOrDefault();
    const width = element?.clientWidth ?? 0;
    const height = element?.clientHeight ?? 0;

    if (width > 0 && height > 0) {
      return { width, height };
    }

    return { width: window.innerWidth, height: window.innerHeight };
  }
}
