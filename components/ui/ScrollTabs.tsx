"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

export interface ScrollTab {
  id: string;
  label: string;
}

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A horizontally scrollable tab strip that works with every input: touch swipe, mouse wheel (a vertical
 * wheel scrolls it sideways while it can still move), click-and-drag, edge arrow buttons, and the arrow /
 * Home / End keys (which also select the tab). The active tab is always scrolled into view. Colours come
 * from the surrounding `.lexicon` tokens (--lx-*), so it is meant to sit inside a Lexicon.
 */
export function ScrollTabs({
  tabs,
  active,
  onChange,
  ariaLabel,
  controls,
}: {
  tabs: ScrollTab[];
  active: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  /** id of the region the tabs filter (aria-controls). */
  controls?: string;
}) {
  const { text: t } = useLanguage();
  const host = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ left: false, right: false });
  const drag = useRef({ down: false, moved: false, startX: 0, startLeft: 0, suppressClick: false });

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const left = el.scrollLeft > 2;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setEdge((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
  }, []);

  // Keep the edge buttons in sync with scrolling and with size changes (fonts loading, language switch, window resize).
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const frame = requestAnimationFrame(measure);
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [measure, tabs]);

  // Mouse wheel: a vertical wheel over the strip scrolls it sideways, but only while it can still move that way,
  // so the page is never trapped. Needs a non-passive native listener to call preventDefault.
  useEffect(() => {
    const el = scroller.current;
    const area = host.current;
    if (!el || !area) return;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      const next = Math.min(max, Math.max(0, el.scrollLeft + delta));
      if (next === el.scrollLeft) return;
      event.preventDefault();
      el.scrollLeft = next;
    };
    area.addEventListener("wheel", onWheel, { passive: false });
    return () => area.removeEventListener("wheel", onWheel);
  }, []);

  // Keep the selected tab visible.
  useEffect(() => {
    const el = scroller.current;
    const tab = el?.querySelector<HTMLElement>(`[data-tab-id="${CSS.escape(active)}"]`);
    if (!el || !tab) return;
    const pad = 32;
    const behavior = prefersReducedMotion() ? "auto" : "smooth";
    if (tab.offsetLeft < el.scrollLeft + pad) el.scrollTo({ left: Math.max(0, tab.offsetLeft - pad), behavior });
    else if (tab.offsetLeft + tab.offsetWidth > el.scrollLeft + el.clientWidth - pad) el.scrollTo({ left: tab.offsetLeft + tab.offsetWidth - el.clientWidth + pad, behavior });
  }, [active, tabs]);

  const nudge = (direction: -1 | 1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: direction * Math.max(160, el.clientWidth * 0.7), behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0 || !scroller.current) return;
    drag.current = { down: true, moved: false, startX: event.clientX, startLeft: scroller.current.scrollLeft, suppressClick: false };
  }
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    const el = scroller.current;
    if (!d.down || !el) return;
    const dx = event.clientX - d.startX;
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true;
      el.setPointerCapture(event.pointerId);
    }
    if (d.moved) el.scrollLeft = d.startLeft - dx;
  }
  function endDrag() {
    const d = drag.current;
    if (d.moved) d.suppressClick = true; // the click that follows a drag must not select a tab
    d.down = false;
    d.moved = false;
    setTimeout(() => {
      drag.current.suppressClick = false;
    }, 0);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((tab) => tab.id === active);
    let next = -1;
    if (event.key === "ArrowRight") next = Math.min(tabs.length - 1, index + 1);
    else if (event.key === "ArrowLeft") next = Math.max(0, index - 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    if (next < 0 || next === index) return;
    event.preventDefault();
    onChange(tabs[next].id);
    scroller.current?.querySelector<HTMLElement>(`[data-tab-id="${CSS.escape(tabs[next].id)}"]`)?.focus({ preventScroll: true });
  }

  const arrow =
    "absolute top-0 bottom-0 z-10 flex w-9 items-center text-[var(--lx-ink-dim)] transition-opacity hover:text-[var(--lx-ink)] focus-visible:opacity-100";

  return (
    <div ref={host} className="group/tabs relative">
      {edge.left && (
        <button type="button" tabIndex={-1} aria-label={t("Scroll categories left", "រំកិលប្រភេទទៅឆ្វេង")} onClick={() => nudge(-1)} className={`${arrow} left-0 justify-start bg-gradient-to-r from-[var(--lx-paper)] via-[var(--lx-paper)] to-transparent`}>
          <ChevronLeft size={18} aria-hidden />
        </button>
      )}
      {edge.right && (
        <button type="button" tabIndex={-1} aria-label={t("Scroll categories right", "រំកិលប្រភេទទៅស្តាំ")} onClick={() => nudge(1)} className={`${arrow} right-0 justify-end bg-gradient-to-l from-[var(--lx-paper)] via-[var(--lx-paper)] to-transparent`}>
          <ChevronRight size={18} aria-hidden />
        </button>
      )}
      <div
        ref={scroller}
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation="horizontal"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(event) => {
          if (drag.current.suppressClick) {
            event.stopPropagation();
            event.preventDefault();
          }
        }}
        onKeyDown={onKeyDown}
        className="relative flex cursor-grab gap-5 overflow-x-auto border-b border-[var(--lx-line)] px-5 [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              data-tab-id={tab.id}
              aria-selected={selected}
              aria-controls={controls}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={`lx-caps -mb-px shrink-0 select-none whitespace-nowrap border-b-2 py-2.5 transition-colors ${
                selected ? "border-[var(--lx-accent)] text-[var(--lx-ink)]" : "border-transparent text-[var(--lx-ink-faint)] hover:text-[var(--lx-ink)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
