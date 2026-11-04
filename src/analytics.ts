// Only events and logs that explain app behavior live here. Never send what a visitor pressed, or how many inputs they made.
type PostHogLogger = { info?(message: string, attributes?: Record<string, unknown>): void; warn?(message: string, attributes?: Record<string, unknown>): void };
type PostHogClient = { capture?(event: string, properties?: Record<string, unknown>): void; logger?: PostHogLogger };

const posthogClient = () => (window as Window & { posthog?: PostHogClient }).posthog;
const capture = (event: string, properties?: Record<string, unknown>) => posthogClient()?.capture?.(event, properties);
const log = (message: string, attributes?: Record<string, unknown>) => posthogClient()?.logger?.info?.(message, attributes);
const warn = (message: string, attributes?: Record<string, unknown>) => posthogClient()?.logger?.warn?.(message, attributes);

let testStartedAt = 0;

export function trackTestStarted() {
  testStartedAt = performance.now();
  capture("test_started");
  log("input test started");
}

export function trackTestStartFailed() {
  capture("test_start_failed");
  warn("input test start refused", { reason: "fullscreen_request_rejected" });
}

// Ads can't be seen during a fullscreen test, so this is time spent away from them.
export function trackTestFinished() {
  const durationSeconds = Math.round((performance.now() - testStartedAt) / 1000);
  capture("test_finished", { duration_seconds: durationSeconds });
  log("input test finished", { duration_seconds: durationSeconds });
}

export function trackAds() {
  window.addEventListener("load", () => {
    const ads = (window as Window & { adsbygoogle?: { loaded?: boolean } }).adsbygoogle;
    capture("ad_script_checked", { loaded: ads?.loaded === true });
  });

  // AdSense sets data-ad-status when a request finishes, but not on units rendered in a cross-domain window.
  new MutationObserver((mutations) => {
    for (const { target } of mutations) {
      const status = (target as Element).getAttribute("data-ad-status");
      if (status) capture("ad_slot_resolved", { status });
    }
  }).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["data-ad-status"] });
}
