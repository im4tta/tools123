"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { Focus, Minus, Network, Plus, Search } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { STATIC_DATABASE, type KhmerWordData } from "@/lib/khmer-lexicon-db";

type LinkType = "homophone" | "synonym" | "antonym" | "related";
interface LexicalNode extends d3.SimulationNodeDatum { id: string; en: string; definition: string; group: "root" | LinkType; radius: number; }
interface LexicalLink extends d3.SimulationLinkDatum<LexicalNode> { source: string | LexicalNode; target: string | LexicalNode; type: LinkType; }

const COLORS: Record<LexicalNode["group"], string> = { root: "#d4a24c", homophone: "#d4a24c", synonym: "#3f9d63", antonym: "#d9534f", related: "#4a9db5" };
const LABELS: Record<LinkType, [string, string]> = { homophone: ["Homophones", "សទិសសូរ"], synonym: ["Synonyms", "សទិសន័យ"], antonym: ["Antonyms", "ពាក្យផ្ទុយ"], related: ["Related", "ពាក់ព័ន្ធ"] };

function linksFor(word: KhmerWordData): { target: string; type: LinkType }[] {
  return [...word.homophones.map((x) => ({ target: x.word, type: "homophone" as const })), ...word.synonyms.map((target) => ({ target, type: "synonym" as const })), ...word.antonyms.map((target) => ({ target, type: "antonym" as const })), ...word.relatedWords.map((target) => ({ target, type: "related" as const }))].filter((link, i, all) => all.findIndex((x) => x.target === link.target && x.type === link.type) === i);
}

function makeGraph() {
  const all = Object.keys(STATIC_DATABASE).map((id) => ({ id, links: linksFor(STATIC_DATABASE[id]).filter((link) => STATIC_DATABASE[link.target]) })).filter((item) => item.links.length > 0).sort((a, b) => b.links.length - a.links.length).slice(0, 180);
  const ids = new Set(all.map((item) => item.id));
  const nodes: LexicalNode[] = all.map((item) => ({ id: item.id, en: STATIC_DATABASE[item.id].definition, definition: STATIC_DATABASE[item.id].definition, group: "related", radius: Math.max(16, Math.min(30, 14 + item.links.length * 3)) }));
  const links: LexicalLink[] = [];
  all.forEach((item) => item.links.forEach((link) => { if (ids.has(link.target)) links.push({ source: item.id, target: link.target, type: link.type }); }));
  return { nodes, links };
}

