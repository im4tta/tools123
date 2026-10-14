"use client";

import { setWorkerUrl } from "maplibre-gl";

// maplibre-gl 6 locates its web worker relative to its own module URL, which the bundler
// rewrites, so map tools failed with "Worker failed to load" as soon as a source needed the
// worker (GeoJSON, vector tiles). Point it at the bundled copy of the self-contained worker.
// Import this module (for its side effect) before creating a map.
setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href);
