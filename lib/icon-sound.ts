// "Icon sounds" setting: whether the animated Jiggicons in the interface play their short sound when pressed.
// Off by default; the visitor turns it on in Settings. Stored in this browser only.
import { useSyncExternalStore } from "react";
import { STORAGE_KEYS, storage } from "@/lib/storage";

const EVENT = "toolbox:icon-sound";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function getIconSound(): boolean {
  return storage.get<boolean>(STORAGE_KEYS.iconSound, false) === true;
}

export function setIconSound(on: boolean) {
  storage.set(STORAGE_KEYS.iconSound, on);
  window.dispatchEvent(new Event(EVENT));
}

export function useIconSound(): boolean {
  return useSyncExternalStore(subscribe, getIconSound, () => false);
}
