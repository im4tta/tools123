"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { recordExport } from "@/lib/export";
import { Download, Eye, EyeOff, FileText, GripVertical, Play } from "lucide-react";

type Mode = "react" | "markdown" | "bbcode";

const DEFAULTS: Record<Mode, string> = {
  react: `import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 font-sans text-gray-900 bg-white">
      <h1 className="text-2xl font-bold">TSX Portal is live</h1>
      <p className="text-gray-500">
        Edit the code on the left, or drop a .tsx file.
      </p>
      <button
        onClick={() => setCount((c) => c + 1)}
        className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
      >
        Clicked {count} times
      </button>
    </div>
  );
}
`,
  markdown: `# Khmer Loanword Explorer

A small reference tool for tracing **Khmer vocabulary** back to its
*Sanskrit/Pali*, French, or English roots.

## Why this matters

- Sanskrit & Pali → religion, royalty, formal register
- French → colonial-era administration, food, machinery  
- English → modern tech and business

> Each entry should be checked against a citable source.

### Example entries

| Khmer | Romanization | Origin |
|---|---|---|
| កាហ្វេ | kafé | French (café) |
| ធម៌ | thoa | Sanskrit (dharma) |

\`\`\`ts
type Origin = "sanskrit-pali" | "french" | "english";
\`\`\`
`,
  bbcode: `[b]Welcome to the forum[/b]

[i]Posting guidelines[/i] — keep it [u]on topic[/u] and [color=#d4a24c]be kind[/color].

[quote=Admin]Building tools at the intersection of construction and Khmer NLP.[/quote]

[list]
[*] Share your project
[*] Include a screenshot  
[*] Link the repo
[/list]

[code]
npm run dev
[/code]

[url=https://github.com]GitHub[/url]
`,
};

const MODE_META: Record<Mode, { ext: string; download: string }> = {
  react: { ext: ".tsx", download: "App.tsx" },
  markdown: { ext: ".md", download: "document.md" },
  bbcode: { ext: ".bbcode", download: "post.bbcode" },
};

