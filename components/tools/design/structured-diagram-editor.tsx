"use client";

import { useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { recordExport } from "@/lib/export";

type Mode = "Diagram" | "Mind Map" | "Org Chart" | "WBS";
type NodeModel = { id: string; label: string; parentId: string | null; x: number; y: number };

const WIDTH = 1000;
const HEIGHT = 620;
const NODE_W = 156;
const NODE_H = 54;
const MODES: Mode[] = ["Diagram", "Mind Map", "Org Chart", "WBS"];
const INITIAL_NODES: NodeModel[] = [
  { id: "node-1", label: "Project / គម្រោង", parentId: null, x: 500, y: 80 },
  { id: "node-2", label: "Research / ស្រាវជ្រាវ", parentId: "node-1", x: 260, y: 230 },
  { id: "node-3", label: "Design / រចនា", parentId: "node-1", x: 500, y: 230 },
  { id: "node-4", label: "Delivery / ប្រគល់", parentId: "node-1", x: 740, y: 230 },
];

const buttonClass = "rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)] hover:border-[var(--gold-dim)] disabled:cursor-not-allowed disabled:opacity-45";
const inputClass = "w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function levels(nodes: NodeModel[]) {
  const ids = new Set(nodes.map((node) => node.id));
  const cache = new Map<string, number>();
  const depth = (node: NodeModel, trail = new Set<string>()): number => {
    if (cache.has(node.id)) return cache.get(node.id)!;
    if (!node.parentId || !ids.has(node.parentId) || trail.has(node.id)) return 0;
    const parent = nodes.find((item) => item.id === node.parentId);
    if (!parent) return 0;
    const value = 1 + depth(parent, new Set([...trail, node.id]));
    cache.set(node.id, value);
    return value;
  };
  const grouped = new Map<number, NodeModel[]>();
  nodes.forEach((node) => grouped.set(depth(node), [...(grouped.get(depth(node)) ?? []), node]));
  return grouped;
}

function autoLayout(nodes: NodeModel[], mode: Mode): NodeModel[] {
  if (!nodes.length) return nodes;
  const grouped = levels(nodes);
  const maxDepth = Math.max(...grouped.keys());
  return nodes.map((node) => {
    const depth = [...grouped].find(([, group]) => group.some((item) => item.id === node.id))?.[0] ?? 0;
    const group = grouped.get(depth) ?? [];
    const index = group.findIndex((item) => item.id === node.id);
    if (mode === "Mind Map") {
      if (depth === 0) {
        const angle = (index * Math.PI * 2) / Math.max(group.length, 1);
        return { ...node, x: 500 + Math.cos(angle) * index * 90, y: 310 + Math.sin(angle) * index * 90 };
      }
      const angle = ((index + depth / 2) * Math.PI * 2) / Math.max(group.length, 1);
      const radius = 105 + depth * 105;
      return { ...node, x: clamp(500 + Math.cos(angle) * radius, 90, 910), y: clamp(310 + Math.sin(angle) * radius, 45, 575) };
    }
    if (mode === "WBS") {
      return { ...node, x: 105 + depth * (790 / Math.max(maxDepth, 1)), y: ((index + 1) * HEIGHT) / (group.length + 1) };
    }
    const y = 65 + depth * (500 / Math.max(maxDepth, 1));
    const x = ((index + 1) * WIDTH) / (group.length + 1);
    if (mode === "Org Chart") return { ...node, x, y };
    return { ...node, x: clamp(x + (depth % 2 ? 35 : -35), 90, 910), y };
  });
}

function descendants(nodes: NodeModel[], id: string) {
  const found = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    nodes.forEach((node) => {
      if (node.parentId && (node.parentId === id || found.has(node.parentId)) && !found.has(node.id)) {
        found.add(node.id);
        changed = true;
      }
    });
  }
  return found;
}

function connectorPath(parent: NodeModel, child: NodeModel, mode: Mode) {
  if (mode === "WBS" || mode === "Mind Map") {
    const direction = child.x >= parent.x ? 1 : -1;
    const x1 = parent.x + direction * NODE_W / 2;
    const x2 = child.x - direction * NODE_W / 2;
    const middle = (x1 + x2) / 2;
    return `M ${x1} ${parent.y} C ${middle} ${parent.y}, ${middle} ${child.y}, ${x2} ${child.y}`;
  }
  const y1 = parent.y + NODE_H / 2;
  const y2 = child.y - NODE_H / 2;
  const middle = (y1 + y2) / 2;
  return mode === "Org Chart"
    ? `M ${parent.x} ${y1} V ${middle} H ${child.x} V ${y2}`
    : `M ${parent.x} ${y1} C ${parent.x} ${middle}, ${child.x} ${middle}, ${child.x} ${y2}`;
}

function shortLabel(label: string) {
  const characters = Array.from(label);
  return characters.length > 23 ? `${characters.slice(0, 22).join("")}…` : label;
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]!);
}

