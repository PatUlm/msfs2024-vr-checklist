import assert from "node:assert/strict";
import { test } from "node:test";
import { importBundledModule } from "./testing/bundleModule.mjs";

const { SnapshotRateLimiter } = await importBundledModule(
  new URL("./SnapshotRateLimiter.ts", import.meta.url)
);

class FakeClock {
  now = 0;
  nextTimerId = 1;
  timers = new Map();

  setTimer = (callback, delayMs) => {
    const timerId = this.nextTimerId++;
    this.timers.set(timerId, { callback, dueAt: this.now + delayMs });
    return timerId;
  };

  clearTimer = (timerId) => {
    this.timers.delete(timerId);
  };

  advance(delayMs) {
    const target = this.now + delayMs;

    while (true) {
      const nextTimer = Array.from(this.timers.entries())
        .filter(([, timer]) => timer.dueAt <= target)
        .sort((left, right) => left[1].dueAt - right[1].dueAt)[0];

      if (!nextTimer) {
        break;
      }

      const [timerId, timer] = nextTimer;
      this.now = timer.dueAt;
      this.timers.delete(timerId);
      timer.callback();
    }

    this.now = target;
  }
}

function createLimiter(clock, publish) {
  return new SnapshotRateLimiter({
    intervalMs: 250,
    publish,
    now: () => clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
  });
}

test("publishes the leading change and coalesces a burst to its latest state", () => {
  const clock = new FakeClock();
  const publishedStates = [];
  let currentState = "first";
  const limiter = createLimiter(clock, () =>
    publishedStates.push(currentState)
  );

  limiter.requestPublish();
  clock.advance(100);
  currentState = "middle";
  limiter.requestPublish();
  clock.advance(50);
  currentState = "latest";
  limiter.requestPublish();

  assert.deepEqual(publishedStates, ["first"]);
  clock.advance(99);
  assert.deepEqual(publishedStates, ["first"]);
  clock.advance(1);
  assert.deepEqual(publishedStates, ["first", "latest"]);
});

test("publishes a requested response immediately and supersedes queued state", () => {
  const clock = new FakeClock();
  const publications = [];
  let currentState = "first";
  const limiter = createLimiter(clock, () =>
    publications.push(`change:${currentState}`)
  );

  limiter.requestPublish();
  clock.advance(100);
  currentState = "requested";
  limiter.requestPublish();
  limiter.publishImmediately(() =>
    publications.push(`request:req-1:${currentState}`)
  );

  assert.deepEqual(publications, ["change:first", "request:req-1:requested"]);
  clock.advance(150);
  assert.deepEqual(publications, ["change:first", "request:req-1:requested"]);

  currentState = "after-request";
  limiter.requestPublish();
  clock.advance(99);
  assert.equal(publications.length, 2);
  clock.advance(1);
  assert.deepEqual(publications, [
    "change:first",
    "request:req-1:requested",
    "change:after-request",
  ]);
});

test("dispose cancels a pending trailing publication", () => {
  const clock = new FakeClock();
  let publicationCount = 0;
  const limiter = createLimiter(clock, () => {
    publicationCount += 1;
  });

  limiter.requestPublish();
  clock.advance(100);
  limiter.requestPublish();
  limiter.dispose();
  clock.advance(150);

  assert.equal(publicationCount, 1);
});
