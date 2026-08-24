"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, LocateFixed, ZoomIn, ZoomOut } from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ToolShell, Field, Select, TextInput, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { recordExport, watermarkImageDataUrl } from "@/lib/export";

// Real map sources — all CORS-enabled, no API key required.
// Adapted from teetang.art (github.com/im4tta/teetang.art, MIT).
const TILE_PROVIDERS = [
  { id: "openfreemap", label: "OpenFreeMap (vector)", type: "vector", url: "https://tiles.openfreemap.org/styles/liberty", maxZoom: 18, attribution: "© OpenFreeMap · © OpenMapTiles · © OpenStreetMap contributors" },
  { id: "osm", label: "OpenStreetMap", type: "raster", url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", maxZoom: 19, attribution: "© OpenStreetMap contributors" },
  { id: "carto-light", label: "CARTO Light (minimal)", type: "raster", url: "https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png", maxZoom: 20, attribution: "© CARTO · © OpenStreetMap contributors" },
  { id: "carto-dark", label: "CARTO Dark", type: "raster", url: "https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png", maxZoom: 20, attribution: "© CARTO · © OpenStreetMap contributors" },
  { id: "satellite", label: "Esri Satellite", type: "raster", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", maxZoom: 19, attribution: "© Esri" },
];

// Themes recolour the vector basemap (background/water/land/roads/parks/buildings),
// mirroring teetang.art's palette approach.
const THEMES = [
  { id: "default", label: "Default", ui: "#0f766e", map: {
    background: "#faf8f5", land: "#faf8f5", water: "#cddff0", park: "#d6ead2",
    buildings: "#e3ddd2", roadMajor: "#ffffff", roadMinor: "#ffffff", roadCasing: "#cfc9be",
  }, rasterFilter: "none" },
  { id: "minimal", label: "Minimal", ui: "#2a2a2a", map: {
    background: "#e8e4dc", land: "#e8e4dc", water: "#cdc8c0", park: "#d8d4cc",
    buildings: "#8a8a88", roadMajor: "#1a1a1a", roadMinor: "#686862", roadCasing: "#c8c4bc",
  }, rasterFilter: "none" },
  { id: "midnight", label: "Midnight", ui: "#0d1b2a", map: {
    background: "#0d1b2a", land: "#0d1b2a", water: "#081420", park: "#142c42",
    buildings: "#2a3b52", roadMajor: "#d8eefa", roadMinor: "#2a4a68", roadCasing: "#2a4a68",
  }, rasterFilter: "brightness(0.85) saturate(1.1) hue-rotate(180deg)" },
  { id: "angkor", label: "Angkor", ui: "#c98a2c", map: {
    background: "#2a1a0a", land: "#2a1a0a", water: "#1a1008", park: "#3a2818",
    buildings: "#c8a06a", roadMajor: "#c8a06a", roadMinor: "#584020", roadCasing: "#685030",
  }, rasterFilter: "sepia(0.5) saturate(1.2)" },
  { id: "rose", label: "Rose", ui: "#b3402f", map: {
    background: "#1a0f14", land: "#1a0f14", water: "#24101c", park: "#2c1722",
    buildings: "#6a4a6a", roadMajor: "#f0d0d0", roadMinor: "#6a4a5a", roadCasing: "#5a3a4a",
  }, rasterFilter: "sepia(0.4) hue-rotate(-30deg) saturate(1.3)" },
] as const;

const LOCATIONS = [
  { id: "pnh", km: "ភ្នំពេញ", en: "Phnom Penh", lat: 11.5564, lng: 104.9282, zoom: 11 },
  { id: "reap", km: "សៀមរាប", en: "Siem Reap", lat: 13.3622, lng: 103.8590, zoom: 11 },
  { id: "shv", km: "ព្រះសីហនុ", en: "Sihanoukville", lat: 10.6213, lng: 103.4955, zoom: 11 },
  { id: "bat", km: "បាត់ដំបង", en: "Battambang", lat: 13.0957, lng: 103.2022, zoom: 11 },
  { id: "kp", km: "កំពត", en: "Kampot", lat: 10.6083, lng: 104.2232, zoom: 11 },
  { id: "kpc", km: "កំពង់ចាម", en: "Kampong Cham", lat: 11.9931, lng: 105.4728, zoom: 11 },
  { id: "bt", km: "បន្ទាយមានជ័យ", en: "Banteay Meanchey", lat: 13.7500, lng: 102.9833, zoom: 10 },
] as const;

const EXPORT_SIZES = [
  { id: "a4", label: "A4 portrait", w: 1240, h: 1754 },
  { id: "square", label: "Square 1:1", w: 1500, h: 1500 },
  { id: "landscape", label: "A4 landscape", w: 1754, h: 1240 },
] as const;

// Recolour the vector style with a theme. Returns a style object (not URL).
function themedStyle(base: Record<string, unknown>, theme: (typeof THEMES)[number]): Record<string, unknown> {
  type Layer = { id?: string; type?: string; paint?: Record<string, unknown>; layout?: Record<string, unknown> };
  const layers = ((base.layers as Layer[]) ?? []).map((l) => {
    const id = l.id ?? "";
    const paint = { ...(l.paint ?? {}) };
    if (id === "background") paint["background-color"] = theme.map.background;
    else if (id === "water") paint["fill-color"] = theme.map.water;
    else if (id === "park" || id === "park_outline" || id === "landuse_residential") paint["fill-color"] = theme.map.park;
    else if (id === "building") paint["fill-color"] = theme.map.buildings;
    else if (id.startsWith("road_motorway") || id.startsWith("road_trunk_primary") || id.startsWith("road_secondary_tertiary")) {
      if (id.endsWith("casing")) paint["line-color"] = theme.map.roadCasing;
      else paint["line-color"] = theme.map.roadMajor;
    } else if (id.startsWith("road_") || id.startsWith("bridge_") || id.startsWith("tunnel_")) {
      if (id.includes("rail")) return { ...l, paint };
      if (id.endsWith("casing")) paint["line-color"] = theme.map.roadCasing;
      else paint["line-color"] = theme.map.roadMinor;
    } else if (id.startsWith("waterway_")) paint["line-color"] = theme.map.water;
    return { ...l, paint };
  });
  return { ...base, layers };
}

// Render a themed raster provider onto a canvas (applies a CSS filter). Returns a data URL.
function rasterCapture(
  canvas: HTMLCanvasElement,
  w: number,
  h: number,
  filter: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = w;
    exportCanvas.height = h;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) { reject(new Error("canvas")); return; }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.filter = filter;
    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, w, h);
    resolve(exportCanvas.toDataURL("image/png"));
  });
}

