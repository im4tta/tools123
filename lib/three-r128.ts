"use client";

/**
 * Three.js r128 for the tools written against its classic global API (3D Model Previewer,
 * Materials). Loaded from the app's own npm dependency (`three-r128` = three@0.128.0, code-split,
 * integrity-checked via package-lock) instead of cdnjs/jsDelivr, and exposed as `window.THREE`
 * because those tools and the classic example loaders (examples/js) read that global.
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- window.THREE (r128 global build) is intentionally untyped */
declare global {
  interface Window {
    THREE: any;
  }
}

let corePromise: Promise<any> | null = null;
let loadersPromise: Promise<void> | null = null;

/** Sets window.THREE to three r128 (once) and resolves with it. */
export function loadThreeR128(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("three r128 is browser-only"));
  if (!corePromise) {
    corePromise = import("three-r128").then((ns) => {
      // The example loaders assign onto THREE (THREE.OrbitControls = …), so expose an
      // extensible copy rather than the frozen module namespace.
      window.THREE = { ...ns };
      return window.THREE;
    });
    corePromise.catch(() => { corePromise = null; });
  }
  return corePromise;
}

/** Loads three r128 plus OrbitControls and the GLTF/OBJ/STL loaders onto window.THREE. */
export function loadThreeR128WithLoaders(): Promise<any> {
  if (!loadersPromise) {
    loadersPromise = loadThreeR128()
      .then(() => Promise.all([
        // Classic scripts that read and extend the global THREE set above.
        import("three-r128/examples/js/controls/OrbitControls.js"),
        import("three-r128/examples/js/loaders/GLTFLoader.js"),
        import("three-r128/examples/js/loaders/OBJLoader.js"),
        import("three-r128/examples/js/loaders/STLLoader.js"),
      ]))
      .then(() => undefined);
    loadersPromise.catch(() => { loadersPromise = null; });
  }
  return loadersPromise.then(() => window.THREE);
}
