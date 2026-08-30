type TimerCallback = () => void;

interface SnapshotRateLimiterOptions {
  intervalMs: number;
  publish: TimerCallback;
  now?: () => number;
  setTimer?: (callback: TimerCallback, delayMs: number) => number;
  clearTimer?: (timerId: number) => void;
}

/**
 * Publishes the leading state change immediately and folds every subsequent
 * change inside the rate-limit window into one trailing publication. The
 * callback builds its snapshot only when it runs, so that trailing publication
 * always represents the newest state rather than the first queued state.
 */
export class SnapshotRateLimiter {
  private readonly intervalMs: number;
  private readonly publish: TimerCallback;
  private readonly now: () => number;
  private readonly setTimer: (
    callback: TimerCallback,
    delayMs: number
  ) => number;
  private readonly clearTimer: (timerId: number) => void;
  private lastPublishedAt: number | undefined;
  private pendingTimer: number | undefined;
  private isDisposed = false;

  public constructor(options: SnapshotRateLimiterOptions) {
    this.intervalMs = options.intervalMs;
    this.publish = options.publish;
    this.now = options.now ?? (() => Date.now());
    this.setTimer =
      options.setTimer ??
      ((callback, delayMs) => window.setTimeout(callback, delayMs));
    this.clearTimer =
      options.clearTimer ?? ((timerId) => window.clearTimeout(timerId));
  }

  public requestPublish(): void {
    if (this.isDisposed || this.pendingTimer !== undefined) {
      return;
    }

    const now = this.now();
    const delayMs =
      this.lastPublishedAt === undefined
        ? 0
        : Math.max(0, this.intervalMs - (now - this.lastPublishedAt));

    if (delayMs === 0) {
      this.runPublish(this.publish);
      return;
    }

    this.pendingTimer = this.setTimer(() => {
      this.pendingTimer = undefined;

      if (!this.isDisposed) {
        this.runPublish(this.publish);
      }
    }, delayMs);
  }

  /**
   * Bypasses the rate limit for a requested response. It supersedes a pending
   * state-change publication because the immediate response already contains
   * the newest complete state.
   */
  public publishImmediately(publish: TimerCallback): void {
    if (this.isDisposed) {
      return;
    }

    this.cancelPendingTimer();
    this.runPublish(publish);
  }

  public dispose(): void {
    this.isDisposed = true;
    this.cancelPendingTimer();
  }

  private runPublish(publish: TimerCallback): void {
    this.lastPublishedAt = this.now();
    publish();
  }

  private cancelPendingTimer(): void {
    if (this.pendingTimer === undefined) {
      return;
    }

    this.clearTimer(this.pendingTimer);
    this.pendingTimer = undefined;
  }
}
