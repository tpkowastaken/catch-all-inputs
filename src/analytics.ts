// Only events that explain ad revenue live here. Never send what a visitor pressed, or how many inputs they made.
declare const posthog: { capture(event: string, properties?: Record<string, unknown>): void };

let testStartedAt = 0;

export function trackTestStarted() {
  testStartedAt = performance.now();
  posthog.capture("test_started");
}

// Ads can't be seen during a fullscreen test, so this is time spent away from them.
export function trackTestFinished() {
  posthog.capture("test_finished", { duration_seconds: Math.round((performance.now() - testStartedAt) / 1000) });
}

export function trackAds() {
  window.addEventListener("load", () => {
    const ads = (window as Window & { adsbygoogle?: { loaded?: boolean } }).adsbygoogle;
    posthog.capture("ad_script_checked", { loaded: ads?.loaded === true });
  });

  // AdSense sets data-ad-status when a request finishes, but not on units rendered in a cross-domain window.
  new MutationObserver((mutations) => {
    for (const { target } of mutations) {
      const status = (target as Element).getAttribute("data-ad-status");
      if (status) posthog.capture("ad_slot_resolved", { status });
    }
  }).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["data-ad-status"] });
}
