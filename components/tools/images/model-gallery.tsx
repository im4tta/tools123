"use client";
import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";

import { ToolShell, Field } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { MODEL_GALLERY } from "@/lib/model-gallery/registry";
import { recordExport } from "@/lib/export";

type ThreeModule = typeof import("three");

type SceneRefs = {
  THREE: ThreeModule;
  renderer: import("three").WebGLRenderer;
  scene: import("three").Scene;
  camera: import("three").PerspectiveCamera;
  controls: import("three/addons/controls/OrbitControls.js").OrbitControls;
  clock: import("three").Clock;
  raf: number;
  ground: import("three").Mesh | null;
  modelRoot: import("three").Group | null;
  lightsRoot: import("three").Group | null;
};

export default function ModelGalleryTool() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const refs = useRef<SceneRefs | null>(null);

  const [modelId, setModelId] = useState(MODEL_GALLERY[0]?.id ?? "");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showControls, setShowControls] = useState(false);
  const [shadows, setShadows] = useState(true);
  const [showGround, setShowGround] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [wireframe, setWireframe] = useState(false);

  // --- Mount the three.js scene once ---
  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    (async () => {
      try {
        const THREE = await import("three");
        const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
        if (cancelled || !containerRef.current) return;

        const container = containerRef.current;
        const w = container.clientWidth || 600;
        const h = container.clientHeight || 460;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w, h);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, w / h, 0.01, 100);
        camera.position.set(2.4, 2.0, 3.0);

        const ground = new THREE.Mesh(
          new THREE.CircleGeometry(6, 48),
          new THREE.ShadowMaterial({ opacity: 0.22 }),
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.target.set(0, 0.4, 0);
        controls.minDistance = 1;
        controls.maxDistance = 10;

        const clock = new THREE.Clock();
        const state: SceneRefs = { THREE, renderer, scene, camera, controls, clock, raf: 0, ground, modelRoot: null, lightsRoot: null };
        refs.current = state;

        const animate = () => {
          state.raf = requestAnimationFrame(animate);
          const dt = clock.getDelta();
          const elapsed = clock.getElapsedTime();
          const tick = state.modelRoot?.userData?.tick as ((dt: number, elapsed: number) => void) | undefined;
          tick?.(dt, elapsed);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();

        resizeObserver = new ResizeObserver(() => {
          if (!containerRef.current) return;
          const cw = containerRef.current.clientWidth || 1;
          const ch = containerRef.current.clientHeight || 1;
          camera.aspect = cw / ch;
          camera.updateProjectionMatrix();
          renderer.setSize(cw, ch);
        });
        resizeObserver.observe(container);

        setReady(true);
      } catch {
        setError("Could not start the 3D viewer — WebGL may be unavailable in this browser.");
      }
    })();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      const state = refs.current;
      if (state) {
        cancelAnimationFrame(state.raf);
        state.renderer.dispose();
        state.renderer.domElement.remove();
      }
      refs.current = null;
    };
  }, []);

  // --- Load the selected model whenever it changes ---
  useEffect(() => {
    if (!ready || !modelId) return;
    const entry = MODEL_GALLERY.find((m) => m.id === modelId);
    const state = refs.current;
    if (!entry || !state) return;

    let cancelled = false;
    setBusy(true);
    setError(null);

    entry
      .load()
      .then(({ createModel, createLights, background }) => {
        if (cancelled || !state) return;
        const { THREE, scene } = state;

        if (state.modelRoot) scene.remove(state.modelRoot);
        if (state.lightsRoot) scene.remove(state.lightsRoot);

        const model = createModel({ shadows: true });
        scene.add(model);
        state.modelRoot = model;

        const lights = createLights ? createLights() : defaultLights(THREE);
        scene.add(lights);
        state.lightsRoot = lights;

        scene.background = background ? background() : new THREE.Color(0xeceded);
      })
      .catch(() => setError("Could not load this model."))
      .finally(() => !cancelled && setBusy(false));

    return () => {
      cancelled = true;
    };
  }, [ready, modelId]);

  useEffect(() => {
    const state = refs.current;
    if (!state) return;
    state.renderer.shadowMap.enabled = shadows;
  }, [shadows]);

  useEffect(() => {
    const state = refs.current;
    if (state?.ground) state.ground.visible = showGround;
  }, [showGround]);

  useEffect(() => {
    const state = refs.current;
    if (state?.controls) state.controls.autoRotate = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    const state = refs.current;
    state?.modelRoot?.traverse((obj) => {
      const mesh = obj as import("three").Mesh;
      if (mesh.isMesh) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of materials) {
          (mat as { wireframe?: boolean }).wireframe = wireframe;
        }
      }
    });
  }, [wireframe]);

  async function exportGLB() {
    const state = refs.current;
    if (!state?.modelRoot) return;
    const { GLTFExporter } = await import("three/addons/exporters/GLTFExporter.js");
    const exporter = new GLTFExporter();
    exporter.parse(
      state.modelRoot,
      (result) => {
        const blob = new Blob([result as ArrayBuffer], { type: "model/gltf-binary" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${modelId}.glb`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        recordExport();
      },
      (err) => setError(`Could not export GLB: ${String(err)}`),
      { binary: true },
    );
  }

  const active = MODEL_GALLERY.find((m) => m.id === modelId);

  return (
    <ToolShell
      title="3D Model Gallery"
      description="A viewer for procedural Three.js models — objects rebuilt from primitives (spheres, extrusions, textures) rather than scanned or photogrammetry meshes. Add new entries by dropping in a factory file built with the img2threejs pipeline (or hand-written the same way)."
    >
      <Field label="Model" hint={`${MODEL_GALLERY.length} in gallery`}>
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
          {MODEL_GALLERY.map((m) => (
            <button
              key={m.id}
              onClick={() => setModelId(m.id)}
              className={`flex-shrink-0 w-56 p-3 text-left rounded-xl transition-shadow border ${m.id === modelId ? 'ring-2 ring-cyan-400 shadow-lg' : 'bg-[var(--ground-raised)] border-[var(--ground-line)] hover:shadow-md'}`}
              title={m.title}
            >
              <div className="font-semibold text-sm leading-tight truncate">{m.title}</div>
              <div className="text-[11px] text-[var(--ink-dim)] mt-1 line-clamp-2">{m.description}</div>
            </button>
          ))}
        </div>
      </Field>

      {active && <p className="text-sm leading-relaxed text-[var(--ink-dim)]">{active.description}</p>}

      <p className="text-xs italic text-[var(--ink-dim)] mt-2 mb-3">Note: Many model factory files and shapes were generated by Claude; some meshes or shapes may need manual refinement or cleanup.</p>

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs text-[var(--ink-dim)]">
        <input type="checkbox" checked={showControls} onChange={(event) => setShowControls(event.target.checked)} /> Scene controls
      </label>

      {showControls && (
        <div className="mt-2 flex flex-wrap gap-4 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs text-[var(--ink-dim)]">
          <label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={shadows} onChange={(event) => setShadows(event.target.checked)} /> Shadows</label>
          <label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={showGround} onChange={(event) => setShowGround(event.target.checked)} /> Ground</label>
          <label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={autoRotate} onChange={(event) => setAutoRotate(event.target.checked)} /> Auto-rotate</label>
          <label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={wireframe} onChange={(event) => setWireframe(event.target.checked)} /> Wireframe</label>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative h-[460px] w-full overflow-hidden rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]"
      >
        {busy && (
          <div className="absolute right-3 top-3 rounded-md bg-black/50 px-2 py-1 text-xs text-white">Loading…</div>
        )}
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="flex justify-end">
        <Button onClick={exportGLB} disabled={!ready || busy}>
          <span className="inline-flex items-center gap-1.5">
            <Download size={13} /> Download GLB
          </span>
        </Button>
      </div>
    </ToolShell>
  );
}

function defaultLights(THREE: ThreeModule) {
  const g = new THREE.Group();
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(4, 7, 5);
  key.castShadow = true;
  g.add(key);
  g.add(new THREE.HemisphereLight(0xffffff, 0x9a9a9d, 0.5));
  return g;
}
