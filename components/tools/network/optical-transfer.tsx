"use client";

import { useCallback, useRef, useState } from "react";
import { Camera, FileText, Send, Shield, Upload, WifiOff } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { useBeam } from "@/contexts/BeamContext";

export default function OpticalTransfer() {
  const { text: t } = useLanguage();
  const { openSend, openReceive } = useBeam();
  const [mode, setMode] = useState<"file" | "text">("file");
  const [filePayload, setFilePayload] = useState<{ name: string; size: string; bytes: Uint8Array; mime: string } | null>(null);
  const [textPayload, setTextPayload] = useState("");
  const [dragover, setDragover] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setFilePayload({
        name: file.name,
        size: file.size < 1024 ? `${file.size} B` : file.size < 1048576 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / 1048576).toFixed(2)} MB`,
        bytes: new Uint8Array(reader.result as ArrayBuffer),
        mime: file.type || "application/octet-stream",
      });
    };
    reader.readAsArrayBuffer(file);
  }, []);

  function sendFile() {
    if (mode === "file" && filePayload) {
      openSend({ kind: "file", bytes: filePayload.bytes, filename: filePayload.name, mime: filePayload.mime });
    } else if (mode === "text" && textPayload.trim()) {
      openSend({ kind: "text", text: textPayload.trim() });
    }
  }

  return (
    <ToolShell
      title="Decimen Optical Transfer"
      khmerTitle="ដេស៊ីម៉ិន បញ្ជូនឯកសារតាមពន្លឺ"
      description="Send a file between two devices using only a screen and a camera. No Wi-Fi, no Bluetooth, no pairing — the file travels as light."
      descriptionKm="បញ្ជូនឯកសាររវាងឧបករណ៍ពីរ ដោយប្រើតែអេក្រង់ និងកាមេរ៉ា។ គ្មាន Wi-Fi គ្មាន Bluetooth — ឯកសារធ្វើដំណើរតាមពន្លឺ។"
    >
      {/* Mode switch */}
      <div className="mb-5 flex items-center rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-1">
        <button onClick={() => setMode("file")} className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition ${mode === "file" ? "bg-[var(--gold)] text-[#0a0c0d]" : "text-[var(--ink-dim)]"}`}>
          <FileText size={14} className="inline mr-1.5" />{t("File", "ឯកសារ")}
        </button>
        <button onClick={() => setMode("text")} className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition ${mode === "text" ? "bg-[var(--gold)] text-[#0a0c0d]" : "text-[var(--ink-dim)]"}`}>
          <Send size={14} className="inline mr-1.5" />{t("Text", "អត្ថបទ")}
        </button>
      </div>

      {/* File mode */}
      {mode === "file" && (
        <div className="mb-5">
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
          {!filePayload ? (
            <button
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
              onDragLeave={() => setDragover(false)}
              onDrop={(e) => { e.preventDefault(); setDragover(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              className={`flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition ${dragover ? "border-[var(--gold)] bg-[var(--gold)]/5" : "border-[var(--ground-line)] hover:border-[var(--gold)]/40"}`}
            >
              <Upload size={32} className="text-[var(--ink-faint)]" />
              <div>
                <div className="text-sm font-semibold text-[var(--ink)]">{t("Drop a file or click to browse", "អូសឯកសារមកទីនេះ ឬចុចដើម្បីជ្រើសរើស")}</div>
                <div className="mt-1 text-xs text-[var(--ink-faint)]">{t("Files up to ~10 MB recommended", "ឯកសាររហូតដល់ ~10 MB ត្រូវបានណែនាំ")}</div>
              </div>
            </button>
          ) : (
            <div className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--gold)]/15 text-[var(--gold)]"><FileText size={22} /></div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[var(--ink)]">{filePayload.name}</div>
                  <div className="text-xs text-[var(--ink-faint)]">{filePayload.size} · {filePayload.mime}</div>
                </div>
                <button onClick={() => { setFilePayload(null); }} className="rounded-lg border border-[var(--ground-line)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-faint)] hover:text-[var(--ink)]">
                  {t("Change", "ផ្លាស់ប្តូរ")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Text mode */}
      {mode === "text" && (
        <textarea
          value={textPayload}
          onChange={(e) => setTextPayload(e.target.value)}
          placeholder={t("Type your message here…", "វាយសាររបស់អ្នកនៅទីនេះ…")}
          className="mb-5 h-32 w-full resize-y rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--gold-dim)]"
        />
      )}

      {/* Action buttons */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={sendFile}
          disabled={mode === "file" ? !filePayload : !textPayload.trim()}
          className="flex items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40"
        >
          <Send size={16} /> {t("Send via Light", "ផ្ញើតាមពន្លឺ")}
        </button>
        <button
          type="button"
          onClick={openReceive}
          className="flex items-center justify-center gap-2 rounded-xl border border-[var(--teal)]/40 bg-[var(--teal)]/10 px-5 py-3 text-sm font-semibold text-[var(--teal)] transition hover:bg-[var(--teal)]/20"
        >
          <Camera size={16} /> {t("Receive from Camera", "ទទួលតាមកាមេរ៉ា")}
        </button>
      </div>

      {/* Info */}
      <div className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6">
        <h3 className="mb-3 font-semibold text-[var(--ink)]">{t("How it works", "របៀបដំណើរការ")}</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { icon: Send, text: t("Send: the file streams as animated QR codes on your screen. A fountain code ensures any frame order works.", "ផ្ញើ៖ ឯកសារបញ្ជូនជាកូដ QR មានចលនា។ កូដ Fountain ធានាថាលំដាប់ស៊ុមណាក៏ដំណើរការ។") },
            { icon: Camera, text: t("Receive: point a second device's camera at this screen. Frames are decoded and the file is rebuilt.", "ទទួល៖ តម្រង់កាមេរ៉ាឧបករណ៍ទីពីរមកអេក្រង់។ ស៊ុមនឹងត្រូវបកហើយឯកសារនឹងត្រូវផ្គុំឡើងវិញ។") },
            { icon: Shield, text: t("Verified with SHA-256 — the receiver confirms the file arrived intact.", "ផ្ទៀងផ្ទាត់ដោយ SHA-256 — អ្នកទទួលបញ្ជាក់ថាឯកសារមកដល់ត្រឹមត្រូវ។") },
            { icon: WifiOff, text: t("No network, no Bluetooth, no pairing. The data travels as light between the two devices.", "គ្មានបណ្តាញ គ្មាន Bluetooth គ្មានការផ្គូផ្គង។ ទិន្នន័យធ្វើដំណើរតាមពន្លឺ។") },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-3">
              <item.icon size={16} className="mt-0.5 shrink-0 text-[var(--ink-faint)]" />
              <span className="text-xs text-[var(--ink-dim)]">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </ToolShell>
  );
}