export default function TsxPortal() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useToolState<Mode>("tsx-portal:mode", "react");
  const [code, setCode] = useToolState("tsx-portal:code", DEFAULTS.react);
  const [status, setStatus] = useState<"idle" | "compiling" | "ok" | "err">("idle");
  const [statusText, setStatusText] = useState("idle");
  const [error, setError] = useState("");
  const [previewOnly, setPreviewOnly] = useState(false);
  const [splitPct, setSplitPct] = useState(46);
  const [dragging, setDragging] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load CDN scripts
  const scriptsReady = useRef(false);
  useEffect(() => {
    if (scriptsReady.current) return;
    let cancelled = false;

    function loadScript(src: string): Promise<void> {
      return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) { resolve(); return; }
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
      });
    }

    async function init() {
      try {
        await Promise.all([
          loadScript("https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.7/babel.min.js"),
          loadScript("https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js"),
          loadScript("https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.1.6/purify.min.js"),
        ]);
        if (!cancelled) scriptsReady.current = true;
      } catch { /* CDN fail — handle on compile */ }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        compile();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  // Listen for iframe messages
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!e.data) return;
      if (e.data.type === "tsx-portal-ok") {
        setStatus("ok");
        setStatusText(t("rendered", "បានបង្ហាញ"));
        setError("");
      } else if (e.data.type === "tsx-portal-error") {
        setStatus("err");
        setStatusText("error");
        setError(e.data.message);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [t]);

  // Drag-to-resize handlers
  const startDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setDragging(true);
    e.preventDefault();
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (clientX: number) => {
      const rect = mainRef.current?.getBoundingClientRect();
      if (!rect) return;
      let pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(18, Math.min(82, pct));
      setSplitPct(pct);
    };
    const onMouseMove = (e: MouseEvent) => onMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      onMove(e.touches[0].clientX);
    };
    const onEnd = () => setDragging(false);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchend", onEnd);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchend", onEnd);
    };
  }, [dragging]);

  function switchMode(newMode: Mode) {
    const wasDefault = code === DEFAULTS[mode] || code === "";
    setMode(newMode);
    if (wasDefault) setCode(DEFAULTS[newMode]);
    setTimeout(compile, 50);
  }

  function loadFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      setCode(content);
      const ext = file.name.split(".").pop()?.toLowerCase();
      let newMode: Mode | undefined;
      if (["tsx", "ts", "jsx", "js"].includes(ext ?? "")) newMode = "react";
      if (["md", "markdown"].includes(ext ?? "")) newMode = "markdown";
      if (["bbcode", "bb"].includes(ext ?? "")) newMode = "bbcode";
      if (newMode && newMode !== mode) {
        setMode(newMode);
        setTimeout(compile, 50);
      } else {
        compile();
      }
    };
    reader.readAsText(file);
  }

  function downloadCode() {
    const meta = MODE_META[mode];
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = meta.download;
    a.click();
    URL.revokeObjectURL(url);
    recordExport();
  }

  function compile() {
    if (mode === "markdown") return renderMd();
    if (mode === "bbcode") return renderBb();
    renderReact();
  }

  function renderMd() {
    setStatus("compiling");
    setStatusText(t("compiling…", "កំពុងចងក្រង…"));
    setError("");
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const win = window as any;
    if (!win.marked || !win.DOMPurify) {
      setStatus("err");
      setStatusText("error");
      setError("Markdown libraries not loaded — check your connection and rerun.");
      return;
    }
    try {
      const bodyHtml = win.DOMPurify.sanitize(win.marked.parse(code));
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.1/github-markdown-light.min.css">
<style>
  body{margin:0;padding:2rem;display:flex;justify-content:center;background:#fff;font-family:system-ui,sans-serif;}
  .markdown-body{max-width:760px;width:100%;}
</style>
</head><body><article class="markdown-body">${bodyHtml}</article></body></html>`;
      iframeRef.current!.srcdoc = html;
      setStatus("ok");
      setStatusText(t("rendered", "បានបង្ហាញ"));
    } catch (err: any) {
      setStatus("err");
      setStatusText("error");
      setError("Markdown parse error: " + err.message);
    }
  }

  function renderBb() {
    setStatus("compiling");
    setStatusText(t("compiling…", "កំពុងចងក្រង…"));
    setError("");
    try {
      const bodyHtml = bbcodeToHtml(code);
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8" />
<style>
  body{margin:0;padding:1.5rem;background:#eef0f3;font-family:system-ui,sans-serif;display:flex;justify-content:center;}
  .post{max-width:680px;width:100%;background:#fff;border:1px solid #d7dbe0;border-radius:8px;padding:1.5rem;line-height:1.6;color:#1c2126;}
  blockquote{margin:12px 0;padding:10px 14px;background:#f4f5f7;border-left:3px solid #d4a24c;border-radius:4px;}
  blockquote cite{font-style:normal;font-weight:600;font-size:12px;color:#666;}
  pre{background:#1b1f26;color:#e7e9ec;padding:12px 14px;border-radius:6px;overflow:auto;}
  code{font-family:monospace;font-size:13px;}
  img{max-width:100%;border-radius:6px;}
  a{color:#8a6d38;}
  ul,ol{margin:8px 0;padding-left:22px;}
</style>
</head><body><div class="post">${bodyHtml}</div></body></html>`;
      iframeRef.current!.srcdoc = html;
      setStatus("ok");
      setStatusText(t("rendered", "បានបង្ហាញ"));
    } catch (err: any) {
      setStatus("err");
      setStatusText("error");
      setError("BBCode parse error: " + err.message);
    }
  }

  function renderReact() {
    setStatus("compiling");
    setStatusText(t("compiling…", "កំពុងចងក្រង…"));
    setError("");
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const win = window as any;
    if (!win.Babel) {
      setStatus("err");
      setStatusText("error");
      setError("Babel standalone not loaded — check your connection and rerun.");
      return;
    }
    let compiled: string;
    try {
      compiled = win.Babel.transform(code, {
        presets: [
          ["react", { runtime: "classic" }],
          ["typescript", { isTSX: true, allExtensions: true }],
        ],
        plugins: ["transform-modules-commonjs"],
        filename: "App.tsx",
      }).code;
    } catch (err: any) {
      setStatus("err");
      setStatusText("error");
      setError("Compile error:\n\n" + err.message);
      return;
    }

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/lucide-react@0.436.0/dist/umd/lucide-react.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.js"><\/script>
<script src="https://cdn.tailwindcss.com"><\/script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  html,body,#root{height:100%;margin:0;}
  body{font-family:Inter,Kantumruy Pro,system-ui,sans-serif;}
</style>
</head>
<body>
<div id="root"></div>
<script>
window.onerror=function(msg,src,line,col,err){
  parent.postMessage({type:'tsx-portal-error',message:(err&&err.stack)||msg},'*');return true;
};
window.addEventListener('unhandledrejection',function(e){
  parent.postMessage({type:'tsx-portal-error',message:'Promise: '+(e.reason&&e.reason.message||e.reason)},'*');
});
var module={exports:{}};
var exports=module.exports;
function require(name){
  if(name==='react')return window.React;
  if(name==='react-dom'||name==='react-dom/client')return window.ReactDOM;
  if(name==='lucide-react'){
    if(!window.LucideReact)throw new Error('lucide-react not loaded');
    return window.LucideReact;
  }
  if(name==='html-to-image'){
    if(!window.htmlToImage)throw new Error('html-to-image not loaded');
    return window.htmlToImage;
  }
  throw new Error('Import not supported: "'+name+'". Available: react, react-dom, react-dom/client, lucide-react, html-to-image');
}
try{
  ${compiled}
  var Component=module.exports.default||module.exports;
  if(typeof Component!=='function')throw new Error('No default-exported component found');
  var root=ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(Component));
  parent.postMessage({type:'tsx-portal-ok'},'*');
}catch(err){
  parent.postMessage({type:'tsx-portal-error',message:(err&&err.stack)||String(err)},'*');
}
<\/script>
</body></html>`;

    iframeRef.current!.srcdoc = html;
  }

  function bbcodeToHtml(source: string): string {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const codeBlocks: string[] = [];
    let text = source.replace(/\[code\]([\s\S]*?)\[\/code\]/gi, (_, inner) => {
      codeBlocks.push(esc(inner.trim()));
      return `@@CB${codeBlocks.length - 1}@@`;
    });
    text = esc(text);
    text = text
      .replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>")
      .replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>")
      .replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>")
      .replace(/\[color=([#\w]+)\]([\s\S]*?)\[\/color\]/gi, '<span style="color:$1">$2</span>')
      .replace(/\[quote=([^\]]+)\]([\s\S]*?)\[\/quote\]/gi, '<blockquote><cite>$1 wrote:</cite><br>$2</blockquote>')
      .replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, "<blockquote>$1</blockquote>")
      .replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener">$2</a>')
      .replace(/\[img\]([\s\S]*?)\[\/img\]/gi, '<img src="$1" alt="" />')
      .replace(/\[list\]([\s\S]*?)\[\/list\]/gi, (_, inner) => "<ul>" + inner.replace(/\[\*\]\s*(.*)/g, "<li>$1</li>") + "</ul>")
      .replace(/\n/g, "<br>");
    return text.replace(/@@CB(\d+)@@/g, (_, i) => `<pre><code>${codeBlocks[+i]}</code></pre>`);
  }

  const charCount = code.length;

  return (
    <ToolShell
      title="TSX Portal"
      description="Drop in, run, and view — a live TSX / JSX, Markdown, and BBCode playground with split-pane preview. Ctrl+Enter to compile. Supported imports: react, react-dom, lucide-react, html-to-image."
      descriptionKm="សាកល្បងសរសេរ និងមើលកូដ TSX / JSX, Markdown និង BBCode ជាមួយនឹងការបង្ហាញលទ្ធផលភ្លាមៗ។ Ctrl+Enter ដើម្បីដំណើរការ។ កញ្ចប់ដែលអាច import បាន៖ react, react-dom, lucide-react, html-to-image។"
    >
      <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--ground-line)] bg-[var(--ground)] px-4 py-2.5">
          {/* Mode switch */}
          <div className="flex items-center rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-0.5">
            {(["react", "markdown", "bbcode"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  mode === m
                    ? "bg-[var(--gold)] text-[#0a0c0d]"
                    : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
                }`}
              >
                {m === "react" ? "TSX / JSX" : m === "markdown" ? "Markdown" : "BBCode"}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-[var(--ink-faint)] font-mono-ui ml-auto">{charCount} chars</span>

          <input
            ref={fileInputRef}
            type="file"
            accept=".tsx,.ts,.jsx,.js,.md,.markdown,.bbcode,.bb,.txt"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ""; }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink-dim)] transition hover:text-[var(--ink)]"
          >
            <FileText size={13} />
            {t("Open file…", "បើកឯកសារ…")}
          </button>
          <button
            type="button"
            onClick={downloadCode}
            className="flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink-dim)] transition hover:text-[var(--ink)]"
          >
            <Download size={13} />
            {t("Download", "ទាញយក")} {MODE_META[mode].ext}
          </button>
          <button
            type="button"
            onClick={() => setPreviewOnly(!previewOnly)}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition ${
              previewOnly
                ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)]"
                : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)] hover:text-[var(--ink)]"
            }`}
          >
            {previewOnly ? <Eye size={13} /> : <EyeOff size={13} />}
            {previewOnly ? t("Show editor", "បង្ហាញកម្មវិធីកែ") : t("Preview only", "មើលតែលទ្ធផល")}
          </button>
          <button
            type="button"
            onClick={compile}
            className="flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]"
          >
            <Play size={13} />
            {t("Run", "ដំណើរការ")} ▸
          </button>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-2 border-b border-[var(--ground-line)] bg-[var(--ground)] px-4 py-1.5">
          <span className={`h-2 w-2 rounded-full ${
            status === "ok" ? "bg-[var(--success)]" : status === "err" ? "bg-[var(--danger)]" : "bg-[var(--ink-faint)]"
          }`} />
          <span className="font-mono-ui text-[11px] text-[var(--ink-faint)]">{statusText}</span>
          <span className="ml-auto font-mono-ui text-[10px] text-[var(--ink-faint)]">
            {t("Ctrl+Enter to run", "Ctrl+Enter ដើម្បីដំណើរការ")}
          </span>
        </div>

        {/* Main split layout */}
        <div ref={mainRef} className="flex" style={{ minHeight: "65vh" }}>
          {/* Editor pane */}
          {!previewOnly && (
            <div className="flex min-w-0 flex-col" style={{ width: `${splitPct}%` }}>
              <textarea
                value={code}
                onChange={(e) => { setCode(e.target.value); setStatus("idle"); setStatusText("idle"); setError(""); }}
                spellCheck={false}
                className="flex-1 w-full resize-none border-none bg-[var(--ground)] p-4 font-mono-ui text-[13px] leading-relaxed text-[var(--ink)] outline-none"
                style={{ tabSize: 2 }}
              />
            </div>
          )}

          {/* Resizer */}
          {!previewOnly && (
            <div
              className={`flex w-[7px] shrink-0 cursor-col-resize items-center justify-center border-x border-[var(--ground-line)] bg-[var(--ground)] ${
                dragging ? "bg-[var(--gold)]/30" : ""
              }`}
              onMouseDown={startDrag}
              onTouchStart={startDrag}
              title={t("Drag to resize", "ទាញដើម្បីផ្លាស់ប្តូរទំហំ")}
            >
              <GripVertical size={10} className="text-[var(--ink-faint)]" />
            </div>
          )}

          {/* Preview pane */}
          <div className="flex min-w-0 flex-1 flex-col bg-white">
            <iframe
              ref={iframeRef}
              className="flex-1 w-full border-none"
              title="preview"
              sandbox="allow-scripts allow-same-origin allow-modals"
            />
          </div>
        </div>

        {/* Error bar */}
        {error && (
          <div className="max-h-[35%] overflow-auto border-t border-[var(--danger)]/40 bg-[var(--danger)]/10 p-4 font-mono-ui text-[12.5px] leading-relaxed text-[var(--danger)] whitespace-pre-wrap break-words">
            {error}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
