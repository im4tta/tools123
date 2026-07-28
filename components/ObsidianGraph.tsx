"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Menu, Search, Star, X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { TOOLS, CATEGORY_META, CATEGORY_ORDER, Category } from "@/lib/tools";
import { useLanguage } from "@/components/LanguageProvider";

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
  const { mode, text: t } = useLanguage();
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
  const pulseRef = useRef<{ id: string | null; startedAt: number }>({ id: null, startedAt: 0 });
  const settleRef = useRef(0);
  // Backstop for the velocity-based settle check below: with enough nodes,
  // the repulsion/spring/center forces can reach a low-amplitude oscillation
  // that never actually dips under the settle threshold, so settleRef would
  // sit at 0 forever and the full physics pass (plus the per-node label
  // draw) would run every single frame for as long as the graph stays open
  // — which is what was pinning the tab. This counts consecutive "still
  // moving" frames and force-settles once the layout has clearly had enough
  // time to find a reasonable shape, regardless of whether it ever fully
  // stops jittering.
  const unsettledTicksRef = useRef(0);
  const wasSettledRef = useRef(true);
  const MAX_UNSETTLED_TICKS = 240; // ~4s at 60fps
  const didFitRef = useRef(false);
  const didSettleFitRef = useRef(false);

  const [sidebarFilter, setSidebarFilter] = useState("");
  const [collapsed, setCollapsed] = useState<Set<Category>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
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
        label: mode === "en" ? CATEGORY_META[cat].label : mode === "km" ? CATEGORY_META[cat].khmer : `${CATEGORY_META[cat].label} / ${CATEGORY_META[cat].khmer}`,
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

    const countByCategory = new Map<Category, number>();
    for (const t of TOOLS) countByCategory.set(t.category, (countByCategory.get(t.category) ?? 0) + 1);

    TOOLS.forEach((t) => {
      const parent = nodes.find((n) => n.id === `cat:${t.category}`)!;
      const jitterAngle = Math.random() * TAU;
      // Base spread (40–100px) plus extra room proportional to how many
      // siblings share this hub, so a 150-tool category starts out already
      // roughly the right size instead of everyone crammed into the same
      // small disk and fighting apart for hundreds of physics ticks.
      const count = countByCategory.get(t.category) ?? 1;
      const spread = 40 + Math.sqrt(count) * 14;
      const jitterR = spread * 0.5 + Math.random() * spread;
      nodes.push({
        id: t.id,
        kind: "tool",
        label: mode === "en" || !t.khmerTitle ? t.title : mode === "km" ? t.khmerTitle : `${t.title} / ${t.khmerTitle}`,
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
  }, [mode]);

  // ---- resize + camera fit ----
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    // Sidebar drawer / mobile layout toggles can momentarily report a
    // 0-size wrapper mid-reflow. Sizing the canvas backing store to 0 makes
    // it (and everything drawn to it) disappear until another resize fires
    // — skip and keep whatever the canvas already had.
    if (w === 0 || h === 0) return;
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

    // A canvas retains its previous pixels across effect recreation (including
    // Fast Refresh). Invalidate the idle-frame key so the new renderer always
    // paints once instead of leaving a stale pre-update graph on screen.
    delete canvas.dataset.graphRenderKey;
    let running = true;

    function step(now: number) {
      const nodes = nodesRef.current;
      const links = linksRef.current;
      const n = nodes.length;

      // The graph is laid out when data is built. Re-running force physics for
      // hundreds of nodes on mount or click was the remaining source of tab
      // freezes, so interactions now move nodes directly without waking it.
      settleRef.current = 1;

      // A wake is any transition from settled back to unsettled (drag,
      // category focus, reset view, ...) — give it a fresh tick budget
      // rather than carrying over an already-exhausted counter.
      const isSettledNow = settleRef.current >= 1;
      if (isSettledNow && !wasSettledRef.current) {
        // just settled — nothing to reset yet, next unsettle will reset below
      }
      if (!isSettledNow && wasSettledRef.current) {
        unsettledTicksRef.current = 0;
      }
      wasSettledRef.current = isSettledNow;

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
        // Repulsion only meaningfully matters between nearby nodes (force
        // decays with 1/d²), so instead of the naive all-pairs O(n²) scan —
        // which is fine at ~170 nodes but starts costing real milliseconds
        // per frame once the toolbox grows into the hundreds — bucket nodes
        // into a coarse grid and only compare each node against neighbors in
        // its own and the 8 surrounding cells. This keeps the simulation at
        // roughly O(n) and is what stops the whole graph from stalling (and
        // visually "disappearing" for a beat) the moment a drag/pinch wakes
        // the physics back up on a large node set.
        const CELL = 160;
        const grid = new Map<string, GNode[]>();
        for (let i = 0; i < n; i++) {
          const nd = nodes[i];
          const key = `${Math.floor(nd.x / CELL)}:${Math.floor(nd.y / CELL)}`;
          const bucket = grid.get(key);
          if (bucket) bucket.push(nd);
          else grid.set(key, [nd]);
        }

        for (let i = 0; i < n; i++) {
          const a = nodes[i];
          if (a.fx !== null) continue;
          let fx = -a.x * CENTER;
          let fy = -a.y * CENTER;
          if (a.kind === "category") {
            // Keep category hubs distributed around their original ring.
            // Without an anchor, the global center force eventually pulls
            // every disconnected category star into the same central pile.
            const categoryIndex = CATEGORY_ORDER.indexOf(a.category);
            const anchorAngle = (categoryIndex / CATEGORY_ORDER.length) * TAU;
            const anchorX = Math.cos(anchorAngle) * 520;
            const anchorY = Math.sin(anchorAngle) * 520;
            const ANCHOR = 0.008;
            fx += (anchorX - a.x) * ANCHOR;
            fy += (anchorY - a.y) * ANCHOR;
          }
          const cx = Math.floor(a.x / CELL);
          const cy = Math.floor(a.y / CELL);
          for (let gx = cx - 1; gx <= cx + 1; gx++) {
            for (let gy = cy - 1; gy <= cy + 1; gy++) {
              const bucket = grid.get(`${gx}:${gy}`);
              if (!bucket) continue;
              for (const b of bucket) {
                if (b === a) continue;
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                let d2 = dx * dx + dy * dy;
                if (d2 < 1) d2 = 1;
                const force = REPULSION / d2;
                const d = Math.sqrt(d2);
                fx += (dx / d) * force;
                fy += (dy / d) * force;
              }
            }
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
        if (totalV / n < 0.05) {
          settleRef.current += 1;
        } else {
          unsettledTicksRef.current += 1;
          if (unsettledTicksRef.current > MAX_UNSETTLED_TICKS) {
            // Layout has had its fair shot — accept it as-is rather than
            // burning CPU on an oscillation that will never fully die out.
            settleRef.current = 1;
          } else {
            settleRef.current = 0;
          }
        }
      }

      // If a single frame throws (bad input, transient DOM state, etc.) the
      // uncaught error would otherwise abort this callback before it
      // re-schedules itself, silently ending the rAF chain for good — the
      // graph would just stay frozen/blank with no way to recover short of
      // a reload. Keep the loop alive regardless.
      try {
        draw(now);
      } catch (err) {
        console.error("ObsidianGraph draw error", err);
      }
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

    function draw(now: number) {
      const wEl = wrap!;
      const w = wEl.clientWidth;
      const h = wEl.clientHeight;

      // Safety net: if the camera ever picks up a NaN/Infinity (e.g. a
      // degenerate pinch gesture, a divide-by-zero elsewhere), recenter it
      // instead of silently rendering nothing every frame forever.
      const cam0 = cameraRef.current;
      if (!Number.isFinite(cam0.x) || !Number.isFinite(cam0.y) || !Number.isFinite(cam0.scale) || cam0.scale <= 0) {
        cam0.x = 0;
        cam0.y = 0;
        cam0.scale = 1;
        didFitRef.current = false;
        didSettleFitRef.current = false;
        inertiaRef.current = false;
        velRef.current.vx = 0;
        velRef.current.vy = 0;
      }

      if (!didFitRef.current && w > 0 && nodesRef.current.length > 0) {
        fitToView(w, h);
        didFitRef.current = true;
      }
      if (!didSettleFitRef.current && didFitRef.current && settleRef.current >= 1 && w > 0) {
        fitToView(w, h);
        didSettleFitRef.current = true;
      }

      const cam = cameraRef.current;
      const pulse = pulseRef.current;
      const pulseElapsed = pulse.id === selected && selected ? now - pulse.startedAt : Number.POSITIVE_INFINITY;
      const pulseActive = pulseElapsed >= 0 && pulseElapsed < 2400;
      const pulseCycle = pulseActive ? (pulseElapsed % 900) / 900 : 0;
      const firstBeat = Math.exp(-Math.pow((pulseCycle - 0.14) / 0.055, 2));
      const secondBeat = 0.68 * Math.exp(-Math.pow((pulseCycle - 0.31) / 0.075, 2));
      const pulseBeat = Math.min(1, firstBeat + secondBeat);
      const layoutActive = inertiaRef.current || dragRef.current.id !== null || pulseActive;
      const renderKey = [
        canvas!.width,
        canvas!.height,
        cam.x.toFixed(2),
        cam.y.toFixed(2),
        cam.scale.toFixed(4),
        hoverRef.current ?? "",
        focusCategoryRef.current ?? "",
        selected ?? "",
        pulse.startedAt,
        didFitRef.current ? 1 : 0,
        didSettleFitRef.current ? 1 : 0,
        favorites.join(","),
      ].join("|");

      // Keep the lightweight rAF heartbeat for responsive interactions, but
      // avoid clearing and rebuilding the entire canvas while nothing has
      // changed. Physics and inertia still redraw every active frame.
      if (!layoutActive && canvas!.dataset.graphRenderKey === renderKey) return;
      canvas!.dataset.graphRenderKey = renderKey;

      ctx!.clearRect(0, 0, w, h);
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

        // At overview scale, rendering every tool name creates a dense text
        // pile and spends most of each frame rasterizing labels. Categories
        // remain visible; tool labels appear when zoomed in or directly
        // hovered. A hovered tool also reveals its connected category label.
        const showToolLabel =
          nd.kind === "category" ||
          isHovered ||
          (hovered?.kind === "tool" && isConnected) ||
          cam.scale >= 1.4;
        if (outOfFocus || !showToolLabel) continue;

        // Do not rasterize labels that are outside the visible viewport.
        const screenX = w / 2 + cam.x + nd.x * cam.scale;
        const screenY = h / 2 + cam.y + nd.y * cam.scale;
        if (screenX < -120 || screenX > w + 120 || screenY < -40 || screenY > h + 40) continue;

        ctx!.globalAlpha = dim ? 0.4 : 1;
        const screenPx = nd.kind === "category" ? 12 : 9.5;
        ctx!.font = `${nd.kind === "category" ? "600 " : ""}${screenPx / cam.scale}px "Noto Sans Khmer", sans-serif`;
        ctx!.fillStyle = nd.kind === "category" ? "#e8e6df" : isHovered || isConnected ? "#e8e6df" : "#a9a69d";
        ctx!.textAlign = "center";
        ctx!.fillText(nd.label, nd.x, nd.y - r - 6 / cam.scale);
        ctx!.globalAlpha = 1;
      }

      // Sidebar selection overlay: a bright parent-to-tool bloodline plus a
      // double-beat halo. This never wakes force physics, so the animation is
      // bounded and remains cheap even with hundreds of graph nodes.
      if (selected) {
        const tool = nodeById.current.get(selected);
        const parent = tool ? nodeById.current.get(`cat:${tool.category}`) : null;
        if (tool?.kind === "tool" && parent) {
          const color = catColor.get(tool.category) || "#c9a24b";
          ctx!.globalAlpha = 0.72 + pulseBeat * 0.28;
          ctx!.strokeStyle = color;
          ctx!.lineWidth = (2.5 + pulseBeat * 3.5) / cam.scale;
          ctx!.shadowColor = color;
          ctx!.shadowBlur = (8 + pulseBeat * 18) / cam.scale;
          ctx!.beginPath();
          ctx!.moveTo(parent.x, parent.y);
          ctx!.lineTo(tool.x, tool.y);
          ctx!.stroke();

          if (pulseActive) {
            for (let ring = 0; ring < 2; ring++) {
              const progress = (pulseCycle + ring * 0.5) % 1;
              ctx!.globalAlpha = (1 - progress) * (0.55 + pulseBeat * 0.35);
              ctx!.lineWidth = 2 / cam.scale;
              ctx!.beginPath();
              ctx!.arc(tool.x, tool.y, tool.r + 8 / cam.scale + progress * 28 / cam.scale, 0, TAU);
              ctx!.stroke();
            }
          }

          ctx!.globalAlpha = 1;
          ctx!.shadowBlur = 0;
          ctx!.fillStyle = color;
          ctx!.beginPath();
          ctx!.arc(tool.x, tool.y, tool.r + 3 / cam.scale + pulseBeat * 3 / cam.scale, 0, TAU);
          ctx!.fill();
          ctx!.font = `${600} ${11 / cam.scale}px "Noto Sans Khmer", sans-serif`;
          ctx!.fillStyle = "#f5f2e9";
          ctx!.textAlign = "center";
          ctx!.fillText(tool.label, tool.x, tool.y + tool.r + 22 / cam.scale);
        }
      }

      ctx!.globalAlpha = 1;
      ctx!.shadowBlur = 0;
      ctx!.restore();
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [catColor, favorites, selected]);

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
        // Floor this at a small epsilon, not 0 — two touch points can land
        // on (or very near) the same coordinate, and dividing by a ~0 start
        // distance later explodes the pinch-scale math to Infinity/NaN,
        // which poisons the camera and every node position permanently
        // (the graph "disappears" until a hard reload).
        dist: Math.max(1, distance(pts)),
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
      if (!pointers.has(e.pointerId)) {
        // Normal mouse hover arrives without an active pointerdown entry.
        // Previously this returned immediately, making the rendered graph
        // appear frozen even though the canvas loop was alive.
        const { x, y } = screenToWorld(e.clientX, e.clientY);
        const hit = nodeAt(x, y);
        const newId = hit?.id ?? null;
        if (newId !== hoverRef.current) {
          hoverRef.current = newId;
          wrap!.style.cursor = newId ? "pointer" : "grab";
          if (canvasRef.current) delete canvasRef.current.dataset.graphRenderKey;
        }
        return;
      }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size >= 2 && pinch) {
        const pts = activePoints();
        const mid = midpoint(pts);
        const dist = Math.max(1, distance(pts));
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
        (t) => t.category === cat && (q === "" || t.title.toLowerCase().includes(q) || t.khmerTitle?.toLowerCase().includes(q))
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

  function focusNode(id: string, startedAt: number) {
    const tool = nodeById.current.get(id);
    if (!tool || tool.kind !== "tool") return;
    const parent = nodeById.current.get(`cat:${tool.category}`);
    if (!parent) return;

    // Present the selected tool directly beneath its main category node. This
    // is a deliberate, local placement—not a force-simulation wake—so sidebar
    // clicks remain instant even in the 387-node graph.
    tool.x = parent.x;
    tool.y = parent.y + 82;
    tool.vx = 0;
    tool.vy = 0;
    tool.fx = null;
    tool.fy = null;

    if (focusCategoryRef.current) {
      focusCategoryRef.current = null;
      onClearFocusCategory?.();
    }

    const cam = cameraRef.current;
    cam.scale = Math.min(1.35, Math.max(1.1, cam.scale));
    cam.x = -parent.x * cam.scale;
    cam.y = -((parent.y + tool.y) / 2) * cam.scale;
    inertiaRef.current = false;
    velRef.current.vx = 0;
    velRef.current.vy = 0;

    hoverRef.current = id;
    pulseRef.current = { id, startedAt };
    if (canvasRef.current) delete canvasRef.current.dataset.graphRenderKey;
    setSelected(id);
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
            placeholder={t("Filter…", "ស្វែងរក…")}
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
                  <span className="truncate">{t(meta.label, meta.khmer)}</span>
                  <span className="ml-auto text-[10px] text-[var(--ink-faint)]">{tools.length}</span>
                </button>
                {!isCollapsed && (
                  <div className="ml-4 border-l border-[var(--ground-line)] pl-2">
                    {tools.map((t) => (
                      <button
                        key={t.id}
                        onClick={(e) => focusNode(t.id, e.timeStamp)}
                        onDoubleClick={() => { onOpenTool(t.id); if (isMobile) setSidebarOpen(false); }}
                        className={`flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-[11px] hover:bg-[var(--ground-raised-hi)] ${
                          selected === t.id ? "text-[var(--gold)]" : "text-[var(--ink-faint)]"
                        }`}
                        title={mode === "en" ? "Click to locate · double-click to open" : mode === "km" ? "ចុចម្តងដើម្បីស្វែងរកទីតាំង · ចុចពីរដងដើម្បីបើក" : "Click to locate · double-click to open / ចុចម្តងដើម្បីស្វែងរកទីតាំង · ចុចពីរដងដើម្បីបើក"}
                      >
                        <span className="truncate">{mode === "en" || !t.khmerTitle ? t.title : mode === "km" ? t.khmerTitle : `${t.title} / ${t.khmerTitle}`}</span>
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
          {t("drag to pan · scroll to zoom · drag a node to reposition", "អូសដើម្បីផ្លាស់ទី · រំកិលកង់កណ្ដុរដើម្បីពង្រីក · អូសចំណុចដើម្បីប្តូរទីតាំង")}
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
              {t(`Graph view — ${TOOLS.length} tools, ${CATEGORY_ORDER.length} clusters`, `ទិដ្ឋភាពក្រាហ្វ — ឧបករណ៍ ${TOOLS.length} មុខ, ក្រុម ${CATEGORY_ORDER.length}`)}
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
                title={t("Clear filter", "សម្អាតតម្រង")}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: catColor.get(focusCategory) }} />
                {t(CATEGORY_META[focusCategory].label, CATEGORY_META[focusCategory].khmer)}
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