export default function MapPosterGenerator() {
  const { text: t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const styleCache = useRef<Record<string, unknown> | null>(null);

  const [locId, setLocId] = useToolState<string>("map-poster:loc", LOCATIONS[0].id);
  const [providerId, setProviderId] = useToolState("map-poster:provider", "openfreemap");
  const [themeId, setThemeId] = useToolState("map-poster:theme", "default");
  const [sizeId, setSizeId] = useToolState<string>("map-poster:size", "a4");
  const [title, setTitle] = useToolState("map-poster:title", "Phnom Penh");
  const [zoom, setZoom] = useToolState("map-poster:zoom", "11");
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const loc = useMemo(() => LOCATIONS.find((l) => l.id === locId) ?? LOCATIONS[0], [locId]);
  const provider = useMemo(() => TILE_PROVIDERS.find((p) => p.id === providerId) ?? TILE_PROVIDERS[0], [providerId]);
  const theme = useMemo(() => THEMES.find((x) => x.id === themeId) ?? THEMES[0], [themeId]);
  const size = useMemo(() => EXPORT_SIZES.find((s) => s.id === sizeId) ?? EXPORT_SIZES[0], [sizeId]);

  const zoomNum = Math.max(2, Math.min(20, Number(zoom) || loc.zoom));

  // Apply the style (themed vector or raster) when provider/theme changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (provider.type === "vector") {
      let base = styleCache.current;
      const apply = () => {
        if (base) map.setStyle(themedStyle(base, theme) as unknown as maplibregl.StyleSpecification);
      };
      if (base) {
        apply();
      } else {
        fetch(provider.url)
          .then((r) => r.json())
          .then((json) => {
            styleCache.current = json as Record<string, unknown>;
            base = json as Record<string, unknown>;
            apply();
          })
          .catch(() => {});
      }
    } else {
      map.setStyle({
        version: 8,
        sources: { raster: { type: "raster", tiles: [provider.url], tileSize: 256, attribution: provider.attribution } },
        layers: [{ id: "raster", type: "raster", source: "raster" }],
      } as unknown as maplibregl.StyleSpecification);
    }
  }, [provider, theme, ready]);
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [loc.lng, loc.lat],
      zoom: zoomNum,
      attributionControl: { compact: true },
      preserveDrawingBuffer: true,
    } as unknown as maplibregl.MapOptions);
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    mapRef.current = map;
    map.on("load", () => setReady(true));
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center/zoom/marker when location changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [loc.lng, loc.lat], zoom: zoomNum, duration: 600 });
    const content = document.createElement("div");
    content.style.background = "#b3402f";
    content.style.border = "2px solid #fff";
    content.style.borderRadius = "50%";
    content.style.width = "14px";
    content.style.height = "14px";
    content.style.boxShadow = "0 0 0 3px rgba(179,64,47,0.35)";
    markerRef.current?.remove();
    markerRef.current = new maplibregl.Marker({ element: content }).setLngLat([loc.lng, loc.lat]).addTo(map);
  }, [loc, zoomNum]);

  async function doExport() {
    const map = mapRef.current;
    if (!map) return;
    setRendering(true);
    setError("");
    try {
      await new Promise<void>((res) => {
        if (map.areTilesLoaded()) res();
        else map.once("idle", () => res());
      });

      // Render an offscreen map at the exact export resolution so the poster
      // is sharp, not an upscaled screenshot. Returns a data URL.
      const holder = document.createElement("div");
      holder.style.position = "fixed";
      holder.style.left = "-99999px";
      holder.style.top = "0";
      holder.style.width = `${size.w}px`;
      holder.style.height = `${size.h}px`;
      document.body.appendChild(holder);

      const zoom = map.getZoom();
      const opts: Record<string, unknown> = {
        container: holder,
        center: map.getCenter(),
        zoom,
        pitch: map.getPitch(),
        bearing: map.getBearing(),
        preserveDrawingBuffer: true,
      };
      const source = provider.type === "vector" ? styleCache.current : null;
      if (source) {
        opts.style = themedStyle(source, theme) as unknown as maplibregl.StyleSpecification;
      } else if (provider.type === "vector") {
        opts.style = "https://tiles.openfreemap.org/styles/liberty";
      } else {
        opts.style = {
          version: 8,
          sources: { raster: { type: "raster", tiles: [provider.url], tileSize: 256, attribution: provider.attribution } },
          layers: [{ id: "raster", type: "raster", source: "raster" }],
        } as unknown as maplibregl.StyleSpecification;
      }

      const exportMap = new maplibregl.Map(opts as unknown as maplibregl.MapOptions);
      await new Promise<void>((res, rej) => {
        exportMap.on("idle", () => res());
        exportMap.on("error", (e) => rej(new Error(String((e as { error?: Error })?.error?.message ?? e))));
      });

      const glCanvas = exportMap.getCanvas();
      const url = provider.type === "vector" ? glCanvas.toDataURL("image/png") : await rasterCapture(glCanvas, size.w, size.h, theme.rasterFilter);

      // Draw the location pin at the centre of the exported poster.
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = size.w;
      finalCanvas.height = size.h;
      const fctx = finalCanvas.getContext("2d");
      if (fctx) {
        const img = new Image();
        img.onload = () => {
          fctx.drawImage(img, 0, 0, size.w, size.h);
          const cx = size.w / 2;
          const cy = size.h / 2;
          fctx.fillStyle = "#b3402f";
          fctx.strokeStyle = "#ffffff";
          fctx.lineWidth = Math.max(3, size.w * 0.004);
          fctx.beginPath();
          fctx.arc(cx, cy, size.w * 0.014, 0, Math.PI * 2);
          fctx.fill();
          fctx.stroke();
          setExportUrl(finalCanvas.toDataURL("image/png"));
          exportMap.remove();
          holder.remove();
        };
        img.src = url;
      } else {
        setExportUrl(url);
        exportMap.remove();
        holder.remove();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setRendering(false);
    }
  }

  async function download() {
    if (!exportUrl) return;
    const watermarked = await watermarkImageDataUrl(exportUrl, "image/png");
    const a = document.createElement("a");
    a.href = watermarked;
    a.download = `${(title || loc.en).toLowerCase().replace(/\s+/g, "-")}-map-poster.png`;
    a.click();
    recordExport();
  }

  return (
    <ToolShell
      title="Map Poster Generator"
      khmerTitle="បង្កើតផ្ទាំងផែនទី"
      description="Create a printable map poster of any location — a live pan-and-zoom map with themed basemaps, then export as a high-resolution PNG."
      descriptionKm="បង្កើតផ្ទាំងផែនទីសម្រាប់ទីកន្លែងណាមួយ — ផែនទីផ្ទាល់អូស-ពង្រីក ជាមួយផ្ទៃខាងក្រោយពណ៌តាមប្រធានបទ រួចនាំចេញជា PNG គុណភាពខ្ពស់។"
    >
      <Row>
        <Field label={t("Start point", "ចំណុចចាប់ផ្តើម")}>
          <Select value={locId} onChange={(e) => setLocId(e.target.value)}>
            {LOCATIONS.map((l) => (
              <option key={l.id} value={l.id}>{l.km} — {l.en}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("Zoom", "ពង្រីក")}>
          <TextInput value={zoom} onChange={(e) => setZoom(e.target.value)} className="font-mono-ui" inputMode="numeric" />
        </Field>
      </Row>

      <Row>
        <Field label={t("Basemap", "ផ្ទៃខាងក្រោយ")}>
          <Select value={providerId} onChange={(e) => setProviderId(e.target.value)}>
            {TILE_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("Theme", "ប្រធានបទ")}>
          <Select value={themeId} onChange={(e) => setThemeId(e.target.value)}>
            {THEMES.map((x) => (
              <option key={x.id} value={x.id}>{x.label}</option>
            ))}
          </Select>
        </Field>
      </Row>

      <Row>
        <Field label={t("Export size", "ទំហំនាំចេញ")}>
          <Select value={sizeId} onChange={(e) => setSizeId(e.target.value)}>
            {EXPORT_SIZES.map((s) => (
              <option key={s.id} value={s.id}>{s.label} · {s.w}×{s.h}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("Poster title", "ចំណងជើងផ្ទាំង")}>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
      </Row>

      <div className="relative overflow-hidden rounded-lg border border-[var(--ground-line)]">
        <div ref={containerRef} className="h-[380px] w-full sm:h-[460px]" />
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <button type="button" onClick={() => setZoom(String(((Number(zoom) || 11) + 1).toFixed(0)))} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-2 text-[var(--ink)] hover:border-[var(--gold-dim)]"><ZoomIn size={15} /></button>
          <button type="button" onClick={() => setZoom(String(((Number(zoom) || 11) - 1).toFixed(0)))} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-2 text-[var(--ink)] hover:border-[var(--gold-dim)]"><ZoomOut size={15} /></button>
          <button type="button" onClick={() => setLocId("pnh")} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-2 text-[var(--ink)] hover:border-[var(--gold-dim)]" title="Recenter"><LocateFixed size={15} /></button>
        </div>
        {!ready && <div className="absolute inset-0 flex items-center justify-center bg-[var(--ground-raised)] text-sm text-[var(--ink-dim)]">{t("Loading map…", "កំពុងផ្ទុកផែនទី…")}</div>}
        <div className="absolute bottom-1 right-2 text-[10px] text-[var(--ink-dim)] opacity-70">{provider.attribution}</div>
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <Row>
        <Button onClick={doExport} disabled={!ready || rendering}>
          {rendering ? t("Preparing…", "កំពុងរៀបចំ…") : t("Export PNG", "នាំចេញ PNG")}
        </Button>
        {exportUrl && (
          <Button onClick={download} disabled={!exportUrl}>
            <Download size={15} className="mr-1 inline" />
            {t("Download", "ទាញយក")}
          </Button>
        )}
      </Row>

      {exportUrl && (
        <div className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
            {t("Export preview", "មើលជាមុន")} · {size.w}×{size.h}
          </div>
          <div className="flex items-center justify-center rounded-md border border-[var(--ground-line)] bg-[var(--ground)] p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={exportUrl} alt="Map poster export" className="max-h-[460px] max-w-full rounded-sm" />
          </div>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-[var(--ink-faint)]">
        {t("Live basemap · vector tiles (OpenFreeMap) are recolored into themes; raster providers apply the theme as a filter. Exported at your chosen size. Adapted from teetang.art (github.com/im4tta/teetang.art, MIT).", "ផ្ទៃខាងក្រោយផ្ទាល់ · ផ្ទាំងគំនូរវ៉ិចទ័រ (OpenFreeMap) ត្រូវបានពណ៌តាមប្រធានបទ ឯអ្នកផ្តល់ raster អនុវត្តប្រធានបទជាតម្រង។ នាំចេញតាមទំហំដែលអ្នកជ្រើសរើស។ កែសម្រួលពី teetang.art (github.com/im4tta/teetang.art, MIT)។")}
      </p>
    </ToolShell>
  );
}