export default function WordRelationships() {
  const { text: t } = useLanguage();
  const [query, setQuery] = useToolState("word-relationships:query", "ទឹក");
  const [selectedId, setSelectedId] = useState("ទឹក");
  const [searchError, setSearchError] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const groupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const nodeSelection = useRef<d3.Selection<SVGCircleElement, LexicalNode, SVGGElement, unknown> | null>(null);
  const linkSelection = useRef<d3.Selection<SVGLineElement, LexicalLink, SVGGElement, unknown> | null>(null);
  const textSelection = useRef<d3.Selection<SVGTextElement, LexicalNode, SVGGElement, unknown> | null>(null);
  const graph = useMemo(() => makeGraph(), []);
  const selected = STATIC_DATABASE[selectedId] ?? null;
  const suggestions = query.trim() ? Object.keys(STATIC_DATABASE).filter((word) => word.toLowerCase().includes(query.toLowerCase())).slice(0, 10) : [];

  useEffect(() => {
    const svgElement = svgRef.current;
    const container = containerRef.current;
    if (!svgElement || !container) return;
    const width = Math.max(container.clientWidth, 500);
    const height = Math.max(container.clientHeight, 520);
    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();
    const group = svg.append("g");
    groupRef.current = group;
    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.15, 4]).on("zoom", (event) => group.attr("transform", event.transform));
    svg.call(zoom); zoomRef.current = zoom;
    svg.on("click", (event) => { const target = event.target as Element; if (!(target instanceof SVGCircleElement) && !target.closest?.("circle")) { setSelectedId(""); setQuery(""); } });
    const simulation = d3.forceSimulation<LexicalNode>(graph.nodes)
      .force("link", d3.forceLink<LexicalNode, LexicalLink>(graph.links).id((node) => node.id).distance(90).strength(.45))
      .force("charge", d3.forceManyBody<LexicalNode>().strength(-180))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide<LexicalNode>().radius((node) => node.radius + 12));
    const links = group.append("g").selectAll("line").data(graph.links).join("line") as d3.Selection<SVGLineElement, LexicalLink, SVGGElement, unknown>;
    const nodes = group.append("g").selectAll("circle").data(graph.nodes).join("circle") as d3.Selection<SVGCircleElement, LexicalNode, SVGGElement, unknown>;
    const text = group.append("g").selectAll("text").data(graph.nodes).join("text") as d3.Selection<SVGTextElement, LexicalNode, SVGGElement, unknown>;
    links.attr("stroke", (link) => COLORS[link.type]).attr("stroke-opacity", .35).attr("stroke-width", 1.5);
    nodes.attr("r", (node) => node.radius).attr("fill", (node) => COLORS[node.group]).attr("fill-opacity", .72).attr("stroke", "#e2e8f0").attr("stroke-opacity", .7).attr("stroke-width", 1.5).on("click", (event, node) => { event.stopPropagation(); setSelectedId(node.id); setQuery(node.id); });
    text.text((node) => node.id).attr("text-anchor", "middle").attr("dy", 4).attr("fill", "#fff").attr("font-family", "var(--font-kantumruy-pro), sans-serif").attr("font-size", 11).attr("pointer-events", "none");
    nodeSelection.current = nodes; linkSelection.current = links; textSelection.current = text;
    const drag = d3.drag<SVGCircleElement, LexicalNode>().on("start", (event, node) => { if (!event.active) simulation.alphaTarget(.25).restart(); node.fx = node.x; node.fy = node.y; }).on("drag", (event, node) => { node.fx = event.x; node.fy = event.y; }).on("end", (event, node) => { if (!event.active) simulation.alphaTarget(0); node.fx = null; node.fy = null; });
    nodes.call(drag);
    simulation.on("tick", () => { links.attr("x1", (link) => (link.source as LexicalNode).x ?? 0).attr("y1", (link) => (link.source as LexicalNode).y ?? 0).attr("x2", (link) => (link.target as LexicalNode).x ?? 0).attr("y2", (link) => (link.target as LexicalNode).y ?? 0); nodes.attr("cx", (node) => node.x ?? 0).attr("cy", (node) => node.y ?? 0); text.attr("x", (node) => node.x ?? 0).attr("y", (node) => node.y ?? 0); });
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(.72).translate(-width / 2, -height / 2));
    return () => { simulation.stop(); };
  }, [graph, setQuery]);

  useEffect(() => {
    const svgElement = svgRef.current;
    const container = containerRef.current;
    if (!selectedId) {
      graph.nodes.forEach((item) => { item.group = "related"; });
      nodeSelection.current?.attr("fill", (item) => COLORS[item.group]).attr("fill-opacity", 1).attr("stroke-width", 1.5);
      linkSelection.current?.attr("stroke-opacity", .35).attr("stroke-width", 1.5);
      textSelection.current?.attr("fill-opacity", 1);
      return;
    }
    const node = graph.nodes.find((item) => item.id === selectedId);
    if (!node) return;
    graph.nodes.forEach((item) => { item.group = item.id === selectedId ? "root" : "related"; });
    const connected = new Set([selectedId]);
    graph.links.forEach((link) => { const source = typeof link.source === "string" ? link.source : link.source.id; const target = typeof link.target === "string" ? link.target : link.target.id; if (source === selectedId) connected.add(target); if (target === selectedId) connected.add(source); });
    nodeSelection.current?.attr("fill", (item) => COLORS[item.group]).attr("fill-opacity", (item) => connected.has(item.id) ? 1 : .08).attr("stroke-width", (item) => item.id === selectedId ? 3 : 1.5);
    linkSelection.current?.attr("stroke-opacity", (link) => { const source = typeof link.source === "string" ? link.source : link.source.id; const target = typeof link.target === "string" ? link.target : link.target.id; return source === selectedId || target === selectedId ? 1 : .08; }).attr("stroke-width", (link) => { const source = typeof link.source === "string" ? link.source : link.source.id; const target = typeof link.target === "string" ? link.target : link.target.id; return source === selectedId || target === selectedId ? 3 : 1.5; });
    textSelection.current?.attr("fill-opacity", (item) => connected.has(item.id) ? 1 : .08);
    if (svgElement && container && typeof node.x === "number" && isFinite(node.x) && typeof node.y === "number" && isFinite(node.y)) {
      const t = d3.zoomTransform(svgElement);
      const zoom = zoomRef.current ?? d3.zoom<SVGSVGElement, unknown>();
      const apply = zoom.transform as unknown as (t: d3.Transition<SVGSVGElement, unknown, null, undefined>, x: d3.ZoomTransform) => void;
      d3.select(svgElement).transition().duration(450).call(apply, d3.zoomIdentity.translate(container.clientWidth / 2, container.clientHeight / 2).scale(t.k).translate(-node.x, -node.y));
    }
  }, [graph, selectedId]);

  function search() {
    const word = query.trim();
    if (!word) return;
    if (STATIC_DATABASE[word]) { setSelectedId(word); setSearchError(false); } else setSearchError(true);
  }

  const exactMatch = query.trim() && STATIC_DATABASE[query.trim()];
  const shownSuggestions = exactMatch ? [] : suggestions;

  const selectedLinks = selected ? linksFor(selected).filter((link) => STATIC_DATABASE[link.target]) : [];
  return <ToolShell title="Khmer Word Relationship Explorer" khmerTitle="ស្វែងរកទំនាក់ទំនងពាក្យខ្មែរ" description="Obsidian-style force graph of the full local Khmer lexicon: homophones, compounds, synonyms, antonyms, phrases, and related words." descriptionKm="ក្រាហ្វបែប Obsidian នៃសទ្ទានុក្រមខ្មែរទាំងមូល៖ សទិសសូរ ពាក្យផ្សំ សទិសន័យ បដិសព្ទ ឃ្លា និងពាក្យទាក់ទង។">
    <div className="rounded-2xl border border-[var(--ground-line)] bg-[#0f172a] p-3 shadow-2xl sm:p-4"><div className="grid min-h-[680px] grid-cols-1 overflow-hidden rounded-xl border border-white/10 bg-[#0b1017] lg:grid-cols-[18rem_1fr]">
      <aside className="flex min-h-0 flex-col border-b border-white/10 bg-[#151c26] lg:border-b-0 lg:border-r"><div className="border-b border-white/10 p-4"><div className="mb-3 flex items-center gap-2 text-slate-100"><Network size={17} className="text-[#d4a24c]" /><span className="font-khmer font-bold">ក្រាហ្វបណ្ដាញពាក្យខ្មែរ</span></div><div className="relative"><Search size={14} className="absolute left-3 top-3 text-slate-500" /><input value={query} onChange={(e) => { setQuery(e.target.value); setSearchError(false); }} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="ស្វែងរកពាក្យ…" className="w-full rounded-lg border border-white/10 bg-[#0b1017] py-2.5 pl-9 pr-14 font-khmer text-sm text-slate-100 outline-none focus:border-[#d4a24c]" /><button onClick={search} className="absolute right-1.5 top-1.5 rounded bg-[#d4a24c] px-2 py-1 text-[10px] font-bold text-[#0b1017]">ស្វែងរក</button>{shownSuggestions.length > 0 && <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-auto rounded-lg border border-white/10 bg-[#151c26] shadow-xl">{shownSuggestions.map((word) => <button key={word} onClick={() => { setQuery(word); setSelectedId(word); setSearchError(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left font-khmer text-xs text-slate-200 hover:bg-[#0b1017]"><span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: COLORS.related }} />{word}</button>)}</div>}</div>{searchError && <p className="mt-2 text-[10px] text-orange-400">មិនមានពាក្យនេះក្នុងទិន្នន័យក្រាហ្វទេ។</p>}</div><div className="flex-1 overflow-auto p-4">{selected ? <><div className="mb-4"><div className="font-khmer text-3xl font-bold text-[#d4a24c]">{selected.word}</div><p className="mt-1 text-xs leading-relaxed text-slate-400">{selected.definition}</p></div><div className="space-y-2">{selectedLinks.map((link) => <button key={`${link.type}-${link.target}`} onClick={() => { setSelectedId(link.target); setQuery(link.target); }} className="flex w-full items-center gap-2 rounded border border-white/10 bg-[#0b1017] px-2.5 py-2 text-left hover:border-[#d4a24c]/60"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[link.type] }} /><span className="font-khmer text-xs text-slate-200">{link.target}</span><span className="ml-auto text-[9px] text-slate-500">{t(LABELS[link.type][0], LABELS[link.type][1])}</span></button>)}</div></> : <p className="text-center text-xs text-slate-500">ជ្រើសរើសពាក្យដើម្បីមើលព័ត៌មាន។</p>}</div></aside>
      <main ref={containerRef} className="relative min-h-[560px] overflow-hidden bg-[radial-gradient(#273244_1px,transparent_1px)] [background-size:18px_18px]"><div className="absolute left-4 top-4 z-10 rounded-lg border border-white/10 bg-[#151c26]/90 p-3 text-[10px] text-slate-400 backdrop-blur"><div className="mb-2 font-bold text-slate-200">ប្រភេទទំនាក់ទំនង</div>{(Object.keys(LABELS) as LinkType[]).map((type) => <div key={type} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[type] }} />{LABELS[type][1]}</div>)}</div><div className="absolute bottom-4 right-4 z-10 flex gap-1"><button onClick={() => svgRef.current && zoomRef.current && d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 1.3)} className="rounded-full border border-white/10 bg-[#151c26] p-2 text-slate-300"><Plus size={14} /></button><button onClick={() => svgRef.current && zoomRef.current && d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, .7)} className="rounded-full border border-white/10 bg-[#151c26] p-2 text-slate-300"><Minus size={14} /></button><button onClick={() => setSelectedId("")} className="rounded-full border border-white/10 bg-[#151c26] p-2 text-slate-300"><Focus size={14} /></button></div><svg ref={svgRef} className="h-full min-h-[560px] w-full" /></main>
    </div></div>
  </ToolShell>;
}
