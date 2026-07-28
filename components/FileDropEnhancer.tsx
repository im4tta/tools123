"use client";

import { useEffect } from "react";

type DropTarget = { input: HTMLInputElement; zone: HTMLElement };

function targetAt(target: EventTarget | null): DropTarget | null {
  const element = target instanceof Element ? target : null;
  if (!element) return null;
  const directInput = element.closest<HTMLInputElement>('input[type="file"]');
  const label = element.closest<HTMLLabelElement>("label");
  const input = directInput ?? label?.querySelector<HTMLInputElement>('input[type="file"]') ??
    (label?.htmlFor ? document.getElementById(label.htmlFor) as HTMLInputElement | null : null);
  if (!input || input.type !== "file" || input.disabled) return null;
  const associatedLabel = input.closest<HTMLLabelElement>("label") ?? input.labels?.[0] ?? null;
  return { input, zone: associatedLabel ?? input };
}

function accepts(file: File, accept: string) {
  const rules = accept.split(",").map((rule) => rule.trim().toLowerCase()).filter(Boolean);
  if (!rules.length) return true;
  const name = file.name.toLowerCase(), type = file.type.toLowerCase();
  return rules.some((rule) => rule.startsWith(".") ? name.endsWith(rule) : rule.endsWith("/*") ? type.startsWith(rule.slice(0, -1)) : type === rule);
}

export function FileDropEnhancer() {
  useEffect(() => {
    const clear = () => document.querySelectorAll("[data-file-drag]").forEach((node) => node.removeAttribute("data-file-drag"));
    const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes("Files") ?? false;
    const over = (event: DragEvent) => {
      if (!hasFiles(event) || event.defaultPrevented) return;
      event.preventDefault();
      const target = targetAt(event.target);
      clear();
      if (event.dataTransfer) event.dataTransfer.dropEffect = target ? "copy" : "none";
      target?.zone.setAttribute("data-file-drag", "true");
    };
    const drop = (event: DragEvent) => {
      if (!hasFiles(event) || event.defaultPrevented) return;
      event.preventDefault();
      const target = targetAt(event.target), files = Array.from(event.dataTransfer?.files ?? []);
      clear();
      if (!target || !files.length) return;
      const accepted = files.filter((file) => accepts(file, target.input.accept)).slice(0, target.input.multiple ? undefined : 1);
      if (!accepted.length) return;
      try {
        const transfer = new DataTransfer();
        accepted.forEach((file) => transfer.items.add(file));
        target.input.files = transfer.files;
        target.input.dispatchEvent(new Event("change", { bubbles: true }));
      } catch {
        // Some embedded browsers expose DataTransfer but prohibit assigning input.files.
      }
    };
    const leave = (event: DragEvent) => {
      const target = targetAt(event.target);
      if (target && (!event.relatedTarget || !target.zone.contains(event.relatedTarget as Node))) target.zone.removeAttribute("data-file-drag");
    };
    document.addEventListener("dragover", over);
    document.addEventListener("dragleave", leave);
    document.addEventListener("drop", drop);
    document.addEventListener("dragend", clear);
    window.addEventListener("blur", clear);
    return () => {
      clear();
      document.removeEventListener("dragover", over); document.removeEventListener("dragleave", leave);
      document.removeEventListener("drop", drop); document.removeEventListener("dragend", clear); window.removeEventListener("blur", clear);
    };
  }, []);
  return null;
}
