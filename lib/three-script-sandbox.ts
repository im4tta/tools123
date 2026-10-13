"use client";

/**
 * Runs a user-supplied Three.js model script inside an opaque-origin sandboxed iframe, so the
 * code cannot read this app's storage, cookies-adjacent state or DOM. The script's model is
 * returned as Three.js JSON (Object3D.toJSON, which keeps object uuids); when the model has an
 * animation hook (`group.userData.tick`), each tick runs inside the sandbox and only the changed
 * transforms/material values are streamed back, keyed by uuid, for the host scene to apply.
 *
 * Communication uses a dedicated MessageChannel handed to the frame once, so no other window can
 * inject messages into the exchange.
 */

/** Three r128 — the same build the 3D Model Previewer renders with (ObjectLoader-compatible JSON). */
const THREE_SRC = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
const READY_TIMEOUT_MS = 20_000;
const RUN_TIMEOUT_MS = 20_000;

/** [uuid, px, py, pz, qx, qy, qz, qw, sx, sy, sz, visible(0|1), color, emissive, emissiveIntensity, opacity] — material slots are -1 when absent. */
export type SandboxFrameChange = [string, ...number[]];

export type SandboxModel = {
  factoryKey: string;
  group: unknown;
  lights: unknown | null;
  backgroundHex: string | null;
  animated: boolean;
};

export class SandboxScriptError extends Error {
  constructor(message: string, readonly code?: "no-factory" | "timeout" | "load") {
    super(message);
    this.name = "SandboxScriptError";
  }
}

const RUNTIME = String.raw`(function () {
  var port = null, root = null, tick = null, snap = new Map(), busy = false;
  function post(msg) { port.postMessage(msg); }
  function fail(err) { post({ type: "error", message: (err && err.message) || String(err) }); }
  function clean(json) { return JSON.parse(JSON.stringify(json)); }
  function state(o) {
    var s = [o.position.x, o.position.y, o.position.z, o.quaternion.x, o.quaternion.y, o.quaternion.z, o.quaternion.w, o.scale.x, o.scale.y, o.scale.z, o.visible ? 1 : 0];
    var m = o.material;
    if (m && !Array.isArray(m)) s.push(m.color ? m.color.getHex() : -1, m.emissive ? m.emissive.getHex() : -1, m.emissiveIntensity == null ? -1 : m.emissiveIntensity, m.opacity == null ? -1 : m.opacity);
    return s;
  }
  function snapshot() { snap.clear(); root.traverse(function (o) { snap.set(o.uuid, state(o).join(",")); }); }
  function run(d) {
    try {
      if (typeof THREE === "undefined") throw new Error("Three.js failed to load in the sandbox.");
      var module = { exports: {} };
      var req = function (id) { if (id === "three") return THREE; throw new Error('Cannot resolve module "' + id + '" in the browser preview sandbox.'); };
      (new Function("exports", "require", "module", "THREE", d.code))(module.exports, req, module, THREE);
      var mod = module.exports, keys = Object.keys(mod);
      var fk = keys.find(function (k) { return /^create.*Model$/.test(k) && typeof mod[k] === "function"; });
      if (!fk) { post({ type: "error", code: "no-factory", message: "no-factory" }); return; }
      var group = mod[fk]({ shadows: !!d.shadows });
      if (!group || !group.isObject3D) throw new Error('"' + fk + '()" did not return a THREE.Object3D / Group.');
      var lk = keys.find(function (k) { return /LookDevLights$/.test(k) && typeof mod[k] === "function"; });
      var bk = keys.find(function (k) { return /^make.*Background$/.test(k) && typeof mod[k] === "function"; });
      var lights = lk ? mod[lk]() : null;
      var bg = bk ? mod[bk]() : null;
      root = group;
      tick = group.userData && typeof group.userData.tick === "function" ? group.userData.tick : null;
      root.updateMatrixWorld(true);
      snapshot();
      post({ type: "model", factoryKey: fk, group: clean(group.toJSON()), lights: lights && lights.isObject3D ? clean(lights.toJSON()) : null, backgroundHex: bg && bg.isColor ? bg.getHexString() : null, animated: !!tick });
    } catch (err) { fail(err); }
  }
  function step(d) {
    if (!tick || !root) { post({ type: "frame", changes: [] }); return; }
    try { tick(d.dt, d.elapsed); } catch (err) { tick = null; fail(err); return; }
    var changes = [];
    root.traverse(function (o) { var s = state(o), k = s.join(","); if (snap.get(o.uuid) !== k) { snap.set(o.uuid, k); changes.push([o.uuid].concat(s)); } });
    post({ type: "frame", changes: changes });
  }
  window.addEventListener("message", function (e) {
    if (port || e.source !== parent || !e.data || e.data.type !== "three-sandbox-init" || !e.ports[0]) return;
    port = e.ports[0];
    port.onmessage = function (ev) { var d = ev.data || {}; if (d.type === "run") run(d); else if (d.type === "tick") step(d); };
    post({ type: "ready", threeLoaded: typeof THREE !== "undefined" });
  });
})();`;

