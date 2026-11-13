// Product events for Databuddy (see app/layout.tsx). Names only, with no properties: Databuddy
// already records which page an event happened on, and nothing a person enters in a tool is sent.

import { isTrackerAvailable, track } from "@databuddy/sdk";

/** The moments that show a tool did its job. snake_case, past tense. */
export type AnalyticsEvent =
  | "result_copied" // a result was copied to the clipboard
  | "file_exported"; // a tool produced a file for download

/**
 * Sends an event when Databuddy is running. A no-op where it is not configured (local builds,
 * forks) or the tracker is blocked, so it never queues calls or logs warnings there.
 */
export function trackEvent(name: AnalyticsEvent): void {
  if (!process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID || !isTrackerAvailable()) return;
  track(name);
}
