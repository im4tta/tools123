import type { KeyboardEvent } from "react";

/**
 * onKeyDown for a non-button element that acts like a button (role="button", an expandable table
 * row, a selectable tile): Enter or Space triggers its own onClick, so the action lives in one place.
 * Use with tabIndex={0}.
 */
export function clickOnKey(event: KeyboardEvent<HTMLElement>) {
  if (event.target !== event.currentTarget) return; // a nested control handles its own keys
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    event.currentTarget.click();
  }
}
