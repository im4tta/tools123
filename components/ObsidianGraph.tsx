"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Menu, Search, Star, X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { TOOLS, CATEGORY_META, CATEGORY_ORDER, Category } from "@/lib/tools";
import { useLanguage } from "@/components/LanguageProvider";
import { useTheme } from "@/components/ThemeProvider";

/**
 * ObsidianGraph — a note-graph style view of the whole toolbox.
 *
 * - Category nodes act as hubs, tool nodes orbit them (mirrors Obsidian's
 *   note/tag graph, where clusters form organically from link structure).
 * - Pure canvas + a settled layout, no dependency, tuned for hundreds of
 *   nodes so it stays smooth on a mid-range laptop.
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
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<GNode[]>([]);
  const linksRef = useRef<GLink[]>([]);
  const nodeById = useRef<Map<string, GNode>>(new Map());
  const cameraRef = useRef({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{
    id: string | null;
    panning: boolean;
    lastX: number;
    lastY: number;
    originX: number;
    originY: number;
    lastAt: number;
    moved: boolean;
  }>({
    id: null,
    panning: false,
    lastX: 0,
    lastY: 0,
    originX: 0,
    originY: 0,
    lastAt: 0,
    moved: false,
  });
  const clusterFollowRef = useRef<{
    parentId: string;
    offsets: Map<string, { x: number; y: number }>;
    active: boolean;
    frames: number;
  } | null>(null);
  const hoverRef = useRef<string | null>(null);
  const focusCategoryRef = useRef<Category | null>(null);
  const velRef = useRef({ vx: 0, vy: 0 });
  const inertiaRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const scheduleFrameRef = useRef<() => void>(() => {});
  const pulseRef = useRef<{ id: string | null; startedAt: number }>({ id: null, startedAt: 0 });
  const didFitRef = useRef(false);
  const viewportSizeRef = useRef({ width: 0, height: 0 });

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
        r: 4,
      });
      links.push({ a: `cat:${t.category}`, b: t.id });
    });

    nodesRef.current = nodes;
    linksRef.current = links;
    nodeById.current = new Map(nodes.map((n) => [n.id, n]));
    clusterFollowRef.current = null;
    didFitRef.current = false;
    if (canvasRef.current) delete canvasRef.current.dataset.graphRenderKey;
    scheduleFrameRef.current();
  }, [mode]);

  const invalidateCanvas = useCallback(() => {
    if (canvasRef.current) delete canvasRef.current.dataset.graphRenderKey;
    scheduleFrameRef.current();
  }, []);

  // ---- resize + camera fit ----
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    // Sidebar drawer / mobile layout toggles can momentarily report a
    // 0-size wrapper mid-reflow. Keep the existing backing store until the
    // wrapper has a usable size again.
    if (w === 0 || h === 0) return;

    const previous = viewportSizeRef.current;
    const materiallyChanged = Math.abs(previous.width - w) > 1 || Math.abs(previous.height - h) > 1;
    if (!materiallyChanged && canvas.width === Math.floor(w * dpr) && canvas.height === Math.floor(h * dpr)) return;

    viewportSizeRef.current = { width: w, height: h };
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (materiallyChanged) didFitRef.current = false;
    invalidateCanvas();
  }, [invalidateCanvas]);

  useEffect(() => {
    resize();
    const ro = new ResizeObserver(resize);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [resize]);

  // ---- colors ----
  const catColor = useMemo(() => {
    const styles = typeof document === "undefined" ? null : getComputedStyle(document.documentElement);
    const colors = new Map<Category, string>();
    CATEGORY_ORDER.forEach((category) => {
      const configured = CATEGORY_META[category].color;
      const variable = configured.match(/^var\((--[^)]+)\)$/)?.[1];
      const resolved = variable && styles ? styles.getPropertyValue(variable).trim() : configured;
      colors.set(category, resolved || (theme === "dark" ? "#c9a24b" : "#9a7728"));
    });
    return colors;
  }, [theme]);

  const canvasPalette = useMemo(
    () =>
      theme === "dark"
        ? {
            edge: "rgba(224, 229, 239, 0.34)",
            edgeDim: "rgba(224, 229, 239, 0.10)",
            labelPrimary: "#f2f4f8",
            labelSecondary: "#bdc3ce",
            categoryOutline: "rgba(255, 255, 255, 0.58)",
            labelHalo: "rgba(8, 11, 17, 0.98)",
            labelBackground: "rgba(8, 11, 17, 0.72)",
            selectedLabel: "#fff9e8",
          }
        : {
            edge: "rgba(36, 43, 56, 0.38)",
            edgeDim: "rgba(36, 43, 56, 0.13)",
            labelPrimary: "#171a21",
            labelSecondary: "#4c5360",
            categoryOutline: "rgba(20, 24, 32, 0.58)",
            labelHalo: "rgba(255, 255, 255, 0.98)",
            labelBackground: "rgba(250, 249, 246, 0.82)",
            selectedLabel: "#101319",
          },
    [theme]
  );

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

    const requestRender = () => {
      if (running && rafRef.current === null) rafRef.current = requestAnimationFrame(step);
    };
    scheduleFrameRef.current = requestRender;

    function step(now: number) {
      rafRef.current = null;
      let animationActive = false;

      // Move only the children of the actively dragged category. This keeps
      // Obsidian-style spring following at O(cluster size) and avoids the
      // all-node force pass that previously monopolized the main thread.
      const clusterFollow = clusterFollowRef.current;
      if (clusterFollow) {
        const parent = nodeById.current.get(clusterFollow.parentId);
        if (!parent) {
          clusterFollowRef.current = null;
        } else {
          let maxDistance = 0;
          for (const [childId, offset] of clusterFollow.offsets) {
            const child = nodeById.current.get(childId);
            if (!child) continue;
            const dx = parent.x + offset.x - child.x;
            const dy = parent.y + offset.y - child.y;
            maxDistance = Math.max(maxDistance, Math.hypot(dx, dy));
            child.vx = (child.vx + dx * 0.18) * 0.68;
            child.vy = (child.vy + dy * 0.18) * 0.68;
            child.x += child.vx;
            child.y += child.vy;
          }
          if (clusterFollow.active) {
            clusterFollow.frames = 0;
            animationActive = maxDistance >= 0.12;
          } else {
            clusterFollow.frames += 1;
            if (clusterFollow.frames >= 36 || maxDistance < 0.12) {
              for (const childId of clusterFollow.offsets.keys()) {
                const child = nodeById.current.get(childId);
                if (child) { child.vx = 0; child.vy = 0; }
              }
              clusterFollowRef.current = null;
            } else {
              animationActive = true;
            }
          }
        }
      }

      // Momentum: after a released pan/swipe, keep drifting and decay each
      // frame — this is what makes touch panning feel "thrown" instead of
      // stopping the instant a finger lifts.
      if (inertiaRef.current) {
        const cam = cameraRef.current;
        canvas!.style.cursor = "grabbing";
        if (Number.isFinite(velRef.current.vx) && Number.isFinite(velRef.current.vy)) {
          cam.x += velRef.current.vx;
          cam.y += velRef.current.vy;
          velRef.current.vx *= 0.91;
          velRef.current.vy *= 0.91;
        } else {
          velRef.current.vx = 0;
          velRef.current.vy = 0;
        }
        if (Math.abs(velRef.current.vx) < 0.03 && Math.abs(velRef.current.vy) < 0.03) {
          inertiaRef.current = false;
          velRef.current.vx = 0;
          velRef.current.vy = 0;
          canvas!.style.cursor = hoverRef.current ? "pointer" : "grab";
        } else {
          animationActive = true;
        }
      }

      // Contain any bad transient frame without leaving a runaway callback or
      // permanently stopping future interaction-driven renders.
      try {
        draw(now);
      } catch (err) {
        console.error("ObsidianGraph frame error", err);
      }

      const pulse = pulseRef.current;
      const pulseElapsed = pulse.id === selected && selected ? now - pulse.startedAt : Number.POSITIVE_INFINITY;
      if (animationActive || (pulseElapsed >= 0 && pulseElapsed < 2400)) requestRender();
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
      cameraRef.current.scale = Math.max(0.25, fitScale);
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
        inertiaRef.current = false;
        velRef.current.vx = 0;
        velRef.current.vy = 0;
      }

      if (!didFitRef.current && w > 0 && nodesRef.current.length > 0) {
        fitToView(w, h);
        didFitRef.current = true;
      }

      const cam = cameraRef.current;
      const pulse = pulseRef.current;
      const pulseElapsed = pulse.id === selected && selected ? now - pulse.startedAt : Number.POSITIVE_INFINITY;
      const pulseActive = pulseElapsed >= 0 && pulseElapsed < 2400;
      const pulseCycle = pulseActive ? (pulseElapsed % 900) / 900 : 0;
      const firstBeat = Math.exp(-Math.pow((pulseCycle - 0.14) / 0.055, 2));
      const secondBeat = 0.68 * Math.exp(-Math.pow((pulseCycle - 0.31) / 0.075, 2));
      const pulseBeat = Math.min(1, firstBeat + secondBeat);
      const nodeDragActive = dragRef.current.id !== null;
      const layoutActive = inertiaRef.current || nodeDragActive || clusterFollowRef.current !== null || pulseActive;
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
        favorites.join(","),
        theme,
      ].join("|");

      // Skip duplicate interaction requests, but do not keep an idle 60 Hz
      // callback alive. Active motion and pulses explicitly request the next
      // bounded frame from step().
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
        ctx!.strokeStyle = dim ? canvasPalette.edgeDim : canvasPalette.edge;
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
          ctx!.strokeStyle = canvasPalette.categoryOutline;
          ctx!.stroke();
        }

        // At overview scale, rendering every tool name creates a dense text
        // pile and spends most of each frame rasterizing labels. Categories
        // remain visible; culling plus a useful zoom threshold keep the full
        // tool set from being labelled at fit scale.
        const showToolLabel =
          nd.kind === "category" ||
          isHovered ||
          (hovered?.kind === "tool" && isConnected) ||
          (!nodeDragActive && cam.scale >= 1.15);
        if (outOfFocus || !showToolLabel) continue;

        // Do not rasterize labels that are outside the visible viewport.
        const screenX = w / 2 + cam.x + nd.x * cam.scale;
        const screenY = h / 2 + cam.y + nd.y * cam.scale;
        if (screenX < -120 || screenX > w + 120 || screenY < -40 || screenY > h + 40) continue;

        ctx!.globalAlpha = dim ? 0.4 : 1;
        const screenPx = nd.kind === "category" ? 12 : 9.5;
        const labelY = nd.y - r - 6 / cam.scale;
        const emphasizeLabel = nd.kind === "category" || isHovered || isConnected;
        ctx!.font = `${nd.kind === "category" ? "600 " : ""}${screenPx / cam.scale}px "Noto Sans Khmer", sans-serif`;
        ctx!.textAlign = "center";
        ctx!.lineJoin = "round";
        if (emphasizeLabel) {
          ctx!.strokeStyle = canvasPalette.labelBackground;
          ctx!.lineWidth = 4 / cam.scale;
          ctx!.strokeText(nd.label, nd.x, labelY);
          ctx!.strokeStyle = canvasPalette.labelHalo;
          ctx!.lineWidth = 2 / cam.scale;
          ctx!.strokeText(nd.label, nd.x, labelY);
        }
        ctx!.fillStyle = nd.kind === "category" || isHovered || isConnected
          ? canvasPalette.labelPrimary
          : canvasPalette.labelSecondary;
        ctx!.fillText(nd.label, nd.x, labelY);
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
          ctx!.textAlign = "center";
          ctx!.lineJoin = "round";
          ctx!.strokeStyle = canvasPalette.labelBackground;
          ctx!.lineWidth = 5 / cam.scale;
          ctx!.strokeText(tool.label, tool.x, tool.y + tool.r + 22 / cam.scale);
          ctx!.strokeStyle = canvasPalette.labelHalo;
          ctx!.lineWidth = 2 / cam.scale;
          ctx!.strokeText(tool.label, tool.x, tool.y + tool.r + 22 / cam.scale);
          ctx!.fillStyle = canvasPalette.selectedLabel;
          ctx!.fillText(tool.label, tool.x, tool.y + tool.r + 22 / cam.scale);
        }
      }

      ctx!.globalAlpha = 1;
      ctx!.shadowBlur = 0;
      ctx!.restore();
    }

    requestRender();
    return () => {
      running = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (scheduleFrameRef.current === requestRender) scheduleFrameRef.current = () => {};
    };
  }, [canvasPalette, catColor, favorites, selected, theme]);

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
    const scale = Math.max(0.25, Number.isFinite(cameraRef.current.scale) ? cameraRef.current.scale : 1);

    function closest(kind: GNode["kind"], screenPadding: number) {
      let best: GNode | null = null;
      let bestScore = Number.POSITIVE_INFINITY;
      for (const nd of nodes) {
        if (nd.kind !== kind) continue;
        const dx = nd.x - wx;
        const dy = nd.y - wy;
        const hitR = nd.r + screenPadding / scale;
        const score = (dx * dx + dy * dy) / (hitR * hitR);
        if (score <= 1 && score < bestScore) {
          best = nd;
          bestScore = score;
        }
      }
      return best;
    }

    // Hubs are drawn larger and should win inside their visible circle even
    // when a small child overlaps them at overview zoom.
    return closest("category", 8) ?? closest("tool", 12);
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
        invalidateCanvas();
      }
    },
    [onOpenTool, isMobile, invalidateCanvas]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
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
      canvas!.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      inertiaRef.current = false;
      velRef.current.vx = 0;
      velRef.current.vy = 0;

      if (pointers.size === 1) {
        const { x, y } = screenToWorld(e.clientX, e.clientY);
        const hit = nodeAt(x, y);
        const drag = dragRef.current;
        drag.lastX = e.clientX;
        drag.lastY = e.clientY;
        drag.originX = e.clientX;
        drag.originY = e.clientY;
        drag.lastAt = e.timeStamp;
        drag.moved = false;
        drag.id = hit?.id ?? null;
        drag.panning = !hit;
        canvas!.style.cursor = "grabbing";
        if (hit) {
          hit.vx = 0;
          hit.vy = 0;
          clusterFollowRef.current = hit.kind === "category"
            ? {
                parentId: hit.id,
                offsets: new Map(nodesRef.current
                  .filter((node) => node.kind === "tool" && node.category === hit.category)
                  .map((node) => [node.id, { x: node.x - hit.x, y: node.y - hit.y }])),
                active: true,
                frames: 0,
              }
            : null;
        }
      } else if (pointers.size === 2) {
        // A second finger supersedes a single-finger node drag or pan. Mobile
        // intentionally keeps a fixed graph scale; two fingers are ignored
        // until one lifts, preventing accidental pinch zoom while typing or
        // navigating on touch devices.
        dragRef.current.id = null;
        dragRef.current.panning = false;
        dragRef.current.moved = true;
        if (clusterFollowRef.current) {
          clusterFollowRef.current.active = false;
          clusterFollowRef.current.frames = 0;
        }
        if (!isMobile) startPinch();
      }
      invalidateCanvas();
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
          canvas!.style.cursor = newId ? "pointer" : "grab";
          invalidateCanvas();
        }
        return;
      }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size >= 2) {
        if (isMobile || !pinch) return;
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

        if (
          Number.isFinite(newScale) &&
          Number.isFinite(worldX) &&
          Number.isFinite(worldY) &&
          Number.isFinite(curSx) &&
          Number.isFinite(curSy)
        ) {
          cam.scale = newScale;
          cam.x = curSx - worldX * newScale;
          cam.y = curSy - worldY * newScale;
          invalidateCanvas();
        }
        return;
      }

      const drag = dragRef.current;
      const dx = e.clientX - drag.lastX;
      const dy = e.clientY - drag.lastY;
      const elapsed = Math.max(1, e.timeStamp - drag.lastAt);
      if (Math.hypot(e.clientX - drag.originX, e.clientY - drag.originY) >= 6) drag.moved = true;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      drag.lastAt = e.timeStamp;

      if (drag.id && drag.moved) {
        const nd = nodeById.current.get(drag.id);
        if (nd) {
          const { x, y } = screenToWorld(e.clientX, e.clientY);
          if (Number.isFinite(x) && Number.isFinite(y)) {
            // Keep the dragged node exactly under the pointer. Only a
            // category's local children receive spring updates.
            nd.x = x;
            nd.y = y;
            nd.vx = 0;
            nd.vy = 0;
            invalidateCanvas();
          }
        }
      } else if (drag.panning && drag.moved && Number.isFinite(dx) && Number.isFinite(dy)) {
        cameraRef.current.x += dx;
        cameraRef.current.y += dy;
        // Convert event velocity to pixels per animation frame and lightly
        // smooth it so irregular pointer-event timing does not make a flick
        // jump when inertia takes over.
        const frameScale = 1000 / 60;
        const sampleVx = (dx / elapsed) * frameScale;
        const sampleVy = (dy / elapsed) * frameScale;
        if (Number.isFinite(sampleVx) && Number.isFinite(sampleVy)) {
          velRef.current.vx = velRef.current.vx * 0.65 + sampleVx * 0.35;
          velRef.current.vy = velRef.current.vy * 0.65 + sampleVy * 0.35;
        }
        canvas!.style.cursor = "grabbing";
        invalidateCanvas();
      }
    }

    function endPointer(e: PointerEvent) {
      const wasPanning = dragRef.current.panning;
      const wasDragId = dragRef.current.id;
      const moved = dragRef.current.moved;

      pointers.delete(e.pointerId);
      try { canvas!.releasePointerCapture(e.pointerId); } catch { /* already released */ }

      if (pointers.size >= 2) {
        // Still pinching with the remaining fingers — re-baseline so the
        // gesture continues smoothly rather than jumping.
        startPinch();
        return;
      }

      if (pointers.size === 1) {
        // One finger lifted out of a pinch — resume a single-finger pan from
        // its current position without a jump or accidental click.
        const [remaining] = activePoints();
        pinch = null;
        dragRef.current.lastX = remaining.x;
        dragRef.current.lastY = remaining.y;
        dragRef.current.originX = remaining.x;
        dragRef.current.originY = remaining.y;
        dragRef.current.lastAt = e.timeStamp;
        dragRef.current.panning = true;
        dragRef.current.id = null;
        dragRef.current.moved = true;
        canvas!.style.cursor = "grabbing";
        return;
      }

      pinch = null;
      if (wasDragId) {
        const nd = nodeById.current.get(wasDragId);
        if (nd) {
          if (!moved) {
            openOrFocus(nd);
            setSelected(nd.id);
          }
          nd.vx = 0;
          nd.vy = 0;
          if (clusterFollowRef.current?.parentId === nd.id) {
            clusterFollowRef.current.active = false;
            clusterFollowRef.current.frames = 0;
          }
        }
      } else if (wasPanning && moved) {
        const speed = Math.hypot(velRef.current.vx, velRef.current.vy);
        inertiaRef.current = Number.isFinite(speed) && speed > 0.03;
      }
      dragRef.current.id = null;
      dragRef.current.panning = false;
      canvas!.style.cursor = inertiaRef.current ? "grabbing" : hoverRef.current ? "pointer" : "grab";
      invalidateCanvas();
    }

    function cancelActiveGesture() {
      const dragId = dragRef.current.id;
      if (dragId) {
        const nd = nodeById.current.get(dragId);
        if (nd) { nd.vx = 0; nd.vy = 0; }
      }
      pointers.clear();
      pinch = null;
      dragRef.current.id = null;
      dragRef.current.panning = false;
      dragRef.current.moved = true;
      if (clusterFollowRef.current) {
        clusterFollowRef.current.active = false;
        clusterFollowRef.current.frames = 0;
      }
      inertiaRef.current = false;
      velRef.current.vx = 0;
      velRef.current.vy = 0;
      canvas!.style.cursor = "grab";
      invalidateCanvas();
    }

    function cancelPointer(e: PointerEvent) {
      pointers.delete(e.pointerId);
      try { canvas!.releasePointerCapture(e.pointerId); } catch { /* already released */ }
      cancelActiveGesture();
    }

    function onLostPointerCapture(e: PointerEvent) {
      if (pointers.has(e.pointerId)) cancelActiveGesture();
    }

    function onWindowBlur() {
      if (pointers.size > 0 || dragRef.current.id || dragRef.current.panning) cancelActiveGesture();
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      inertiaRef.current = false;
      velRef.current.vx = 0;
      velRef.current.vy = 0;
      const cam = cameraRef.current;
      const factor = Math.exp(-e.deltaY * 0.001);
      const newScale = Math.min(4, Math.max(0.25, cam.scale * factor));

      // Zoom toward the cursor rather than the canvas center.
      const rect = canvas!.getBoundingClientRect();
      const sx = e.clientX - rect.left - rect.width / 2;
      const sy = e.clientY - rect.top - rect.height / 2;
      const worldX = (sx - cam.x) / cam.scale;
      const worldY = (sy - cam.y) / cam.scale;
      if (
        Number.isFinite(newScale) &&
        Number.isFinite(worldX) &&
        Number.isFinite(worldY) &&
        Number.isFinite(sx) &&
        Number.isFinite(sy)
      ) {
        cam.scale = newScale;
        cam.x = sx - worldX * newScale;
        cam.y = sy - worldY * newScale;
        invalidateCanvas();
      }
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", cancelPointer);
    canvas.addEventListener("lostpointercapture", onLostPointerCapture);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("blur", onWindowBlur);
    return () => {
      cancelActiveGesture();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endPointer);
      canvas.removeEventListener("pointercancel", cancelPointer);
      canvas.removeEventListener("lostpointercapture", onLostPointerCapture);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [invalidateCanvas, isMobile, screenToWorld, nodeAt, openOrFocus]);

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(new Set());
    }
    invalidateCanvas();
  }, [focusCategory, invalidateCanvas]);

  function focusNode(id: string, startedAt: number) {
    const tool = nodeById.current.get(id);
    if (!tool || tool.kind !== "tool") return;
    const parent = nodeById.current.get(`cat:${tool.category}`);
    if (!parent) return;

    // Present the selected tool directly beneath its main category node. This
    // is a deliberate, local placement—not a force-simulation wake—so sidebar
    // clicks remain instant even with hundreds of graph nodes.
    tool.x = parent.x;
    tool.y = parent.y + 82;
    tool.vx = 0;
    tool.vy = 0;

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
    invalidateCanvas();
    setSelected(id);
  }

  const zoomAtViewportCenter = useCallback((factor: number) => {
    const wrap = wrapRef.current;
    const cam = cameraRef.current;
    if (!wrap || !Number.isFinite(factor) || factor <= 0) return;
    if (!Number.isFinite(cam.x) || !Number.isFinite(cam.y) || !Number.isFinite(cam.scale) || cam.scale <= 0) {
      cam.x = 0;
      cam.y = 0;
      cam.scale = 1;
    }
    const nextScale = Math.min(4, Math.max(0.25, cam.scale * factor));
    const worldCenterX = -cam.x / cam.scale;
    const worldCenterY = -cam.y / cam.scale;
    if (!Number.isFinite(nextScale) || !Number.isFinite(worldCenterX) || !Number.isFinite(worldCenterY)) return;
    cam.scale = nextScale;
    cam.x = -worldCenterX * nextScale;
    cam.y = -worldCenterY * nextScale;
    inertiaRef.current = false;
    velRef.current.vx = 0;
    velRef.current.vy = 0;
    invalidateCanvas();
  }, [invalidateCanvas]);

  const resetView = useCallback(() => {
    inertiaRef.current = false;
    velRef.current.vx = 0;
    velRef.current.vy = 0;
    didFitRef.current = false;
    invalidateCanvas();
  }, [invalidateCanvas]);

  return (
    <div className="relative flex h-full min-h-0 w-full overflow-hidden rounded-lg border border-[var(--ground-line)]">
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
            <button
              onClick={() => setSidebarOpen(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-[var(--ink-faint)] hover:text-[var(--ink)]"
              aria-label={t("Close graph menu", "បិទម៉ឺនុយក្រាហ្វ")}
              title={t("Close graph menu", "បិទម៉ឺនុយក្រាហ្វ")}
            >
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
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]/90 text-[var(--ink-dim)] backdrop-blur hover:text-[var(--ink)]"
                aria-label={t("Open graph menu", "បើកម៉ឺនុយក្រាហ្វ")}
                title={t("Open graph menu", "បើកម៉ឺនុយក្រាហ្វ")}
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
            {!isMobile && (
              <>
                <button
                  onClick={() => zoomAtViewportCenter(1.25)}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]/90 text-[var(--ink-dim)] backdrop-blur hover:text-[var(--ink)]"
                  aria-label={t("Zoom in", "ពង្រីក")}
                  title={t("Zoom in", "ពង្រីក")}
                >
                  <ZoomIn size={15} />
                </button>
                <button
                  onClick={() => zoomAtViewportCenter(0.8)}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]/90 text-[var(--ink-dim)] backdrop-blur hover:text-[var(--ink)]"
                  aria-label={t("Zoom out", "បង្រួម")}
                  title={t("Zoom out", "បង្រួម")}
                >
                  <ZoomOut size={15} />
                </button>
              </>
            )}
            <button
              onClick={resetView}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]/90 text-[var(--ink-dim)] backdrop-blur hover:text-[var(--ink)]"
              aria-label={t("Fit graph to view", "សម្រួលក្រាហ្វឱ្យពេញផ្ទៃ")}
              title={t("Fit graph to view", "សម្រួលក្រាហ្វឱ្យពេញផ្ទៃ")}
            >
              <Maximize2 size={15} />
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]/90 text-[var(--ink-dim)] backdrop-blur hover:text-[var(--ink)]"
              aria-label={t("Close graph view", "បិទទិដ្ឋភាពក្រាហ្វ")}
              title={t("Close graph view", "បិទទិដ្ឋភាពក្រាហ្វ")}
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
