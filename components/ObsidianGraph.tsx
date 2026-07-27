"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Menu, Search, Star, X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { TOOLS, CATEGORY_META, CATEGORY_ORDER, Category } from "@/lib/tools";

/**
 * ObsidianGraph — a note-graph style view of the whole toolbox.
 *
 * - Category nodes act as hubs, tool nodes orbit them (mirrors Obsidian's
 *   note/tag graph, where clusters form organically from link structure).
 * - Pure canvas + rAF force simulation, no dependency, tuned for ~170 nodes
 *   so it stays smooth on a mid-range laptop.
 * - Left sidebar mirrors Obsidian's file explorer: collapsible category
 *   tree, search, click-to-focus-or-open.
 */

interface GNode {
  id: string;
  kind: "category" | "tool";
  label: string;
  category: Category;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number | null; // pinned position while dragging
  fy: number | null;
  r: number;
}

interface GLink {
  a: string;
  b: string;
}

const TAU = Math.PI * 2;

export function ObsidianGraph({
  onOpenTool,
  favorites,
  onToggleFavorite,
  onClose,
  focusCategory = null,
  onClearFocusCategory,
}: {
  onOpenTool: (id: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
  focusCategory?: Category | null;
  onClearFocusCategory?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<GNode[]>([]);
  const linksRef = useRef<GLink[]>([]);
  const nodeById = useRef<Map<string, GNode>>(new Map());
  const cameraRef = useRef({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{ id: string | null; panning: boolean; lastX: number; lastY: number; moved: boolean }>({
    id: null,
    panning: false,
    lastX: 0,
    lastY: 0,
    moved: false,
  });
  const hoverRef = useRef<string | null>(null);
  const focusCategoryRef = useRef<Category | null>(null);
  const velRef = useRef({ vx: 0, vy: 0 });
  const inertiaRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const settleRef = useRef(0);
  const didFitRef = useRef(false);
  const didSettleFitRef = useRef(false);

  const [sidebarFilter, setSidebarFilter] = useState("");
  const [collapsed, setCollapsed] = useState<Set<Category>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [, forceTick] = useState(0); // repaint sidebar highlight occasionally
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ---- responsive sidebar: auto-hidden on small screens so the graph gets
  // the full viewport, opened as an overlay drawer on demand ----
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => {
      setIsMobile(mq.matches);
      setSidebarOpen(!mq.matches);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // ---- build graph data once ----
  useEffect(() => {
    const nodes: GNode[] = [];
    const links: GLink[] = [];
    const catCount = CATEGORY_ORDER.length;

    CATEGORY_ORDER.forEach((cat, i) => {
      const angle = (i / catCount) * TAU;
      const ringR = 520;
      nodes.push({
        id: `cat:${cat}`,
        kind: "category",
        label: CATEGORY_META[cat].label,
        category: cat,
        x: Math.cos(angle) * ringR,
        y: Math.sin(angle) * ringR,
        vx: 0,
        vy: 0,
        fx: null,
        fy: null,
        r: 12,
      });
    });

    TOOLS.forEach((t) => {
      const parent = nodes.find((n) => n.id === `cat:${t.category}`)!;
      const jitterAngle = Math.random() * TAU;
      const jitterR = 40 + Math.random() * 60;
      nodes.push({
        id: t.id,
        kind: "tool",
        label: t.title,
        category: t.category,
        x: parent.x + Math.cos(jitterAngle) * jitterR,
        y: parent.y + Math.sin(jitterAngle) * jitterR,
        vx: 0,
        vy: 0,
        fx: null,
        fy: null,
        r: 4,
      });
      links.push({ a: `cat:${t.category}`, b: t.id });
    });

    nodesRef.current = nodes;
    linksRef.current = links;
    nodeById.current = new Map(nodes.map((n) => [n.id, n]));
    settleRef.current = 0;
  }, []);

  // ---- resize + camera fit ----
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  useEffect(() => {
    resize();
    const ro = new ResizeObserver(resize);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [resize]);

  // ---- colors ----
  const catColor = useMemo(() => {
    const m = new Map<Category, string>();
    CATEGORY_ORDER.forEach((c) => m.set(c, CATEGORY_META[c].color));
    return m;
  }, []);

  // ---- simulation + render loop ----
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    function step() {
      const nodes = nodesRef.current;
      const links = linksRef.current;
      const n = nodes.length;

      // Momentum: after a released pan/swipe, keep drifting and decay each
      // frame — this is what makes touch panning feel "thrown" instead of
      // stopping the instant a finger lifts.
      if (inertiaRef.current) {
        const cam = cameraRef.current;
        cam.x += velRef.current.vx;
        cam.y += velRef.current.vy;
        velRef.current.vx *= 0.91;
        velRef.current.vy *= 0.91;
        if (Math.abs(velRef.current.vx) < 0.03 && Math.abs(velRef.current.vy) < 0.03) {
          inertiaRef.current = false;
          velRef.current.vx = 0;
          velRef.current.vy = 0;
        }
      }

      // Only run physics while not settled, so idle panning/hover stays cheap.
      if (settleRef.current < 1) {
        const REPULSION = 2600;
        const SPRING = 0.02;
        const SPRING_LEN = 70;
        const CENTER = 0.0012;
        const DAMP = 0.82;

        for (let i = 0; i < n; i++) {
          const a = nodes[i];
          if (a.fx !== null) continue;
          let fx = -a.x * CENTER;
          let fy = -a.y * CENTER;
          for (let j = 0; j < n; j++) {
            if (i === j) continue;
            const b = nodes[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            let d2 = dx * dx + dy * dy;
            if (d2 < 1) d2 = 1;
            const force = REPULSION / d2;
            const d = Math.sqrt(d2);
            fx += (dx / d) * force;
            fy += (dy / d) * force;
          }
          a.vx = (a.vx + fx) * DAMP;
          a.vy = (a.vy + fy) * DAMP;
        }

        for (const l of links) {
          const a = nodeById.current.get(l.a);
          const b = nodeById.current.get(l.b);
          if (!a || !b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.max(Math.sqrt(dx * dx + dy * dy), 0.01);
          const stretch = d - SPRING_LEN;
          const fx = (dx / d) * stretch * SPRING;
          const fy = (dy / d) * stretch * SPRING;
          if (a.fx === null) {
            a.vx += fx;
            a.vy += fy;
          }
          if (b.fx === null) {
            b.vx -= fx;
            b.vy -= fy;
          }
        }

        let totalV = 0;
        for (const nd of nodes) {
          if (nd.fx !== null) {
            nd.x = nd.fx;
            nd.y = nd.fy!;
            continue;
          }
          nd.x += nd.vx;
          nd.y += nd.vy;
          totalV += Math.abs(nd.vx) + Math.abs(nd.vy);
        }
        if (totalV / n < 0.05) settleRef.current += 1;
        else settleRef.current = 0;
      }

      draw();
      if (running) rafRef.current = requestAnimationFrame(step);
    }

    function fitToView(w: number, h: number) {
      const nodes = nodesRef.current;
      if (nodes.length === 0) return;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const nd of nodes) {
        if (nd.x < minX) minX = nd.x;
        if (nd.x > maxX) maxX = nd.x;
        if (nd.y < minY) minY = nd.y;
        if (nd.y > maxY) maxY = nd.y;
      }
      const graphW = Math.max(1, maxX - minX);
      const graphH = Math.max(1, maxY - minY);
      const fitScale = Math.min((w * 0.85) / graphW, (h * 0.85) / graphH, 1.2);
      cameraRef.current.scale = Math.max(0.2, fitScale);
      cameraRef.current.x = -((minX + maxX) / 2) * cameraRef.current.scale;
      cameraRef.current.y = -((minY + maxY) / 2) * cameraRef.current.scale;
    }

    function draw() {
      const wEl = wrap!;
      const w = wEl.clientWidth;
      const h = wEl.clientHeight;

      if (!didFitRef.current && w > 0 && nodesRef.current.length > 0) {
        fitToView(w, h);
        didFitRef.current = true;
      }
      if (!didSettleFitRef.current && didFitRef.current && settleRef.current >= 1 && w > 0) {
        fitToView(w, h);
        didSettleFitRef.current = true;
      }

      ctx!.clearRect(0, 0, w, h);
      const cam = cameraRef.current;
      ctx!.save();
      ctx!.translate(w / 2 + cam.x, h / 2 + cam.y);
      ctx!.scale(cam.scale, cam.scale);

      const nodes = nodesRef.current;
      const links = linksRef.current;
      const hoveredId = hoverRef.current;
      const hovered = hoveredId ? nodeById.current.get(hoveredId) : null;
      const connected = new Set<string>();
      if (hovered) {
        for (const l of links) {
          if (l.a === hovered.id) connected.add(l.b);
          if (l.b === hovered.id) connected.add(l.a);
        }
      }

      // links
      ctx!.lineWidth = 1 / cam.scale;
      const fc = focusCategoryRef.current;
      for (const l of links) {
        const a = nodeById.current.get(l.a);
        const b = nodeById.current.get(l.b);
        if (!a || !b) continue;
        const dim = fc ? a.category !== fc : Boolean(hovered && a.id !== hovered.id && b.id !== hovered.id);
        ctx!.strokeStyle = dim ? "rgba(120,120,120,0.06)" : "rgba(150,150,150,0.22)";
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.stroke();
      }

      // nodes
      for (const nd of nodes) {
        const color = catColor.get(nd.category) || "#c9a24b";
        const isHovered = nd.id === hoveredId;
        const isConnected = connected.has(nd.id);
        const outOfFocus = fc ? nd.category !== fc : false;
        const dim = outOfFocus || (hovered && !isHovered && !isConnected);
        const isFav = favorites.includes(nd.id);
        const r = nd.kind === "category" ? nd.r : isHovered ? nd.r + 2 : nd.r;

        ctx!.globalAlpha = outOfFocus ? 0.05 : dim ? 0.28 : 1;
        ctx!.beginPath();
        ctx!.arc(nd.x, nd.y, r, 0, TAU);
        ctx!.fillStyle = nd.kind === "category" ? color : isFav ? "#c9a24b" : color;
        ctx!.fill();
        if (nd.kind === "category") {
          ctx!.lineWidth = 1.5 / cam.scale;
          ctx!.strokeStyle = "rgba(255,255,255,0.35)";
          ctx!.stroke();
        }

        // labels always shown — constant screen-space size regardless of zoom,
        // so every tool name stays legible whether zoomed in or out. Skip
        // entirely for nodes filtered out by the category focus, so the
        // filtered view actually reads as decluttered rather than just dim.
        if (outOfFocus) continue;
        ctx!.globalAlpha = dim ? 0.4 : 1;
        const screenPx = nd.kind === "category" ? 12 : 9.5;
        ctx!.font = `${nd.kind === "category" ? "600 " : ""}${screenPx / cam.scale}px "Inter", sans-serif`;
        ctx!.fillStyle = nd.kind === "category" ? "#e8e6df" : isHovered || isConnected ? "#e8e6df" : "#a9a69d";
        ctx!.textAlign = "center";
        ctx!.fillText(nd.label, nd.x, nd.y - r - 6 / cam.scale);
        ctx!.globalAlpha = 1;
      }
      ctx!.restore();
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [catColor, favorites]);

  // ---- pointer interaction: pan, zoom, drag node, click ----
  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const wrap = wrapRef.current!;
    const rect = wrap.getBoundingClientRect();
    const cam = cameraRef.current;
    const sx = clientX - rect.left - wrap.clientWidth / 2 - cam.x;
    const sy = clientY - rect.top - wrap.clientHeight / 2 - cam.y;
    return { x: sx / cam.scale, y: sy / cam.scale };
  }, []);

  const nodeAt = useCallback((wx: number, wy: number) => {
    const nodes = nodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const nd = nodes[i];
      const dx = nd.x - wx;
      const dy = nd.y - wy;
      const hitR = nd.r + 4;
      if (dx * dx + dy * dy <= hitR * hitR) return nd;
    }
    return null;
  }, []);

  const openOrFocus = useCallback(
    (nd: GNode) => {
      if (nd.kind === "tool") {
        onOpenTool(nd.id);
        setSidebarOpen((prev) => (isMobile ? false : prev));
      } else {
        // focus camera on category cluster
        const cam = cameraRef.current;
        cam.x = -nd.x * cam.scale;
        cam.y = -nd.y * cam.scale;
        setCollapsed((prev) => {
          const next = new Set(prev);
          if (next.has(nd.category)) next.delete(nd.category);
          else next.add(nd.category);
          return next;
        });
      }
    },
    [onOpenTool, isMobile]
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    // Every active touch/pen/mouse pointer, keyed by pointerId — this is
    // what makes two-finger pinch/pan possible: each finger is a separate
    // pointer event stream that we track independently.
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch: {
      dist: number;
      scale: number;
      camX: number;
      camY: number;
      midX: number;
      midY: number;
    } | null = null;

    function activePoints() {
      return Array.from(pointers.values());
    }
    function midpoint(pts: { x: number; y: number }[]) {
      return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
    }
    function distance(pts: { x: number; y: number }[]) {
      return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    }
    function startPinch() {
      const pts = activePoints();
      const mid = midpoint(pts);
      pinch = {
        dist: distance(pts),
        scale: cameraRef.current.scale,
        camX: cameraRef.current.x,
        camY: cameraRef.current.y,
        midX: mid.x,
        midY: mid.y,
      };
    }

    function onPointerDown(e: PointerEvent) {
      wrap!.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      inertiaRef.current = false;
      velRef.current.vx = 0;
      velRef.current.vy = 0;

      if (pointers.size === 1) {
        const { x, y } = screenToWorld(e.clientX, e.clientY);
        const hit = nodeAt(x, y);
        dragRef.current.lastX = e.clientX;
        dragRef.current.lastY = e.clientY;
        dragRef.current.moved = false;
        if (hit) {
          dragRef.current.id = hit.id;
          hit.fx = hit.x;
          hit.fy = hit.y;
          settleRef.current = 0;
        } else {
          dragRef.current.panning = true;
        }
      } else if (pointers.size === 2) {
        // A second finger landed — a single-finger node-drag or pan in
        // progress is superseded by the pinch gesture.
        if (dragRef.current.id) {
          const nd = nodeById.current.get(dragRef.current.id);
          if (nd) { nd.fx = null; nd.fy = null; }
        }
        dragRef.current.id = null;
        dragRef.current.panning = false;
        startPinch();
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size >= 2 && pinch) {
        const pts = activePoints();
        const mid = midpoint(pts);
        const dist = distance(pts);
        const cam = cameraRef.current;
        const newScale = Math.min(4, Math.max(0.25, pinch.scale * (dist / pinch.dist)));

        // Keep the point under the fingers fixed in world space as the
        // pinch scales, then layer the two-finger pan on top — this is
        // what makes pinch-zoom feel anchored instead of drifting.
        const rect = wrap!.getBoundingClientRect();
        const anchorSx = pinch.midX - rect.left - wrap!.clientWidth / 2;
        const anchorSy = pinch.midY - rect.top - wrap!.clientHeight / 2;
        const worldX = (anchorSx - pinch.camX) / pinch.scale;
        const worldY = (anchorSy - pinch.camY) / pinch.scale;

        const curSx = mid.x - rect.left - wrap!.clientWidth / 2;
        const curSy = mid.y - rect.top - wrap!.clientHeight / 2;

        cam.scale = newScale;
        cam.x = curSx - worldX * newScale;
        cam.y = curSy - worldY * newScale;
        return;
      }

      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;
      if (Math.abs(dx) + Math.abs(dy) > 2) dragRef.current.moved = true;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;

      if (dragRef.current.id) {
        const nd = nodeById.current.get(dragRef.current.id);
        if (nd) {
          const { x, y } = screenToWorld(e.clientX, e.clientY);
          nd.fx = x;
          nd.fy = y;
          settleRef.current = 0;
        }
      } else if (dragRef.current.panning) {
        cameraRef.current.x += dx;
        cameraRef.current.y += dy;
        // Track velocity each move so a release can carry momentum.
        velRef.current.vx = dx;
        velRef.current.vy = dy;
      } else {
        // hover detection
        const { x, y } = screenToWorld(e.clientX, e.clientY);
        const hit = nodeAt(x, y);
        const newId = hit?.id ?? null;
        if (newId !== hoverRef.current) {
          hoverRef.current = newId;
          wrap!.style.cursor = newId ? "pointer" : "grab";
        }
      }
    }

    function endPointer(e: PointerEvent) {
      const wasPanning = dragRef.current.panning;
      const wasDragId = dragRef.current.id;
      const moved = dragRef.current.moved;

      pointers.delete(e.pointerId);
      try { wrap!.releasePointerCapture(e.pointerId); } catch { /* already released */ }

      if (pointers.size >= 2) {
        // Still pinching with the remaining fingers — re-baseline so the
        // gesture continues smoothly rather than jumping.
        startPinch();
        return;
      }

      if (pointers.size === 1) {
        // One finger lifted out of a pinch/pan — resume single-finger pan
        // from the remaining finger's current position, no jump.
        const [remaining] = activePoints();
        pinch = null;
        dragRef.current.lastX = remaining.x;
        dragRef.current.lastY = remaining.y;
        dragRef.current.panning = true;
        dragRef.current.id = null;
        dragRef.current.moved = true;
        return;
      }

      // Last pointer lifted.
      pinch = null;
      if (wasDragId) {
        const nd = nodeById.current.get(wasDragId);
        if (nd) {
          if (!moved) {
            openOrFocus(nd);
            setSelected(nd.id);
          }
          // release pin shortly after so it eases back into the layout
          nd.fx = null;
          nd.fy = null;
          settleRef.current = 0;
        }
      } else if (wasPanning && moved) {
        // Hand off to inertia so a flick keeps drifting and eases out.
        inertiaRef.current = true;
      }
      dragRef.current.id = null;
      dragRef.current.panning = false;
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      inertiaRef.current = false;
      const cam = cameraRef.current;
      const factor = Math.exp(-e.deltaY * 0.001);
      const newScale = Math.min(4, Math.max(0.25, cam.scale * factor));

      // Zoom toward the cursor rather than the canvas center.
      const rect = wrap!.getBoundingClientRect();
      const sx = e.clientX - rect.left - wrap!.clientWidth / 2;
      const sy = e.clientY - rect.top - wrap!.clientHeight / 2;
      const worldX = (sx - cam.x) / cam.scale;
      const worldY = (sy - cam.y) / cam.scale;
      cam.scale = newScale;
      cam.x = sx - worldX * newScale;
      cam.y = sy - worldY * newScale;
    }

    wrap.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endPointer);
    window.addEventListener("pointercancel", endPointer);
    wrap.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      wrap.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endPointer);
      window.removeEventListener("pointercancel", endPointer);
      wrap.removeEventListener("wheel", onWheel);
    };
  }, [screenToWorld, nodeAt, openOrFocus]);

  // ---- sidebar tree data ----
  const tree = useMemo(() => {
    const q = sidebarFilter.trim().toLowerCase();
    return CATEGORY_ORDER.map((cat) => ({
      cat,
      meta: CATEGORY_META[cat],
      tools: TOOLS.filter(
        (t) => t.category === cat && (q === "" || t.title.toLowerCase().includes(q))
      ),
    })).filter((g) => g.tools.length > 0);
  }, [sidebarFilter]);

  // ---- external category filter (top-nav chips) ----
  useEffect(() => {
    focusCategoryRef.current = focusCategory;
    const wrap = wrapRef.current;
    if (!wrap) return;

    if (focusCategory) {
      const subset = nodesRef.current.filter((nd) => nd.category === focusCategory);
      if (subset.length === 0) return;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const nd of subset) {
        if (nd.x < minX) minX = nd.x;
        if (nd.x > maxX) maxX = nd.x;
        if (nd.y < minY) minY = nd.y;
        if (nd.y > maxY) maxY = nd.y;
      }
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      const gw = Math.max(1, maxX - minX);
      const gh = Math.max(1, maxY - minY);
      const fitScale = Math.min((w * 0.78) / gw, (h * 0.78) / gh, 2.4);
      const cam = cameraRef.current;
      cam.scale = Math.max(0.4, fitScale);
      cam.x = -((minX + maxX) / 2) * cam.scale;
      cam.y = -((minY + maxY) / 2) * cam.scale;
      inertiaRef.current = false;

      // Mirror the filter in the sidebar: collapse every other category so
      // "filter" means the same thing in both places at once.
      setCollapsed(new Set(CATEGORY_ORDER.filter((c) => c !== focusCategory)));
      setSidebarFilter("");
    } else {
      // Cleared — zoom back out to the whole graph, same as the fit button.
      didFitRef.current = false;
      didSettleFitRef.current = false;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(new Set());
    }
  }, [focusCategory]);

  function focusNode(id: string) {
    const nd = nodeById.current.get(id);
    if (!nd) return;
    const cam = cameraRef.current;
    cam.x = -nd.x * cam.scale;
    cam.y = -nd.y * cam.scale;
    hoverRef.current = id;
    setSelected(id);
    forceTick((v) => v + 1);
  }

  function resetView() {
    didFitRef.current = false;
    didSettleFitRef.current = false;
  }

  return (
    <div className="relative flex h-[calc(100vh-0px)] w-full overflow-hidden rounded-lg border border-[var(--ground-line)]">
      {/* Sidebar — static column on desktop, slide-in overlay drawer on mobile so the graph always gets the full viewport */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="absolute inset-0 z-20 bg-black/50"
        />
      )}
      <aside
        className={
          isMobile
            ? `absolute inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-[var(--ground-line)] bg-[var(--ground-raised)] shadow-2xl transition-transform duration-200 ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : "flex w-64 shrink-0 flex-col border-r border-[var(--ground-line)] bg-[var(--ground-raised)]"
        }
      >
        <div className="flex items-center gap-2 border-b border-[var(--ground-line)] px-3 py-2.5">
          <Search size={13} className="text-[var(--ink-faint)]" />
          <input
            value={sidebarFilter}
            onChange={(e) => setSidebarFilter(e.target.value)}
            placeholder="Filter…"
            className="w-full bg-transparent text-xs text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
          />
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} className="shrink-0 rounded p-1 text-[var(--ink-faint)] hover:text-[var(--ink)]">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-1.5 py-2">
          {tree.map(({ cat, meta, tools }) => {
            const isCollapsed = collapsed.has(cat);
            return (
              <div key={cat} className="mb-0.5">
                <button
                  onClick={() =>
                    setCollapsed((prev) => {
                      const next = new Set(prev);
                      if (next.has(cat)) next.delete(cat);
                      else next.add(cat);
                      return next;
                    })
                  }
                  className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-xs font-medium text-[var(--ink-dim)] hover:bg-[var(--ground-raised-hi)]"
                >
                  <ChevronRight
                    size={11}
                    className="shrink-0 transition-transform"
                    style={{ transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)" }}
                  />
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: meta.color }} />
                  <span className="truncate">{meta.label}</span>
                  <span className="ml-auto text-[10px] text-[var(--ink-faint)]">{tools.length}</span>
                </button>
                {!isCollapsed && (
                  <div className="ml-4 border-l border-[var(--ground-line)] pl-2">
                    {tools.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => focusNode(t.id)}
                        onDoubleClick={() => { onOpenTool(t.id); if (isMobile) setSidebarOpen(false); }}
                        className={`flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-[11px] hover:bg-[var(--ground-raised-hi)] ${
                          selected === t.id ? "text-[var(--gold)]" : "text-[var(--ink-faint)]"
                        }`}
                        title="Click to locate · double-click to open"
                      >
                        <span className="truncate">{t.title}</span>
                        <span
                          role="button"
                          tabIndex={-1}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(t.id);
                          }}
                          className="ml-auto shrink-0"
                        >
                          <Star
                            size={9}
                            className={favorites.includes(t.id) ? "text-[var(--gold)]" : "text-[var(--ink-faint)]"}
                            fill={favorites.includes(t.id) ? "currentColor" : "none"}
                          />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="border-t border-[var(--ground-line)] px-3 py-2 text-[10px] text-[var(--ink-faint)]">
          drag to pan · scroll to zoom · drag a node to reposition
        </div>
      </aside>

      {/* Graph canvas */}
      <div ref={wrapRef} className="relative flex-1 touch-none overscroll-none bg-[var(--ground)]" style={{ cursor: "grab" }}>
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <div className="pointer-events-auto flex items-center gap-1.5">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]/90 text-[var(--ink-dim)] backdrop-blur hover:text-[var(--ink)]"
              >
                <Menu size={13} />
              </button>
            )}
            <div className="hidden items-center rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]/90 px-2.5 py-1.5 text-[11px] text-[var(--ink-dim)] backdrop-blur sm:flex">
              Graph view — {TOOLS.length} tools, {CATEGORY_ORDER.length} clusters
            </div>
            {focusCategory && (
              <button
                onClick={onClearFocusCategory}
                className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] backdrop-blur"
                style={{
                  borderColor: catColor.get(focusCategory) || "var(--gold)",
                  background: "var(--ground-raised)",
                  color: "var(--ink)",
                }}
                title="Clear filter"
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: catColor.get(focusCategory) }} />
                {CATEGORY_META[focusCategory].label}
                <X size={11} />
              </button>
            )}
          </div>
          <div className="pointer-events-auto flex items-center gap-1">
            <button
              onClick={() => {
                cameraRef.current.scale = Math.min(4, cameraRef.current.scale * 1.25);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]/90 text-[var(--ink-dim)] backdrop-blur hover:text-[var(--ink)]"
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={() => {
                cameraRef.current.scale = Math.max(0.25, cameraRef.current.scale * 0.8);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]/90 text-[var(--ink-dim)] backdrop-blur hover:text-[var(--ink)]"
            >
              <ZoomOut size={13} />
            </button>
            <button
              onClick={resetView}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]/90 text-[var(--ink-dim)] backdrop-blur hover:text-[var(--ink)]"
            >
              <Maximize2 size={13} />
            </button>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]/90 text-[var(--ink-dim)] backdrop-blur hover:text-[var(--ink)]"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
