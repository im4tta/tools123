// Product events for Databuddy (see app/layout.tsx). Names only, with no properties: Databuddy
// already records which page an event happened on, and nothing a person enters in a tool is sent.

import { isTrackerAvailable, track } from "@databuddy/sdk";

/** The moments that show a tool did its job. snake_case, past tense. */
export type AnalyticsEvent =
  | "result_copied" // a result was copied to the clipboard
  | "file_exported"; // a tool produced a file for download

/**
 * Sends an event when the Databuddy tracker has loaded. A no-op while it is loading or when it is
 * blocked (an ad blocker), so it never queues calls or logs warnings.
 */
export function trackEvent(name: AnalyticsEvent): void {
  if (!isTrackerAvailable()) return;
  track(name);
}
