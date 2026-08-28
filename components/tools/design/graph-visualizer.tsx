"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Node = { id: string; index: number };
type Link = { source: string; target: string };
type Graph =
  | { kind: "ok"; nodes: Node[]; links: Link[] }
  | { kind: "error"; en: string; km: string }
  | { kind: "empty" };

/** Node datum shape d3-force expects (structural subset of SimulationNodeDatum). */
type SimNode = Node & {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  index?: number;
  fx?: number | null;
  fy?: number | null;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function parseGraph(input: string): Graph {
  const trimmed = input.trim();
  if (!trimmed) return { kind: "empty" };

  if (trimmed.startsWith("{")) {
    try {
      const data = JSON.parse(trimmed) as { nodes?: unknown; edges?: unknown };
      const rawNodes = Array.isArray(data.nodes) ? data.nodes : [];
      const rawLinks = Array.isArray(data.edges) ? data.edges : [];
      const nodes: Node[] = [];
      const ids = new Set<string>();
      for (const n of rawNodes) {
        const id = String(typeof n === "string" ? n : ((n as { id?: unknown })?.id ?? `n${nodes.length}`));
        if (ids.has(id)) continue;
        ids.add(id);
        nodes.push({ id, index: nodes.length });
      }
      const links: Link[] = [];
      for (const l of rawLinks) {
        let s = "";
        let tt = "";
        if (typeof l === "string") {
          const parts = l.split("-");
          s = parts[0]?.trim() ?? "";
          tt = parts[1]?.trim() ?? "";
        } else {
          s = String((l as { source?: unknown })?.source ?? "");
          tt = String((l as { target?: unknown })?.target ?? "");
        }
        if (!s || !tt) continue;
        for (const id of [s, tt]) {
          if (!ids.has(id)) {
            ids.add(id);
            nodes.push({ id, index: nodes.length });
          }
        }
        links.push({ source: s, target: tt });
      }
      if (nodes.length === 0) {
        return { kind: "error", en: "JSON found but no nodes or edges inside.", km: "រកឃើញ JSON ប៉ុន្តែគ្មាន nodes ឬ edges ទេ។" };
      }
      return { kind: "ok", nodes, links };
    } catch {
      return { kind: "error", en: "Invalid JSON. Use {\"nodes\":[…],\"edges\":[…]}.", km: "JSON មិនត្រឹមត្រូវ។ ប្រើ {\"nodes\":[…],\"edges\":[…]}" };
    }
  }

  const nodes: Node[] = [];
  const links: Link[] = [];
  const ids = new Set<string>();
  const ensure = (id: string) => {
    if (!ids.has(id)) {
      ids.add(id);
      nodes.push({ id, index: nodes.length });
    }
  };
  for (const line of trimmed.split(/\r?\n/)) {
    const m = line.trim().match(/^(.+?)\s*[-–—]\s*(.+)$/);
    if (!m) continue;
    const a = m[1].trim();
    const b = m[2].trim();
    if (!a || !b) continue;
    ensure(a);
    ensure(b);
    links.push({ source: a, target: b });
  }
  if (nodes.length === 0) {
    return { kind: "error", en: "No edges found. Put one 'A-B' pair per line.", km: "រកមិនឃើញគែមទេ។ ដាក់មួយគូ 'A-B' ក្នុងមួយបន្ទាត់។" };
  }
  return { kind: "ok", nodes, links };
}

const SAMPLE = [
  "Home-Office",
  "Home-Kitchen",
  "Kitchen-Living",
  "Living-Office",
  "Living-Garden",
  "Garden-Shed",
  "Office-Studio",
  "Studio-Bedroom",
  "Bedroom-Bathroom",
].join("\n");

const W = 480;
const H = 360;

export default function GraphVisualizer() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("graph-visualizer:input", SAMPLE);
  const [runId, setRunId] = useState(0);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const dragRef = useRef<{ type: "node" | "pan"; id?: string; sx: number; sy: number; ox: number; oy: number; px: number; py: number } | null>(null);

  const graph = useMemo(() => parseGraph(input), [input]);

  const degrees = useMemo(() => {
    const m: Record<string, number> = {};
    if (graph.kind === "ok") {
      for (const l of graph.links) {
        m[l.source] = (m[l.source] || 0) + 1;
        m[l.target] = (m[l.target] || 0) + 1;
      }
    }
    return m;
  }, [graph]);

  // d3-force is heavy, so it is loaded on demand and only when a graph is present.
  useEffect(() => {
    let alive = true;
    (async () => {
      if (graph.kind !== "ok") return;
      const mod = await import("d3");
      if (!alive) return;
      const { forceSimulation, forceLink, forceManyBody, forceCenter } = mod;
      const nodes: SimNode[] = graph.nodes.map((n) => ({ ...n }));
      const links = graph.links.map((l) => ({ ...l }));
      const sim = forceSimulation(nodes)
        .force("link", forceLink<SimNode, Link>(links).id((d) => d.id).distance(70))
        .force("charge", forceManyBody().strength(-260))
        .force("center", forceCenter(W / 2, H / 2));
      sim.stop();
      for (let i = 0; i < 250; i++) sim.tick();
      if (!alive) return;
      const pos: Record<string, { x: number; y: number }> = {};
      for (const n of nodes) pos[n.id] = { x: n.x ?? W / 2, y: n.y ?? H / 2 };
      setPositions(pos);
      setTransform({ k: 1, x: 0, y: 0 });
    })();
    return () => {
      alive = false;
    };
  }, [graph, runId]);

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    const nodeEl = (e.target as Element).closest("[data-node-id]");
    const id = nodeEl?.getAttribute("data-node-id") ?? undefined;
    const p = id ? positions[id] : undefined;
    dragRef.current = {
      type: nodeEl ? "node" : "pan",
      id,
      sx: e.clientX,
      sy: e.clientY,
      ox: p?.x ?? 0,
      oy: p?.y ?? 0,
      px: transform.x,
      py: transform.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (d.type === "node" && d.id) {
      const id = d.id;
      const k = transform.k;
      setPositions((prev) => ({ ...prev, [id]: { x: d.ox + dx / k, y: d.oy + dy / k } }));
    } else {
      setTransform((prev) => ({ ...prev, x: d.px + dx, y: d.py + dy }));
    }
  }

  function endDrag() {
    dragRef.current = null;
  }

  function onWheel(e: React.WheelEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    setTransform((prev) => {
      const next = clamp(prev.k * Math.exp(-e.deltaY * 0.0015), 0.3, 3);
      const ratio = next / prev.k;
      return { k: next, x: px - (px - prev.x) * ratio, y: py - (py - prev.y) * ratio };
    });
  }

  function onNodeEnter(e: React.PointerEvent<SVGCircleElement>, id: string) {
    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    setHover({ id, x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  const ok = graph.kind === "ok";
  const nodeCount = ok ? graph.nodes.length : 0;
  const linkCount = ok ? graph.links.length : 0;
  const degreeList = ok ? Object.values(degrees) : [];
  const maxDegree = degreeList.length ? Math.max(...degreeList) : 0;
  const avgDegree = nodeCount ? ((linkCount * 2) / nodeCount).toFixed(1) : "0";

  return (
    <ToolShell
      title="Graph Visualizer"
      khmerTitle="បង្ហាញក្រាហ្វទំនាក់ទំនង"
      description="Force-directed graph from edges (A-B per line) or JSON {nodes, edges} — drag nodes, hover for degrees, and zoom."
      descriptionKm="ក្រាហ្វទំនាក់ទំនងដោយកម្លាំងរុញច្រាន ពីគែម (A-B ក្នុងមួយបន្ទាត់) ឬ JSON {nodes, edges} — អូសថ្នាំង ដាក់កណ្ដុរមើលដឺក្រេ និងពង្រីក។"
    >
      <Field label="Edges / JSON input" labelKm="ទិន្នន័យបញ្ចូល Edges / JSON">
        <TextArea rows={6} value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => setInput(SAMPLE)}>
          {t("Load sample", "ផ្ទុកឧទាហរណ៍")}
        </Button>
        <Button type="button" onClick={() => setInput("")}>
          {t("Clear", "សម្អាត")}
        </Button>
        <Button type="button" onClick={() => setRunId((i) => i + 1)}>
          {t("Relayout", "រៀបថ្មី")}
        </Button>
      </div>

      {graph.kind === "error" && (
        <p className="text-sm text-[var(--ink-dim)]">{t(graph.en, graph.km)}</p>
      )}

      {graph.kind === "empty" && (
        <p className="text-sm text-[var(--ink-dim)]">
          {t("Enter edges (one 'A-B' per line) or JSON with {nodes, edges}.", "បញ្ចូលគែម ('A-B' មួយក្នុងមួយបន្ទាត់) ឬ JSON ដែលមាន {nodes, edges}។")}
        </p>
      )}

      {ok && (
        <>
          <div className="relative">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="h-96 w-full touch-none rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
              onWheel={onWheel}
            >
              <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
                <g stroke="var(--ink-dim)" strokeWidth="1.5">
                  {graph.links.map((l, i) => {
                    const s = positions[l.source];
                    const tt = positions[l.target];
                    if (!s || !tt) return null;
                    return <line key={i} x1={s.x} y1={s.y} x2={tt.x} y2={tt.y} />;
                  })}
                </g>
                <g>
                  {graph.nodes.map((n) => {
                    const p = positions[n.id];
                    if (!p) return null;
                    const deg = degrees[n.id] ?? 0;
                    return (
                      <g key={n.id} transform={`translate(${p.x}, ${p.y})`}>
                        <circle
                          r={12 + Math.min(deg, 6)}
                          fill="var(--gold)"
                          className="cursor-grab stroke-[#0a0c0d]"
                          strokeWidth={1.5}
                          data-node-id={n.id}
                          onPointerEnter={(e) => onNodeEnter(e, n.id)}
                          onPointerMove={(e) => onNodeEnter(e, n.id)}
                          onPointerLeave={() => setHover(null)}
                        />
                        <text
                          y={26}
                          textAnchor="middle"
                          fontSize="11"
                          fill="var(--ink)"
                          className="pointer-events-none select-none"
                        >
                          {n.id}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </g>
            </svg>
            {hover && (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2 py-1 text-xs text-[var(--ink)]"
                style={{ left: hover.x, top: hover.y - 10 }}
              >
                <span className="font-semibold">{hover.id}</span>
                <span className="text-[var(--ink-dim)]">
                  {" "}
                  · {t("degree", "ដឺក្រេ")}: {degrees[hover.id] ?? 0}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Nodes", "ថ្នាំង")}</div>
              <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{nodeCount}</div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Edges", "គែម")}</div>
              <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{linkCount}</div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Max degree", "ដឺក្រេធំបំផុត")}</div>
              <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{maxDegree}</div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Avg degree", "ដឺក្រេមធ្យម")}</div>
              <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{avgDegree}</div>
            </div>
          </div>
        </>
      )}

      <aside className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-xs leading-relaxed text-[var(--ink-dim)]">
        <p className="mb-2 font-semibold text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងក្រេឌីត")}</p>
        <p>
          {t("Uses d3-force from the D3.js ecosystem by Mike Bostock (ISC license) for the force-directed layout; the simulation code and UI are original Tools123 work.", "ប្រើ d3-force ពីប្រព័ន្ធ D3.js របស់ Mike Bostock (អាជ្ញាបណ្ណ ISC) សម្រាប់ប្លង់ក្រាហ្វកម្លាំង។ កូដ simulation និង UI ជាស្នាដៃដើមរបស់ Tools123។")}{" "}
          <a href="https://d3js.org/d3-force/" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">d3js.org/d3-force</a>
          {" · "}
          <a href="https://github.com/d3/d3-force" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">github.com/d3/d3-force</a>
        </p>
      </aside>
    </ToolShell>
  );
}