function srcdoc() {
  return `<!doctype html><html><head><meta charset="utf-8"><script src="${THREE_SRC}" crossorigin="anonymous"></script></head><body><script>${RUNTIME}</script></body></html>`;
}

/**
 * A sandbox session for one script run. Call `run` once, then `tick` from the host render loop
 * while `model.animated` is true, and `dispose` when replacing or unmounting the model.
 */
export class ThreeScriptSandbox {
  private frame: HTMLIFrameElement;
  private port: MessagePort | null = null;
  private ready: Promise<void>;
  private pending: ((data: Record<string, unknown>) => void) | null = null;
  private tickInFlight = false;
  private disposed = false;
  onFrame: ((changes: SandboxFrameChange[]) => void) | null = null;
  onError: ((message: string) => void) | null = null;

  constructor() {
    this.frame = document.createElement("iframe");
    // allow-scripts only: no allow-same-origin, so the frame gets an opaque origin.
    this.frame.setAttribute("sandbox", "allow-scripts");
    this.frame.setAttribute("aria-hidden", "true");
    this.frame.tabIndex = -1;
    this.frame.style.cssText = "position:absolute;width:0;height:0;border:0;visibility:hidden";
    this.ready = new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new SandboxScriptError("The preview sandbox did not start in time.", "timeout")), READY_TIMEOUT_MS);
      this.frame.addEventListener("load", () => {
        if (this.disposed || !this.frame.contentWindow) return;
        const channel = new MessageChannel();
        this.port = channel.port1;
        this.port.onmessage = (event: MessageEvent<Record<string, unknown>>) => {
          const data = event.data ?? {};
          if (data.type === "ready") {
            window.clearTimeout(timer);
            if (data.threeLoaded) resolve();
            else reject(new SandboxScriptError("Three.js failed to load in the preview sandbox. Check your connection.", "load"));
            return;
          }
          if (data.type === "frame") {
            this.tickInFlight = false;
            this.onFrame?.(data.changes as SandboxFrameChange[]);
            return;
          }
          if (data.type === "error" && !this.pending) {
            this.tickInFlight = false;
            this.onError?.(String(data.message));
            return;
          }
          const settle = this.pending;
          this.pending = null;
          settle?.(data);
        };
        // The frame's origin is opaque ("null"), so target "*"; the port is only transferable once.
        this.frame.contentWindow.postMessage({ type: "three-sandbox-init" }, "*", [channel.port2]);
      }, { once: true });
    });
    this.frame.srcdoc = srcdoc();
    document.body.appendChild(this.frame);
  }

  /** Compiled CommonJS source (already transformed by Babel) → serialized model. */
  async run(code: string, options: { shadows: boolean }): Promise<SandboxModel> {
    await this.ready;
    if (this.disposed || !this.port) throw new SandboxScriptError("The preview sandbox was closed.");
    const port = this.port;
    const data = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        this.pending = null;
        reject(new SandboxScriptError("The script took too long to build its model.", "timeout"));
      }, RUN_TIMEOUT_MS);
      this.pending = (d) => { window.clearTimeout(timer); resolve(d); };
      port.postMessage({ type: "run", code, shadows: options.shadows });
    });
    if (data.type === "error") {
      throw new SandboxScriptError(String(data.message), data.code === "no-factory" ? "no-factory" : undefined);
    }
    return {
      factoryKey: String(data.factoryKey),
      group: data.group,
      lights: data.lights ?? null,
      backgroundHex: typeof data.backgroundHex === "string" ? data.backgroundHex : null,
      animated: Boolean(data.animated),
    };
  }

  /** Advance the sandboxed animation one step. Skipped while the previous step is still in flight. */
  tick(dt: number, elapsed: number) {
    if (this.disposed || !this.port || this.tickInFlight) return;
    this.tickInFlight = true;
    this.port.postMessage({ type: "tick", dt, elapsed });
  }

  dispose() {
    this.disposed = true;
    this.onFrame = null;
    this.onError = null;
    this.port?.close();
    this.frame.remove();
  }
}