function svgDocument(nodes: NodeModel[], mode: Mode) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const lines = nodes.flatMap((node) => {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    return parent ? [`<path d="${connectorPath(parent, node, mode)}" fill="none" stroke="#94a3b8" stroke-width="2"/>`] : [];
  });
  const boxes = nodes.map((node) => `<g><title>${escapeXml(node.label)}</title><rect x="${node.x - NODE_W / 2}" y="${node.y - NODE_H / 2}" width="${NODE_W}" height="${NODE_H}" rx="10" fill="#fffbeb" stroke="#d97706" stroke-width="2"/><text x="${node.x}" y="${node.y + 5}" text-anchor="middle" font-family="'Kantumruy Pro','Siemreap','Khmer OS',sans-serif" font-size="14" fill="#1f2937">${escapeXml(shortLabel(node.label))}</text></g>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}"><title>${escapeXml(mode)}</title><rect width="100%" height="100%" fill="#ffffff"/>${lines.join("")}${boxes.join("")}</svg>`;
}

export default function StructuredDiagramEditor() {
  const { text } = useLanguage();
  const t = (en: string, km: string) => text(en, km);
  const [nodes, setNodes] = useState<NodeModel[]>(INITIAL_NODES);
  const [mode, setMode] = useState<Mode>("Diagram");
  const [selectedId, setSelectedId] = useState<string | null>("node-1");
  const [newLabel, setNewLabel] = useState("");
  const nextId = useRef(5);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const selected = useMemo(() => nodes.find((node) => node.id === selectedId) ?? null, [nodes, selectedId]);
  const blockedParents = useMemo(() => selected ? descendants(nodes, selected.id) : new Set<string>(), [nodes, selected]);
  const byId = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  function svgPoint(event: ReactPointerEvent<SVGElement>) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM();
    return matrix ? point.matrixTransform(matrix.inverse()) : { x: 0, y: 0 };
  }

  function startDrag(event: ReactPointerEvent<SVGGElement>, node: NodeModel) {
    event.preventDefault();
    event.stopPropagation();
    const point = svgPoint(event);
    svgRef.current?.setPointerCapture(event.pointerId);
    drag.current = { id: node.id, pointerId: event.pointerId, offsetX: point.x - node.x, offsetY: point.y - node.y };
    setSelectedId(node.id);
  }

  function moveDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    const point = svgPoint(event);
    const active = drag.current;
    setNodes((current) => current.map((node) => node.id === active.id ? {
      ...node,
      x: clamp(point.x - active.offsetX, NODE_W / 2, WIDTH - NODE_W / 2),
      y: clamp(point.y - active.offsetY, NODE_H / 2, HEIGHT - NODE_H / 2),
    } : node));
  }

  function endDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    drag.current = null;
  }

  function chooseMode(next: Mode) {
    setMode(next);
    setNodes((current) => autoLayout(current, next));
  }

  function addNode() {
    const label = newLabel.trim();
    if (!label) return;
    const id = `node-${nextId.current++}`;
    const parentId = selected?.id ?? null;
    const node = { id, label, parentId, x: parentId ? selected!.x + 190 : WIDTH / 2, y: parentId ? selected!.y + 110 : HEIGHT / 2 };
    setNodes((current) => autoLayout([...current, node], mode));
    setSelectedId(id);
    setNewLabel("");
  }

  function updateSelected(patch: Partial<Pick<NodeModel, "label" | "parentId">>) {
    if (!selected) return;
    setNodes((current) => current.map((node) => node.id === selected.id ? { ...node, ...patch } : node));
  }

  function deleteSelected() {
    if (!selected) return;
    setNodes((current) => current
      .filter((node) => node.id !== selected.id)
      .map((node) => node.parentId === selected.id ? { ...node, parentId: selected.parentId } : node));
    setSelectedId(null);
  }

  function exportSvg() {
    const url = URL.createObjectURL(new Blob([svgDocument(nodes, mode)], { type: "image/svg+xml;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${mode.toLowerCase().replaceAll(" ", "-")}.svg`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    recordExport();
  }

  return (
    <ToolShell
      title="Diagram & Structure Editor"
      khmerTitle="កម្មវិធីកែសម្រួលដ្យាក្រាម និងរចនាសម្ព័ន្ធ"
      description="Build diagrams, mind maps, organization charts, and work breakdown structures locally in your browser."
      descriptionKm="បង្កើតដ្យាក្រាម ផែនទីគំនិត តារាងអង្គការ និងរចនាសម្ព័ន្ធបំបែកការងារ នៅក្នុងកម្មវិធីរុករករបស់អ្នក។"
    >
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("Diagram mode", "របៀបដ្យាក្រាម")}>
        {MODES.map((item) => (
          <button key={item} type="button" onClick={() => chooseMode(item)} aria-pressed={mode === item} className={`${buttonClass} ${mode === item ? "border-[var(--gold)] text-[var(--gold)]" : ""}`}>
            {item === "Diagram" ? t(item, "ដ្យាក្រាម") : item === "Mind Map" ? t(item, "ផែនទីគំនិត") : item === "Org Chart" ? t(item, "តារាងអង្គការ") : t(item, "រចនាសម្ព័ន្ធការងារ")}
          </button>
        ))}
        <button type="button" onClick={() => setNodes((current) => autoLayout(current, mode))} disabled={!nodes.length} className={`${buttonClass} sm:ml-auto`}>{t("Auto-layout", "រៀបចំស្វ័យប្រវត្តិ")}</button>
        <button type="button" onClick={exportSvg} disabled={!nodes.length} className={buttonClass}>{t("Export SVG", "នាំចេញ SVG")}</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="overflow-hidden rounded-lg border border-[var(--ground-line)] bg-white">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="block h-[52vh] min-h-[420px] w-full touch-none select-none"
            aria-label={t("Diagram workspace", "ផ្ទៃការងារដ្យាក្រាម")}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}
          >
            <rect width={WIDTH} height={HEIGHT} fill="#ffffff" />
            {nodes.map((node) => {
              const parent = node.parentId ? byId.get(node.parentId) : undefined;
              return parent ? <path key={`line-${node.id}`} d={connectorPath(parent, node, mode)} fill="none" stroke="#94a3b8" strokeWidth="2" /> : null;
            })}
            {nodes.map((node) => {
              const active = node.id === selectedId;
              return (
                <g key={node.id} role="button" tabIndex={0} aria-label={node.label} className="cursor-grab active:cursor-grabbing" onPointerDown={(event) => startDrag(event, node)} onFocus={() => setSelectedId(node.id)}>
                  <title>{node.label}</title>
                  <rect x={node.x - NODE_W / 2} y={node.y - NODE_H / 2} width={NODE_W} height={NODE_H} rx="10" fill={active ? "#fef3c7" : "#fffbeb"} stroke={active ? "#b45309" : "#d97706"} strokeWidth={active ? 3 : 2} />
                  <text x={node.x} y={node.y + 5} textAnchor="middle" fontFamily="var(--font-kantumruy-pro), var(--font-siemreap), 'Khmer OS', sans-serif" fontSize="14" fill="#1f2937" pointerEvents="none">{shortLabel(node.label)}</text>
                </g>
              );
            })}
            {!nodes.length && <text x={WIDTH / 2} y={HEIGHT / 2} textAnchor="middle" fill="#64748b" fontSize="18">{t("No nodes yet — add one from the panel", "មិនទាន់មានធាតុ — បន្ថែមពីផ្ទាំង")}</text>}
          </svg>
        </div>

        <aside className="space-y-4 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <section className="space-y-2">
            <label className="block text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]" htmlFor="new-node-label">{selected ? t("Add child node", "បន្ថែមធាតុកូន") : t("Add root node", "បន្ថែមធាតុមេ")}</label>
            <input id="new-node-label" className={inputClass} value={newLabel} onChange={(event) => setNewLabel(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addNode(); }} placeholder={t("Node label", "ឈ្មោះធាតុ")} />
            <button type="button" onClick={addNode} disabled={!newLabel.trim()} className={`${buttonClass} w-full`}>{t("Add node", "បន្ថែមធាតុ")}</button>
            <p className="text-xs text-[var(--ink-faint)]">{selected ? t(`Parent: ${selected.label}`, `មេ៖ ${selected.label}`) : t("No parent selected", "មិនបានជ្រើសធាតុមេ")}</p>
          </section>

          <div className="border-t border-[var(--ground-line)]" />
          {selected ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-[var(--ink)]">{t("Selected node", "ធាតុដែលបានជ្រើស")}</h2>
              <label className="block text-xs text-[var(--ink-dim)]" htmlFor="selected-label">{t("Label", "ឈ្មោះ")}</label>
              <input id="selected-label" className={inputClass} value={selected.label} onChange={(event) => updateSelected({ label: event.target.value })} />
              <label className="block text-xs text-[var(--ink-dim)]" htmlFor="selected-parent">{t("Parent", "ធាតុមេ")}</label>
              <select id="selected-parent" className={inputClass} value={selected.parentId ?? ""} onChange={(event) => updateSelected({ parentId: event.target.value || null })}>
                <option value="">{t("None (root)", "គ្មាន (ឫស)")}</option>
                {nodes.filter((node) => node.id !== selected.id && !blockedParents.has(node.id)).map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}
              </select>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSelectedId(null)} className={`${buttonClass} flex-1`}>{t("Deselect", "ដោះជ្រើស")}</button>
                <button type="button" onClick={deleteSelected} className={`${buttonClass} flex-1 border-red-400 text-red-600`}>{t("Delete", "លុប")}</button>
              </div>
            </section>
          ) : (
            <p className="text-sm leading-relaxed text-[var(--ink-dim)]">{t("Select a node to edit its label or parent. Drag nodes directly in the workspace.", "ជ្រើសធាតុដើម្បីកែឈ្មោះ ឬធាតុមេ។ អូសធាតុដោយផ្ទាល់ក្នុងផ្ទៃការងារ។")}</p>
          )}
        </aside>
      </div>
    </ToolShell>
  );
}
